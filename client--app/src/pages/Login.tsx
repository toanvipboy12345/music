/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Loader } from 'react-feather';

export const Login: React.FC = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate cơ bản
    if (!loginInput.trim()) {
      toast.error('Vui lòng nhập email hoặc tên người dùng', {
        style: { background: 'black', color: 'white' },
      });
      setIsLoading(false);
      return;
    }
    if (!password) {
      toast.error('Vui lòng nhập mật khẩu', {
        style: { background: 'black', color: 'white' },
      });
      setIsLoading(false);
      return;
    }

    // Xác định email hoặc username
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(loginInput.trim());
    const credentials = isEmail
      ? { email: loginInput.trim(), username: '', password }
      : { email: '', username: loginInput.trim(), password };

    try {
      await login(credentials, (role) => {
        console.log('Login callback triggered, role:', role);
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      });
      toast.success('Đăng nhập thành công!', {
        style: { background: 'black', color: 'white' },
      });
    } catch (error: any) {
      console.error('Đăng nhập thất bại:', error.message);
      toast.error(error.message || 'Đăng nhập thất bại, vui lòng thử lại', {
        style: { background: 'black', color: 'white' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 bg-neutral-900 text-white rounded-lg shadow-lg border border-white">
        <h1 className="text-3xl font-bold mb-8 text-center">Đăng nhập</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="loginInput" className="block text-sm font-medium text-white">
              Email hoặc Tên người dùng
            </label>
            <Input
              id="loginInput"
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Nhập email hoặc tên người dùng"
              className="mt-2 w-full bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400 focus:ring-green-500 focus:border-green-500"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="mt-2 w-full bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400 focus:ring-green-500 focus:border-green-500"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-neutral-400">
            Chưa có tài khoản?{' '}
            <a href="/register" className="text-green-500 hover:underline">
              Đăng ký
            </a>
          </p>
          <Button
            variant="outline"
           
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};