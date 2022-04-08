// SPDX-License-Identifier: LGPL
pragma solidity ^0.8.0;

/**
 * @title IStreamPools
 */
interface IStreamPools {
    struct Pool {
        address sender;
        address[] recipients;
        address underlying;
        uint112 eTBalance;
        uint112 scaler;
    }

    struct Stream {
        uint112 settledBalance;
        uint112 eToURatio;
        uint112 underlyingRatePerSecond;
        uint64 startTime;
        uint64 stopTime;
        uint64 noticePeriod;
    }

    struct StreamUpdate {
        uint8 action;
        uint112 parameter;
        uint64 timestamp;
    }

    /**
     * @notice Emits when a pool is successfully created.
     */
    event PoolCreated(
        uint16 indexed poolId,
        address indexed underlying,
        address indexed sender,
        uint amount
    );

    /**
     * @notice Emits when a recipient is successfully added to the pool.
     */
    event RecipientAdded(
        uint16 indexed poolId,
        address indexed recipient,
        address indexed underlying,
        uint112 ratePerSecond,
        uint64 startTime,
        uint64 stopTime,
        uint64 noticePeriod
    );

    /**
     * @notice Emits when a recipient is successfully removed from the pool.
     */
    event RecipientRemoved(
        uint16 indexed poolId,
        address indexed recipient,
        address indexed underlying
    );

    /**
     * @notice Emits when a stream update is successfully scheduled.
     */
    event StreamUpdateScheduled(
        uint16 indexed poolId,
        address indexed recipient,
        uint8 indexed action,
        uint112 parameter,
        uint64 timestamp
    );

    /**
     * @notice Emits when a stream update is successfully executed.
     */
    event StreamUpdateExecuted(
        uint16 indexed poolId,
        address indexed recipient,
        uint8 indexed action,
        uint112 parameter,
        uint64 timestamp
    );

    /**
     * @notice Emits when the recipient of a pool withdraws a portion or all their pro rata share of the pool.
     */
    event Withdrawal(uint16 indexed poolId, address indexed underlying, address indexed recipient, uint amount);

    event Deposit(uint16 indexed poolId, address indexed underlying, uint amount);


    function createPool(address underlying, uint amount) external returns (uint16 poolId);

    function addRecipient(uint16 poolId, address recipient, uint112 ratePerSecond, uint64 startTime, uint64 stopTime, uint64 noticePeriod) 
        external returns (uint8 numberOfRecipients);
    
    function scheduleUpdate(uint16 poolId, address recipient, StreamUpdate memory update) external returns (uint64 timeLeft);

    function executeUpdate(uint16 poolId, address recipient) external;

    function getPool(uint16 poolId) external view returns (Pool memory pool);

    function getStream(uint16 poolId, address recipient) external view returns (Stream memory stream);

    function getStreamUpdate(uint16 poolId, address recipient) external view returns (StreamUpdate memory update);

    function isSolvent(uint16 poolId) external view returns (bool solvent, uint64 howLong);

    function balanceOf(uint16 poolId, address account) external view returns (uint balance);
    
    function withdraw(uint16 poolId, uint amount) external;

    function deposit(uint16 poolId, uint amount) external;

    function endAllStreams(uint16 poolId) external;
}
