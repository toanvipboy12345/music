import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'user' | 'admin' }> = ({ children, requiredRole }) => {
  const { isAuthenticated, userRole, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('ProtectedRoute: Kiểm tra token:', token);
      if (token) {
        console.log('ProtectedRoute: Có token, gọi checkAuth');
        await checkAuth();
      } else {
        console.log('ProtectedRoute: Không có token, đặt isChecking false');
        setIsChecking(false);
      }
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth]);

  console.log('ProtectedRoute: Trạng thái:', { isAuthenticated, userRole, requiredRole, isChecking });

  if (isChecking) {
    console.log('ProtectedRoute: Đang kiểm tra xác thực, hiển thị loading...');
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Chưa đăng nhập, chuyển hướng về /login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log(`ProtectedRoute: Vai trò ${userRole} không được phép truy cập (yêu cầu ${requiredRole}), chuyển hướng về /`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};