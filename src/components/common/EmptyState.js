export default function EmptyState({ 
  icon = "bi-box-seam", 
  title = "No items found", 
  message = "There is nothing to show here yet." 
}) {
  return (
    <div className="text-center py-5 px-3">
      <div className="mb-3">
        <i className={`bi ${icon} display-4 text-secondary opacity-25`}></i>
      </div>
      <h5 className="fw-bold text-secondary mb-1">{title}</h5>
      <p className="text-muted small mb-0">{message}</p>
    </div>
  );
}
