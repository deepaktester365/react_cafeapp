import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';

export default function CreateCategoryModal({ show, onHide, onSuccess }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await api.post('/budget/categories', { name });

    setLoading(false);
    if (res.ok) {
      setName('');
      onSuccess(); // Triggers the refresh in the parent
      onHide();
    } else {
      alert("Failed to create category");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">New Category</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Category Name</Form.Label>
            <Form.Control
              autoFocus
              type="text"
              placeholder="e.g., Monthly Bills, Fun Money"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="bg-surface text-body"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="link" onClick={onHide} className="text-decoration-none text-muted">Cancel</Button>
          <Button variant="primary" type="submit" disabled={!name || loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
