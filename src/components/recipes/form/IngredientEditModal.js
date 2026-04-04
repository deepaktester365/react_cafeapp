import { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form, Tabs, Tab, Badge } from 'react-bootstrap';
import { fractionToDecimal, decimalToFraction } from '../../../utils/mathUtils';

// --- THE SMART PARSER ENGINE ---
const parseIngredientLine = (line, availableUnits) => {
    let text = line.trim();
    if (!text) return null;

    // 1. Unicode fraction cleanup
    const fractionMap = {
        '½': ' 1/2', '⅓': ' 1/3', '⅔': ' 2/3', '¼': ' 1/4', '¾': ' 3/4',
        '⅕': ' 1/5', '⅖': ' 2/5', '⅗': ' 3/5', '⅘': ' 4/5', '⅙': ' 1/6',
        '⅚': ' 5/6', '⅛': ' 1/8', '⅜': ' 3/8', '⅝': ' 5/8', '⅞': ' 7/8'
    };
    for (const [uni, frac] of Object.entries(fractionMap)) {
        text = text.split(uni).join(frac);
    }
    text = text.trim();

    let rawQty = '';
    let quantity = null;
    let unit = 'Other';
    let custom_unit = '';
    let name = '';
    let notes = '';

    // 2. Extract Quantity (Matches: "1 1/2", "1/2", "1.5", "1")
    const qtyRegex = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s*/;
    const qtyMatch = text.match(qtyRegex);
    if (qtyMatch) {
        rawQty = qtyMatch[1].trim();
        quantity = fractionToDecimal(rawQty);
        text = text.substring(qtyMatch[0].length).trim();
    }

    // 3. Extract Unit
    const unitMap = {
        'cup': 'cups', 'cups': 'cups', 'c': 'cups', 'c.': 'cups',
        'tbsp': 'tbsp', 'tbsps': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
        'tsp': 'tsp', 'tsps': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
        'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
        'g': 'g', 'gram': 'g', 'grams': 'g',
        'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
        'ml': 'ml', 'l': 'l',
        'clove': 'cloves', 'cloves': 'cloves',
        'pinch': 'pinch', 'pinches': 'pinch',
        'dash': 'dash', 'bunch': 'bunch', 'bunches': 'bunch',
        'slice': 'slices', 'slices': 'slices',
        'can': 'can', 'cans': 'can', 'package': 'package', 'packages': 'package'
    };

    const firstWordMatch = text.match(/^([a-zA-Z.]+)\s*/);
    if (firstWordMatch) {
        const firstWord = firstWordMatch[1].toLowerCase();
        if (unitMap[firstWord]) {
            const mappedUnit = unitMap[firstWord];
            // Check if our mapped unit matches your dropdown options
            if (availableUnits?.includes(mappedUnit)) {
                unit = mappedUnit;
            } else {
                unit = 'Other';
                custom_unit = mappedUnit;
            }
            text = text.substring(firstWordMatch[0].length).trim();
        }
    }

    // 4. Extract Name and Notes (Split by comma)
    const commaIndex = text.indexOf(',');
    if (commaIndex !== -1) {
        name = text.substring(0, commaIndex).trim();
        notes = text.substring(commaIndex + 1).trim();
    } else {
        name = text;
    }

    // Capitalize the first letter of the ingredient name
    if (name) name = name.charAt(0).toUpperCase() + name.slice(1);

    return {
        client_id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        rawQty, // Store string so user can edit "1/2" before saving
        quantity,
        unit,
        custom_unit,
        name,
        notes,
        section_name: 'Main'
    };
};

// --- THE MODAL COMPONENT ---
// Notice the new 'onSaveBulk' prop we added!
export default function IngredientEditModal({ show, onHide, onSave, onSaveBulk, ingredientData, options }) {

    // UI State
    const [activeTab, setActiveTab] = useState('single');

    // Single Edit State
    const [localQty, setLocalQty] = useState('');

    // Bulk Parse State
    const [bulkText, setBulkText] = useState('');
    const [parsedItems, setParsedItems] = useState([]);

    useEffect(() => {
        if (show) {
            // Reset Bulk States
            setBulkText('');
            setParsedItems([]);

            // Set Single State
            if (ingredientData?.name) {
                setLocalQty(decimalToFraction(ingredientData.quantity));
                setActiveTab('single');
            } else {
                setLocalQty('');
                setActiveTab('bulk'); // Default to bulk if creating a brand new item!
            }
        }
    }, [show, ingredientData?.client_id]);

    if (!show || !ingredientData) return null;

    // --- SINGLE EDIT HANDLER ---
    const handleQtyChange = (val) => {
        setLocalQty(val);
        const dec = fractionToDecimal(val);
        if (!isNaN(dec)) {
            onSave({ ...ingredientData, quantity: dec });
        }
    };

    // --- BULK PARSE HANDLERS ---
    const handleParseText = () => {
        const lines = bulkText.split('\n').filter(line => line.trim() !== '');
        const results = lines.map(line => parseIngredientLine(line, options?.units));
        setParsedItems(results.filter(item => item !== null));
    };

    const updateParsedItem = (index, field, value) => {
        setParsedItems(prev => prev.map((item, i) => {
            if (i === index) {
                const updated = { ...item, [field]: value };
                if (field === 'rawQty') updated.quantity = fractionToDecimal(value);
                return updated;
            }
            return item;
        }));
    };

    const handleSaveBulkArray = () => {
        // Only run if the parent component actually passed the bulk save function
        if (onSaveBulk) {
            onSaveBulk(parsedItems);
        } else {
            console.error("The parent component needs an 'onSaveBulk' prop!");
        }
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered size={activeTab === 'bulk' ? 'lg' : 'md'} backdrop="static" contentClassName="border-0 shadow-lg rounded-4 transition-all">
            <Modal.Header closeButton className="border-0 pb-2 bg-light rounded-top-4">
                <Modal.Title className="fs-5 fw-bold w-100">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="border-bottom-0 custom-tabs"
                    >
                        <Tab eventKey="single" title="Single Item" />
                        {!ingredientData.name && <Tab eventKey="bulk" title="Bulk Import" />}
                    </Tabs>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-4 bg-surface">

                {/* --- TAB 1: SINGLE ITEM EDIT --- */}
                {activeTab === 'single' && (
                    <div className="animation-fade-in">
                        <Row className="g-3">
                            <Col xs={4}>
                                <Form.Label className="small fw-bold text-muted text-header-caps">Quantity</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={localQty}
                                    onChange={e => handleQtyChange(e.target.value)}
                                    placeholder="e.g. 1 1/2"
                                />
                            </Col>
                            <Col xs={8}>
                                <Form.Label className="small fw-bold text-muted text-header-caps">Unit</Form.Label>
                                <Form.Select value={ingredientData.unit} onChange={e => onSave({...ingredientData, unit: e.target.value})}>
                                    {options.units?.map(u => <option key={u} value={u}>{u}</option>)}
                                </Form.Select>
                            </Col>

                            {ingredientData.unit === 'Other' && (
                                <Col xs={12}>
                                    <Form.Control value={ingredientData.custom_unit} onChange={e => onSave({...ingredientData, custom_unit: e.target.value})} placeholder="Custom unit (e.g. pinch)" />
                                </Col>
                            )}

                            <Col xs={12}>
                                <Form.Label className="small fw-bold text-muted text-header-caps">Ingredient Name</Form.Label>
                                <Form.Control className="fw-bold" value={ingredientData.name} onChange={e => onSave({...ingredientData, name: e.target.value})} placeholder="e.g. Flour" />
                            </Col>
                            <Col xs={12}>
                                <Form.Label className="small fw-bold text-muted text-header-caps">Prep Notes (Optional)</Form.Label>
                                <Form.Control size="sm" className="text-muted" value={ingredientData.notes} onChange={e => onSave({...ingredientData, notes: e.target.value})} placeholder="e.g. finely diced" />
                            </Col>
                        </Row>
                    </div>
                )}

                {/* --- TAB 2: BULK IMPORT --- */}
                {activeTab === 'bulk' && (
                    <div className="animation-fade-in">
                        {parsedItems.length === 0 ? (
                            <>
                                <p className="text-muted small mb-2"><i className="bi bi-info-circle me-1"></i>Paste your ingredient list below. Each item should be on a new line.</p>
                                <Form.Control
                                    as="textarea"
                                    rows={8}
                                    className="bg-light border-light shadow-sm"
                                    placeholder="2 cups all-purpose flour&#10;1 tsp baking powder&#10;1/2 tsp salt&#10;1 large egg, beaten"
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                />
                                <div className="text-end mt-3">
                                    <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleParseText} disabled={!bulkText.trim()}>
                                        <i className="bi bi-magic me-2"></i>Parse Ingredients
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold text-primary mb-0">Verify {parsedItems.length} Ingredients</h6>
                                    <Button variant="link" size="sm" className="text-muted text-decoration-none p-0" onClick={() => setParsedItems([])}>
                                        <i className="bi bi-arrow-counterclockwise me-1"></i>Start Over
                                    </Button>
                                </div>

                                {/* Verification Grid */}
                                <div className="bg-light rounded-4 p-3 border" style={{ maxHeight: '40vh', overflowY: 'auto', overflowX: 'hidden' }}>
                                    {parsedItems.map((item, idx) => (
                                        <Row key={idx} className="g-2 mb-2 pb-2 border-bottom align-items-center">
                                            <Col xs={2}>
                                                <Form.Control size="sm" placeholder="Qty" value={item.rawQty} onChange={(e) => updateParsedItem(idx, 'rawQty', e.target.value)} />
                                            </Col>
                                            <Col xs={3}>
                                                <Form.Select size="sm" value={item.unit} onChange={(e) => updateParsedItem(idx, 'unit', e.target.value)}>
                                                    {options.units?.map(u => <option key={u} value={u}>{u}</option>)}
                                                </Form.Select>
                                            </Col>
                                            <Col xs={4}>
                                                <Form.Control size="sm" className="fw-bold" placeholder="Name" value={item.name} onChange={(e) => updateParsedItem(idx, 'name', e.target.value)} />
                                            </Col>
                                            <Col xs={3}>
                                                <Form.Control size="sm" placeholder="Notes" value={item.notes} onChange={(e) => updateParsedItem(idx, 'notes', e.target.value)} />
                                            </Col>

                                            {/* Show custom unit input if necessary */}
                                            {item.unit === 'Other' && (
                                                <Col xs={12} className="mt-1">
                                                    <Form.Control size="sm" placeholder="Custom unit (e.g. pinch)" value={item.custom_unit} onChange={(e) => updateParsedItem(idx, 'custom_unit', e.target.value)} />
                                                </Col>
                                            )}
                                        </Row>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 p-4">
                {activeTab === 'single' ? (
                    <Button variant="primary" className="rounded-pill px-4 w-100 fw-bold shadow-sm" onClick={onHide}>Done</Button>
                ) : (
                    <Button variant="success" className="rounded-pill px-4 w-100 fw-bold shadow-sm" onClick={handleSaveBulkArray} disabled={parsedItems.length === 0}>
                        Save All {parsedItems.length} Ingredients
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}
