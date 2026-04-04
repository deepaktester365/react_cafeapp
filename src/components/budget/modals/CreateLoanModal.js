import { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';

export default function CreateLoanModal({ show, onHide, onSuccess }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);

  // Loan Specifics
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [lender, setLender] = useState('');

  const [loading, setLoading] = useState(false);
  const api = useApi();

  // 1. Fetch Categories for the Dropdown
  useEffect(() => {
    if (show) {
        (async () => {
            const res = await api.get('/budget/categories');
            if (res.ok) {
                setCategories(res.body.items);
                // Auto-select first category if available
                if (res.body.items.length > 0 && !categoryId) {
                    setCategoryId(res.body.items[0].id);
                }
            }
        })();
    }
  }, [show, api]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      category_id: categoryId,
      goal: parseFloat(minPayment) || 0, // Set the "Bucket Goal" to min payment
      is_loan: true,
      loan_details: {
          original_principal: parseFloat(principal),
          interest_rate: parseFloat(interestRate) || 0,
          min_payment: parseFloat(minPayment) || 0,
          start_date: startDate,
          lender_name: lender
      }
    };

    const res = await api.post('/budget/buckets', payload);
    setLoading(false);

    if (res.ok) {
      onSuccess();
      handleClose();
    } else {
      alert("Failed to create loan");
    }
  };

  const handleClose = () => {
    setName('');
    setPrincipal('');
    setInterestRate('');
    setMinPayment('');
    setLender('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">Add New Loan</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            {/* --- Basic Info --- */}
            <Col md={6}>
                <Form.Group>
                    <Form.Label>Loan Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="e.g., Student Loan A"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="bg-surface text-body"
                    />
                </Form.Group>
            </Col>
            <Col md={6}>
                <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="bg-surface text-body"
                        required
                    >
                        <option value="" disabled>Select a Category...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Col>

            <Col md={6}>
                <Form.Group>
                    <Form.Label>Lender / Bank (Optional)</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="e.g., Chase, Navient"
                        value={lender}
                        onChange={e => setLender(e.target.value)}
                        className="bg-surface text-body"
                    />
                </Form.Group>
            </Col>

             <Col md={6}>
                <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        required
                        className="bg-surface text-body"
                    />
                </Form.Group>
            </Col>

            <Col md={12}><hr className="my-2 border-secondary-subtle opacity-25" /></Col>

            {/* --- Financial Details --- */}
            <Col md={4}>
                <Form.Label className="fw-bold text-primary">Total Principal</Form.Label>
                <InputGroup>
                    <InputGroup.Text className="bg-body-tertiary border-end-0">$</InputGroup.Text>
                    <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={principal}
                        onChange={e => setPrincipal(e.target.value)}
                        required
                        className="bg-surface border-start-0 text-body fw-bold"
                    />
                </InputGroup>
                <Form.Text className="text-muted small">Original amount borrowed</Form.Text>
            </Col>

            <Col md={4}>
                <Form.Label>Interest Rate (APR)</Form.Label>
                <InputGroup>
                    <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={interestRate}
                        onChange={e => setInterestRate(e.target.value)}
                        className="bg-surface border-end-0 text-body"
                    />
                    <InputGroup.Text className="bg-body-tertiary border-start-0">%</InputGroup.Text>
                </InputGroup>
            </Col>

            <Col md={4}>
                <Form.Label>Minimum Payment</Form.Label>
                <InputGroup>
                    <InputGroup.Text className="bg-body-tertiary border-end-0">$</InputGroup.Text>
                    <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={minPayment}
                        onChange={e => setMinPayment(e.target.value)}
                        className="bg-surface border-start-0 text-body"
                    />
                </InputGroup>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="link" onClick={handleClose} className="text-decoration-none text-muted">Cancel</Button>
          <Button variant="primary" type="submit" disabled={!name || !principal || loading}>
            {loading ? 'Adding Loan...' : 'Add Loan'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
