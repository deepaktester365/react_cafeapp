import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Form, Badge, Spinner, InputGroup, Alert, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import { useFlash } from '../../contexts/FlashProvider';
import InputField from '../InputField';

export default function UserShoppingManagement() {
  const api = useApi();
  const flash = useFlash();
  const [loading, setLoading] = useState(true);

  // Data State
  const [group, setGroup] = useState(null);
  const [stores, setStores] = useState([]);

  // Actions State
  const [inviteEmail, setInviteEmail] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [editingStore, setEditingStore] = useState(null); // { id, name }
  const [showEditStoreModal, setShowEditStoreModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [groupRes, storesRes] = await Promise.all([
        api.get('/shopping/group'),
        api.get('/shopping/stores/manage')
    ]);

    if (groupRes.ok) setGroup(groupRes.body);
    if (storesRes.ok) setStores(storesRes.body);
    setLoading(false);
  }, [api]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- GROUP ACTIONS ---
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const res = await api.post('/shopping/group/members', { email: inviteEmail });
    if (res.ok) {
        flash(res.body.message, 'success');
        setInviteEmail('');
        loadData();
    } else {
        flash(res.error.message || "Failed to invite user", 'danger');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this user from the group?")) return;
    const res = await api.delete(`/shopping/group/members/${userId}`);
    if (res.ok) {
        loadData();
        flash("Member removed", 'success');
    }
  };

  // --- STORE ACTIONS ---
  const handleAddStore = async (e) => {
    e.preventDefault();
    if (!newStoreName) return;
    const res = await api.post('/shopping/stores', { name: newStoreName });
    if (res.ok) {
        setNewStoreName('');
        loadData();
        flash("Store created", 'success');
    } else {
        flash("Failed to create store", 'danger');
    }
  };

  const handleDeleteStore = async (store) => {
    if (!window.confirm(`Delete "${store.name}"? This cannot be undone.`)) return;
    const res = await api.delete(`/shopping/stores/${store.id}`);
    if (res.ok) {
        loadData();
        flash("Store deleted", 'success');
    } else {
        flash(res.body.message || "Could not delete store", 'danger');
    }
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!editingStore) return;
    const res = await api.put(`/shopping/stores/${editingStore.id}`, { name: editingStore.name });
    if (res.ok) {
        setShowEditStoreModal(false);
        setEditingStore(null);
        loadData();
        flash("Store renamed", 'success');
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <Row className="g-4">
        {/* --- LEFT COL: GROUP MANAGEMENT --- */}
        <Col lg={6}>
            <Card className="bg-surface shadow-sm border-0 h-100 rounded-4 overflow-hidden">
                <Card.Header className="bg-surface-5 py-3 px-4 border-bottom">
                    <h6 className="fw-bold mb-0"><i className="bi bi-people me-2 text-primary"></i>Shopping Group</h6>
                </Card.Header>
                <Card.Body className="p-4">
                    {!group || !group.has_group ? (
                        <Alert variant="info" className="bg-surface-tertiary border-0 text-body">
                            You are not part of any shopping group. <br/>
                            <Button size="sm" variant="primary" className="mt-2" onClick={() => api.post('/shopping', {name: 'New Item'}).then(loadData)}>
                                Create Group
                            </Button>
                        </Alert>
                    ) : (
                        <>
                            <div className="mb-4">
                                {/* FIX 1: Using text-body-50 for high contrast label against dark bg */}
                                <label className="small text-body-50 text-uppercase fw-bold mb-2">Group Name</label>
                                <div className="fs-5 fw-bold text-body">{group.name}</div>
                            </div>

                            <label className="small text-body-50 text-uppercase fw-bold mb-2">Members</label>
                            <div className="d-flex flex-column mb-4">
                                {group.members.map(member => (
                                    // FIX 2: Changed styling to match Store List (Transparent bg + Border)
                                    <div key={member.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary-subtle">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '32px', height: '32px', fontSize: '0.9rem'}}>
                                                {member.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="fw-bold small text-body">{member.username}</div>
                                                <div className="small text-body-50" style={{fontSize: '0.75rem'}}>{member.email}</div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="link" size="sm"
                                            className="text-danger p-0"
                                            onClick={() => handleRemoveMember(member.id)}
                                            title="Remove Member"
                                            style={{textDecoration: 'none'}}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-bottom bg-surface">
                                <label htmlFor="invite-email" className="small text-body opacity-50 text-uppercase fw-bold mb-2 d-block">Invite User</label>
                                <Form onSubmit={handleInvite}>
                                    <div className="d-flex rounded-pill overflow-hidden border border-secondary-subtle shadow-sm">
                                        <Form.Control
                                            id="invite-email"
                                            type="email"
                                            placeholder="Enter email address..."
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            className="border-0 bg-transparent text-body-50 shadow-none px-4 py-2"
                                            style={{ '--bs-secondary-color': 'rgba(var(--nook-text-rgb), 0.5)' }}
                                            required
                                          />
                                        <Button variant="primary" type="submit"
                                            className="px-4 fw-bold border-0 rounded-0 d-flex align-items-center justify-content-center py-2"
                                            disabled={!inviteEmail} required>
                                            Invite
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Col>

        {/* --- RIGHT COL: STORE MANAGEMENT --- */}
        <Col lg={6}>
            <Card className="bg-surface shadow-sm border-0 h-100 rounded-4 overflow-hidden">
                <Card.Header className="bg-surface-5 py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0"><i className="bi bi-shop me-2 text-success"></i>My Stores</h6>
                    <Badge bg="secondary" className="opacity-75">{stores.length}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom bg-surface">
                         <Form onSubmit={handleAddStore}>
                            <div className="d-flex rounded-pill overflow-hidden border border-secondary-subtle shadow-sm bg-surface"
                                >
                                <Form.Control
                                    placeholder="Add new store..."
                                    value={newStoreName}
                                    onChange={e => setNewStoreName(e.target.value)}
                                    className="border-0 bg-transparent text-body-50 shadow-none px-4 py-2"
                                    style={{ '--bs-secondary-color': 'rgba(var(--nook-text-rgb), 0.5)' }}
                                    required
                                />
                                <Button variant="success" type="submit"
                                    className="px-4 fw-bold border-0 rounded-0 d-flex align-items-center justify-content-center py-2"
                                    disabled={!newStoreName}>
                                    <i className="bi bi-plus-lg"></i>
                                </Button>
                            </div>
                        </Form>
                    </div>

                    <div className="overflow-auto" style={{maxHeight: '400px'}}>
                        {stores.length === 0 ? (
                            <div className="text-center py-4 text-body-50 small">No stores found.</div>
                        ) : (
                            stores.map(store => (
                                <div key={store.id} className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary-subtle last-child-no-border">
                                    <div className="d-flex align-items-center">
                                        <span className="fw-medium text-body">{store.name}</span>
                                        {store.usage_count > 0 && (
                                            <Badge bg="secondary" className="ms-2 opacity-50" style={{fontSize: '0.65rem'}}>
                                                {store.usage_count} uses
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        {/* FIX 4: Explicit text-body-50 for icons to ensure they are visible */}
                                        <i
                                            className="bi bi-pencil-fill text-body opacity-50"
                                            role="button"
                                            onClick={() => { setEditingStore(store); setShowEditStoreModal(true); }}
                                        ></i>

                                        {store.usage_count === 0 ? (
                                             <i
                                                className="bi bi-trash text-danger"
                                                role="button"
                                                onClick={() => handleDeleteStore(store)}
                                             ></i>
                                        ) : (
                                            <OverlayTrigger overlay={<Tooltip>Cannot delete store with history</Tooltip>}>
                                                <i className="bi bi-trash text-body opacity-50" style={{cursor: 'not-allowed'}}></i>
                                            </OverlayTrigger>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card.Body>
            </Card>
        </Col>

        {/* EDIT STORE MODAL */}
        <Modal show={showEditStoreModal} onHide={() => setShowEditStoreModal(false)} centered contentClassName="bg-surface border-0 rounded-4 shadow">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold h6 text-body">Rename Store</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleUpdateStore}>
                    <Form.Group className="mb-3">
                        <Form.Label className="text-body-50">Store Name</Form.Label>
                        <Form.Control
                            value={editingStore?.name || ''}
                            onChange={e => setEditingStore({...editingStore, name: e.target.value})}
                            autoFocus
                            className="bg-surface border-secondary-subtle text-body"
                        />
                    </Form.Group>
                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="light" onClick={() => setShowEditStoreModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    </Row>
  );
}
