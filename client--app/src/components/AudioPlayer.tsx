import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { X, Maximize, Minimize, Trash2 } from 'react-feather';
import './AudioPlayer.css';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';
import api from '../services/api';
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

interface AudioPlayerProps {
  song: Song | null;
  onClose: () => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const AudioPlayerComponent: React.FC<AudioPlayerProps> = ({ song, onClose, isExpanded, setIsExpanded }) => {
  const { setCurrentSong, setCurrentSongIndex, setPlaylist, setQueue, queue, removeFromQueue, setArtistName } = useAudio();
  const { isAuthenticated, token } = useAuth();
  const hasIncrementedRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<AudioPlayer>(null);

  // Đặt lại trạng thái khi đăng xuất
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User logged out, resetting audio state');
      setCurrentSong(null);
      setPlaylist([]);
      setCurrentSongIndex(0);
      setIsExpanded(false);
      setQueue([]);
      setArtistName('');
      if (audioPlayerRef.current?.audio.current) {
        console.log('Pausing and resetting audio player');
        audioPlayerRef.current.audio.current.pause();
        audioPlayerRef.current.audio.current.currentTime = 0;
      }
    }
  }, [isAuthenticated, setCurrentSong, setPlaylist, setCurrentSongIndex, setIsExpanded, setQueue, setArtistName]);

  // Cập nhật tiêu đề và tăng lượt nghe
  useEffect(() => {
    if (!song) {
      console.log('No song, resetting document title');
      document.title = 'Music App';
      return;
    }

    console.log('Updating document title for song:', song.song_id, song.title);
    const artistString = song.feat_artists.length > 0
      ? `${song.artist_name}, ${song.feat_artists.join(', ')}`
      : song.artist_name;
    document.title = `${song.title} - ${artistString}`;

    const timer = setTimeout(async () => {
      if (song.song_id !== hasIncrementedRef.current) {
        try {
          console.log('Incrementing listen count for song:', song.song_id);
          await api.post(`/public/listen/song/${song.song_id}`);
          hasIncrementedRef.current = song.song_id;
          console.log('Listen count incremented for song:', song.song_id);
        } catch (error) {
          console.error('Error incrementing listen count:', error);
        }
      }
    }, 3000);

    return () => {
      console.log('Cleaning up document title and timer');
      document.title = 'Music App';
      clearTimeout(timer);
    };
  }, [song]);

  // Kích hoạt phát tự động khi currentSong thay đổi
  useEffect(() => {
    if (song && audioPlayerRef.current?.audio.current) {
      console.log('Song changed, updating audio source:', song.song_id, song.audio_file_url);
      if (audioPlayerRef.current.audio.current.src !== song.audio_file_url) {
        audioPlayerRef.current.audio.current.src = song.audio_file_url;
        console.log('Set audio source to:', song.audio_file_url);
        audioPlayerRef.current.audio.current.play().catch(error => {
          console.error('Error playing song:', song.song_id, error);
          toast.error('Không thể phát bài hát tự động', {
            style: { background: 'black', color: 'white' },
          });
        });
      } else {
        console.log('Audio source unchanged, skipping update');
      }
    }
  }, [song]);

  // Tái tải hàng đợi từ server
  const fetchQueue = async () => {
    if (!isAuthenticated || !token) {
      console.log('Not authenticated or no token, skipping fetchQueue');
      return;
    }
    try {
      console.log('Fetching queue for user');
      const response = await api.get('/user/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Queue fetched:', response.data.queue);
      const sortedQueue = response.data.queue.sort((a: QueueItem, b: QueueItem) => a.position - b.position);
      setQueue(sortedQueue);
      const currentItem = sortedQueue.find((item: QueueItem) => item.is_current);
      if (currentItem) {
        console.log('Found current song in queue:', currentItem.song_id, currentItem.title);
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
      } else {
        console.log('No current song in queue, resetting');
        setCurrentSong(null);
        setCurrentSongIndex(0);
        setArtistName('');
      }
    } catch (error: any) {
      console.error('Error fetching queue:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Xử lý phát bài tiếp theo khi kết thúc bài hiện tại
  const handleEnded = async () => {
    if (!isAuthenticated || !token || !song) {
      console.log('handleEnded: Not authenticated, no token, or no song');
      return;
    }
    try {
      console.log('Song ended:', song.song_id, song.title);
      const response = await api.post(
        '/user/queue/next',
        { fromEnded: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Response from POST /user/queue/next:', response.data);
      const { currentSong: nextSong, queue: updatedQueue } = response.data;
      console.log('Next song:', nextSong, 'Updated queue:', updatedQueue);
      setQueue(updatedQueue.sort((a: QueueItem, b: QueueItem) => a.position - b.position));
      if (nextSong) {
        console.log('Setting next song:', nextSong.song_id, nextSong.title);
        setCurrentSong({
          song_id: nextSong.song_id,
          title: nextSong.title,
          duration: nextSong.duration,
          audio_file_url: nextSong.audio_file_url,
          img: nextSong.img,
          artist_id: nextSong.artist_id || 0,
          artist_name: nextSong.artist_name,
          feat_artists: nextSong.feat_artists,
          album_name: nextSong.album_name,
        });
        setCurrentSongIndex(updatedQueue.findIndex((item: QueueItem) => item.is_current));
        setArtistName(nextSong.artist_name);
      } else {
        console.log('Queue empty after song ended');
        setCurrentSong(null);
        setCurrentSongIndex(0);
        setArtistName('');
      }
    } catch (error: any) {
      console.error('Error in handleEnded:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể phát bài tiếp theo', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Xử lý phát bài tiếp theo
  const handleNext = async () => {
    if (!isAuthenticated || !token) {
      console.log('handleNext: Not authenticated or no token');
      toast.error('Yêu cầu đăng nhập để phát bài tiếp theo', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      console.log('Sending POST /user/queue/next, current song:', song?.song_id, song?.title);
      const response = await api.post(
        '/user/queue/next',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Response from POST /user/queue/next:', response.data);
      const { currentSong: nextSong, queue: updatedQueue } = response.data;
      console.log('Next song:', nextSong, 'Updated queue:', updatedQueue);
      setQueue(updatedQueue.sort((a: QueueItem, b: QueueItem) => a.position - b.position));
      if (nextSong) {
        console.log('Setting next song:', nextSong.song_id, nextSong.title);
        setCurrentSong({
          song_id: nextSong.song_id,
          title: nextSong.title,
          duration: nextSong.duration,
          audio_file_url: nextSong.audio_file_url,
          img: nextSong.img,
          artist_id: nextSong.artist_id || 0,
          artist_name: nextSong.artist_name,
          feat_artists: nextSong.feat_artists,
          album_name: nextSong.album_name,
        });
        setCurrentSongIndex(updatedQueue.findIndex((item: QueueItem) => item.is_current));
        setArtistName(nextSong.artist_name);
      } else {
        console.log('Queue empty after next song');
        setCurrentSong(null);
        setCurrentSongIndex(0);
        setArtistName('');
      }
    } catch (error: any) {
      console.error('Error in handleNext:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể phát bài tiếp theo', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Xử lý phát bài trước đó
  const handlePrevious = async () => {
    if (!isAuthenticated || !token) {
      console.log('handlePrevious: Not authenticated or no token');
      toast.error('Yêu cầu đăng nhập để phát bài trước đó', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      console.log('Sending POST /user/queue/previous, current song:', song?.song_id, song?.title);
      const response = await api.post(
        '/user/queue/previous',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Response from POST /user/queue/previous:', response.data);
      const { currentSong: prevSong, queue: updatedQueue } = response.data;
      console.log('Previous song:', prevSong, 'Updated queue:', updatedQueue);
      setQueue(updatedQueue.sort((a: QueueItem, b: QueueItem) => a.position - b.position));
      if (prevSong) {
        console.log('Setting previous song:', prevSong.song_id, prevSong.title);
        setCurrentSong({
          song_id: prevSong.song_id,
          title: prevSong.title,
          duration: prevSong.duration,
          audio_file_url: prevSong.audio_file_url,
          img: prevSong.img,
          artist_id: prevSong.artist_id || 0,
          artist_name: prevSong.artist_name,
          feat_artists: prevSong.feat_artists,
          album_name: prevSong.album_name,
        });
        setCurrentSongIndex(updatedQueue.findIndex((item: QueueItem) => item.is_current));
        setArtistName(prevSong.artist_name);
      } else {
        console.log('No previous song available');
        setCurrentSong(null);
        setCurrentSongIndex(0);
        setArtistName('');
      }
    } catch (error: any) {
      console.error('Error in handlePrevious:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể phát bài trước đó', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!song) {
    console.log('No song to render, returning null');
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 left-0 right-0 bottom-24 bg-black text-white z-50 overflow-y-auto"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{song.title}</h2>
                <button
                  className="text-white hover:scale-110 transition-transform"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize size={24} />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center flex-1">
                <img
                  src={song.img}
                  alt={song.title}
                  className="w-64 h-64 object-cover rounded-lg mb-6 border-4 border-gradient-to-r from-purple-500 to-blue-400"
                />
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white drop-shadow-lg">{song.title}</h3>
                  <p className="text-gray-400">
                    {song.artist_name}
                    {song.feat_artists.length > 0 ? ` feat. ${song.feat_artists.join(', ')}` : ''}
                  </p>
                  {song.album_name && (
                    <p className="text-gray-400">{song.album_name}</p>
                  )}
                </div>
                <div className="w-full mt-6">
                  <h3 className="text-lg font-semibold mb-4">Danh sách chờ</h3>
                  {queue.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-semibold text-white mb-2">Tiếp theo</h4>
                        <ul className="space-y-2">
                          {queue
                            .filter(item => !item.is_current)
                            .sort((a, b) => a.position - b.position)
                            .map(item => (
                              <li
                                key={item.queue_id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
                                onClick={async () => {
                                  try {
                                    console.log('Selecting song from queue:', item.song_id, item.title);
                                    await api.put(
                                      '/user/queue/update-current',
                                      { song_id: item.song_id },
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    console.log('Updated current song:', item.song_id);
                                    await fetchQueue();
                                  } catch (error: any) {
                                    console.error('Error updating current song:', error.response?.data || error.message);
                                    toast.error(error.response?.data?.message || 'Không thể phát bài hát', {
                                      style: { background: 'black', color: 'white' },
                                    });
                                  }
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-gray-400 w-8 text-center">{item.position}</span>
                                  <img
                                    src={item.img}
                                    alt={item.title}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-white font-medium">{item.title}</span>
                                    <span className="text-gray-400 text-sm">
                                      {item.artist_name}
                                      {item.feat_artists.length > 0 ? ` feat. ${item.feat_artists.join(', ')}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-gray-400">{formatDuration(item.duration)}</span>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        console.log('Removing song from queue:', item.song_id, item.title);
                                        await removeFromQueue(item.song_id);
                                        console.log('Song removed, fetching updated queue');
                                        await fetchQueue();
                                      } catch (error: any) {
                                        console.error('Error removing from queue:', error.response?.data || error.message);
                                        toast.error(error.response?.data?.message || 'Không thể xóa bài hát', {
                                          style: { background: 'black', color: 'white' },
                                        });
                                      }
                                    }}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center">Danh sách chờ trống</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 bg-black shadow-2xl z-50 h-24 grid grid-cols-12 items-center p-2">
        <div className="col-span-3 flex items-center space-x-3 ml-3">
          <img
            src={song.img}
            alt={song.title}
            className="w-16 h-16 object-cover rounded-md"
          />
          <div className="text-white">
            <h3 className="text-sm font-bold truncate">{song.title}</h3>
            <p className="text-xs text-gray-300 truncate">
              {song.artist_name}
              {song.feat_artists.length > 0 ? ` feat. ${song.feat_artists.join(', ')}` : ''}
            </p>
          </div>
        </div>
        <div className="col-span-6 flex items-center justify-center">
          <AudioPlayer
            ref={audioPlayerRef}
            src={song.audio_file_url}
            autoPlay={true}
            showSkipControls={true}
            showJumpControls={false}
            onClickPrevious={handlePrevious}
            onClickNext={handleNext}
            onEnded={handleEnded}
            layout="stacked"
            volume={0.5}
            className="rhap-custom-mini"
          />
        </div>
        <div className="col-span-3 flex items-center justify-end space-x-3 mr-3">
          <button
            className="text-white hover:scale-110 transition-transform"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <X
            className="w-5 h-5 text-white cursor-pointer hover:scale-110 transition-transform"
            onClick={onClose}
          />
        </div>
      </div>
    </>
  );
};

export default AudioPlayerComponent;