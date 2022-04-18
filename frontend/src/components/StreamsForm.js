import React, {useState, useContext} from 'react';
import {useWeb3React} from "@web3-react/core";
import {ethers, utils} from 'ethers';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import AddressesContext from './AddressesContext';
import StreamPoolsArtifact from '../artifacts/IStreamPools.json';

export default function StreamsForm(props) {
    const clearForm = {amount: '0', poolId: '', max: false};
    const [form, setForm] = useState(clearForm);
    const addresses = useContext(AddressesContext);
    const {active, library} = useWeb3React();

    const setField = (field, value) => {
        setForm(form => ({...form, [field]: value}));
    }

    const handleMax = value => {
        if(value) {
            setForm(form => ({...form, max: value, amount: 'max'}));    
        } else {
            setForm(form => ({...form, max: value, amount: '0'}));
        }
    }

    const submit = async event => {
        event.preventDefault();
        if(!active) return;

        const streamPools = new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner());
        const poolId = (form.poolId !== '' ? form.poolId : props.streams[0]?.poolId);
        const decimals = props.streams.find(stream => stream.poolId == poolId).underlyingDecimals;
        const amount = form.amount === 'max' ? ethers.constants.MaxUint256 : utils.parseUnits(form.amount, decimals);
        await streamPools.withdraw(poolId, amount, {gasLimit: 500000});
        setForm(clearForm);
    }

    return (
        <div className="w-50 m-auto mt-4 mb-4 Quatt">
            <Form onSubmit={submit}>
                <h3>Withdraw from the Stream</h3>
                <Form.Group className="mb-3" controlId="poolId">
                    <Form.Label>Pool ID</Form.Label>
                    <Form.Select
                        onChange={e => setField('poolId', e.target.value)}
                    >
                        {props.streams.length > 0 ? 
                            props.streams.map(stream => {
                                return <option key={stream.poolId} value={stream.poolId}>{stream.poolId}</option>
                            }) :
                            <option>None is available</option>
                        }
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control 
                        type="text" 
                        required
                        value={form.amount}
                        onChange={e => setField('amount', e.target.value)}
                    />
                    <Form.Check 
                        inline
                        type="switch"
                        id="max-switch"
                        label="Max available amount"
                        checked={form.max}
                        onChange={() => handleMax(!form.max)}
                    />
                </Form.Group>    
                <Button variant="warning" type="submit">
                    Submit
                </Button>
            </Form>
        </div>
    )
}
