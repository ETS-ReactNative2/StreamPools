import React, {useState} from 'react'
import {useWeb3React} from "@web3-react/core";
import {injected} from '../utils/connector';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

export default function ConnectWallet() {
    const {activate, deactivate, active} = useWeb3React(); 
    const [error, setError] = useState({show: false, msg: ''});

    const connectWallet = () => {
        if(active) deactivate();
        else activate(injected, onConnectionError);
    }

    const onConnectionError = error => {
        if(!error.message.match('UserRejectedRequestError')) {
            setError({
                show: true,
                msg: "Cannot connect. Only Ropsten Networks is supported at the moment"
            });
        } else {
            setError({
                show: true,
                msg: error.message
            });
        }
    }

    return (
        error.show ?
        <Alert variant="danger" onClose={() => setError({show: false, msg: ''})} dismissible>
            <Alert.Heading>Ups! Error!</Alert.Heading>
            <p>{error.msg}</p>
        </Alert> :
        <Button variant="warning" className="mt-4" onClick={connectWallet}>
            Connect Wallet
        </Button>
    )
}
