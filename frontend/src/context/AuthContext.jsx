import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, extractApiError, setAuthToken } from '../lib/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  const applyAccessToken = (nextToken) => {
    setToken(nextToken);
    setAuthToken(nextToken);
  };

  const clearSession = () => {
    setUser(null);
    applyAccessToken('');
  };

  const fetchCurrentUser = async () => {
    const meResponse = await api.get('/api/auth/me');
    return meResponse.data?.data || null;
  };

  const bootstrapFromRefreshCookie = async () => {
    const refreshResponse = await api.post('/api/auth/refresh');
    const accessToken = refreshResponse.data?.data?.access_token;
    if (!accessToken) {
      throw new Error('Missing access token');
    }
    applyAccessToken(accessToken);
    const freshUser = await fetchCurrentUser();
    setUser(freshUser);
    return freshUser;
  };

  const login = async ({ email, password }) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const payload = response.data?.data;
      applyAccessToken(payload.access_token);
      setUser(payload.user);
      return payload.user;
    } catch (error) {
      throw new Error(extractApiError(error, 'Login failed'));
    }
  };

  const register = async ({ email, password, full_name }) => {
    try {
      const response = await api.post('/api/auth/register', { email, password, full_name });
      const payload = response.data?.data;
      applyAccessToken(payload.access_token);
      setUser(payload.user);
      return payload.user;
    } catch (error) {
      throw new Error(extractApiError(error, 'Registration failed'));
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore logout failures and clear client session anyway.
    } finally {
      clearSession();
    }
  };

  const logoutAll = async () => {
    try {
      if (token) {
        await api.post('/api/auth/logout-all');
      }
    } catch {
      // Ignore logout failures and clear client session anyway.
    } finally {
      clearSession();
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        await bootstrapFromRefreshCookie();
      } catch {
        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    bootstrapAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: Boolean(user?.is_admin),
      login,
      register,
      logout,
      logoutAll,
      bootstrapFromRefreshCookie,
      refreshUser: async () => {
        const freshUser = await fetchCurrentUser();
        setUser(freshUser);
        return freshUser;
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
