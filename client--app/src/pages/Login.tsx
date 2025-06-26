/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password }, () => {
        // Chuyển hướng dựa trên vai trò
        const role = localStorage.getItem('role');
        if (role === 'admin') {
          console.log('Chuyển hướng đến /admin vì vai trò là admin');
          navigate('/admin');
        } else {
          console.log('Chuyển hướng đến / vì vai trò là user');
          navigate('/');
        }
      });
    } catch (error: any) {
      console.error('Đăng nhập thất bại:', error.message);
      // Hiển thị lỗi cho người dùng nếu cần (tùy bạn thêm UI)
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl mb-4">Đăng nhập</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border"
            placeholder="Nhập email"
            title="Email"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border"
            placeholder="Nhập mật khẩu"
            title="Mật khẩu"
          />
          
        </div>
        <Button type="submit">Đăng nhập</Button>
      </form>
    </div>
  );
};