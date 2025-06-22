import React from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/authContext';
import { Link } from 'react-router-dom';

export const AdminHeader: React.FC = () => {
  const { isAuthenticated, logout, userRole } = useAuth();

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl">Admin Panel</h1>
      <div>
        {isAuthenticated && userRole === 'admin' ? (
          <>
            <span className="mr-4">Xin chào, Admin</span>
            <Button variant="destructive" onClick={logout}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button>Đăng nhập (Admin)</Button>
          </Link>
        )}
      </div>
    </header>
  );
};