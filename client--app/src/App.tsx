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
import { AlbumDetail } from './pages/AlbumDetail';
import SearchPage from './pages/SearchPage';
import { ArtistDetail } from './pages/ArtistDetail';
import PremiumPlans from './pages/PremiumPlans';
import PremiumSubscribe from './pages/PremiumSubscribe';
import PaymentResult from './pages/PaymentResult';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="/search/:query" element={<SearchPage />} />
              <Route path="/premium" element={<PremiumPlans />} />
              <Route path="/premium/subscribe/:plan_id" element={<PremiumSubscribe />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/payment/success" element={<PaymentResult />} />
              <Route path="/payment/failure" element={<PaymentResult />} />
              <Route path="/search/:query/artists" element={<SearchPage />} />
              <Route path="/search/:query/albums" element={<SearchPage />} />
              <Route path="/search/:query/tracks" element={<SearchPage />} />
              <Route path="/collection/:artist_id" element={<CollectionDetail />} />
              <Route path="/artists/:artist_id" element={<ArtistDetail />} />
              <Route path="/albums/:album_id" element={<AlbumDetail />} />
              <Route
                path="/playlists/:playlistId"
                element={
                  <ProtectedRoute>
                    <PlaylistDetail />
                  </ProtectedRoute>
                }
              />
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