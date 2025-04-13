import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';

const TransactionList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const familyIdFromQuery = queryParams.get('family');
  const budgetIdFromQuery = queryParams.get('budget');
  
  const [selectedFamilyId, setSelectedFamilyId] = useState(
    familyIdFromQuery || localStorage.getItem('selectedFamilyId') || null
  );
  const [selectedBudgetId, setSelectedBudgetId] = useState(
    budgetIdFromQuery || localStorage.getItem('selectedBudgetId') || null
  );
  const [families, setFamilies] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    budget_id: selectedBudgetId || '',
    transaction_type: 'expense'
  });
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'income', 'expense'
  
  // Refs for modal
  const createModalRef = useRef(null);
  const createModalInstance = useRef(null);

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
  }, []);

  // Load budgets when family is selected
  useEffect(() => {
    const fetchBudgets = async () => {
      if (!selectedFamilyId) return;
      
      try {
        const response = await api.get(`/budgets/?family=${selectedFamilyId}`);
        setBudgets(response.data);
        
        // If budgetId from query exists in the list of budgets, select it
        if (selectedBudgetId) {
          const budgetExists = response.data.some(budget => budget.id === parseInt(selectedBudgetId));
          if (!budgetExists) {
            setSelectedBudgetId(null);
          }
        }
      } catch (error) {
        console.error('Error fetching budgets:', error);
        setError('Не удалось загрузить бюджеты. Пожалуйста, попробуйте позже.');
      }
    };

    fetchBudgets();
  }, [selectedFamilyId]);

  // Load transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedFamilyId) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        let url = `/budgets/transactions/?family=${selectedFamilyId}`;
        if (selectedBudgetId) {
          url += `&budget=${selectedBudgetId}`;
        }
        
        const response = await api.get(url);
        setTransactions(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Не удалось загрузить транзакции. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedFamilyId, selectedBudgetId]);

  // Initialize modal
  useEffect(() => {
    const modalElement = document.getElementById('createTransactionModal');
    if (modalElement) {
      createModalInstance.current = new Modal(modalElement);
    }
    
    // Cleanup function
    return () => {
      if (createModalInstance.current) {
        createModalInstance.current.dispose();
      }
    };
  }, []);

  // Handle family selection
  const handleFamilySelect = (familyId) => {
    setSelectedFamilyId(familyId);
    setSelectedBudgetId(null);
    localStorage.setItem('selectedFamilyId', familyId);
    
    // Update URL without the budgetId parameter
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('budgetId');
    window.history.pushState({}, '', newUrl);
  };

  // Handle budget selection
  const handleBudgetSelect = (budgetId) => {
    setSelectedBudgetId(budgetId === 'all' ? null : budgetId);
    
    // Update URL with the budgetId parameter
    const newUrl = new URL(window.location);
    if (budgetId === 'all') {
      newUrl.searchParams.delete('budgetId');
    } else {
      newUrl.searchParams.set('budgetId', budgetId);
    }
    window.history.pushState({}, '', newUrl);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openCreateModal = () => {
    setError(null);
    setNewTransaction({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      budget_id: selectedBudgetId || '',
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError(null);
  };

  const handleCreateTransaction = async () => {
    // Validate required fields
    if (!newTransaction.budget_id || !newTransaction.amount || !newTransaction.date) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      const response = await api.post('/budgets/transactions/', {
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        date: newTransaction.date,
        budget_id: newTransaction.budget_id
      });

      // Add the new transaction to the list
      setTransactions([response.data, ...transactions]);
      
      // Close the modal
      closeCreateModal();
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError('Не удалось создать транзакцию. Пожалуйста, попробуйте позже.');
    }
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
      try {
        await api.delete(`/budgets/transactions/${transactionId}/`);
        setTransactions(transactions.filter(t => t.id !== transactionId));
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError('Не удалось удалить транзакцию. Пожалуйста, попробуйте позже.');
      }
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (activeFilter === 'all') return true;
    return transaction.budget && transaction.budget.budget_type === activeFilter;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка транзакций...</p>
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
          <h3>Группа не выбрана</h3>
          <p className="lead">Пожалуйста, выберите группу для просмотра транзакций.</p>
          <div className="dropdown">
            <button className="btn btn-primary dropdown-toggle" type="button" id="familyDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              Выбрать группу
            </button>
            <ul className="dropdown-menu" aria-labelledby="familyDropdown">
              {families.map(family => (
                <li key={family.id}>
                  <button 
                    className="dropdown-item" 
                    onClick={() => handleFamilySelect(family.id)}
                  >
                    {family.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Selected family
  const selectedFamily = families.find(family => family.id === parseInt(selectedFamilyId));
  
  // Selected budget
  const selectedBudget = selectedBudgetId ? 
    budgets.find(budget => budget.id === parseInt(selectedBudgetId)) : null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-exchange-alt me-2"></i>Транзакции</h1>
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
          <Dropdown className="d-inline-block me-2">
            {/* <Dropdown.Toggle variant="outline-primary" id="dropdown-budget">
              <i className="fas fa-money-bill-wave me-1"></i>{selectedBudget?.name || 'Все бюджеты'}
            </Dropdown.Toggle> */}
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => handleBudgetSelect('all')}>
                Все бюджеты
              </Dropdown.Item>
              {budgets.map(budget => (
                <Dropdown.Item 
                  key={budget.id}
                  onClick={() => handleBudgetSelect(budget.id.toString())}
                >
                  {budget.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Button 
            variant="primary" 
            onClick={openCreateModal}
            disabled={!selectedFamilyId}
          >
            <i className="fas fa-plus-circle me-2"></i>Добавить транзакцию
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Фильтр транзакций</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Тип транзакции</label>
                  <div className="btn-group w-100" role="group">
                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="transactionType" 
                      id="all" 
                      checked={activeFilter === 'all'} 
                      onChange={() => setActiveFilter('all')}
                    />
                    <label className="btn btn-outline-primary" htmlFor="all">Все</label>
                    
                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="transactionType" 
                      id="income" 
                      checked={activeFilter === 'income'} 
                      onChange={() => setActiveFilter('income')}
                    />
                    <label className="btn btn-outline-success" htmlFor="income">Доходы</label>
                    
                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="transactionType" 
                      id="expense" 
                      checked={activeFilter === 'expense'} 
                      onChange={() => setActiveFilter('expense')}
                    />
                    <label className="btn btn-outline-danger" htmlFor="expense">Расходы</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Бюджет</label>
                  <select 
                    className="form-select" 
                    value={selectedBudgetId || 'all'} 
                    onChange={(e) => handleBudgetSelect(e.target.value)}
                  >
                    <option value="all">Все бюджеты</option>
                    {budgets.map(budget => (
                      <option key={budget.id} value={budget.id}>
                        {budget.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Сводка по транзакциям</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  <h6 className="text-success">Общий доход</h6>
                  <h4 className="text-success">
                    {formatCurrency(
                      transactions
                        .filter(t => t.budget && t.budget.budget_type === 'income')
                        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                    )}
                  </h4>
                </div>
                <div className="col-md-4 text-center">
                  <h6 className="text-danger">Общие расходы</h6>
                  <h4 className="text-danger">
                    {formatCurrency(
                      transactions
                        .filter(t => t.budget && t.budget.budget_type === 'expense')
                        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                    )}
                  </h4>
                </div>
                <div className="col-md-4 text-center">
                  <h6 className="text-primary">Баланс</h6>
                  <h4 className="text-primary">
                    {formatCurrency(
                      transactions
                        .filter(t => t.budget && t.budget.budget_type === 'income')
                        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) -
                      transactions
                        .filter(t => t.budget && t.budget.budget_type === 'expense')
                        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                    )}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {selectedBudget ? `Транзакции для бюджета "${selectedBudget.name}"` : 'Все транзакции'}
          </h5>
          <span className="badge bg-light text-dark">{filteredTransactions.length} транзакций</span>
        </div>
        <div className="card-body">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
              <h5>Транзакции не найдены</h5>
              <p>У вас еще нет транзакций. Добавьте одну, чтобы начать.</p>
              <button 
                className="btn btn-primary" 
                onClick={openCreateModal}
              >
                <i className="fas fa-plus-circle me-2"></i>Добавить транзакцию
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Дата</th>
                    <th>Описание</th>
                    <th>Сумма</th>
                    <th>Бюджет</th>
                    <th>Тип</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'Нет даты'}</td>
                      <td>{transaction.description || 'Нет описания'}</td>
                      <td className={transaction.budget && transaction.budget.budget_type === 'income' ? 'text-success' : 'text-danger'}>
                        {formatCurrency(parseFloat(transaction.amount) || 0)}
                      </td>
                      <td>{transaction.budget ? transaction.budget.name : 'Нет бюджета'}</td>
                      <td>
                        <span className={`badge ${transaction.budget && transaction.budget.budget_type === 'income' ? 'bg-success' : 'bg-danger'}`}>
                          {transaction.budget && transaction.budget.budget_type === 'income' ? 'Доход' : 'Расход'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card-footer">
          <button 
            className="btn btn-primary" 
            onClick={openCreateModal}
          >
            <i className="fas fa-plus-circle me-2"></i>Добавить транзакцию
          </button>
        </div>
      </div>

      {/* Create Transaction Modal */}
      <Modal show={showCreateModal} onHide={closeCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить новую транзакцию</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Бюджет</Form.Label>
              <Form.Select 
                value={newTransaction.budget_id} 
                onChange={(e) => setNewTransaction({...newTransaction, budget_id: e.target.value})}
              >
                <option value="">Выберите бюджет</option>
                {budgets.map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name} ({budget.budget_type === 'income' ? 'Доход' : 'Расход'})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Сумма</Form.Label>
              <Form.Control 
                type="number" 
                placeholder="Введите сумму" 
                value={newTransaction.amount} 
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Введите описание (необязательно)" 
                value={newTransaction.description} 
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Дата</Form.Label>
              <Form.Control 
                type="date" 
                value={newTransaction.date} 
                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
              />
            </Form.Group>
          </Form>
          {error && <div className="alert alert-danger">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCreateModal}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleCreateTransaction}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TransactionList; 