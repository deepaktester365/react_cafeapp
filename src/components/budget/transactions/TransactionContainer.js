import { useState, useEffect } from 'react';
import { Spinner, Form, Row, Col, Button, Collapse } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import More from '../../More';
import TransactionRow from './TransactionRow';
import TransactionEditModal from './TransactionEditModal';
import EmptyState from '../../common/EmptyState';
import InputField from '../../InputField';

export default function TransactionContainer({ accountId, refreshTrigger }) {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTx, setEditingTx] = useState(null);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ q: '', start_date: '', end_date: '', bucket_id: '', needs_review: false });
  const [categories, setCategories] = useState([]);

  // --- NEW: Sync State ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);

  const api = useApi();

  useEffect(() => {
    (async () => {
      const res = await api.get('/budget/categories');
      if (res.ok) setCategories(res.body.items);
    })();
  }, [api]);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);

    const queryParams = new URLSearchParams(filters);
    // Combine parent refresh trigger with our local sync trigger
    queryParams.append('_', refreshTrigger + localRefresh);

    (async () => {
      const response = await api.get(`/budget/accounts/${accountId}/transactions?${queryParams.toString()}`);
      if (response.ok) {
        setTransactions(response.body.items);
        setPagination(response.body._meta);
      }
      setLoading(false);
    })();
  }, [api, accountId, refreshTrigger, filters, localRefresh]);

  const loadNextPage = async () => {
    const queryParams = new URLSearchParams(filters);
    queryParams.append('page', pagination.page + 1);
    queryParams.append('_', refreshTrigger + localRefresh);

    const response = await api.get(`/budget/accounts/${accountId}/transactions?${queryParams.toString()}`);
    if (response.ok) {
      setTransactions([...transactions, ...response.body.items]);
      setPagination(response.body._meta);
    }
  };

  const hasActiveFilters = filters.q || filters.start_date || filters.end_date || filters.bucket_id || filters.needs_review;

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    const res = await api.delete(`/budget/transactions/${id}`);
    if (res.ok) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdate = (updatedTx) => {
      setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  // --- NEW: The Sync Handler ---
  const handleRecalculateAccount = async () => {
      if(!window.confirm("This will clean up any negative signs and recalculate your true account balance. Proceed?")) return;

      setIsSyncing(true);
      const res = await api.post(`/budget/accounts/${accountId}/recalculate`);
      setIsSyncing(false);

      if (res.ok) {
          // Trigger the useEffect to reload the newly cleaned transactions
          setLocalRefresh(prev => prev + 1);
          // You might also want to trigger a parent function here if the
          // parent component is displaying the total account balance at the top of the page.
      } else {
          alert(res.body?.message || "Failed to recalculate account.");
      }
  };

  return (
    <>
      <div className="bg-surface rounded-4 shadow-sm border overflow-hidden">

        {/* HEADER */}
        <div className="p-3 bg-surface border-bottom d-flex justify-content-between align-items-center">
            <div className="fw-bold text-body small text-uppercase letter-spacing-1">
                Transactions {pagination && `(${pagination.total_items})`}
            </div>

            {/* --- UPGRADED BUTTON GROUP --- */}
            <div className="d-flex gap-2">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleRecalculateAccount}
                    disabled={isSyncing}
                    className="rounded-pill px-3 bg-surface border text-body"
                    title="Fix negative signs and sync balance"
                >
                    <i className={`bi bi-arrow-repeat me-2 ${isSyncing ? 'text-primary' : ''}`}></i>
                    {isSyncing ? 'Syncing...' : 'Fix Math'}
                </Button>

                <Button
                    variant={hasActiveFilters ? "primary" : "light"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`rounded-pill px-3 text-body bg-surface border ${hasActiveFilters ? '' : 'text-muted'}`}
                >
                    <i className="bi bi-funnel text-body me-2"></i>{showFilters ? "Hide" : "Filter"}
                </Button>
            </div>
        </div>

        {/* FILTERS */}
        <Collapse in={showFilters}>
            <div className="p-3 bg-dark border-bottom">
                <Row className="g-2 text-body">
                    <Col md={3}>
                        <InputField size="sm" type="text" placeholder="Search..." value={filters.q} onChange={e => setFilters({...filters, q: e.target.value})} className="rounded-pill bg-surface"/>
                    </Col>
                    <Col md={3}>
                        <Form.Select size="sm" value={filters.bucket_id} onChange={e => setFilters({...filters, bucket_id: e.target.value})} className="rounded-pill bg-surface">
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <optgroup key={cat.id} label={cat.name}>{cat.buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={2}><Form.Control size="sm" type="date" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} className="rounded-pill bg-surface" /></Col>
                    <Col md={2}><Form.Control size="sm" type="date" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} className="rounded-pill bg-surface" /></Col>
                    <Col md={2}><Button variant="danger" size="sm" onClick={() => setFilters({q:'', start_date:'', end_date:'', bucket_id:''})} disabled={!hasActiveFilters} className="w-100 rounded-pill">Reset</Button></Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Check
                            type="switch"
                            id="needs-review-filter"
                            label={<span className="fw-bold text-warning"><i className="bi bi-exclamation-circle me-1"></i>Show only transactions needing review</span>}
                            checked={filters.needs_review}
                            onChange={e => setFilters({...filters, needs_review: e.target.checked})}
                            className="mt-1 ms-1"
                        />
                    </Col>
                </Row>
            </div>
        </Collapse>

        {/* CONTENT */}
        <div className="p-3 bg-transparent">
            {loading && transactions.length === 0 ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : transactions.length === 0 ? (
                <EmptyState title="No Transactions" message="Nothing found matching your criteria." icon="bi-receipt" />
            ) : (
                <div className="d-flex flex-column gap-2">
                    {transactions.map(tx => (
                        <TransactionRow key={tx.id} transaction={tx} onClick={setEditingTx} onDelete={handleDelete} />
                    ))}
                </div>
            )}
            <div className="mt-3">
                <More pagination={pagination} loadNextPage={loadNextPage} />
            </div>
        </div>
      </div>

      <TransactionEditModal show={!!editingTx} transaction={editingTx} handleClose={() => setEditingTx(null)} onUpdate={handleUpdate} />
    </>
  );
}
