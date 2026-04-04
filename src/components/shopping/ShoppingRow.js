import { Form } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';

// --- NOOK DESIGN SYSTEM IMPORTS ---
import StatusBadge from '../common/StatusBadge';
import IconButton from '../common/IconButton';

export default function ShoppingRow({ item, onUpdate, onEdit }) {
  const api = useApi();

  if (item.archive_status) {
    return null;
  }

  const handleToggleComplete = async () => {
    const url = `/purchase/${item.id}`;
    const response = await api.put(url);

    if (response.ok) {
      onUpdate(response.body);
    }
  };

  const totalPrice = (item.unit_price * item.qty).toFixed(2);
  const isPurchased = item.purchase_status;

  return (
    <div className={`d-flex align-items-start py-2 ${isPurchased ? 'opacity-50' : ''}`}>
      {/* 1. CHECKBOX (SWITCH) */}
      <div className="pt-1">
        <Form.Check
          type="switch"
          id={`item-check-${item.id}`}
          checked={isPurchased}
          onChange={() => handleToggleComplete(item.id)}
          className="text-body-50"
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* 2. MAIN CONTENT (Click to Edit) */}
      <div
        className="flex-grow-1 ms-3"
        onClick={onEdit}
        style={{ cursor: 'pointer' }}
      >
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Item Name */}
          {/* FIX: Removed 'text-dark'. Now it inherits 'text-body' (White in Dark Mode). */}
          <span className={`fw-bold ${isPurchased ? 'text-decoration-line-through text-body' : ''}`}>
            {item.name}
          </span>

          {/* Quantity Badge */}
          <StatusBadge
            variant="light"
            label={`${item.qty} ${item.unit}`}
            className="bg-surface text-body border" // Added border for better definition in Dark Mode
          />

          {/* Organic Badge */}
          {item.is_organic && (
            <StatusBadge
              variant="success"
              icon="bi-leaf-fill"
              label="Organic"
            />
          )}
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="text-body-50 small fst-italic mt-1 text-truncate-2">
            {item.notes}
          </div>
        )}
      </div>

      {/* 3. PRICE & ACTIONS */}
      <div className="d-flex flex-column align-items-end ms-3">
        {item.unit_price > 0 && (
          <span className={`fw-bold text-currency ${isPurchased ? 'text-muted' : 'text-success'}`}>
            ${totalPrice}
          </span>
        )}

        {/* Explicit Edit Button */}
        <div className="mt-1">
           {/* FIX: Changed variant to 'light' (Maps to Dark Grey in Dark Mode via CSS) */}
           <IconButton
              icon="bi-pencil"
              onClick={(e) => { e.stopPropagation(); onEdit(); }} // Added stopPropagation for safety
              variant="light"
              size="sm"
              className="text-muted"
           />
        </div>
      </div>
    </div>
  );
}
