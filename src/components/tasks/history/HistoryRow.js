import { Button, Badge } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';

export default function HistoryRow({ entry, variant = 'task', onClick, onDelete }) {
  const api = useApi();

  const title = entry.habit_name || entry.log_name || "Unknown Entry";
  const rawTime = entry.time || "";
  const metaData = entry.meta_data || {};
  const hasNotes = !!entry.notes;

  const isTask = variant === 'task';
  const accentColor = isTask ? '#0d6efd' : '#198754';
  const badgeBg = isTask ? 'secondary' : 'success';

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minStr} ${ampm}`;
  };

  const displayTime = formatTime(rawTime);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this log entry?")) return;
    const endpoint = isTask ? `/habits/log/${entry.id}` : `/lifelogs/log/${entry.id}`;
    const response = await api.delete(endpoint);
    if (response.ok && onDelete) onDelete(entry.id);
  };

  return (
    // FIX: Changed from Card to div. Added 'border-bottom' and 'hover-bg-light'.
    // We keep the colored border-left as an accent.
    <div
      className="d-flex align-items-center justify-content-between py-3 px-3 border-bottom hover-bg-light"
      onClick={onClick}
      style={{ cursor: 'pointer', borderLeft: `5px solid ${accentColor}`, transition: 'background-color 0.2s' }}
    >
        {/* LEFT: Title & Meta */}
        <div className="d-flex flex-column" style={{minWidth: 0}}>
          <span className="fw-bold text-truncate">{title}</span>

          <div className="d-flex gap-1 mt-1 flex-wrap">
            {hasNotes && <Badge bg="info" className="fw-normal" style={{fontSize: '0.65rem'}}>Note</Badge>}

            {Object.entries(metaData).map(([key, value]) => {
                let label = key.replace(/_/g, " ");
                label = label.charAt(0).toUpperCase() + label.slice(1);
                return (
                  <Badge key={key} bg={badgeBg} className="bg-opacity-75" style={{fontSize: '0.65rem'}}>
                    {label}: {value}
                  </Badge>
                );
            })}
          </div>
        </div>

        {/* RIGHT: Time & Actions */}
        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-sm-block">
             <div className="fw-bold small" style={{whiteSpace: 'nowrap'}}>{displayTime}</div>
          </div>

          <Button
            variant="light" size="sm"
            className="text-danger bg-surface rounded-circle border d-flex align-items-center justify-content-center"
            style={{width: '32px', height: '32px'}}
            onClick={handleDelete}
            title="Delete Entry"
          >
            <i className="bi bi-trash-fill" style={{fontSize: '0.85rem'}}></i>
          </Button>
        </div>
    </div>
  );
}
