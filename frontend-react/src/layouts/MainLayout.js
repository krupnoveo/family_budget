import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dropdown } from 'bootstrap';

const MainLayout = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const dropdownRef = useRef(null);
  const dropdownInstance = useRef(null);

  useEffect(() => {
    // Initialize dropdown
    if (dropdownRef.current) {
      dropdownInstance.current = new Dropdown(dropdownRef.current);
    }

    return () => {
      // Cleanup
      if (dropdownInstance.current) {
        dropdownInstance.current.dispose();
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    if (dropdownInstance.current) {
      dropdownInstance.current.toggle();
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-wallet me-2"></i>Family Budget
          </Link>
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            aria-controls="navbarNav" 
            aria-expanded={!isNavCollapsed} 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isNavCollapsed ? '' : 'show'}`} id="navbarNav">
            <ul className="navbar-nav me-auto">
              {isAuthenticated && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/dashboard">
                      <i className="fas fa-tachometer-alt me-1"></i>Доска
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/families">
                      <i className="fas fa-users me-1"></i>Группы
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/budgets">
                      <i className="fas fa-money-bill-wave me-1"></i>Бюджеты
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/transactions">
                      <i className="fas fa-exchange-alt me-1"></i>Транзакции
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/savings-goals">
                      <i className="fas fa-piggy-bank me-1"></i>Цели накопления
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <ul className="navbar-nav">
              {isAuthenticated ? (
                <li className="nav-item dropdown">
                  <button 
                    className="nav-link dropdown-toggle" 
                    id="navbarDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                    type="button"
                    ref={dropdownRef}
                    onClick={toggleDropdown}
                  >
                    <i className="fas fa-user-circle me-1"></i>
                    {currentUser?.first_name || currentUser?.email || 'Пользователь'}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="fas fa-user me-2"></i>Профиль
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i>Выйти
                      </button>
                    </li>
                  </ul>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Вход</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Регистрация</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mt-4 flex-grow-1">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="bg-light text-center text-lg-start mt-5">
        <div className="container p-4">
          <div className="row">
            <div className="col-lg-6 col-md-12 mb-4 mb-md-0">
              <h5 className="text-uppercase">Family Budget</h5>
              <p>
                Полное решение для управления вашими семейными финансами.
                Отслеживайте расходы, устанавливайте бюджеты и достигайте своих целей накопления вместе.
              </p>
            </div>
            <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
              <h5 className="text-uppercase">Ссылки</h5>
              <ul className="list-unstyled mb-0">
                <li><Link to="/" className="text-dark">Главная</Link></li>
                {isAuthenticated ? (
                  <>
                    <li><Link to="/dashboard" className="text-dark">Доска</Link></li>
                    <li><Link to="/families" className="text-dark">Группы</Link></li>
                    <li><Link to="/budgets" className="text-dark">Бюджеты</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" className="text-dark">Вход</Link></li>
                    <li><Link to="/register" className="text-dark">Регистрация</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
              <h5 className="text-uppercase">Контакты</h5>
              <ul className="list-unstyled mb-0">
                <li><button className="btn btn-link text-dark p-0">Поддержка</button></li>
                <li><button className="btn btn-link text-dark p-0">FAQ</button></li>
                <li><button className="btn btn-link text-dark p-0">Политика конфиденциальности</button></li>
                <li><button className="btn btn-link text-dark p-0">Условия использования</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
          © {new Date().getFullYear()} Family Budget
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 