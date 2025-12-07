import { useState, useEffect, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Spinner, Form, Row, Col, Button, Card, InputGroup } from 'react-bootstrap';
import { useApi } from '../contexts/ApiProvider';
import Shopping from './Shopping';
import InputField from './InputField';
import More from "./More";
import { useFlash } from '../contexts/FlashProvider';

export default function ShoppingItem({itemId}) {
  const [formErrors, setFormErrors] = useState({});
  const params = useParams();
  const id = itemId || params.itemid;
  const navigate = useNavigate();
  const flash = useFlash();

  const nameField = useRef();
  const qtyField = useRef();
  const unitField = useRef();
  const categoryField = useRef();
  const storeField = useRef();
  const priceField = useRef();
  const organicField = useRef();
  const notesField = useRef();

  const [item, setItem] = useState();
  const api = useApi();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const url = `/shopping_item/${id}`;
      const response = await api.get(url);
      if (response.ok) {
        setItem(response.body);
      }
      else {
        setItem(null);
      }
    })();
  }, [api, id]);

  useEffect(() => {
    if (item) {
      if (nameField.current) nameField.current.value = item.name;
      if (nameField.current) qtyField.current.value = item.qty;
      if (unitField.current) unitField.current.value = item.unit || 'ea';
      if (categoryField.current) categoryField.current.value = item.category;
      if (storeField.current) storeField.current.value = item.store_name;
      if (priceField.current) priceField.current.value = item.unit_price * item.qty;
      if (organicField.current) organicField.current.value = item.is_organic;
      if (notesField.current) notesField.current.value = item.notes;
    }
  }, [item]);

  const handleItemUpdate = (updatedItem) => {
    setItem(updatedItem);
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const url = `/shopping_item/${id}`;
    const qty = parseInt(qtyField.current.value) || 1;

    const response = await api.put(url, {
      name: nameField.current.value,
      qty: qty,
      unit: unitField.current.value,
      category: categoryField.current.value,
      store_name: storeField.current.value,
      item_price: priceField.current.value,
      is_organic: organicField.current.checked,
      notes: notesField.current.value,

    });
    if (response.ok) {
      flash('Item successfully updated', 'success')
      setFormErrors({});
      nameField.current.focus();
    }
    else {
      if (response.body.errors) {
      setFormErrors(response.body.errors.json);
      }
    }
  };

  const onDelete = async (ev) => {
    ev.preventDefault();
    const url = `/shopping_item/${id}`;
    const response = await api.delete(url);
    if (response.ok) {
      flash('Item successfully deleted', 'danger')
      setFormErrors({});
      let next = '/shopping_list';
      navigate(next)
    }
    else {
      if (response.body.errors) {
      setFormErrors(response.body.errors.json);
      }
    }
  };

  const onCancel = async (ev) => {
    setFormErrors({});
    let next = '/shopping_list';
    navigate(next)
  };
  return (
    <>
      {item === undefined ?
        <Spinner animation="border" />
      :
        <>
          {item === null ?
            <p>Could not retrieve item details.</p>
          :
            <>
              <Card bg="light" text="dark" className="shadow-sm border-1">
                <Card.Body className="p-4">
                  <h5 className="mb-4 text-secondary">Edit Item Details</h5>
                  <Form onSubmit={onSubmit}>
                    <Row className="mb-3">
                      <Col md={8}>
                        <InputField
                          name="name" label="Name"
                          error={formErrors.name} fieldRef={nameField} />
                      </Col>
                      <Col md={4}>
                        <InputField
                          name="category" type="select" label="Category"
                          error={formErrors.category} fieldRef={categoryField} >
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
                          <option value='Uncategorized'>Uncategorized</option>
                        </InputField>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={3} xs={6}>
                        <InputField
                          name="qty" label="Qty"
                          error={formErrors.qty} fieldRef={qtyField} />
                      </Col>
                      <Col md={3} xs={6}>
                        <InputField
                          name="unit" type="select" label="Unit"
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
                      <Col md={6}>
                        <InputField
                          name="price" label="Item Price ($)"
                          error={formErrors.price} fieldRef={priceField} />
                      </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                      <Col md={4}>
                        <InputField name="store" label="Store Name" error={formErrors.store} fieldRef={storeField} />
                      </Col>

                      <Col md={6}>
                        <InputField name="notes" label="Notes" error={formErrors.notes} fieldRef={notesField} />
                      </Col>

                      <Col md={2}>
                        <div className="mt-4">
                            <Form.Check
                                type="switch"
                                id={`item-check-${item.id}`}
                                label="Organic"
                                defaultChecked={item.is_organic}
                                ref={organicField}
                                className="text-success fw-bold"
                            />
                        </div>
                      </Col>
                    </Row>

                    <hr className="my-4" />

                    <div className="d-flex justify-content-between align-items-center">
                      <Button variant="outline-danger" type="button" onClick={onDelete} size="sm">
                        <i className="bi bi-trash"></i> Delete Item
                      </Button>

                      <div className="d-flex gap-2">
                        <Button variant="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" className="px-4">
                            Save Changes
                        </Button>
                      </div>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </>
          }
        </>
      }
    </>
  );
}


