/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  refreshToken: any;
  message: string;
  token?: string;
  role?: 'user' | 'admin';
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}