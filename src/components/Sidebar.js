import { useState, useEffect } from 'react';
import { Nav, Collapse, Offcanvas, Button } from "react-bootstrap";
import { NavLink, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserProvider'; // Check path '../' vs '../../'
import logo from '../assets/logo.png';
import ThemeToggle from './common/ThemeToggle';

export default function Sidebar() {
  const [showMobile, setShowMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const handleClose = () => setShowMobile(false);
  const handleShow = () => setShowMobile(true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* === MOBILE HEADER === */}
      {!isDesktop && (
        <>
          {/* FIX 1: Use bg-sidebar instead of bg-white */}
          <div className="bg-sidebar border-bottom p-3 sticky-top w-100 shadow-sm d-flex justify-content-between align-items-center">
             <div className="d-flex align-items-center gap-2">
                <img src={logo} alt="Logo" height="32" className="rounded-2" />
                <span className="fw-bold text-primary fs-5" style={{letterSpacing:'-0.5px'}}>NookNotes</span>
             </div>
             <Button variant="link" className="border-0 text-body-50" onClick={handleShow}>
                <i className="bi bi-list fs-4"></i>
             </Button>
          </div>

          <Offcanvas show={showMobile} onHide={handleClose} style={{maxWidth: '85%'}}>
            <Offcanvas.Header closeButton className="border-bottom">
              <Offcanvas.Title className="fw-bold text-primary d-flex align-items-center gap-2">
                 <img src={logo} alt="Logo" height="28" className="rounded-2" />
                 NookNotes
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="d-flex flex-column h-100 p-0 bg-sidebar">
                <SidebarContent onNavigate={handleClose} />
            </Offcanvas.Body>
          </Offcanvas>
        </>
      )}

      {/* === DESKTOP SIDEBAR === */}
      {isDesktop && (
          // FIX 2: Use bg-sidebar instead of bg-white
          <div
            className="d-flex flex-column bg-sidebar border-end sticky-top vh-100 p-3 shadow-sm"
            style={{ width: '260px', minWidth: '260px', zIndex: 1020 }}
          >
            <div className="mb-4 px-2 d-flex align-items-center gap-2">
                <img src={logo} alt="Logo" height="36" className="rounded-3" />
                <h5 className="text-primary fw-bold m-0" style={{letterSpacing:'-0.5px'}}>
                   NookNotes
                </h5>
            </div>
            <SidebarContent />
          </div>
      )}
    </>
  );
}

// === SIDEBAR LINKS CONTENT ===
function SidebarContent({ onNavigate }) {
  const { user, logout } = useUser();

  const [openGifts, setOpenGifts] = useState(false);
  const [openShopping, setOpenShopping] = useState(false);
  const [openTasks, setOpenTasks] = useState(false);
  const [openBudgets, setOpenBudgets] = useState(false);

  // FIX 3: Change 'text-dark' to 'text-body' so it adapts to dark mode automatically
  const linkBase = "d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none transition-all";
  const linkInactive = "text-body hover-opacity-100 hover-bg-light";
  const linkActive = "bg-primary-subtle text-primary fw-bold shadow-sm";

  const getLinkClass = ({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`;

  return (
    <div className="d-flex flex-column h-100">
      <Nav className="flex-column mb-auto gap-1">

        <Nav.Item>
          <NavLink to="/" end onClick={onNavigate} className={getLinkClass}>
            <i className="bi bi-grid-fill"></i> Feed
          </NavLink>
        </Nav.Item>

        {/* --- BUDGET --- */}
        <Nav.Item>
          <div onClick={() => setOpenBudgets(!openBudgets)} className={`${linkBase} ${linkInactive} justify-content-between`} style={{cursor: 'pointer'}}>
            <span className="d-flex align-items-center gap-2"><i className="bi bi-wallet2"></i>Finance</span>
            <i className={`bi ${openBudgets ? 'bi-chevron-down' : 'bi-chevron-right'} small opacity-50`}></i>
          </div>
          <Collapse in={openBudgets}>
            <div className="ms-3 ps-2 border-start my-1">
              <NavLink to="/budget" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Accounts</NavLink>
              <NavLink to="/budget/dashboard" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Dashboard</NavLink>
              <NavLink to="/loan/dashboard" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Loans</NavLink>
              <NavLink to="/csv-importer" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">CSV Importer</NavLink>
              <NavLink to="/vendors" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Rules & Vendors</NavLink>
              <NavLink to="/budget/analytics" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Analytics</NavLink>
            </div>
          </Collapse>
        </Nav.Item>

        {/* --- SHOPPING --- */}
        <Nav.Item>
          <div onClick={() => setOpenShopping(!openShopping)} className={`${linkBase} ${linkInactive} justify-content-between`} style={{cursor: 'pointer'}}>
            <span className="d-flex align-items-center gap-2"><i className="bi bi-cart3"></i>Groceries</span>
            <i className={`bi ${openShopping ? 'bi-chevron-down' : 'bi-chevron-right'} small opacity-50`}></i>
          </div>
          <Collapse in={openShopping}>
              <div className="ms-3 ps-2 border-start my-1">
                <NavLink to="/shopping_list" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Current List</NavLink>
                <NavLink to="/shopping_receipts" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">History</NavLink>
                <NavLink to="/recipes" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Recipes</NavLink>
                <NavLink to="/meals" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Meal Planning</NavLink>
                <NavLink to="/price-tracker" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Price Tracker</NavLink>
                <NavLink to="/grocery-dictionary" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Item Dictionary</NavLink>
              </div>
          </Collapse>
        </Nav.Item>

        {/* --- TASKS --- */}
        <Nav.Item>
          <div onClick={() => setOpenTasks(!openTasks)} className={`${linkBase} ${linkInactive} justify-content-between`} style={{cursor: 'pointer'}}>
            <span className="d-flex align-items-center gap-2"><i className="bi bi-check2-square"></i>Tasks</span>
            <i className={`bi ${openTasks ? 'bi-chevron-down' : 'bi-chevron-right'} small opacity-50`}></i>
          </div>
          <Collapse in={openTasks}>
              <div className="ms-3 ps-2 border-start my-1">
                <NavLink to="/my_task" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Dashboard</NavLink>
                <NavLink to="/task_stats" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Stats</NavLink>
                <NavLink to="/log_tasks" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Logs</NavLink>
              </div>
          </Collapse>
        </Nav.Item>

        {/* --- GIFTS --- */}
        <Nav.Item>
          <div onClick={() => setOpenGifts(!openGifts)} className={`${linkBase} ${linkInactive} justify-content-between`} style={{cursor: 'pointer'}}>
            <span className="d-flex align-items-center gap-2"><i className="bi bi-gift"></i>Gifts</span>
            <i className={`bi ${openGifts ? 'bi-chevron-down' : 'bi-chevron-right'} small opacity-50`}></i>
          </div>
          <Collapse in={openGifts}>
            <div className="ms-3 ps-2 border-start my-1">
              <NavLink to="/my_gift" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Wishlist</NavLink>
              <NavLink to="/search_gifts" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Find Friends</NavLink>
              <NavLink to="/gifts_bought" onClick={onNavigate} className="d-block px-3 py-1 text-decoration-none text-body-75 small hover-text-body">Bought Items</NavLink>
            </div>
          </Collapse>
        </Nav.Item>

      </Nav>

      <div className="mt-auto pt-3 border-top">
        {user && (
           <div className="d-flex align-items-center justify-content-between p-2 rounded-3 hover-bg-light">
               <div className="d-flex align-items-center gap-3">
                   <Link to={`/user/${user.username}`} onClick={onNavigate} className="text-decoration-none">
                       <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{width: '36px', height: '36px'}}>
                           {user.username ? user.username[0].toUpperCase() : <i className="bi bi-person-fill"></i>}
                       </div>
                   </Link>

                   <div className="d-flex flex-column overflow-hidden" style={{lineHeight: '1.2'}}>
                       <Link to={`/user/${user.username}`} onClick={onNavigate} className="fw-bold text-body text-decoration-none text-truncate" style={{maxWidth: '100px'}}>
                           {user.username}
                       </Link>
                       <small className="text-body-75 text-decoration-none" style={{cursor:'pointer', fontSize:'0.75rem'}} onClick={() => { logout(); onNavigate && onNavigate(); }}>
                           Sign Out
                       </small>
                   </div>
               </div>
               <ThemeToggle />
           </div>
        )}
      </div>
    </div>
  );
}
