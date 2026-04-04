import { useState, useEffect, useRef } from 'react';
import { Modal, Row, Col, Button, Form } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import { useUser } from '../../contexts/UserProvider';
import InputField from '../InputField';
import LoadingState from '../common/LoadingState';

export default function GiftBuyerModal({ itemId, show, handleClose, onUpdate }) {
  const [formErrors, setFormErrors] = useState({});
  const [item, setItem] = useState();
  const api = useApi();
  const { user } = useUser();
  const locationField = useRef();

  useEffect(() => {
    if (!show || !itemId) {
      setItem(undefined);
      return;
    }
    (async () => {
      const response = await api.get(`/gifts/${itemId}`);
      setItem(response.ok ? response.body : null);
    })();
  }, [api, itemId, show]);

  // 1. Handle "I Bought It"
  const handleBuy = async (ev) => {
    if (ev) ev.preventDefault(); // allow form submission

    const locationVal = locationField.current ? locationField.current.value : '';

    const response = await api.put(`/gifts_bought/${itemId}`, {
        buy_status: true,
        buy_loc: locationVal
    });

    if (response.ok) {
        if (locationField.current) locationField.current.value = '';
        setFormErrors({});
        setItem(response.body);
        if (onUpdate) onUpdate(response.body);
    } else {
        if (response.body.errors) setFormErrors(response.body.errors.json);
    }
  };

  // 2. Handle "Undo Purchase"
  const handleUndo = async () => {
    const response = await api.put(`/gifts_bought/${itemId}`, {
        buy_status: false
    });

    if (response.ok) {
        setFormErrors({});
        setItem(response.body);
        if (onUpdate) onUpdate(response.body);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="border-0 rounded-4 shadow">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold text-primary">Purchase Status</Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {item === undefined ? <LoadingState message="Loading info..." /> :
         item === null ? <div className="text-danger text-center">Error loading info.</div> :
         (
           <div>
             <h4 className="text-center mb-4 fw-bold text-body-75">{item.name}</h4>

             {item.buyer ? (
                 /* --- VIEW: ALREADY PURCHASED --- */
                 <div className="bg-success-subtle p-4 rounded-4 text-center mb-3">
                    <div className="bg-white rounded-circle d-inline-flex p-3 mb-3 shadow-sm text-success">
                        <i className="bi bi-check-lg fs-1"></i>
                    </div>
                    <h5 className="text-success fw-bold">Purchased by {item.buyer}</h5>
                    {item.buy_loc && <div className="text-muted mt-2 small">Bought at: {item.buy_loc}</div>}

                    {/* Only show Undo if CURRENT user is the buyer */}
                    {user && user.username === item.buyer && (
                      <div className="mt-4 pt-3 border-top border-success-subtle">
                        <Button variant="outline-danger" size="sm" onClick={handleUndo} className="rounded-pill px-3">
                          Undo Purchase
                        </Button>
                      </div>
                    )}
                 </div>
             ) : (
                 /* --- VIEW: AVAILABLE (MARK AS BOUGHT) --- */
                 <>
                    <div className="text-center mb-4">
                        <div className="bg-light rounded-circle d-inline-flex p-3 mb-2 text-muted">
                            <i className="bi bi-bag fs-1"></i>
                        </div>
                        <p className="text-body-50">This item is still available.</p>
                    </div>

                    <div className="bg-surface p-3 rounded-4">
                        <Form onSubmit={handleBuy}>
                            <Form.Label className="text-header-caps mb-2">Mark as Bought</Form.Label>
                            <Row className="g-2">
                                <Col xs={8}>
                                    <InputField
                                        name="location" placeholder="Store name (Optional)"
                                        error={formErrors.location} fieldRef={locationField}
                                        className="mb-0"
                                    />
                                </Col>
                                <Col xs={4}>
                                    <Button type="submit" variant="success" className="w-100 rounded-pill fw-bold">
                                        I Bought It
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    </div>
                 </>
             )}
           </div>
         )
        }
      </Modal.Body>
    </Modal>
  );
}
