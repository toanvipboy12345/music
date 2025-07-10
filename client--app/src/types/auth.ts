/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  role?: 'user' | 'admin';
  user?: {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    role: 'user' | 'admin';
    is_premium: boolean;
    premium_plan: string | null; // Sử dụng string | null thay vì 'basic' | 'advanced' | null
  };
}