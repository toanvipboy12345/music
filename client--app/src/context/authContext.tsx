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
    console.log('Khôi phục trạng thái từ localStorage:', { savedToken, savedRole, savedUserId });
    if (savedToken && savedRole && savedUserId) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
      setUserId(savedUserId);
      setToken(savedToken);
      api.defaults.headers.Authorization = `Bearer ${savedToken}`;
      console.log('Set token vào header:', api

.defaults.headers.Authorization);
      checkAuth();
    }
  }, []);

  // Kiểm tra trạng thái đăng nhập
  const checkAuth = async () => {
    try {
      console.log('Gọi checkAuth...');
      const currentToken = localStorage.getItem('token');
      console.log('Token hiện tại:', currentToken);
      if (!currentToken) {
        console.log('Không có token, không gọi API /auth/check');
        setIsAuthenticated(false);
        setUserRole(null);
        setUserId(null);
        setToken(null);
        return;
      }

      api.defaults.headers.Authorization = `Bearer ${currentToken}`;
      console.log('Header Authorization trước khi gọi /auth/check:', api.defaults.headers.Authorization);
      const response = await api.get('/auth/check');
      console.log('Phản hồi từ /auth/check:', response.data);
      if (response.data.message === 'Đã đăng nhập' && response.data.user && response.data.user.id) {
        setIsAuthenticated(true);
        setUserRole(response.data.user.role as 'user' | 'admin');
        setUserId(response.data.user.id as number);
        setToken(currentToken);
        localStorage.setItem('userId', response.data.user.id.toString());
        console.log('Xác thực thành công:', { isAuthenticated: true, userRole: response.data.user.role, userId: response.data.user.id });
      } else {
        console.log('Xác thực thất bại, set trạng thái về false');
        setIsAuthenticated(false);
        setUserRole(null);
        setUserId(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Lỗi khi gọi checkAuth:', error.response?.data || error.message);
      setIsAuthenticated(false);
      setUserRole(null);
      setUserId(null);
      setToken(null);
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
    } catch (error) {
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
        api.defaults.headers.Authorization = `Bearer ${response.data.token}`;
        console.log('Đăng nhập thành công:', { isAuthenticated: true, userRole: response.data.role, userId: response.data.user.id, token: response.data.token });
        await checkAuth();

        // Gọi callback onSuccess nếu được cung cấp, truyền role từ phản hồi
        if (onSuccess) {
          onSuccess(response.data.role as 'user' | 'admin');
        }
      } else {
        throw new Error(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Lỗi server' };
    }
  };

  // Đăng xuất
  const logout = () => {
    console.log('Gọi logout...');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
    setToken(null);
    delete api.defaults.headers.Authorization;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
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
