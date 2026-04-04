import { Button } from 'react-bootstrap';

export default function LogRow({ log, onClick, onTrack }) {
  return (
      <div
        // FIX 1: Converted from Card to a clean div row
        // FIX 2: Added 'hover-bg-light' for interaction feedback
        // FIX 3: Added 'border-bottom' for separation (last item handling is usually automatic or fine)
        className="d-flex align-items-center justify-content-between py-3 px-3 border-bottom hover-bg-light"
        style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
        onClick={onClick}
      >
        <div className="d-flex flex-column">
          {/* FIX 4: Removed 'text-dark'. Now inherits correct color (White in Dark Mode). */}
          <span className="fw-bold">{log.name}</span>

          <div className="d-flex gap-2 align-items-center text-body-50 small">
             <span>Count: <span className="fw-bold">{log.counts || 0}</span></span>
             {log.notes && (
                <>
                    <span className="opacity-50">&bull;</span>
                    <span className="text-truncate" style={{maxWidth: '150px'}}>{log.notes}</span>
                </>
             )}
          </div>
        </div>

        {/* Right: Plus Button */}
        <div className="d-flex align-items-center">
          <Button
            // FIX 5: 'variant="light"' automatically maps to dark gray in our CSS
            variant="light"
            size="sm"
            className="rounded-circle bg-surface d-flex align-items-center justify-content-center border text-success"
            style={{width: '32px', height: '32px'}}
            onClick={(e) => {
                e.stopPropagation();
                onTrack();
            }}
          >
            <i className="bi bi-plus-lg"></i>
          </Button>
        </div>
      </div>
  );
}
