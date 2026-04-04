import { useState, useMemo } from 'react';
import { Spinner, OverlayTrigger, Tooltip, Form, Button } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import { formatCurrency, formatDate } from '../../../utils/currency';

export default function BudgetBucketRow({ bucket, viewDate, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGrouped, setIsGrouped] = useState(false);
  const api = useApi();

  // --- 1. Archive Handler ---
  const handleArchive = async (e) => {
    e.stopPropagation(); // Stop row toggle
    if (!window.confirm("Are you sure you want to archive this bucket?")) return;

    const res = await api.put(`/budget/buckets/${bucket.id}`, { archived: true });

    if (res.ok) {
      if (onRefresh) onRefresh(); // Refresh parent to remove this row
    } else {
      alert("Failed to archive bucket");
    }
  };

  // --- 2. Toggle Expansion ---
  const handleToggle = async () => {
    setExpanded(!expanded);
    if (expanded || transactions) return;

    setLoading(true);
    const periodName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let url = bucket.setter_id
      ? `/budget/setters/${bucket.setter_id}/transactions`
      : `/budget/buckets/${bucket.id}/transactions?period=${periodName}`;

    const res = await api.get(url);
    if (res.ok) {
        const txData = res.body.items || res.body;
        setTransactions(Array.isArray(txData) ? txData : []);
    }
    setLoading(false);
  };

  // --- 3. Amount Helper (FIXED: Parse Float) ---
  const getTxnAmount = (txn) => {
    if (txn.splits && Array.isArray(txn.splits) && txn.splits.length > 0) {
      const mySplit = txn.splits.find(s => s.bucket_id === bucket.id);
      if (mySplit) return parseFloat(mySplit.amount);
    }
    return parseFloat(txn.amount);
  };

  // --- 4. Grouping Logic ---
  const groupedTransactions = useMemo(() => {
    if (!transactions || !isGrouped) return null;

    const groups = transactions.reduce((acc, txn) => {
      const vendor = txn.vendor_name || "Unknown Vendor";
      if (!acc[vendor]) {
        acc[vendor] = { items: [], total: 0 };
      }

      const amount = getTxnAmount(txn) || 0;
      const isRefund = txn.transaction_type === 'Incoming';

      acc[vendor].items.push(txn);
      acc[vendor].total += isRefund ? -amount : amount;

      return acc;
    }, {});

    return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
  }, [transactions, isGrouped, bucket.id]);

  // --- 5. Goal Calculation ---
  const calculateGoal = () => {
    if (!bucket.goal_setter) return bucket.goal || 0;
    const { frequency, amount, day_of_week } = bucket.goal_setter;
    const targetAmount = parseFloat(amount) || 0;

    if (frequency === 'Weekly' && day_of_week) {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const targetDayIndex = days.findIndex(d => day_of_week.toLowerCase().startsWith(d));
        if (targetDayIndex === -1) return targetAmount * 4;

        let count = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            if (new Date(year, month, d).getDay() === targetDayIndex) count++;
        }
        return targetAmount * count;
    }
    return targetAmount;
  };

  const displayGoal = calculateGoal();
  const isWeekly = bucket.goal_setter && bucket.goal_setter.frequency === 'Weekly';

  // --- 6. Early Return for Archived ---
  if (bucket.archived) return null;

  return (
    <>
      <tr onClick={handleToggle} style={{ cursor: 'pointer' }} className={expanded ? "bg-body-tertiary border-start border-4 border-primary" : "hover-bg-light border-start border-4 border-transparent"}>
        {/* Name */}
        <td className="ps-3 py-3">
          <div className="d-flex align-items-center fw-medium text-body">
             <i className={`bi bi-chevron-right me-2 small text-body transition-transform ${expanded ? 'rotate-90' : ''}`} style={{fontSize: '0.7rem'}}></i>
             {bucket.name}
          </div>
        </td>

        {/* Goal */}
        <td className="text-end text-body d-none d-md-table-cell font-monospace small pt-3">
            {isWeekly ? (
                <OverlayTrigger placement="top" overlay={<Tooltip>{bucket.goal_setter.day_of_week}'s in Month<br/>{formatCurrency(bucket.goal_setter.amount)} / week</Tooltip>}>
                    <span className="text-primary border-primary border-opacity-25" style={{cursor: 'help'}}>{formatCurrency(displayGoal)}</span>
                </OverlayTrigger>
            ) : (formatCurrency(displayGoal))}
        </td>

        {/* Assigned & Activity */}
        <td className="text-end font-monospace pt-3 text-body">{formatCurrency(bucket.assigned)}</td>
        <td className="text-end text-body font-monospace pt-3">{formatCurrency(bucket.activity)}</td>

        {/* --- FIXED: Integrated Paid Off / Available Column --- */}
        <td className="text-end pe-3">
           {bucket.is_loan ? (
               <div className="d-flex flex-column align-items-end" style={{minWidth: '120px'}}>
                   {bucket.remaining_debt <= 0 ? (
                       // Paid Off State
                       <div className="d-flex align-items-center gap-2">
                           <span className="badge bg-success">PAID OFF!</span>
                           <Button
                               size="sm" variant="outline-secondary" className="py-0 px-2" style={{fontSize: '0.7rem'}}
                               onClick={handleArchive}
                           >
                               Archive
                           </Button>
                       </div>
                   ) : (
                       // Loan Progress State
                       <>
                           <div className="d-flex justify-content-between w-100 small mb-1">
                               <span className="text-muted" style={{fontSize: '0.65rem'}}>REMAINING</span>
                               <span className="fw-bold text-danger">{formatCurrency(bucket.remaining_debt)}</span>
                           </div>
                           <div className="progress w-100 bg-secondary-subtle" style={{height: '6px'}}>
                               <div
                                   className="progress-bar bg-success"
                                   role="progressbar"
                                   style={{width: `${Math.min((bucket.total_paid / bucket.total_debt) * 100, 100)}%`}}
                               ></div>
                           </div>
                           <div className="small text-muted mt-1" style={{fontSize: '0.65rem'}}>
                               {Math.round((bucket.total_paid / bucket.total_debt) * 100)}% Paid
                           </div>
                       </>
                   )}
               </div>
           ) : (
               // Standard Available Badge
               <span className={`badge rounded-pill fw-bold border ${bucket.available < 0 ? 'text-danger bg-danger-subtle' : 'text-success bg-success-subtle'}`} style={{minWidth: '80px'}}>
                  {formatCurrency(bucket.available)}
               </span>
           )}
        </td>
      </tr>

      {/* Expanded Details */}
      {expanded && (
        <tr className="bg-body-tertiary">
          <td colSpan="5" className="p-0 border-0">
            <div className="px-4 py-3 border-bottom shadow-inner-sm">
               <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-header-caps text-body">Recent Activity</small>
                  {transactions && transactions.length > 0 && (
                    <Form.Check
                      type="switch" label="Group by Vendor" className="small text-body"
                      checked={isGrouped} onChange={(e) => setIsGrouped(e.target.checked)}
                    />
                  )}
               </div>

               {loading && <div className="text-center py-3"><Spinner size="sm" animation="border" variant="primary"/></div>}

               {!loading && transactions && (
                 <div className="bg-surface rounded-3 border overflow-hidden shadow-sm">
                    {isGrouped ? (
                        groupedTransactions.map(([vendor, data]) => (
                          <div key={vendor} className="border-bottom">
                            <div className="bg-dark-subtle px-3 py-1 d-flex justify-content-between align-items-center border-bottom">
                              <span className="fw-bold small text-primary text-uppercase">{vendor}</span>
                              <span className={`small fw-bold ${data.total < 0 ? 'text-success' : ''}`}>
                                  {formatCurrency(data.total)}
                              </span>
                            </div>
                            {data.items.map((txn) => (
                              <div key={txn.id} className="d-flex justify-content-between align-items-center p-2 px-3 border-bottom last-child-no-border">
                                  <span className="small text-body">
                                      {formatDate(txn.date)} &bull; {txn.notes || "No notes"}
                                      {txn.transaction_type === 'Incoming' && <span className="ms-2 badge bg-success-subtle text-success border-0 small">Refund</span>}
                                  </span>
                                  <span className={`small font-monospace ${txn.transaction_type === 'Incoming' ? 'text-success' : 'text-danger'}`}>
                                      {txn.transaction_type === 'Incoming' ? '+' : ''}{formatCurrency(getTxnAmount(txn))}
                                  </span>
                              </div>
                            ))}
                          </div>
                        ))
                      ) : (
                      transactions.length === 0 ? (
                        <div className="p-3 text-center text-body small">No transactions found for this period.</div>
                      ) : (
                        transactions.map((txn, i) => (
                          <div key={txn.id} className={`d-flex justify-content-between align-items-center p-2 px-3 ${i !== transactions.length - 1 ? 'border-bottom' : ''}`}>
                              <div className="d-flex flex-column" style={{maxWidth: '60%'}}>
                                  <span className="fw-bold text-truncate text-body">{txn.vendor_name || "Unknown"}</span>
                                  <span className="small text-body">
                                      {formatDate(txn.date)} &bull; {txn.notes || "No notes"}
                                      {txn.transaction_type === 'Incoming' && <span className="ms-2 badge bg-success-subtle text-success border-0 small">Refund</span>}
                                  </span>
                              </div>
                              <span className={`fw-bold font-monospace ${txn.transaction_type === 'Incoming' ? 'text-success' : 'text-danger'}`}>
                                  {txn.transaction_type === 'Incoming' ? '+' : ''}
                                  {formatCurrency(getTxnAmount(txn))}
                              </span>
                          </div>
                        ))
                      )
                    )}
                 </div>
               )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
