/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Activity } from 'react-feather';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/authContext';
import { toast } from 'sonner';
import api from '../../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Định nghĩa interface cho dữ liệu
interface Song {
  song_id: number;
  title: string;
  duration: number;
  audio_file_url: string;
  img: string;
  artist_id: number;
  artist_name: string;
  feat_artists: { artist_id: number; stage_name: string }[];
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

const QueueNav: React.FC = () => {
  const { queue, setCurrentSong, setCurrentSongIndex, setArtistName, fetchQueue, isQueueNavOpen, setIsQueueNavOpen } = useAudio();
  const { isAuthenticated, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectSong = async (item: QueueItem) => {
    if (!isAuthenticated || !token) {
      toast.error('Yêu cầu đăng nhập để phát bài hát', {
        style: { background: 'black', color: 'white' },
        action: {
          label: 'Đăng nhập',
          onClick: () => (window.location.href = '/login'),
        },
      });
      return;
    }

    try {
      console.log('Selecting song from queue:', item.song_id, item.title);
      await api.put(
        '/user/queue/update-current',
        { song_id: item.song_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentSong({
        ...item,
        is_current: true,
      });
      setArtistName(item.artist_name);
      setCurrentSongIndex(queue.findIndex((q) => q.song_id === item.song_id));
      await fetchQueue();
      toast.success(`Đang phát: ${item.title}`, {
        style: { background: 'black', color: 'white' },
      });
    } catch (error: any) {
      console.error('Error updating current song:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể phát bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleRemoveFromQueue = async (songId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !token) {
      console.log('handleRemoveFromQueue: Not authenticated or no token');
      toast.error('Yêu cầu đăng nhập để xóa khỏi hàng đợi', {
        style: { background: 'black', color: 'white' },
        action: {
          label: 'Đăng nhập',
          onClick: () => (window.location.href = '/login'),
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
      console.error('Error removing from queue:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể xóa bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  return (
    <AnimatePresence>
      {isQueueNavOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full h-full bg-neutral-900 text-white overflow-y-auto rounded-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="space-y-4 p-3 w-full">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center space-x-3">
                    <Skeleton height={48} width={48} className="rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton height={16} width={150} />
                      <Skeleton height={12} width={100} />
                    </div>
                    <Skeleton height={20} width={20} className="rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">Danh sách chờ</h3>
                <button
                  onClick={() => setIsQueueNavOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {queue.length > 0 ? (
                <div className="space-y-4">
                  {queue.find((item) => item.is_current) && (
                    <div>
                      <h4 className="text-base font-bold text-white mb-2">Đang phát</h4>
                      <ul className="space-y-2">
                        {queue
                          .filter((item) => item.is_current)
                          .map((item) => (
                            <li
                              key={item.song_id}
                              className="flex items-center justify-between p-3 rounded-lg bg-green-900 cursor-pointer transition-colors"
                              onClick={() => handleSelectSong(item)}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={item.img}
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded"
                                  loading="lazy"
                                />
                                <div className="flex flex-col">
                                  <span className="text-white font-medium line-clamp-1">{item.title}</span>
                                  <span className="text-gray-400 text-sm line-clamp-1">
                                    <Link
                                      to={`/artists/${item.artist_id}`}
                                      className="hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {item.artist_name}
                                    </Link>
                                    {item.feat_artists.length > 0 && (
                                      <span>
                                        {' '}feat.{' '}
                                        {item.feat_artists.map((featArtist, idx) => (
                                          <span key={featArtist.artist_id}>
                                            <Link
                                              to={`/artists/${featArtist.artist_id}`}
                                              className="hover:underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {featArtist.stage_name}
                                            </Link>
                                            {idx < item.feat_artists.length - 1 ? ', ' : ''}
                                          </span>
                                        ))}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={(e) => handleRemoveFromQueue(item.song_id, e)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-white mb-2">Tiếp theo</h4>
                    <ul className="space-y-2">
                      {queue
                        .filter((item) => !item.is_current)
                        .sort((a, b) => a.position - b.position)
                        .map((item) => (
                          <li
                            key={item.song_id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
                            onClick={() => handleSelectSong(item)}
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={item.img}
                                alt={item.title}
                                className="w-12 h-12 object-cover rounded"
                                loading="lazy"
                              />
                              <div className="flex flex-col">
                                <span className="text-white font-medium line-clamp-1">{item.title}</span>
                                <span className="text-gray-400 text-sm line-clamp-1">
                                  <Link
                                    to={`/artists/${item.artist_id}`}
                                    className="hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.artist_name}
                                  </Link>
                                  {item.feat_artists.length > 0 && (
                                    <span>
                                      {' '}feat.{' '}
                                      {item.feat_artists.map((featArtist, idx) => (
                                        <span key={featArtist.artist_id}>
                                          <Link
                                            to={`/artists/${featArtist.artist_id}`}
                                            className="hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {featArtist.stage_name}
                                          </Link>
                                          {idx < item.feat_artists.length - 1 ? ', ' : ''}
                                        </span>
                                      ))}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={(e) => handleRemoveFromQueue(item.song_id, e)}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Activity className="w-16 h-16 text-gray-500 mb-4 animate-spin" />
                  <p className="text-gray-400">Danh sách chờ trống</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QueueNav;