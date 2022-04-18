// SPDX-License-Identifier: LGPL
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@euler-xyz/euler-interfaces/contracts/IEuler.sol";
import "./interfaces/IStreamPools.sol";
import "./Constants.sol";

/**
 * @title StreamPools
 */
contract StreamPools is IStreamPools, ReentrancyGuard, Constants {
    using SafeERC20 for IERC20Metadata;

    /*** Storage ***/

    /**
     * @notice Reference to Euler main proxy contract
     */
    address private immutable euler;

    /**
     * @notice Reference to Euler markets contract
     */
    address private immutable markets;

    /**
     * @notice Counter for new pool ids.
     */
    uint16 private nextId;

    /**
     * @notice The pool objects identifiable by ids.
     */
    mapping(uint16 => IStreamPools.Pool) private pools;

    /**
     * @notice Mapping pointing from pool id to recipient to recipient's stream object
     */
    mapping(uint16 => mapping(address => Stream)) private streams;

    /**
     * @notice Mapping pointing from pool id to recipient to recipient's stream scheduled update object
     */
    mapping(uint16 => mapping(address => StreamUpdate)) private updates;

    /**
     * @notice Internal mapping pointing from underlying to Euler eToken address
     */
    mapping(address => address) private eTokens;

    /*** Modifiers ***/

    modifier onlySender(uint16 poolId) {
        require(isSender(poolId), "only sender");
        _;
    }

    /**
     * @dev Throws if provided id does not point to a valid pool.
     */
    modifier poolExists(uint16 poolId) {
        require(pools[poolId].sender != address(0), "pool does not exist");
        _;
    }

    /**
     * @dev Throws if provided id and recipient do not point to a valid stream.
     */
    modifier streamExists(uint16 poolId, address recipient) {
        require(streams[poolId][recipient].startTime > 0, "stream does not exist");
        _;
    }

    /*** Contract Logic */

    constructor(address _euler) {
        euler = _euler;
        markets = IEuler(euler).moduleIdToProxy(2);
        nextId = 1;
    }

    /*** Public Functions ***/

    /**
     * @notice Creates a new pool object funded by `msg.sender`.
     * @param underlying The underlying ERC20 token used as value reference.
     * @param amount The amount to be deposited.
     * @return poolId The id of the newly created pool.
     */
    function createPool(address underlying, uint amount) 
        override 
        external  
        returns (uint16 poolId)
    {
        require(underlying != address(0), "underlying cannot be zero address");
        require(amount > 0, "deposit amount must be greater than zero");
        require(amount <= type(uint112).max, "deposit amount must be less than 112 bit max");
        
        address eToken = eTokens[underlying] != address(0) ? 
                            eTokens[underlying] :
                            IEulerMarkets(markets).underlyingToEToken(underlying);

        require(eToken != address(0), "underlying market on Euler not activated");

        IERC20Metadata(underlying).safeTransferFrom(msg.sender, address(this), amount);
        IERC20Metadata(underlying).approve(euler, type(uint).max);
        IEulerEToken(eToken).deposit(0, amount);
        
        poolId = nextId;
        pools[poolId].sender = msg.sender;
        pools[poolId].eTBalance = uint112(IEulerEToken(eToken).convertUnderlyingToBalance(amount));
        pools[poolId].underlying = underlying;
        pools[poolId].scaler = uint112(10**IERC20Metadata(underlying).decimals());
        eTokens[underlying] = eToken;
        nextId++;

        emit PoolCreated(poolId, underlying, msg.sender, amount);
    }    

    function addRecipient(uint16 poolId, address recipient, uint112 ratePerSecond, uint64 startTime, uint64 stopTime, uint64 noticePeriod) 
        override 
        external
        poolExists(poolId)
        onlySender(poolId)
        returns (uint8 numberOfRecipients) 
    {
        require(recipient != address(0) &&
                recipient != msg.sender && 
                recipient != address(this),
                "recipient address invalid");        
        require(streams[poolId][recipient].underlyingRatePerSecond == 0, "recipient already added to this pool");
        require(ratePerSecond > 0, "rate must be greater than zero");
        require(startTime> 0, "start time must be greater than zero");
        require(stopTime > startTime, "stop time must be greater than start time");
        require(pools[poolId].numberOfRecipients < MAX_RECIPIENTS_PER_POOL, "Max recipients reached");
    
        uint112 currentRatio = uint112(IEulerEToken(eTokens[pools[poolId].underlying]).convertUnderlyingToBalance(pools[poolId].scaler));
        if(pools[poolId].numberOfRecipients > 0) {
            (uint recipientsBalance, uint rate) = settlePoolView(poolId, currentRatio);
            
            uint112 scaler = pools[poolId].scaler;
            uint112 balance = pools[poolId].eTBalance;
            require(recipientsBalance <= balance, "pool balance violation");

            if(block.timestamp + COOL_OFF_PERIOD > startTime) {
                recipientsBalance += uint112(
                    (block.timestamp + COOL_OFF_PERIOD - startTime) *
                    ratePerSecond * currentRatio / scaler);
            }
            
            uint timeLeft = scaler * (balance - recipientsBalance) / rate;
            require(timeLeft >= COOL_OFF_PERIOD, "cool off period violation");            
        }
        
        address underlying = pools[poolId].underlying;
        pools[poolId].recipients.push(recipient);
        pools[poolId].numberOfRecipients++;
        streams[poolId][recipient].underlyingRatePerSecond = ratePerSecond;
        streams[poolId][recipient].startTime = startTime;
        streams[poolId][recipient].stopTime = stopTime;
        streams[poolId][recipient].noticePeriod = noticePeriod;
        streams[poolId][recipient].eToURatio = currentRatio;

        numberOfRecipients = pools[poolId].numberOfRecipients;
        emit RecipientAdded(poolId, recipient, underlying, 
                            ratePerSecond, startTime, stopTime, noticePeriod);
    }

    function scheduleUpdate(uint16 poolId, address recipient, uint8 action, uint112 parameter) 
        override
        external 
        poolExists(poolId)
        streamExists(poolId, recipient)
        onlySender(poolId)
    {        
        if(action == RAISE) {
            require(parameter > streams[poolId][recipient].underlyingRatePerSecond, 
                "raise: rate must be greater than current");
            updates[poolId][recipient].timestamp = uint64(block.timestamp);
        } else if(action == EXTESION) {
            require(parameter <= type(uint64).max, "incorrect parameter");
            require(parameter > streams[poolId][recipient].stopTime, 
                "extension: stop time must be greater than current");
            updates[poolId][recipient].timestamp = uint64(block.timestamp);
        } else if(action == CUT) {
            require(parameter < streams[poolId][recipient].underlyingRatePerSecond, 
                "cut: rate must be less than current");
            updates[poolId][recipient].timestamp = uint64(block.timestamp + streams[poolId][recipient].noticePeriod);
        } else if(action == TERMINATION) {
            require(parameter <= type(uint64).max, "incorrect parameter");
            require(parameter < streams[poolId][recipient].stopTime, 
                "termination: stop time must be less than current");
            updates[poolId][recipient].timestamp = uint64(block.timestamp + streams[poolId][recipient].noticePeriod);
        } else {
            revert("update action incorrect");
        }

        updates[poolId][recipient].action = action;
        updates[poolId][recipient].parameter = parameter;
        updates[poolId][recipient].timestamp = uint64(block.timestamp + streams[poolId][recipient].noticePeriod);

        emit StreamUpdateScheduled(poolId, recipient, action, parameter, updates[poolId][recipient].timestamp);
    }

    function executeUpdate(uint16 poolId, address recipient) 
        override 
        external
        poolExists(poolId)
        onlySender(poolId)
    {
        StreamUpdate memory update = updates[poolId][recipient];
        require(update.timestamp != 0, "update not scheduled");
        require(update.timestamp <= block.timestamp, "update too early");

        uint112 currentRatio = uint112(IEulerEToken(eTokens[pools[poolId].underlying])
                                .convertUnderlyingToBalance(pools[poolId].scaler));
        
        settleRecipient(poolId, recipient, currentRatio);

        if(update.action == RAISE || update.action == CUT) {
            streams[poolId][recipient].underlyingRatePerSecond = updates[poolId][recipient].parameter;
            streams[poolId][recipient].eToURatio = currentRatio;
        } else if(update.action == EXTESION || update.action == TERMINATION){
            streams[poolId][recipient].stopTime = uint64(updates[poolId][recipient].parameter);

            if(streams[poolId][recipient].stopTime < streams[poolId][recipient].startTime) {
                streams[poolId][recipient].startTime = streams[poolId][recipient].stopTime;
            }
        } else {
            revert("unrecognized update action");
        }

        delete updates[poolId][recipient];
        emit StreamUpdateExecuted(poolId, recipient, update.action, update.parameter, uint64(block.timestamp));
    }

    function withdraw(uint16 poolId, uint amount) 
        override
        external
        nonReentrant
        poolExists(poolId)
    {
        address underlying = pools[poolId].underlying;
        address eToken = eTokens[underlying];
        uint112 currentRatio = uint112(IEulerEToken(eToken).convertUnderlyingToBalance(pools[poolId].scaler));
        uint eTAmount;
        bool isMax;

        if(pools[poolId].sender == msg.sender) {
            (uint recipientsBalance, uint rate) = settlePool(poolId, currentRatio);
            uint requiredBalance = recipientsBalance + rate * COOL_OFF_PERIOD / pools[poolId].scaler;

            require(pools[poolId].eTBalance >= requiredBalance, "insufficient balance /1");

            if(amount == type(uint).max) {
                isMax = true;
                eTAmount = pools[poolId].eTBalance - requiredBalance;
                amount = eTAmount * pools[poolId].scaler / currentRatio;
            } else {
                eTAmount = amount * currentRatio / pools[poolId].scaler;

                require(pools[poolId].eTBalance - eTAmount >= requiredBalance, "insufficient balance /2");
            }
        } else {
            require(streams[poolId][msg.sender].startTime > 0, "stream does not exist");

            (uint balance,) = settleRecipient(poolId, msg.sender, currentRatio);
            
            if(amount == type(uint).max) {
                isMax = true;
                eTAmount = balance;
                amount = eTAmount * pools[poolId].scaler / currentRatio;

                if(streams[poolId][msg.sender].startTime == streams[poolId][msg.sender].stopTime) {
                    delete streams[poolId][msg.sender];

                    for(uint8 i=0; i<pools[poolId].recipients.length; ++i) {
                        if(address(0) == pools[poolId].recipients[i]) continue;

                        if(msg.sender == pools[poolId].recipients[i]) {
                            delete pools[poolId].recipients[i];
                            pools[poolId].numberOfRecipients--;
                            
                            if(updates[poolId][msg.sender].action != 0) {
                                delete updates[poolId][msg.sender];
                            }
                            
                            emit RecipientRemoved(poolId, msg.sender, underlying);
                            break;
                        }
                    }
                } else {
                    streams[poolId][msg.sender].settledBalance -= uint112(eTAmount);
                }
            } else {
                eTAmount = amount * currentRatio / pools[poolId].scaler;

                require(balance >= eTAmount, "insufficient balance /3");
                streams[poolId][msg.sender].settledBalance -= uint112(eTAmount);
            }

            require(pools[poolId].eTBalance >= eTAmount, "insufficient balance /4");
        }

        amount = (isMax && pools[poolId].numberOfRecipients == 0) ? type(uint).max : amount;
        pools[poolId].eTBalance -= uint112(eTAmount);
        IEulerEToken(eToken).withdraw(0, amount);
        amount = IERC20Metadata(underlying).balanceOf(address(this));
        IERC20Metadata(underlying).safeTransfer(msg.sender, amount);
        emit Withdrawal(poolId, underlying, msg.sender, amount);
    }

    function deposit(uint16 poolId, uint amount) 
        override
        external
        poolExists(poolId)
        onlySender(poolId)
    {
        require(amount > 0, "deposit amount must be greater than zero");
        require(amount <= type(uint112).max, "deposit amount must be less than 112 bit max");
        
        address underlying = pools[poolId].underlying;
        address eToken = eTokens[underlying];
        uint112 currentRatio = uint112(IEulerEToken(eToken).convertUnderlyingToBalance(pools[poolId].scaler));
        
        settlePool(poolId, currentRatio);
        IERC20Metadata(underlying).safeTransferFrom(msg.sender, address(this), amount);
        IEulerEToken(eToken).deposit(0, amount);
        
        pools[poolId].eTBalance += uint112(amount * currentRatio / pools[poolId].scaler);

        updateEToURatios(poolId, currentRatio);
        emit Deposit(poolId, underlying, amount);
    }

    function endAllStreams(uint16 poolId) 
        override
        external
        poolExists(poolId)
    {
        uint112 currentRatio = uint112(IEulerEToken(eTokens[pools[poolId].underlying]).convertUnderlyingToBalance(pools[poolId].scaler));
        (uint recipientsBalance,) = settlePool(poolId, currentRatio);

        require(recipientsBalance >= pools[poolId].eTBalance, "the pool is still solvent");   

        for(uint8 i=0; i<pools[poolId].recipients.length; ++i) {
            if(address(0) == pools[poolId].recipients[i]) continue;

            address recipient = pools[poolId].recipients[i];
            if(streams[poolId][recipient].startTime != streams[poolId][recipient].stopTime) {
                streams[poolId][recipient].startTime = streams[poolId][recipient].stopTime = uint64(block.timestamp);
            }
        }
    }


    /*** View Functions ***/

    function getPool(uint16 poolId) 
        override 
        external
        view 
        poolExists(poolId)
        returns (Pool memory pool) 
    {
        uint112 currentRatio = uint112(IEulerEToken(eTokens[pools[poolId].underlying]).convertUnderlyingToBalance(pools[poolId].scaler));
        (uint recipientsBalance,) = settlePoolView(poolId, currentRatio);

        pool = pools[poolId];
        pool.eTBalance = (pool.eTBalance > recipientsBalance) ? uint112(pool.eTBalance - recipientsBalance) : 0;
    }

    function getStream(uint16 poolId, address recipient) 
        override 
        external 
        view 
        poolExists(poolId)
        streamExists(poolId, recipient)
        returns (Stream memory stream) 
    {
        uint112 currentRatio = uint112(IEulerEToken(eTokens[pools[poolId].underlying]).convertUnderlyingToBalance(pools[poolId].scaler));
        (uint balance, uint rate) = settleRecipientView(poolId, recipient, currentRatio);

        stream = streams[poolId][recipient];
        
        if(rate == 0) {
            stream.underlyingRatePerSecond = 0;
            
            if(block.timestamp > stream.startTime) {
                stream.stopTime = uint64(block.timestamp);
            }
        }

        stream.startTime = uint64(block.timestamp);
        stream.settledBalance = uint112(balance);
        stream.eToURatio = currentRatio;
    }

    function getStreamUpdate(uint16 poolId, address recipient) 
        override 
        external 
        view 
        returns (StreamUpdate memory update)
    {
        update = updates[poolId][recipient];
        require(update.timestamp != 0, "update not scheduled");
    }
    
    function isSolvent(uint16 poolId)
        override
        external
        view
        poolExists(poolId)
        returns (bool solvent, uint howLong)
    {
        uint112 currentRatio = uint112(IEulerEToken(eTokens[pools[poolId].underlying])
                                .convertUnderlyingToBalance(pools[poolId].scaler));
        (uint recipientsBalance, uint rate) = settlePoolView(poolId, currentRatio);

        if(recipientsBalance > pools[poolId].eTBalance) {
            return (false, 0);
        } else {
            uint remaining = pools[poolId].eTBalance - recipientsBalance;
            howLong = rate == 0 ? type(uint64).max : pools[poolId].scaler * remaining / rate;
            return (true, howLong);
        }
    }

    function balanceOf(uint16 poolId, address account) 
        override 
        external
        view
        poolExists(poolId)
        returns (uint)
    {
        uint currentRatio = IEulerEToken(eTokens[pools[poolId].underlying]).convertUnderlyingToBalance(pools[poolId].scaler);
        
        uint balance;
        if(pools[poolId].sender == account) {
            (uint recipientsBalance,) = settlePoolView(poolId, uint112(currentRatio));
            balance = (pools[poolId].eTBalance >= recipientsBalance) ? pools[poolId].eTBalance - recipientsBalance : 0;
        } else {
            require(streams[poolId][account].startTime > 0, "stream does not exist");
            (uint recipientBalance,) = settleRecipientView(poolId, account, uint112(currentRatio));
            balance = (pools[poolId].eTBalance >= recipientBalance) ? recipientBalance : pools[poolId].eTBalance;
        }

        return balance * pools[poolId].scaler / currentRatio;
    }


    /*** Internal Functions ***/

    function isSender(uint16 poolId) 
        private 
        view 
        returns (bool) 
    {
        return msg.sender == pools[poolId].sender;
    }

    function isRecipient(uint16 poolId) 
        private 
        view 
        returns (bool result) 
    {
        result = false;
        for(uint8 i=0; i<pools[poolId].recipients.length; ++i) {
            if(address(0) == pools[poolId].recipients[i]) continue;

            if(msg.sender == pools[poolId].recipients[i]) {
                result = true;
                break;
            }
        }
    }

    function calcTime(uint64 start, uint64 stop) 
        private 
        view 
        returns (uint elapsed, bool expired) 
    {
        if(start == stop) {
            elapsed = 0;
            expired = true;
        } else if(block.timestamp <= start) {
            elapsed = 0;
            expired = false;
        } else if(block.timestamp >= stop) {
            elapsed = stop - start;
            expired = true;
        } else {
            elapsed = block.timestamp - start;
            expired = false;
        }
    }

    function settleRecipientView(uint16 poolId, address recipient, uint112 currentEToURatio) 
        internal 
        view 
        returns (uint balance, uint rate)
    {
        balance = streams[poolId][recipient].settledBalance;
        if(streams[poolId][recipient].startTime == streams[poolId][recipient].stopTime) {
            return (balance, 0);
        }

        (uint elapsed, bool expired) = calcTime(streams[poolId][recipient].startTime, streams[poolId][recipient].stopTime);
        uint112 underlyingRatePerSecond = streams[poolId][recipient].underlyingRatePerSecond;
        uint balanceDelta = elapsed * underlyingRatePerSecond;
        uint balanceDeltaAccrued = balanceDelta * streams[poolId][recipient].eToURatio / currentEToURatio;

        balance = balance + currentEToURatio * (balanceDelta + (balanceDeltaAccrued - balanceDelta) / 2) / pools[poolId].scaler;
        rate = expired ? 0 : streams[poolId][recipient].underlyingRatePerSecond * currentEToURatio;
    }

    function settleRecipient(uint16 poolId, address recipient, uint112 currentEToURatio) 
        internal 
        returns (uint balance, uint rate)
    {
        (balance, rate) = settleRecipientView(poolId, recipient, currentEToURatio);
        
        if(streams[poolId][recipient].startTime == streams[poolId][recipient].stopTime) {
            return (balance, 0);
        }

        if(rate == 0 && block.timestamp > streams[poolId][recipient].startTime) {
            streams[poolId][recipient].stopTime = uint64(block.timestamp);
        }
        
        streams[poolId][recipient].settledBalance = uint112(balance);
        streams[poolId][recipient].startTime = uint64(block.timestamp);
    }

    function settlePoolView(uint16 poolId, uint112 currentEToURatio)
        internal
        view 
        returns (uint balanceTotal, uint rateTotal) 
    {
        balanceTotal = 0;
        rateTotal = 0;
        for(uint8 i=0; i<pools[poolId].recipients.length; ++i) {
            if(address(0) == pools[poolId].recipients[i]) continue;

            (uint balance, uint rate) = settleRecipientView(poolId, pools[poolId].recipients[i], currentEToURatio);
            balanceTotal += balance;
            rateTotal += rate;
        }
    }

    function settlePool(uint16 poolId, uint112 currentEToURatio) 
        internal 
        returns (uint balanceTotal, uint rateTotal) 
    {
        balanceTotal = 0;
        rateTotal = 0;
        for(uint8 i=0; i<pools[poolId].recipients.length; ++i) {
            if(address(0) == pools[poolId].recipients[i]) continue;

            (uint balance, uint rate) = settleRecipient(poolId, pools[poolId].recipients[i], currentEToURatio);
            balanceTotal += balance;
            rateTotal += rate;
        }
    }

    function updateEToURatios(uint16 poolId, uint112 newRatio) 
        private
    {
      for(uint8 i=0; i<pools[poolId].recipients.length; ++i) {
            if(address(0) == pools[poolId].recipients[i]) continue;

            streams[poolId][pools[poolId].recipients[i]].eToURatio = newRatio;
        }
    }
}
