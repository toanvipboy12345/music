import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './authContext';
import { toast } from 'sonner';

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
}

interface QueueItem extends Song {
  queue_id: number;
  position: number;
  is_current: boolean;
  created_at: string;
}

interface AudioContextType {
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  artistName: string;
  setArtistName: (name: string) => void;
  playlist: Song[];
  setPlaylist: (playlist: Song[]) => void;
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  isShuffle: boolean;
  setIsShuffle: (isShuffle: boolean) => void;
  queue: QueueItem[];
  setQueue: (queue: QueueItem[]) => void;
  addToQueue: (song: Song) => Promise<void>;
  removeFromQueue: (songId: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [artistName, setArtistName] = useState<string>('');
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const { isAuthenticated, token, userId } = useAuth();

  // Tái tải hàng đợi từ server
  const fetchQueue = async () => {
    if (!isAuthenticated || !token || !userId) {
      console.log('Không thể lấy hàng đợi: Thiếu thông tin xác thực', { isAuthenticated, token, userId });
      return;
    }
    try {
      console.log('Gửi yêu cầu GET /user/queue với userId:', userId);
      const response = await api.get('/user/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Phản hồi từ GET /user/queue:', response.data);
      const { queue: fetchedQueue } = response.data;
      // Sắp xếp hàng đợi theo position và lọc bài hiện tại ra khỏi queue
      const sortedQueue = fetchedQueue
        .filter((item: QueueItem) => !item.is_current)
        .sort((a: QueueItem, b: QueueItem) => a.position - b.position);
      setQueue(sortedQueue);
      const currentItem = fetchedQueue.find((item: QueueItem) => item.is_current);
      if (currentItem) {
        setCurrentSong({
          song_id: currentItem.song_id,
          title: currentItem.title,
          duration: currentItem.duration,
          audio_file_url: currentItem.audio_file_url,
          img: currentItem.img,
          artist_id: currentItem.artist_id || 0,
          artist_name: currentItem.artist_name,
          feat_artists: currentItem.feat_artists,
          album_name: currentItem.album_name,
        });
        setCurrentSongIndex(fetchedQueue.findIndex((item: QueueItem) => item.is_current));
        setArtistName(currentItem.artist_name);
        console.log('Đã đặt bài hát hiện tại:', currentItem);
      } else {
        console.log('Không tìm thấy bài hát hiện tại trong hàng đợi');
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

  // Khôi phục hàng đợi khi đăng nhập
  useEffect(() => {
    fetchQueue();
  }, [isAuthenticated, token, userId]);

  // Thêm bài hát vào hàng đợi
  const addToQueue = async (song: Song) => {
    if (!isAuthenticated || !token || !userId) {
      console.error('Yêu cầu đăng nhập để thêm vào hàng đợi', { isAuthenticated, token, userId });
      toast.error('Yêu cầu đăng nhập để thêm vào hàng đợi', {
        style: { background: 'black', color: 'white' },
      });
      throw new Error('Yêu cầu đăng nhập để thêm vào hàng đợi');
    }
    try {
      console.log('Gửi yêu cầu POST /user/queue/add:', { song_id: song.song_id });
      const response = await api.post(
        '/user/queue/add',
        { song_id: song.song_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Phản hồi từ POST /user/queue/add:', response.data);
      await fetchQueue(); // Tái tải hàng đợi để đồng bộ
      if (!currentSong) {
        const newQueueItem = response.data.queue_item;
        setCurrentSong({
          song_id: newQueueItem.song_id,
          title: newQueueItem.title,
          duration: newQueueItem.duration,
          audio_file_url: newQueueItem.audio_file_url,
          img: newQueueItem.img,
          artist_id: newQueueItem.artist_id || 0,
          artist_name: newQueueItem.artist_name,
          feat_artists: newQueueItem.feat_artists,
          album_name: newQueueItem.album_name,
        });
        setArtistName(newQueueItem.artist_name);
        console.log('Đã đặt bài hát hiện tại:', newQueueItem);
        try {
          console.log('Gửi yêu cầu PUT /user/queue/update-current:', { song_id: newQueueItem.song_id });
          const updateResponse = await api.put(
            '/user/queue/update-current',
            { song_id: newQueueItem.song_id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Phản hồi từ PUT /user/queue/update-current:', updateResponse.data);
          await fetchQueue();
        } catch (error: any) {
          console.error('Lỗi khi cập nhật bài hát hiện tại:', error.response?.data || error.message);
          toast.error(error.response?.data?.message || 'Không thể cập nhật bài hát hiện tại', {
            style: { background: 'black', color: 'white' },
          });
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi thêm bài hát vào hàng đợi:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể thêm bài hát vào hàng đợi', {
        style: { background: 'black', color: 'white' },
      });
      throw error;
    }
  };

  // Xóa bài hát khỏi hàng đợi
  const removeFromQueue = async (songId: number) => {
    if (!isAuthenticated || !token || !userId) {
      console.error('Yêu cầu đăng nhập để xóa khỏi hàng đợi', { isAuthenticated, token, userId });
      toast.error('Yêu cầu đăng nhập để xóa khỏi hàng đợi', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      console.log('Gửi yêu cầu DELETE /user/queue/remove:', { song_id: songId });
      const response = await api.delete(`/user/queue/remove/${songId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Phản hồi từ DELETE /user/queue/remove:', response.data);
      await fetchQueue(); // Tái tải hàng đợi để đồng bộ
    } catch (error: any) {
      console.error('Lỗi khi xóa bài hát khỏi hàng đợi:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể xóa bài hát khỏi hàng đợi', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        setCurrentSong,
        isExpanded,
        setIsExpanded,
        artistName,
        setArtistName,
        playlist,
        setPlaylist,
        currentSongIndex,
        setCurrentSongIndex,
        isShuffle,
        setIsShuffle,
        queue,
        setQueue,
        addToQueue,
        removeFromQueue,
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