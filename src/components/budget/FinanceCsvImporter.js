import { useState, useEffect, useMemo } from 'react';
import { Container, Card, Button, Form, Row, Col, Badge, Table } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';

export default function FinanceCsvImporter({ onSuccess }) {
    const api = useApi();

    // --- UI & Step State ---
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // --- Data State ---
    const [accounts, setAccounts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [categories, setCategories] = useState([]);

    // --- Form State ---
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [csvText, setCsvText] = useState('');
    const [transactions, setTransactions] = useState([]); // This is now our accumulative QUEUE

    // --- CSV Configuration State ---
    const [delimiter, setDelimiter] = useState(',');
    const [hasHeaders, setHasHeaders] = useState(false);
    const [colMap, setColMap] = useState({ date: '0', description: '1', amount: '2' });

    useEffect(() => {
        const fetchDependencies = async () => {
            const [accRes, venRes, catRes] = await Promise.all([
                api.get('/budget/accounts'),
                api.get('/budget/vendors?per_page=300'),
                api.get('/budget/categories')
            ]);

            if (accRes.ok) setAccounts(accRes.body.items || accRes.body || []);
            if (venRes.ok) setVendors(venRes.body.items || venRes.body || []);
            if (catRes.ok) setCategories(catRes.body.items || []);
        };
        fetchDependencies();
        // eslint-disable-next-line
    }, []);

    const previewColumns = useMemo(() => {
        if (!csvText.trim()) return [];
        const firstLine = csvText.trim().split('\n')[0];
        return firstLine.split(delimiter).map(col => col.trim());
    }, [csvText, delimiter]);

    const updateColMap = (field, colIndex) => {
        setColMap(prev => ({ ...prev, [field]: colIndex }));
    };

    // 2. Step 1 -> Add to Queue
    const handleAddToQueue = async () => {
        if (!selectedAccountId) return alert("Please select a budget account.");
        if (!csvText.trim()) return alert("Please paste some CSV data.");

        setIsLoading(true);
        const res = await api.post('/budget/transactions/parse-csv', {
            account_id: selectedAccountId,
            csv_data: csvText,
            config: {
                delimiter: delimiter,
                has_headers: hasHeaders,
                mapping: {
                    date: parseInt(colMap.date),
                    description: parseInt(colMap.description),
                    amount: parseInt(colMap.amount)
                }
            }
        });
        setIsLoading(false);

        if (res.ok) {
            const acc = accounts.find(a => a.id.toString() === selectedAccountId.toString());

            const newTxs = res.body.transactions.map(tx => ({
                ...tx,
                account_id: selectedAccountId,
                account_name: acc ? acc.name : 'Unknown Account',
                createAlias: false,
                bucket_id: tx.suggested_bucket_id || '',
                is_validated: false
            }));

            setTransactions(prev => [...prev, ...newTxs]);
            setCsvText('');
            setSelectedAccountId('');
        } else {
            alert(res.body?.message || "Failed to parse CSV.");
        }
    };

    const updateTx = (index, field, value) => {
        setTransactions(prev => prev.map((tx, i) => i === index ? { ...tx, [field]: value } : tx));
    };

    // 4. Step 2 -> Save to Database
    const handleCommitTransactions = async () => {
        const unassigned = transactions.find(tx =>
            !tx.transaction_type.includes('Transfer') &&
            !tx.bucket_id &&
            !tx.vendor_id
        );
        if (unassigned) {
            const proceed = window.confirm("Some transactions are missing a vendor or category. Save anyway?");
            if (!proceed) return;
        }

        setIsLoading(true);
        const newAliases = [];
        const payloadTransactions = transactions.map(tx => {
            let finalNotes = tx.notes || '';

            if (tx.createAlias && tx.vendor_id) {
                const v = vendors.find(v => v.id.toString() === tx.vendor_id.toString());
                if (v) {
                    newAliases.push({
                        vendor_name: v.name,
                        pattern: tx.raw_description,
                        is_regex: false,
                        account_id: tx.account_id
                    });
                }
            }

            // The Fallback Logic: No Vendor & Not a Transfer = Copy bank description to notes
            if (!tx.vendor_id && !tx.transaction_type.includes('Transfer') && !finalNotes) {
                finalNotes = tx.raw_description;
            }

            return { ...tx, notes: finalNotes };
        });

        // Notice we no longer send the top-level account_id! It's embedded in the transactions.
        const res = await api.post('/budget/transactions/bulk-commit', {
            transactions: payloadTransactions,
            new_aliases: newAliases
        });
        setIsLoading(false);

        if (res.ok) {
            alert(res.body.message);
            setStep(1);
            setTransactions([]);
            if (onSuccess) onSuccess();
        } else {
            alert(res.body?.message || "Failed to save transactions.");
        }
    };

    const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const datePart = String(dateString).split('T')[0]; // Extract just the YYYY-MM-DD part
        const [year, month, day] = datePart.split('-');
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0"><i className="bi bi-file-earmark-spreadsheet text-primary me-2"></i> CSV Triage Engine</h2>
                    <p className="text-muted mb-0">Queue up multiple accounts and triage them at once.</p>
                </div>
            </div>

            {/* --- STEP 1: THE DROP ZONE & QUEUE --- */}
            {step === 1 && (
                <Row className="g-4">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm rounded-4 p-4 animation-fade-in h-100">
                            <h5 className="fw-bold text-dark mb-4"><i className="bi bi-upload text-primary me-2"></i>Import Data</h5>

                            <Row className="g-3 mb-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold text-muted text-header-caps small">1. Select Account</Form.Label>
                                        <Form.Select className="shadow-sm border-primary-subtle" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
                                            <option value="">-- Select Account --</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.account_type})</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold text-muted text-header-caps small">Delimiter</Form.Label>
                                        <Form.Select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
                                            <option value=",">Comma (,)</option>
                                            <option value="&#9;">Tab</option>
                                            <option value=";">Semicolon (;)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3} className="d-flex align-items-end pb-2">
                                    <Form.Check type="switch" id="has-headers" label={<span className="fw-medium small">Ignore Row 1</span>} checked={hasHeaders} onChange={(e) => setHasHeaders(e.target.checked)} />
                                </Col>
                            </Row>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold text-muted text-header-caps small">2. Paste CSV Data</Form.Label>
                                <Form.Control as="textarea" rows={6} className="bg-light border-light shadow-inner font-monospace small" placeholder="Paste raw bank data here..." value={csvText} onChange={(e) => setCsvText(e.target.value)} />
                            </Form.Group>

                            {previewColumns.length > 0 && (
                                <div className="bg-primary-subtle bg-opacity-10 p-3 rounded-4 border border-primary-subtle mb-4">
                                    <Form.Label className="fw-bold text-primary text-header-caps small mb-2">3. Map Columns</Form.Label>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Select size="sm" value={colMap.date} onChange={(e) => updateColMap('date', e.target.value)}>
                                                {previewColumns.map((col, idx) => <option key={idx} value={idx}>Date: Col {idx + 1}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Select size="sm" value={colMap.description} onChange={(e) => updateColMap('description', e.target.value)}>
                                                {previewColumns.map((col, idx) => <option key={idx} value={idx}>Desc: Col {idx + 1}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Select size="sm" value={colMap.amount} onChange={(e) => updateColMap('amount', e.target.value)}>
                                                {previewColumns.map((col, idx) => <option key={idx} value={idx}>Amt: Col {idx + 1}</option>)}
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            <Button variant="outline-primary" className="w-100 rounded-pill fw-bold border-2" onClick={handleAddToQueue} disabled={isLoading || !csvText.trim()}>
                                {isLoading ? 'Parsing...' : 'Parse & Add to Queue'} <i className="bi bi-plus-circle ms-1"></i>
                            </Button>
                        </Card>
                    </Col>

                    {/* --- THE STAGING AREA QUEUE --- */}
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 p-4 h-100 bg-light">
                            <h5 className="fw-bold text-dark mb-4"><i className="bi bi-collection text-primary me-2"></i>Staging Queue</h5>

                            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center">
                                <div className="display-4 fw-bold text-primary mb-2">{transactions.length}</div>
                                <div className="text-muted fw-bold text-header-caps">Transactions Ready</div>

                                {transactions.length > 0 && (
                                    <div className="mt-4 w-100">
                                        <Button variant="primary" size="lg" className="w-100 rounded-pill fw-bold shadow-sm" onClick={() => setStep(2)}>
                                            Review & Link <i className="bi bi-arrow-right ms-2"></i>
                                        </Button>
                                        <Button variant="link" className="text-danger mt-2 text-decoration-none small" onClick={() => setTransactions([])}>
                                            Clear Queue
                                        </Button>
                                    </div>
                                )}
                                {transactions.length === 0 && (
                                    <div className="text-muted small mt-3 fst-italic">Paste and parse CSVs from multiple accounts to build your queue.</div>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* --- STEP 2: THE TRIAGE GRID --- */}
            {step === 2 && (
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden animation-slide-up">
                    <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
                        <div>
                            <Button variant="white" size="sm" className="me-3 rounded-circle" style={{width: '32px', height: '32px', padding: 0}} onClick={() => setStep(1)}>
                                <i className="bi bi-arrow-left text-primary"></i>
                            </Button>
                            <span className="fw-bold fs-5 align-middle">Verify {transactions.length} Transactions</span>
                        </div>
                        <Button variant="success" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleCommitTransactions} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Commit to Budget'} <i className="bi bi-check-circle-fill ms-2"></i>
                        </Button>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        <Table hover className="align-middle mb-0 border-light">
                            <thead className="bg-light sticky-top shadow-sm z-1">
                                <tr>
                                    <th className="text-muted small fw-bold text-header-caps py-3 ps-4" style={{width: '150px'}}>Date & Account</th>
                                    <th className="text-muted small fw-bold text-header-caps py-3" style={{width: '250px'}}>Bank Description</th>
                                    <th className="text-muted small fw-bold text-header-caps py-3" style={{width: '140px'}}>Amount & Type</th>
                                    <th className="text-muted small fw-bold text-header-caps py-3" style={{width: '25%'}}>Vendor & Rules</th>
                                    <th className="text-muted small fw-bold text-header-caps py-3" style={{width: '25%'}}>Budget Category</th>
                                    <th className="text-muted small fw-bold text-header-caps py-3 text-center" style={{width: '80px'}}>Valid?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx, idx) => {
                                    const isTransfer = tx.transaction_type.includes('Transfer');

                                    return (
                                        <tr key={tx.id} className={tx.is_smart_guessed ? 'bg-primary-subtle bg-opacity-10' : ''}>
                                            <td className="ps-4">
                                                <div className="text-dark small fw-medium">{formatDate(tx.date)}</div>
                                                <Badge bg="secondary" className="fw-normal mt-1 text-truncate" style={{maxWidth: '120px'}} title={tx.account_name}>{tx.account_name}</Badge>
                                            </td>

                                            <td>
                                                <div className="fw-bold font-monospace small text-truncate" style={{maxWidth: '250px'}} title={tx.raw_description}>
                                                    {tx.raw_description}
                                                </div>
                                                {tx.is_smart_guessed && <Badge bg="primary" className="fw-medium mt-1" style={{fontSize: '0.6rem'}}><i className="bi bi-magic me-1"></i>Auto-Matched</Badge>}
                                            </td>

                                            <td>
                                                <div className={`fw-bold mb-1 ${['Incoming', 'Income', 'Transfer In'].includes(tx.transaction_type) ? 'text-success' : 'text-dark'}`}>
                                                    {formatMoney(tx.amount)}
                                                </div>
                                                <Form.Select
                                                    size="sm"
                                                    className="shadow-sm border-light bg-white text-muted fw-bold"
                                                    style={{ fontSize: '0.75rem' }}
                                                    value={tx.transaction_type}
                                                    onChange={(e) => {
                                                        const newType = e.target.value;
                                                        updateTx(idx, 'transaction_type', newType);
                                                        if (newType.includes('Transfer')) {
                                                            updateTx(idx, 'vendor_id', '');
                                                            updateTx(idx, 'bucket_id', '');
                                                        }
                                                    }}
                                                >
                                                    <option value="Outgoing">Outgoing</option>
                                                    <option value="Incoming">Incoming</option>
                                                    <option value="Income">Income</option>
                                                    <option value="Transfer Out">Transfer Out</option>
                                                    <option value="Transfer In">Transfer In</option>
                                                </Form.Select>
                                            </td>

                                            <td>
                                                <Form.Select
                                                    size="sm"
                                                    className="mb-1 shadow-sm border-0 bg-light fw-medium"
                                                    value={tx.vendor_id || ''}
                                                    onChange={(e) => {
                                                        const newVendorId = e.target.value;
                                                        updateTx(idx, 'vendor_id', newVendorId);

                                                        if (newVendorId) {
                                                            const selectedVendor = vendors.find(v => v.id.toString() === newVendorId.toString());
                                                            // Check if the backend provided a suggested bucket for this vendor
                                                            if (selectedVendor && selectedVendor.suggested_bucket_id) {
                                                                updateTx(idx, 'bucket_id', selectedVendor.suggested_bucket_id);
                                                            }
                                                        }
                                                    }}
                                                    disabled={isTransfer}
                                                >
                                                    <option value="">-- Select Vendor --</option>
                                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                </Form.Select>

                                                {tx.vendor_id && !tx.is_smart_guessed && !isTransfer && (
                                                    <Form.Check type="checkbox" id={`alias-${idx}`} label={<span className="small text-muted">Always map to this vendor</span>} checked={tx.createAlias} onChange={(e) => updateTx(idx, 'createAlias', e.target.checked)} />
                                                )}
                                            </td>

                                            <td className="pe-4">
                                                <Form.Select size="sm" className="mb-1 shadow-sm border-0 bg-light fw-medium" value={tx.bucket_id || ''} onChange={(e) => updateTx(idx, 'bucket_id', e.target.value)} disabled={isTransfer}>
                                                    <option value="">-- Select Category --</option>
                                                    {categories.map(cat => (
                                                        <optgroup key={cat.id} label={cat.name}>
                                                            {cat.buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                        </optgroup>
                                                    ))}
                                                </Form.Select>
                                            </td>

                                            <td className="text-center pe-4">
                                                <Form.Check
                                                    type="checkbox"
                                                    className="fs-5"
                                                    checked={tx.is_validated}
                                                    onChange={(e) => updateTx(idx, 'is_validated', e.target.checked)}
                                                    title="Uncheck if this needs to be split or reviewed later"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}
        </Container>
    );
}
