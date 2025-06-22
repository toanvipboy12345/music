import React from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/authContext';
import { Link } from 'react-router-dom';

export const UserHeader: React.FC = () => {
  const { isAuthenticated, logout, userRole } = useAuth();

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center">
      <h1 className="text-xl">Music App của tôi đ</h1>
      <div>
        {isAuthenticated ? (
          <>
            <span className="mr-4">Xin chào, {userRole}</span>
            <Button variant="destructive" onClick={logout}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        )}
      </div>
    </header>
  );
};