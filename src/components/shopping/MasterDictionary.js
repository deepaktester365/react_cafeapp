import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, Modal, Badge } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';

export default function MasterDictionary() {
    const api = useApi();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Checkbox State
    const [selectedNames, setSelectedNames] = useState(new Set());

    // Modal State
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [masterNameInput, setMasterNameInput] = useState('');

    useEffect(() => {
        fetchDictionary();
        // eslint-disable-next-line
    }, []);

    const fetchDictionary = async () => {
        setIsLoading(true);
        const res = await api.get('/shopping/dictionary');
        if (res.ok) {
            setItems(res.body || []);
            setSelectedNames(new Set()); // Clear selection on refresh
        }
        setIsLoading(false);
    };

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        const lowerQ = searchQuery.toLowerCase();
        return items.filter(item => item.name.toLowerCase().includes(lowerQ));
    }, [items, searchQuery]);

    const toggleSelect = (name) => {
        const next = new Set(selectedNames);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        setSelectedNames(next);
    };

    const handleOpenMergeModal = () => {
        // Pre-fill the input with the most frequently used variation
        const selectedObjects = items.filter(i => selectedNames.has(i.name));
        const mostPopular = selectedObjects.sort((a, b) => b.count - a.count)[0];
        setMasterNameInput(mostPopular?.name || '');
        setShowMergeModal(true);
    };

    const executeMerge = async () => {
        if (!masterNameInput.trim()) return alert("Please enter a master name.");

        const oldNamesArray = Array.from(selectedNames);

        const res = await api.post('/shopping/dictionary/merge', {
            old_names: oldNamesArray,
            master_name: masterNameInput.trim()
        });

        if (res.ok) {
            alert(res.body.message);
            setShowMergeModal(false);
            fetchDictionary(); // Refresh the grid!
        } else {
            alert("Failed to merge items.");
        }
    };

    return (
        <Container className="py-4 position-relative">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1"><i className="bi bi-book-half text-primary me-2"></i> Master Dictionary</h2>
                    <p className="text-muted mb-0">Clean up duplicates to improve price tracking and recipes.</p>
                </div>

                <div style={{ maxWidth: '300px', width: '100%' }}>
                    <Form.Control
                        type="search"
                        placeholder="Search items..."
                        className="rounded-pill shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="bg-light p-3 border-bottom d-flex text-muted small fw-bold text-header-caps">
                    <div style={{ width: '50px' }}></div>
                    <div className="flex-grow-1">Ingredient Name</div>
                    <div style={{ width: '120px' }} className="text-center">Occurrences</div>
                    <div style={{ width: '150px' }} className="text-end pe-3">Recent Unit</div>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {isLoading ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-5 text-muted fst-italic">No items found.</div>
                    ) : (
                        filteredItems.map(item => {
                            const isSelected = selectedNames.has(item.name);
                            return (
                                <div
                                    key={item.name}
                                    className={`d-flex align-items-center p-3 border-bottom transition-all cursor-pointer ${isSelected ? 'bg-primary-subtle' : 'bg-white hover-light'}`}
                                    onClick={() => toggleSelect(item.name)}
                                >
                                    <div style={{ width: '50px' }}>
                                        <Form.Check
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}} // Handled by row click
                                        />
                                    </div>
                                    <div className={`flex-grow-1 fw-bold ${isSelected ? 'text-primary' : 'text-dark'}`}>
                                        {item.name}
                                    </div>
                                    <div style={{ width: '120px' }} className="text-center">
                                        <Badge bg="secondary" className="rounded-pill px-3">{item.count}</Badge>
                                    </div>
                                    <div style={{ width: '150px' }} className="text-end pe-3 text-muted small text-header-caps">
                                        {item.hint_unit || '--'}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* --- THE FLOATING ACTION BAR --- */}
            {selectedNames.size > 0 && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 z-3 animation-slide-up">
                    <div className="bg-dark text-white p-3 rounded-pill shadow-lg d-flex align-items-center gap-4 border border-secondary">
                        <span className="fw-bold ps-3">{selectedNames.size} items selected</span>
                        <Button variant="primary" className="rounded-pill px-4 fw-bold" onClick={handleOpenMergeModal}>
                            Merge Selected <i className="bi bi-chevron-right ms-1"></i>
                        </Button>
                    </div>
                </div>
            )}

            {/* --- THE MERGE MODAL --- */}
            <Modal show={showMergeModal} onHide={() => setShowMergeModal(false)} centered backdrop="static" contentClassName="border-0 shadow-lg rounded-4">
                <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
                    <Modal.Title className="fw-bold fs-4 text-primary">Merge Ingredients</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p className="text-muted mb-4">
                        You are about to merge <strong className="text-dark">{selectedNames.size} variations</strong>.
                        This will permanently update your historical shopping lists and price tracking data.
                        <br/><br/>
                        <span className="text-primary fw-medium"><i className="bi bi-shield-check me-1"></i> Your original recipe ingredients will remain completely untouched.</span>
                    </p>

                    <div className="bg-light p-3 rounded-4 border mb-4">
                        <div className="small fw-bold text-muted text-header-caps mb-2">Items being merged:</div>
                        <div className="d-flex flex-wrap gap-2">
                            {Array.from(selectedNames).map(name => (
                                <Badge key={name} bg="white" text="dark" className="border shadow-sm px-2 py-1">{name}</Badge>
                            ))}
                        </div>
                    </div>

                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-header-caps">New Master Name</Form.Label>
                        <Form.Control
                            type="text"
                            size="lg"
                            className="fw-bold text-primary shadow-sm"
                            value={masterNameInput}
                            onChange={(e) => setMasterNameInput(e.target.value)}
                            placeholder="e.g. Fennel Seeds"
                        />
                        <Form.Text className="text-muted">
                            Every selected item above will be renamed to exactly match this input.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" className="rounded-pill px-4 fw-bold" onClick={() => setShowMergeModal(false)}>Cancel</Button>
                    <Button variant="success" className="rounded-pill px-4 fw-bold shadow-sm" onClick={executeMerge}>
                        Confirm Merge
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
