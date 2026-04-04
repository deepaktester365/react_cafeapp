import { useState, useEffect } from 'react';
import { Container, Button, Card, Badge } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import MealPlanModal from './MealPlanModal';
import GenerateListWizard from './GenerateListWizard';

// --- DATE HELPERS ---
const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

const formatDateForInput = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date - offset)).toISOString().split('T')[0];
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export default function MealPlannerContainer() {
    const api = useApi();

    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [mealPlans, setMealPlans] = useState([]);
    const [recipes, setRecipes] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [activePlan, setActivePlan] = useState(null);
    const [showWizard, setShowWizard] = useState(false);

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
    const startDateStr = formatDateForInput(weekDays[0]);
    const endDateStr = formatDateForInput(weekDays[6]);

    // Fetch Recipes (for the dropdown)
    useEffect(() => {
        (async () => {
            const res = await api.get('/recipes');
            if (res.ok) {
                // Safely catch the array whether it's paginated under .items, .data, or sent directly
                const recipeList = res.body.items || res.body.data || res.body || [];
                setRecipes(recipeList);
            }
        })();
    }, [api]);

    // Fetch Meal Plans for the current week
    const fetchMealPlans = async () => {
        const res = await api.get(`/meal-plans?start_date=${startDateStr}&end_date=${endDateStr}`);
        if (res.ok) setMealPlans(res.body);
    };

    useEffect(() => {
        fetchMealPlans();
        // eslint-disable-next-line
    }, [startDateStr, endDateStr, api]);

    const handlePreviousWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
    const handleNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
    const handleToday = () => setCurrentWeekStart(getMonday(new Date()));

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateShoppingList = () => {
        setShowWizard(true);
    };

    const handleSaveMeal = async (formData) => {
        const isEditing = !!activePlan?.id;
        const endpoint = isEditing ? `/meal-plans/${activePlan.id}` : '/meal-plans';
        const method = isEditing ? 'put' : 'post';

        const res = await api[method](endpoint, formData);
        if (res.ok) {
            setShowModal(false);
            fetchMealPlans();
        } else {
            alert("Failed to save meal plan.");
        }
    };

    const handleDeleteMeal = async (id) => {
        if (!window.confirm("Remove this meal?")) return;
        const res = await api.delete(`/meal-plans/${id}`);
        if (res.ok) fetchMealPlans();
    };

    const openAddModal = (dateStr) => {
        setActivePlan({ date: dateStr, meal_type: 'Dinner' });
        setShowModal(true);
    };

    const openEditModal = (plan) => {
        setActivePlan(plan);
        setShowModal(true);
    };

    return (
        <Container className="py-4">
            {/* Header & Navigation */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                <h2 className="fw-bold mb-0"><i className="bi bi-calendar-week text-primary me-2"></i> Meal Planner</h2>

                <div className="d-flex gap-3 align-items-center">
                    <Button
                        variant="primary"
                        className="rounded-pill px-4 fw-bold shadow-sm"
                        onClick={handleGenerateShoppingList}
                        disabled={isGenerating || mealPlans.length === 0}
                    >
                        {isGenerating ? 'Generating...' : <><i className="bi bi-cart-plus-fill me-2"></i> Generate List</>}
                    </Button>

                    {/* EXISTING NAV */}
                    <div className="d-flex align-items-center gap-2 bg-surface p-1 rounded-pill shadow-sm border">
                        <Button variant="light" className="rounded-pill px-3" onClick={handlePreviousWeek}><i className="bi bi-chevron-left"></i></Button>
                        <Button variant="light" className="rounded-pill px-4 fw-bold" onClick={handleToday}>Today</Button>
                        <Button variant="light" className="rounded-pill px-3" onClick={handleNextWeek}><i className="bi bi-chevron-right"></i></Button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="row g-3">
                {weekDays.map(date => {
                    const dateStr = formatDateForInput(date);
                    // Filter meals for this specific day
                    const dayMeals = mealPlans.filter(p => p.date === dateStr);

                    const isToday = dateStr === formatDateForInput(new Date());

                    return (
                        <div key={dateStr} className="col-12 col-xl mb-3">
                            <Card className={`h-100 border-0 shadow-sm rounded-4 ${isToday ? 'bg-primary-subtle' : 'bg-surface'}`}>
                                <Card.Header className={`border-0 bg-transparent pt-3 pb-2 d-flex justify-content-between align-items-center ${isToday ? 'text-primary' : ''}`}>
                                    <div>
                                        <div className="small fw-bold text-header-caps opacity-75">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div className="fs-5 fw-bold">{date.getDate()}</div>
                                    </div>
                                    <Button variant="link" size="sm" className="text-decoration-none p-0 fs-5" onClick={() => openAddModal(dateStr)}>
                                        <i className="bi bi-plus-circle-fill"></i>
                                    </Button>
                                </Card.Header>
                                <Card.Body className="p-2 d-flex flex-column gap-2">
                                    {dayMeals.length === 0 && (
                                        <div className="text-center py-4 text-muted small opacity-50 fst-italic">No meals planned</div>
                                    )}
                                    {dayMeals.map(meal => (
                                        <div key={meal.id} className="bg-white p-2 rounded-3 shadow-sm border position-relative hover-row">
                                            {/* --- NEW: Split header for Meal Type and Servings Badge --- */}
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <Badge bg="light" text="dark" className="border fw-bold" style={{ fontSize: '0.65rem' }}>
                                                    {meal.meal_type}
                                                </Badge>

                                                {/* Only show servings badge if it's a recipe and servings are set */}
                                                {meal.recipe_id && meal.servings && (
                                                    <Badge bg="primary-subtle" text="primary" className="border border-primary-subtle fw-bold" style={{ fontSize: '0.65rem' }}>
                                                        <i className="bi bi-people-fill me-1"></i>{meal.servings}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="fw-bold lh-sm mb-1" style={{ fontSize: '0.9rem' }}>
                                                {meal.recipe_id ? meal.recipe_name : meal.custom_title}
                                            </div>

                                            {meal.recipe_image && (
                                                <img src={meal.recipe_image} alt="Meal" className="img-fluid rounded-2 mt-1" style={{ height: '60px', width: '100%', objectFit: 'cover' }} />
                                            )}

                                            <div className="position-absolute top-0 end-0 m-1 hover-actions d-flex gap-1 bg-white p-1 rounded shadow-sm border z-3">
                                                <Button variant="light" size="sm" className="py-0 px-1 text-muted" onClick={() => openEditModal(meal)}><i className="bi bi-pencil"></i></Button>
                                                <Button variant="light" size="sm" className="py-0 px-1 text-danger" onClick={() => handleDeleteMeal(meal.id)}><i className="bi bi-trash"></i></Button>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </div>
                    );
                })}
            </div>

            <MealPlanModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleSaveMeal}
                planData={activePlan}
                recipes={recipes}
            />
            <GenerateListWizard
                show={showWizard}
                onHide={() => setShowWizard(false)}
                startDate={startDateStr}
                endDate={endDateStr}
                onSuccess={(msg) => alert(msg)}
            />
        </Container>
    );
}
