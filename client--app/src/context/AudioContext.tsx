/* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
// import api from '../services/api';
// import { useAuth } from './authContext';
// import { toast } from 'sonner';

// interface Song {
//   song_id: number;
//   title: string;
//   duration: number;
//   audio_file_url: string;
//   img: string;
//   artist_id: number;
//   artist_name: string;
//   feat_artists: string[];
//   album_name: string | null;
// }

// interface QueueItem extends Song {
//   queue_id: number;
//   position: number;
//   is_current: boolean;
//   created_at: string;
// }

// interface AudioContextType {
//   currentSong: Song | null;
//   setCurrentSong: (song: Song | null) => void;
//   isExpanded: boolean;
//   setIsExpanded: (isExpanded: boolean) => void;
//   artistName: string;
//   setArtistName: (name: string) => void;
//   playlist: Song[];
//   setPlaylist: (playlist: Song[]) => void;
//   currentSongIndex: number;
//   setCurrentSongIndex: (index: number) => void;
//   isShuffle: boolean;
//   setIsShuffle: (isShuffle: boolean) => void;
//   queue: QueueItem[];
//   setQueue: (queue: QueueItem[]) => void;
//   addToQueue: (song: Song, playNow?: boolean) => Promise<void>;
//   removeFromQueue: (songId: number) => Promise<void>;
//   clearQueue: () => Promise<void>;
//   fetchQueue: () => Promise<void>;
// }

// const AudioContext = createContext<AudioContextType | undefined>(undefined);

// export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [currentSong, setCurrentSong] = useState<Song | null>(null);
//   const [isExpanded, setIsExpanded] = useState<boolean>(false);
//   const [artistName, setArtistName] = useState<string>('');
//   const [playlist, setPlaylist] = useState<Song[]>([]);
//   const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
//   const [isShuffle, setIsShuffle] = useState<boolean>(false);
//   const [queue, setQueue] = useState<QueueItem[]>([]);
//   const { isAuthenticated, token, userId } = useAuth();

//   const fetchQueue = async () => {
//     if (!isAuthenticated || !token || !userId) {
//       console.log('Không thể lấy hàng đợi: Thiếu thông tin xác thực', { isAuthenticated, token, userId });
//       setQueue([]);
//       return;
//     }
//     try {
//       console.log('Gửi yêu cầu GET /user/queue với userId:', userId);
//       const response = await api.get('/user/queue', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log('Phản hồi từ GET /user/queue:', response.data);
//       const { queue: fetchedQueue } = response.data;
//       const sortedQueue = fetchedQueue.sort((a: QueueItem, b: QueueItem) => a.position - b.position);
//       setQueue(sortedQueue);
//       const currentItem = sortedQueue.find((item: QueueItem) => item.is_current);
//       if (currentItem) {
//         console.log('Đã tìm thấy bài hát hiện tại trong hàng đợi:', currentItem.song_id, currentItem.title);
//         setCurrentSong({
//           song_id: currentItem.song_id,
//           title: currentItem.title,
//           duration: currentItem.duration,
//           audio_file_url: currentItem.audio_file_url,
//           img: currentItem.img,
//           artist_id: currentItem.artist_id || 0,
//           artist_name: currentItem.artist_name,
//           feat_artists: currentItem.feat_artists,
//           album_name: currentItem.album_name,
//         });
//         setCurrentSongIndex(sortedQueue.findIndex((item: QueueItem) => item.is_current));
//         setArtistName(currentItem.artist_name);
//       }
//     } catch (error: any) {
//       console.error('Lỗi khi lấy danh sách chờ:', error.response?.data || error.message);
//       toast.error(error.response?.data?.message || 'Không thể tải danh sách chờ', {
//         style: { background: 'black', color: 'white' },
//       });
//       setQueue([]);
//     }
//   };

//   useEffect(() => {
//     fetchQueue();
//   }, [isAuthenticated, token, userId]);

//   const addToQueue = async (song: Song, playNow: boolean = false) => {
//     if (!isAuthenticated || !token || !userId) {
//       console.error('Yêu cầu đăng nhập để thêm vào hàng đợi', { isAuthenticated, token, userId });
//       toast.error('Yêu cầu đăng nhập để thêm vào hàng đợi', {
//         style: { background: 'black', color: 'white' },
//         action: {
//           label: 'Đăng nhập',
//           onClick: () => window.location.href = '/login',
//         },
//       });
//       throw new Error('Yêu cầu đăng nhập để thêm vào hàng đợi');
//     }
//     try {
//       console.log('Gửi yêu cầu POST /user/queue/add:', { song_id: song.song_id, playNow });
//       const response = await api.post(
//         '/user/queue/add',
//         { song_id: song.song_id, playNow },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log('Phản hồi từ POST /user/queue/add:', response.data);
//       const { queue_item: newQueueItem } = response.data;
//       toast.success(playNow ? 'Đang phát bài hát' : 'Đã thêm bài hát vào danh sách chờ', {
//         style: { background: 'black', color: 'white' },
//       });

//       if (playNow) {
//         setCurrentSong({
//           song_id: newQueueItem.song_id,
//           title: newQueueItem.title,
//           duration: newQueueItem.duration,
//           audio_file_url: newQueueItem.audio_file_url,
//           img: newQueueItem.img,
//           artist_id: newQueueItem.artist_id || 0,
//           artist_name: newQueueItem.artist_name,
//           feat_artists: newQueueItem.feat_artists,
//           album_name: newQueueItem.album_name,
//         });
//         setArtistName(newQueueItem.artist_name);
//       }
//       await fetchQueue();
//     } catch (error: any) {
//       console.error('Lỗi khi thêm bài hát vào hàng đợi:', error.response?.data || error.message);
//       toast.error(error.response?.data?.message || 'Không thể thêm bài hát vào danh sách chờ', {
//         style: { background: 'black', color: 'white' },
//       });
//       throw error;
//     }
//   };

//   const removeFromQueue = async (songId: number) => {
//     if (!isAuthenticated || !token || !userId) {
//       console.error('Yêu cầu đăng nhập để xóa khỏi hàng đợi', { isAuthenticated, token, userId });
//       toast.error('Yêu cầu đăng nhập để xóa khỏi hàng đợi', {
//         style: { background: 'black', color: 'white' },
//         action: {
//           label: 'Đăng nhập',
//           onClick: () => window.location.href = '/login',
//         },
//       });
//       return;
//     }
//     try {
//       console.log('Gửi yêu cầu DELETE /user/queue/remove:', { song_id: songId });
//       await api.delete(`/user/queue/remove/${songId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log('Đã xóa bài hát khỏi hàng đợi:', songId);
//       toast.success('Đã xóa bài hát khỏi danh sách chờ', {
//         style: { background: 'black', color: 'white' },
//       });
//       await fetchQueue();
//     } catch (error: any) {
//       console.error('Lỗi khi xóa bài hát khỏi hàng đợi:', error.response?.data || error.message);
//       toast.error(error.response?.data?.message || 'Không thể xóa bài hát khỏi danh sách chờ', {
//         style: { background: 'black', color: 'white' },
//       });
//     }
//   };

//   const clearQueue = async () => {
//     if (!isAuthenticated || !token || !userId) {
//       console.error('Yêu cầu đăng nhập để làm trống hàng đợi', { isAuthenticated, token, userId });
//       toast.error('Yêu cầu đăng nhập để làm trống hàng đợi', {
//         style: { background: 'black', color: 'white' },
//         action: {
//           label: 'Đăng nhập',
//           onClick: () => window.location.href = '/login',
//         },
//       });
//       return;
//     }
//     try {
//       console.log('Gửi yêu cầu DELETE /user/queue/clear');
//       await api.delete('/user/queue/clear', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log('Đã làm trống danh sách chờ');
//       toast.success('Đã làm trống danh sách chờ', {
//         style: { background: 'black', color: 'white' },
//       });
//       setQueue([]);
//       setCurrentSong(null);
//       setCurrentSongIndex(0);
//       setArtistName('');
//       setPlaylist([]);
//     } catch (error: any) {
//       console.error('Lỗi khi làm trống danh sách chờ:', error.response?.data || error.message);
//       toast.error(error.response?.data?.message || 'Không thể làm trống danh sách chờ', {
//         style: { background: 'black', color: 'white' },
//       });
//     }
//   };

//   return (
//     <AudioContext.Provider
//       value={{
//         currentSong,
//         setCurrentSong,
//         isExpanded,
//         setIsExpanded,
//         artistName,
//         setArtistName,
//         playlist,
//         setPlaylist,
//         currentSongIndex,
//         setCurrentSongIndex,
//         isShuffle,
//         setIsShuffle,
//         queue,
//         setQueue,
//         addToQueue,
//         removeFromQueue,
//         clearQueue,
//         fetchQueue,
//       }}
//     >
//       {children}
//     </AudioContext.Provider>
//   );
// };

// export const useAudio = () => {
//   const context = useContext(AudioContext);
//   if (!context) {
//     throw new Error('useAudio must be used within an AudioProvider');
//   }
//   return context;
// };
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
  addToQueue: (song: Song, playNow?: boolean) => Promise<void>;
  removeFromQueue: (songId: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  fetchQueue: () => Promise<void>;
  isQueueNavOpen: boolean;
  setIsQueueNavOpen: (isOpen: boolean) => void;
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
  const [isQueueNavOpen, setIsQueueNavOpen] = useState<boolean>(false);
  const { isAuthenticated, token, userId } = useAuth();
const fetchQueue = async () => {
  if (!isAuthenticated || !token || !userId) {
    console.log('Không thể lấy hàng đợi: Thiếu thông tin xác thực', { isAuthenticated, token, userId });
    setQueue([]);
    return;
  }
  try {
    console.log('Gửi yêu cầu GET /user/queue với userId:', userId);
    const response = await api.get('/user/queue', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Phản hồi từ GET /user/queue:', response.data);
    const { queue: fetchedQueue } = response.data;
    const sortedQueue = fetchedQueue.sort((a: QueueItem, b: QueueItem) => a.position - b.position);
    setQueue(sortedQueue);
    const currentItem = sortedQueue.find((item: QueueItem) => item.is_current);
    if (currentItem) {
      console.log('Đã tìm thấy bài hát hiện tại trong hàng đợi:', currentItem.song_id, currentItem.title);
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
      setCurrentSongIndex(sortedQueue.findIndex((item: QueueItem) => item.is_current));
      setArtistName(currentItem.artist_name);
    }
  } catch (error: unknown) {
    let errorMessage = 'Không thể tải danh sách chờ';
    if (error instanceof Error) {
      // Nếu error là một Error, lấy message từ error
      errorMessage = error.message;
    }
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      // Nếu error.response.data tồn tại và là chuỗi
      errorMessage = typeof error.response.data === 'string' ? error.response.data : errorMessage;
    }
    console.error('Lỗi khi lấy danh sách chờ:', errorMessage);
    toast.error(errorMessage, {
      style: { background: 'black', color: 'white' },
    });
    setQueue([]);
  }
};

  useEffect(() => {
    fetchQueue();
  }, [isAuthenticated, token, userId]);

  const addToQueue = async (song: Song, playNow: boolean = false) => {
    if (!isAuthenticated || !token || !userId) {
      console.error('Yêu cầu đăng nhập để thêm vào hàng đợi', { isAuthenticated, token, userId });
      toast.error('Yêu cầu đăng nhập để thêm vào hàng đợi', {
        style: { background: 'black', color: 'white' },
        action: {
          label: 'Đăng nhập',
          onClick: () => window.location.href = '/login',
        },
      });
      throw new Error('Yêu cầu đăng nhập để thêm vào hàng đợi');
    }
    try {
      console.log('Gửi yêu cầu POST /user/queue/add:', { song_id: song.song_id, playNow });
      const response = await api.post(
        '/user/queue/add',
        { song_id: song.song_id, playNow },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Phản hồi từ POST /user/queue/add:', response.data);
      const { queue_item: newQueueItem } = response.data;
      toast.success(playNow ? 'Đang phát bài hát' : 'Đã thêm bài hát vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });

      if (playNow) {
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
      }
      await fetchQueue();
    } catch (error: any) {
      console.error('Lỗi khi thêm bài hát vào hàng đợi:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể thêm bài hát vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
      throw error;
    }
  };

  const removeFromQueue = async (songId: number) => {
    if (!isAuthenticated || !token || !userId) {
      console.error('Yêu cầu đăng nhập để xóa khỏi hàng đợi', { isAuthenticated, token, userId });
      toast.error('Yêu cầu đăng nhập để xóa khỏi hàng đợi', {
        style: { background: 'black', color: 'white' },
        action: {
          label: 'Đăng nhập',
          onClick: () => window.location.href = '/login',
        },
      });
      return;
    }
    try {
      console.log('Gửi yêu cầu DELETE /user/queue/remove:', { song_id: songId });
      await api.delete(`/user/queue/remove/${songId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Đã xóa bài hát khỏi hàng đợi:', songId);
      toast.success('Đã xóa bài hát khỏi danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
      await fetchQueue();
    } catch (error: any) {
      console.error('Lỗi khi xóa bài hát khỏi hàng đợi:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể xóa bài hát khỏi danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const clearQueue = async () => {
    if (!isAuthenticated || !token || !userId) {
      console.error('Yêu cầu đăng nhập để làm trống hàng đợi', { isAuthenticated, token, userId });
      toast.error('Yêu cầu đăng nhập để làm trống hàng đợi', {
        style: { background: 'black', color: 'white' },
        action: {
          label: 'Đăng nhập',
          onClick: () => window.location.href = '/login',
        },
      });
      return;
    }
    try {
      console.log('Gửi yêu cầu DELETE /user/queue/clear');
      await api.delete('/user/queue/clear', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Đã làm trống danh sách chờ');
      toast.success('Đã làm trống danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
      setQueue([]);
      setCurrentSong(null);
      setCurrentSongIndex(0);
      setArtistName('');
      setPlaylist([]);
    } catch (error: any) {
      console.error('Lỗi khi làm trống danh sách chờ:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể làm trống danh sách chờ', {
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
        clearQueue,
        fetchQueue,
        isQueueNavOpen,
        setIsQueueNavOpen,
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