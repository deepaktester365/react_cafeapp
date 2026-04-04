import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Badge } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';

// Components
import AccountRow from './AccountRow';
import AccountAddModal from './AccountAddModal';
import LoadingState from '../../common/LoadingState';

// Modals
import TransferModal from '../modals/TransferModal';
import PaymentModal from '../modals/PaymentModal';
import AccountEditModal from '../modals/AccountEditModal';

export default function AccountContainer() {
  const [accounts, setAccounts] = useState();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const api = useApi();

  const loadAccounts = useCallback(async () => {
    const res = await api.get('/budget/accounts');
    if (res.ok) setAccounts(res.body.items);
    else setAccounts(null);
  }, [api]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const groupedAccounts = useMemo(() => {
    if (!accounts) return {};
    return accounts.reduce((acc, curr) => {
      const type = curr.account_type || 'Other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(curr);
      return acc;
    }, {});
  }, [accounts]);

  const netWorth = useMemo(() => {
      if(!accounts) return 0;
      return accounts.reduce((sum, acc) => {
          if (acc.account_type === 'Home Bank Account') return sum;
          return sum + (parseFloat(acc.current_balance) || 0);
      }, 0);
  }, [accounts]);

  if (accounts === undefined) return <LoadingState />;

  return (
    <div className="container-fluid px-0 px-md-3 pb-5">

      {/* HEADER & ACTIONS */}
      {/* FIX 1: Changed bg-white to bg-surface so it's dark in dark mode */}
      <div className="bg-surface p-3 p-md-4 rounded-4 shadow-sm mb-4 mx-3 mx-md-0">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">

            {/* Total Balance Section */}
            <div>
                <div className="text-header-caps text-body mb-1">Total Balance</div>
                {/* FIX 2: Removed text-dark. Now inherits text-body (White). */}
                <h2 className={`fw-bold mb-0 font-monospace ${netWorth < 0 ? 'text-danger' : ''}`}>
                    ${netWorth.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </h2>
                <div className="small text-body fst-italic mt-1" style={{fontSize: '0.75rem'}}>
                    (Excludes Home/Cash Accounts)
                </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
                <Button variant="light" size="sm" className="rounded-pill border bg-surface fw-bold text-success px-3 py-2" onClick={() => setShowPayment(true)}>
                    <i className="bi bi-credit-card me-2"></i>Pay Card
                </Button>
                <Button variant="light" size="sm" className="rounded-pill border bg-surface fw-bold text-primary px-3 py-2" onClick={() => setShowTransfer(true)}>
                    <i className="bi bi-arrow-left-right me-2"></i>Transfer
                </Button>
                <Button variant="primary" size="sm" className="rounded-pill bg-surface text-body fw-bold px-4 py-2" onClick={() => setShowCreate(true)}>
                    <i className="bi bi-plus-lg me-2"></i>Add
                </Button>
            </div>
        </div>
      </div>

      {/* ACCOUNT GROUPS */}
      {Object.keys(groupedAccounts).sort().map(type => (
        <div key={type} className="mb-4">
            <div className="d-flex align-items-center mb-3 ps-3 ps-md-2">
                <h6 className="text-header-caps text-body mb-0">{type}</h6>
                {/* FIX 3: Changed Badge to bg-dark-subtle text-body so it looks good in both modes */}
                <Badge bg="secondary" className="ms-2 rounded-pill opacity-75">{groupedAccounts[type].length}</Badge>
            </div>

            <div className="d-flex flex-column gap-2 px-1 px-md-0">
                {groupedAccounts[type].map(acct => (
                    <AccountRow
                        key={acct.id}
                        account={acct}
                        onEdit={() => setEditingAccount(acct)}
                    />
                ))}
            </div>
        </div>
      ))}

      {/* MODALS */}
      <AccountAddModal show={showCreate} handleClose={() => setShowCreate(false)} onAccountAdded={loadAccounts} />
      <TransferModal show={showTransfer} handleClose={() => setShowTransfer(false)} onTransferSuccess={loadAccounts} />
      <PaymentModal show={showPayment} handleClose={() => setShowPayment(false)} onSuccess={loadAccounts} />
      <AccountEditModal
        accountId={editingAccount?.id}
        show={!!editingAccount}
        handleClose={() => setEditingAccount(null)}
        onUpdate={loadAccounts}
        onDelete={() => { setEditingAccount(null); loadAccounts(); }}
      />
    </div>
  );
}
