import { Badge } from 'react-bootstrap';

export default function GiftRow({ gift, showArchiveStatus, showPurchaseStatus, showBoughtStatus, onClick }) {

  if (gift.archive_status && !showArchiveStatus && !showBoughtStatus) { return null; }

  const getSafeLink = (url) => {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const renderStars = (rating) => {
    const score = parseInt(rating) || 0;
    if (score === 0) return null;

    const fullStars = Math.floor(score / 2);
    const hasHalfStar = score % 2 !== 0;

    return (
      <div className="d-flex text-warning small flex-shrink-0" style={{lineHeight: 1}}>
        {[...Array(fullStars)].map((_, i) => <i key={`f-${i}`} className="bi bi-star-fill"></i>)}
        {hasHalfStar && <i className="bi bi-star-half"></i>}
      </div>
    );
  };

  const link = getSafeLink(gift.url);

  return (
    <div
      className={`d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3 border-bottom transition-all ${
        gift.archive_status ? 'bg-surface-75 opacity-75' : 'bg-surface hover-bg-light'}`}
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
    >
      {/* LEFT SIDE: Main Info */}
      <div className="d-flex flex-column mb-2 mb-md-0 flex-grow-1" style={{ minWidth: 0 }}>

        <div className="d-flex align-items-center gap-2">
            {showBoughtStatus && (
                // FIX 3: Changed Badge to use adaptive variants
                <Badge bg="secondary" className="fw-normal me-1 flex-shrink-0">
                    For: {gift.user || "?"}
                </Badge>
            )}

            {/* FIX 4: Removed 'text-dark'. Now inherits correct color (White in dark mode) */}
            <span
                className={`fw-bold text-truncate ${
                    gift.archive_status ? 'text-decoration-line-through text-body-50' : 'text-body'
                }`}
            >
                {gift.name}
            </span>

            {renderStars(gift.rating)}
        </div>

        <div className="small mt-1 text-truncate">
            {gift.archive_status && <span className="text-danger fw-bold me-2">[Archived]</span>}
            <span className="text-body fst-italic">
                {gift.notes ? gift.notes : 'No notes'}
            </span>
        </div>
      </div>

      {/* RIGHT SIDE: Price & Actions */}
      <div className="d-flex align-items-center justify-content-end gap-3 mt-2 mt-md-0 flex-shrink-0">

         {showPurchaseStatus && (
             <div>
                {gift.purchase_status ?
                    <Badge bg="secondary" className="fw-normal">Purchased</Badge> :
                    <Badge bg="success" className="fw-normal">Available</Badge>
                }
             </div>
         )}

         {showBoughtStatus && gift.buy_loc && (
             <Badge bg="info" className="fw-normal text-white">{gift.buy_loc}</Badge>
         )}

         {/* Price */}
         <div className="text-end" style={{minWidth: '70px'}}>
             {gift.price ? (
                <span className="text-success fw-bold text-currency">${Number(gift.price).toFixed(2)}</span>
             ) : (
                <span className="text-muted small">-</span>
             )}
         </div>

         {/* Link Button */}
         {link ? (
            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                // FIX 5: 'btn-light' maps to dark gray in our CSS, but we ensure text is visible
                className="btn btn-sm btn-surface-50 border rounded-pill text-primary"
                onClick={(e) => e.stopPropagation()}
                title="Visit Website"
                style={{width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            >
                <i className="bi bi-box-arrow-up-right"></i>
            </a>
         ) : (
             <div style={{width: '32px'}}></div>
         )}
      </div>
    </div>
  );
}
