import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './Sidebar';
import FlashMessage from './FlashMessage';

export default function Body({ sidebar, children }) {
  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        {/* Sidebar Column */}
        {sidebar && <Sidebar />}

        {/* Main Content Column */}
        <Col className="d-flex flex-column min-vh-100 bg-surface-25">

          {/* FIX: Removed 'fluid' and 'p-0'.
             This forces the content into a readable, centered box
             with a max-width, preventing "infinite width" lists. */}
          <Container className="py-4 flex-grow-1 d-flex flex-column">

            <FlashMessage />

            {children}

          </Container>
        </Col>
      </Row>
    </Container>
  );
}
