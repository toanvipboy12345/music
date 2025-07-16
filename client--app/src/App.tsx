/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import { UserLibrary } from './pages/UserLibrary';
import { Explore } from './pages/Explore';
import { GenreDetail } from './pages/GenreDetail'; // Import GenreDetail
import { UserProfile } from './pages/UserProfile';// Khai báo tên ứng dụng
import {Chart} from './pages/Chart'; // Import Chart page
const APP_NAME = 'Spotyfi';

// Component mới để xử lý logic useLocation
const RouteTitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    switch (pathname) {
      case '/':
        document.title = `${APP_NAME} - Web Player: Music for everyone`;
        break;
      case '/library':
        document.title = `${APP_NAME} - Thư viện của bạn`;
        break;
      case '/login':
        document.title = `${APP_NAME} - Đăng nhập`;
        break;
      case '/register':
        document.title = `${APP_NAME} - Đăng ký`;
        break;
      case '/admin':
        document.title = `${APP_NAME} - Quản trị`;
        break;
      case '/premium':
        document.title = `${APP_NAME} - Gói Premium`;
        break;
      case '/payment-result':
      case '/payment/success':
      case '/payment/failure':
        document.title = `${APP_NAME} - Kết quả Thanh toán`;
        break;
      case '/explore':
        document.title = `${APP_NAME} - Khám phá Thể Loại`;
        break;
      default:
        document.title = `${APP_NAME} - Ứng dụng Âm nhạc`;
        break;
    }
  }, [location.pathname]);

  return null; // Component này không render gì cả
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <RouteTitleUpdater /> {/* Thêm component này vào trong Router */}
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="/library" element={<ProtectedRoute><UserLibrary /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
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
              <Route path="/ranking" element={<Chart />} />
              <Route
                path="/playlists/:playlistId"
                element={
                  <ProtectedRoute>
                    <PlaylistDetail />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/explore" element={<Explore />} /> {/* Route cho Explore */}
              <Route path="/explore/genres/:genre_id/songs" element={<GenreDetail />} /> {/* Route cho GenreDetail */}
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