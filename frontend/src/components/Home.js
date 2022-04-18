import React from 'react'
import {useWeb3React} from "@web3-react/core";
import {Link} from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import ConnectWallet from './ConnectWallet';

export default function Home() {
    const {active} = useWeb3React(); 

    return (
        <div className="m-auto mt-4">
            <h1 className="Lora" style={{fontWeight: "bold"}}>
                <span className="StreamPoolsBg">Stream Pools</span>
            </h1>
            <div className="w-50 m-auto Quatt">
                <h3 className="mb-4">Yield earning digital assets streaming solution</h3>
                <div style={{fontSize: "1.4rem"}}>
                    <p className="mb-1">don't transfer digital assets, stream them!</p>
                    <p className="mb-1">try today!</p>    
                </div>
                {active ? 
                <div>
                    <Button as={Link} to="/pools" variant="warning" className="mt-4 me-4">
                    Check your Pools
                    </Button>
                    <Button as={Link} to="/streams" variant="warning" className="mt-4 ms-4">
                    Check your Streams
                    </Button>
                </div> :
                <ConnectWallet/>
                }
            </div>
        </div>
    )
}
