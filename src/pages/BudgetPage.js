import { Container, Row, Col } from 'react-bootstrap';
import Body from '../components/Body';
import AccountContainer from '../components/budget/accounts/AccountContainer'; // Updated path

export default function BudgetPage() {
  return (
    <Body sidebar>
      <Container fluid className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <h3 className="mb-0 text-body fw-bold">My Family Budget</h3>
            <p className="text-body small mb-0">Manage your accounts and track balances.</p>
          </Col>
        </Row>

        <Row>
          <Col lg={12}>
            {/* The container handles modals, listing, and actions */}
            <AccountContainer />
          </Col>
        </Row>
      </Container>
    </Body>
  );
}
