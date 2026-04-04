import { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import InputField from '../InputField';
import { useApi } from '../../contexts/ApiProvider';

export default function GiftAddForm({ showList }) {
  const [formErrors, setFormErrors] = useState({});
  const nameField = useRef();
  const priceField = useRef();
  const ratingField = useRef();
  const notesField = useRef();
  const urlField = useRef();
  const api = useApi();

  useEffect(() => {
    if (nameField.current) nameField.current.focus();
  }, []);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const price = parseFloat(priceField.current.value) || 0.00;
    const ratingRaw = ratingField.current.value;
    const rating = (ratingRaw === 'placeholder') ? null : parseInt(ratingRaw);

    let rawUrl = urlField.current.value.trim();
    let cleanUrl = rawUrl;
    if (rawUrl && !/^https?:\/\//i.test(rawUrl)) {
        cleanUrl = `https://${rawUrl}`;
    }

    const response = await api.post("/gifts", {
      name: nameField.current.value,
      price: price,
      rating: rating,
      notes: notesField.current.value,
      url: cleanUrl
    });

    if (response.ok) {
      showList(response.body); // Optimistic update

      // Clear Form
      nameField.current.value = '';
      priceField.current.value = '';
      ratingField.current.value = 'placeholder';
      notesField.current.value = '';
      urlField.current.value = '';
      setFormErrors({});
      nameField.current.focus();
    } else {
      if (response.body.errors) {
        setFormErrors(response.body.errors.json);
      }
    }
  };

  return (
    <div className="card shadow-sm border-0 p-3 mb-4 bg-surface rounded-4">
      <Form onSubmit={onSubmit}>
        <Row className="g-2">
          {/* Name */}
          <Col md={5} xs={12}>
            <InputField
              label="Item Name" name="name" placeholder="e.g. Coffee Maker"
              error={formErrors.name} fieldRef={nameField}
            />
          </Col>

          {/* Price */}
          <Col md={2} xs={6}>
            <InputField
              label="Price ($)" name="price" placeholder="0.00" type="number" step="0.01"
              error={formErrors.price} fieldRef={priceField}
            />
          </Col>

          {/* Rating */}
          <Col md={3} xs={6}>
            <InputField
                label="Priority / Rating" name="rating" type="select"
                error={formErrors.rating} fieldRef={ratingField}
                defaultValue="placeholder"
                >
                <option value='placeholder' className="text-muted">No Rating</option>
                {[...Array(10)].map((_, i) => {
                    const score = 10 - i;
                    const fullStars = Math.floor(score / 2);
                    const halfStar = score % 2 !== 0;
                    const starString = '★'.repeat(fullStars) + (halfStar ? '½' : '');
                    return (
                        <option key={score} value={score}>
                            {starString || score}
                        </option>
                    );
                })}
            </InputField>
          </Col>

           {/* Submit Button (Desktop: aligned with fields) */}
           <Col md={2} xs={12} className="d-grid">
            <Form.Label className="text-header-caps mb-1 opacity-0 d-none d-md-block">&nbsp;</Form.Label>
            <div className="mb-3">
               <Button variant="primary" type="submit" className="w-100 rounded-pill">
                 <i className="bi bi-plus-lg"></i>
               </Button>
            </div>
          </Col>
        </Row>

        <Row className="g-2 mt-0">
          <Col md={6} xs={12}>
            <InputField
              label="Notes" name="notes" placeholder="Size, Color, details..."
              error={formErrors.notes} fieldRef={notesField}
            />
          </Col>

          <Col md={6} xs={12}>
            <InputField
              label="Link URL" name="WebsiteUrl" placeholder="https://..."
              error={formErrors.url} fieldRef={urlField}
            />
          </Col>
        </Row>
      </Form>
    </div>
  );
}
