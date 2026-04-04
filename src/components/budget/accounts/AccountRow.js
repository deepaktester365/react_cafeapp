import { useNavigate } from 'react-router-dom';
import { Badge, Button } from 'react-bootstrap';
import { formatCurrency, formatDate } from '../../../utils/currency';

export default function AccountRow({ account, onEdit }) {
  const navigate = useNavigate();

  const getTypeIcon = (type) => {
    if (type?.includes('Bank')) return 'bi-bank';
    if (type?.includes('Card')) return 'bi-credit-card';
    if (type?.includes('Home')) return 'bi-house-heart';
    return 'bi-wallet2';
  };

  const isNegative = account.current_balance < 0;

  return (
    // FIX 1: Changed bg-white to bg-surface. Added 'hover-bg-light' for interaction feedback.
    <div
      className="d-flex align-items-center bg-surface p-2 p-sm-3 mb-2 rounded-4 shadow-sm border-0 account-row-hover position-relative hover-bg-light"
      style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onClick={() => navigate(`/budget/account/${account.id}`)}
    >
        {/* ICON */}
        {/* FIX 2: Changed bg-light to bg-body-tertiary for better dark mode adaptation */}
        <div className={`rounded-circle bg-surface border d-flex align-items-center justify-content-center me-2 me-sm-3 flex-shrink-0 ${isNegative ? 'bg-danger-subtle text-danger' : 'bg-body-tertiary text-primary'}`}
             style={{ width: '48px', height: '48px' }}>
            <i className={`bi ${getTypeIcon(account.account_type)} fs-5`}></i>
        </div>

        {/* INFO COLUMN */}
        <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>

            {/* TOP ROW: Name Only (Full Width on Mobile) */}
            <div className="d-flex align-items-center mb-1 mb-sm-1">
                {/* FIX 3: Removed text-dark. Now inherits text-body. */}
                <span className="fw-bold text-truncate me-2">{account.name}</span>
                {account.description && (
                    // FIX 4: Changed Badge to bg-secondary opacity-75
                    <Badge bg="secondary" className="d-none d-sm-inline-flex fw-normal border text-truncate opacity-75" style={{maxWidth: '150px'}}>
                        {account.description}
                    </Badge>
                )}
            </div>

            {/* BOTTOM ROW: Date (Left) + Amount (Right - Mobile Only) */}
            <div className="d-flex align-items-center small text-body">
                {/* Date */}
                <div className="text-truncate me-2">
                    <i className="bi bi-calendar3 me-1"></i>{formatDate(account.starting_date)}
                </div>

                {/* MOBILE AMOUNT: Visible only on mobile (d-sm-none), pushed to the right (ms-auto) */}
                {/* FIX 5: Removed text-dark */}
                <div className={`d-block d-sm-none ms-auto fw-bold font-monospace ${isNegative ? 'text-danger' : ''}`} style={{fontSize: '0.95rem'}}>
                    {formatCurrency(account.current_balance)}
                </div>
            </div>
        </div>

        {/* DESKTOP BALANCE COLUMN: Hidden on mobile (d-none), Visible on Tablet+ */}
        <div className="d-none d-sm-block text-end ps-3 flex-shrink-0">
            {/* FIX 6: Removed text-dark */}
            <div className={`fw-bold font-monospace ${isNegative ? 'text-danger' : ''} fs-5`}>
                {formatCurrency(account.current_balance)}
            </div>
        </div>

        {/* ACTIONS COLUMN */}
        <div className="d-flex align-items-center gap-2 ms-2 ms-sm-3 ps-2 ps-sm-3 border-start flex-shrink-0">
            {/* BUTTON: Visible everywhere */}
            <Button
                variant="light" size="sm"
                className="text-body-50 bg-surface rounded-circle d-flex align-items-center justify-content-center border"
                style={{width: '32px', height: '32px'}}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(account);
                }}
            >
                <i className="bi bi-pencil-fill small"></i>
            </Button>

            {/* CHEVRON: Hidden on mobile */}
            <div className="text-primary opacity-50 d-none d-sm-block">
                <i className="bi bi-chevron-right"></i>
            </div>
        </div>
    </div>
  );
}
