import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import { useFlash } from '../../contexts/FlashProvider';
import InputField from '../InputField';
import LoadingState from '../common/LoadingState';

export default function GiftEditModal({ itemId, show, handleClose, onUpdate, onArchive }) {
  const [formErrors, setFormErrors] = useState({});
  const [item, setItem] = useState();
  const api = useApi();
  const flash = useFlash();

  // Refs
  const nameField = useRef();
  const priceField = useRef();
  const ratingField = useRef();
  const notesField = useRef();
  const urlField = useRef();

  useEffect(() => {
    if (!show) { setItem(undefined); return; }
    if (!itemId) return;

    (async () => {
      const response = await api.get(`/gifts/${itemId}`);
      setItem(response.ok ? response.body : null);
    })();
  }, [api, itemId, show]);

  // Pre-fill Form
  useEffect(() => {
    if (item) {
      if (nameField.current) nameField.current.value = item.name;
      if (priceField.current) priceField.current.value = item.price || '';
      if (notesField.current) notesField.current.value = item.notes || '';
      if (urlField.current) urlField.current.value = item.url || '';
      // The backend sends 1-10, which matches the 'value' of our options below
      if (ratingField.current) ratingField.current.value = item.rating || 'placeholder';
    }
  }, [item]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const price = parseFloat(priceField.current.value) || 0.00;

    // Rating Logic: Frontend "5.0" -> Backend "10"
    const ratingRaw = ratingField.current.value;
    const rating = (ratingRaw === 'placeholder') ? null : parseInt(ratingRaw);

    let cleanUrl = urlField.current.value.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
    }

    const response = await api.put(`/gifts/${itemId}`, {
      name: nameField.current.value,
      price: price,
      rating: rating,
      notes: notesField.current.value,
      url: cleanUrl
    });

    if (response.ok) {
      flash('Gift updated successfully', 'success');
      setFormErrors({});
      if (onUpdate) onUpdate(response.body);
      handleClose();
    } else {
      if (response.body.errors) setFormErrors(response.body.errors.json);
    }
  };

  const handleArchiveToggle = async () => {
    const action = item.archive_status ? 'unarchive' : 'archive';
    if (!window.confirm(`Are you sure you want to ${action} this gift?`)) return;

    const response = await api.put(`/gifts/${action}/${itemId}`);
    if (response.ok) {
      flash(`Gift ${action}d`, 'warning');
      if (onArchive) onArchive(itemId);
      handleClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-primary">Edit Gift</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        {item === undefined ? <LoadingState message="Loading details..." /> :
         item === null ? <div className="text-danger">Error loading gift</div> :
          <Form onSubmit={handleSubmit}>
            <Row className="g-3 mb-3">
              <Col md={8}>
                <InputField name="name" label="Gift Name" error={formErrors.name} fieldRef={nameField} />
              </Col>
              <Col md={4}>
                <InputField name="price" label="Price ($)" type="number" step="0.01" error={formErrors.price} fieldRef={priceField} />
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <InputField
                    name="rating"
                    type="select"
                    label="Priority / Rating"
                    error={formErrors.rating}
                    fieldRef={ratingField}
                >
                    <option value='placeholder' className="text-muted">No Rating</option>
                    {/* Generates options 10 down to 1 */}
                    {[...Array(10)].map((_, i) => {
                        const backendValue = 10 - i;  // 10, 9, 8...
                        const displayValue = (backendValue / 2).toFixed(1); // 5.0, 4.5, 4.0...

                        const fullStars = Math.floor(backendValue / 2);
                        const halfStar = backendValue % 2 !== 0;
                        const starString = '★'.repeat(fullStars) + (halfStar ? '½' : '');

                        return (
                            <option key={backendValue} value={backendValue}>
                                {displayValue} - {starString}
                            </option>
                        );
                    })}
                </InputField>
              </Col>
              <Col md={8}>
                <InputField name="url" label="Website URL" error={formErrors.url} fieldRef={urlField} />
              </Col>
            </Row>

            <InputField name="notes" label="Notes" error={formErrors.notes} fieldRef={notesField} />
          </Form>
        }
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 px-4 pb-4 justify-content-between">
        {item && (
            <Button variant="light" className="bg-surface text-danger border rounded-pill px-3" onClick={handleArchiveToggle}>
                <i className={`bi bi-${item.archive_status ? 'box-arrow-up' : 'archive'} me-2`}></i>
                {item.archive_status ? 'Unarchive' : 'Archive'}
            </Button>
        )}
        <div className="d-flex gap-2">
            <Button variant="light" onClick={handleClose} className="bg-surface border rounded-pill px-4 text-body-50">Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4 ">Save Changes</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
