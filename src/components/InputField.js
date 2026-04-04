import Form from "react-bootstrap/Form";

export default function InputField(
    { name, label, type, placeholder, error, fieldRef, children, className, ...rest}
  ) {
  return (
    <Form.Group controlId={name} className={`InputField mb-3 ${className || ''}`}>
      {/* 1. Standardized Label Style */}
      {label && (
        <Form.Label className="text-header-caps mb-1">
            {label}
        </Form.Label>
      )}

      {/* 2. Rounded Inputs */}
      <Form.Control
        as={type === 'select' ? 'select' : 'input'}
        type={type === 'select' ? undefined : (type || 'text')}
        placeholder={placeholder}
        ref={fieldRef}
        isInvalid={!!error}
        className={type === 'select' ? 'form-select rounded-3 bg-surface' : 'rounded-3'}
        style={{ '--bs-secondary-color': 'rgba(var(--nook-text-rgb), 0.5)' }}
        {...rest}
      >
        {children}
      </Form.Control>

      {error && (
        <Form.Text className="text-danger small mt-1">
            <i className="bi bi-exclamation-circle me-1"></i>{error}
        </Form.Text>
      )}
    </Form.Group>
  );
}
