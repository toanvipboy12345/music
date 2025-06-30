import React from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/authContext';
import { Link } from 'react-router-dom';
import { Search } from 'react-feather';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import logo from '../../assets/1725820319spotify-logo-black.png'; // Sử dụng logo đã import

// Logo Spotify bọc trong Link
const SpotifyLogo = () => (
  <Link to="/" className="hover:scale-105 transition-transform">
    <img
      src={logo}
      alt="Spotify Logo"
      className="w-30 h-auto" // Sửa w-30 thành w-12
    />
  </Link>
);

// Hàm tạo avatar từ tên
const generateAvatarFallback = (name: string | null) => {
  if (!name) return 'U'; // Mặc định là 'U' nếu không có tên
  const initials = name.charAt(0).toUpperCase();
  return initials;
};

export const UserHeader: React.FC = () => {
  const { isAuthenticated, logout, userRole } = useAuth();

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      {/* Sử dụng Grid thay cho Flex */}
      <div className="grid grid-cols-12 gap-4 w-full items-center">
        {/* Logo Spotify - 3 phần */}
        <div className="col-span-3 flex items-center">
          <SpotifyLogo />
        </div>

        {/* Thanh tìm kiếm - 6 phần, căn giữa */}
        <div className="col-span-6 flex justify-center">
          <div className="relative w-full max-w-[70%]">
            <input
              type="text"
              placeholder="Bạn muốn phát gì không?"
              className="w-full bg-gray-800 text-white p-2 pl-10 rounded-full focus:outline-none focus:border-2 focus:border-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        {/* Phần bên phải - 3 phần */}
        <div className="col-span-3 flex items-center justify-end space-x-4">
          <Button variant="outline">
            Khám phá Premium
          </Button>
          {!isAuthenticated ? (
            <Link to="/login">
              <Button variant="outline">
                Đăng nhập
              </Button>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback>{generateAvatarFallback(userRole)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-black border border-gray-700 text-white">
                <DropdownMenuItem asChild>
                  <Link to="/account" className="hover:bg-gray-800">
                    Tài khoản
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="hover:bg-gray-800">
                    Hồ sơ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="hover:bg-gray-800">
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                  }}
                  className="hover:bg-gray-800"
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};