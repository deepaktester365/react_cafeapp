import { useState } from 'react';
import { Modal, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';

export default function CreateBucketModal({ show, onHide, categoryId, onSuccess }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoan, setIsLoan] = useState(false);
  const [totalDebt, setTotalDebt] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [dayOfWeek, setDayOfWeek] = useState('Friday');
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      category_id: categoryId,
      goal: parseFloat(amount),
      total_debt: isLoan ? parseFloat(totalDebt) : 0,
      frequency,
      day_of_week: frequency === 'Weekly' ? dayOfWeek : null
    };

    const res = await api.post('/budget/buckets', payload);
    setLoading(false);

    if (res.ok) {
      onSuccess();
      handleClose();
    } else {
      alert("Failed to create bucket");
    }
  };

  const handleClose = () => {
    setName('');
    setAmount('');
    setFrequency('Monthly');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">New Budget Bucket</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Bucket Name</Form.Label>
            <Form.Control
              autoFocus
              type="text"
              placeholder="e.g., Groceries, Rent"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="bg-surface text-body"
            />
            <Form.Check
                type="switch"
                id="loan-switch"
                label="Is this a Loan?"
                checked={isLoan}
                onChange={(e) => setIsLoan(e.target.checked)}
                className="mb-3"
            />
          </Form.Group>

          <Row className="g-3 mb-3">
            <Col sm={6}>
              <Form.Label>Goal Amount</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-body-tertiary border-end-0">$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  className="bg-surface border-start-0 text-body"
                />
              </InputGroup>
            </Col>
            <Col sm={6}>
              <Form.Label>Frequency</Form.Label>
              <Form.Select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="bg-surface text-body"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </Form.Select>
            </Col>
          </Row>

          {frequency === 'Weekly' && (
            <div className="p-3 bg-body-tertiary rounded-3 mb-3 border">
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">Reset Day</Form.Label>
                <Form.Select
                  size="sm"
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value)}
                  className="bg-surface text-body"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday (Recommended)</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </Form.Select>
                <Form.Text className="text-muted small">
                  The monthly target will be calculated based on how many {dayOfWeek}s are in the month.
                </Form.Text>
              </Form.Group>
            </div>
          )}
          {isLoan && (
              <div className="p-3 bg-danger-subtle rounded-3 mb-3 border border-danger-subtle">
                  <Form.Label className="text-danger fw-bold">Total Principal Owed</Form.Label>
                  <InputGroup>
                      <InputGroup.Text className="bg-transparent border-danger-subtle text-danger">$</InputGroup.Text>
                      <Form.Control
                          type="number"
                          value={totalDebt}
                          onChange={e => setTotalDebt(e.target.value)}
                          className="bg-transparent border-danger-subtle text-danger"
                          placeholder="Total amount borrowed"
                      />
                  </InputGroup>
                  <Form.Text className="text-muted small">
                      We will track your payments against this amount.
                  </Form.Text>
              </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="link" onClick={handleClose} className="text-decoration-none text-muted">Cancel</Button>
          <Button variant="primary" type="submit" disabled={!name || !amount || loading}>
            {loading ? 'Creating...' : 'Create Bucket'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
