import { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import { useFlash } from '../../../contexts/FlashProvider';
import InputField from '../../InputField';

export default function EditHistoryModal({ log, show, handleClose, onUpdate }) {
  const [formErrors, setFormErrors] = useState({});
  const [metaData, setMetaData] = useState({});

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const flash = useFlash();
  const api = useApi();

  const isTask = log?.habit_name !== undefined;
  const title = isTask ? log?.habit_name : log?.log_name;

  useEffect(() => {
    if (show && log) {
        let initialDate = '';
        let initialTime = '';

        if (log.date_str && log.time_str) {
            initialDate = log.date_str;
            initialTime = log.time_str;
        }
        else if (log.date && log.date.includes('T')) {
            const parts = log.date.split('T');
            initialDate = parts[0];
            if (parts[1]) {
                initialTime = parts[1].substring(0, 5);
            }
        }
        else {
             initialDate = log.date || '';
             initialTime = log.time || '';
        }

        setDate(initialDate);
        setTime(initialTime);
        setNotes(log.notes || '');
        setMetaData(log.meta_data || {});
    }
    setFormErrors({});
  }, [show, log]);

  const handleMetaChange = (key, value) => {
    setMetaData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormErrors({});

    const combinedDate = `${date} ${time}`;
    const endpoint = isTask ? `/habits/log/${log.id}` : `/lifelogs/log/${log.id}`;

    const response = await api.put(endpoint, {
      date: combinedDate,
      notes: notes,
      meta_data: metaData,
    });

    if (response.ok) {
      flash('Log updated successfully', 'success');
      if (onUpdate) onUpdate(response.body);
      handleClose();
    } else {
      if (response.body.errors) {
        setFormErrors(response.body.errors.json);
      } else {
        setFormErrors({ form: 'Failed to update log.' });
      }
    }
  };

  if (!log) return null;

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-primary">Edit Log: {title}</Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
          <Form onSubmit={handleSubmit}>
            {formErrors.form && <Alert variant="danger">{formErrors.form}</Alert>}

            <Row className="g-2 mb-3">
              <Col xs={7}>
                <InputField
                    name="date" label="Date" type="date"
                    value={date} onChange={(e) => setDate(e.target.value)}
                    error={formErrors.date}
                />
              </Col>
              <Col xs={5}>
                <InputField
                    name="time" label="Time" type="time"
                    value={time} onChange={(e) => setTime(e.target.value)}
                    error={formErrors.time}
                />
              </Col>
            </Row>

            {/* Dynamic Metadata Section */}
            {Object.keys(metaData).length > 0 && (
                // FIX 1: Changed bg-light to bg-body-tertiary (Adaptive dark gray)
                // This makes the white text labels visible.
                <div className="mb-3 bg-surface p-3 rounded-4 border">
                    <h6 className="small text-body mb-2 text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Log Details</h6>
                    <Row className="g-2">
                        {Object.entries(metaData).map(([key, val]) => (
                            <Col key={key} xs={6}>
                                <Form.Label className="small text-capitalize mb-1 text-truncate w-100" title={key.replace(/_/g, ' ')}>
                                    {key.replace(/_/g, ' ')}
                                </Form.Label>
                                <Form.Control
                                    size="sm"
                                    type={typeof val === 'number' ? "number" : "text"}
                                    value={val}
                                    onChange={(e) => {
                                        const newVal = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                                        handleMetaChange(key, newVal);
                                    }}
                                    // FIX 2: REMOVED 'bg-white'.
                                    // Now it uses the standard dark input style from your CSS.
                                    className="border shadow-sm"
                                />
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            <InputField
                name="notes" label="Notes" as="textarea" rows={3}
                value={notes} onChange={(e) => setNotes(e.target.value)}
                error={formErrors.notes}
                placeholder="Optional notes..."
            />

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="bg-surface text-body border rounded-pill px-4">Cancel</Button>
              <Button type="submit" variant="primary" className="rounded-pill border px-4 fw-bold">Save Changes</Button>
            </div>
          </Form>
      </Modal.Body>
    </Modal>
  );
}
