import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Breadcrumb } from 'react-bootstrap';
import Body from '../components/Body';
import TransactionContainer from '../components/budget/transactions/TransactionContainer';
import TransactionAddForm from '../components/budget/transactions/TransactionAddForm';

export default function AccountDetailPage() {
  const { accountId } = useParams();
  const [refreshList, setRefreshList] = useState(0);

  const handleTransactionAdded = () => setRefreshList(prev => prev + 1);

  return (
    <Body sidebar>
      <Container fluid className="py-4 px-3">
        {/* BREADCRUMB */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item linkAs={Link} linkProps={{to: "/budget"}} className="text-decoration-none">Budget</Breadcrumb.Item>
          <Breadcrumb.Item active className="text-body">Account Details</Breadcrumb.Item>
        </Breadcrumb>

        <Row>
          {/* LEFT: Add Form (Sticky) */}
          <Col lg={4} className="mb-4">
            <div className="sticky-top" style={{top: '20px', zIndex: 1}}>
              <TransactionAddForm
                accountId={accountId}
                onTransactionAdded={handleTransactionAdded}
              />
            </div>
          </Col>

          {/* RIGHT: Transaction Feed */}
          <Col lg={8}>
            <div className="d-flex align-items-center mb-3">
                <h5 className="fw-bold text-body m-0">Ledger</h5>
                <span className="ms-2 badge bg-dark-subtle text-dark border rounded-pill">History</span>
            </div>
            <TransactionContainer
                accountId={accountId}
                refreshTrigger={refreshList}
            />
          </Col>
        </Row>
      </Container>
    </Body>
  );
}
