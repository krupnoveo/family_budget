import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    if (!termsAccepted) {
      setError('Вы должны принять условия использования и политику конфиденциальности');
      return;
    }
    
    if (formData.password !== formData.password_confirm) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const result = await register(formData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Не удалось создать учетную запись. Пожалуйста, попробуйте снова.');
      console.error('Ошибка регистрации:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card" style={{ maxWidth: '550px', width: '100%' }}>
      <div className="card-header bg-primary text-white text-center py-4">
        <i className="fas fa-user-plus fa-3x mb-2"></i>
        <h2>Регистрация</h2>
        <p className="mb-0">Присоединитесь к Family Budget для управления своими финансами</p>
      </div>
      <div className="card-body p-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="firstName" className="form-label">Имя</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  name="first_name"
                  placeholder="Введите ваше имя"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="lastName" className="form-label">Фамилия</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  name="last_name"
                  placeholder="Введите вашу фамилию"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                placeholder="Введите ваш email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Пароль</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="password"
                name="password"
                placeholder="Создайте пароль"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <div className="form-text">Пароль должен быть не менее 8 символов.</div>
          </div>
          <div className="mb-3">
            <label htmlFor="password_confirm" className="form-label">Подтверждение пароля</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="password_confirm"
                name="password_confirm"
                placeholder="Подтвердите пароль"
                value={formData.password_confirm}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            <label className="form-check-label" htmlFor="terms">
              Я согласен с <a href="#">Условиями использования</a> и <a href="#">Политикой конфиденциальности</a>
            </label>
          </div>
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Регистрация...
                </>
              ) : (
                <>Зарегистрироваться</>
              )}
            </button>
          </div>
        </form>
        <div className="text-center mt-3">
          <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register; 