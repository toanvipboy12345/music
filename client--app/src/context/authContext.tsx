/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'user' | 'admin' | null;
  userId: number | null;
  token: string | null;
  login: (credentials: LoginCredentials, onSuccess?: (role: 'user' | 'admin') => void) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Khôi phục trạng thái từ localStorage khi khởi động
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role') as 'user' | 'admin' | null;
    const savedUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId') || '0') : null;
    const savedRefreshToken = localStorage.getItem('refreshToken');
    console.log('Khôi phục trạng thái từ localStorage:', { savedToken, savedRole, savedUserId, savedRefreshToken });
    if (savedToken && savedRole && savedUserId) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
      setUserId(savedUserId);
      setToken(savedToken);
      api.defaults.headers.Authorization = `Bearer ${savedToken}`;
      checkAuth();
    }
  }, []);

  // Kiểm tra trạng thái đăng nhập
  const checkAuth = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      console.log('checkAuth: Token từ localStorage:', currentToken, 'Refresh token:', refreshToken);
      if (!currentToken) {
        console.log('checkAuth: Không có token, đặt trạng thái về mặc định');
        setIsAuthenticated(false);
        setUserRole(null);
        setUserId(null);
        setToken(null);
        delete api.defaults.headers.Authorization;
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('refreshToken');
        return;
      }

      api.defaults.headers.Authorization = `Bearer ${currentToken}`;
      console.log('checkAuth: Gửi yêu cầu tới /auth/check với header:', api.defaults.headers.Authorization);
      const response = await api.get('/auth/check');
      console.log('checkAuth: Phản hồi từ /auth/check:', response.data);
      if (response.data.message === 'Đã đăng nhập' && response.data.user && response.data.user.id) {
        setIsAuthenticated(true);
        setUserRole(response.data.user.role as 'user' | 'admin');
        setUserId(response.data.user.id as number);
        setToken(currentToken);
        localStorage.setItem('userId', response.data.user.id.toString());
      } else {
        throw new Error('Invalid response from /auth/check');
      }
    } catch (error: any) {
      console.error('checkAuth: Lỗi khi gọi /auth/check:', error.response?.data || error.message);
      // Thử làm mới token nếu có refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (error.response?.status === 401 && refreshToken) {
        console.log('checkAuth: Token không hợp lệ, thử làm mới token');
        try {
          const refreshResponse = await api.post('/auth/refresh', { refreshToken });
          console.log('checkAuth: Phản hồi từ /auth/refresh:', refreshResponse.data);
          const newToken = refreshResponse.data.token;
          const newUserId = refreshResponse.data.user?.id;
          const newRole = refreshResponse.data.role;
          if (newToken && newUserId && newRole) {
            localStorage.setItem('token', newToken);
            localStorage.setItem('userId', newUserId.toString());
            localStorage.setItem('role', newRole);
            setToken(newToken);
            setUserId(newUserId);
            setUserRole(newRole as 'user' | 'admin');
            setIsAuthenticated(true);
            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            console.log('checkAuth: Làm mới token thành công:', { newToken, newUserId, newRole });
            return; // Thoát sau khi làm mới thành công
          } else {
            throw new Error('Invalid refresh response');
          }
        } catch (refreshError: any) {
          console.error('checkAuth: Lỗi khi làm mới token:', refreshError.response?.data || refreshError.message);
        }
      }
      // Nếu làm mới token thất bại hoặc không có refresh token, xóa trạng thái
      setIsAuthenticated(false);
      setUserRole(null);
      setUserId(null);
      setToken(null);
      delete api.defaults.headers.Authorization;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('refreshToken');
    }
  };

  // Đăng ký
  const register = async (credentials: RegisterCredentials) => {
    try {
      console.log('Gọi register với credentials:', credentials);
      const response = await api.post<AuthResponse>('/auth/register', credentials);
      console.log('Phản hồi từ /auth/register:', response.data);
      if (response.data.message !== 'Đăng ký thành công') {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Lỗi khi đăng ký:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Lỗi server' };
    }
  };

  // Đăng nhập
  const login = async (credentials: LoginCredentials, onSuccess?: (role: 'user' | 'admin') => void) => {
    try {
      console.log('Gọi login với credentials:', credentials);
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      console.log('Phản hồi từ /auth/login:', response.data);
      if (response.data.message === 'Đăng nhập thành công' && response.data.token && response.data.role && response.data.user && response.data.user.id) {
        setIsAuthenticated(true);
        setUserRole(response.data.role as 'user' | 'admin');
        setUserId(response.data.user.id as number);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('userId', response.data.user.id.toString());
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        api.defaults.headers.Authorization = `Bearer ${response.data.token}`;
        console.log('Đăng nhập thành công:', { isAuthenticated: true, userRole: response.data.role, userId: response.data.user.id, token: response.data.token, refreshToken: response.data.refreshToken });
        await checkAuth();

        if (onSuccess) {
          onSuccess(response.data.role as 'user' | 'admin');
        }
      } else {
        throw new Error(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (error:any) {
      console.error('Lỗi khi đăng nhập:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Lỗi server' };
    }
  };

  // Đăng xuất
  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
    setToken(null);
    delete api.defaults.headers.Authorization;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('refreshToken');
    console.log('Đã đăng xuất, trạng thái hiện tại:', { isAuthenticated: false, userRole: null, userId: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userId, token, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};