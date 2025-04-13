import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  // Если пользователь уже аутентифицирован, перенаправляем на dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Simple Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-wallet me-2"></i>Family Budget
          </Link>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Auth Content */}
      <div className="container mt-4 flex-grow-1 d-flex justify-content-center align-items-center">
        <Outlet />
      </div>

      {/* Simple Footer */}
      <footer className="bg-light text-center p-3">
        <div className="container">
          <p className="mb-0">© {new Date().getFullYear()} Family Budget</p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout; 