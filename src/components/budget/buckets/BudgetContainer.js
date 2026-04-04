import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { useApi } from '../../../contexts/ApiProvider';
import BudgetCategoryGroup from './BudgetCategoryGroup';
import CreateCategoryModal from '../modals/CreateCategoryModal';

export default function BudgetContainer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const api = useApi();

  const getPeriodName = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const fetchData = useCallback(async () => {
    const periodName = getPeriodName(currentDate);
    // Only set loading if we don't have data yet (prevents flashing on refresh)
    if (!data) setLoading(true);

    const response = await api.get(`/budget/month/${periodName}`);
    if (response.ok) {
      setData(response.body);
    } else {
      setData(null);
    }
    setLoading(false);
  }, [api, currentDate]); // Removed 'data' from dependency to avoid loops

  // 2. Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold m-0">Budget Dashboard</h4>
            <Button
                variant="primary"
                size="sm"
                className="d-flex align-items-center gap-2 px-3 rounded-pill"
                onClick={() => setShowCategoryModal(true)}
            >
                <i className="bi bi-folder-plus"></i> New Category
            </Button>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4 bg-surface p-3 rounded-4 shadow-sm border">
            <Button
                variant="outline-secondary"
                className="rounded-circle border-secondary-subtle bg-transparent text-secondary p-0 d-flex align-items-center justify-content-center"
                style={{width: '38px', height: '38px'}}
                onClick={() => changeMonth(-1)}
            >
                <i className="bi bi-chevron-left"></i>
            </Button>

            <div className="text-center">
                {/* FIX 3: Removed text-dark */}
                <h4 className="fw-bold mb-0">{getPeriodName(currentDate)}</h4>
                {data && data.period.closed && (
                    <span className="badge bg-secondary rounded-pill small mt-1 opacity-75">Closed</span>
                )}
            </div>

            <Button
                variant="outline-secondary"
                className="rounded-circle border-secondary-subtle bg-transparent text-secondary p-0 d-flex align-items-center justify-content-center"
                style={{width: '38px', height: '38px'}}
                onClick={() => changeMonth(1)}
            >
                <i className="bi bi-chevron-right"></i>
            </Button>
        </div>

        {loading && (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        )}

        {!loading && data && (
            <>
                {/* Summary Cards */}
                <Row className="mb-4 g-3">
                    <Col md={4}>
                        {/* FIX 4: Changed bg-white to bg-surface */}
                        <div className="p-4 bg-surface border rounded-4 shadow-sm text-center h-100">
                            <div className="text-body small text-uppercase letter-spacing-1 mb-1">Total Budgeted</div>
                            {/* FIX 5: Removed text-dark */}
                            <div className="fs-3 fw-bold">
                                ${data.totals.budgeted.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </div>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-4 bg-surface border rounded-4 shadow-sm text-center h-100">
                            <div className="text-body small text-uppercase letter-spacing-1 mb-1">Total Activity</div>
                            <div className="fs-3 fw-bold text-danger">
                                ${data.totals.activity.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </div>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="p-4 bg-surface border rounded-4 shadow-sm text-center h-100">
                            <div className="text-body small text-uppercase letter-spacing-1 mb-1">Total Available</div>
                            <div className="fs-3 fw-bold text-success">
                                ${data.totals.available.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Category Groups */}
                {data.categories.map(category => (
                    <BudgetCategoryGroup
                        key={category.id}
                        category={category}
                        viewDate={currentDate}
                        onRefresh={fetchData}/>
                ))}

                {/* Empty State */}
                {data.categories.length === 0 && (
                <Alert variant="info" className="rounded-4 border-0 shadow-sm text-center py-5 bg-body-tertiary text-body">
                    <i className="bi bi-wallet2 fs-1 d-block mb-3 text-primary opacity-50"></i>
                    <h5 className="fw-bold">Welcome to your Budget!</h5>
                    <p className="text-muted mb-4">You don't have any categories yet.</p>
                    <Button variant="primary" onClick={() => setShowCategoryModal(true)}>
                        Create Your First Category
                    </Button>
                </Alert>
            )}
            </>
        )}

        <CreateCategoryModal
            show={showCategoryModal}
            onHide={() => setShowCategoryModal(false)}
            onSuccess={fetchData}
        />
    </>
  );
}
