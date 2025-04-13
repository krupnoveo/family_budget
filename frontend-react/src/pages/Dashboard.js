import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';

// Регистрируем компоненты Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [selectedFamilyId, setSelectedFamilyId] = useState(localStorage.getItem('selectedFamilyId') || null);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Загрузка списка семей
  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await api.get('/families/');
        setFamilies(response.data);
        
        // Если нет выбранной семьи, но есть семьи в списке, выбираем первую
        if (!selectedFamilyId && response.data.length > 0) {
          setSelectedFamilyId(response.data[0].id);
          localStorage.setItem('selectedFamilyId', response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching families:', error);
        setError('Failed to load families. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilies();
  }, [selectedFamilyId]);

  // Загрузка данных бюджета при выборе семьи
  useEffect(() => {
    if (selectedFamilyId) {
      const fetchBudgetData = async () => {
        try {
          const response = await api.get(`/budgets/families/${selectedFamilyId}/analytics/budget/`);
          setBudgetData(response.data);
        } catch (error) {
          console.error('Error fetching budget data:', error);
          setError('Не удалось загрузить данные бюджета. Пожалуйста, попробуйте позже.');
        }
      };

      const fetchTransactions = async () => {
        try {
          const response = await api.get(`/budgets/families/${selectedFamilyId}/transactions/`);
          setTransactions(response.data);
        } catch (error) {
          console.error('Error fetching transactions:', error);
          setError('Не удалось загрузить транзакции. Пожалуйста, попробуйте позже.');
        }
      };

      fetchBudgetData();
      fetchTransactions();
    }
  }, [selectedFamilyId]);

  // Обработчик выбора семьи
  const handleFamilySelect = (familyId) => {
    setSelectedFamilyId(familyId);
    localStorage.setItem('selectedFamilyId', familyId);
  };

  // Форматирование валюты
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Форматирование процентов
  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  // Если загрузка данных
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка данных дашборда...</p>
      </div>
    );
  }

  // Если ошибка
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  // Если нет семей
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

  // Если нет выбранной семьи
  if (!selectedFamilyId) {
    return (
      <div className="card text-center py-5">
        <div className="card-body">
          <i className="fas fa-users fa-4x text-muted mb-3"></i>
          <h3>Группа не выбрана</h3>
          <p className="lead">Пожалуйста, выберите группу для просмотра дашборда.</p>
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

  // Если нет данных бюджета
  if (!budgetData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка данных бюджета...</p>
      </div>
    );
  }

  // Данные для графика бюджета
  const chartData = {
    labels: ['Доходы', 'Расходы'],
    datasets: [
      {
        label: 'Бюджет',
        data: [
          budgetData.budget_utilization.income.budget_amount,
          budgetData.budget_utilization.expense.budget_amount
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Фактические',
        data: [
          budgetData.budget_utilization.income.transaction_amount,
          budgetData.budget_utilization.expense.transaction_amount
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
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
        display: true,
        position: 'bottom'
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

  // Расчет баланса
  const incomeAmount = budgetData.budget_utilization.income.transaction_amount;
  const expenseAmount = budgetData.budget_utilization.expense.transaction_amount;
  const balance = incomeAmount - expenseAmount;

  // Расчет общей суммы сбережений
  const savingsTotal = budgetData.savings_progress.reduce((total, goal) => total + goal.current_amount, 0);

  // Выбранная семья
  const selectedFamily = families.find(family => family.id === parseInt(selectedFamilyId));

  return (
    <div>
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="mb-4"><i className="fas fa-tachometer-alt me-2"></i>Дашборд</h1>
        </div>
        <div className="col-md-4 text-end">
          <div className="dropdown">
            <button className="btn btn-outline-primary dropdown-toggle" type="button" id="familyDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="fas fa-users me-1"></i>{selectedFamily?.name || 'Выбрать семью'}
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="familyDropdown">
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

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase">Общий доход</h6>
                  <h3 className="mb-0">{formatCurrency(incomeAmount)}</h3>
                </div>
                <i className="fas fa-arrow-circle-down fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-danger text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase">Общие расходы</h6>
                  <h3 className="mb-0">{formatCurrency(expenseAmount)}</h3>
                </div>
                <i className="fas fa-arrow-circle-up fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase">Баланс</h6>
                  <h3 className="mb-0">{formatCurrency(balance)}</h3>
                </div>
                <i className="fas fa-money-bill-wave fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase">Сбережения</h6>
                  <h3 className="mb-0">{formatCurrency(savingsTotal)}</h3>
                </div>
                <i className="fas fa-piggy-bank fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Chart and Savings Goals */}
      <div className="row mb-4">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fas fa-chart-pie me-2"></i>Использование бюджета</h5>
              <Link to="/budgets" className="btn btn-sm btn-outline-primary">
                <i className="fas fa-external-link-alt"></i>
              </Link>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <div className="mt-3">
                <div className="row">
                  <div className="col-6">
                    <div className="d-flex align-items-center mb-2">
                      <div className="me-2" style={{ width: '16px', height: '16px', backgroundColor: 'rgba(54, 162, 235, 0.5)', border: '1px solid rgba(54, 162, 235, 1)' }}></div>
                      <div>Бюджет доходов: {formatCurrency(budgetData.budget_utilization.income.budget_amount)}</div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="me-2" style={{ width: '16px', height: '16px', backgroundColor: 'rgba(255, 99, 132, 0.5)', border: '1px solid rgba(255, 99, 132, 1)' }}></div>
                      <div>Фактические доходы: {formatCurrency(budgetData.budget_utilization.income.transaction_amount)}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center mb-2">
                      <div className="me-2" style={{ width: '16px', height: '16px', backgroundColor: 'rgba(54, 162, 235, 0.5)', border: '1px solid rgba(54, 162, 235, 1)' }}></div>
                      <div>Бюджет расходов: {formatCurrency(budgetData.budget_utilization.expense.budget_amount)}</div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="me-2" style={{ width: '16px', height: '16px', backgroundColor: 'rgba(255, 99, 132, 0.5)', border: '1px solid rgba(255, 99, 132, 1)' }}></div>
                      <div>Фактические расходы: {formatCurrency(budgetData.budget_utilization.expense.transaction_amount)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fas fa-piggy-bank me-2"></i>Цели накопления</h5>
              <Link to="/savings-goals" className="btn btn-sm btn-outline-primary">
                <i className="fas fa-external-link-alt"></i>
              </Link>
            </div>
            <div className="card-body">
              {budgetData.savings_progress.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-piggy-bank fa-3x text-muted mb-3"></i>
                  <h5>Нет целей накопления</h5>
                  <p>Вы еще не создали цели накопления.</p>
                  <Link to="/savings-goals" className="btn btn-primary">
                    <i className="fas fa-plus-circle me-2"></i>Создать цель накопления
                  </Link>
                </div>
              ) : (
                budgetData.savings_progress.map(goal => {
                  const progressPercentage = Math.min(100, goal.progress_percentage);
                  const progressColor = progressPercentage < 30 ? 'danger' : 
                                       progressPercentage < 70 ? 'warning' : 'success';
                  
                  return (
                    <div className="mb-4" key={goal.id}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h6 className="mb-0">{goal.name}</h6>
                        <span className={`badge bg-${progressColor}`}>{formatPercentage(progressPercentage)}</span>
                      </div>
                      <div className="progress">
                        <div 
                          className={`progress-bar bg-${progressColor}`} 
                          role="progressbar" 
                          style={{ width: `${progressPercentage}%` }} 
                          aria-valuenow={progressPercentage} 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small>{formatCurrency(goal.current_amount)}</small>
                        <small>{formatCurrency(goal.target_amount)}</small>
                      </div>
                      <small className="text-muted">Целевая дата: {formatDate(goal.target_date)}</small>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fas fa-exchange-alt me-2"></i>Последние транзакции</h5>
              <Link to="/transactions" className="btn btn-sm btn-outline-primary">
                Показать все
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Описание</th>
                      <th>Тип</th>
                      <th>Бюджет</th>
                      <th className="text-end">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
                          <h5>Нет транзакций</h5>
                          <p>Вы еще не записали ни одной транзакции.</p>
                          <Link to="/transactions" className="btn btn-primary">
                            <i className="fas fa-plus-circle me-2"></i>Добавить транзакцию
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      transactions.map(transaction => {
                        const amountClass = transaction.budget.budget_type === 'income' ? 'text-success' : 'text-danger';
                        const amountPrefix = transaction.budget.budget_type === 'income' ? '+' : '-';
                        
                        return (
                          <tr key={transaction.id}>
                            <td>{formatDate(transaction.date)}</td>
                            <td>{transaction.description}</td>
                            <td>
                              <span className={`badge bg-${transaction.budget.budget_type === 'income' ? 'success' : 'danger'}`}>
                                  {transaction.budget.budget_type === 'income' ? 'Доход' : 'Расход'}
                              </span>
                            </td>
                            <td>{transaction.budget.name}</td>
                            <td className={`text-end ${amountClass} fw-bold`}>
                              {amountPrefix}{formatCurrency(transaction.amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 