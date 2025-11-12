import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
      await signOut(auth);
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>ControlDocente Ucayali</h2>
        </div>
        
        <div className="navbar-menu">
          <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </Link>
          <Link to="/registros" className={isActive('/registros') ? 'nav-link active' : 'nav-link'}>
            Registros
          </Link>
          <Link to="/reportes" className={isActive('/reportes') ? 'nav-link active' : 'nav-link'}>
            Reportes
          </Link>
          <Link to="/admin" className={isActive('/admin') ? 'nav-link active' : 'nav-link'}>
            Administrador
          </Link>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
