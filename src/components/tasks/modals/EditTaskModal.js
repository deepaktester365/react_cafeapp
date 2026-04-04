import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Row, Col, Button, Tabs, Tab, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import { useFlash } from '../../../contexts/FlashProvider';
import InputField from '../../InputField';
import LoadingState from '../../common/LoadingState';

export default function EditTaskModal({ itemId, show, handleClose, onUpdate, onDelete }) {
  const api = useApi();
  const flash = useFlash();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const nameField = useRef();

  // Standard Fields
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [repeats, setRepeats] = useState(1);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Advanced Config State
  const [enableQuantity, setEnableQuantity] = useState(false);
  const [qtyLabel, setQtyLabel] = useState('Pages Read');
  const [qtyUnit, setQtyUnit] = useState('pages');

  const [enableRating, setEnableRating] = useState(false);
  const [ratingLabel, setRatingLabel] = useState('Quality');
  const [ratingMode, setRatingMode] = useState('single');

  const [enableText, setEnableText] = useState(false);
  const [textLabel, setTextLabel] = useState('Notes');

  // Load Data
  useEffect(() => {
    if (itemId && show) {
      setIsLoading(true);
      setError(null);
      api.get(`/habits/${itemId}`).then(response => {
        if (response.ok) {
          const task = response.body;
          setName(task.name);
          setFrequency(task.frequency);
          setRepeats(task.repeats || 1);
          setNotes(task.notes || '');
          setIsActive(task.status);

          const config = task.schema_config || {};
          setEnableQuantity(!!config.quantity_label);
          setQtyLabel(config.quantity_label || 'Pages Read');
          setQtyUnit(config.quantity_unit || 'pages');

          setEnableRating(!!config.metric_label);
          setRatingLabel(config.metric_label || 'Quality');
          setRatingMode(config.rating_mode || 'single');

          setEnableText(!!config.text_label);
          setTextLabel(config.text_label || 'Notes');
        } else {
          setError("Failed to load task details");
        }
        setIsLoading(false);
      });
    }
  }, [itemId, show, api]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
      frequency,
      repeats: frequency === 'Misc' ? 0 : parseInt(repeats),
      notes,
      schema_config: newConfig
    };

    const response = await api.put(`/habits/${itemId}`, payload);
    if (response.ok) {
      flash('Task updated successfully', 'success');
      onUpdate(response.body);
      handleClose();
    } else {
      setError("Failed to update task");
    }
  };

  const handleArchive = async () => {
    const action = isActive ? "archive" : "restore";
    if (window.confirm(`Are you sure you want to ${action} this task?`)) {
        const response = await api.put(`/habits/archive/${itemId}`);
        if (response.ok) {
            onUpdate(response.body);
            handleClose();
        } else {
            setError("Failed to change status");
        }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this task?")) return;
    const response = await api.delete(`/habits/${itemId}`);
    if (response.ok) {
        onDelete(itemId);
        handleClose();
    } else {
        setError("Failed to delete. Try archiving first.");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-primary">
            Edit Task {isActive ? "" : <span className="text-muted fw-normal fs-6">(Archived)</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        {isLoading ? <LoadingState message="Loading details..." /> : (
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger" className="rounded-3 border-0 shadow-sm">{error}</Alert>}

            <Tabs defaultActiveKey="basic" id="edit-task-tabs" variant="pills" className="mb-3">

              {/* TAB 1: BASIC INFO */}
              <Tab eventKey="basic" title="Basic Info">
                <InputField name="name" label="Task Name" value={name} onChange={e => setName(e.target.value)} fieldRef={nameField} />

                <Row>
                    <Col xs={12} md={8}>
                        <InputField name="frequency" type="select" label="Frequency" value={frequency} onChange={e => setFrequency(e.target.value)}>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Yearly">Yearly</option>
                            <option value="Misc">Misc (Optional)</option>
                        </InputField>
                    </Col>
                    <Col xs={12} md={4}>
                        <InputField
                            name="repeats" type="number" label="Target" min="1"
                            value={repeats} onChange={e => setRepeats(e.target.value)}
                            disabled={frequency === 'Misc'}
                            placeholder={frequency === 'Misc' ? "N/A" : "1"}
                        />
                    </Col>
                </Row>

                <InputField name="notes" label="Notes" as="textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </Tab>

              {/* TAB 2: ADVANCED TRACKING */}
              <Tab eventKey="tracking" title="Advanced">
                {/* FIX: Removed 'bg-body-secondary'.
                    Used 'bg-transparent' + 'border-secondary-subtle'.
                    This ensures the dark modal background shows through, making white text visible. */}
                <div className="bg-transparent p-3 rounded-4 border border-secondary-subtle">

                  <p className="small mb-3 text-secondary">
                    Add extra data fields to this task (e.g. pages read, mood rating).
                  </p>

                  {/* Quantity Switch */}
                  <div className="mb-3 pb-3 border-bottom border-secondary-subtle">
                    <Form.Check type="switch" id="tk-qty" label={<strong>Track Quantity</strong>} checked={enableQuantity} onChange={e => setEnableQuantity(e.target.checked)} className="mb-2" />
                    {enableQuantity && (
                        <Row className="g-2 ps-4">
                            <Col>
                                {/* Input Fix: Using standard styles which should resolve to dark in your theme */}
                                <Form.Control size="sm" placeholder="Label (e.g. Pages)" value={qtyLabel} onChange={e => setQtyLabel(e.target.value)} className="shadow-sm" />
                            </Col>
                            <Col>
                                <Form.Control size="sm" placeholder="Unit (e.g. pgs)" value={qtyUnit} onChange={e => setQtyUnit(e.target.value)} className="shadow-sm" />
                            </Col>
                        </Row>
                    )}
                  </div>

                  {/* Rating Switch */}
                  <div className="mb-3 pb-3 border-bottom border-secondary-subtle">
                    <Form.Check type="switch" id="tk-rating" label={<strong>Track Rating (1-10)</strong>} checked={enableRating} onChange={e => setEnableRating(e.target.checked)} className="mb-2" />
                    {enableRating && (
                        <div className="ps-4">
                            <Form.Control size="sm" placeholder="Label (e.g. Focus)" value={ratingLabel} onChange={e => setRatingLabel(e.target.value)} className="mb-2 shadow-sm" />
                            <Form.Select size="sm" value={ratingMode} onChange={e => setRatingMode(e.target.value)} className="shadow-sm">
                                <option value="single">Single Value</option>
                                <option value="before_after">Before & After</option>
                            </Form.Select>
                        </div>
                    )}
                  </div>

                   {/* Text Switch */}
                   <div>
                    <Form.Check type="switch" id="tk-text" label={<strong>Track Details</strong>} checked={enableText} onChange={e => setEnableText(e.target.checked)} className="mb-2" />
                    {enableText && (
                        <div className="ps-4">
                            <Form.Control size="sm" placeholder="Prompt (e.g. Comments)" value={textLabel} onChange={e => setTextLabel(e.target.value)} className="shadow-sm" />
                        </div>
                    )}
                  </div>
                </div>
              </Tab>
            </Tabs>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4 pt-0 justify-content-between">
        <div>
            {isActive ? (
                <Button variant="light" className="text-danger bg-surface border rounded-pill px-3" onClick={handleArchive}>
                    <i className="bi bi-archive me-2"></i>Archive
                </Button>
            ) : (
                <>
                    <Button variant="light" className="text-danger border-0 rounded-pill px-3 me-2" onClick={handleDelete}>Delete</Button>
                    <Button variant="light" className="text-success border-0 rounded-pill px-3" onClick={handleArchive}>Restore</Button>
                </>
            )}
        </div>
        <div className="d-flex gap-2">
            <Button variant="light" onClick={handleClose} className="bg-surface text-body border rounded-pill px-4">Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4 border fw-bold">Save Changes</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
