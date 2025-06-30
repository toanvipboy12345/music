import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'user' | 'admin' }> = ({ children, requiredRole }) => {
  const { isAuthenticated, userRole, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log('ProtectedRoute: Trạng thái isAuthenticated:', isAuthenticated, 'userRole:', userRole, 'requiredRole:', requiredRole);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log('ProtectedRoute: Không có quyền truy cập, chuyển hướng về /');
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};