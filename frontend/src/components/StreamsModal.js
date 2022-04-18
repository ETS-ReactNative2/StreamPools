import React, {useState, useEffect, useContext} from 'react'
import {useWeb3React} from "@web3-react/core";
import {ethers, utils} from 'ethers';
import moment from 'moment';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import AddressesContext from './AddressesContext';
import StreamPoolsArtifact from '../artifacts/IStreamPools.json';

const A_DAY = 24* 60 * 60;
const FIFTEEN_SEC = 15000;

export default function StreamsModal(props) {
    const addresses = useContext(AddressesContext);
    const [streams, setStreams] = useState([]);
    const [timer, setTimer] = useState(null);
    const {library} = useWeb3React(); 

    useEffect(() => {
        if(!props.pool || timer) return;
        
        getStreams();
        setTimer(setInterval(() => {
            getStreams();
        }, [FIFTEEN_SEC]));

        return () => {
            if(timer) {
                clearInterval(timer);
                setTimer(null);
            }
            setStreams([]);
        }
    }, [props.pool]);

    const getStreams = async () => {
        const streamPools = new ethers.Contract(addresses.streamPools, StreamPoolsArtifact.abi, library.getSigner());
        const s = [];

        for(let recipient of props.pool.recipients) {
            if(recipient === ethers.constants.AddressZero) continue;

            const stream = await streamPools.getStream(props.pool.id, recipient);
            const balance = await streamPools.balanceOf(props.pool.id, recipient);
            s.push({
                recipient, 
                ...stream,
                underlyingBalance: balance,
            });
        }
        setStreams(s);
    }

    return (
        <Modal
          show={props.show}
          onHide={props.onHide}
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          className="Quatt"
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {`Pool ${props.pool.id} Streams:`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table striped bordered hover className="w-75" style={{textAlign: "center", verticalAlign: "baseline"}}>
                    <thead>
                        <tr>
                        <th>Recipient</th>
                        <th>Balance</th>
                        <th>Rate per Day</th>
                        <th>Underlying</th>
                        <th>End Date</th>
                        <th>Has Ended</th>
                        <th>Notice Period</th>
                        </tr>
                    </thead>
                    <tbody>
                        {streams.map(stream => {
                            const key = `${props.pool.id}-${stream.recipient}`;
                            return (
                                <tr key={key}>
                                    <td>{stream.recipient}</td>
                                    <td>{utils.formatUnits(stream.underlyingBalance, props.pool.underlyingDecimals)}</td>
                                    <td>{utils.formatUnits(stream.underlyingRatePerSecond.mul(A_DAY), props.pool.underlyingDecimals)}</td>
                                    <td>{props.pool.underlyingSymbol}</td>
                                    <td>{moment(stream.stopTime.mul(1000).toNumber()).format("MM/DD/YYYY")}</td>
                                    <td>{stream.startTime.eq(stream.stopTime) ? 'YES' : 'NO'}</td>
                                    <td>{stream.noticePeriod.div(A_DAY).toString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    );
}