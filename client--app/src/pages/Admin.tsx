import React, { useState } from 'react';
import { AdminHeader } from '../components/layout/AdminHeader';
import { AdminNavigation } from '../components/layout/AdminNavigation';
import { AdminUsers } from './Admin/AdminUsers';
import  AdminArtists  from './Admin/AdminArtists';
import  AdminSongs from './Admin/AdminSongs';
import { AdminAlbums } from './Admin/AdminAlbums';
import { AdminPlaylists } from './Admin/AdminPlaylists';
import  AdminGenres  from './Admin/AdminGenres';
import { AdminUserInteractions } from './Admin/AdminUserInteractions';
import { AdminReports } from './Admin/AdminReports';
import { AdminMedia } from './Admin/AdminMedia';

export const Admin: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="max-w-full p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Bảng điều khiển</h1>
            <p>Đây là trang tổng quan admin.</p>
          </div>
        );
      case 'users':
        return <AdminUsers />;
      case 'artists':
        return <AdminArtists />;
      case 'songs':
        return <AdminSongs />;
      case 'albums':
        return <AdminAlbums />;
      case 'playlists':
        return <AdminPlaylists />;
      case 'genres':
        return <AdminGenres />;
      case 'interactions':
        return <AdminUserInteractions />;
      case 'reports':
        return <AdminReports />;
      case 'media':
        return <AdminMedia />;
      case 'system':
        return <AdminSystem />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <AdminNavigation onNavClick={setActivePage} activePage={activePage} />

      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64">
        <AdminHeader onSettingsClick={() => setActivePage('system')} />
        <main className="p-6">{renderContent()}</main>
      </div>
    </div>
  );
};