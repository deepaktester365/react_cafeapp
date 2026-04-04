import { useContext } from "react";
import Alert from "react-bootstrap/Alert";
import Collapse from "react-bootstrap/Collapse";
import { FlashContext } from "../contexts/FlashProvider";

export default function FlashMessage() {
  const { flashMessage, visible, hideFlash } = useContext(FlashContext);

  return (
    <div className="px-3 pt-3">
        <Collapse in={visible}>
        <div>
            <Alert
                variant={flashMessage.type || 'info'}
                dismissible
                onClose={hideFlash}
                className="shadow-sm border-0 rounded-4 d-flex align-items-center"
            >
                {/* Optional Icon based on type */}
                {flashMessage.type === 'success' && <i className="bi bi-check-circle-fill me-2 fs-5"></i>}
                {flashMessage.type === 'danger' && <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>}

                <div>
                    {flashMessage.message}
                </div>
            </Alert>
        </div>
        </Collapse>
    </div>
  );
}
