import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <div className="py-5 text-center">
        <h1 className="display-4 fw-bold">Управляйте бюджетом вашей семьи</h1>
        <div className="col-lg-6 mx-auto">
          <p className="lead mb-4">
            Отслеживайте расходы, устанавливайте бюджеты и достигайте своих целей по сбережениям вместе с вашей семьей.
          </p>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg px-4 gap-3">
                Перейти на доску
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-lg px-4 gap-3">
                  Войти
                </Link>
                <Link to="/register" className="btn btn-outline-secondary btn-lg px-4">
                  Зарегистрироваться
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Ключевые функции</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i className="fas fa-users fa-3x text-primary mb-3"></i>
                  <h3 className="card-title">Управление семьей</h3>
                  <p className="card-text">
                    Создавайте и управляйте группами семей, приглашайте участников и сотрудничайте в ваших финансах.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i className="fas fa-money-bill-wave fa-3x text-primary mb-3"></i>
                  <h3 className="card-title">Управление бюджетом</h3>
                  <p className="card-text">
                    Установите бюджеты для различных категорий и отслеживайте свои расходы по ним.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i className="fas fa-piggy-bank fa-3x text-primary mb-3"></i>
                  <h3 className="card-title">Цели по сбережениям</h3>
                  <p className="card-text">
                    Создавайте цели по сбережениям и отслеживайте свой прогресс в их достижении.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">Как это работает</h2>
          <div className="row">
            <div className="col-md-3 text-center">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="fas fa-user-plus fa-2x"></i>
              </div>
              <h4>Создайте учетную запись</h4>
              <p>Зарегистрируйтесь и создайте свою личную учетную запись</p>
            </div>
            <div className="col-md-3 text-center">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="fas fa-users fa-2x"></i>
              </div>
              <h4>Создайте группу для семьи</h4>
              <p>Создайте группу семей и пригласите участников</p>
            </div>
            <div className="col-md-3 text-center">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="fas fa-money-check-alt fa-2x"></i>
              </div>
              <h4>Установите бюджеты</h4>
              <p>Создайте бюджеты для различных категорий</p>
            </div>
            <div className="col-md-3 text-center">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="fas fa-chart-line fa-2x"></i>
              </div>
              <h4>Отслеживайте прогресс</h4>
              <p>Отслеживайте свои расходы и сбережения</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-5 bg-primary text-white">
        <div className="container text-center">
          <h2 className="mb-4">Готовы начать управлять бюджетом вашей семьи?</h2>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-light btn-lg">
              Перейти на доску
            </Link>
          ) : (
            <Link to="/register" className="btn btn-light btn-lg">
              Начать сейчас
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 