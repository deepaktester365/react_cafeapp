import { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Form } from 'react-bootstrap';
import { decimalToFraction } from '../../utils/mathUtils';
import { useApi } from '../../contexts/ApiProvider';

export default function GenerateListWizard({ show, onHide, startDate, endDate, onSuccess }) {
    const api = useApi();

    // 1: Review Meals, 2: Resolve Conflicts (Conditional), 3: Pantry Check
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Data State
    const [meals, setMeals] = useState([]);
    const [cleanItems, setCleanItems] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [pantryItems, setPantryItems] = useState([]);

    // Reset when opened
    useEffect(() => {
        if (show) {
            setStep(1);
            setMeals([]);
            setCleanItems([]);
            setConflicts([]);
            setPantryItems([]);
            fetchPreview();
        }
        // eslint-disable-next-line
    }, [show, startDate, endDate]);

    const fetchPreview = async () => {
        setIsLoading(true);
        const res = await api.post('/meal-plans/preview-shopping-list', {
            start_date: startDate,
            end_date: endDate
        });
        setIsLoading(false);

        if (res.ok) {
            setMeals(res.body.meals || []);

            const fetchedItems = res.body.items || [];
            const groupedByName = {};
            fetchedItems.forEach(item => {
                const name = item.name.trim();
                if (!groupedByName[name]) groupedByName[name] = [];
                groupedByName[name].push(item);
            });

            const newClean = [];
            const newConflicts = [];

            Object.keys(groupedByName).forEach(name => {
                const group = groupedByName[name];
                if (group.length > 1) {
                    newConflicts.push({
                        name: name,
                        items: group,
                        resolvedQty: '',
                        resolvedUnit: group[0].unit || '',
                        keepSeparate: false,
                        discard: false // <-- NEW: Start as not discarded
                    });
                } else {
                    newClean.push(group[0]);
                }
            });

            setCleanItems(newClean);
            setConflicts(newConflicts);
        }
    };

    // --- NAVIGATION HELPERS ---
    const handleNextFromMeals = () => {
        if (conflicts.length > 0) {
            setStep(2);
        } else {
            buildFinalPantryList();
        }
    };

    const handleNextFromConflicts = () => {
        // Validation: Ensure active conflicts have a quantity (ignore if discarded)
        const uncompleted = conflicts.find(c => !c.discard && !c.keepSeparate && (c.resolvedQty === '' || isNaN(c.resolvedQty)));
        if (uncompleted) {
            return alert(`Please enter a combined quantity for ${uncompleted.name}, or choose an alternative option.`);
        }
        buildFinalPantryList();
    };

    const buildFinalPantryList = () => {
        let finalArray = [...cleanItems];

        conflicts.forEach(c => {
            // --- NEW: If they discarded it, just skip it completely! ---
            if (c.discard) return;

            if (c.keepSeparate) {
                finalArray = [...finalArray, ...c.items];
            } else {
                const combinedNotes = c.items.map(i => i.notes).filter(n => n).join(', ');
                finalArray.push({
                    name: c.name,
                    quantity: parseFloat(c.resolvedQty),
                    unit: c.resolvedUnit,
                    notes: combinedNotes
                });
            }
        });

        const itemsWithCheck = finalArray.map((item, idx) => ({ ...item, id: idx, isChecked: true }));
        itemsWithCheck.sort((a, b) => a.name.localeCompare(b.name));

        setPantryItems(itemsWithCheck);
        setStep(3);
    };

    const updateConflict = (index, field, value) => {
        setConflicts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    };

    const togglePantryCheck = (idx) => {
        setPantryItems(prev => prev.map((item, i) => i === idx ? { ...item, isChecked: !item.isChecked } : item));
    };

    const handleSaveList = async () => {
        const selectedItems = pantryItems.filter(item => item.isChecked);
        if (selectedItems.length === 0) return alert("Please select at least one item to add.");

        setIsLoading(true);
        const res = await api.post('/shopping/bulk-add', { items: selectedItems });
        setIsLoading(false);

        if (res.ok) {
            onSuccess(res.body.message);
            onHide();
        } else {
            alert("Failed to save shopping list.");
        }
    };

    if (!show) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
            {/* --- CUSTOM HEADER --- */}
            <div className="bg-primary px-4 px-md-5 py-4 text-white position-relative">
                <Button variant="link" className="text-white position-absolute top-0 end-0 m-3 p-0 fs-5" onClick={onHide}>
                    <i className="bi bi-x-lg"></i>
                </Button>
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
                        <i className={`fs-4 bi ${step === 1 ? 'bi-calendar-check' : (step === 2 ? 'bi-exclamation-triangle' : 'bi-cart-check')}`}></i>
                    </div>
                    <div>
                        <h4 className="fw-bold mb-0">
                            {step === 1 && 'Step 1: Review Meals'}
                            {step === 2 && 'Step 2: Resolve Conflicts'}
                            {step === 3 && 'Step 3: Pantry Check'}
                        </h4>
                        <div className="text-white-50 small mt-1">
                            {startDate && endDate && `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </div>
                    </div>
                </div>
            </div>

            <Modal.Body className="p-4 p-md-5 bg-surface" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

                {isLoading && step === 1 && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

                {/* --- STEP 1: REVIEW MEALS --- */}
                {!isLoading && step === 1 && (
                    <div className="animation-fade-in">
                        <p className="text-muted mb-4 fs-5">These recipes will be used to calculate your grocery list.</p>
                        {meals.length === 0 ? (
                            <div className="text-center py-5 text-muted fst-italic bg-white rounded-4 border shadow-sm">No recipe meals scheduled for this week.</div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {meals.map((meal, idx) => (
                                    <div key={idx} className="d-flex justify-content-between align-items-center p-3 border rounded-4 bg-white shadow-sm hover-shadow transition-all">
                                        <div className="d-flex align-items-center gap-3">
                                            {/* Beautiful Recipe Thumbnail */}
                                            {meal.image_url ? (
                                                <img src={meal.image_url} alt={meal.name} className="rounded-3 object-fit-cover shadow-sm" style={{ width: '60px', height: '60px' }} />
                                            ) : (
                                                <div className="bg-light rounded-3 d-flex align-items-center justify-content-center text-muted border" style={{ width: '60px', height: '60px' }}>
                                                    <i className="bi bi-cup-hot fs-3"></i>
                                                </div>
                                            )}
                                            <div>
                                                <div className="fw-bold fs-5 text-dark">{meal.name}</div>
                                                <div className="text-muted small">
                                                    <i className="bi bi-calendar-event me-1"></i>
                                                    {new Date(meal.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge bg="primary-subtle" text="primary" className="border border-primary-subtle px-3 py-2 fs-6 rounded-pill shadow-sm">
                                            <i className="bi bi-people-fill me-2"></i>{meal.servings}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- STEP 2: RESOLVE CONFLICTS --- */}
                {step === 2 && (
                    <div className="animation-fade-in">
                        <div className="alert alert-warning border-warning-subtle shadow-sm rounded-4 mb-4 d-flex gap-3 align-items-center">
                            <i className="bi bi-exclamation-circle-fill fs-3 text-warning"></i>
                            <div>
                                <strong className="d-block text-dark">Unit Conflicts Detected</strong>
                                <span className="text-muted small">Some ingredients use different measurement units. Combine them or keep them separate.</span>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-4">
                            {conflicts.map((c, idx) => (
                                <div key={idx} className={`p-4 border rounded-4 shadow-sm transition-all ${c.discard ? 'bg-light opacity-50 border-light' : 'bg-white'}`}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className={`fw-bold mb-0 ${c.discard ? 'text-muted text-decoration-line-through' : 'text-primary'}`}>{c.name}</h5>
                                        <Button variant={c.discard ? "secondary" : "outline-danger"} size="sm" className="rounded-pill fw-bold" onClick={() => updateConflict(idx, 'discard', !c.discard)}>
                                            <i className={`bi ${c.discard ? 'bi-arrow-counterclockwise' : 'bi-trash'} me-1`}></i>
                                            {c.discard ? 'Restore' : 'Discard'}
                                        </Button>
                                    </div>

                                    {!c.discard ? (
                                        <>
                                            <div className="d-flex flex-wrap gap-2 mb-3 bg-light p-2 rounded-3 border">
                                                <span className="text-muted small fw-bold text-header-caps align-self-center me-2">Detected:</span>
                                                {c.items.map((it, i) => (
                                                    <Badge key={i} bg="white" text="dark" className="px-3 py-1 fs-6 rounded-pill border shadow-sm fw-medium">
                                                        {decimalToFraction(it.quantity)} {it.unit}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <Form.Check type="switch" id={`keep-sep-${idx}`} label={<span className="fw-medium text-dark">Keep these items separate on my shopping list</span>} checked={c.keepSeparate} onChange={(e) => updateConflict(idx, 'keepSeparate', e.target.checked)} className="mb-3 custom-switch" />

                                            {!c.keepSeparate && (
                                                <div className="bg-primary-subtle p-3 rounded-4 border border-primary-subtle">
                                                    <Form.Label className="small fw-bold text-primary text-header-caps">Combine into a single total:</Form.Label>
                                                    <Row className="g-2">
                                                        <Col xs={6}>
                                                            <Form.Control type="number" min="0" step="0.1" placeholder="Total Qty" className="border-0 shadow-sm" value={c.resolvedQty} onChange={(e) => updateConflict(idx, 'resolvedQty', e.target.value)} />
                                                        </Col>
                                                        <Col xs={6}>
                                                            <Form.Control type="text" placeholder="Unit (e.g., cups)" className="border-0 shadow-sm" value={c.resolvedUnit} onChange={(e) => updateConflict(idx, 'resolvedUnit', e.target.value)} />
                                                        </Col>
                                                    </Row>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-muted small fst-italic"><i className="bi bi-info-circle me-1"></i> This item will not be added to your shopping list.</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- STEP 3: PANTRY CHECK --- */}
                {step === 3 && (
                    <div className="animation-fade-in">
                        <p className="text-muted mb-4 fs-5">Tap items you already have to remove them from your list.</p>

                        <div className="d-flex flex-column gap-2">
                            {pantryItems.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className={`d-flex align-items-center p-3 rounded-4 border transition-all cursor-pointer ${!item.isChecked ? 'bg-light border-light opacity-50' : 'bg-white border-primary-subtle shadow-sm hover-shadow'}`}
                                    onClick={() => togglePantryCheck(idx)}
                                >
                                    {/* The Interactive Custom Checkbox */}
                                    <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 transition-all ${item.isChecked ? 'bg-primary text-white shadow-sm' : 'bg-secondary text-white'}`} style={{width: '28px', height: '28px', flexShrink: 0}}>
                                        <i className={`bi ${item.isChecked ? 'bi-check' : 'bi-dash'}`}></i>
                                    </div>

                                    {/* The Item Data */}
                                    <div className={`flex-grow-1 ${!item.isChecked ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                                        <span className={`fw-bold me-2 ${item.isChecked ? 'text-primary' : ''}`} style={{display: 'inline-block', minWidth: '50px'}}>
                                            {item.quantity ? decimalToFraction(item.quantity) : ''} {item.unit}
                                        </span>
                                        <span className="fw-bold fs-6">{item.name}</span>
                                        {item.notes && <div className="text-muted small fst-italic lh-sm mt-1"><i className="bi bi-arrow-return-right me-1"></i>{item.notes}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </Modal.Body>

            <Modal.Footer className="border-top p-4 bg-white d-flex justify-content-between">
                {step === 1 && (
                    <>
                        <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" onClick={onHide}>Cancel</Button>
                        <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleNextFromMeals} disabled={meals.length === 0}>
                            Next Step <i className="bi bi-arrow-right ms-1"></i>
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" onClick={() => setStep(1)}><i className="bi bi-arrow-left me-1"></i> Back</Button>
                        <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleNextFromConflicts}>
                            Resolve & Continue <i className="bi bi-arrow-right ms-1"></i>
                        </Button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" onClick={() => setStep(conflicts.length > 0 ? 2 : 1)}>
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </Button>
                        <Button variant="success" size="lg" className="rounded-pill px-4 fw-bold shadow flex-grow-1 ms-3" onClick={handleSaveList} disabled={isLoading}>
                            {isLoading ? 'Saving...' : `Add ${pantryItems.filter(i => i.isChecked).length} Items`}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
}
