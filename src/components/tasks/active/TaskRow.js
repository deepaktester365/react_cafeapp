import { Button } from 'react-bootstrap';
import { getTaskIcon } from '../../../utils/iconUtils';

export default function TaskRow({ task, onTrack, onEdit }) {
  const isMisc = task.frequency === 'Misc';
  const current = task.completion_count || 0;
  const target = task.repeats || 1;

  // Visual Logic
  const percent = Math.min((current / target) * 100, 100);
  const isCompleted = !isMisc && (current >= target);

  // Icon Logic
  const { Icon, color } = getTaskIcon(task.name);

  // Dynamic Styles
  // FIX: Changed gradients to use RGBA and Transparent.
  // This puts a 15% Blue overlay for progress, allowing the underlying Dark/Light background to show through.
  const backgroundStyle = isMisc
    ? { borderLeft: '4px solid #6c757d' } // Removed bg-white
    : { background: `linear-gradient(90deg, rgba(13, 110, 253, 0.15) ${percent}%, transparent ${percent}%)` };

  return (
    // FIX 1: Converted Card to div.
    // FIX 2: Added 'hover-bg-light' for hover effect.
    // FIX 3: Added 'border-bottom' for separation.
    <div
      className="d-flex align-items-center justify-content-between py-3 px-3 border-bottom hover-bg-light"
      style={{ cursor: 'pointer', transition: 'background-color 0.2s', ...backgroundStyle }}
      onClick={onEdit}
    >

        {/* LEFT: Icon & Name */}
        <div className="d-flex align-items-center overflow-hidden">
          {/* FIX 4: Changed bg-white to bg-body-tertiary (Adaptive Light Grey) */}
          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-surface-50 border shadow-sm me-3 flex-shrink-0"
            style={{ width: '36px', height: '36px' }}
          >
            <Icon className={`fs-6 ${color}`} />
          </div>

          <div className="d-flex flex-column text-truncate">
            {/* FIX 5: Removed text-dark */}
            <span className={`fw-bold text-truncate ${isCompleted ? 'text-decoration-line-through opacity-50' : ''}`}>
                {task.name}
            </span>
            {task.notes && (
                <small className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                    {task.notes}
                </small>
            )}
          </div>
        </div>

        {/* RIGHT: Counter & Action */}
        <div className="d-flex align-items-center flex-shrink-0 ms-2">

          {/* Counter Badge */}
          <span className="me-3 fw-bold text-secondary small" style={{ fontFamily: 'monospace' }}>
            {isMisc ? (
                // FIX 6: Use bg-body-secondary for adaptive badge background
                <span className="badge bg-body-secondary text-body border fw-normal">
                   {current}
                </span>
            ) : (
                <span>
                   {String(current).padStart(2, '0')}<span className="opacity-50 mx-1">/</span>{String(target).padStart(2, '0')}
                </span>
            )}
          </span>

          {/* Quick Add Button */}
          <Button
            variant={isCompleted ? "success" : "light"}
            size="sm"
            // FIX 7: bg-white isn't needed on the button anymore due to variant="light" logic in CSS
            className={`rounded-circle d-flex align-items-center justify-content-center border ${isCompleted ? 'border-success' : 'border-secondary-subtle bg-surface'}`}
            style={{width: '32px', height: '32px', transition: 'all 0.2s'}}
            onClick={(e) => {
                e.stopPropagation();
                onTrack();
            }}
            disabled={isCompleted}
          >
            {isCompleted ? <i className="bi bi-check text-surface"></i> : <i className="bi bi-plus-lg text-primary"></i>}
          </Button>
        </div>
    </div>
  );
}
