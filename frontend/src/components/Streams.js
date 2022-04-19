import React, {useState, useEffect, useContext} from 'react';
import {useWeb3React} from "@web3-react/core";
import {ethers, BigNumber} from 'ethers';
import ConnectWallet from './ConnectWallet';
import AddressesContext from './AddressesContext';
import StreamsTable from './StreamsTable';
import StreamsForm from './StreamsForm';
import StreamPoolsArtifact from '../artifacts/IStreamPools.json';
import ViewArtifact from '../artifacts/EulerGeneralView.json';

const FIFTEEN_SEC = 15000;

export default function Streams() {
    const addresses = useContext(AddressesContext);
    const [streamPools, setStreamPools] = useState(null);
    const [streams, setStreams] = useState([]);
    const [timer, setTimer] = useState(null);
    const {active, account, library} = useWeb3React();

    useEffect(() => {
        if(!active || timer) return;

        setStreamPools(new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner()));
        
        setTimer(setInterval(() => {
            getStreams();
        }, [FIFTEEN_SEC]));
       
        return () => {
            if(!timer) return;
            clearInterval(timer);
            setTimer(null);
        }
    }, [active]);

    useEffect(() => {
        if(!active || !streamPools) return;

        getStreams();
        addListeners();

        return () => {
            streamPools.removeAllListeners();
        }
    }, [streamPools, account]);

    const addListeners = () => {
        streamPools.removeAllListeners();

        getPoolIds().then(ids => {
            if(ids.length === 0) return;

            const filters = [
                streamPools.filters.RecipientAdded(null, account, null),
                streamPools.filters.RecipientRemoved(null, account, null),
                streamPools.filters.StreamUpdateScheduled(null, account, null),
                streamPools.filters.StreamUpdateExecuted(null, account, null),
                streamPools.filters.Withdrawal(null, null, account),
                ...ids.map(id => streamPools.filters.Deposit(id, null, null))
            ]

            for(let filter of filters) {
                streamPools.on(filter, () => {
                    getStreams();
                    addListeners();
                });
            }
        })
    }

    const getPoolIds = async () => {
        const streamPools = new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner())
        const poolsFilter = streamPools.filters.RecipientAdded(null, account, null);
        const ids = (await streamPools.queryFilter(poolsFilter)).map(tx => BigNumber.from(tx.topics[1]).toNumber());
        return [...new Set(ids)];
    }

    const getStreams = async () => {
        const ids = await getPoolIds();
        if(ids.length === 0) return;

        const streamPools = new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner())
        const s = [];

        for(let id of ids) {
            const pool = await streamPools.getPool(id);
            const view = new ethers.Contract(addresses.eulerView, ViewArtifact.abi, library.getSigner());
            const stream = await streamPools.getStream(id, account);
            const balance = await streamPools.balanceOf(id, account);
            const solvency = await streamPools.isSolvent(id);
            const numberOfScheduled = (await streamPools.queryFilter(streamPools.filters.StreamUpdateScheduled(id, account, null))).length;
            const numberOfExecuted = (await streamPools.queryFilter(streamPools.filters.StreamUpdateExecuted(id, account, null))).length;
            const result = await view.doQuery([addresses.euler, ethers.constants.AddressZero, [pool.underlying]]);

            let update;
            if(numberOfScheduled > 0 && numberOfScheduled > numberOfExecuted) {
                update = await streamPools.getStreamUpdate(id, account);
            }
            
            const obj = {
                poolId: id,
                solvency, 
                update,
                sender: pool.sender,
                underlyingSymbol: result.markets[0].symbol, 
                underlyingDecimals: result.markets[0].decimals, 
                underlyingBalance: balance,
                eulerAPY: result.markets[0].supplyAPY,
                ...stream
            };
            s.push(obj);
        }
        setStreams(s);
    }

    return (
        active ? 
        <>
            <StreamsTable streams={streams}/>
            {streams.length > 0 ? <StreamsForm streams={streams}/> : ''}
        </> : 
        <ConnectWallet/>
    )
}
