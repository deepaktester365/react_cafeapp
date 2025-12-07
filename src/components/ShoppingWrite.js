import { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import InputField from './InputField';
import { useApi } from '../contexts/ApiProvider';


export default function ShoppingWrite({showList}) {
  const [formErrors, setFormErrors] = useState({});
  const nameField = useRef();
  const qtyField = useRef();
  const unitField = useRef();
  const categoryField = useRef();
  const api = useApi();

  useEffect(() => {
    nameField.current.focus();
  }, [])

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const qty = parseInt(qtyField.current.value) || 1;

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
      categoryField.current.value = 'Uncategorized';

      setFormErrors({});
      nameField.current.focus();
    }
    else {
      if (response.body.errors) {
      setFormErrors(response.body.errors.json);
      }
    }
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light shadow-sm">
      <Form onSubmit={onSubmit}>
        <Row className="g-2 align-items-start">
          <Col md={5} xs={12}>
            <InputField
              name="name" placeholder="...food"
              error={formErrors.name} fieldRef={nameField} />
          </Col>

          <Col md={3} xs={6}>
            <InputField
               name="category" type="select"
               error={formErrors.category} fieldRef={categoryField}
             >
                <option value='Uncategorized'>Uncategorized</option>
                <option value='Bakery'>Bakery</option>
                <option value='Beverages'>Beverages</option>
                <option value='Dairy & Eggs'>Dairy & Eggs</option>
                <option value='Deli'>Deli</option>
                <option value='Frozen Foods'>Frozen Foods</option>
                <option value='Household'>Household</option>
                <option value='Meat & Seafood'>Meat & Seafood</option>
                <option value='Produce'>Produce</option>
                <option value='Pantry'>Pantry</option>
                <option value='Snacks'>Snacks</option>
                <option value='Spices'>Spices</option>
             </InputField>
          </Col>

          <Col md={1} xs={3}>
            <InputField
              name="qty" placeholder="qty"
              error={formErrors.qty} fieldRef={qtyField} />
          </Col>

          <Col md={2} xs={3}>
            <InputField
              name="unit" type="select"
              error={formErrors.unit} fieldRef={unitField} >
              <option value='ea'>ea</option>
              <option value='lb'>lb</option>
              <option value='oz'>oz</option>
              <option value='pk'>pk</option>
              <option value='pint'>pint</option>
              <option value='quart'>quart</option>
              <option value='cups'>cups</option>
              <option value='g'>g</option>
              <option value='dozen'>dozen</option>
              <option value='can'>can</option>
            </InputField>
          </Col>

          <Col md={1} xs={12} className="d-grid">
           <Button variant="primary" type="submit" className="mt-3">
             Add
           </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}


