import React, {useState, useEffect, useContext} from 'react';
import {useWeb3React} from "@web3-react/core";
import {ethers, BigNumber} from 'ethers';
import ConnectWallet from './ConnectWallet';
import AddressesContext from './AddressesContext';
import PoolsForm from './PoolsForm';
import PoolsTable from './PoolsTable';
import StreamPoolsArtifact from '../artifacts/IStreamPools.json';
import ViewArtifact from '../artifacts/EulerGeneralView.json';

const FIFTEEN_SEC = 15000;

export default function Pools() {
    const addresses = useContext(AddressesContext);
    const [streamPools, setStreamPools] = useState(null);
    const [pools, setPools] = useState([]);
    const [timer, setTimer] = useState(null);
    const {active, account, library} = useWeb3React();

    useEffect(() => {
        if(!active || timer) return;

        setStreamPools(new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner()));
        setTimer(setInterval(() => {
            getPastPools();
        }, [FIFTEEN_SEC]));
       
        return () => {
            if(!timer) return;
            clearInterval(timer);
            setTimer(null);
        }
    }, [active]);

    useEffect(() => {
        if(!active || !streamPools) return;

        getPastPools();

        if(pools.length === 0) return;
        streamPools.removeAllListeners();

        streamPools.on(streamPools.filters.PoolCreated(null, null, account), () => {
            getPastPools();
        });

        for(let pool of pools) {
            const filters = [
                streamPools.filters.RecipientAdded(pool.id, null, null),
                streamPools.filters.Deposit(pool.id, null, null),
                streamPools.filters.Withdrawal(pool.id, null, null),
                streamPools.filters.StreamUpdateScheduled(pool.id, null, null),
                streamPools.filters.StreamUpdateExecuted(pool.id, null, null)
            ]

            for(let filter of filters) {
                streamPools.on(filter, () => {
                    getPastPools();
                });
            }
        }

        return () => {
            streamPools.removeAllListeners();
        }
    }, [streamPools, pools.length, account]);

    const getPastPools = async () => {
        const streamPools = new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner())
        const poolsFilter = streamPools.filters.PoolCreated(null, null, account);
        const pastPoolsIds = (await streamPools.queryFilter(poolsFilter)).map(tx => BigNumber.from(tx.topics[1]));
        const p = [];

        for(let id of pastPoolsIds) {
            const pool = await streamPools.getPool(id);
            const balance = await streamPools.balanceOf(id, account);
            const solvency = await streamPools.isSolvent(id);
            const view = new ethers.Contract(addresses.eulerView, ViewArtifact.abi, library.getSigner());
            const result = await view.doQuery([addresses.euler, ethers.constants.AddressZero, [pool.underlying]]);
            
            const obj = {
                ...pool, 
                solvency, 
                underlyingSymbol: result.markets[0].symbol, 
                underlyingDecimals: result.markets[0].decimals, 
                underlyingBalance: balance,
                eulerAPY: result.markets[0].supplyAPY
            };
            p.push({id: id.toNumber(), ...obj});
        }
        setPools(p);
    }

    return (
        active ? 
        <>
            {pools.length >= 0 && <PoolsTable pools={pools}/>}
            <PoolsForm pools={pools} />
        </> :
        <ConnectWallet/>
    )
}
