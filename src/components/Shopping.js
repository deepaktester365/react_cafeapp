import { Form } from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import { Link } from 'react-router-dom';

export default function Shopping({ item, onUpdate }) {
  const api = useApi();

  if (item.archive_status) {
    return null;
  }

  const labelStyle = item.is_organic ? "text-success fw-bold" : "";

  const handleToggleComplete = async (itemId) => {
    const url = `/purchase/${itemId}`;
    const response = await api.put(url);

    if (response.ok) {
      onUpdate(response.body);
    } else {
      console.log("Failed to update");
    }
  };
  return (
    <div className="d-flex align-items-center py-2 border-bottom">
      <div className="flex-grow-1">
        <Form.Check
        type="switch"
        id={`item-check-${item.id}`}
        checked={item.purchase_status}
        onChange={() => handleToggleComplete(item.id)}
        label=
        {
          <div className="ms-2">
            <Link to={`/shopping_item/${item.id}`} className={`text-decoration-none ${labelStyle}`}>
                {item.name}
              </Link>
              {/* Show Quantity and Unit if they exist */}
              <span className="ms-2 badge bg-light text-dark border">
                 {item.qty} {item.unit}
              </span>
              {item.notes && (
                <div className="text-muted small fst-italic">
                  {item.notes}
                </div>
              )}
          </div>
        }
        />
      </div>
      <div className="text-end">
       {item.unit_price > 0 &&
          <span className="text-muted">${(item.unit_price * item.qty).toFixed(2)}</span>
       }
      </div>
    </div>
  );
}
