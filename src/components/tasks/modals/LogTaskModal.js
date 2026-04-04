import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function LogTaskModal({ show, onHide, onSave, task }) {
  const [formData, setFormData] = useState({});
  const config = task?.schema_config || {};

  useEffect(() => {
    if (show) {
      setFormData({ rating_single: 5, rating_start: 5, rating_end: 5, quantity: '', text: '' });
    }
  }, [show, task]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const cleanData = {};
    if (config.quantity_label) cleanData.quantity = formData.quantity;
    if (config.text_label) cleanData.text = formData.text;

    if (config.metric_label) {
      if (config.rating_mode === 'before_after') {
        cleanData.rating_start = formData.rating_start;
        cleanData.rating_end = formData.rating_end;
      } else {
        cleanData.rating_single = formData.rating_single;
      }
    }
    onSave(cleanData);
    onHide();
  };

  if (!task) return null;

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold text-primary">Log Activity</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        <h5 className="text-center mb-4">{task.name}</h5>
        <Form>
          {/* Quantity */}
          {config.quantity_label && (
            <Form.Group className="mb-4 bg-light p-3 rounded-4">
              <Form.Label className="fw-bold small text-body text-uppercase">{config.quantity_label}</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="number" placeholder="0"
                  value={formData.quantity} onChange={(e) => handleChange('quantity', e.target.value)}
                  autoFocus className="fs-4 border-0 bg-white shadow-sm" style={{maxWidth: '120px'}}
                />
                {config.quantity_unit && <span className="ms-3 text-body fw-bold">{config.quantity_unit}</span>}
              </div>
            </Form.Group>
          )}

          {/* Ratings */}
          {config.metric_label && (
            <div className="mb-4">
              <Form.Label className="fw-bold small text-body text-uppercase">{config.metric_label}</Form.Label>
              {config.rating_mode === 'single' ? (
                <div className="px-2">
                    <div className="d-flex justify-content-between mb-1 small text-body"><span>Low</span><span className="text-primary fw-bold fs-5">{formData.rating_single}</span><span>High</span></div>
                    <Form.Range min={1} max={10} value={formData.rating_single} onChange={(e) => handleChange('rating_single', Number(e.target.value))} />
                </div>
              ) : (
                <div className="bg-surface p-3 rounded-4">
                    <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1 small text-body"><span>Before</span><span className="fw-bold">{formData.rating_start}</span></div>
                        <Form.Range min={1} max={10} value={formData.rating_start} onChange={(e) => handleChange('rating_start', Number(e.target.value))} />
                    </div>
                    <div>
                        <div className="d-flex justify-content-between mb-1 small text-body"><span>After</span><span className="fw-bold text-success">{formData.rating_end}</span></div>
                        <Form.Range min={1} max={10} value={formData.rating_end} onChange={(e) => handleChange('rating_end', Number(e.target.value))} />
                    </div>
                </div>
              )}
            </div>
          )}

          {/* Text */}
          {config.text_label && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-body text-uppercase">{config.text_label}</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="Details..." value={formData.text} onChange={(e) => handleChange('text', e.target.value)} />
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4">
        <Button variant="secondary" onClick={onHide} className="rounded-pill px-4">Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4 fw-bold">Save Log</Button>
      </Modal.Footer>
    </Modal>
  );
}
