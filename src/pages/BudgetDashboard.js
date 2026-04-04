import { Container } from 'react-bootstrap';
import Body from '../components/Body';
import BudgetContainer from '../components/budget/buckets/BudgetContainer';

export default function BudgetDashboard() {
  return (
    <Body sidebar>
      <Container fluid className="py-4">
        <BudgetContainer />
      </Container>
    </Body>
  );
}
