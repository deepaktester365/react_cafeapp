import { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';

export default function EditLoanModal({ show, onHide, loan, onSuccess }) {
  const [name, setName] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi();

  // Load initial data when loan changes
  useEffect(() => {
    if (loan) {
      setName(loan.name);
      setTotalDebt(loan.total_debt);
      setInterestRate(loan.interest_rate || 0);
      setMinPayment(loan.min_payment || 0);
    }
  }, [loan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      total_debt: parseFloat(totalDebt),
      interest_rate: parseFloat(interestRate),
      min_payment: parseFloat(minPayment)
    };

    const res = await api.put(`/budget/buckets/${loan.id}`, payload);
    setLoading(false);

    if (res.ok) {
      onSuccess();
      onHide();
    } else {
      alert("Failed to update loan details");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">Edit Loan Details</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Loan Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="bg-surface text-body"
            />
          </Form.Group>

          <Row className="g-3">
            <Col md={12}>
                <Form.Label>Original Principal</Form.Label>
                <InputGroup>
                    <InputGroup.Text className="bg-body-tertiary border-end-0">$</InputGroup.Text>
                    <Form.Control
                        type="number"
                        step="0.01"
                        value={totalDebt}
                        onChange={e => setTotalDebt(e.target.value)}
                        className="bg-surface border-start-0 text-body"
                    />
                </InputGroup>
                <Form.Text className="text-muted small">The total amount you originally borrowed.</Form.Text>
            </Col>

            <Col md={6}>
                <Form.Label>Interest Rate (APR)</Form.Label>
                <InputGroup>
                    <Form.Control
                        type="number"
                        step="0.01"
                        value={interestRate}
                        onChange={e => setInterestRate(e.target.value)}
                        className="bg-surface border-end-0 text-body"
                    />
                    <InputGroup.Text className="bg-body-tertiary border-start-0">%</InputGroup.Text>
                </InputGroup>
            </Col>

            <Col md={6}>
                <Form.Label>Minimum Payment</Form.Label>
                <InputGroup>
                    <InputGroup.Text className="bg-body-tertiary border-end-0">$</InputGroup.Text>
                    <Form.Control
                        type="number"
                        step="0.01"
                        value={minPayment}
                        onChange={e => setMinPayment(e.target.value)}
                        className="bg-surface border-start-0 text-body"
                    />
                </InputGroup>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="link" onClick={onHide} className="text-decoration-none text-muted">Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
