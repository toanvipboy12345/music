import React, { useState } from 'react';
import { AdminHeader } from '../components/layout/AdminHeader';
import { AdminNavigation } from '../components/layout/AdminNavigation';
import { AdminUsers } from './Admin/AdminUsers';
import AdminArtists from './Admin/AdminArtists';
import AdminSongs from './Admin/AdminSongs';
import AdminAlbums from './Admin/AdminAlbums';
import  AdminPlaylists  from './Admin/AdminPlaylists';
import AdminGenres from './Admin/AdminGenres';
import { AdminUserInteractions } from './Admin/AdminUserInteractions';
import  AdminReports  from './Admin/AdminReports';
import { AdminMedia } from './Admin/AdminMedia';
import AdminPremium from './Admin/AdminPremium';
import AdminHome from './Admin/AdminHome';
export const Admin: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <AdminHome/>
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
      case 'premium':
        return <AdminPremium />;
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
      <div className="flex-1 ml-0 md:ml-64 bg-white">
        <AdminHeader onSettingsClick={() => setActivePage('system')} />
        <main className="p-6">{renderContent()}</main>
      </div>
    </div>
  );
};