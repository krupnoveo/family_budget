import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';

const BudgetList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const familyIdFromQuery = queryParams.get('family');
  
  const [selectedFamilyId, setSelectedFamilyId] = useState(
    familyIdFromQuery || localStorage.getItem('selectedFamilyId') || null
  );
  const [families, setFamilies] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBudget, setNewBudget] = useState({
    name: '',
    budget_type: 'expense',
    amount: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
    spent_amount: 0,
    family_id: selectedFamilyId || ''
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'income', 'expense'
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        setError('Не удалось загрузить семьи. Пожалуйста, попробуйте позже.');
      }
    };

    fetchFamilies();
  }, [selectedFamilyId]);

  // Load budgets when family is selected
  useEffect(() => {
    if (selectedFamilyId) {
      const fetchBudgets = async () => {
        try {
          const response = await api.get(`/budgets/?family=${selectedFamilyId}`);
          setBudgets(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching budgets:', error);
          setError('Не удалось загрузить бюджеты. Пожалуйста, попробуйте позже.');
          setLoading(false);
        }
      };

      fetchBudgets();
    } else {
      setLoading(false);
    }
  }, [selectedFamilyId]);

  // Handle family selection
  const handleFamilySelect = (familyId) => {
    setSelectedFamilyId(familyId);
    localStorage.setItem('selectedFamilyId', familyId);
    // Обновляем семью в форме создания бюджета
    setNewBudget(prev => ({
      ...prev,
      family_id: familyId
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBudget(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle budget creation
  const handleCreateBudget = async (e) => {
    e.preventDefault();
    
    if (!newBudget.name.trim() || !newBudget.amount || !newBudget.period || !newBudget.start_date || !newBudget.family_id) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      let response = await api.post(`/budgets/`, {
        name: newBudget.name,
        budget_type: newBudget.budget_type,
        amount: parseFloat(newBudget.amount),
        period: newBudget.period,
        start_date: newBudget.start_date,
        end_date: newBudget.end_date || calculateEndDate(newBudget.start_date, newBudget.period),
        description: newBudget.description,
        spent_amount: 0,
        family_id: parseInt(newBudget.family_id)
      });
      setBudgets([...budgets, response.data]);
      closeCreateModal();
    } catch (error) {
      console.error('Error creating budget:', error);
      setError('Не удалось создать бюджет. Пожалуйста, попробуйте позже.');
    }
  };

  // Функция для расчета даты окончания бюджета на основе периода
  const calculateEndDate = (startDate, period) => {
    const date = new Date(startDate);
    
    switch(period) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // По умолчанию месяц
    }
    
    return date.toISOString().split('T')[0];
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  // Filter budgets based on active tab
  const filteredBudgets = budgets.filter(budget => {
    if (activeTab === 'all') return true;
    return budget.budget_type === activeTab;
  });

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewBudget({
      name: '',
      budget_type: 'expense',
      amount: '',
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      description: '',
      family_id: selectedFamilyId || ''
    });
    setError(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка бюджетов...</p>
      </div>
    );
  }

  // No families state
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

  // No selected family state
  if (!selectedFamilyId) {
    return (
      <div className="card text-center py-5">
        <div className="card-body">
          <i className="fas fa-users fa-4x text-muted mb-3"></i>
          <h3>Семья не выбрана</h3>
          <p className="lead">Пожалуйста, выберите семью для просмотра бюджетов.</p>
          <Dropdown>
            <Dropdown.Toggle variant="primary" id="dropdown-family">
              Выбрать семью
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
      </div>
    );
  }

  // Selected family
  const selectedFamily = families.find(family => family.id === parseInt(selectedFamilyId));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-money-bill-wave me-2"></i>Бюджеты</h1>
        <div>
          <Dropdown className="d-inline-block me-2">
            <Dropdown.Toggle variant="outline-primary" id="dropdown-family">
              <i className="fas fa-users me-1"></i>{selectedFamily?.name || 'Выбрать семью'}
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
            <i className="fas fa-plus-circle me-2"></i>Создать бюджет
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Budget Tabs */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Все бюджеты
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'income' ? 'active' : ''}`}
                onClick={() => setActiveTab('income')}
              >
                Доходы
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'expense' ? 'active' : ''}`}
                onClick={() => setActiveTab('expense')}
              >
                Расходы
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Budget List */}
      {filteredBudgets.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <i className="fas fa-money-bill-wave fa-4x text-muted mb-3"></i>
            <h3>Бюджеты не найдены</h3>
            <p className="lead">У вас еще нет бюджетов. Создайте один, чтобы начать.</p>
            <Button 
              variant="primary" 
              onClick={openCreateModal}
            >
              <i className="fas fa-plus-circle me-2"></i>Создать бюджет
            </Button>
          </div>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredBudgets.map(budget => (
            <div className="col" key={budget.id}>
              <div className={`card h-100 shadow-sm border-${budget.budget_type === 'income' ? 'success' : 'danger'}`}>
                <div className={`card-header bg-${budget.budget_type === 'income' ? 'success' : 'danger'} text-white`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{budget.name}</h5>
                    <span className="badge bg-light text-dark">
                      {budget.budget_type === 'income' ? 'Доход' : 'Расход'}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className={`text-${budget.budget_type === 'income' ? 'success' : 'danger'}`}>
                    {formatCurrency(budget.amount)}
                  </h3>
                  <p className="card-text">
                    <strong>Период:</strong> {budget.period === 'weekly' ? 'Неделя' : budget.period === 'monthly' ? 'Месяц' : 'Год'}
                  </p>
                  <p className="card-text">
                    <strong>Даты:</strong> {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </p>
                  <p className="card-text">
                    {budget.description || 'Нет описания'}
                  </p>
                  <div className="progress mb-3">
                    <div 
                      className={`progress-bar bg-${budget.budget_type === 'income' ? 'success' : 'danger'}`} 
                      role="progressbar" 
                      style={{ width: `${Math.min(100, (budget.spent_amount / budget.amount) * 100)}%` }} 
                      aria-valuenow={Math.min(100, (budget.spent_amount / budget.amount) * 100)} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    >
                      {Math.round((budget.spent_amount / budget.amount) * 100)}%
                    </div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small>Потрачено: {formatCurrency(budget.spent_amount)}</small>
                    <small>Осталось: {formatCurrency(budget.amount - budget.spent_amount)}</small>
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <Link to={`/budgets/${budget.id}`} className="btn btn-outline-primary w-100">
                    <i className="fas fa-eye me-2"></i>Подробнее
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal show={showCreateModal} onHide={closeCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Создать новый бюджет</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Form onSubmit={handleCreateBudget}>
            <Form.Group className="mb-3">
              <Form.Label>Название</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={newBudget.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Тип бюджета</Form.Label>
              <Form.Select 
                name="budget_type"
                value={newBudget.budget_type}
                onChange={handleInputChange}
                required
              >
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Сумма</Form.Label>
              <div className="input-group">
                <span className="input-group-text">₽</span>
                <Form.Control 
                  type="number" 
                  name="amount"
                  value={newBudget.amount}
                  onChange={handleInputChange}
                  min="0.01" 
                  step="0.01"
                  required
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Период</Form.Label>
              <Form.Select 
                name="period"
                value={newBudget.period}
                onChange={handleInputChange}
                required
              >
                <option value="weekly">Неделя</option>
                <option value="monthly">Месяц</option>
                <option value="yearly">Год</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Дата начала</Form.Label>
              <Form.Control 
                type="date" 
                name="start_date"
                value={newBudget.start_date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Дата окончания (опционально)</Form.Label>
              <Form.Control 
                type="date" 
                name="end_date"
                value={newBudget.end_date}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                Если не указано, будет рассчитано автоматически на основе периода
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="description"
                value={newBudget.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Семья</Form.Label>
              <Form.Select 
                name="family"
                value={newBudget.family}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите семью</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeCreateModal}>
                Отмена
              </Button>
              <Button variant="primary" type="submit">
                Создать
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BudgetList; 