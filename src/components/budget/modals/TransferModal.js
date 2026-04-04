import { useState, useRef, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import InputField from '../../InputField';

export default function TransferModal({ show, handleClose, onTransferSuccess }) {
  const [accounts, setAccounts] = useState([]);
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
        if (res.ok) setAccounts(res.body.items);
      })();
    }
  }, [show, api]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const fromId = fromRef.current.value;
    const toId = toRef.current.value;
    
    if (fromId === toId) {
      setError("Cannot transfer to the same account.");
      return;
    }

    const response = await api.post('/budget/transfers', {
      from_account_id: fromId,
      to_account_id: toId,
      amount: amountRef.current.value,
      date: dateRef.current.value,
      notes: notesRef.current.value
    });

    if (response.ok) {
      handleClose();
      if (onTransferSuccess) onTransferSuccess();
    } else {
      setError(response.body.message || "Transfer failed");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <Modal.Title className="fw-bold text-primary">Transfer Funds</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        {error && <Alert variant="danger" className="rounded-3 border-0">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <div className="bg-surface p-3 rounded-4 mb-4 border">
              <Row className="g-3 align-items-center">
                  <Col xs={12}>
                      <InputField type="select" label="From Account" ref={fromRef} disabled={accounts.length === 0} className="rounded-3 shadow-sm border">
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(2)})</option>)}
                      </InputField>
                  </Col>
                  <Col xs={12} className="text-center my-n2" style={{zIndex: 1}}>
                      <div className="bg-transparent rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center border" style={{width: '32px', height: '32px'}}>
                          <i className="bi bi-arrow-down text-body"></i>
                      </div>
                  </Col>
                  <Col xs={12} className="mt-n2">
                      <InputField type="select" label="To Account" ref={toRef} disabled={accounts.length === 0} className="rounded-3 shadow-sm border">
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(2)})</option>)}
                      </InputField>
                  </Col>
              </Row>
          </div>

          <Row className="g-3 mb-3">
            <Col md={6}><InputField name="date" type="date" label="Date" fieldRef={dateRef} defaultValue={new Date().toISOString().split('T')[0]} /></Col>
            <Col md={6}><InputField name="amount" type="number" step="0.01" label="Amount" fieldRef={amountRef} placeholder="0.00" className="fw-bold" /></Col>
          </Row>

          <InputField name="notes" label="Notes" fieldRef={notesRef} placeholder="Optional transfer details..." />
          
          <div className="d-grid mt-4">
            <Button variant="primary" type="submit" className="rounded-pill fw-bold">Complete Transfer</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
