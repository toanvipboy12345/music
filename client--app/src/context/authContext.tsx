/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'user' | 'admin' | null;
  userId: number | null;
  token: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  is_premium: boolean | null; // Thêm is_premium
  premium_plan: string | null; // Thêm premium_plan
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
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const [is_premium, setIsPremium] = useState<boolean | null>(null); // Thêm state is_premium
  const [premium_plan, setPremiumPlan] = useState<string | null>(null); // Thêm state premium_plan

  // Khôi phục trạng thái từ localStorage khi khởi động
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role') as 'user' | 'admin' | null;
    const savedUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId') || '0') : null;
    const savedUsername = localStorage.getItem('username');
    const savedEmail = localStorage.getItem('email');
    const savedAvatarUrl = localStorage.getItem('avatar_url');
    const savedIsPremium = localStorage.getItem('is_premium') === 'true' ? true : localStorage.getItem('is_premium') === 'false' ? false : null;
    const savedPremiumPlan = localStorage.getItem('premium_plan');
    console.log('Khôi phục trạng thái từ localStorage:', {
      savedToken,
      savedRole,
      savedUserId,
      savedUsername,
      savedEmail,
      savedAvatarUrl,
      savedIsPremium,
      savedPremiumPlan,
    });
    if (savedToken && savedRole && savedUserId) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
      setUserId(savedUserId);
      setToken(savedToken);
      setUsername(savedUsername);
      setEmail(savedEmail);
      setAvatarUrl(savedAvatarUrl);
      setIsPremium(savedIsPremium);
      setPremiumPlan(savedPremiumPlan);
      api.defaults.headers.Authorization = `Bearer ${savedToken}`;
      checkAuth();
    }
  }, []);

  // Kiểm tra trạng thái đăng nhập
  const checkAuth = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      console.log('checkAuth: Token từ localStorage:', currentToken);
      if (!currentToken) {
        console.log('checkAuth: Không có token, đặt trạng thái về mặc định');
        setIsAuthenticated(false);
        setUserRole(null);
        setUserId(null);
        setToken(null);
        setUsername(null);
        setEmail(null);
        setAvatarUrl(null);
        setIsPremium(null);
        setPremiumPlan(null);
        delete api.defaults.headers.Authorization;
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('avatar_url');
        localStorage.removeItem('is_premium');
        localStorage.removeItem('premium_plan');
        return;
      }

      api.defaults.headers.Authorization = `Bearer ${currentToken}`;
      console.log('checkAuth: Gửi yêu cầu tới /auth/check với header:', api.defaults.headers.Authorization);
      const response = await api.get<AuthResponse>('/auth/check');
      console.log('checkAuth: Phản hồi từ /auth/check:', response.data);
      if (response.data.message === 'Đã đăng nhập' && response.data.user && response.data.user.id) {
        setIsAuthenticated(true);
        setUserRole(response.data.user.role as 'user' | 'admin');
        setUserId(response.data.user.id as number);
        setToken(currentToken);
        setUsername(response.data.user.username || null);
        setEmail(response.data.user.email || null);
        setAvatarUrl(response.data.user.avatar_url || null);
        setIsPremium(response.data.user.is_premium ?? null);
        setPremiumPlan(response.data.user.premium_plan ?? null); // Xử lý premium_plan
        localStorage.setItem('userId', response.data.user.id.toString());
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('username', response.data.user.username || '');
        localStorage.setItem('email', response.data.user.email || '');
        localStorage.setItem('avatar_url', response.data.user.avatar_url || '');
        localStorage.setItem('is_premium', (response.data.user.is_premium ?? false).toString());
        localStorage.setItem('premium_plan', response.data.user.premium_plan ?? '');
      } else {
        throw new Error('Invalid response from /auth/check');
      }
    } catch (error: any) {
      console.error('checkAuth: Lỗi khi gọi /auth/check:', error.response?.data || error.message);
      setIsAuthenticated(false);
      setUserRole(null);

      setToken(null);
      setUsername(null);
      setEmail(null);
      setAvatarUrl(null);
      setIsPremium(null);
      setPremiumPlan(null);
      delete api.defaults.headers.Authorization;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('avatar_url');
      localStorage.removeItem('is_premium');
      localStorage.removeItem('premium_plan');
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
      console.log('Ph反应 hồi từ /auth/login:', response.data);
      if (
        response.data.message === 'Đăng nhập thành công' &&
        response.data.token &&
        response.data.role &&
        response.data.user &&
        response.data.user.id
      ) {
        setIsAuthenticated(true);
        setUserRole(response.data.role as 'user' | 'admin');
        setUserId(response.data.user.id as number);
        setToken(response.data.token);
        setUsername(response.data.user.username || null);
        setEmail(response.data.user.email || null);
        setAvatarUrl(response.data.user.avatar_url || null);
        setIsPremium(response.data.user.is_premium ?? false);
        setPremiumPlan(response.data.user.premium_plan ?? null); // Lưu premium_plan
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('userId', response.data.user.id.toString());
        localStorage.setItem('username', response.data.user.username || '');
        localStorage.setItem('email', response.data.user.email || '');
        localStorage.setItem('avatar_url', response.data.user.avatar_url || '');
        localStorage.setItem('is_premium', response.data.user.is_premium.toString());
        localStorage.setItem('premium_plan', response.data.user.premium_plan ?? '');
        api.defaults.headers.Authorization = `Bearer ${response.data.token}`;
        console.log('Đăng nhập thành công:', {
          isAuthenticated: true,
          userRole: response.data.role,
          userId: response.data.user.id,
          token: response.data.token,
          username: response.data.user.username,
          email: response.data.user.email,
          avatar_url: response.data.user.avatar_url,
          is_premium: response.data.user.is_premium,
          premium_plan: response.data.user.premium_plan,
        });
        await checkAuth();

        if (onSuccess) {
          onSuccess(response.data.role as 'user' | 'admin');
        }
      } else {
        throw new Error(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
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
    setUsername(null);
    setEmail(null);
    setAvatarUrl(null);
    setIsPremium(null);
    setPremiumPlan(null);
    delete api.defaults.headers.Authorization;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('avatar_url');
    localStorage.removeItem('is_premium');
    localStorage.removeItem('premium_plan');
    console.log('Đã đăng xuất, trạng thái hiện tại:', {
      isAuthenticated: false,
      userRole: null,
      userId: null,
      token: null,
      username: null,
      email: null,
      avatar_url: null,
      is_premium: null,
      premium_plan: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userId,
        token,
        username,
        email,
        avatar_url,
        is_premium,
        premium_plan,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
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