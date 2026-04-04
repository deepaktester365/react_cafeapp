import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

export default function IconButton({ icon, onClick, variant = "secondary", size = "sm", tooltip, className = "" }) {
  const button = (
    <Button 
      variant="link" 
      size={size} 
      onClick={onClick}
      className={`text-${variant} opacity-50 hover-opacity-100 p-0 ${className}`}
      style={{ minWidth: '32px', minHeight: '32px' }} // Touch target size
    >
      <i className={`bi ${icon}`}></i>
    </Button>
  );

  if (tooltip) {
    return (
      <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
        {button}
      </OverlayTrigger>
    );
  }

  return button;
}
