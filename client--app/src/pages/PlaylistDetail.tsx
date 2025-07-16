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
import { Toaster, toast } from "sonner";
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
  const { userId, token, isAuthenticated, is_premium } = useAuth();
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
        console.log('Playlist detail fetched:', playlistData);
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
      toast.error('Vui lòng đăng nhập để phát bài hát', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
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
      toast.error(err.response?.data?.message || 'Không thể phát bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handlePlayPlaylist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để phát danh sách', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    if (!playlistDetail?.songs || playlistDetail.songs.length === 0) {
      toast.error('Danh sách bài hát trống', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }

    try {
      const songIds = playlistDetail.songs.map(song => song.song_id);
      await playContent(songIds);
      setIsExpanded(false);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Lỗi khi phát playlist:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Không thể phát danh sách', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleDeletePlaylist = async () => {
    if (!isAuthenticated || !userId || !playlistId) {
      toast.error('Vui lòng đăng nhập để xóa playlist', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
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
        toast.success('Đã xóa playlist thành công', {
          style: { background: 'black', color: 'white' },
        });
      }, 1000);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Lỗi khi xóa playlist:', err.response?.data?.message || err.message);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(err.response?.data?.message || 'Lỗi khi xóa playlist', {
          style: { background: 'black', color: 'white' },
        });
      }, 1000);
    }
  };

  const handleLikePlaylist = async () => {
    if (!isAuthenticated || !userId || !playlistId) {
      toast.error('Vui lòng đăng nhập để thích playlist', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }

    try {
      if (hasLiked) {
        await api.delete(`/user/like-playlist/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasLiked(false);
        toast.success('Đã bỏ thích playlist', {
          style: { background: 'black', color: 'white' },
        });
      } else {
        await api.post(`/user/like-playlist/${playlistId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasLiked(true);
        toast.success('Đã thích playlist', {
          style: { background: 'black', color: 'white' },
        });
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
      toast.error(err.response?.data?.message || 'Lỗi khi xử lý like/unlike playlist', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleAddToQueueClick = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để thêm vào danh sách chờ', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      console.log('Adding song to queue:', song.song_id, song.title);
      await addToQueue(song, false);
      toast.success('Đã thêm bài hát vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Error adding to queue:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Không thể thêm bài hát vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleDownloadClick = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để tải bài hát', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    if (!is_premium) {
      toast.error('Vui lòng nâng cấp lên tài khoản Premium để tải bài hát', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    if (!song.is_downloadable) {
      toast.error('Bài hát này không thể tải xuống', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      console.log('Downloading song:', song.song_id, song.title);
      const response = await api.get(`/user/songs/${song.song_id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${song.song_id}_${song.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải bài hát thành công', {
        style: { background: 'black', color: 'white' },
      });
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      console.error('Error downloading song:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Không thể tải bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!playlistDetail) return <div className="text-center">Không tìm thấy playlist</div>;

  const { title, img, description, username, songs, like_count } = playlistDetail;

  return (
    <div className="min-h-screen text-white rounded-lg">
      <Toaster richColors position="top-right" />
      {loading ? (
        <div className="space-y-4">
          <Skeleton height={200} className="w-full rounded-lg" />
          <Skeleton height={40} className="w-full sm:w-1/2" />
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} height={50} className="w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className={`${gradient} h-auto sm:h-64 mb-4 rounded-t-lg`}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-start flex-1 py-4 px-4 sm:px-8">
              <div className="flex-shrink-0">
                {img ? (
                  <img src={img} alt={title} className="w-40 h-40 sm:w-52 sm:h-52 object-cover rounded-sm" loading="lazy" />
                ) : (
                  <div className="w-40 h-40 sm:w-52 sm:h-52 bg-neutral-700 flex items-center justify-center rounded-sm">
                    <span className="text-neutral-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-start mt-2 sm:mt-0">
                <h2 className="text-xs sm:text-sm text-white font-medium">Playlist</h2>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold uppercase line-clamp-2">{title}</h1>
                <p className="text-xs sm:text-sm text-white font-medium">{description || 'Không có mô tả'}</p>
                <p className="text-xs sm:text-sm text-gray-400">Tạo bởi: {username}</p>
              </div>
            </div>
            <div className="py-2 px-4 sm:px-7 flex flex-col sm:flex-row items-center justify-between mb-4 space-y-2 sm:space-y-0">
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
                    <span className="text-xs sm:text-sm text-gray-400">{like_count}</span>
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
                <span className="text-xs sm:text-sm text-gray-400">Danh sách</span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 mt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <tbody>
                  {songs.map((song, index) => (
                    <tr
                      key={song.song_id}
                      className="hover:bg-zinc-800 rounded-lg cursor-pointer group"
                      onMouseEnter={() => setHoveredSongId(song.song_id)}
                      onMouseLeave={() => setHoveredSongId(null)}
                    >
                      <td className="py-2 px-2 sm:px-4">
                        <div className="flex items-center">
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 mr-2 sm:mr-4">
                            <img
                              src={song.img}
                              alt={song.title}
                              className={`w-full h-full object-cover rounded transition-opacity duration-200 ${
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
                            <span className="text-sm sm:text-base text-white">{song.title}</span>
                            <span className="text-xs sm:text-sm text-gray-400 line-clamp-1">
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
                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm text-gray-400 hidden sm:table-cell">
                        {song.album_name || 'Đang cập nhật'}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm text-gray-400">
                        {formatDuration(song.duration)}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-gray-400">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button>
                              <EllipsisHorizontalIcon className="w-4 sm:w-5 h-4 sm:h-5 hover:text-gray-300 active:text-gray-200" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="z-50 bg-neutral-800 text-white border-neutral-700">
                            <DropdownMenuItem onClick={(e) => handleAddToQueueClick(song, e)}>
                              Thêm vào danh sách chờ
                            </DropdownMenuItem>
                            {is_premium && song.is_downloadable && (
                              <DropdownMenuItem onClick={(e) => handleDownloadClick(song, e)}>
                                Tải xuống
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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