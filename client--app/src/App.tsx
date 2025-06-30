import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import { AudioProvider } from './context/AudioContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { CollectionDetail } from './pages/CollectionDetail';
import { PlaylistDetail } from './pages/PlaylistDetail';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="/collection/:artist_id" element={<CollectionDetail />} />
              <Route path="/playlists/:playlistId" element={<PlaylistDetail />} /> {/* Sửa user_Id thành playlistId */}
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AudioProvider>
    </AuthProvider>
  );
};

export default App;