import { Badge } from "react-bootstrap";

export default function StatusBadge({ variant = "secondary", label, icon, className = "" }) {
  // Map our Nook variants to Bootstrap logic if needed, or rely on our CSS overrides
  // We use "bg-subtle" classes for that pastel look with dark text
  
  let bgClass = `bg-${variant}-subtle text-${variant}`;
  
  if (variant === 'dark') bgClass = "bg-secondary-subtle text-dark";
  
  return (
    <Badge className={`px-2 py-1 fw-bold border border-${variant}-subtle ${bgClass} ${className}`}>
      {icon && <i className={`bi ${icon} me-1`}></i>}
      {label}
    </Badge>
  );
}
