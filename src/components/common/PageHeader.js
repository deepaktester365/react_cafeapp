import { Stack } from "react-bootstrap";

export default function PageHeader({ title, icon, actions }) {
  return (
    <div
      // FIX: Added 'rounded-4 mx-3 mt-3' for the floating look.
      // Removed 'border-bottom' as the shadow defines the shape now.
      className="bg-surface py-3 px-4 mb-4 sticky-top shadow-sm rounded-4 mx-3 mt-3"
      // FIX: Set top to 1rem (16px) so it maintains the gap while scrolling
      style={{ zIndex: 1020, top: '1rem' }}
    >
      <Stack direction="horizontal" gap={3} className="align-items-center justify-content-between">

        {/* Title Section */}
        <div className="d-flex align-items-center gap-2">
          {icon && <i className={`bi ${icon} fs-4 text-primary`}></i>}
          <h4 className="m-0 fw-bold text-primary">{title}</h4>
        </div>

        {/* Action Buttons (Add New, Filter, etc) */}
        <div className="d-flex align-items-center gap-2">
          {actions}
        </div>
      </Stack>
    </div>
  );
}
