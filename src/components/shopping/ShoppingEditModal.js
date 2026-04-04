import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import { useFlash } from '../../contexts/FlashProvider';

// --- NOOK DESIGN SYSTEM IMPORTS ---
import LoadingState from '../common/LoadingState';
import InputField from '../InputField';
import CategorySelect from './selectors/CategorySelect';
import UnitSelect from './selectors/UnitSelect';

export default function ShoppingEditModal({ itemId, show, handleClose, onUpdate, onDelete }) {
  const [formErrors, setFormErrors] = useState({});
  const flash = useFlash();

  // Refs
  const nameField = useRef();
  const qtyField = useRef();
  const unitField = useRef();
  const categoryField = useRef();
  const storeField = useRef();
  const priceField = useRef();
  const organicField = useRef();
  const notesField = useRef();

  const [item, setItem] = useState();
  const api = useApi();

  // 1. Fetch Item
  useEffect(() => {
    if (!show) {
      setItem(undefined);
      return;
    }
    if (!itemId) return;

    (async () => {
      const url = `/shopping_item/${itemId}`;
      const response = await api.get(url);
      if (response.ok) {
        setItem(response.body);
      } else {
        setItem(null);
      }
    })();
  }, [api, itemId, show]);

  // 2. Pre-fill Form
  useEffect(() => {
    if (item) {
      if (nameField.current) nameField.current.value = item.name;
      if (qtyField.current) qtyField.current.value = item.qty;
      if (unitField.current) unitField.current.value = item.unit || 'ea';
      if (categoryField.current) categoryField.current.value = item.category || 'Uncategorized';
      if (storeField.current) storeField.current.value = item.store_name || '';
      if (priceField.current) priceField.current.value = (item.unit_price * item.qty).toFixed(2);
      if (organicField.current) organicField.current.checked = item.is_organic;
      if (notesField.current) notesField.current.value = item.notes || '';
    }
  }, [item]);

  // 3. Handlers
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const url = `/shopping_item/${itemId}`;
    const qty = parseFloat(qtyField.current.value) || 1.0;

    const response = await api.put(url, {
      name: nameField.current.value,
      qty: qty,
      unit: unitField.current.value,
      category: categoryField.current.value,
      store_name: storeField.current.value,
      item_price: priceField.current.value,
      is_organic: organicField.current.checked,
      notes: notesField.current.value,
    });

    if (response.ok) {
      flash('Item successfully updated', 'success');
      setFormErrors({});
      if (onUpdate) onUpdate(response.body);
      handleClose();
    } else {
      if (response.body.errors) {
        setFormErrors(response.body.errors.json);
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;

    const url = `/shopping_item/${itemId}`;
    const response = await api.delete(url);
    if (response.ok) {
      flash('Item removed', 'success');
      setFormErrors({});
      if (onDelete) onDelete(itemId);
      handleClose();
    } else {
      console.error("Delete failed");
    }
  };

  // --- RENDER ---
  return (
    // 'contentClassName' relies on our Global CSS override for [data-theme='dark'] .modal-content
    <Modal show={show} onHide={handleClose} size="lg" centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-primary">Edit Item</Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {item === undefined ? (
          <LoadingState message="Loading details..." />
        ) : item === null ? (
          <div className="text-danger">Error loading item.</div>
        ) : (
          <Form onSubmit={handleSubmit}>

            {/* ROW 1: Name & Category */}
            <Row className="g-3 mb-3">
              <Col md={8}>
                <Form.Label className="text-header-caps mb-1">Item Name</Form.Label>
                <InputField
                  name="name"
                  error={formErrors.name}
                  fieldRef={nameField}
                />
              </Col>
              <Col md={4}>
                <Form.Label className="text-header-caps mb-1">Category</Form.Label>
                {/* SMART COMPONENT */}
                <CategorySelect
                    label=""
                    error={formErrors.category}
                    fieldRef={categoryField}
                />
              </Col>
            </Row>

            {/* ROW 2: Qty, Unit, Price */}
            <Row className="g-3 mb-3">
              <Col md={3} xs={6}>
                <Form.Label className="text-header-caps mb-1">Qty</Form.Label>
                <InputField
                  name="qty" type="number" step="any"
                  error={formErrors.qty} fieldRef={qtyField}
                />
              </Col>
              <Col md={3} xs={6}>
                <Form.Label className="text-header-caps mb-1">Unit</Form.Label>
                {/* SMART COMPONENT */}
                <UnitSelect
                    label=""
                    error={formErrors.unit}
                    fieldRef={unitField}
                />
              </Col>
              <Col md={6}>
                <Form.Label className="text-header-caps mb-1">Total Price ($)</Form.Label>
                <InputField
                  name="price" type="number" step="0.01"
                  error={formErrors.price} fieldRef={priceField}
                />
              </Col>
            </Row>

            {/* ROW 3: Store, Notes, Organic */}
            <Row className="g-3 align-items-center">
              <Col md={4}>
                <Form.Label className="text-header-caps mb-1">Store Name</Form.Label>
                <InputField name="store" error={formErrors.store} fieldRef={storeField} />
              </Col>

              <Col md={6}>
                <Form.Label className="text-header-caps mb-1">Notes</Form.Label>
                <InputField name="notes" error={formErrors.notes} fieldRef={notesField} />
              </Col>

              <Col md={2}>
                 <div style={{ marginTop: '28px' }}>
                  <Form.Check
                      type="switch"
                      id="organic-switch"
                      label="Organic"
                      defaultChecked={item.is_organic}
                      ref={organicField}
                      className="fw-bold text-success"
                  />
                 </div>
              </Col>
            </Row>

            <button type="submit" style={{ display: 'none' }}></button>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 px-4 pb-4 justify-content-between">
        <Button
            variant="light"
            className="bg-surface text-danger border rounded-pill px-3"
            onClick={handleDelete}
        >
          <i className="bi bi-trash me-2"></i>Delete
        </Button>

        <div className="d-flex gap-2">
          {/* text-muted maps to #94A3B8 in dark mode (readable) */}
          <Button variant="light" onClick={handleClose} className="bg-surface rounded-pill px-4 text-body">
             Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4 fw-bold">
             Save Changes
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
