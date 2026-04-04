import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

export default function MealPlanModal({ show, onHide, onSave, planData, recipes }) {
    const [formData, setFormData] = useState({
        date: '',
        meal_type: 'Dinner',
        recipe_id: '',
        custom_title: '',
        servings: '' // <-- NEW
    });

    useEffect(() => {
        if (show) {
            if (planData) {
                setFormData({
                    date: planData.date || '',
                    meal_type: planData.meal_type || 'Dinner',
                    recipe_id: planData.recipe_id || '',
                    custom_title: planData.custom_title || '',
                    servings: planData.servings || '' // <-- NEW
                });
            } else {
                setFormData({
                    date: '',
                    meal_type: 'Dinner',
                    recipe_id: '',
                    custom_title: '',
                    servings: ''
                });
            }
        }
    }, [show, planData]);

    const handleSave = () => {
        if (!formData.date) return alert("Please select a date.");
        if (!formData.recipe_id && !formData.custom_title.trim()) {
            return alert("Please select a recipe OR enter a custom meal.");
        }
        onSave(formData);
    };

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">{planData?.id ? 'Edit Meal' : 'Plan a Meal'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Label className="small fw-bold text-muted text-header-caps">Date</Form.Label>
                        <Form.Control type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </Col>
                    <Col md={6}>
                        <Form.Label className="small fw-bold text-muted text-header-caps">Meal Type</Form.Label>
                        <Form.Select value={formData.meal_type} onChange={e => setFormData({...formData, meal_type: e.target.value})}>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Snack">Snack</option>
                        </Form.Select>
                    </Col>

                    <Col md={12}>
                        <hr className="my-2" />
                    </Col>

                    {/* --- NEW: Split Recipe & Servings into a row --- */}
                    <Col xs={8}>
                        <Form.Label className="small fw-bold text-muted text-header-caps">Select Recipe</Form.Label>
                        <Form.Select
                            value={formData.recipe_id}
                            onChange={e => setFormData({...formData, recipe_id: e.target.value, custom_title: ''})}
                        >
                            <option value="">-- No Recipe (Custom) --</option>
                            {recipes.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </Form.Select>
                    </Col>

                    <Col xs={4}>
                        <Form.Label className="small fw-bold text-muted text-header-caps">Servings</Form.Label>
                        <Form.Control
                            type="number"
                            min="0.5"
                            step="0.5"
                            placeholder="Auto"
                            disabled={!formData.recipe_id} // Disable if custom meal
                            value={formData.servings}
                            onChange={e => setFormData({...formData, servings: e.target.value})}
                        />
                    </Col>

                    <Col md={12}>
                        <div className="text-center text-muted small fw-bold mb-2 mt-2">OR</div>
                        <Form.Label className="small fw-bold text-muted text-header-caps">Custom Meal (e.g., Eat Out)</Form.Label>
                        <Form.Control
                            value={formData.custom_title}
                            onChange={e => setFormData({...formData, custom_title: e.target.value, recipe_id: '', servings: ''})}
                            placeholder="Pizza Delivery"
                            disabled={!!formData.recipe_id}
                        />
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" className="rounded-pill px-4 fw-bold" onClick={onHide}>Cancel</Button>
                <Button variant="primary" className="rounded-pill px-4 fw-bold" onClick={handleSave}>Save Meal</Button>
            </Modal.Footer>
        </Modal>
    );
}
