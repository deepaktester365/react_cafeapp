import { useState, useRef } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import InputField from '../../InputField';
import { useApi } from '../../../contexts/ApiProvider';

export default function LogAddForm({ onAdd }) {
  const api = useApi();
  const nameField = useRef();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const response = await api.post('/lifelogs', {
      name: name,
      notes: notes
    });

    if (response.ok) {
      onAdd(response.body);
      setName('');
      setNotes('');
      if (nameField.current) nameField.current.focus();
    } else {
      if (response.body.errors) {
        setErrors(response.body.errors.json);
      } else {
        setErrors({ name: 'Failed to create log' });
      }
    }
  };

  return (
    // FIX: Removed 'bg-white'. The 'card' class now handles Dark Mode via index.css
    <div className="card shadow-sm border-0 p-3 mb-4 rounded-4">
      <Form onSubmit={handleSubmit}>
        <Row className="g-2">
            <Col xs={12} md={6}>
                <Form.Label className="text-header-caps mb-1">Log Name</Form.Label>
                <InputField
                    name="name"
                    placeholder="e.g. Headache, Caffeine"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    fieldRef={nameField}
                />
            </Col>

            <Col xs={10} md={4}>
                <Form.Label className="text-header-caps mb-1">Default Note</Form.Label>
                <InputField
                    name="notes"
                    placeholder="Optional details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </Col>

            <Col xs={2} md={2} className="d-grid">
                <Form.Label className="text-header-caps mb-1 opacity-0 d-none d-md-block">&nbsp;</Form.Label>
                <div className="mb-3">
                    <Button variant="success" type="submit" className="w-100 rounded-pill text-white">
                        <i className="bi bi-plus-lg"></i>
                    </Button>
                </div>
            </Col>
        </Row>
      </Form>
    </div>
  );
}
