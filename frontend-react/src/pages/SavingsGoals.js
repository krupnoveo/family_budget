import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Dropdown, Modal, Button, Form, InputGroup, ProgressBar, Alert, Spinner } from 'react-bootstrap';

const SavingsGoals = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const familyIdFromQuery = queryParams.get('family');
  
  const [selectedFamilyId, setSelectedFamilyId] = useState(
    familyIdFromQuery || localStorage.getItem('selectedFamilyId') || null
  );
  const [families, setFamilies] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    description: ''
  });
  const [editGoal, setEditGoal] = useState({
    id: null,
    name: '',
    target_amount: '',
    target_date: '',
    description: ''
  });
  const [contribution, setContribution] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    savings_goal_id: null
  });
  const [goalToDelete, setGoalToDelete] = useState(null);
  
  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load families
  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await api.get('/families/');
        setFamilies(response.data);
        
        // If no selected family but there are families in the list, select the first one
        if (!selectedFamilyId && response.data.length > 0) {
          setSelectedFamilyId(response.data[0].id);
          localStorage.setItem('selectedFamilyId', response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching families:', error);
        setError('Не удалось загрузить группы. Пожалуйста, попробуйте позже.');
      }
    };

    fetchFamilies();
  }, [selectedFamilyId]);

  // Load savings goals when family is selected
  useEffect(() => {
    const fetchSavingsGoals = async () => {
      if (!selectedFamilyId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await api.get(`/budgets/savings-goals/?family_id=${selectedFamilyId}`);
        setSavingsGoals(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching savings goals:', error);
        setError('Не удалось загрузить цели накопления. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchSavingsGoals();
  }, [selectedFamilyId]);

  // Handle family selection
  const handleFamilySelect = (familyId) => {
    setSelectedFamilyId(familyId);
    localStorage.setItem('selectedFamilyId', familyId);
  };

  // Handle input change for new goal
  const handleGoalInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({ ...prev, [name]: value }));
  };

  // Handle input change for edit goal
  const handleEditGoalInputChange = (e) => {
    const { name, value } = e.target;
    setEditGoal(prev => ({ ...prev, [name]: value }));
  };

  // Handle input change for contribution
  const handleContributionInputChange = (e) => {
    const { name, value } = e.target;
    setContribution(prev => ({ ...prev, [name]: value }));
  };

  // Open create goal modal
  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  // Close create goal modal
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewGoal({
      name: '',
      target_amount: '',
      target_date: '',
      description: ''
    });
    setError(null);
  };

  // Open edit goal modal
  const openEditModal = (goal) => {
    setEditGoal({
      id: goal.id,
      name: goal.name,
      target_amount: goal.target_amount,
      target_date: goal.target_date,
      description: goal.description || ''
    });
    setShowEditModal(true);
  };

  // Close edit goal modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditGoal({
      id: null,
      name: '',
      target_amount: '',
      target_date: '',
      description: ''
    });
    setError(null);
  };

  // Open contribute modal
  const openContributeModal = (goalId) => {
    setContribution(prev => ({ ...prev, savings_goal_id: goalId }));
    setShowContributeModal(true);
  };

  // Close contribute modal
  const closeContributeModal = () => {
    setShowContributeModal(false);
    setContribution({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      savings_goal_id: null
    });
    setError(null);
  };

  // Open delete confirmation modal
  const openDeleteModal = (goal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setGoalToDelete(null);
    setError(null);
  };

  // Create new savings goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newGoal.name || !newGoal.target_amount || !newGoal.target_date) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      const response = await api.post(`/budgets/savings-goals/`, {
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        target_date: newGoal.target_date,
        description: newGoal.description,
        family_id: selectedFamilyId
      });
      
      setSavingsGoals([...savingsGoals, response.data]);
      setSuccess('Цель накопления успешно создана!');
      closeCreateModal();
      
      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error creating savings goal:', error);
      setError(error.response?.data?.detail || 'Не удалось создать цель накопления. Пожалуйста, попробуйте снова.');
    }
  };

  // Edit savings goal
  const handleEditGoal = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!editGoal.name || !editGoal.target_amount || !editGoal.target_date) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      const response = await api.put(`/budgets/savings-goals/${editGoal.id}/`, {
        name: editGoal.name,
        target_amount: parseFloat(editGoal.target_amount),
        target_date: editGoal.target_date,
        description: editGoal.description,
        family_id: selectedFamilyId
      });
      
      // Update the savings goal in the list
      const updatedGoals = savingsGoals.map(goal => 
        goal.id === editGoal.id ? response.data : goal
      );
      
      setSavingsGoals(updatedGoals);
      setSuccess('Цель накопления успешно обновлена!');
      closeEditModal();
      
      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating savings goal:', error);
      setError(error.response?.data?.detail || 'Не удалось обновить цель накопления. Пожалуйста, попробуйте снова.');
    }
  };

  // Delete savings goal
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await api.delete(`/budgets/savings-goals/${goalToDelete.id}/`);
      
      // Remove the deleted goal from the list
      const updatedGoals = savingsGoals.filter(goal => goal.id !== goalToDelete.id);
      setSavingsGoals(updatedGoals);
      setSuccess('Цель накопления успешно удалена!');
      closeDeleteModal();
      
      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      setError(error.response?.data?.detail || 'Не удалось удалить цель накопления. Пожалуйста, попробуйте снова.');
      closeDeleteModal();
    }
  };

  // Add contribution to savings goal
  const handleContribute = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!contribution.amount || !contribution.date || !contribution.savings_goal_id) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      const response = await api.post(`/budgets/savings-contributions/`, {
        amount: parseFloat(contribution.amount),
        date: contribution.date,
        savings_goal_id: contribution.savings_goal_id
      });
      
      // Получаем обновленную цель накопления
      const updatedGoalResponse = await api.get(`/budgets/savings-goals/${contribution.savings_goal_id}/`);
      
      // Update the savings goal in the list
      const updatedGoals = savingsGoals.map(goal => 
        goal.id === contribution.savings_goal_id ? updatedGoalResponse.data : goal
      );
      
      setSavingsGoals(updatedGoals);
      setSuccess('Вклад успешно добавлен!');
      closeContributeModal();
      
      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding contribution:', error);
      setError(error.response?.data?.detail || 'Не удалось добавить вклад. Пожалуйста, попробуйте снова.');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  // Calculate days remaining
  const calculateDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get selected family
  const selectedFamily = families.find(family => family.id === parseInt(selectedFamilyId));

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-2">Загрузка целей накопления...</p>
      </div>
    );
  }

  // No families found
  if (families.length === 0) {
    return (
      <div className="card text-center py-5">
        <div className="card-body">
          <i className="fas fa-users fa-4x text-muted mb-3"></i>
          <h3>Группы не найдены</h3>
          <p className="lead">У вас еще нет групп. Создайте одну, чтобы начать.</p>
          <Link to="/families" className="btn btn-primary">
            <i className="fas fa-plus-circle me-2"></i>Создать группу
          </Link>
        </div>
      </div>
    );
  }

  // No family selected
  if (!selectedFamilyId) {
    return (
      <div className="text-center my-5">
        <i className="fas fa-users fa-4x text-muted mb-3"></i>
        <h3>Группа не выбрана</h3>
        <p className="lead">Пожалуйста, выберите группу для просмотра целей накопления.</p>
        <Dropdown>
          <Dropdown.Toggle variant="primary" id="family-dropdown">
            Выбрать группу
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {families.map(family => (
              <Dropdown.Item 
                key={family.id}
                onClick={() => handleFamilySelect(family.id)}
              >
                {family.name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-piggy-bank me-2"></i>Цели накопления</h1>
        <div>
          <Dropdown className="d-inline-block me-2">
            <Dropdown.Toggle variant="outline-primary" id="family-dropdown">
              <i className="fas fa-users me-1"></i>{selectedFamily?.name || 'Выбрать группу'}
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              {families.map(family => (
                <Dropdown.Item 
                  key={family.id}
                  onClick={() => handleFamilySelect(family.id)}
                >
                  {family.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Button 
            variant="primary" 
            onClick={openCreateModal}
          >
            <i className="fas fa-plus-circle me-2"></i>Создать цель
          </Button>
        </div>
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
      
      {savingsGoals.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <h3>Цели накопления не найдены</h3>
          <p>Создайте свою первую цель накопления, чтобы начать отслеживать свой прогресс</p>
          <Button
            variant="primary"
            className="mt-3"
            onClick={openCreateModal}
          >
            <i className="fas fa-plus-circle me-2"></i>Создать цель накопления
          </Button>
          </div>
        </div>
      ) : (
        <div className="row">
          {savingsGoals.map(goal => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            const daysRemaining = calculateDaysRemaining(goal.target_date);
            
            return (
              <div className="col-md-6 col-lg-4 mb-4" key={goal.id}>
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{goal.name}</h5>
                    <span className={`badge ${daysRemaining < 0 ? 'bg-danger' : daysRemaining < 30 ? 'bg-warning' : 'bg-success'}`}>
                      {daysRemaining < 0 ? 'Просрочено' : `${daysRemaining} дней осталось`}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Прогресс:</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <ProgressBar now={progress} />
                    </div>
                    <div className="mb-3">
                      <strong>Текущая сумма:</strong> {formatCurrency(goal.current_amount)}
                    </div>
                    <div className="mb-3">
                      <strong>Целевая сумма:</strong> {formatCurrency(goal.target_amount)}
                    </div>
                    <div className="mb-3">
                      <strong>Целевая дата:</strong> {new Date(goal.target_date).toLocaleDateString()}
                    </div>
                    {goal.description && (
                      <div className="mb-3">
                        <strong>Описание:</strong> {goal.description}
                      </div>
                    )}
                    <div className="d-flex gap-2">
                      <Button 
                        variant="success" 
                        className="flex-grow-1"
                        onClick={() => openContributeModal(goal.id)}
                      >
                        <i className="fas fa-plus-circle me-2"></i>Добавить вклад
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        onClick={() => openEditModal(goal)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => openDeleteModal(goal)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal show={showCreateModal} onHide={closeCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Создать новую цель накопления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleCreateGoal}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="goalName">Название</Form.Label>
              <Form.Control 
                type="text" 
                id="goalName" 
                name="name"
                value={newGoal.name}
                onChange={handleGoalInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="goalAmount">Целевая сумма</Form.Label>
              <InputGroup>
                <InputGroup.Text>₽</InputGroup.Text>
                <Form.Control 
                  type="number" 
                  id="goalAmount" 
                  name="target_amount"
                  value={newGoal.target_amount}
                  onChange={handleGoalInputChange}
                  min="0.01" 
                  step="0.01"
                  required
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="goalDate">Целевая дата</Form.Label>
              <Form.Control 
                type="date" 
                id="goalDate" 
                name="target_date"
                value={newGoal.target_date}
                onChange={handleGoalInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="goalDescription">Описание</Form.Label>
              <Form.Control 
                as="textarea" 
                id="goalDescription" 
                name="description"
                rows={3}
                value={newGoal.description}
                onChange={handleGoalInputChange}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={closeCreateModal}
              >
                Отмена
              </Button>
              <Button variant="primary" type="submit">Создать</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal show={showEditModal} onHide={closeEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Редактировать цель накопления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleEditGoal}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="editGoalName">Название</Form.Label>
              <Form.Control 
                type="text" 
                id="editGoalName" 
                name="name"
                value={editGoal.name}
                onChange={handleEditGoalInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="editGoalAmount">Целевая сумма</Form.Label>
              <InputGroup>
                <InputGroup.Text>₽</InputGroup.Text>
                <Form.Control 
                  type="number" 
                  id="editGoalAmount" 
                  name="target_amount"
                  value={editGoal.target_amount}
                  onChange={handleEditGoalInputChange}
                  min="0.01" 
                  step="0.01"
                  required
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="editGoalDate">Целевая дата</Form.Label>
              <Form.Control 
                type="date" 
                id="editGoalDate" 
                name="target_date"
                value={editGoal.target_date}
                onChange={handleEditGoalInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="editGoalDescription">Описание</Form.Label>
              <Form.Control 
                as="textarea" 
                id="editGoalDescription" 
                name="description"
                rows={3}
                value={editGoal.description}
                onChange={handleEditGoalInputChange}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={closeEditModal}
              >
                Отмена
              </Button>
              <Button variant="primary" type="submit">Сохранить</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Contribute Modal */}
      <Modal show={showContributeModal} onHide={closeContributeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Внести вклад</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleContribute}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="contributionAmount">Сумма</Form.Label>
              <InputGroup>
                <InputGroup.Text>₽</InputGroup.Text>
                <Form.Control 
                  type="number" 
                  id="contributionAmount" 
                  name="amount"
                  value={contribution.amount}
                  onChange={handleContributionInputChange}
                  min="0.01" 
                  step="0.01"
                  required
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="contributionDate">Дата</Form.Label>
              <Form.Control 
                type="date" 
                id="contributionDate" 
                name="date"
                value={contribution.date}
                onChange={handleContributionInputChange}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={closeContributeModal}
              >
                Отмена
              </Button>
              <Button variant="primary" type="submit">Внести</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={closeDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Удалить цель накопления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Вы уверены, что хотите удалить цель накопления "{goalToDelete?.name}"?</p>
          <p className="text-danger">Это действие нельзя отменить. Все вклады, связанные с этой целью, также будут удалены.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDeleteGoal}>
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SavingsGoals; 