import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Button, Form } from 'react-bootstrap';

const FamilyDetail = () => {
  const { familyId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showConfirmLeaveModal, setShowConfirmLeaveModal] = useState(false);

  useEffect(() => {
    const fetchFamilyDetails = async () => {
      try {
        const familyResponse = await api.get(`/families/${familyId}/`);
        setFamily(familyResponse.data);
        setEditName(familyResponse.data.name);
        setEditDescription(familyResponse.data.description || '');
        
        const membersResponse = await api.get(`/families/${familyId}/members/`);
        setMembers(membersResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching family details:', error);
        setError('Не удалось загрузить детали семьи. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchFamilyDetails();
  }, [familyId]);

  const openInviteModal = () => {
    setShowInviteModal(true);
  };
  
  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setError(null);
  };
  
  const openEditModal = () => {
    setShowEditModal(true);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setError(null);
  };
  
  const openLeaveModal = () => {
    setShowConfirmLeaveModal(true);
  };
  
  const closeLeaveModal = () => {
    setShowConfirmLeaveModal(false);
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    try {
      await api.post(`/families/${familyId}/invite/`, {
        email: inviteEmail
      });
      
      closeInviteModal();
      // Show success message
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error inviting member:', error);
      setError('Не удалось отправить приглашение. Пожалуйста, попробуйте снова.');
    }
  };

  const handleUpdateFamily = async (e) => {
    e.preventDefault();
    
    if (!editName.trim()) {
      setError('Название семьи обязательно');
      return;
    }
    
    try {
      const response = await api.put(`/families/${familyId}/`, {
        name: editName,
        description: editDescription
      });
      
      setFamily(response.data);
      closeEditModal();
    } catch (error) {
      console.error('Error updating family:', error);
      setError('Не удалось обновить семью. Пожалуйста, попробуйте снова.');
    }
  };

  const handleLeaveFamily = async () => {
    try {
      await api.delete(`/families/${familyId}/leave/`);
      navigate('/families');
    } catch (error) {
      console.error('Error leaving family:', error);
      setError('Не удалось покинуть семью. Пожалуйста, попробуйте снова.');
    }
  };

  const isAdmin = () => {
    if (!family || !currentUser) return false;
    return family.created_by.id === currentUser.id;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загружается...</span>
        </div>
        <p className="mt-2">Загружаются детали семьи...</p>
      </div>
    );
  }

  if (error && !family) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!family) {
    return (
      <div className="alert alert-warning" role="alert">
        Семья не найдена. <Link to="/families">Вернуться к семьям</Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-users me-2"></i>{family.name}</h1>
        <div className="btn-group">
          {isAdmin() && (
            <button 
              className="btn btn-outline-primary" 
              onClick={openEditModal}
            >
              <i className="fas fa-edit me-2"></i>Редактировать семью
            </button>
          )}
          <button 
            className="btn btn-outline-primary" 
            onClick={openInviteModal}
          >
            <i className="fas fa-user-plus me-2"></i>Пригласить участника
          </button>
          <button 
            className="btn btn-outline-danger" 
            onClick={openLeaveModal}
          >
            <i className="fas fa-sign-out-alt me-2"></i>Покинуть семью
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Участники семьи</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                {members.map(member => (
                  <div key={member.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">{member.user.first_name} {member.user.last_name}</h6>
                      <small className="text-muted">{member.user.email}</small>
                    </div>
                    <div>
                      {member.status === 'pending' ? (
                        <span className="badge bg-warning">Ожидает подтверждения</span>
                      ) : (
                        <span className="badge bg-success">Активный</span>
                      )}
                      {member.user.id === family.created_by.id && (
                        <span className="badge bg-primary ms-2">Администратор</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Быстрые действия</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to={`/budgets?family=${familyId}`} className="btn btn-primary">
                  <i className="fas fa-money-bill-wave me-2"></i>Просмотр бюджетов
                </Link>
                <Link to={`/transactions?family=${familyId}`} className="btn btn-primary">
                  <i className="fas fa-exchange-alt me-2"></i>Просмотр транзакций
                </Link>
                <Link to={`/savings-goals?family=${familyId}`} className="btn btn-primary">
                  <i className="fas fa-piggy-bank me-2"></i>Просмотр целей накопления
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal show={showInviteModal} onHide={closeInviteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Пригласить участника</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Form onSubmit={handleInviteMember}>
            <Form.Group className="mb-3">
              <Form.Label>Почта</Form.Label>
              <Form.Control 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Введите адрес электронной почты человека, которого вы хотите пригласить в эту семью.
              </Form.Text>
            </Form.Group>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeInviteModal}>
                Отменить
              </Button>
              <Button variant="primary" type="submit">
                Отправить приглашение
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Family Modal */}
      <Modal show={showEditModal} onHide={closeEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Редактировать семью</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Form onSubmit={handleUpdateFamily}>
            <Form.Group className="mb-3">
              <Form.Label>Название семьи</Form.Label>
              <Form.Control 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание (Необязательно)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </Form.Group>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeEditModal}>
                Отменить
              </Button>
              <Button variant="primary" type="submit">
                Обновить группу
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Confirm Leave Modal */}
      <Modal show={showConfirmLeaveModal} onHide={closeLeaveModal}>
        <Modal.Header closeButton>
          <Modal.Title>Покинуть группу</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Вы уверены, что хотите покинуть эту группу?</p>
          {isAdmin() && (
            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Вы являетесь администратором этой группы. Если вы покинете группу, она будет удалена, если не будет других участников.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeLeaveModal}>
            Отменить
          </Button>
          <Button variant="danger" onClick={handleLeaveFamily}>
            Покинуть группу
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FamilyDetail; 