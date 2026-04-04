import { Badge, OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { formatCurrency } from '../../../utils/currency';

export default function TransactionRow({ transaction, onClick, onDelete }) {
  const isPositive = ['Income', 'Incoming', 'Transfer In'].includes(transaction.transaction_type);
  const splits = transaction.splits || [];
  const isSplit = splits.length > 1;

  // --- NEW: Check validation status ---
  const needsReview = transaction.is_validated !== true;

  // Date Parsing
  const dateStr = String(transaction.date).split('T')[0];
  const [year, month, day] = dateStr.split('-');
  const dateObj = new Date(year, month - 1, day);
  const dayNumber = day;
  const monthName = dateObj.toLocaleString('default', { month: 'short' });

  // Badge Logic
  let categoryBadge;
  if (isSplit) {
    const tooltipText = splits.map(s => `${s.bucket_name || 'Uncategorized'}: ${formatCurrency(s.amount)}`).join('\n');
    categoryBadge = (
      <OverlayTrigger placement="top" overlay={<Tooltip style={{whiteSpace: 'pre-line', textAlign: 'left'}}>{tooltipText}</Tooltip>}>
        <Badge bg="info" text="dark" className="border fw-normal d-flex align-items-center gap-1" style={{cursor: 'help'}}>
          <i className="bi bi-diagram-3-fill"></i> Split ({splits.length})
        </Badge>
      </OverlayTrigger>
    );
  } else {
    const bucketName = splits[0]?.bucket_name || transaction.primary_bucket || "Uncategorized";
    categoryBadge = (
      <Badge bg="secondary" className="fw-normal text-truncate opacity-75" style={{maxWidth: '150px'}}>
        {bucketName}
      </Badge>
    );
  }

  return (
    <div
      // --- NEW: Apply a warning border if it needs review ---
      className={`d-flex align-items-center bg-surface-50 p-2 p-sm-3 mb-2 rounded-4 shadow-sm position-relative transaction-row-hover ${needsReview ? 'border border-warning' : 'border'}`}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s',
        borderLeftWidth: needsReview ? '5px' : '1px' // Thicker left border
      }}
      onClick={() => onClick(transaction)}
    >
      {/* DATE BOX */}
      <div className="d-flex flex-column align-items-center justify-content-center me-2 me-sm-3 text-muted border-end pe-2 pe-sm-3 flex-shrink-0" style={{minWidth: '60px'}}>
         <span className="fw-bold text-body h5 mb-0" style={{lineHeight: '1'}}>{dayNumber}</span>
         <span className="small text-uppercase text-body fw-bold" style={{fontSize: '0.65rem', letterSpacing: '1px'}}>{monthName}</span>
         <span className="small text-body" style={{fontSize: '0.6rem', lineHeight: '1'}}>{year}</span>
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-grow-1 overflow-hidden me-2 me-sm-3">

         {/* ROW 1: Vendor Name & Review Badge */}
         <div className="fw-bold text-body text-truncate mb-1 d-flex align-items-center gap-2">
            {transaction.vendor_name || <span className="text-body fst-italic">No Vendor</span>}

            {/* --- NEW: The Needs Review Badge --- */}
            {needsReview && (
                <Badge bg="warning" text="dark" className="fw-bold" style={{fontSize: '0.65rem'}}>
                    <i className="bi bi-exclamation-circle me-1"></i>Review
                </Badge>
            )}
         </div>

         {/* ROW 2: Badge + Amount (Mobile) */}
         <div className="d-flex align-items-center">
            {categoryBadge}
            {transaction.notes && (
                <span className="text-body small text-truncate d-none d-sm-inline ms-2" style={{maxWidth: '200px'}}>
                    &bull; {transaction.notes}
                </span>
            )}
            <div className={`d-block d-sm-none ms-auto fw-bold font-monospace fs-6 ${isPositive ? 'text-success' : ''}`}>
                {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
            </div>
         </div>
      </div>

      {/* DESKTOP AMOUNT */}
      <div className={`d-none d-sm-block fw-bold fs-5 text-end font-monospace flex-shrink-0 ${isPositive ? 'text-success' : ''}`}>
         {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
      </div>

      {/* DELETE BUTTON */}
      <div className="ms-2 ps-2 border-start flex-shrink-0">
         <Button
            variant="light" size="sm"
            className="text-danger bg-surface rounded-circle d-flex align-items-center justify-content-center border"
            style={{width: '32px', height: '32px'}}
            onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
         >
            <i className="bi bi-trash"></i>
         </Button>
      </div>
    </div>
  );
}
