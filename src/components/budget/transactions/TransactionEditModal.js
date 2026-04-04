import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import InputField from '../../InputField';
import LoadingState from '../../common/LoadingState';

export default function TransactionEditModal({ transaction, show, handleClose, onUpdate }) {
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState(0);
  const [txnType, setTxnType] = useState('Outgoing');
  const [notes, setNotes] = useState('');
  const [isValidated, setIsValidated] = useState(true);

  // Split State
  const [selectedBucket, setSelectedBucket] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState([]);

  const api = useApi();

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  useEffect(() => {
    if (show) {
      (async () => {
        const res = await api.get('/budget/categories');
        if (res.ok) setCategories(res.body.items || []);
      })();
    }
  }, [show, api]);

  useEffect(() => {
    // Don't search if the modal is closed or input is tiny
    if (!show || vendorName.trim().length < 2) {
        setVendors([]);
        return;
    }

    const delayDebounceFn = setTimeout(async () => {
        // Fetch max 10 matches to keep the dropdown lightweight
        const res = await api.get(`/budget/vendors?q=${encodeURIComponent(vendorName)}&per_page=10`);
        if (res.ok) setVendors(res.body.items || []);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [vendorName, show, api]);

  useEffect(() => {
    if (show && transaction) {
      setIsLoading(true);
      api.get(`/budget/transactions/${transaction.id}`).then(response => {
        setIsLoading(false);
        if (!response.ok) return;

        const tx = response.body;
        setDate(String(tx.date).split('T')[0]);
        setVendorName(tx.vendor_name || '');
        setNotes(tx.notes || '');
        setTxnType(tx.transaction_type);
        setAmount(parseFloat(tx.amount));
        setIsValidated(tx.is_validated === true);

        const txSplits = tx.splits || [];
        if (txSplits.length > 1) {
            setIsSplit(txSplits.length > 1);
            setSplits(txSplits.map(s => ({
                id: s.id,
                bucket_id: s.bucket_id,
                amount: s.amount,
                vendor_name: s.vendor_name || ''
            })));
        } else {
            setIsSplit(false);
            let bucketId = '';
            if (txSplits.length === 1) {
                bucketId = txSplits[0].bucket_id || (txSplits[0].bucket_goal_setter ? txSplits[0].bucket_goal_setter.bucket_id : '');
            }
            setSelectedBucket(bucketId ? String(bucketId) : '');
            setSplits([{ id: Date.now(), bucket_id: bucketId, amount: parseFloat(tx.amount) }]);
        }
      });
    }
  }, [show, transaction, api]);

  // Split Logic Helpers
  const updateSplit = (index, field, value) => {
      const newSplits = [...splits];
      newSplits[index][field] = value;
      setSplits(newSplits);
  };
  const addSplitRow = () => setSplits([...splits, { id: Date.now(), bucket_id: '', amount: '' }]);
  const removeSplitRow = (index) => setSplits(splits.filter((_, i) => i !== index));

  // Math for summary
  const splitSum = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const remaining = amount - splitSum;
  const isBalanced = Math.abs(remaining) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      date: date,
      amount: amount,
      vendor_name: vendorName,
      transaction_type: txnType,
      notes: notes,
      is_validated: isValidated
    };

    if (isSplit) {
        if (!isBalanced) {
            setError(`Splits must match Total. You have a discrepancy of ${formatCurrency(Math.abs(remaining))}.`);
            return;
        }
        payload.splits = splits.map(s => ({
            bucket_id: s.bucket_id,
            amount: parseFloat(s.amount),
            vendor_name: s.vendor_name || null
        }));
    } else {
        payload.bucket_id = selectedBucket || null;
    }

    const response = await api.put(`/budget/transactions/${transaction.id}`, payload);
    if (response.ok) {
      onUpdate(response.body);
      handleClose();
    } else {
      setError(response.body.errors?.json || "Failed to update");
    }
  };

  if (!transaction) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <div className="d-flex align-items-center justify-content-between w-100 pe-4">
             <Modal.Title className="fw-bold text-primary">Edit Transaction</Modal.Title>
             <Form.Check type="switch" id="edit-split-switch" label="Split Mode" checked={isSplit} onChange={(e) => setIsSplit(e.target.checked)} />
        </div>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {error && <Alert variant="danger" className="rounded-3 border-0">{error}</Alert>}
        {isLoading ? <LoadingState /> : (
            <Form onSubmit={handleSubmit}>
                <Row className="g-3 mb-3">
                    <Col md={4}><InputField name="date" type="date" label="Date" value={date} onChange={e => setDate(e.target.value)} required /></Col>
                    <Col md={4}>
                        <InputField name="type" type="select" label="Type" value={txnType} onChange={e => setTxnType(e.target.value)}>
                            <option value="Outgoing">Expense</option>
                            <option value="Incoming">Refund</option>
                            <option value="Transfer In">Transfer In</option>
                            <option value="Transfer Out">Transfer Out</option>
                        </InputField>
                    </Col>
                    <Col md={4}><InputField name="amount" type="number" step="0.01" label="Amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} required /></Col>
                </Row>

                <Row className="g-3 mb-3">
                    <Col md={isSplit ? 12 : 6}>
                        <Form.Group>
                            <InputField
                                label='Vendor'
                                type="text" list="edit-vendor-options" value={vendorName}
                                className="rounded-3 text-body" onChange={e => setVendorName(e.target.value)}
                            />
                            <datalist id="edit-vendor-options">{vendors.map(v => <option key={v.id} value={v.name} />)}</datalist>
                        </Form.Group>
                    </Col>
                    {!isSplit && (
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-header-caps mb-1">Bucket</Form.Label>
                                <Form.Select value={selectedBucket} onChange={e => setSelectedBucket(e.target.value)} className="rounded-3 bg-surface">
                                    <option value="">-- Uncategorized --</option>
                                    {categories.map(cat => (
                                        <optgroup key={cat.id} label={cat.name}>{cat.buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    )}
                </Row>

                {isSplit && (
                    <div className="bg-dark-subtle p-3 rounded-4 mb-3 border">
                        {splits.map((split, idx) => (
                            <Row key={split.id || idx} className="g-2 mb-2">
                                <Col xs={4}>
                                    <Form.Select size="sm" value={split.bucket_id} onChange={(e) => updateSplit(idx, 'bucket_id', e.target.value)} required className="rounded-3 bg-surface">
                                        <option value="">Select Bucket...</option>
                                        {categories.map(cat => (<optgroup key={cat.id} label={cat.name}>{cat.buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>))}
                                    </Form.Select>
                                </Col>
                                <Col xs={4}>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        placeholder="Vendor (Optional)"
                                        value={split.vendor_name || ''}
                                        onChange={(e) => updateSplit(idx, 'vendor_name', e.target.value)}
                                        list="edit-vendor-options"
                                        className="rounded-3 bg-surface"
                                    />
                                </Col>
                                <Col xs={3}>
                                    <InputGroup size="sm"><InputGroup.Text className="bg-surface">$</InputGroup.Text><Form.Control type="number" step="0.01" value={split.amount} onChange={(e) => updateSplit(idx, 'amount', e.target.value)} /></InputGroup>
                                </Col>
                                <Col xs={1} className="text-end"><Button variant="link" size="sm" className="text-danger p-0 mt-1" onClick={() => removeSplitRow(idx)}><i className="bi bi-trash fs-5"></i></Button></Col>
                            </Row>
                        ))}
                        <Button variant="link" size="sm" onClick={addSplitRow} className="ps-0">+ Add Line</Button>

                        {/* --- NEW: Dynamic Split Summary Footer --- */}
                        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-25">
                            <span className="small fw-bold text-uppercase letter-spacing-1">Split Summary</span>
                            <div className="d-flex gap-3 small fw-medium">
                                <span>Total: {formatCurrency(amount)}</span>
                                <span className={isBalanced ? "text-success" : "text-muted"}>Allocated: {formatCurrency(splitSum)}</span>
                                <span className={isBalanced ? "text-success fw-bold" : "text-danger fw-bold"}>
                                    {isBalanced ? <><i className="bi bi-check-circle-fill me-1"></i>Balanced</> : <>Remaining: {formatCurrency(remaining)}</>}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <InputField name="notes" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />

                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <Form.Check
                        type="switch"
                        id="validate-transaction-switch"
                        label={<span className="fw-bold ms-1 text-body">Mark as Validated</span>}
                        checked={isValidated}
                        onChange={(e) => setIsValidated(e.target.checked)}
                        className="fs-6"
                    />
                    <div className="d-flex gap-2">
                        <Button variant="light" onClick={handleClose} className="rounded-pill px-4 border">Cancel</Button>
                        <Button type="submit" variant="primary" className="rounded-pill px-4 fw-bold" disabled={isSplit && !isBalanced}>Update</Button>
                    </div>
                </div>
            </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
