import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { UserProfile, TokenResponse, RegisterPayload } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (tc_no: string, password: string) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  switchDemoUser: (tc_no: string, password: string) => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get<UserProfile>('/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }

    const handleAutoLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth_logout', handleAutoLogout);
    return () => window.removeEventListener('auth_logout', handleAutoLogout);
  }, [token]);

  const login = async (tc_no: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<TokenResponse>('/auth/login', {
        tc_no,
        password,
      });

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setToken(access_token);

      const profileRes = await apiClient.get<UserProfile>('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setUser(profileRes.data);
      return profileRes.data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<TokenResponse>('/auth/register', payload);
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setToken(access_token);

      const profileRes = await apiClient.get<UserProfile>('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setUser(profileRes.data);
      return profileRes.data;
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoUser = async (tc_no: string, password: string) => {

    await login(tc_no, password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        switchDemoUser,
      }}
    >

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
