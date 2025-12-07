import Form from "react-bootstrap/Form";

export default function InputField(
    { name, label, type, placeholder, error, fieldRef, children }
  ) {
  return (
    <Form.Group controlId={name} className="InputField">
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        as={type === 'select' ? 'select' : 'input'}
        type={type === 'select' ? undefined: (type || 'text')}
        placeholder={placeholder}
        ref={fieldRef}
      >
        {children}
      </Form.Control>
      <Form.Text className="text-danger">{error}</Form.Text>
    </Form.Group>
  );
}

