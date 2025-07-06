/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PlayIcon, ArrowDownTrayIcon, EllipsisHorizontalIcon, QueueListIcon, TrashIcon } from '@heroicons/react/24/solid';
import { HeartIcon, HeartFilledIcon } from '@radix-ui/react-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';
import { AxiosError } from 'axios';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  release_date: string;
  audio_file_url: string;
  img: string;
  artist_id: number;
  artist_name: string;
  feat_artists: { artist_id: number; stage_name: string }[];
  album_name: string | null;
  is_downloadable: boolean;
  created_at: string;
  listen_count: number;
}

interface QueueItem extends Song {
  position: number;
  is_current: boolean;
}

interface PlaylistDetail {
  playlist_id: number;
  title: string;
  img: string | null;
  description: string | null;
  user_id: number;
  username: string;
  song_count: number;
  is_public: boolean;
  like_count: number;
  songs: Song[];
  created_at: string;
}

export const PlaylistDetail: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { userId, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [playlistDetail, setPlaylistDetail] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const { addToQueue, playContent, setPlaylist, setCurrentSongIndex, setArtistName, setIsExpanded } = useAudio();

  const isOwner = userId && playlistDetail && userId === playlistDetail.user_id;

  const generateRandomGradient = () => {
    const colors = ['purple-600', 'blue-600', 'red-600', 'green-600', 'pink-600', 'indigo-600', 'teal-600', 'cyan-600', 'orange-600', 'violet-600'];
    const randomColor1 = colors[Math.floor(Math.random() * colors.length)];
    const randomColor2 = colors[Math.floor(Math.random() * colors.length)];
    return `bg-gradient-to-b from-${randomColor1} to-${randomColor2}`;
  };

  const [gradient, setGradient] = useState(generateRandomGradient());

  useEffect(() => {
    setGradient(generateRandomGradient());

    const fetchPlaylistDetail = async () => {
      if (!playlistId || !userId || !token) {
        setError('Thiếu thông tin cần thiết');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/user/playlists/user/${userId}/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const playlistData: PlaylistDetail = {
          ...response.data.playlist,
          songs: response.data.playlist.songs.map((song: Song) => ({
            ...song,
            img: song.img || '',
            album_name: song.album_name || null,
          })),
        };
        setPlaylistDetail(playlistData);
        setArtistName(playlistData.username);

        if (isAuthenticated && userId !== playlistData.user_id) {
          const likeResponse = await api.get(`/user/like-playlist/${userId}/${playlistId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setHasLiked(likeResponse.data.hasLiked || false);
        } else {
          setHasLiked(false);
        }
      } catch (err: unknown) {
        const error = err as AxiosError<{ message?: string }>;
        console.error('Lỗi khi lấy chi tiết playlist:', error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else if (error.response?.status === 404) {
          setError('Không tìm thấy playlist');
        } else {
          setError('Không thể tải chi tiết playlist');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistDetail();
  }, [playlistId, userId, token, isAuthenticated, setArtistName, navigate]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSongClick = async (song: Song, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      setError('Vui lòng đăng nhập để phát bài hát');
      navigate('/login');
      return;
    }

    try {
      const queueItem: QueueItem = {
        ...song,
        position: index,
        is_current: true
      };
      await addToQueue(queueItem, true);
      const queueItems: QueueItem[] = (playlistDetail?.songs || []).map((s, i) => ({
        ...s,
        position: i,
        is_current: i === index,
        album_name: s.album_name || null,
      }));
      setPlaylist(queueItems);
      setCurrentSongIndex(index);
      setIsExpanded(false);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Lỗi khi phát bài hát:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Không thể phát bài hát');
    }
  };

  const handlePlayPlaylist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      setError('Vui lòng đăng nhập để phát danh sách');
      navigate('/login');
      return;
    }
    if (!playlistDetail?.songs || playlistDetail.songs.length === 0) {
      setError('Danh sách bài hát trống');
      return;
    }

    try {
      const songIds = playlistDetail.songs.map(song => song.song_id);
      await playContent(songIds);
      setIsExpanded(false);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Lỗi khi phát playlist:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Không thể phát danh sách');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!isAuthenticated || !userId || !playlistId) {
      setError('Vui lòng đăng nhập để xóa playlist');
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      await api.delete(`/user/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setIsLoading(false);
        navigate('/');
      }, 1000);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Lỗi khi xóa playlist:', err.response?.data?.message || err.message);
      setTimeout(() => {
        setIsLoading(false);
        setError(err.response?.data?.message || 'Lỗi khi xóa playlist');
      }, 1000);
    }
  };

  const handleLikePlaylist = async () => {
    if (!isAuthenticated || !userId || !playlistId) {
      setError('Vui lòng đăng nhập để thích playlist');
      navigate('/login');
      return;
    }

    try {
      if (hasLiked) {
        await api.delete(`/user/like-playlist/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasLiked(false);
      } else {
        await api.post(`/user/like-playlist/${playlistId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasLiked(true);
      }

      const response = await api.get(`/user/playlists/user/${userId}/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylistDetail({
        ...response.data.playlist,
        songs: response.data.playlist.songs.map((song: Song) => ({
          ...song,
          img: song.img || '',
          album_name: song.album_name || null,
        })),
      });
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Lỗi khi xử lý like/unlike playlist:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Lỗi khi xử lý like/unlike playlist');
    }
  };

  const handleAddToQueueClick = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      setError('Vui lòng đăng nhập để thêm vào danh sách chờ');
      navigate('/login');
      return;
    }
    try {
      console.log('Adding song to queue:', song.song_id, song.title);
      await addToQueue(song, false);
      setError('Đã thêm bài hát vào danh sách chờ');
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Error adding to queue:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Không thể thêm bài hát vào danh sách chờ');
    }
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!playlistDetail) return <div className="text-center">Không tìm thấy playlist</div>;

  const { title, img, description, username, songs, like_count } = playlistDetail;

  return (
    <div className="min-h-screen text-white rounded-lg">
      {loading ? (
        <div className="space-y-4">
          <Skeleton height={200} className="w-full rounded-lg" />
          <Skeleton height={40} className="w-1/2" />
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} height={50} className="w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className={`${gradient} h-64 mb-4 rounded-t-lg`}>
            <div className="flex flex-col h-full">
              <div className="flex gap-4 items-center justify-start flex-1 py-4 px-8">
                <div>
                  {img ? (
                    <img src={img} alt={title} className="w-52 h-52 object-cover rounded-sm" loading="lazy" />
                  ) : (
                    <div className="w-52 h-52 bg-neutral-700 flex items-center justify-center rounded-sm">
                      <span className="text-neutral-400">No Image</span>
                    </div>
                  )}
                </div>
                <div className="h-auto text-start ml-1.5">
                  <h2 className="text-sm text-white font-medium">Playlist</h2>
                  <h1 className="text-8xl font-bold uppercase">{title}</h1>
                  <p className="text-sm text-white font-medium">{description || 'Không có mô tả'}</p>
                  <p className="text-sm text-gray-400">Tạo bởi: {username}</p>
                </div>
              </div>
              <div className="py-2 px-7 flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button onClick={handlePlayPlaylist} className="hover:text-gray-300 active:text-gray-200">
                    <PlayIcon className="w-6 h-6 text-white" />
                  </button>
                  {!isOwner && (
                    <div className="flex items-center space-x-2">
                      <button onClick={handleLikePlaylist} className="hover:text-gray-300 active:text-gray-200 mr-0.5">
                        {hasLiked ? (
                          <HeartFilledIcon className="w-6 h-6 text-red-500" />
                        ) : (
                          <HeartIcon className="w-6 h-6 text-white" />
                        )}
                      </button>
                      <span className="text-sm text-gray-400">{like_count}</span>
                    </div>
                  )}
                  <ArrowDownTrayIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="hover:text-gray-300 active:text-gray-200">
                          <EllipsisHorizontalIcon className="w-6 h-6 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="z-50 bg-neutral-800 text-white border-neutral-700">
                        <DropdownMenuItem
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="hover:bg-neutral-700 focus:bg-neutral-700"
                        >
                          <TrashIcon className="w-5 h-5 mr-2 hover:text-gray-300 active:text-gray-200" />
                          Xóa playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <QueueListIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                  <span className="text-sm text-gray-400">Danh sách</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 pt-8">
            <table className="w-full text-left">
              <tbody>
                {songs.map((song, index) => (
                  <tr
                    key={song.song_id}
                    className="hover:bg-zinc-800 rounded-lg cursor-pointer group"
                    onMouseEnter={() => setHoveredSongId(song.song_id)}
                    onMouseLeave={() => setHoveredSongId(null)}
                  >
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <div className="relative w-12 h-12 mr-4">
                          <img
                            src={song.img}
                            alt={song.title}
                            className={`w-12 h-12 object-cover rounded transition-opacity duration-200 ${
                              hoveredSongId === song.song_id ? 'opacity-75' : 'opacity-100'
                            }`}
                            loading="lazy"
                          />
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                              hoveredSongId === song.song_id ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <button onClick={(e) => handleSongClick(song, index, e)}>
                              <PlayIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white">{song.title}</span>
                          <span className="text-gray-400 text-sm line-clamp-1">
                            <Link
                              to={`/artists/${song.artist_id}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {song.artist_name}
                            </Link>
                            {song.feat_artists.length > 0 && (
                              <span>
                                {' '}feat.{' '}
                                {song.feat_artists.map((featArtist, idx) => (
                                  <span key={featArtist.artist_id}>
                                    <Link
                                      to={`/artists/${featArtist.artist_id}`}
                                      className="hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {featArtist.stage_name}
                                    </Link>
                                    {idx < song.feat_artists.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {song.album_name || 'Đang cập nhật'}
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {formatDuration(song.duration)}
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button>
                            <EllipsisHorizontalIcon className="w-5 h-5 hover:text-gray-300 active:text-gray-200" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="z-50 bg-neutral-800 text-white border-neutral-700">
                          <DropdownMenuItem onClick={(e) => handleAddToQueueClick(song, e)}>
                            Thêm vào danh sách chờ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent variant="dark" className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Xóa Playlist</DialogTitle>
                <DialogDescription>
                  Bạn có chắc muốn xóa playlist "<span className="font-semibold">{title}</span>" không? Hành động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePlaylist}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang xóa..." : "Xóa"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};