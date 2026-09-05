import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useTheme } from './ThemeContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tally_token'));
  const [loading, setLoading] = useState(true);
  const { syncUserTheme } = useTheme();

  const loadCurrentUser = async () => {
    try {
      if (token) {
        const data = await authService.getUser();
        setUser(data.user);
        if (data.user && data.user.theme) {
          syncUserTheme(data.user.theme);
        }
      }
    } catch (err) {
      console.error('Error memuat user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('tally_token', data.access_token);
    if (data.user && data.user.theme) {
      syncUserTheme(data.user.theme);
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('tally_token', data.access_token);
    if (data.user && data.user.theme) {
      syncUserTheme(data.user.theme);
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tally_token');
    localStorage.removeItem('tally_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser: loadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
