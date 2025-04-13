import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container text-center py-5">
      <div className="mb-4">
        <i className="fas fa-exclamation-triangle fa-5x text-warning"></i>
      </div>
      <h1 className="display-1 fw-bold">404</h1>
      <h2 className="mb-4">Страница не найдена</h2>
      <p className="lead mb-4">
        Страница, которую вы ищете, может быть удалена, переименована или временно недоступна.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">
        <i className="fas fa-home me-2"></i>Перейти на главную страницу
      </Link>
    </div>
  );
};

export default NotFound; 