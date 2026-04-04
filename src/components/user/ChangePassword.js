import { useState, useRef } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useApi } from '../../contexts/ApiProvider';
import { useFlash } from '../../contexts/FlashProvider';
import InputField from '../InputField';

export default function ChangePassword() {
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const flash = useFlash();
  const api = useApi();

  const oldPasswordField = useRef();
  const newPasswordField = useRef();
  const confirmPasswordField = useRef();

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const oldPass = oldPasswordField.current.value;
    const newPass = newPasswordField.current.value;
    const confirmPass = confirmPasswordField.current.value;

    setFormErrors({});
    setError(null);

    // 1. Frontend Validation
    if (newPass !== confirmPass) {
      setFormErrors({ confirm: "Passwords do not match" });
      return;
    }

    if (newPass.length < 4) {
       setFormErrors({ new: "Password must be at least 4 characters" });
       return;
    }

    // 2. API Call
    const response = await api.put('/users/change_password', {
      old_password: oldPass,
      new_password: newPass
    });

    if (response.ok) {
      flash('Password changed successfully!', 'success');
      oldPasswordField.current.value = '';
      newPasswordField.current.value = '';
      confirmPasswordField.current.value = '';
    } else {
       if (response.body.message) {
           setError(response.body.message);
       } else {
           setError("Failed to change password");
       }
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-warning opacity-75 border-0 pt-4 px-4">
          <h5 className="fw-bold text-light mb-0">Change Password</h5>
      </Card.Header>
      <Card.Body className="p-4">
        {error && (
            <Alert variant="danger" className="border-0 shadow-sm small">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
            </Alert>
        )}

        <Form onSubmit={onSubmit}>
          <InputField
            name="old_password" type="password" label="Current Password"
            error={formErrors.old} fieldRef={oldPasswordField}
          />

          <InputField
            name="new_password" type="password" label="New Password"
            error={formErrors.new} fieldRef={newPasswordField}
          />

          <InputField
            name="confirm_password" type="password" label="Confirm New Password"
            error={formErrors.confirm} fieldRef={confirmPasswordField}
          />

          <div className="mt-4">
            <Button variant="primary" type="submit" className="w-100 rounded-pill fw-bold">
                Update Password
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
