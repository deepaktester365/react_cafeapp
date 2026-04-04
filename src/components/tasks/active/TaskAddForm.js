import { useState, useRef } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import InputField from '../../InputField';
import { useApi } from '../../../contexts/ApiProvider';

export default function TaskAddForm({ onAdd }) {
  const api = useApi();
  const nameField = useRef();

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [repeats, setRepeats] = useState(1);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const response = await api.post('/habits', {
      name: name,
      frequency: frequency,
      repeats: frequency === 'Misc' ? 0 : parseInt(repeats)
    });

    if (response.ok) {
      onAdd(response.body);
      // Reset Form
      setName('');
      setFrequency('Daily');
      setRepeats(1);
      if (nameField.current) nameField.current.focus();
    } else {
      if (response.body.errors) {
        setErrors(response.body.errors.json);
      } else {
        setErrors({ name: 'Failed to create task' });
      }
    }
  };

  return (
    // FIX: Removed 'bg-white'. The 'card' class handles Dark Mode via index.css
    <div className="card shadow-sm border-0 p-3 mb-4 rounded-4">
      <Form onSubmit={handleSubmit}>
        <Row className="g-2">
            {/* Name */}
            <Col xs={12} md={5}>
                <Form.Label className="text-header-caps mb-1">Task Name</Form.Label>
                <InputField
                    name="name"
                    placeholder="e.g. Read 10 Pages"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    fieldRef={nameField}
                />
            </Col>

            {/* Frequency */}
            <Col xs={6} md={3}>
                <Form.Label className="text-header-caps mb-1">Frequency</Form.Label>
                <InputField
                    name="frequency" type="select"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Misc">Misc (Counter)</option>
                </InputField>
            </Col>

            {/* Target Count */}
            <Col xs={4} md={2}>
                <Form.Label className="text-header-caps mb-1">Target</Form.Label>
                <InputField
                    name="repeats" type="number" min="1"
                    value={repeats}
                    onChange={(e) => setRepeats(e.target.value)}
                    disabled={frequency === 'Misc'}
                />
            </Col>

            {/* Add Button */}
            <Col xs={2} md={2} className="d-grid">
                <Form.Label className="text-header-caps mb-1 opacity-0 d-none d-md-block">&nbsp;</Form.Label>
                <div className="mb-3">
                    <Button variant="primary" type="submit" className="w-100 rounded-pill">
                        <i className="bi bi-plus-lg"></i>
                    </Button>
                </div>
            </Col>
        </Row>
      </Form>
    </div>
  );
}
