import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/authContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'react-feather';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import logo from '../../assets/1725820319spotify-logo-black.png';

// Logo Spotify bọc trong Link
const SpotifyLogo = () => (
  <Link to="/" className="hover:scale-105 transition-transform">
    <img
      src={logo}
      alt="Spotify Logo"
      className="w-32 h-auto"
    />
  </Link>
);

// Hàm tạo avatar từ tên
const generateAvatarFallback = (name: string | null) => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

export const UserHeader: React.FC = () => {
  const { isAuthenticated, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Thêm useLocation
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Debounce để điều hướng khi nhập từ khóa
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery && searchQuery.trim().length > 0) {
        navigate(`/search/${encodeURIComponent(searchQuery)}`);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, navigate]);

  // Đặt lại searchQuery khi rời khỏi các route /search/*
  useEffect(() => {
    if (!location.pathname.startsWith('/search/')) {
      setSearchQuery('');
    }
  }, [location.pathname]);

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      <div className="grid grid-cols-12 gap-4 w-full items-center">
        {/* Logo Spotify */}
        <div className="col-span-3 flex items-center">
          <SpotifyLogo />
        </div>

        {/* Thanh tìm kiếm */}
        <div className="col-span-6 flex justify-center">
          <div className="relative w-full max-w-[70%]">
            <input
              type="text"
              placeholder="Bạn muốn phát gì không?"
              className="w-full bg-gray-800 text-white p-2 pl-10 rounded-full focus:outline-none focus:border-2 focus:border-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        {/* Phần bên phải */}
        <div className="col-span-3 flex items-center justify-end space-x-4">
          <Button variant="outline">Khám phá Premium</Button>
          {!isAuthenticated ? (
            <Link to="/login">
              <Button variant="outline">Đăng nhập</Button>
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
                  <Link to="/account" className="hover:bg-gray-800">Tài khoản</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="hover:bg-gray-800">Hồ sơ</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="hover:bg-gray-800">Cài đặt</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => logout()}
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