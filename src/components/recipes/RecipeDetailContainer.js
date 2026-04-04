import { useState, useEffect } from 'react';
import { Container, Row, Col, Badge, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../contexts/ApiProvider';
import { decimalToFraction } from '../../utils/mathUtils';
import LoadingState from '../common/LoadingState';
import RecipeFormModal from './form/RecipeFormModal';
import CookingModeModal from './CookingModeModal';

export default function RecipeDetailContainer({ recipeId }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCookingMode, setShowCookingMode] = useState(false);

  // Fetch the single recipe
  useEffect(() => {
    (async () => {
      setLoading(true);
      const response = await api.get(`/recipes/${recipeId}`);
      if (response.ok) {
        setRecipe(response.body);
        setError(null);
      } else {
        setError("Failed to load recipe.");
      }
      setLoading(false);
    })();
  }, [api, recipeId]);

  const handleDelete = async () => {
      if (window.confirm("Are you sure you want to delete this recipe?")) {
          const res = await api.delete(`/recipes/${recipeId}`);
          if (res.ok) {
              navigate('/recipes');
          } else {
              alert("Failed to delete recipe");
          }
      }
  };

  if (loading) return <LoadingState message="Warming up the oven..." />;
  if (error || !recipe) return <div className="text-danger text-center py-5">{error || "Recipe not found"}</div>;

  // Helper function to group items by their section_name (e.g., "Main", "Frosting")
  const groupItems = (items) => {
      return items.reduce((acc, item) => {
          const section = item.section_name || 'Main';
          if (!acc[section]) acc[section] = [];
          acc[section].push(item);
          return acc;
      }, {});
  };

  const ingredientGroups = groupItems(recipe.ingredients || []);
  const stepGroups = groupItems(recipe.steps || []);
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Container fluid className="py-4">
      {/* Top Navigation & Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="link" className="text-decoration-none text-body p-0 d-flex align-items-center" onClick={() => navigate('/recipes')}>
            <i className="bi bi-arrow-left me-2"></i> Back to Cookbook
        </Button>
        <div className="d-flex gap-2">
            <Button
                variant="primary"
                size="sm"
                className="rounded-pill px-4 fw-bold shadow-sm"
                onClick={() => setShowCookingMode(true)}
                disabled={!recipe.steps || recipe.steps.length === 0}
            >
                <i className="bi bi-play-fill me-1"></i> Start Cooking
            </Button>

            <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => setShowEditModal(true)}>
                <i className="bi bi-pencil-fill me-1"></i> Edit
            </Button>
            <Button variant="outline-danger" size="sm" className="rounded-pill px-3 fw-bold" onClick={handleDelete}>
                <i className="bi bi-trash-fill"></i>
            </Button>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5 bg-surface">
          {recipe.image_url && (
              <div style={{ height: '300px', backgroundColor: 'var(--nook-surface-50)' }}>
                  <img src={recipe.image_url} alt={recipe.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
              </div>
          )}
          <Card.Body className="p-4 p-md-5 text-center">
              {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mb-3 d-flex justify-content-center gap-2 flex-wrap">
                      {recipe.tags.map(tag => (
                          <Badge bg="primary-subtle" text="primary" key={tag.id} className="rounded-pill px-3 py-2 fw-normal">
                              {tag.name}
                          </Badge>
                      ))}
                  </div>
              )}
              <h1 className="fw-bold display-6 mb-2">{recipe.name}</h1>
              {recipe.author && <p className="text-muted mb-4">Recipe by {recipe.author}</p>}

              {recipe.description && <p className="lead fs-6 text-body-75 mx-auto mb-4" style={{maxWidth: '700px'}}>{recipe.description}</p>}

              {/* Timing & Metadata Bar */}
              <div className="d-flex flex-wrap justify-content-center gap-4 pt-3 border-top mx-auto" style={{maxWidth: '600px'}}>
                  <div className="text-center">
                      <small className="text-header-caps text-muted d-block mb-1">Prep</small>
                      <span className="fw-bold fs-5">{recipe.prep_time || '--'} m</span>
                  </div>
                  <div className="text-center">
                      <small className="text-header-caps text-muted d-block mb-1">Cook</small>
                      <span className="fw-bold fs-5">{recipe.cook_time || '--'} m</span>
                  </div>
                  <div className="text-center">
                      <small className="text-header-caps text-muted d-block mb-1">Total</small>
                      <span className="fw-bold fs-5 text-primary">{totalTime > 0 ? `${totalTime} m` : '--'}</span>
                  </div>
                  <div className="text-center border-start ps-4">
                      <small className="text-header-caps text-muted d-block mb-1">Servings</small>
                      <span className="fw-bold fs-5">{recipe.servings || '--'}</span>
                  </div>
              </div>
          </Card.Body>
      </Card>

      {/* Main Content: Ingredients & Steps */}
      <Row className="g-5">
          {/* Left Column: Ingredients & Equipment */}
          <Col lg={4}>
              <div className="bg-surface rounded-4 p-4 shadow-sm border border-light mb-4">
                  <h4 className="fw-bold mb-4 d-flex align-items-center">
                      <i className="bi bi-basket text-primary me-2"></i> Ingredients
                  </h4>

                  {Object.keys(ingredientGroups).map((section) => (
                      <div key={section} className="mb-4">
                          {section !== 'Main' && <h6 className="fw-bold text-header-caps text-muted border-bottom pb-2 mb-3">{section}</h6>}
                          <ul className="list-unstyled mb-0">
                              {ingredientGroups[section].map((ing, idx) => (
                                  <li key={idx} className="mb-2 pb-2 border-bottom border-light d-flex align-items-start">
                                      <i className="bi bi-circle text-primary opacity-25 me-2 mt-1" style={{fontSize: '0.6rem'}}></i>
                                      <div>
                                          <span className="fw-bold me-2">
                                              {ing.quantity ? decimalToFraction(ing.quantity) : ''} {ing.unit === 'Other' ? ing.custom_unit : ing.unit}
                                          </span>
                                          <span className="text-body-75">{ing.name}</span>
                                          {ing.notes && <span className="text-muted small ms-1 fst-italic">({ing.notes})</span>}
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  ))}
              </div>

              {recipe.equipment && recipe.equipment.length > 0 && (
                  <div className="bg-surface rounded-4 p-4 shadow-sm border border-light">
                      <h5 className="fw-bold mb-3 text-header-caps">Equipment</h5>
                      <ul className="list-unstyled mb-0 d-flex flex-wrap gap-2">
                          {recipe.equipment.map((eq, idx) => (
                              <li key={idx}><Badge bg="light" text="dark" className="border fw-normal px-2 py-1">{eq.name}</Badge></li>
                          ))}
                      </ul>
                  </div>
              )}
          </Col>

          {/* Right Column: Instructions */}
          <Col lg={8}>
              <div className="bg-surface rounded-4 p-4 p-md-5 shadow-sm border border-light h-100">
                  <h4 className="fw-bold mb-4 d-flex align-items-center">
                      <i className="bi bi-list-check text-primary me-2"></i> Instructions
                  </h4>

                  {Object.keys(stepGroups).map((section) => (
                      <div key={section} className="mb-5">
                          {section !== 'Main' && <h5 className="fw-bold text-header-caps text-primary border-bottom pb-2 mb-4">{section}</h5>}

                          {stepGroups[section].map((step, idx) => (
                              <div key={idx} className="d-flex mb-4 pb-4 border-bottom border-light">
                                  <div className="me-3 me-md-4 pt-1">
                                      <div className="bg-primary text-white fw-bold rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: '32px', height: '32px'}}>
                                          {step.order_index}
                                      </div>
                                  </div>
                                  <div className="flex-grow-1">
                                      <p className="fs-6 text-body-75 mb-3 lh-lg" style={{whiteSpace: 'pre-wrap'}}>
                                          {step.instruction}
                                      </p>
                                      {step.image_url && (
                                          <img src={step.image_url} alt={`Step ${step.order_index}`} className="img-fluid rounded-3 shadow-sm" style={{maxHeight: '250px'}} />
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  ))}
              </div>
          </Col>
      </Row>

      <RecipeFormModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          recipe={recipe}
          onSuccess={(updatedRecipe) => {
              setRecipe(updatedRecipe); // Update local state instantly
              setShowEditModal(false);
          }}
      />

      <CookingModeModal
          show={showCookingMode}
          onHide={() => setShowCookingMode(false)}
          recipe={recipe}
      />
    </Container>
  );
}
