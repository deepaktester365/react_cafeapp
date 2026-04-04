import { Button } from 'react-bootstrap';
import { useTheme } from '../../contexts/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant={isDark ? "dark" : "light"}
      onClick={toggleTheme}
      className="rounded-circle d-flex align-items-center justify-content-center border shadow-sm"
      style={{ width: '38px', height: '38px' }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <i className={`bi ${isDark ? 'bi-moon-stars-fill text-warning' : 'bi-sun-fill text-warning'}`}></i>
    </Button>
  );
}
