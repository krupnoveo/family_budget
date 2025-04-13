import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import { Modal, Button, Form } from 'react-bootstrap';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BudgetDetail = () => {
  const { budgetId } = useParams();
  const navigate = useNavigate();
  
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editBudget, setEditBudget] = useState({
    name: '',
    amount: '',
    description: '',
    budget_type: '',
    family_id: '',
    period: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    const fetchBudgetDetails = async () => {
      try {
        const budgetResponse = await api.get(`/budgets/${budgetId}/`);
        setBudget(budgetResponse.data);
        setEditBudget({
          name: budgetResponse.data.name,
          amount: budgetResponse.data.amount,
          description: budgetResponse.data.description || '',
          budget_type: budgetResponse.data.budget_type,
          family_id: budgetResponse.data.family.id,
          period: budgetResponse.data.period,
          start_date: budgetResponse.data.start_date,
          end_date: budgetResponse.data.end_date
        });
        
        const transactionsResponse = await api.get(`/budgets/transactions/?budget_id=${budgetId}`);
        setTransactions(transactionsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching budget details:', error);
        setError('Не удалось загрузить детали бюджета. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchBudgetDetails();
  }, [budgetId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditBudget(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    
    if (!editBudget.name.trim() || !editBudget.amount) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      const response = await api.put(`/budgets/${budgetId}/`, {
        name: editBudget.name,
        amount: parseFloat(editBudget.amount),
        description: editBudget.description,
        budget_type: editBudget.budget_type,
        family_id: editBudget.family_id,
        period: editBudget.period,
        start_date: editBudget.start_date,
        end_date: editBudget.end_date
      });
      
      setBudget(response.data);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('Не удалось обновить бюджет. Пожалуйста, попробуйте снова.');
    }
  };

  const handleDeleteBudget = async () => {
    try {
      await api.delete(`/budgets/${budgetId}/`);
      navigate('/budgets');
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Не удалось удалить бюджет. Пожалуйста, попробуйте снова.');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загружается...</span>
        </div>
        <p className="mt-2">Загружаются детали бюджета...</p>
      </div>
    );
  }

  if (error && !budget) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="alert alert-warning" role="alert">
        Бюджет не найден. <Link to="/budgets">Вернуться к бюджетам</Link>
      </div>
    );
  }

  // Chart data
  const chartData = {
    labels: ['Budget', 'Spent'],
    datasets: [
      {
        label: 'Amount',
        data: [budget.amount, budget.spent_amount],
        backgroundColor: [
          budget.budget_type === 'income' ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)',
          budget.budget_type === 'income' ? 'rgba(40, 167, 69, 0.9)' : 'rgba(220, 53, 69, 0.9)'
        ],
        borderColor: [
          budget.budget_type === 'income' ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)',
          budget.budget_type === 'income' ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₽' + value.toLocaleString();
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ₽' + context.raw.toLocaleString();
          }
        }
      }
    }
  };

  // Calculate budget usage percentage
  const usagePercentage = Math.min(100, (budget.spent_amount / budget.amount) * 100);
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className={`fas fa-${budget.budget_type === 'income' ? 'arrow-circle-down' : 'arrow-circle-up'} me-2 text-${budget.budget_type === 'income' ? 'success' : 'danger'}`}></i>
          {budget.name}
        </h1>
        <div className="btn-group">
          <button 
            className="btn btn-outline-primary" 
            onClick={() => setShowEditModal(true)}
          >
            <i className="fas fa-edit me-2"></i>Редактировать бюджет
          </button>
          <button 
            className="btn btn-outline-danger" 
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="fas fa-trash-alt me-2"></i>Удалить бюджет
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Детали бюджета</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Тип:</strong> <span className={`badge bg-${budget.budget_type === 'income' ? 'success' : 'danger'}`}>{budget.budget_type === 'income' ? 'Доход' : 'Расход'}</span></p>
                  <p><strong>Сумма:</strong> {formatCurrency(budget.amount)}</p>
                  <p><strong>Потрачено:</strong> {formatCurrency(budget.spent_amount)}</p>
                  <p><strong>Остаток:</strong> {formatCurrency(budget.amount - budget.spent_amount)}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Семья:</strong> {budget.family.name}</p>
                  <p><strong>Создано:</strong> {budget.created_by.first_name} {budget.created_by.last_name}</p>
                  <p><strong>Создано:</strong> {formatDate(budget.created_at)}</p>
                  <p><strong>Описание:</strong> {budget.description || 'Без описания'}</p>
                </div>
              </div>
            </div>
          </div>
        
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Транзакции</h5>
              <Link to={`/transactions?budget=${budgetId}`} className="btn btn-sm btn-light">
                Показать все
              </Link>
            </div>
            <div className="card-body">
              {transactions.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
                  <h5>Нет транзакций</h5>
                  <p>Еще нет транзакций для этого бюджета.</p>
                  <Link to="/transactions" className="btn btn-primary">
                    <i className="fas fa-plus-circle me-2"></i>Добавить транзакцию
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Описание</th>
                        <th>Категория</th>
                        <th className="text-end">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map(transaction => (
                        <tr key={transaction.id}>
                          <td>{formatDate(transaction.date)}</td>
                          <td>{transaction.description}</td>
                          <td>
                            <span className={`badge bg-${budget.budget_type === 'income' ? 'success' : 'danger'}`}>
                              {budget.budget_type === 'income' ? 'Доход' : 'Расход'}
                            </span>
                          </td>
                          <td className={`text-end fw-bold text-${budget.budget_type === 'income' ? 'success' : 'danger'}`}>
                            {budget.budget_type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length > 5 && (
                    <div className="text-center mt-3">
                      <Link to={`/transactions?budget=${budgetId}`} className="btn btn-outline-primary">
                        Показать все {transactions.length} транзакций
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Использование бюджета</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '200px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <div className="mt-4">
                <h6>Использование: {Math.round(usagePercentage)}%</h6>
                <div className="progress">
                  <div 
                    className={`progress-bar bg-${budget.budget_type === 'income' ? 'success' : 'danger'}`} 
                    role="progressbar" 
                    style={{ width: `${usagePercentage}%` }} 
                    aria-valuenow={usagePercentage} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {Math.round(usagePercentage)}%
                  </div>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <small>0%</small>
                  <small>100%</small>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Быстрые действия</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/transactions" className="btn btn-primary">
                  <i className="fas fa-plus-circle me-2"></i>Добавить транзакцию
                </Link>
                <Link to={`/budgets?family=${budget.family.id}`} className="btn btn-outline-primary">
                  <i className="fas fa-list me-2"></i>Показать все бюджеты
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Редактировать бюджет</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Form onSubmit={handleUpdateBudget}>
            <Form.Group className="mb-3">
              <Form.Label>Название бюджета</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={editBudget.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Сумма</Form.Label>
              <div className="input-group">
                <span className="input-group-text">₽</span>
                <Form.Control 
                  type="number" 
                  name="amount"
                  value={editBudget.amount}
                  onChange={handleInputChange}
                  min="0.01" 
                  step="0.01"
                  required
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание (Необязательно)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="description"
                value={editBudget.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Тип бюджета</Form.Label>
              <Form.Select 
                name="budget_type"
                value={editBudget.budget_type}
                onChange={handleInputChange}
                required
              >
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Период</Form.Label>
              <Form.Select 
                name="period"
                value={editBudget.period}
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
                value={editBudget.start_date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Дата окончания</Form.Label>
              <Form.Control 
                type="date" 
                name="end_date"
                value={editBudget.end_date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Отменить
              </Button>
              <Button variant="primary" type="submit">
                Обновить бюджет
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Budget Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Удалить бюджет</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Вы уверены, что хотите удалить этот бюджет?</p>
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Это действие не может быть отменено. Все транзакции, связанные с этим бюджетом, останутся, но больше не будут связаны с этим бюджетом.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Отменить
          </Button>
          <Button variant="danger" onClick={handleDeleteBudget}>
            Удалить бюджет
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BudgetDetail; 