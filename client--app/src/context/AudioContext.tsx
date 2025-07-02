import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuth } from './authContext';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  audio_file_url: string;
  img: string;
  artist_id: number;
  artist_name: string;
  feat_artists: string[];
  album_name: string | null;
  release_date?: string;
  is_downloadable?: boolean;
  created_at?: string;
  listen_count?: number;
}

interface QueueItem extends Song {
  position: number;
  is_current: boolean;
}

interface AudioContextType {
  currentSong: QueueItem | null;
  setCurrentSong: (song: QueueItem | null) => void;
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  playlist: QueueItem[];
  setPlaylist: (playlist: QueueItem[]) => void;
  queue: QueueItem[];
  setQueue: (queue: QueueItem[]) => void;
  artistName: string;
  setArtistName: (artistName: string) => void;
  isQueueNavOpen: boolean;
  setIsQueueNavOpen: (isOpen: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  addToQueue: (song: Song | QueueItem, playImmediately: boolean) => Promise<void>;
  fetchQueue: () => Promise<void>;
  playContent: (songIds: number[]) => Promise<void>;
  refreshPlaylists: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<QueueItem | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [playlist, setPlaylist] = useState<QueueItem[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [artistName, setArtistName] = useState<string>('');
  const [isQueueNavOpen, setIsQueueNavOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const { isAuthenticated, token, userId } = useAuth();

  const addToQueue = async (song: Song | QueueItem, playImmediately: boolean) => {
    if (!isAuthenticated || !token || !userId) {
      console.error('Yêu cầu đăng nhập để thêm vào danh sách chờ', { isAuthenticated, token, userId });
      toast.error('Yêu cầu đăng nhập để thêm vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
        action: {
          label: 'Đăng nhập',
          onClick: () => window.location.href = '/login',
        },
      });
      throw new Error('Yêu cầu đăng nhập để thêm vào danh sách chờ');
    }
    try {
      console.log('Gửi yêu cầu POST /user/queue/add:', { song_id: song.song_id, playImmediately });
      const response = await api.post(
        '/user/queue/add',
        { song_id: song.song_id, playImmediately },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Phản hồi từ POST /user/queue/add:', response.data);
      await fetchQueue();
      if (playImmediately) {
        const queueItem: QueueItem = {
          ...song,
          position: response.data.position || 0,
          is_current: true,
        };
        setCurrentSong(queueItem);
        setArtistName(song.artist_name);
        setIsExpanded(false);
      }
    } catch (error: any) {
      console.error('Lỗi khi thêm vào danh sách chờ:', error.response?.data || error.message);
      throw error;
    }
  };

  const fetchQueue = async () => {
    if (!isAuthenticated || !token || !userId) {
      console.log('fetchQueue: Không được xác thực hoặc không có token');
      return;
    }
    try {
      console.log('Gửi yêu cầu GET /user/queue');
      const response = await api.get('/user/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Phản hồi từ GET /user/queue:', response.data);
      const fetchedQueue = response.data.queue || [];
      const sortedQueue = fetchedQueue.sort((a: QueueItem, b: QueueItem) => a.position - b.position);
      setQueue(sortedQueue);
      const current = sortedQueue.find((item: QueueItem) => item.is_current);
      if (current) {
        setCurrentSong(current);
        setCurrentSongIndex(sortedQueue.findIndex((item: QueueItem) => item.is_current));
        setArtistName(current.artist_name);
      } else {
        setCurrentSong(null);
        setCurrentSongIndex(0);
        setArtistName('');
      }
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách chờ:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const playContent = async (songIds: number[]) => {
    if (!isAuthenticated || !token || !userId) {
      console.error('Yêu cầu đăng nhập để phát nội dung', { isAuthenticated, token, userId });
      toast.error('Yêu cầu đăng nhập để phát nội dung', {
        style: { background: 'black', color: 'white' },
        action: {
          label: 'Đăng nhập',
          onClick: () => window.location.href = '/login',
        },
      });
      throw new Error('Yêu cầu đăng nhập để phát nội dung');
    }
    try {
      console.log('Gửi yêu cầu POST /user/queue/play-content:', { song_ids: songIds });
      const response = await api.post(
        '/user/queue/play-content',
        { song_ids: songIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Phản hồi từ POST /user/queue/play-content:', response.data);
      const { queue: fetchedQueue } = response.data;
      const sortedQueue = fetchedQueue.sort((a: QueueItem, b: QueueItem) => a.position - b.position);
      setQueue(sortedQueue);
      setPlaylist(sortedQueue);
      const currentSong = sortedQueue.find((item: QueueItem) => item.is_current);
      if (currentSong) {
        setCurrentSong(currentSong);
        setCurrentSongIndex(sortedQueue.findIndex((item: QueueItem) => item.is_current));
        setArtistName(currentSong.artist_name);
        setIsExpanded(false);
        toast.success(`Đang phát: ${currentSong.title}`, {
          style: { background: 'black', color: 'white' },
        });
      } else {
        setCurrentSong(null);
        setCurrentSongIndex(0);
        setArtistName('');
        setIsExpanded(false);
        toast.error('Không tìm thấy bài hát hiện tại trong danh sách chờ', {
          style: { background: 'black', color: 'white' },
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi phát nội dung:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể phát nội dung', {
        style: { background: 'black', color: 'white' },
      });
      throw error;
    }
  };

  const refreshPlaylists = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (isAuthenticated && token && userId) {
      fetchQueue();
    } else {
      setQueue([]);
      setCurrentSong(null);
      setCurrentSongIndex(0);
      setArtistName('');
      setIsExpanded(false);
    }
  }, [isAuthenticated, token, userId]);

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        setCurrentSong,
        currentSongIndex,
        setCurrentSongIndex,
        playlist,
        setPlaylist,
        queue,
        setQueue,
        artistName,
        setArtistName,
        isQueueNavOpen,
        setIsQueueNavOpen,
        isExpanded,
        setIsExpanded,
        addToQueue,
        fetchQueue,
        playContent,
        refreshPlaylists,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};