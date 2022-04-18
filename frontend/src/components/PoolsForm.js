import React, {useState, useContext} from 'react';
import {useWeb3React} from "@web3-react/core";
import {ethers, utils} from 'ethers';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import AddressesContext from './AddressesContext';
import StreamPoolsArtifact from '../artifacts/IStreamPools.json';
import ERC20Artifact from '../artifacts/IERC20Metadata.json';

const A_DAY = 24 * 60 * 60;

export default function PoolsForm(props) {
    const clearForm = {
        action: 'create', 
        underlying: '', 
        amount: '0',
        poolId: '',
        recipient: '',
        rate: '0',
        startTime: '',
        stopTime: '',
        noticePeriod: A_DAY.toString(),
        updateAction: '1',
        updateParam: '',
        max: false
    };
    const [form, setForm] = useState(clearForm);
    const addresses = useContext(AddressesContext);
    const {active, account, library} = useWeb3React();

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

        const poolId = (form.poolId !== '' ? form.poolId : props.pools[0]?.id);
        const underlying = form.underlying !== '' ? form.underlying : props.pools.find(pool => pool.id == poolId).underlying;
        const streamPools = new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner());
        const ERC20 = new ethers.Contract(underlying, ERC20Artifact.abi, library.getSigner());
        const decimals = await ERC20.decimals();

        let amount;
        switch(form.action) {
            case 'create':
                const allowance = await ERC20.allowance(account, addresses.streamPools);
                amount = utils.parseUnits(form.amount, decimals);

                if(allowance.lt(amount)) {
                    await ERC20.approve(addresses.streamPools, ethers.constants.MaxUint256);
                }
                await streamPools.createPool(underlying, amount, {gasLimit: 500000});
                break;
            case 'add':
                await streamPools.addRecipient(
                    poolId, 
                    form.recipient, 
                    utils.parseUnits(form.rate.toFixed(decimals), decimals),
                    Date.parse(form.startTime)/1000,
                    Date.parse(form.stopTime)/1000,
                    form.noticePeriod,
                    {gasLimit: 500000}
                );
                break;
            case 'deposit':
            case 'withdraw':
                amount = form.amount === 'max' ? ethers.constants.MaxUint256 : utils.parseUnits(form.amount, decimals);
                
                if(form.action === 'deposit') {
                    await streamPools.deposit(poolId, amount, {gasLimit: 500000});
                } else {
                    await streamPools.withdraw(poolId, amount, {gasLimit: 500000});
                }
                break;
            case 'schedule':
                const action = form.updateAction !== '' ? form.updateAction : 1;
                await streamPools.scheduleUpdate(poolId, form.recipient, action, form.updateParam, {gasLimit: 500000});
                break;
            case 'execute':
                await streamPools.executeUpdate(poolId, form.recipient, {gasLimit: 500000});
                break;
            default:
                alert('Wrong action');
        }

        setForm(clearForm);
    }

    return (
        <div className="w-50 m-auto mt-4 mb-4 Quatt">
            <Form onSubmit={submit}>
                <Form.Group className="mb-3" controlId="action">
                    <h3>Choose the action you want to make</h3>
                    <Form.Select
                        value={form.action}
                        onChange={e => setField('action', e.target.value)}
                    >
                        <option value="create">Create Pool</option>
                        <option value="add">Add Recipient</option>
                        <option value="deposit">Deposit</option>
                        <option value="withdraw">Withdraw</option>
                        <option value="schedule">Schedule Stream Update</option>
                        <option value="execute">Execute Stream Update</option>
                    </Form.Select>
                </Form.Group>

                {
                    form.action === "create" && 
                    <Form.Group className="mb-3" controlId="underlying">
                    <Form.Label>Address of the token to be streamed</Form.Label>
                    <Form.Control 
                        type="text"
                        required
                        value={form.underlying}
                        onChange={e => setField('underlying', e.target.value)}
                    />
                    </Form.Group> 
                }

                {
                    form.action !== "create" &&
                    <Form.Group className="mb-3" controlId="poolId">
                    <Form.Label>Pool ID</Form.Label>
                    <Form.Select
                        onChange={e => setField('poolId', e.target.value)}
                    >
                        {props.pools.length > 0 ? 
                            props.pools.map(pool => {
                                return <option key={pool.id} value={pool.id}>{pool.id}</option>
                            }) :
                            <option>None is available</option>
                        }
                    </Form.Select>
                    </Form.Group>
                }

                {
                    (form.action === "create" || form.action === "deposit" || form.action === "withdraw") &&
                    <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control 
                        type="text" 
                        required
                        value={form.amount}
                        onChange={e => setField('amount', e.target.value)}
                    />
                    {
                        form.action === "withdraw" &&
                        <Form.Check 
                            inline
                            type="switch"
                            id="max-switch"
                            label="Max available amount"
                            checked={form.max}
                            onChange={() => handleMax(!form.max)}
                        />
                    }
                    </Form.Group>    
                }

                {
                    (form.action === "add" || form.action === "schedule" || form.action === "execute") &&
                    <Form.Group className="mb-3" controlId="recipient">
                    <Form.Label>Address of the recipient</Form.Label>
                    <Form.Control 
                        type="text"
                        required
                        value={form.recipient}
                        onChange={e => setField('recipient', e.target.value)}
                    />
                    </Form.Group> 
                }

                {
                    form.action === "add" && 
                    <>
                    <Form.Group className="mb-3" controlId="rate">
                    <Form.Label>Rate per day</Form.Label>
                    <Form.Control 
                        type="number"
                        required
                        value={form.rate * A_DAY}
                        onChange={e => setField('rate', e.target.value / A_DAY)}
                    />
                    </Form.Group>   

                    <Form.Group className="mb-3" controlId="startTime">
                    <Form.Label>Start date</Form.Label>
                    <Form.Control 
                        type="date" 
                        required
                        value={form.startTime}
                        onChange={e => setField('startTime', e.target.value)}
                    />
                    </Form.Group>    

                    <Form.Group className="mb-3" controlId="stopTime">
                    <Form.Label>End date</Form.Label>
                    <Form.Control 
                        type="date" 
                        required
                        value={form.stopTime}
                        onChange={e => setField('stopTime', e.target.value)}
                    />
                    </Form.Group>   

                    <Form.Group className="mb-3" controlId="noticePeriod">
                    <Form.Label>Notice period (in days)</Form.Label>
                    <Form.Control 
                        type="number"
                        required
                        min={0}
                        value={form.noticePeriod / A_DAY}
                        onChange={e => setField('noticePeriod', e.target.value * A_DAY)}
                    />
                    </Form.Group>   
                    </>
                }
                
                {
                    form.action === "schedule" && 
                    <>
                    <Form.Label>Update action</Form.Label>
                    <Form.Select
                        required
                        onChange={e => setField('updateAction', e.target.value)}
                    >
                        <option value="1">RAISE</option>
                        <option value="3">CUT</option>
                        <option value="2">EXTENSION</option>
                        <option value="4">TERMINATION</option>
                    </Form.Select>

                    <Form.Group className="mb-3" controlId="updateParam">
                    <Form.Label>Update parameter</Form.Label>
                    <Form.Control 
                        type="text"
                        required
                        value={form.updateParam}
                        onChange={e => setField('updateParam', e.target.value)}
                    />
                    </Form.Group>
                    </>
                }
                       
                <Button variant="warning" type="submit">
                    Submit
                </Button>
            </Form>
        </div>
    )
}
