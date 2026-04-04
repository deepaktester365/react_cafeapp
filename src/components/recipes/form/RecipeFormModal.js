import { useState, useEffect } from 'react';
import { Modal, Button, Badge, Row, Col, Form, ProgressBar } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import IngredientEditModal from './IngredientEditModal';
import StepEditModal from './StepEditModal';
import HeaderEditModal from './HeaderEditModal';
import { decimalToFraction } from '../../../utils/mathUtils';

export const generateClientId = () => Math.random().toString(36).substr(2, 9);

export default function RecipeFormModal({ show, onHide, onSuccess, recipe = null }) {
    const api = useApi();
    const isEditing = !!recipe;

    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [options, setOptions] = useState({ units: [] });

    // Master State
    const [basicInfo, setBasicInfo] = useState({ name: '', description: '', author: '', servings: 1, prep_time: 0, cook_time: 0 });
    const [mainImage, setMainImage] = useState(null);
    const [tags, setTags] = useState([]);
    const [ingredientSections, setIngredientSections] = useState([]);
    const [stepSections, setStepSections] = useState([]);
    const [stepImages, setStepImages] = useState({});
    const [equipment, setEquipment] = useState([]); // <-- Add this
    const [eqInput, setEqInput] = useState(''); // <-- And this for the typing box

    // Sub-Modal States (Tracks which item is currently being edited)
    const [activeIng, setActiveIng] = useState(null); // { secIdx, itemIdx, data }
    const [activeStep, setActiveStep] = useState(null); // { secIdx, itemIdx, data }
    const [showHeaderEdit, setShowHeaderEdit] = useState(false);

    // --- INITIALIZATION (Unchanged) ---
    useEffect(() => {
        (async () => {
            const res = await api.get('/recipes/options');
            if (res.ok) setOptions(res.body);
        })();
    }, [api]);

    useEffect(() => {
        if (show) {
            setIsSaving(false); setUploadProgress(0); setMainImage(null); setStepImages({});
            if (recipe) {
                setBasicInfo({ name: recipe.name || '', description: recipe.description || '', author: recipe.author || '', servings: recipe.servings || 1, prep_time: recipe.prep_time || 0, cook_time: recipe.cook_time || 0 });
                setTags((recipe.tags || []).map(t => t.name));

                // ---> THE CRUCIAL MISSING LINK: Load existing equipment <---
                setEquipment((recipe.equipment || []).map(e => ({
                    ...e,
                    client_id: e.id ? e.id.toString() : generateClientId()
                })));

                const groupItems = (items, isIng) => {
                    if (!items || items.length === 0) return [];
                    const groups = {};
                    items.forEach(item => {
                        const sec = item.section_name || 'Main';
                        if (!groups[sec]) groups[sec] = [];
                        let processed = { ...item };

                        // Give EVERYTHING a client_id so it can be tracked!
                        processed.client_id = item.client_id || (item.id ? item.id.toString() : generateClientId());

                        // --- NEW: Process the array of outputs ---
                        processed.outputs = (item.outputs || []).map(o => ({
                            ...o,
                            client_id: o.client_id || (o.id ? o.id.toString() : generateClientId())
                        }));

                        if (!isIng) {
                            processed.links = processed.links ? processed.links.map(l => {
                                let type = 'ingredient';
                                let id = l.ingredient_id;
                                if (l.equipment_id) { type = 'equipment'; id = l.equipment_id; }
                                if (l.linked_output_id) { type = 'step'; id = l.linked_output_id; }

                                return { ...l, type, client_id: (id || '').toString() };
                            }) : [];
                        }
                        groups[sec].push(processed);
                    });
                    return Object.keys(groups).map(name => ({ name, items: groups[name] }));
                };
                setIngredientSections(groupItems(recipe.ingredients, true));
                setStepSections(groupItems(recipe.steps, false));
            } else {
                setBasicInfo({ name: '', description: '', author: '', servings: 1, prep_time: 0, cook_time: 0 });
                setIngredientSections([{ name: 'Main', items: [] }]);
                setStepSections([{ name: 'Main', items: [] }]);
                setTags([]);
                setEquipment([]); // Reset equipment for new recipes
            }
        }
    }, [show, recipe]);

    // --- REORDER HANDLERS ---
    const moveIngredient = (secIdx, itemIdx, direction) => {
        const n = [...ingredientSections];
        const items = n[secIdx].items;
        // Check if we are at the top or bottom bounds
        if (itemIdx + direction < 0 || itemIdx + direction >= items.length) return;

        // Swap the items
        const temp = items[itemIdx];
        items[itemIdx] = items[itemIdx + direction];
        items[itemIdx + direction] = temp;

        setIngredientSections(n);
    };

    const moveStep = (secIdx, itemIdx, direction) => {
        const n = [...stepSections];
        const items = n[secIdx].items;
        if (itemIdx + direction < 0 || itemIdx + direction >= items.length) return;

        const temp = items[itemIdx];
        items[itemIdx] = items[itemIdx + direction];
        items[itemIdx + direction] = temp;

        setStepSections(n);
    };

    const moveIngredientSection = (secIdx, direction) => {
        const n = [...ingredientSections];
        if (secIdx + direction < 0 || secIdx + direction >= n.length) return;
        const temp = n[secIdx];
        n[secIdx] = n[secIdx + direction];
        n[secIdx + direction] = temp;
        setIngredientSections(n);
    };

    const moveStepSection = (secIdx, direction) => {
        const n = [...stepSections];
        if (secIdx + direction < 0 || secIdx + direction >= n.length) return;
        const temp = n[secIdx];
        n[secIdx] = n[secIdx + direction];
        n[secIdx + direction] = temp;
        setStepSections(n);
    };

    // --- SUB-MODAL SAVE HANDLERS ---
    const handleSaveIngredient = (updatedIng) => {
        const n = [...ingredientSections];
        if (activeIng.itemIdx === -1) {
            // It's a new ingredient
            n[activeIng.secIdx].items.push(updatedIng);
        } else {
            // Update existing
            n[activeIng.secIdx].items[activeIng.itemIdx] = updatedIng;
        }
        setIngredientSections(n);
        setActiveIng(null);
    };

    const handleSaveStep = (updatedStep) => {
        const n = [...stepSections];
        if (activeStep.itemIdx === -1) {
            n[activeStep.secIdx].items.push(updatedStep);
        } else {
            n[activeStep.secIdx].items[activeStep.itemIdx] = updatedStep;
        }
        setStepSections(n);
        setActiveStep(null);
    };

    const deleteIngredient = (secIdx, itemIdx) => {
        const n = [...ingredientSections];
        n[secIdx].items.splice(itemIdx, 1);
        setIngredientSections(n);
    };

    const deleteStep = (secIdx, itemIdx) => {
        const n = [...stepSections];
        n[secIdx].items.splice(itemIdx, 1);
        setStepSections(n);
    };

    // --- MASTER SAVE LOGIC ---
    const handleSaveRecipe = async () => {
        if (!basicInfo.name.trim()) return alert("Recipe needs a name!");
        setIsSaving(true);
        // ... (This remains exactly the same as your previous handleSave code)
        // I will truncate the FormData generation here to save space, just paste your existing formData logic here!
        const formData = new FormData();
        Object.keys(basicInfo).forEach(key => formData.append(key, basicInfo[key]));
        if (mainImage) formData.append('image', mainImage);
        formData.append('tags', JSON.stringify(tags));

        let flatIngredients = [];
        ingredientSections.forEach(sec => sec.items.forEach(item => { if (item.name?.trim()) flatIngredients.push({ ...item, section_name: sec.name }); }));

        let flatSteps = [];
        let globalStepIndex = 0;
        stepSections.forEach((sec, secIdx) => sec.items.forEach((item, itemIdx) => {
            if (item.instruction?.trim()) {
                flatSteps.push({ ...item, section_name: sec.name });
                const localKey = `${secIdx}-${itemIdx}`;
                if (stepImages[localKey]) formData.append(`step_image_${globalStepIndex}`, stepImages[localKey]);
                globalStepIndex++;
            }
        }));

        formData.append('equipment', JSON.stringify(equipment));
        formData.append('ingredients', JSON.stringify(flatIngredients));
        formData.append('steps', JSON.stringify(flatSteps));

        try {
            const res = await api[isEditing ? 'put' : 'post'](isEditing ? `/recipes/${recipe.id}` : '/recipes', formData);
            if (res.ok) { onSuccess(res.body); onHide(); }
        } catch (e) { alert("Error saving"); }
        setIsSaving(false);
    };

    // Helper for flattening ingredients for the Step Modal
    const allIngredients = ingredientSections.flatMap(sec => sec.items.filter(ing => ing.name && ing.name.trim() !== ''));

    if (!show) return null;

    return (
        <>
            {/* MASTER BUILDER MODAL */}
            <Modal show={show && !activeIng && !activeStep} onHide={onHide} size="lg" centered backdrop="static" contentClassName="border-0 shadow-lg rounded-4">
                <Modal.Header closeButton={!isSaving} className="border-0 px-4 pt-4 pb-2 bg-surface">
                    <Modal.Title className="fw-bold text-primary">{isEditing ? 'Edit Recipe' : 'New Recipe'}</Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-4 bg-surface" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

                    {/* --- BASIC INFO (Clean Display) --- */}
                    <div className="mb-5 pb-4 border-bottom hover-row position-relative d-flex gap-4 align-items-center">
                        <div className="position-absolute top-0 end-0 hover-actions z-3">
                            <Button variant="light" size="sm" className="rounded-circle shadow-sm border text-muted" onClick={() => setShowHeaderEdit(true)}>
                                <i className="bi bi-pencil"></i>
                            </Button>
                        </div>

                        {/* Display Image Thumbnail */}
                        {(mainImage || recipe?.image_url) && (
                            <div style={{ width: '120px', height: '120px', flexShrink: 0 }} className="rounded-4 overflow-hidden shadow-sm border">
                                <img
                                    src={mainImage ? URL.createObjectURL(mainImage) : recipe?.image_url}
                                    alt="Cover"
                                    className="w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                        )}

                        <div className="flex-grow-1">
                            <h2 className="fw-bold mb-1">{basicInfo.name || 'Untitled Recipe'}</h2>
                            {basicInfo.description && <p className="text-body-75 mb-2">{basicInfo.description}</p>}

                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => <Badge bg="primary-subtle" text="primary" key={tag} className="rounded-pill fw-normal px-2">{tag}</Badge>)}
                            </div>

                            <div className="d-flex gap-3 text-muted small mt-1 text-header-caps">
                                {basicInfo.servings > 0 && <span><i className="bi bi-people me-1"></i>{basicInfo.servings} servings</span>}
                                {basicInfo.prep_time > 0 && <span><i className="bi bi-clock me-1"></i>{basicInfo.prep_time}m prep</span>}
                                {basicInfo.cook_time > 0 && <span><i className="bi bi-fire me-1"></i>{basicInfo.cook_time}m cook</span>}
                                {basicInfo.author && <span><i className="bi bi-person me-1"></i>{basicInfo.author}</span>}
                            </div>
                        </div>
                    </div>

                    {/* --- EQUIPMENT (Clean Display) --- */}
                    <div className="mb-5 pb-4 border-bottom">
                        <h5 className="fw-bold mb-3 d-flex align-items-center">
                            <i className="bi bi-tools text-primary me-2"></i> Equipment
                        </h5>
                        <div className="bg-surface-50 p-3 rounded-4 border">
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {equipment.map((eq) => (
                                    <Badge bg="white" text="dark" border="light" key={eq.client_id} className="rounded-pill px-3 py-2 fw-normal border shadow-sm d-flex align-items-center">
                                        {eq.name}
                                        <i className="bi bi-x ms-2 text-muted hover-opacity-100" style={{cursor:'pointer', fontSize: '1.1rem'}} onClick={() => setEquipment(equipment.filter(e => e.client_id !== eq.client_id))}></i>
                                    </Badge>
                                ))}
                            </div>
                            <Form.Control
                                size="sm"
                                className="border-dashed bg-transparent shadow-none"
                                placeholder="+ Type a tool (e.g., Stand Mixer) and press Enter"
                                value={eqInput}
                                onChange={e => setEqInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault();
                                        const val = eqInput.trim();
                                        if (val && !equipment.some(eq => eq.name.toLowerCase() === val.toLowerCase())) {
                                            setEquipment([...equipment, { name: val, client_id: generateClientId() }]);
                                        }
                                        setEqInput('');
                                    }
                                }}
                            />
                        </div>
                    </div>
                    {/* --- INGREDIENTS (Clean Display) --- */}
                    <div className="mb-5">
                        <h5 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-basket text-primary me-2"></i> Ingredients</h5>

                        {ingredientSections.map((sec, secIdx) => (
                            <div key={secIdx} className="mb-4">
                                {/* Editable Section Header */}
                                {/* Editable Section Header */}
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2 hover-row">
                                    <Form.Control
                                        className="fw-bold text-muted border-0 bg-transparent px-0 shadow-none text-header-caps w-auto flex-grow-1"
                                        style={{ fontSize: '0.9rem' }}
                                        value={sec.name}
                                        onChange={e => {
                                            const n = [...ingredientSections];
                                            n[secIdx].name = e.target.value;
                                            setIngredientSections(n);
                                        }}
                                        placeholder="Section Name (e.g., Frosting)"
                                    />

                                    {/* Section Level Actions */}
                                    <div className="hover-actions d-flex align-items-center">
                                        {ingredientSections.length > 1 && (
                                            <>
                                                <Button variant="light" size="sm" className="rounded-circle text-muted py-0 px-1 me-1" onClick={() => moveIngredientSection(secIdx, -1)} disabled={secIdx === 0}><i className="bi bi-arrow-up"></i></Button>
                                                <Button variant="light" size="sm" className="rounded-circle text-muted py-0 px-1 me-2" onClick={() => moveIngredientSection(secIdx, 1)} disabled={secIdx === ingredientSections.length - 1}><i className="bi bi-arrow-down"></i></Button>
                                            </>
                                        )}
                                        {/* Allow deleting a section if it's empty and it's not the only one left */}
                                        {sec.items.length === 0 && ingredientSections.length > 1 && (
                                            <i className="bi bi-trash text-danger hover-opacity-100 opacity-50" style={{cursor: 'pointer'}} onClick={() => {
                                                const n = [...ingredientSections];
                                                n.splice(secIdx, 1);
                                                setIngredientSections(n);
                                            }}></i>
                                        )}
                                    </div>
                                </div>

                                {sec.items.map((ing, itemIdx) => (
                                    <div key={itemIdx} className="d-flex align-items-center py-2 border-bottom border-light hover-row">
                                        <div className="flex-grow-1">
                                            <span className="fw-bold me-2">
                                                {decimalToFraction(ing.quantity)} {ing.unit === 'Other' ? ing.custom_unit : ing.unit}
                                            </span>
                                            <span>{ing.name}</span>
                                            {ing.notes && <span className="text-muted small ms-2 fst-italic">({ing.notes})</span>}
                                        </div>
                                        <div className="hover-actions d-flex gap-2">
                                            <Button variant="light" size="sm" className="rounded-circle text-muted" onClick={() => moveIngredient(secIdx, itemIdx, -1)} disabled={itemIdx === 0}><i className="bi bi-arrow-up"></i></Button>
                                            <Button variant="light" size="sm" className="rounded-circle text-muted" onClick={() => moveIngredient(secIdx, itemIdx, 1)} disabled={itemIdx === sec.items.length - 1}><i className="bi bi-arrow-down"></i></Button>
                                            <Button variant="light" size="sm" className="rounded-circle" onClick={() => setActiveIng({ secIdx, itemIdx, data: { ...ing } })}><i className="bi bi-pencil"></i></Button>
                                            <Button variant="light" size="sm" className="rounded-circle text-danger" onClick={() => deleteIngredient(secIdx, itemIdx)}><i className="bi bi-trash"></i></Button>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" size="sm" className="text-decoration-none mt-2 px-0" onClick={() => setActiveIng({ secIdx, itemIdx: -1, data: { client_id: generateClientId(), quantity: '', unit: 'whole', name: '', notes: '' } })}>
                                    + Add Ingredient
                                </Button>
                            </div>
                        ))}

                        {/* Button to add a completely new section */}
                        <Button variant="outline-secondary" size="sm" className="rounded-pill px-3 fw-bold mt-2 border-dashed" onClick={() => setIngredientSections([...ingredientSections, { name: 'New Section', items: [] }])}>
                            <i className="bi bi-collection me-1"></i> Add Section
                        </Button>
                    </div>

                    {/* --- STEPS (Clean Display) --- */}
                    <div className="mb-4">
                        <h5 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-list-check text-primary me-2"></i> Instructions</h5>

                        {stepSections.map((sec, secIdx) => (
                            <div key={secIdx} className="mb-4">
                                {/* Editable Section Header */}
                                {/* Editable Section Header */}
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-1 mb-3 hover-row">
                                    <Form.Control
                                        className="fw-bold text-muted border-0 bg-transparent px-0 shadow-none text-header-caps w-auto flex-grow-1"
                                        style={{ fontSize: '0.9rem' }}
                                        value={sec.name}
                                        onChange={e => {
                                            const n = [...stepSections];
                                            n[secIdx].name = e.target.value;
                                            setStepSections(n);
                                        }}
                                        placeholder="Section Name (e.g., Cake Assembly)"
                                    />

                                    {/* Section Level Actions */}
                                    <div className="hover-actions d-flex align-items-center">
                                        {stepSections.length > 1 && (
                                            <>
                                                <Button variant="light" size="sm" className="rounded-circle text-muted py-0 px-1 me-1" onClick={() => moveStepSection(secIdx, -1)} disabled={secIdx === 0}><i className="bi bi-arrow-up"></i></Button>
                                                <Button variant="light" size="sm" className="rounded-circle text-muted py-0 px-1 me-2" onClick={() => moveStepSection(secIdx, 1)} disabled={secIdx === stepSections.length - 1}><i className="bi bi-arrow-down"></i></Button>
                                            </>
                                        )}
                                        {sec.items.length === 0 && stepSections.length > 1 && (
                                            <i className="bi bi-trash text-danger hover-opacity-100 opacity-50" style={{cursor: 'pointer'}} onClick={() => {
                                                const n = [...stepSections];
                                                n.splice(secIdx, 1);
                                                setStepSections(n);
                                            }}></i>
                                        )}
                                    </div>
                                </div>

                                {sec.items.map((step, itemIdx) => (
                                    <div key={itemIdx} className="d-flex gap-3 py-3 border-bottom border-light hover-row">
                                        <div className="fw-bold text-body-50">{itemIdx + 1}.</div>
                                        <div className="flex-grow-1">
                                            <p className="mb-2">{step.instruction}</p>

                                            {step.outputs && step.outputs.length > 0 && (
                                                <div className="mt-2 d-flex flex-wrap gap-2">
                                                    {step.outputs.map((out, oIdx) => (
                                                        <Badge key={oIdx} bg="success" className="fw-normal rounded-pill px-3 py-1">
                                                            <i className="bi bi-box-seam me-1"></i> Yields: {decimalToFraction(out.quantity)} {out.unit} {out.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {step.links && step.links.length > 0 && (
                                                <div className="d-flex flex-wrap gap-2 mt-2">
                                                    {step.links.map((link, idx) => (
                                                        <Badge
                                                            bg={link.type === 'equipment' ? 'info' : 'secondary'}
                                                            key={idx}
                                                            className="fw-normal rounded-pill px-2 py-1 d-flex align-items-center"
                                                        >
                                                            {link.type === 'equipment' && <i className="bi bi-tools me-1"></i>}
                                                            {link.type === 'equipment'
                                                                ? equipment.find(e => e.client_id === link.client_id)?.name || 'Equipment'
                                                                : link.type === 'step'
                                                                    ? stepSections.flatMap(s => s.items).find(s => s.client_id === link.client_id)?.output_name || 'Component'
                                                                    : allIngredients.find(i => i.client_id === link.client_id)?.name || 'Ingredient'
                                                            }
                                                            {link.type === 'ingredient' && link.usage_text && (
                                                                <span className="opacity-75 ms-1">({link.usage_text})</span>
                                                            )}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="hover-actions d-flex gap-2 align-items-start">
                                            <Button variant="light" size="sm" className="rounded-circle text-muted" onClick={() => moveStep(secIdx, itemIdx, -1)} disabled={itemIdx === 0}><i className="bi bi-arrow-up"></i></Button>
                                            <Button variant="light" size="sm" className="rounded-circle text-muted" onClick={() => moveStep(secIdx, itemIdx, 1)} disabled={itemIdx === sec.items.length - 1}><i className="bi bi-arrow-down"></i></Button>
                                            <Button variant="light" size="sm" className="rounded-circle" onClick={() => setActiveStep({ secIdx, itemIdx, data: { ...step } })}><i className="bi bi-pencil"></i></Button>
                                            <Button variant="light" size="sm" className="rounded-circle text-danger" onClick={() => deleteStep(secIdx, itemIdx)}><i className="bi bi-trash"></i></Button>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" size="sm" className="text-decoration-none mt-2 px-0" onClick={() => setActiveStep({ secIdx, itemIdx: -1, data: { instruction: '', links: [], outputs: [], client_id: generateClientId() } })}>
                                    + Add Step
                                </Button>
                            </div>
                        ))}

                        {/* Button to add a completely new section */}
                        <Button variant="outline-secondary" size="sm" className="rounded-pill px-3 fw-bold mt-2 border-dashed" onClick={() => setStepSections([...stepSections, { name: 'New Section', items: [] }])}>
                            <i className="bi bi-collection me-1"></i> Add Section
                        </Button>
                    </div>

                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4 pt-3 bg-surface">
                    <Button variant="primary" className="px-4 fw-bold rounded-pill w-100" onClick={handleSaveRecipe} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* --- SUB-MODAL: EDIT HEADER --- */}
            <HeaderEditModal
                show={showHeaderEdit}
                onHide={() => setShowHeaderEdit(false)}
                initialBasicInfo={basicInfo}
                initialTags={tags}
                initialMainImage={mainImage}
                existingImageUrl={recipe?.image_url}
                onSave={(data) => {
                    setBasicInfo(data.basicInfo);
                    setTags(data.tags);
                    setMainImage(data.mainImage);
                    setShowHeaderEdit(false);
                }}
            />

            {/* --- SUB-MODAL: EDIT INGREDIENT --- */}
            <IngredientEditModal
                show={!!activeIng}
                onHide={() => setActiveIng(null)}
                options={options}
                ingredientData={activeIng?.data}
                onSave={(updatedData) => {
                    // 1. Update state live as they type in the sub-modal
                    setActiveIng(prev => ({ ...prev, data: updatedData }));

                    // 2. Sync it back to the master list so background updates
                    const n = [...ingredientSections];
                    if (activeIng.itemIdx === -1) {
                        if (!n[activeIng.secIdx].items) n[activeIng.secIdx].items = [];
                        n[activeIng.secIdx].items.push(updatedData);

                        // Shift index so subsequent keystrokes update instead of adding a new row!
                        setActiveIng(prev => ({ ...prev, itemIdx: n[activeIng.secIdx].items.length - 1 }));
                    } else {
                        n[activeIng.secIdx].items[activeIng.itemIdx] = updatedData;
                    }
                    setIngredientSections(n);

                    // DO NOT put setActiveIng(null) here!
                }}
                // --- NEW: Handle the Bulk Import Array ---
                onSaveBulk={(newItemsArray) => {
                    const n = [...ingredientSections];
                    const targetSection = n[activeIng.secIdx];

                    if (!targetSection.items) targetSection.items = [];

                    // Ensure all imported items inherit the correct section name
                    // (e.g., if they clicked 'Bulk Import' under the 'Dough' section)
                    const sectionName = targetSection.name || 'Main';
                    const itemsWithSection = newItemsArray.map(item => ({
                        ...item,
                        section_name: sectionName
                    }));

                    // Append the new array of items to the existing items
                    targetSection.items = [...targetSection.items, ...itemsWithSection];

                    setIngredientSections(n);
                    setActiveIng(null); // Close the modal and reset state
                }}
            />

            {/* --- SUB-MODAL: EDIT STEP --- */}
            <StepEditModal
                show={!!activeStep}
                onHide={() => setActiveStep(null)}
                stepData={activeStep?.data}
                allIngredients={allIngredients}
                allEquipment={equipment}
                allSteps={stepSections}
                onSave={(updatedData) => {
                    const newSections = [...stepSections];
                    const secIdx = activeStep.secIdx;
                    const itemIdx = activeStep.itemIdx;

                    // --- THE IMAGE INTERCEPTOR ---
                    if (updatedData.newImageFile) {
                        // Calculate the localKey exactly how handleSaveRecipe expects it
                        const safeItemIdx = itemIdx === -1 ? newSections[secIdx].items.length : itemIdx;
                        const localKey = `${secIdx}-${safeItemIdx}`;

                        // Store the actual file in your master stepImages state
                        setStepImages(prev => ({ ...prev, [localKey]: updatedData.newImageFile }));

                        // Create a temporary URL so the master list view shows the image immediately
                        updatedData.image_url = URL.createObjectURL(updatedData.newImageFile);

                        // Delete the raw file from the JSON payload so it doesn't break the database text save
                        delete updatedData.newImageFile;
                    }

                    if (itemIdx === -1) {
                        newSections[secIdx].items.push(updatedData);
                        // Update activeStep so it doesn't keep adding new rows if they keep typing
                        setActiveStep({ secIdx, itemIdx: newSections[secIdx].items.length - 1, data: updatedData });
                    } else {
                        newSections[secIdx].items[itemIdx] = updatedData;
                        setActiveStep({ secIdx, itemIdx, data: updatedData });
                    }

                    setStepSections(newSections);
                }}
            />
        </>
    );
}
