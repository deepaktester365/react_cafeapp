import { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import InputField from '../../InputField';

export default function TransactionAddForm({ accountId, onTransactionAdded }) {
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]); // This will now hold our dynamic search results
  const [error, setError] = useState(null);

  // Form State
  const [txnType, setTxnType] = useState('Outgoing');
  const [selectedBucket, setSelectedBucket] = useState("");
  const [vendorName, setVendorName] = useState(""); // <-- Changed from useRef to state

  // Split State
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState([{ id: 1, bucket_id: '', amount: '' }, { id: 2, bucket_id: '', amount: '' }]);
  const [currentTotal, setCurrentTotal] = useState(0);

  const api = useApi();

  // Refs
  const dateRef = useRef();
  const amountRef = useRef();
  const notesRef = useRef();

  // 1. Initial Load (Categories only)
  useEffect(() => {
    (async () => {
      const catRes = await api.get('/budget/categories');
      if (catRes.ok) setCategories(catRes.body.items);
    })();
  }, [api]);

  // 2. NEW: Debounced Vendor Search
  useEffect(() => {
    if (vendorName.trim().length < 2) {
        setVendors([]); // Clear list if input is empty or too short
        return;
    }

    // Wait 300ms after the user stops typing before hitting the API
    const delayDebounceFn = setTimeout(async () => {
        const res = await api.get(`/budget/vendors?q=${encodeURIComponent(vendorName)}&per_page=10`);
        if (res.ok) setVendors(res.body.items || []);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [vendorName, api]);


  // --- LOGIC ---
  const handleAmountChange = () => setCurrentTotal(parseFloat(amountRef.current.value) || 0);

  const handleVendorChange = (e) => {
    const newName = e.target.value;
    setVendorName(newName); // Update the state to trigger the search

    const matchedVendor = vendors.find(v => v.name === newName);

    // Only auto-suggest bucket if we are NOT in Income mode
    if (matchedVendor && matchedVendor.suggested_bucket_id && txnType !== 'Income') {
        const suggestedId = matchedVendor.suggested_bucket_id;
        if (isSplit) {
            const firstSplit = splits[0];
            if (firstSplit && !firstSplit.bucket_id) {
                updateSplit(0, 'bucket_id', suggestedId);
            }
        } else {
            if (!selectedBucket) setSelectedBucket(suggestedId);
        }
    }
  };

  const updateSplit = (index, field, value) => {
      const newSplits = [...splits];
      newSplits[index][field] = value;
      setSplits(newSplits);
  };

  const addSplitRow = () => setSplits([...splits, { id: Date.now(), bucket_id: '', amount: '' }]);
  const removeSplitRow = (index) => { if (splits.length > 1) setSplits(splits.filter((_, i) => i !== index)); };

  const splitSum = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const remaining = currentTotal - splitSum;
  const isBalanced = Math.abs(remaining) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      account_id: accountId,
      date: dateRef.current.value,
      amount: currentTotal,
      vendor_name: vendorName, // Use state instead of ref
      transaction_type: txnType,
      notes: notesRef.current.value,
    };

    if (txnType === 'Income') {
        payload.bucket_id = null;
        payload.splits = [];
    } else if (isSplit) {
        if (!isBalanced) {
            setError(`Splits must match Total. Difference: ${remaining.toFixed(2)}`);
            return;
        }
        payload.splits = splits.map(s => ({
            bucket_id: s.bucket_id,
            amount: parseFloat(s.amount)
        }));
    } else {
        payload.bucket_id = selectedBucket || null;
    }

    const response = await api.post("/budget/transactions", payload);

    if (response.ok) {
      amountRef.current.value = "";
      notesRef.current.value = "";
      setVendorName(""); // Clear vendor state
      setCurrentTotal(0);
      setSelectedBucket("");
      setSplits([{ id: 1, bucket_id: '', amount: '' }, { id: 2, bucket_id: '', amount: '' }]);
      setIsSplit(false);
      onTransactionAdded(response.body);
    } else {
      setError(response.body.errors?.json || response.body.message || "Failed to save");
    }
  };

  const isIncome = txnType === 'Income';

  return (
    <Card className="shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
      <Card.Header className="bg-surface-1 border-bottom py-3 d-flex justify-content-between align-items-center">
        <h6 className="m-0 fw-bold text-primary">
            <i className="bi bi-plus-lg me-2"></i>Add Transaction
        </h6>
        {!isIncome && (
            <Form.Check type="switch" id="split-switch" label="Split Categories" checked={isSplit} onChange={(e) => setIsSplit(e.target.checked)} className="small text-body"/>
        )}
      </Card.Header>
      <Card.Body className="p-4 bg-surface">
        {error && <Alert variant="danger" className="rounded-3 border-0 mb-3">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3 mb-3">
            <Col md={12}>
                <InputField name="type" type="select" label="Type" value={txnType}
                    onChange={(e) => {
                        setTxnType(e.target.value);
                        if(e.target.value === 'Income') setIsSplit(false);
                    }}>
                    <option value="Outgoing">Expense</option>
                    <option value="Incoming">Refund</option>
                    <option value="Income">Income</option>
                </InputField>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col md={6}><InputField name="date" type="date" label="Date" fieldRef={dateRef} required defaultValue={new Date().toISOString().split('T')[0]} /></Col>
            <Col md={6}><InputField name="amount" type="number" step="0.01" label="Amount" placeholder="0.00" fieldRef={amountRef} required className="fw-bold" onChange={handleAmountChange} /></Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col md={!isSplit && !isIncome ? 6 : 12}>
                <Form.Group>
                    <InputField
                        label={isIncome ? 'Source / Payer' : 'Vendor'}
                        type="text" list="vendor-options" placeholder={isIncome ? "e.g. Employer" : "e.g. Starbucks"}
                        className="rounded-3 text-body"
                        value={vendorName} // Controlled state
                        onChange={handleVendorChange} // Updates state and searches
                        autoComplete="off"
                    />
                    {/* Datalist populates instantly from the debounced search */}
                    <datalist id="vendor-options">{vendors.map(v => <option key={v.id} value={v.name} />)}</datalist>
                </Form.Group>
            </Col>

            {!isSplit && !isIncome && (
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="text-header-caps mb-1">Bucket</Form.Label>
                        <Form.Select className="rounded-3" value={selectedBucket} onChange={(e) => setSelectedBucket(e.target.value)}>
                            <option value="">-- Uncategorized --</option>
                            {categories.map(cat => (
                                <optgroup key={cat.id} label={cat.name}>{cat.buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            )}
          </Row>

          {/* ... (Split Logic UI remains identical) ... */}
          {isSplit && !isIncome && (
              <div className="bg-dark-subtle p-3 rounded-4 mb-3 border">
                  <div className="d-flex justify-content-between mb-2 small text-uppercase fw-bold text-body">
                      <span>Split Details</span>
                      <span className={isBalanced ? 'text-success' : 'text-danger'}>{isBalanced ? "Balanced" : `Remaining: $${remaining.toFixed(2)}`}</span>
                  </div>
                  {splits.map((split, idx) => (
                      <Row key={split.id} className="g-2 mb-2">
                          <Col xs={7}>
                              <Form.Select size="sm" value={split.bucket_id} onChange={(e) => updateSplit(idx, 'bucket_id', e.target.value)} required className="rounded-3 bg-surface">
                                  <option value="">Select Bucket...</option>
                                  {categories.map(cat => (<optgroup key={cat.id} label={cat.name}>{cat.buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>))}
                              </Form.Select>
                          </Col>
                          <Col xs={4}>
                              <InputGroup size="sm"><InputGroup.Text className="bg-surface border-end-0">$</InputGroup.Text><Form.Control type="number" step="0.01" value={split.amount} onChange={(e) => updateSplit(idx, 'amount', e.target.value)} required className="border-start-0" /></InputGroup>
                          </Col>
                          <Col xs={1} className="text-end"><Button variant="link" size="sm" className="text-danger p-0" onClick={() => removeSplitRow(idx)}><i className="bi bi-trash"></i></Button></Col>
                      </Row>
                  ))}
                  <Button variant="link" size="sm" className="p-0 text-decoration-none fw-bold" onClick={addSplitRow}>+ Add Line</Button>
              </div>
          )}

          <InputField name="notes" placeholder="Optional notes..." fieldRef={notesRef} />

          <div className="d-grid mt-4">
             <Button type="submit" variant="primary" className="rounded-pill fw-bold" disabled={isSplit && !isBalanced}>Save Transaction</Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
