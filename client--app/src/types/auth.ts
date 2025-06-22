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