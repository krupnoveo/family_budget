import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка токена и получение данных пользователя при загрузке
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/users/profile/');
          setCurrentUser(response.data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // Функция для входа в систему
  const login = async (email, password) => {
    try {
      const response = await api.post('/users/token/', { email, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      
      // Получение профиля пользователя
      const userResponse = await api.get('/users/profile/');
      setCurrentUser(userResponse.data);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Invalid credentials' 
      };
    }
  };

  // Функция для регистрации
  const register = async (userData) => {
    try {
      await api.post('/users/register/', userData);
      
      // После успешной регистрации входим в систему
      return await login(userData.email, userData.password);
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.email?.[0] || 
                          error.response?.data?.password?.[0] || 
                          error.response?.data?.non_field_errors?.[0] || 
                          'Registration failed';
      
      return { success: false, message: errorMessage };
    }
  };

  // Функция для выхода из системы
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('selectedFamilyId');
    setToken(null);
    setCurrentUser(null);
  };

  // Функция для обновления токена
  const refreshToken = async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) return false;

    try {
      const response = await api.post('/users/token/refresh/', { refresh });
      const { access } = response.data;
      
      localStorage.setItem('token', access);
      setToken(access);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  // Функция для обновления данных пользователя
  const updateUser = (userData) => {
    setCurrentUser(userData);
  };

  const value = {
    currentUser,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 