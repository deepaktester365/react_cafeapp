import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table, Spinner, Row, Col, Alert, ProgressBar } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import TransactionEditModal from './transactions/TransactionEditModal';

export default function BucketDrilldownModal({ show, onHide, bucket, periodName, onSuccess }) {
    const api = useApi();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [newTarget, setNewTarget] = useState('');
    const [updateMaster, setUpdateMaster] = useState(false);
    const [editTx, setEditTx] = useState(null);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        const res = await api.get(`/budget/bucket/${bucket.id}/period/${periodName}/transactions`);
        if (res.ok) {
            setTransactions(res.body.items || []);
        }
        setIsLoading(false);
    }, [api, bucket?.id, periodName]);

    // Reset state and fetch transactions when modal opens
    useEffect(() => {
        if (show && bucket) {
            setNewTarget(bucket.masterGoal !== undefined ? bucket.masterGoal : (bucket.goal || 0));
            setUpdateMaster(false);
            fetchTransactions();
        }
    }, [show, bucket, fetchTransactions]);

    const handleTransactionUpdate = () => {
        setEditTx(null); // Close edit modal
        fetchTransactions(); // Refresh the list
        if (onSuccess) onSuccess(); // Trigger WeeklyPulse to recalculate its totals!
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await api.post(`/budget/bucket/${bucket.id}/period/${periodName}/target`, {
            amount: parseFloat(newTarget),
            update_master: updateMaster
        });

        setIsSaving(false);
        if (res.ok) {
            onHide();
            if (onSuccess) onSuccess(); // Triggers a refresh of the Weekly Pulse data!
        } else {
            alert("Failed to update target.");
        }
    };

    if (!bucket) return null;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    // Dynamic remaining math based on what you are typing into the input box
    const remaining = parseFloat(newTarget || 0) - bucket.spent;
    const isOver = remaining < 0;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="bg-light border-bottom-0 pb-0">
                <Modal.Title className="fw-bold w-100 d-flex align-items-center justify-content-between pe-3">
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-bullseye text-primary"></i>
                        {bucket.name}
                        {/* --- NEW: Dynamic Bucket Type Badge --- */}
                        {bucket.type && (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25" style={{fontSize: '0.65rem'}}>
                                {bucket.type.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <span className="text-muted fw-normal fs-6">({periodName})</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">

                {/* --- NEW: Macro Debt Paydown Tracker (Only visible for Loans) --- */}
                {bucket.isLoan && (
                    <div className="bg-warning bg-opacity-10 px-4 py-3 border-bottom border-warning border-opacity-25">
                        <div className="d-flex justify-content-between align-items-end mb-1">
                            <span className="small fw-bold text-dark text-uppercase letter-spacing-1">
                                <i className="bi bi-bank me-2"></i>Total Payoff Progress
                            </span>
                            <span className="small fw-bold text-dark">
                                {formatCurrency(bucket.totalPaid)} <span className="text-muted fw-normal">/ {formatCurrency(bucket.totalDebt)}</span>
                            </span>
                        </div>
                        <ProgressBar
                            now={(bucket.totalPaid / bucket.totalDebt) * 100}
                            variant="warning"
                            style={{height: '8px'}}
                        />
                        <div className="mt-1 small text-dark fw-medium text-end">
                            {formatCurrency(bucket.remainingDebt)} Remaining
                        </div>
                    </div>
                )}

                {/* 1. Metrics Row */}
                <div className="bg-light px-4 pb-4 pt-2 border-bottom">
                    <Row className="g-3 mb-4">
                        <Col xs={4}>
                            <div className="p-3 bg-white rounded-3 shadow-sm border text-center text-sm-start">
                                <div className="text-muted small fw-bold text-uppercase mb-1">
                                    {bucket.type === 'Sinking Fund' ? 'Annual Target' :
                                     bucket.type === 'Target Balance' ? 'Total Cap' : 'Monthly Target'}
                                </div>
                                <div className="fs-4 fw-bold text-dark">{formatCurrency(newTarget || 0)}</div>
                            </div>
                        </Col>
                        <Col xs={4}>
                            <div className="p-3 bg-white rounded-3 shadow-sm border text-center text-sm-start">
                                <div className="text-muted small fw-bold text-uppercase mb-1">Spent</div>
                                <div className="fs-4 fw-bold text-dark">{formatCurrency(bucket.spent)}</div>
                            </div>
                        </Col>
                        <Col xs={4}>
                            <div className="p-3 bg-white rounded-3 shadow-sm border text-center text-sm-start">
                                <div className="text-muted small fw-bold text-uppercase mb-1">Remaining</div>
                                <div className={`fs-4 fw-bold ${isOver ? 'text-danger' : 'text-success'}`}>
                                    {formatCurrency(remaining)}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* 2. Adjust Target Form */}
                    <div className="bg-white p-3 rounded-3 shadow-sm border border-primary border-opacity-25">
                        <h6 className="fw-bold mb-3">Adjust Target</h6>
                        <Row className="align-items-start g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-medium mb-1">New Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newTarget}
                                        onChange={e => setNewTarget(e.target.value)}
                                        step="1.00"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group className="mt-md-4 pt-md-1">
                                    <Form.Check
                                        type="checkbox"
                                        id={`update-master-${bucket.id}`}
                                        label={<span className="fw-medium">Update Master Blueprint (Apply to future months)</span>}
                                        checked={updateMaster}
                                        onChange={e => setUpdateMaster(e.target.checked)}
                                    />
                                </Form.Group>
                                <Alert variant="info" className="mt-2 py-2 px-3 small border-0 bg-primary bg-opacity-10 text-dark mb-0">
                                    {updateMaster
                                        ? <strong><i className="bi bi-info-circle me-1"></i>This will change {periodName} AND become the new default target for all future months.</strong>
                                        : <span><i className="bi bi-info-circle me-1"></i>This will only change the budget for {periodName}. Future months will still default to the original amount.</span>
                                    }
                                </Alert>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* 3. Transactions List */}
                <div className="p-4">
                    <h6 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
                        Activity Log
                        {isLoading && <Spinner animation="border" size="sm" variant="primary" />}
                    </h6>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="border rounded-3">
                        <Table hover responsive className="mb-0 align-middle">
                            <thead className="bg-light sticky-top">
                                <tr>
                                    <th className="small text-muted text-uppercase py-2 ps-3">Date</th>
                                    <th className="small text-muted text-uppercase py-2">Vendor / Notes</th>
                                    <th className="small text-muted text-uppercase py-2 text-end pe-3">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!isLoading && transactions.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-5 text-muted fst-italic">No transactions found for this month.</td></tr>
                                ) : (
                                    transactions.map(tx => {
                                        // Identify if this is a refund or income
                                        const isPositive = tx.type === 'Incoming' || tx.type === 'Transfer In';

                                        return (
                                            <tr key={tx.id}>
                                                <td className="ps-3 text-nowrap align-top pt-3"><small>{tx.date}</small></td>
                                                <td className="pt-3">
                                                    <div className="fw-medium text-dark">{tx.vendor}</div>
                                                    {tx.notes && <div className="small text-muted text-truncate" style={{maxWidth: '250px'}}>{tx.notes}</div>}
                                                    {/* Optional: Add a small badge so it's incredibly obvious why this is green */}
                                                    {isPositive && (
                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 mt-1 small">
                                                            {tx.type}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`text-end pe-3 fw-bold font-monospace align-top pt-3 ${isPositive ? 'text-success' : 'text-dark'}`}>
                                                    {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </td>
                                                <td className={`text-end pe-3 fw-bold font-monospace align-top pt-3 ${isPositive ? 'text-success' : 'text-dark'}`}>
                                                    {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}

                                                    {/* --- NEW: Edit Button --- */}
                                                    <Button
                                                        variant="link"
                                                        className="p-0 ms-3 text-muted"
                                                        onClick={() => setEditTx({ id: tx.id })}
                                                        title="Edit Transaction"
                                                    >
                                                        <i className="bi bi-pencil-square"></i>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="bg-light border-top-0">
                <Button variant="white" className="border shadow-sm" onClick={onHide}>Cancel</Button>
                <Button variant="primary" className="shadow-sm" onClick={handleSave} disabled={isSaving || newTarget === ''}>
                    {isSaving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                </Button>
            </Modal.Footer>

            {editTx && (
                <TransactionEditModal
                    show={!!editTx}
                    transaction={editTx}
                    handleClose={() => setEditTx(null)}
                    onUpdate={handleTransactionUpdate}
                />
            )}
        </Modal>
    );
}
