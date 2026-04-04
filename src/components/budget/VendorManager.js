import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, InputGroup, Spinner } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';

export default function VendorManager() {
    const api = useApi();

    // State
    const [vendors, setVendors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [aliases, setAliases] = useState([]);
    const [isEditingVendor, setIsEditingVendor] = useState(false);
    const [editingVendorName, setEditingVendorName] = useState('');

    // New Form States
    const [newVendorName, setNewVendorName] = useState('');
    const [newAliasPattern, setNewAliasPattern] = useState('');
    const [newAliasIsRegex, setNewAliasIsRegex] = useState(false);

    // 1. Fetch Vendors
    useEffect(() => {
        fetchVendors();
        // eslint-disable-next-line
    }, [searchQuery]);

    // Make sure we exit edit mode if we click a different vendor
    useEffect(() => {
        setIsEditingVendor(false);
    }, [selectedVendor]);

    // --- NEW: Edit & Delete Handlers ---
    const handleRenameVendor = async (e) => {
        e.preventDefault();
        if (!editingVendorName.trim() || editingVendorName === selectedVendor.name) {
            setIsEditingVendor(false);
            return;
        }

        const res = await api.put(`/budget/vendors/${selectedVendor.id}`, { name: editingVendorName });
        if (res.ok) {
            // Update the local list and the selected vendor instantly
            setVendors(prev => prev.map(v => v.id === selectedVendor.id ? res.body : v));
            setSelectedVendor(res.body);
            setIsEditingVendor(false);
        } else {
            alert(res.body?.message || "Failed to rename vendor.");
        }
    };

    const handleDeleteVendor = async () => {
        const proceed = window.confirm(
            `Are you sure you want to delete "${selectedVendor.name}"?\n\nAny existing transactions will keep their bank descriptions but lose this vendor tag.`
        );
        if (!proceed) return;

        const res = await api.delete(`/budget/vendors/${selectedVendor.id}`);
        if (res.ok) {
            setVendors(prev => prev.filter(v => v.id !== selectedVendor.id));
            setSelectedVendor(null); // Clear the right panel
        } else {
            alert("Failed to delete vendor.");
        }
    };

    const fetchVendors = async () => {
        setIsLoading(true);
        // Request 300 to ensure we get a large list. If you exceed 300, we should add proper pagination to this view later.
        const res = await api.get(`/budget/vendors?q=${searchQuery}&per_page=300`);
        if (res.ok) {
            setVendors(res.body.items || []);
        }
        setIsLoading(false);
    };

    // 2. Fetch Aliases when a vendor is selected
    useEffect(() => {
        if (!selectedVendor) return;

        const fetchAliases = async () => {
            const res = await api.get(`/budget/vendors/${selectedVendor.id}/aliases`);
            if (res.ok) setAliases(res.body.items || []);
        };
        fetchAliases();
    }, [selectedVendor, api]);

    // 3. Handlers
    const handleCreateVendor = async (e) => {
        e.preventDefault();
        if (!newVendorName.trim()) return;

        const res = await api.post('/budget/vendors', { name: newVendorName });
        if (res.ok) {
            setNewVendorName('');
            fetchVendors();
            setSelectedVendor(res.body); // Auto-select the new vendor
        } else {
            alert(res.body?.message || "Error creating vendor");
        }
    };

    const handleCreateAlias = async (e) => {
        e.preventDefault();
        if (!newAliasPattern.trim() || !selectedVendor) return;

        const res = await api.post(`/budget/vendors/${selectedVendor.id}/aliases`, {
            pattern: newAliasPattern,
            is_regex: newAliasIsRegex
        });

        if (res.ok) {
            setAliases([...aliases, res.body]);
            setNewAliasPattern('');
            setNewAliasIsRegex(false);
        }
    };

    const handleDeleteAlias = async (aliasId) => {
        if (!window.confirm("Remove this mapping rule?")) return;

        const res = await api.delete(`/budget/aliases/${aliasId}`);
        if (res.ok) {
            setAliases(aliases.filter(a => a.id !== aliasId));
        }
    };

    return (
        <Container className="py-4">
            <h2 className="fw-bold mb-4"><i className="bi bi-shop text-primary me-2"></i> Vendor & Rules Manager</h2>

            <Row className="g-4">
                {/* LEFT COLUMN: VENDOR LIST */}
                <Col md={5} lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <div className="p-3 border-bottom bg-light rounded-top-4">
                            <Form onSubmit={handleCreateVendor} className="mb-3">
                                <InputGroup size="sm">
                                    <Form.Control
                                        placeholder="New vendor name..."
                                        value={newVendorName}
                                        onChange={e => setNewVendorName(e.target.value)}
                                    />
                                    <Button type="submit" variant="primary"><i className="bi bi-plus"></i> Add</Button>
                                </InputGroup>
                            </Form>
                            <Form.Control
                                size="sm"
                                type="text"
                                placeholder="Search vendors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="rounded-pill bg-white"
                            />
                        </div>

                        <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: '600px' }}>
                            {isLoading ? (
                                <div className="text-center p-4"><Spinner animation="border" size="sm" /></div>
                            ) : vendors.length === 0 ? (
                                <div className="text-muted text-center p-4 small">No vendors found.</div>
                            ) : (
                                vendors.map(v => (
                                    <ListGroup.Item
                                        key={v.id}
                                        action
                                        active={selectedVendor?.id === v.id}
                                        onClick={() => setSelectedVendor(v)}
                                        className="d-flex justify-content-between align-items-center border-bottom-0 py-3"
                                    >
                                        <span className="fw-medium text-truncate">{v.name}</span>
                                        <i className="bi bi-chevron-right small opacity-50"></i>
                                    </ListGroup.Item>
                                ))
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                {/* RIGHT COLUMN: ALIAS MANAGER */}
                <Col md={7} lg={8}>
                    {selectedVendor ? (
                        <Card className="border-0 shadow-sm rounded-4 h-100 animation-fade-in">
                            <Card.Body className="p-4 p-md-5">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    {isEditingVendor ? (
                                        <Form onSubmit={handleRenameVendor} className="d-flex gap-2 w-100 me-4">
                                            <Form.Control
                                                value={editingVendorName}
                                                onChange={e => setEditingVendorName(e.target.value)}
                                                autoFocus
                                            />
                                            <Button type="submit" variant="success" size="sm"><i className="bi bi-check-lg"></i></Button>
                                            <Button variant="light" size="sm" onClick={() => setIsEditingVendor(false)}><i className="bi bi-x-lg"></i></Button>
                                        </Form>
                                    ) : (
                                        <div>
                                            <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
                                                {selectedVendor.name}
                                                <Button variant="link" className="text-muted p-0 ms-2" onClick={() => {
                                                    setEditingVendorName(selectedVendor.name);
                                                    setIsEditingVendor(true);
                                                }}>
                                                    <i className="bi bi-pencil-square" style={{fontSize: '1.2rem'}}></i>
                                                </Button>
                                            </h3>
                                            <p className="text-muted small mb-0">Define rules so the CSV Triage Engine automatically selects this vendor.</p>
                                        </div>
                                    )}

                                    <Button variant="outline-danger" size="sm" className="flex-shrink-0" onClick={handleDeleteVendor} title="Delete Vendor">
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </div>

                                <Form onSubmit={handleCreateAlias} className="bg-light p-3 rounded-4 mb-4 border">
                                    <Form.Label className="fw-bold text-header-caps small">Add Mapping Rule</Form.Label>
                                    <Row className="g-2">
                                        <Col sm={8}>
                                            <Form.Control
                                                placeholder="e.g. 'AMZN MKTP' or '^UBER\s*EATS'"
                                                value={newAliasPattern}
                                                onChange={e => setNewAliasPattern(e.target.value)}
                                            />
                                        </Col>
                                        <Col sm={4}>
                                            <Button type="submit" variant="success" className="w-100 fw-bold">
                                                Add Rule
                                            </Button>
                                        </Col>
                                    </Row>
                                    <Form.Check
                                        type="switch"
                                        id="regex-switch"
                                        className="mt-2 text-muted small"
                                        label="Evaluate as Regular Expression (Regex)"
                                        checked={newAliasIsRegex}
                                        onChange={e => setNewAliasIsRegex(e.target.checked)}
                                    />
                                </Form>

                                <h6 className="fw-bold text-muted text-header-caps mb-3">Active Rules ({aliases.length})</h6>

                                {aliases.length === 0 ? (
                                    <div className="bg-light p-4 rounded-4 text-center text-muted small fst-italic border">
                                        No rules defined. This vendor must be selected manually.
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {aliases.map(alias => (
                                            <div key={alias.id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-white shadow-sm">
                                                <div>
                                                    <div className="fw-bold font-monospace text-dark mb-1">
                                                        {alias.pattern}
                                                    </div>
                                                    {alias.is_regex ? (
                                                        <Badge bg="primary" className="fw-normal" style={{fontSize: '0.65rem'}}>Regex</Badge>
                                                    ) : (
                                                        <Badge bg="secondary" className="fw-normal" style={{fontSize: '0.65rem'}}>Text Match</Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    className="text-danger border"
                                                    onClick={() => handleDeleteAlias(alias.id)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center bg-light rounded-4 border text-muted opacity-75">
                            <i className="bi bi-shop display-1 mb-3"></i>
                            <p className="fw-medium">Select a vendor from the list to manage its rules.</p>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
}
