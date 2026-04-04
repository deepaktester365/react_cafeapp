import { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import usePaginatedApi from '../../hooks/usePaginatedApi';
import RecipeCard from './RecipeCard';
import LoadMore from '../common/LoadMore';
import EmptyState from '../common/EmptyState';
import LoadingState from '../common/LoadingState';
import RecipeFormModal from './form/RecipeFormModal';

export default function RecipeContainer() {
  const { items: recipes, pagination, loading, error, loadNextPage, refresh } = usePaginatedApi('/recipes');
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading && !recipes) {
      return <LoadingState message="Loading your cookbook..." />;
  }

  if (error) {
      return <div className="text-danger text-center py-5">Error: {error}</div>;
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h3 className="fw-bold m-0">My Cookbook</h3>
              <p className="text-muted small m-0">Plan, cook, and manage your recipes</p>
          </div>
          <Button
              variant="primary"
              className="d-flex align-items-center gap-2 rounded-pill px-4 fw-bold shadow-sm"
              onClick={() => setShowAddModal(true)}
          >
              <i className="bi bi-plus-lg"></i> New Recipe
          </Button>
      </div>

      {/* Grid */}
      {recipes && recipes.length > 0 ? (
          <>
              <Row className="g-4 mb-4">
                  {recipes.map(recipe => (
                      <Col xs={12} sm={6} lg={4} xl={3} key={recipe.id}>
                          <RecipeCard recipe={recipe} />
                      </Col>
                  ))}
              </Row>
              <LoadMore pagination={pagination} loadNextPage={loadNextPage} />
          </>
      ) : (
          <EmptyState
              icon="bi-journal-plus"
              title="No recipes yet"
              message="Start building your digital cookbook by adding your first recipe."
              action={
                  <Button variant="outline-primary" className="rounded-pill px-4 mt-3" onClick={() => setShowAddModal(true)}>
                      Add Recipe
                  </Button>
              }
          />
      )}

      <RecipeFormModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onSuccess={() => {
              refresh();
              setShowAddModal(false);
          }}
      />

    </Container>
  );
}
