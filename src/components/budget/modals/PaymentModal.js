import { useState, useRef, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import InputField from '../../InputField';

export default function PaymentModal({ show, handleClose, onSuccess }) {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [error, setError] = useState(null);
  const api = useApi();

  const fromRef = useRef();
  const toRef = useRef();
  const amountRef = useRef();
  const dateRef = useRef();
  const notesRef = useRef();

  useEffect(() => {
    if (show) {
      (async () => {
        const res = await api.get('/budget/accounts');
        if (res.ok) {
          setBankAccounts(res.body.items.filter(a => a.account_type === 'Bank Account'));
          setCreditCards(res.body.items.filter(a => a.account_type === 'Credit Card'));
        }
      })();
    }
  }, [show, api]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const fromId = fromRef.current.value;
    const toId = toRef.current.value;
    const cardName = creditCards.find(c => c.id.toString() === toId)?.name || 'Credit Card';

    const response = await api.post('/budget/transfers', {
      from_account_id: fromId,
      to_account_id: toId,
      amount: amountRef.current.value,
      date: dateRef.current.value,
      notes: notesRef.current.value || `Payment for ${cardName}`
    });

    if (response.ok) {
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      setError(response.body.message || "Payment failed");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 px-4 pt-4 bg-success-subtle rounded-top-4">
        <Modal.Title className="fw-bold text-success-emphasis">Record Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4 pt-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {(creditCards.length === 0 || bankAccounts.length === 0) && (
            <Alert variant="warning">You need both a Bank Account and a Credit Card to use this feature.</Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <div className="bg-surface p-3 rounded-4 mb-4 border">
              <Row className="g-3 align-items-center">
                  <Col xs={12}>
                      <InputField type="select" label="Pay From (Bank)" ref={fromRef} disabled={bankAccounts.length === 0} className="rounded-3 shadow-sm border">
                        {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(2)})</option>)}
                      </InputField>
                  </Col>
                  <Col xs={12} className="text-center my-n2" style={{zIndex: 1}}>
                      <div className="bg-transparent rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center border" style={{width: '32px', height: '32px'}}>
                          <i className="bi bi-arrow-down text-body"></i>
                      </div>
                  </Col>
                  <Col xs={12} className="mt-n2">
                      <InputField type="select" label="Pay To (Card)" ref={toRef} disabled={creditCards.length === 0} className="rounded-3 shadow-sm border">
                        {creditCards.map(a => <option key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(2)})</option>)}
                      </InputField>
                  </Col>
              </Row>
          </div>

          <Row className="g-3 mb-3">
            <Col><InputField name="date" type="date" label="Date" fieldRef={dateRef} defaultValue={new Date().toISOString().split('T')[0]} /></Col>
            <Col><InputField name="amount" type="number" step="0.01" label="Amount" fieldRef={amountRef} placeholder="0.00" className="fw-bold" /></Col>
          </Row>

          <InputField name="notes" label="Notes" fieldRef={notesRef} placeholder="Defaults to 'Payment for...'" />
          
          <div className="d-grid mt-4">
            <Button variant="success" type="submit" className="rounded-pill fw-bold" disabled={creditCards.length === 0 || bankAccounts.length === 0}>
              Record Payment
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
