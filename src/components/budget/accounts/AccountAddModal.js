import { useState, useRef, useEffect } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import InputField from '../../InputField'; 
import { useApi } from '../../../contexts/ApiProvider';
import { useFlash } from '../../../contexts/FlashProvider';

export default function AccountAddModal({ show, handleClose, onAccountAdded }) {
  const [formErrors, setFormErrors] = useState({});
  const api = useApi();
  const flash = useFlash();

  // Refs
  const nameField = useRef();
  const typeField = useRef();
  const balanceField = useRef();
  const dateField = useRef();

  useEffect(() => {
    if (show) setFormErrors({});
  }, [show]);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const response = await api.post("/budget/accounts", {
      name: nameField.current.value,
      account_type: typeField.current.value,
      starting_balance: parseFloat(balanceField.current.value) || 0,
      current_balance: parseFloat(balanceField.current.value) || 0,
      starting_date: dateField.current.value,
    });

    if (response.ok) {
      flash('Account created!', 'success');
      onAccountAdded(response.body);
      handleClose();
    } else if (response.body.errors) {
      setFormErrors(response.body.errors.json);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <Modal.Title className="fw-bold text-primary">Add New Account</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        <Form onSubmit={onSubmit}>
            <Row className="g-3 mb-3">
                <Col md={8}>
                    <InputField name="name" label="Account Name" placeholder="e.g. Chase Sapphire"
                        error={formErrors.name} fieldRef={nameField} autoFocus />
                </Col>
                <Col md={4}>
                    <InputField name="account_type" type="select" label="Type" error={formErrors.account_type} fieldRef={typeField}>
                        <option value="Bank Account">Bank Account</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Digital Bank Account">Digital Wallet</option>
                        <option value="Home Bank Account">Cash / Home</option>
                        <option value="Credit Line">Credit Line</option>
                        <option value="FSA Account">FSA / HSA</option>
                        <option value="Travel Credit">Travel Credit</option>
                    </InputField>
                </Col>
            </Row>
            
            <div className="bg-surface p-3 rounded-4 mb-4 border">
                <h6 className="text-header-caps text-body mb-3">Initial Status</h6>
                <Row className="g-3">
                    <Col md={6}>
                        <InputField name="starting_date" type="date" label="Start Date"
                            error={formErrors.starting_date} fieldRef={dateField} defaultValue={new Date().toISOString().split('T')[0]} />
                    </Col>
                    <Col md={6}>
                        <InputField name="balance" type="number" step="0.01" label="Starting Balance" placeholder="0.00"
                            error={formErrors.starting_balance} fieldRef={balanceField} />
                    </Col>
                </Row>
            </div>

            <div className="d-flex justify-content-end gap-2">
                <Button variant="light" onClick={handleClose} className="rounded-pill px-4">Cancel</Button>
                <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold">Create Account</Button>
            </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
