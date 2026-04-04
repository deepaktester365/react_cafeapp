import { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Badge, Nav, Row, Col } from 'react-bootstrap';
import { fractionToDecimal, decimalToFraction } from '../../../utils/mathUtils';

const borderlessStyle = { border: 'none', borderBottom: '1px solid #e9ecef', borderRadius: 0, paddingLeft: 0, boxShadow: 'none', backgroundColor: 'transparent' };
const generateLocalId = () => Math.random().toString(36).substring(2, 9);

export default function StepEditModal({ show, onHide, onSave, stepData, allIngredients, allEquipment, allSteps }) {
    const [trayTab, setTrayTab] = useState('ingredients');
    const fileInputRef = useRef(null);
    const [localPreview, setLocalPreview] = useState(null);

    useEffect(() => {
        if (show) setLocalPreview(null);
    }, [show, stepData?.client_id]);

    if (!show || !stepData) return null;

    const flatSteps = allSteps.flatMap(sec => sec.items);
    const currentStepIndex = flatSteps.findIndex(s => s.client_id === stepData.client_id);

    // Create a flat list of all outputs from ALL steps
    const allOutputs = flatSteps.flatMap(s => s.outputs || []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalPreview(URL.createObjectURL(file));
            onSave({ ...stepData, newImageFile: file });
        }
    };

    // --- MATH: Calculate Remaining Quantity ---
    const getRemainingQty = (clientId, isComponent = false) => {
        let totalQty = 0;
        if (isComponent) {
            const comp = allOutputs.find(o => o.client_id === clientId);
            if (!comp || !comp.quantity) return null;
            totalQty = parseFloat(comp.quantity);
        } else {
            const ing = allIngredients.find(i => i.client_id === clientId);
            if (!ing || !ing.quantity) return null;
            totalQty = parseFloat(ing.quantity);
        }

        if (isNaN(totalQty)) return null;
        let usedQty = 0;
        const targetType = isComponent ? 'step' : 'ingredient';

        flatSteps.forEach(step => {
            if (step.links && step.client_id !== stepData.client_id) {
                step.links.forEach(link => {
                    if (link.type === targetType && link.client_id === clientId) {
                        const match = link.usage_text?.match(/[\d\s/.]+/);
                        if (match) usedQty += fractionToDecimal(match[0]);
                    }
                });
            }
        });

        if (stepData.links) {
            stepData.links.forEach(link => {
                if (link.type === targetType && link.client_id === clientId) {
                    const match = link.usage_text?.match(/[\d\s/.]+/);
                    if (match) usedQty += fractionToDecimal(match[0]);
                }
            });
        }
        return totalQty - usedQty;
    };

    // --- SMART TRAY FILTERING ---
    const availableIngredients = allIngredients.filter(ing => {
        const isLinkedHere = (stepData.links || []).some(l => l.type === 'ingredient' && l.client_id === ing.client_id);
        if (isLinkedHere) return false;
        const remaining = getRemainingQty(ing.client_id);
        if (remaining !== null && remaining <= 0.01) return false;
        return true;
    });

    const availableEquipment = (allEquipment || []).filter(eq => {
        return !(stepData.links || []).some(l => l.type === 'equipment' && l.client_id === eq.client_id);
    });

    // ONLY show outputs from steps that come BEFORE this one!
    const availableComponents = [];
    if (currentStepIndex > 0 || currentStepIndex === -1) {
        const previousSteps = currentStepIndex === -1 ? flatSteps : flatSteps.slice(0, currentStepIndex);
        previousSteps.forEach(step => {
            (step.outputs || []).forEach(out => {
                if (!out.name) return;
                const isLinkedHere = (stepData.links || []).some(l => l.type === 'step' && l.client_id === out.client_id);
                if (isLinkedHere) return;
                const remaining = getRemainingQty(out.client_id, true);
                if (remaining !== null && remaining <= 0.01) return;
                availableComponents.push(out);
            });
        });
    }

    // --- HANDLERS ---
    const updateField = (field, val) => onSave({ ...stepData, [field]: val });

    const addOutput = () => {
        const newOutputs = [...(stepData.outputs || []), { client_id: generateLocalId(), name: '', quantity: '', unit: '' }];
        updateField('outputs', newOutputs);
    };

    const updateOutput = (idx, field, val) => {
        const newOutputs = [...(stepData.outputs || [])];
        newOutputs[idx][field] = val;
        updateField('outputs', newOutputs);
    };

    const removeOutput = (idx) => {
        const newOutputs = (stepData.outputs || []).filter((_, i) => i !== idx);
        updateField('outputs', newOutputs);
    };

    const addLink = (item, type) => {
        let defaultUsage = 'Use';
        if (type === 'ingredient' || type === 'step') {
            const remaining = getRemainingQty(item.client_id, type === 'step');
            const unitDisplay = item.unit === 'Other' ? item.custom_unit : item.unit;
            const rawAmount = remaining !== null ? remaining : item.quantity;
            const autoAmount = decimalToFraction(rawAmount);
            defaultUsage = `${autoAmount || ''} ${unitDisplay || ''}`.trim();
        }
        const newLinks = [...(stepData.links || []), { type, client_id: item.client_id, usage_text: defaultUsage }];
        onSave({ ...stepData, links: newLinks });
    };

    const updateLink = (linkIdx, value) => {
        const newLinks = [...stepData.links];
        newLinks[linkIdx].usage_text = value;
        onSave({ ...stepData, links: newLinks });
    };

    const removeLink = (linkIdx) => {
        const newLinks = stepData.links.filter((_, i) => i !== linkIdx);
        onSave({ ...stepData, links: newLinks });
    };

    const getItemName = (clientId, type) => {
        if (type === 'ingredient') return allIngredients.find(i => i.client_id === clientId)?.name || 'Unknown';
        if (type === 'equipment') return allEquipment.find(e => e.client_id === clientId)?.name || 'Unknown';
        if (type === 'step') return allOutputs.find(o => o.client_id === clientId)?.name || 'Unknown Component';
        return 'Unknown';
    };

    return (
        <Modal show={show} onHide={onHide} centered size="md" backdrop="static" contentClassName="border-0 shadow-lg rounded-4">
            <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fs-5 fw-bold">Edit Instruction</Modal.Title></Modal.Header>
            <Modal.Body>
                <Form.Control as="textarea" rows={4} className="mb-3 border bg-light shadow-sm" value={stepData.instruction} onChange={e => updateField('instruction', e.target.value)} placeholder="What do we do?" />

                {/* --- IMAGE UPLOAD --- */}
                <div className="mb-4">
                    <input type="file" accept="image/*" className="d-none" ref={fileInputRef} onChange={handleImageChange} />
                    {(localPreview || stepData.image_url) ? (
                        <div className="position-relative text-center bg-light rounded-3 border overflow-hidden shadow-sm" style={{ maxHeight: '200px' }}>
                            <img src={localPreview || stepData.image_url} alt="Step preview" className="img-fluid w-100" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                            <Button variant="dark" size="sm" className="position-absolute top-0 end-0 m-2 rounded-circle opacity-75 shadow" onClick={() => {
                                setLocalPreview(null);
                                updateField('image_url', null);
                                updateField('remove_image', true);
                            }}>
                                <i className="bi bi-trash"></i>
                            </Button>
                        </div>
                    ) : (
                        <div className="p-3 border border-dashed rounded-3 text-center bg-surface-50 text-muted hover-bg-light transition-all" style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                            <i className="bi bi-camera fs-3 d-block mb-1 text-primary"></i>
                            <span className="small fw-medium">Add Step Photo</span>
                        </div>
                    )}
                </div>

                {/* --- DYNAMIC MULTI-OUTPUT DEFINITION --- */}
                <div className="p-3 bg-success-subtle rounded-3 mb-4 border border-success-subtle">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-bold text-success small text-header-caps"><i className="bi bi-box-seam me-1"></i> Prepared Components</div>
                        <Button variant="link" size="sm" className="text-success p-0 text-decoration-none" onClick={addOutput}>+ Add Yield</Button>
                    </div>

                    {(stepData.outputs || []).map((out, idx) => (
                        <Row className="g-2 mb-2 align-items-center" key={out.client_id}>
                            <Col xs={3}>
                                <Form.Control
                                    size="sm"
                                    placeholder="Qty (e.g. 1/2)"
                                    value={out.display_quantity !== undefined ? out.display_quantity : (decimalToFraction(out.quantity) || '')}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const dec = fractionToDecimal(val);

                                        const newOutputs = [...(stepData.outputs || [])];
                                        newOutputs[idx].display_quantity = val; // Store exact keystrokes so "1/" doesn't get deleted
                                        newOutputs[idx].quantity = isNaN(dec) ? null : dec; // Only save the math when it's a valid number

                                        updateField('outputs', newOutputs);
                                    }}
                                />
                            </Col>
                            <Col xs={3}>
                                <Form.Control size="sm" placeholder="Unit" value={out.unit || ''} onChange={e => updateOutput(idx, 'unit', e.target.value)} />
                            </Col>
                            <Col xs={5}>
                                <Form.Control size="sm" placeholder="Name (e.g. Diced Onions)" value={out.name || ''} onChange={e => updateOutput(idx, 'name', e.target.value)} />
                            </Col>
                            <Col xs={1} className="text-end">
                                <i className="bi bi-trash text-danger" style={{cursor: 'pointer'}} onClick={() => removeOutput(idx)}></i>
                            </Col>
                        </Row>
                    ))}
                    {(!stepData.outputs || stepData.outputs.length === 0) && (
                        <div className="text-muted small fst-italic">Does this step produce something for later?</div>
                    )}
                </div>

                {/* Linked Items List */}
                {stepData.links && stepData.links.length > 0 && (
                    <div className="mb-3">
                        <h6 className="fw-bold small text-muted text-header-caps">Tagged Items</h6>
                        <div className="bg-surface-50 p-2 rounded-3 border">
                            {stepData.links.map((link, linkIdx) => (
                                <div key={linkIdx} className="d-flex align-items-center gap-2 mb-2">
                                    <Badge bg={link.type === 'ingredient' ? 'secondary' : link.type === 'equipment' ? 'info' : 'success'} className="px-3 py-2 fw-normal rounded-pill text-truncate" style={{maxWidth: '150px'}}>
                                        {link.type === 'equipment' && <i className="bi bi-tools me-1"></i>}
                                        {link.type === 'step' && <i className="bi bi-box-seam me-1"></i>}
                                        {getItemName(link.client_id, link.type)}
                                    </Badge>

                                    {link.type === 'equipment' ? (
                                        <span className="text-muted small ms-2 fst-italic w-100">Equipment</span>
                                    ) : (
                                        <Form.Control size="sm" style={{...borderlessStyle, width: '120px', backgroundColor: 'var(--bs-white)', paddingLeft: '8px'}} placeholder="Amount" value={link.usage_text || ''} onChange={e => updateLink(linkIdx, e.target.value)} />
                                    )}

                                    <i className="bi bi-x text-body-50 ms-auto hover-opacity-100" style={{cursor: 'pointer', fontSize: '1.2rem'}} onClick={() => removeLink(linkIdx)}></i>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tagging Tray Tabs */}
                <Nav variant="underline" className="custom-tabs mb-2" activeKey={trayTab} onSelect={k => setTrayTab(k)}>
                    <Nav.Item><Nav.Link eventKey="ingredients" className="py-1 px-2 small">Ingredients</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="equipment" className="py-1 px-2 small">Equipment</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="components" className="py-1 px-2 small">Components</Nav.Link></Nav.Item>
                </Nav>

                {/* The Tray Picker */}
                <div className="p-3 border rounded-3 bg-light shadow-sm" style={{minHeight: '100px'}}>
                    {trayTab === 'ingredients' && (
                        availableIngredients.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {availableIngredients.map(ing => (
                                    <Badge key={ing.client_id} bg="white" text="primary" className="border border-primary-subtle py-2 px-3 hover-bg-light" style={{cursor: 'pointer'}} onClick={() => addLink(ing, 'ingredient')}>+ {ing.name}</Badge>
                                ))}
                            </div>
                        ) : (<div className="text-muted small text-center opacity-75 fst-italic py-3">All ingredients assigned!</div>)
                    )}

                    {trayTab === 'equipment' && (
                        availableEquipment.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {availableEquipment.map(eq => (
                                    <Badge key={eq.client_id} bg="white" text="info" className="border border-info-subtle py-2 px-3 hover-bg-light" style={{cursor: 'pointer'}} onClick={() => addLink(eq, 'equipment')}>+ {eq.name}</Badge>
                                ))}
                            </div>
                        ) : (<div className="text-muted small text-center opacity-75 fst-italic py-3">{allEquipment?.length === 0 ? "Add equipment to the recipe first!" : "All equipment assigned to this step!"}</div>)
                    )}

                    {trayTab === 'components' && (
                        availableComponents.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {availableComponents.map(comp => (
                                    <Badge key={comp.client_id} bg="white" text="success" className="border border-success-subtle py-2 px-3 hover-bg-light" style={{cursor: 'pointer'}} onClick={() => addLink(comp, 'step')}>+ {comp.name}</Badge>
                                ))}
                            </div>
                        ) : (<div className="text-muted small text-center opacity-75 fst-italic py-3">No available components from previous steps.</div>)
                    )}
                </div>

            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="primary" className="rounded-pill px-4 w-100 fw-bold" onClick={onHide}>Done</Button>
            </Modal.Footer>
        </Modal>
    );
}
