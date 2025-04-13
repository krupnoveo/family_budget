import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FamilyList from './pages/FamilyList';
import FamilyDetail from './pages/FamilyDetail';
import BudgetList from './pages/BudgetList';
import BudgetDetail from './pages/BudgetDetail';
import TransactionList from './pages/TransactionList';
import SavingsGoals from './pages/SavingsGoals';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';

function App() {
  // Initialize Bootstrap components
  useEffect(() => {
    // This ensures Bootstrap's JavaScript runs after the DOM is fully loaded
    const initBootstrap = () => {
      // Make sure Bootstrap is loaded
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Force re-initialization of all dropdowns, tooltips, etc.
        const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
        if (dropdownElementList.length > 0) {
          console.log('Initializing dropdowns:', dropdownElementList.length);
        }
      }
    };

    // Run initialization
    initBootstrap();

    // Add event listener for DOM changes
    const observer = new MutationObserver(initBootstrap);
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes with MainLayout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
          </Route>

          {/* Auth routes with AuthLayout */}
          <Route path="/" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Protected routes with MainLayout */}
          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="families" element={<FamilyList />} />
            <Route path="families/:familyId" element={<FamilyDetail />} />
            <Route path="budgets" element={<BudgetList />} />
            <Route path="budgets/:budgetId" element={<BudgetDetail />} />
            <Route path="transactions" element={<TransactionList />} />
            <Route path="savings-goals" element={<SavingsGoals />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
