import { Spinner } from "react-bootstrap";

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
      <Spinner animation="border" role="status" variant="primary" style={{ width: '2rem', height: '2rem' }} />
      <span className="mt-2 small text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>{message}</span>
    </div>
  );
}
