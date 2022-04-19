import React from 'react'
import {utils, BigNumber} from 'ethers';
import moment from 'moment';
import Table from 'react-bootstrap/Table';

const A_DAY = 24* 60 * 60;
const UINT64_MAX = BigNumber.from(2).pow(64).sub(1);

export default function StreamsTable(props) {
    const parseUpdate = stream => {
        if(!stream.update) return null;

        let updateMessage;
        switch(stream.update.action) {
            case 1:
                updateMessage = 'RAISE to ';
                updateMessage += utils.formatUnits(stream.update.parameter.mul(A_DAY), stream.underlyingDecimals);
                updateMessage += ' at ';
                updateMessage += moment(stream.update.timestamp.mul(1000).toNumber()).format("MM/DD/YYYY");
                break;
            case 2:
                updateMessage = 'EXTENSION to ';
                updateMessage += moment(stream.update.parameter.mul(1000).toNumber()).format("MM/DD/YYYY");
                break;
            case 3:
                updateMessage = 'CUT to ';
                updateMessage += utils.formatUnits(stream.update.parameter.mul(A_DAY), stream.underlyingDecimals);
                updateMessage += ' at ';
                updateMessage += moment(stream.update.timestamp.mul(1000).toNumber()).format("MM/DD/YYYY");
                break;
            case 4:
                updateMessage = 'TERMINATION at ';
                updateMessage += moment(stream.update.parameter.mul(1000).toNumber()).format("MM/DD/YYYY");
                break;
            default:
        }
        return updateMessage;
    }

    return (
        <div className="Quatt mt-4 mb-4">
            <div>
                <h3 className="mt-4">My Streams</h3>
            </div>
            {props.streams.length === 0 ? 
                <h4 className="mt-4">None</h4> :
                <div className="Quatt d-flex justify-content-center align-items-center">
                    <Table striped bordered hover className="w-75">
                        <thead>
                            <tr>
                            <th>Pool ID</th>
                            <th>Sender</th>
                            <th>Balance</th>
                            <th>Rate per Day</th>
                            <th>Underlying</th>
                            <th>APY</th>
                            <th>End Date</th>
                            <th>Has Ended</th>
                            <th>Notice Period</th>
                            <th>Pool Is Solvent</th>
                            <th>Days Until Insolvency</th>
                            <th>Update Scheduled</th>
                            </tr>
                        </thead>
                        <tbody className="align-baseline">
                            {props.streams.map(stream => {
                                return (
                                    <tr valign="middle" key={stream.poolId}>
                                        <td>{stream.poolId}</td>
                                        <td>{`${stream.sender.slice(0,6)}...${stream.sender.slice(-4)}`}</td>
                                        <td>{utils.formatUnits(stream.underlyingBalance, stream.underlyingDecimals)}</td>
                                        <td>{utils.formatUnits(stream.underlyingRatePerSecond.mul(A_DAY), stream.underlyingDecimals)}</td>
                                        <td>{stream.underlyingSymbol}</td>
                                        <td>{parseFloat(utils.formatUnits(stream.eulerAPY, 25)).toFixed(2)+'%'}</td>
                                        <td>{moment(stream.stopTime.mul(1000).toNumber()).format("MM/DD/YYYY")}</td>
                                        <td>{stream.startTime.eq(stream.stopTime) ? 'YES' : 'NO'}</td>
                                        <td>{stream.noticePeriod.div(A_DAY).toString()}</td>
                                        <td>{stream.solvency.solvent ? 'YES' : 'NO'}</td>
                                        <td>{stream.solvency.howLong.eq(UINT64_MAX) ? 'infinite' : Math.round(stream.solvency.howLong.toNumber() / A_DAY)}</td>
                                        <td>{stream.update ? parseUpdate(stream) : 'NO'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            }
        </div>
    )
}
