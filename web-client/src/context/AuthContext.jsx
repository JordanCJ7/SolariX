import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('solarix_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('solarix_token') || null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const response = await authApi.login(identifier, password);
      const userData = {
        nic: response.nic,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
        status: response.status,
      };

      setUser(userData);
      setToken(response.token);

      localStorage.setItem('solarix_token', response.token);
      localStorage.setItem('solarix_user', JSON.stringify(userData));

      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('solarix_token');
    localStorage.removeItem('solarix_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isBackoffice: user?.role === 'Backoffice',
    isGridOperator: user?.role === 'GridOperator',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
