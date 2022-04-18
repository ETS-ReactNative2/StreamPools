import React, {useState} from 'react'
import {BigNumber, utils} from 'ethers';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import StreamsModal from './StreamsModal';

const A_DAY = 24* 60 * 60;
const UINT64_MAX = BigNumber.from(2).pow(64).sub(1);

export default function PoolsTable(props) {
    const clearModal = {show: false, pool: {}};
    const [modalData, setModalData] = useState(clearModal);

    function handleModal(event) {
        const pool = props.pools.find(pool => pool.id == event.target.id);

        if(pool.numberOfRecipients <= 0) return;

        setModalData({show: true, pool});
    }

    return (
        <div className="Quatt mt-4 mb-4">
            <div>
                <h3 className="mt-4">My Pools</h3>
            </div>
            {props.pools.length === 0 ?
                <h4 className="mt-4">None</h4> :
                <div className="Quatt d-flex justify-content-center align-items-center">
                    <Table striped bordered hover className="w-75">
                        <thead>
                            <tr>
                            <th>Pool ID</th>
                            <th>Balance</th>
                            <th>Underlying</th>
                            <th>APY</th>
                            <th>Number of Recipients</th>
                            <th>Is Solvent</th>
                            <th>Days Until Insolvency</th>
                            <th>Recipients Info</th>
                            </tr>
                        </thead>
                        <tbody className="align-baseline">
                            {props.pools.map(pool => {
                                return (
                                    <tr id={pool.id} key={pool.id}>
                                        <td>{pool.id}</td>
                                        <td>{utils.formatUnits(pool.underlyingBalance, pool.underlyingDecimals)}</td>
                                        <td>{pool.underlyingSymbol}</td>
                                        <td>{parseFloat(utils.formatUnits(pool.eulerAPY, 25)).toFixed(2)+'%'}</td>
                                        <td>{pool.numberOfRecipients}</td>
                                        <td>{pool.solvency.solvent ? 'YES' : 'NO'}</td>
                                        <td>{pool.solvency.howLong.eq(UINT64_MAX) ? 'infinite' : Math.round(pool.solvency.howLong.toNumber() / A_DAY)}</td>
                                        <td><Button variant="warning" size="sm" onClick={handleModal} disabled={!pool.numberOfRecipients} id={pool.id}>Info</Button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            }
            {modalData.show &&
            <StreamsModal pool={modalData.pool} show={modalData.show} onHide={() => setModalData(clearModal)} />}
        </div>
    )
}
