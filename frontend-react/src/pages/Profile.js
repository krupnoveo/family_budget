import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Button, Alert, Spinner, Form } from 'react-bootstrap';

const Profile = () => {
  const { currentUser, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userProfile, setUserProfile] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [invitationError, setInvitationError] = useState(null);
  
  // Состояния для модальных окон
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUserProfile({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || ''
      });
      
      // Загрузка приглашений
      fetchInvitations();
    }
  }, [currentUser]);

  // Функция для загрузки приглашений
  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    setInvitationError(null);
    
    try {
      const response = await api.get('/families/invitations/');
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitationError('Не удалось загрузить приглашения. Пожалуйста, попробуйте позже.');
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Функция для ответа на приглашение
  const respondToInvitation = async (invitationId, response) => {
    setLoadingInvitations(true);
    setInvitationError(null);
    
    try {
      await api.post(`/families/invitations/${invitationId}/respond/`, {
        response: response
      });
      
      // Обновляем список приглашений
      fetchInvitations();
      
      // Показываем сообщение об успехе
      setSuccess(response === 'accept' ? 'Приглашение принято!' : 'Приглашение отклонено.');
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setInvitationError('Не удалось ответить на приглашение. Пожалуйста, попробуйте позже.');
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.put('/users/profile/', {
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email
      });
      
      updateUser(response.data);
      setSuccess('Профиль обновлен успешно!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Не удалось обновить профиль. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Новые пароли не совпадают');
      setLoading(false);
      return;
    }
    
    try {
      await api.post('/users/change-password/', {
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirm: passwordData.confirm_password
      });
      
      setSuccess('Пароль успешно изменен!');
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response && error.response.data) {
        // Отображаем конкретную ошибку от сервера, если она есть
        const errorMessage = 
          error.response.data.old_password || 
          error.response.data.new_password || 
          error.response.data.detail || 
          'Не удалось изменить пароль. Пожалуйста, проверьте свой текущий пароль и попробуйте снова.';
        
        setError(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      } else {
        setError('Не удалось изменить пароль. Пожалуйста, проверьте свой текущий пароль и попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!currentUser) {
    return (
      <div className="alert alert-warning" role="alert">
        Вы должны быть авторизованы для просмотра своего профиля. <Link to="/login">Перейти к входу</Link>
      </div>
    );
  }

  // Компонент для отображения приглашений
  const renderInvitations = () => {
    if (loadingInvitations) {
      return (
        <div className="text-center py-3">
          <Spinner animation="border" variant="primary" role="status">
            <span className="visually-hidden">Загрузка приглашений...</span>
          </Spinner>
          <p className="mt-2">Загрузка приглашений...</p>
        </div>
      );
    }

    if (invitationError) {
      return (
        <Alert variant="danger">
          {invitationError}
        </Alert>
      );
    }

    if (invitations.length === 0) {
      return (
        <div className="text-center py-4">
          <i className="fas fa-envelope-open fa-3x text-muted mb-3"></i>
          <h5>Нет приглашений</h5>
          <p>У вас нет активных приглашений в группы.</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Группа</th>
              <th>Приглашение от</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map(invitation => (
              <tr key={invitation.id}>
                <td>{invitation.family.name}</td>
                <td>{invitation.invited_by.first_name} {invitation.invited_by.last_name}</td>
                <td>{new Date(invitation.invited_at).toLocaleDateString()}</td>
                <td>
                  <Button 
                    variant="success" 
                    size="sm" 
                    className="me-2"
                    onClick={() => respondToInvitation(invitation.id, 'accept')}
                  >
                    <i className="fas fa-check me-1"></i>Принять
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => respondToInvitation(invitation.id, 'reject')}
                  >
                    <i className="fas fa-times me-1"></i>Отклонить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-user-circle me-2"></i>Мой профиль</h1>
      </div>
      
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          {success}
        </Alert>
      )}

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-user-circle fa-6x text-primary"></i>
              </div>
              <h3>{currentUser.first_name} {currentUser.last_name}</h3>
              <p className="text-muted">{currentUser.email}</p>
              <div className="d-grid gap-2 mt-4">
                <Button 
                  variant="primary" 
                  onClick={() => setShowEditModal(true)}
                >
                  <i className="fas fa-edit me-2"></i>Редактировать профиль
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowPasswordModal(true)}
                >
                  <i className="fas fa-key me-2"></i>Изменить пароль
                </Button>
                <Button 
                  variant="outline-danger" 
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt me-2"></i>Выйти
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          {/* Приглашения в группы */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0"><i className="fas fa-envelope me-2"></i>Приглашения в группы</h5>
            </div>
            <div className="card-body">
              {renderInvitations()}
            </div>
          </div>
          
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Информация об учетной записи</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-sm-3">
                  <strong>Имя:</strong>
                </div>
                <div className="col-sm-9">
                  {currentUser.first_name}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-sm-3">
                  <strong>Фамилия:</strong>
                </div>
                <div className="col-sm-9">
                  {currentUser.last_name}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-sm-3">
                  <strong>Почта:</strong>
                </div>
                <div className="col-sm-9">
                  {currentUser.email}
                </div>
              </div>
              
            </div>
          </div>
          
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Настройки безопасности</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Пароль</h6>
                    <p className="text-muted mb-0">Измените свой пароль регулярно, чтобы обеспечить безопасность своей учетной записи</p>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Изменить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Редактировать профиль</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleUpdateProfile}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="first_name">Имя</Form.Label>
              <Form.Control 
                type="text" 
                id="first_name" 
                name="first_name"
                value={userProfile.first_name}
                onChange={handleProfileInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="last_name">Фамилия</Form.Label>
              <Form.Control 
                type="text" 
                id="last_name" 
                name="last_name"
                value={userProfile.last_name}
                onChange={handleProfileInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="email">Почта</Form.Label>
              <Form.Control 
                type="email" 
                id="email" 
                value={userProfile.email}
                disabled
              />
              <Form.Text className="text-muted">
                Почта не может быть изменена
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => setShowEditModal(false)}
              >
                Отменить
              </Button>
              <Button 
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Сохраняется...
                  </>
                ) : 'Сохранить изменения'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Изменить пароль</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleChangePassword}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="current_password">Текущий пароль</Form.Label>
              <Form.Control 
                type="password" 
                id="current_password" 
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="new_password">Новый пароль</Form.Label>
              <Form.Control 
                type="password" 
                id="new_password" 
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordInputChange}
                required
                minLength="8"
              />
              <Form.Text className="text-muted">
                Пароль должен быть не менее 8 символов
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="confirm_password">Подтвердите новый пароль</Form.Label>
              <Form.Control 
                type="password" 
                id="confirm_password" 
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordInputChange}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => setShowPasswordModal(false)}
              >
                Отменить
              </Button>
              <Button 
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Изменяется...
                  </>
                ) : 'Изменить пароль'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Profile; 