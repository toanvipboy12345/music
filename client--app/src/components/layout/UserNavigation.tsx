/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { Toaster, toast } from 'sonner';
import { FolderIcon, MagnifyingGlassIcon, MusicalNoteIcon, UserIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import api from '../../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Playlist {
  id: number;
  title: string;
  img: string | null;
  description: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
}

interface Artist {
  id: number;
  stage_name: string;
  profile_picture: string | null;
  follower: number;
  created_at: string;
}

interface Song {
  id: number;
  title: string;
  audio_file_url: string | null;
  img: string | null;
  artist: {
    id: number;
    stage_name: string;
  };
  downloaded_at: string;
  created_at: string;
}

interface LibraryResponse {
  message: string;
  library: {
    user_playlists: Playlist[];
    liked_playlists: Playlist[];
    followed_artists: Artist[];
    downloaded_songs: Song[];
  };
}

export const UserNavigation: React.FC = () => {
  const { isAuthenticated, userId, token, is_premium } = useAuth();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<LibraryResponse['library']>({
    user_playlists: [],
    liked_playlists: [],
    followed_artists: [],
    downloaded_songs: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && userId && token) {
      fetchLibrary();
    } else {
      setLibrary({ user_playlists: [], liked_playlists: [], followed_artists: [], downloaded_songs: [] });
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, token]);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<LibraryResponse>('/user/library', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => {
        setLibrary(response.data.library);
        setIsLoading(false);
        console.log('Dữ liệu thư viện:', response.data.library);
      }, 1000);
    } catch (error: any) {
      console.error('Lỗi khi lấy dữ liệu thư viện:', error);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(error.response?.data?.message || 'Lỗi khi lấy dữ liệu thư viện', {
          style: { background: 'black', color: 'white' },
        });
      }, 1000);
    }
  };

  // Hàm xáo trộn mảng (Fisher-Yates shuffle)
  const shuffle = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Gộp tất cả các mục vào một danh sách, tối đa 3 item mỗi loại
  const combinedItems = shuffle([
    ...library.user_playlists.slice(0, 3).map(item => ({ ...item, type: 'user_playlist' as const })),
    ...library.liked_playlists.slice(0, 3).map(item => ({ ...item, type: 'liked_playlist' as const })),
    ...library.followed_artists.slice(0, 3).map(item => ({ ...item, type: 'followed_artist' as const })),
    ...(is_premium ? library.downloaded_songs.slice(0, 3).map(item => ({ ...item, type: 'downloaded_song' as const })) : []),
  ]);

  return (
    <>
      <Toaster position="top-right" />
      <nav className="bg-neutral-900 text-white w-full py-6 px-0 h-screen rounded-md flex flex-col">
        <div className="flex gap-4 mb-4 px-5">
          <Link to="/library">
            <Button variant="outline" className="flex items-center gap-2">
              <FolderIcon className="h-6 w-6" />
              Thư viện
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="outline" className="flex items-center gap-2">
              <MagnifyingGlassIcon className="h-6 w-6" />
              Khám phá
            </Button>
          </Link>
                   
        </div>
        {isAuthenticated ? (
          <>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center py-3 px-5">
                    <Skeleton height={64} width={64} />
                    <Skeleton height={20} width={200} className="ml-4" />
                  </div>
                ))}
              </div>
            ) : combinedItems.length === 0 ? (
              <div className="text-center py-12 px-5">
                <MusicalNoteIcon className="h-12 w-12 mx-auto text-neutral-500" />
                <p className="mt-4 text-neutral-400">Thư viện trống. Hãy tạo playlist hoặc follow nghệ sĩ để bắt đầu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {combinedItems.map((item) => (
                  <Link
                    to={
                      item.type === 'user_playlist' || item.type === 'liked_playlist'
                        ? `/playlists/${item.id}`
                        : item.type === 'followed_artist'
                        ? `/artists/${item.id}`
                        : `/songs/${item.id}`
                    }
                    key={`${item.type}-${item.id}`}
                    className="flex items-center py-3 px-5 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                  >
                    {item.type === 'followed_artist' ? (
                      item.profile_picture ? (
                        <img
                          src={item.profile_picture}
                          alt={item.stage_name}
                          className="w-16 h-16 rounded-full object-cover mr-4"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mr-4">
                          <UserIcon className="h-8 w-8 text-neutral-400" />
                        </div>
                      )
                    ) : (
                      ('img' in item && item.img) ? (
                        <img
                          src={item.img}
                          alt={item.title}
                          className="w-16 h-16 rounded object-cover mr-4"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded bg-neutral-700 flex items-center justify-center mr-4">
                          <MusicalNoteIcon className="h-8 w-8 text-neutral-400" />
                        </div>
                      )
                    )}
                    <div className="flex-1">
                      <span className="text-white font-medium">
                        {item.type === 'followed_artist' ? item.stage_name : item.title}
                      </span>
                      <p className="text-sm text-gray-400">
                        {item.type === 'user_playlist' || item.type === 'liked_playlist'
                          ? 'Danh sách phát'
                          : item.type === 'followed_artist'
                          ? 'Nghệ sĩ'
                          : item.artist.stage_name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-5">
            <p className="mt-4 text-neutral-400">Vui lòng đăng nhập để sử dụng các tính năng</p>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="mt-4"
            >
              Đăng nhập
            </Button>
          </div>
        )}
      </nav>
    </>
  );
};