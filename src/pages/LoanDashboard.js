import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Form, InputGroup } from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import Body from '../components/Body';
import { formatCurrency } from '../utils/currency';
import CreateLoanModal from '../components/budget/modals/CreateLoanModal';
import EditLoanModal from '../components/budget/modals/EditLoanModal';

export default function LoanDashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const api = useApi();

  const fetchLoans = async () => {
      setLoading(true);
      // Pass the query param
      const res = await api.get(`/budget/loans?archived=${showArchived}`);
      if (res.ok) setLoans(res.body.items);
      setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, [api, showArchived]);

  return (
    <Body sidebar>
      <Container fluid className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold m-0">Loan Manager</h3>

            <div className="d-flex align-items-center gap-3">
                {/* 4. The Toggle Switch */}
                <Form.Check
                    type="switch"
                    id="archived-switch"
                    label="Show Closed Loans"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="mb-0 fw-bold text-secondary"
                />

                <Button
                    variant="primary"
                    className="d-flex align-items-center gap-2 rounded-pill px-3"
                    onClick={() => setShowAddModal(true)}
                    disabled={showArchived} // Disable "Add" when viewing history
                >
                    <i className="bi bi-plus-lg"></i> Add Loan
                </Button>
            </div>
        </div>
        <Row className="g-4">
            {loans.map(loan => (
              <Col md={6} xl={4} key={loan.id}>
                <LoanCard
                  loan={loan}
                  onEdit={() => setEditingLoan(loan)}
                  isArchived={loan.archived}
                />
              </Col>
            ))}

          {loans.length === 0 && !loading && (
             <div className="text-center py-5 text-muted">
                {showArchived
                    ? "No closed loans found."
                    : "No active loans found."}
             </div>
          )}
        </Row>

        {/* 4. Render the Modal */}
        {editingLoan && (
            <EditLoanModal
                show={true}
                loan={editingLoan}
                onHide={() => setEditingLoan(null)}
                onSuccess={fetchLoans} // Reload data after edit
            />
        )}
        <CreateLoanModal
            show={showAddModal}
            onHide={() => setShowAddModal(false)}
            onSuccess={fetchLoans}
        />
      </Container>
    </Body>
  );
}


function LoanCard({ loan, onEdit, isArchived }) {
  // 1. Map API fields to local variables (handle string/number safety)
  const totalDebt = parseFloat(loan.original_principal || 0);
  const remainingDebt = parseFloat(loan.current_balance || 0);
  const minPayment = parseFloat(loan.min_payment || 0);
  const interestRate = parseFloat(loan.interest_rate || 0);

  // 2. State for Calculator
  const [extraPayment, setExtraPayment] = useState(0);

  // 3. Calculator Logic
  const monthlyRate = (interestRate / 100) / 12;
  const payment = minPayment + Number(extraPayment);

  let monthsToPayOff = 0;
  let totalInterest = 0;

  // Only calculate if we have a debt and are making payments
  if (payment > 0 && remainingDebt > 0) {
      let balance = remainingDebt;
      // Cap at 30 years (360 months) to prevent infinite loops
      while (balance > 0 && monthsToPayOff < 360) {
          const interest = balance * monthlyRate;
          totalInterest += interest;
          balance = balance - (payment - interest);
          monthsToPayOff++;

          // Safety break for interest-only or negative amortization scenarios
          if (balance > remainingDebt * 2) break;
      }
  }

  // 4. Progress Calculation
  const progress = totalDebt > 0
      ? Math.min(((totalDebt - remainingDebt) / totalDebt) * 100, 100)
      : 0;

  return (
    <Card className="border-0 shadow-sm rounded-4 h-100 bg-surface">
      <Card.Body className="p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
                <h5 className="fw-bold mb-0">
                    {loan.name}
                    {/* Add Badge if closed */}
                    {isArchived && <span className="ms-2 badge bg-secondary">CLOSED</span>}
                </h5>
                <small className="text-muted">{loan.category_name}</small>
            </div>

            {/* Hide Edit button if archived */}
            {!isArchived && (
                <div className="d-flex gap-2">
                     <Button
                        variant="light"
                        size="sm"
                        onClick={onEdit}
                        className="..."
                     >
                        <i className="bi bi-pencil-fill small"></i>
                     </Button>
                     <span className="badge bg-primary-subtle text-primary ...">
                        {interestRate}% APR
                     </span>
                </div>
            )}
        </div>

        {/* Progress Bar Section */}
        <div className="mb-4">
            <div className="d-flex justify-content-between small mb-1">
                <span>Progress</span>
                <span className="fw-bold">{Math.round(progress)}% Paid</span>
            </div>
            <ProgressBar now={progress} variant={progress === 100 ? 'success' : 'primary'} style={{height:'8px'}} className="bg-body-tertiary" />
            <div className="d-flex justify-content-between mt-2">
                <div>
                    <small className="text-muted d-block" style={{fontSize:'0.7rem'}}>REMAINING</small>
                    <span className="fw-bold fs-5">{formatCurrency(remainingDebt)}</span>
                </div>
                <div className="text-end">
                    <small className="text-muted d-block" style={{fontSize:'0.7rem'}}>ORIGINAL</small>
                    <span className="text-body">{formatCurrency(totalDebt)}</span>
                </div>
            </div>
        </div>

        <hr className="border-secondary-subtle opacity-25" />

        {/* Calculator Section */}
        <h6 className="fw-bold small text-uppercase text-muted mb-3">Payoff Calculator</h6>

        <Row className="g-2 mb-3">
            <Col xs={6}>
                <small className="d-block mb-1">Min Payment</small>
                <div className="fw-bold">{formatCurrency(minPayment)}</div>
            </Col>
            <Col xs={6}>
                <small className="d-block mb-1">Extra / Mo</small>
                <InputGroup size="sm">
                    <InputGroup.Text className="bg-body-tertiary border-0">$</InputGroup.Text>
                    <Form.Control
                        type="number"
                        value={extraPayment}
                        onChange={e => setExtraPayment(e.target.value)}
                        className="bg-body-tertiary border-0 fw-bold"
                    />
                </InputGroup>
            </Col>
        </Row>

        <div className="p-3 bg-body-tertiary rounded-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Time to Debt Free</small>
                <span className="fw-bold text-success">
                    {monthsToPayOff >= 360 ? "Never / >30 Years" : `${(monthsToPayOff / 12).toFixed(1)} Years`}
                </span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">Est. Interest Cost</small>
                <span className="fw-bold text-danger">{formatCurrency(totalInterest)}</span>
            </div>
        </div>
      </Card.Body>
    </Card>
  );
}


