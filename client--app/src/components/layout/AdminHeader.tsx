import React from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAuth } from '../../context/authContext';
import { Settings, LogOut } from 'react-feather';

interface AdminHeaderProps {
  onSettingsClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onSettingsClick }) => {
  const { isAuthenticated, logout, userRole } = useAuth();

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center space-x-4">
        {isAuthenticated && userRole === 'admin' ? (
          <>
            <span className="text-sm font-medium">Xin chào, Admin</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-transparent text-white hover:bg-transparent">
                  <Settings className="w-5 h-5 text-gray-400 hover:text-white transition-colors duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white text-gray-900">
                <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Quản lý hệ thống
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <a href="/login">
            <Button variant="outline" className="text-white border-white hover:bg-gray-900">
              Đăng nhập (Admin)
            </Button>
          </a>
        )}
      </div>
    </header>
  );
};