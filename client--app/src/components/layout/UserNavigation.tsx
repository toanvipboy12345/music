import React from 'react';
import { Link } from 'react-router-dom';

export const UserNavigation: React.FC = () => {
  return (
    <nav className="bg-neutral-900 text-white w-full p-4 h-screen rounded-md">
      <ul className="space-y-4">
        <li><Link to="/" className="hover:text-green-500">Trang chủ</Link></li>
        <li><Link to="/playlists" className="hover:text-green-500">Danh sách phát</Link></li>
        <li><Link to="/favorites" className="hover:text-green-500">Yêu thích</Link></li>
      </ul>
    </nav>
  );
};