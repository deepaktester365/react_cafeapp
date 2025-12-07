import { useState, useRef, useEffect } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import InputField from './InputField';
import { useApi } from '../contexts/ApiProvider';


export default function ShoppingPurchase({ onComplete }) {
  const [formErrors, setFormErrors] = useState({});
  const [stores, setStores] = useState([]);
  const storeField = useRef();
  const amountField = useRef();
  const api = useApi();

  useEffect(() => {
    (async () => {
      const response = await api.get("/shopping_stores");
      if (response.ok) {
        setStores(response.body);
        console.log("Loaded stores:", response.body);
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
      handleSuccess();
    }
    else {
      setFormErrors(response.body.errors || {});
    }
  };

  const onArchive = async () => {
    if(!window.confirm("Archive all checked items without purchasing?")) return;

    const response = await api.post("/shopping/archive", {});

    if (response.ok) {
      handleSuccess();
    }
    else {
      console.error("Failed to archive");
    }
  };

  const handleSuccess = () => {
    storeField.current.value = 'Select Store...';
    amountField.current.value = '';
    setFormErrors({});

    // Trigger parent to refresh the list (items should disappear)
    if (onComplete) onComplete();
  };

  return (
    <Card className="mt-4 shadow-sm border-0 bg-light">
      <Card.Body>
        <h6 className="text-muted mb-3">Checkout Checked Items</h6>
        <Form onSubmit={onPurchase}>
          <Row className="g-2 align-items-start">

            <Col md={5}>
              <InputField
                name="store" type="select" label="Store"
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

            <Col md={3}>
              <InputField
                name="amount" placeholder="0.00" label="Total Amount ($)"
                error={formErrors.amount} fieldRef={amountField}
              />
            </Col>

            <Col md={4} className="d-flex gap-2 align-items-end mt-4">
              <Button variant="success" type="submit" className="w-100 mb-3 mb-md-0" style={{marginTop: "32px"}}>
                Purchase
              </Button>

              <Button
                variant="outline-secondary"
                type="button"
                className="w-100 mb-3 mb-md-0"
                style={{marginTop: "32px"}}
                onClick={onArchive}
              >
                Archive
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}


