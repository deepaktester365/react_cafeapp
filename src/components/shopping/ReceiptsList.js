import { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

// Hooks
import usePaginatedApi from '../../hooks/usePaginatedApi';

// Components
import PageHeader from '../common/PageHeader';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import LoadMore from '../common/LoadMore';
import ReceiptModal from './ReceiptModal';

export default function ReceiptsList() {
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const {
    items: receipts,
    pagination,
    loadNextPage,
    updateItem
  } = usePaginatedApi('/shopping_receipts');

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const handleUpdateReceipt = (updatedReceipt) => {
      updateItem(updatedReceipt);
      setSelectedReceipt(updatedReceipt);
  };

  return (
    <>
      <PageHeader title="Purchase History" icon="bi-clock-history" />

      <Container fluid className="px-4 pb-5">

        {receipts === undefined ? (
          <LoadingState message="Loading receipts..." />
        ) : (
          <>
            {receipts === null || receipts.length === 0 ? (
              <EmptyState title="No receipts found" message="Your completed shopping trips will appear here." icon="bi-receipt" />
            ) : (
              <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                {receipts.map((receipt) => (
                  <Col key={receipt.id}>
                    <Card
                        // FIX: Global CSS handles the dark mode background for .card
                        className="h-100 shadow-sm border-0 rounded-4 receipt-card-hover"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => setSelectedReceipt(receipt)}
                    >
                      <Card.Body className="d-flex flex-column justify-content-between p-4">
                        <div>
                          <div className="text-header-caps mb-2 text-primary opacity-75">
                              {formatDate(receipt.date)}
                          </div>

                          {/* FIX: Removed 'text-dark'. Now inherits color (White in Dark Mode). */}
                          <h5 className="fw-bold mb-3">
                              {receipt.store_name || "Unknown Store"}
                          </h5>
                        </div>

                        {/* Footer Section */}
                        <div className="d-flex justify-content-between align-items-end border-top pt-3 mt-2">
                          {/* text-muted is handled by our global CSS override */}
                          <span className="text-body-75 small">
                              <i className="bi bi-basket3 me-1"></i>
                              {receipt.items ? receipt.items.length : 0} Items
                          </span>
                          <span className="h5 mb-0 text-success fw-bold text-currency">
                              ${receipt.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            <div className="mt-5">
              <LoadMore pagination={pagination} loadNextPage={loadNextPage} />
            </div>

            <ReceiptModal
              receipt={selectedReceipt}
              show={!!selectedReceipt}
              onHide={() => setSelectedReceipt(null)}
              onUpdate={handleUpdateReceipt}
            />
          </>
        )}
      </Container>
    </>
  );
}
