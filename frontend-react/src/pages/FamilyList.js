import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from 'bootstrap';

const FamilyList = () => {
  const { currentUser } = useAuth();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDescription, setNewFamilyDescription] = useState('');
  
  // Используем useRef вместо useState для модального окна
  const modalRef = useRef(null);
  const modalInstance = useRef(null);

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await api.get('/families/');
        setFamilies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching families:', error);
        setError('Не удалось загрузить семьи. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchFamilies();
    
    // Initialize modal
    const modalElement = document.getElementById('createFamilyModal');
    if (modalElement) {
      modalInstance.current = new Modal(modalElement);
    }
    
    // Cleanup function
    return () => {
      if (modalInstance.current) {
        modalInstance.current.dispose();
      }
    };
  }, []);

  const openCreateModal = () => {
    if (modalInstance.current) {
      modalInstance.current.show();
    } else {
      // Если модальное окно не было инициализировано, попробуем еще раз
      const modalElement = document.getElementById('createFamilyModal');
      if (modalElement) {
        modalInstance.current = new Modal(modalElement);
        modalInstance.current.show();
      } else {
        console.error('Modal element not found');
      }
    }
  };

  const closeCreateModal = () => {
    if (modalInstance.current) {
      modalInstance.current.hide();
      setNewFamilyName('');
      setNewFamilyDescription('');
      setError(null);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    
    if (!newFamilyName.trim()) {
      setError('Название семьи обязательно');
      return;
    }
    
    try {
      const response = await api.post('/families/', {
        name: newFamilyName,
        description: newFamilyDescription
      });
      
      console.log('Family created successfully:', response.data);
      setFamilies([...families, response.data]);
      closeCreateModal();
      
      // Показываем сообщение об успехе
      alert('Family created successfully!');
    } catch (error) {
      console.error('Error creating family:', error);
      if (error.response && error.response.data) {
        // Отображаем конкретную ошибку от сервера, если она есть
        const errorMessage = 
          error.response.data.name || 
          error.response.data.description || 
          error.response.data.detail || 
          'Не удалось создать семью. Пожалуйста, попробуйте снова.';
        
        setError(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      } else {
        setError('Не удалось создать семью. Пожалуйста, попробуйте снова.');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка семей...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-users me-2"></i>Мои группы</h1>
        <button 
          className="btn btn-primary" 
          onClick={openCreateModal}
        >
          <i className="fas fa-plus-circle me-2"></i>Создать группу
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {families.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <i className="fas fa-users fa-4x text-muted mb-3"></i>
            <h3>Нет групп</h3>
            <p className="lead">У вас пока нет групп. Создайте одну, чтобы начать.</p>
            <button 
              className="btn btn-primary" 
              onClick={openCreateModal}
            >
              <i className="fas fa-plus-circle me-2"></i>Создать группу
            </button>
          </div>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {families.map(family => (
            <div className="col" key={family.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{family.name}</h5>
                  <p className="card-text text-muted">{family.description || 'No description'}</p>
                  <p className="card-text">
                    <small className="text-muted">
                      Дата создания: {new Date(family.created_at).toLocaleDateString()}
                    </small>
                  </p>
                </div>
                <div className="card-footer bg-transparent border-top-0">
                  <Link to={`/families/${family.id}`} className="btn btn-primary w-100">
                    <i className="fas fa-eye me-2"></i>Подробнее
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Family Modal - Bootstrap 5 Modal */}
      <div className="modal fade" id="createFamilyModal" tabIndex="-1" aria-labelledby="createFamilyModalLabel" aria-hidden="true" ref={modalRef}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="createFamilyModalLabel">Создать новую группу</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreateFamily}>
                <div className="mb-3">
                  <label htmlFor="familyName" className="form-label">Название</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="familyName" 
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="familyDescription" className="form-label">Описание</label>
                  <textarea 
                    className="form-control" 
                    id="familyDescription" 
                    rows="3"
                    value={newFamilyDescription}
                    onChange={(e) => setNewFamilyDescription(e.target.value)}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    data-bs-dismiss="modal"
                  >
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">Создать</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyList; 