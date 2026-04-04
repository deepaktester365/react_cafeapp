import { Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Card
        className="border-0 shadow-sm rounded-4 h-100 bg-surface text-decoration-none overflow-hidden"
        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        onClick={() => navigate(`/recipes/${recipe.id}`)}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Recipe Image or Placeholder */}
      <div style={{ height: '180px', backgroundColor: 'var(--nook-surface-50)' }} className="position-relative">
          {recipe.image_url ? (
              <img src={recipe.image_url} alt={recipe.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
          ) : (
              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-body-50">
                  <i className="bi bi-journal-album fs-1 opacity-50"></i>
              </div>
          )}
          {/* Quick Tags (if any exist) */}
          {recipe.tags && recipe.tags.length > 0 && (
              <div className="position-absolute bottom-0 start-0 p-2 w-100 d-flex gap-1" style={{background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'}}>
                  {recipe.tags.slice(0, 2).map(tag => (
                      <Badge bg="primary" key={tag.id} className="rounded-pill fw-normal shadow-sm">
                          {tag.name}
                      </Badge>
                  ))}
              </div>
          )}
      </div>

      <Card.Body className="p-3 d-flex flex-column">
        <h5 className="fw-bold mb-1 text-truncate">{recipe.name}</h5>
        {recipe.author && <small className="text-muted d-block mb-3">by {recipe.author}</small>}

        <div className="mt-auto d-flex justify-content-between text-body-75 small fw-medium">
            <span title="Total Time"><i className="bi bi-clock me-1"></i> {totalTime > 0 ? `${totalTime}m` : '--'}</span>
            <span title="Servings"><i className="bi bi-people me-1"></i> {recipe.servings || '--'}</span>
        </div>
      </Card.Body>
    </Card>
  );
}
