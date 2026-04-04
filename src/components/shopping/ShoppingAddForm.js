import { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import InputField from '../InputField';

// Import the new smart components
import CategorySelect from './selectors/CategorySelect';
import UnitSelect from './selectors/UnitSelect';

export default function ShoppingAddForm({ showList }) {
  const [formErrors, setFormErrors] = useState({});
  const nameField = useRef();
  const qtyField = useRef();
  const unitField = useRef();
  const categoryField = useRef();
  const api = useApi();

  useEffect(() => {
    if (window.innerWidth > 768 && nameField.current) {
      nameField.current.focus();
    }
  }, []);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const qty = parseFloat(qtyField.current.value) || 1;

    const response = await api.post("/shopping", {
      name: nameField.current.value,
      qty: qty,
      unit: unitField.current.value,
      category: categoryField.current.value
    });

    if (response.ok) {
      showList(response.body);
      nameField.current.value = '';
      qtyField.current.value = '';
      unitField.current.value = 'ea';
      setFormErrors({});
      nameField.current.focus();
    } else {
      if (response.body.errors) {
        setFormErrors(response.body.errors.json);
      }
    }
  };

  return (
    // FIX: Removed 'bg-white', added 'card' which adapts to theme
    <div className="card shadow-sm border-0 p-3 mb-3 rounded-4">
      <Form onSubmit={onSubmit}>
        <Row className="g-2">

          {/* ITEM NAME */}
          <Col md={5} xs={12}>
            <Form.Label className="text-header-caps mb-1">Item Name</Form.Label>
            <InputField
              name="name"
              placeholder="e.g. Bananas, Milk..."
              error={formErrors.name}
              fieldRef={nameField}
            />
          </Col>

          {/* CATEGORY SELECT */}
          <Col md={3} xs={6}>
            <Form.Label className="text-header-caps mb-1">Category</Form.Label>
            <CategorySelect
                label=""
                error={formErrors.category}
                fieldRef={categoryField}
                defaultValue="Uncategorized"
            />
          </Col>

          {/* QTY */}
          <Col md={1} xs={3}>
            <Form.Label className="text-header-caps mb-1">Qty</Form.Label>
            <InputField
              name="qty" placeholder="1" type="number" step="any"
              error={formErrors.qty} fieldRef={qtyField}
            />
          </Col>

          {/* UNIT SELECT */}
          <Col md={2} xs={3}>
            <Form.Label className="text-header-caps mb-1">Unit</Form.Label>
            <UnitSelect
                label=""
                error={formErrors.unit}
                fieldRef={unitField}
                defaultValue="ea"
            />
          </Col>

          {/* SUBMIT */}
          <Col md={1} xs={12} className="d-grid">
            <Form.Label className="text-header-caps mb-1 opacity-0 d-none d-md-block">&nbsp;</Form.Label>
            <div className="mb-3">
               <Button variant="primary" type="submit" className="w-100 rounded-pill">
                 <i className="bi bi-plus-lg"></i>
               </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
