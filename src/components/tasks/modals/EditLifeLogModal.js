import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, Tabs, Tab, Row, Col, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import InputField from '../../InputField';
import LoadingState from '../../common/LoadingState';

export default function EditLifeLogModal({ itemId, show, handleClose, onUpdate, onDelete }) {
  const api = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const nameField = useRef();

  // Basic Fields
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  // --- Advanced Tracking Config State ---
  const [enableQuantity, setEnableQuantity] = useState(false);
  const [qtyLabel, setQtyLabel] = useState('Amount');
  const [qtyUnit, setQtyUnit] = useState('');

  const [enableRating, setEnableRating] = useState(false);
  const [ratingLabel, setRatingLabel] = useState('Severity');
  const [ratingMode, setRatingMode] = useState('single');

  const [enableText, setEnableText] = useState(false);
  const [textLabel, setTextLabel] = useState('Details');

  // Load Data
  useEffect(() => {
    if (itemId && show) {
      setIsLoading(true);
      setError(null);
      api.get(`/lifelogs/${itemId}`).then(response => {
        if (response.ok) {
          const log = response.body;
          setName(log.name);
          setNotes(log.notes || '');

          const config = log.schema_config || {};

          setEnableQuantity(!!config.quantity_label);
          setQtyLabel(config.quantity_label || 'Amount');
          setQtyUnit(config.quantity_unit || '');

          setEnableRating(!!config.metric_label);
          setRatingLabel(config.metric_label || 'Severity');
          setRatingMode(config.rating_mode || 'single');

          setEnableText(!!config.text_label);
          setTextLabel(config.text_label || 'Details');
        } else {
          setError("Failed to load details");
        }
        setIsLoading(false);
      });
    }
  }, [itemId, show, api]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Build Config JSON
    const newConfig = {};
    if (enableQuantity) {
        newConfig.quantity_label = qtyLabel;
        newConfig.quantity_unit = qtyUnit;
    }
    if (enableRating) {
        newConfig.metric_label = ratingLabel;
        newConfig.rating_mode = ratingMode;
    }
    if (enableText) {
        newConfig.text_label = textLabel;
    }

    const payload = {
      name,
      notes,
      schema_config: newConfig
    };

    const response = await api.put(`/lifelogs/${itemId}`, payload);
    if (response.ok) {
      onUpdate(response.body);
      handleClose();
    } else {
      setError("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Permanently delete this LifeLog? History will be lost.")) {
      const response = await api.delete(`/lifelogs/${itemId}`);
      if (response.ok) {
        onDelete(itemId);
        handleClose();
      } else {
        setError("Failed to delete log.");
      }
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-primary">Edit LifeLog</Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {isLoading ? (
          <LoadingState message="Loading details..." />
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger" className="rounded-3 border-0 shadow-sm">{error}</Alert>}

            <Tabs defaultActiveKey="basic" id="edit-lifelog-tabs" variant="pills" className="mb-3">

              {/* TAB 1: BASIC INFO */}
              <Tab eventKey="basic" title="Basic Info">
                <InputField
                    name="name" label="Name"
                    value={name} onChange={(e) => setName(e.target.value)}
                    fieldRef={nameField}
                />
                <InputField
                    name="notes" label="Default Notes" as="textarea" rows={2}
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                />
              </Tab>

              {/* TAB 2: TRACKING CONFIG */}
              <Tab eventKey="tracking" title="Tracking Config">
                {/* FIX 1: Changed bg-body-secondary to bg-transparent + border.
                    This ensures the white text is visible against the dark modal background. */}
                <div className="bg-transparent p-3 rounded-4 border border-secondary-subtle">

                  {/* FIX 2: Removed text-muted, used opacity-75 for better visibility */}
                  <p className="small mb-3 opacity-75">
                    Define what data to capture (e.g. mg of Caffeine, 1-10 Headache).
                  </p>

                  {/* Quantity */}
                  <div className="mb-3 pb-3 border-bottom border-secondary-subtle">
                    <Form.Check
                        type="switch" id="ll-track-qty"
                        label={<strong>Track Quantity (Numbers)</strong>}
                        checked={enableQuantity} onChange={(e) => setEnableQuantity(e.target.checked)}
                        className="mb-2"
                    />
                    {enableQuantity && (
                        <Row className="g-2 ps-4">
                            <Col xs={8}>
                                {/* FIX 3: Inputs use bg-body (Dark) to contrast with transparent container */}
                                <Form.Control size="sm" placeholder="Label (e.g. Dosage)" value={qtyLabel} onChange={e => setQtyLabel(e.target.value)} className="bg-body border-0 shadow-sm" />
                            </Col>
                            <Col xs={4}>
                                <Form.Control size="sm" placeholder="Unit (e.g. mg)" value={qtyUnit} onChange={e => setQtyUnit(e.target.value)} className="bg-body border-0 shadow-sm" />
                            </Col>
                        </Row>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mb-3 pb-3 border-bottom border-secondary-subtle">
                    <Form.Check
                        type="switch" id="ll-track-rating"
                        label={<strong>Track Rating (1-10)</strong>}
                        checked={enableRating} onChange={(e) => setEnableRating(e.target.checked)}
                        className="mb-2"
                    />
                    {enableRating && (
                        <div className="ps-4">
                            <Form.Control size="sm" placeholder="Label (e.g. Severity)" value={ratingLabel} onChange={e => setRatingLabel(e.target.value)} className="bg-body border-0 shadow-sm mb-2" />
                            <Form.Select size="sm" value={ratingMode} onChange={e => setRatingMode(e.target.value)} className="bg-body border-0 shadow-sm">
                                <option value="single">Single Value</option>
                                <option value="before_after">Before & After</option>
                            </Form.Select>
                        </div>
                    )}
                  </div>

                  {/* Text */}
                  <div>
                    <Form.Check
                        type="switch" id="ll-track-text"
                        label={<strong>Track Details (Text)</strong>}
                        checked={enableText} onChange={(e) => setEnableText(e.target.checked)}
                        className="mb-2"
                    />
                    {enableText && (
                        <div className="ps-4">
                             <Form.Control size="sm" placeholder="Prompt (e.g. Symptoms?)" value={textLabel} onChange={e => setTextLabel(e.target.value)} className="bg-body border-0 shadow-sm" />
                        </div>
                    )}
                  </div>
                </div>
              </Tab>
            </Tabs>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 px-4 pb-4 justify-content-between">
         <Button variant="light" className="text-danger bg-surface border rounded-pill px-3" onClick={handleDelete}>
            <i className="bi bi-trash me-2"></i>Delete
         </Button>
         <div className="d-flex gap-2">
            <Button variant="light" onClick={handleClose} className="bg-surface text-body border rounded-pill px-4">Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} className="rounded-pill border px-4 fw-bold">Save Changes</Button>
         </div>
      </Modal.Footer>
    </Modal>
  );
}
