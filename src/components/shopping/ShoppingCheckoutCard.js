import { useState, useRef, useEffect } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import InputField from '../InputField';
import { useApi } from '../../contexts/ApiProvider';
import { useFlash } from '../../contexts/FlashProvider';

export default function ShoppingCheckoutCard({ onComplete }) {
  const [formErrors, setFormErrors] = useState({});
  const [stores, setStores] = useState([]);
  const storeField = useRef();
  const amountField = useRef();
  const api = useApi();
  const flash = useFlash();

  useEffect(() => {
    (async () => {
      const response = await api.get("/shopping_stores");
      if (response.ok) {
        setStores(response.body);
      } else {
        console.error("Failed to load stores");
      }
    })();
  }, [api]);

  const onPurchase = async (ev) => {
    ev.preventDefault();
    const amount = parseFloat(amountField.current.value) || 0.00;
    const store = storeField.current.value;

    if (!store || store === "Select Store...") {
        setFormErrors({store: "Please select a store"});
        return;
    }

    const response = await api.put("/shopping_purchase", {
      store_name: store,
      total_amount: amount,
    });

    if (response.ok) {
      flash('Purchase successfully completed', 'success')
      handleSuccess();
    }
    else {
      flash('Failed to purchase', 'danger')
      setFormErrors(response.body.errors || {});
    }
  };

  const onArchive = async () => {
    if(!window.confirm("Archive all checked items without purchasing?")) return;

    const response = await api.put("/shopping/archive", {});

    if (response.ok) {
      flash('Archive successfully completed', 'success')
      handleSuccess();
    }
    else {
      flash('Failed to archive', 'danger')
    }
  };

  const handleSuccess = () => {
    if (storeField.current) storeField.current.value = 'Select Store...';
    if (amountField.current) amountField.current.value = '';
    setFormErrors({});
    if (onComplete) onComplete();
  };

  return (
    // FIX: Removed 'bg-white', rely on Card theme styles
    <Card className="mt-4 shadow-sm border-0 rounded-4">
      <Card.Body className="p-4">
        {/* Header */}
        <div className="d-flex align-items-center mb-3">
            <i className="bi bi-bag-check text-success fs-5 me-2"></i>
            <h6 className="text-header-caps text-success mb-0">Finish Shopping Trip</h6>
        </div>

        <Form onSubmit={onPurchase}>
          <Row className="g-3">

            {/* STORE SELECTOR */}
            <Col md={5}>
              <Form.Label className="text-header-caps mb-1">Store</Form.Label>
              <InputField
                name="store" type="select"
                error={formErrors.store} fieldRef={storeField}
              >
                <option>Select Store...</option>
                {stores.map((storeName, index) => (
                    <option key={index} value={storeName}>
                        {storeName}
                    </option>
                ))}
              </InputField>
            </Col>

            {/* TOTAL AMOUNT */}
            <Col md={3}>
              <Form.Label className="text-header-caps mb-1">Total Paid ($)</Form.Label>
              <InputField
                name="amount" placeholder="0.00" type="decimal"
                error={formErrors.amount} fieldRef={amountField}
              />
            </Col>

            {/* ACTIONS */}
            <Col md={4} className="d-flex gap-2 align-items-end">
              {/* Invisible label for alignment */}
              <div className="w-100">
                <Form.Label className="text-header-caps mb-1 opacity-0 d-none d-md-block">&nbsp;</Form.Label>
                <div className="d-flex gap-2 mb-3">
                    <Button
                        variant="success"
                        type="submit"
                        className="w-100 rounded-pill fw-bold shadow-sm"
                    >
                        Purchase
                    </Button>

                    <Button
                        variant="warning"
                        type="button"
                        className="w-100 rounded-pill shadow-sm"
                        onClick={onArchive}
                        title="Archive without recording cost"
                    >
                        Archive
                    </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}
