import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import InputField from '../../InputField';
import { useFlash } from '../../../contexts/FlashProvider';
import LoadingState from '../../common/LoadingState';

export default function AccountEditModal({ accountId, show, handleClose, onUpdate, onDelete }) {
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [account, setAccount] = useState();
  const [loading, setLoading] = useState(false);
  
  const api = useApi();
  const flash = useFlash();

  // Refs
  const nameField = useRef();
  const typeField = useRef();
  const dateField = useRef();
  const descField = useRef();

  useEffect(() => {
    if (show && accountId) {
      setGeneralError(null);
      setFormErrors({});
      setLoading(true);
      api.get(`/budget/accounts/${accountId}`).then(res => {
        setLoading(false);
        if (res.ok) setAccount(res.body);
      });
    } else {
        setAccount(undefined);
    }
  }, [api, accountId, show]);

  // Sync refs
  useEffect(() => {
    if (account) {
      if (nameField.current) nameField.current.value = account.name;
      if (typeField.current) typeField.current.value = account.account_type;
      if (dateField.current) dateField.current.value = account.starting_date || '';
      if (descField.current) descField.current.value = account.description || '';
    }
  }, [account]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setGeneralError(null);
    const response = await api.put(`/budget/accounts/${accountId}`, {
      name: nameField.current.value,
      account_type: typeField.current.value,
      starting_date: dateField.current.value,
      description: descField.current.value,
    });

    if (response.ok) {
      flash('Account details updated.', 'success');
      if (onUpdate) onUpdate(response.body);
      handleClose();
    } else if (response.body.errors) {
      setFormErrors(response.body.errors.json);
    }
  };

  const handleDelete = async () => {
      if (!window.confirm("Delete this account? This cannot be undone.")) return;
      setGeneralError(null);
      const response = await api.delete(`/budget/accounts/${accountId}`);
      if (response.ok) {
          flash('Account deleted.', 'success');
          if (onDelete) onDelete();
          handleClose();
      } else {
          setGeneralError(response.body.message || "Could not delete account.");
      }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <Modal.Title className="fw-bold text-primary">Edit Account</Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}
        
        {loading || !account ? <LoadingState /> : (
          <Form onSubmit={handleSubmit}>
            <Row className="g-3 mb-3">
              <Col md={8}><InputField name="name" label="Account Name" fieldRef={nameField} error={formErrors.name} /></Col>
              <Col md={4}><InputField name="start_date" type="date" label="Start Date" fieldRef={dateField} error={formErrors.starting_date} /></Col>
            </Row>
            <Row className="g-3">
              <Col md={6}>
                <InputField name="type" type="select" label="Account Type" fieldRef={typeField}>
                  <option value="Bank Account">Bank Account</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Digital Bank Account">Digital Wallet</option>
                  <option value="Home Bank Account">Cash / Home</option>
                  <option value="Credit Line">Credit Line</option>
                  <option value="FSA Account">FSA / HSA</option>
                  <option value="Travel Credit">Travel Credit</option>
                </InputField>
              </Col>
              <Col md={6}><InputField name="description" label="Description" fieldRef={descField} /></Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <Button variant="light" className="text-danger rounded-pill px-3 bg-surface border" onClick={handleDelete}>
                    <i className="bi bi-trash me-2"></i>Delete
                </Button>
                <div className="d-flex gap-2">
                    <Button variant="light" onClick={handleClose} className="bg-surface border text-body rounded-pill px-4">Cancel</Button>
                    <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold">Save Changes</Button>
                </div>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
