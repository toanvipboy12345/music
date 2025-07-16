/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PlayIcon, ArrowDownTrayIcon, EllipsisHorizontalIcon, QueueListIcon } from '@heroicons/react/24/solid';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import api from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';

// Khai báo tên ứng dụng
const APP_NAME = 'Spotyfi';

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

interface RelatedGenre {
  genre_id: number;
  name: string;
  img: string | null;
}

interface Genre {
  genre_id: number;
  name: string;
  img: string | null;
  song_count: number;
  total_duration: number;
  songs: Song[];
  related_genres: RelatedGenre[];
  created_at: string;
}

interface QueueItem extends Song {
  position: number;
  is_current: boolean;
}

interface Playlist {
  playlist_id: number;
  title: string;
  img: string | null;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const GenreDetail: React.FC = () => {
  const { genre_id } = useParams<{ genre_id: string }>();
  const navigate = useNavigate();
  const [genre, setGenre] = useState<Genre | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { addToQueue, setPlaylist, setCurrentSongIndex, setArtistName, playContent } = useAudio();
  const { isAuthenticated, userId, token, is_premium } = useAuth();

  const generateRandomGradient = () => {
    const colors = [
      'purple-600', 'blue-600', 'red-600', 'green-600', 'pink-600',
      'indigo-600', 'teal-600', 'cyan-600', 'orange-600', 'violet-600'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `bg-gradient-to-b from-${randomColor} to-neutral-900`;
  };

  const [gradient, setGradient] = useState<string>(generateRandomGradient());

  useEffect(() => {
    setGradient(generateRandomGradient());

    const fetchGenreDetail = async () => {
      if (!genre_id) {
        setError('ID thể loại không hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching genre detail for genre_id:', genre_id);
        const response = await api.get(`/public/explore/genres/${genre_id}/songs`);
        const genreData = {
          ...response.data.genre,
          songs: response.data.songs || [],
          related_genres: response.data.related_genres || []
        };
        console.log('Genre detail fetched:', genreData);
        setGenre(genreData);
        setArtistName(genreData.name || '');
        if (genreData.name) {
          document.title = `${genreData.name} - ${APP_NAME}`;
        }
      } catch (err: any) {
        console.error('Error fetching genre:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy thể loại');
        } else {
          setError('Không thể tải chi tiết thể loại');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGenreDetail();
  }, [genre_id, setArtistName]);

  const fetchUserPlaylists = async () => {
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để thêm bài hát vào playlist', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      console.log('Fetching playlists for userId:', userId);
      const response = await api.get(`/user/playlists/user/${userId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(response.data.playlists || []);
    } catch (err: any) {
      console.error('Error fetching playlists:', err);
      toast.error('Không thể tải danh sách playlist', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleAddSongToPlaylist = async (playlistId: number) => {
    if (!selectedSongId) return;
    try {
      console.log('Adding song to playlist:', { playlistId, songId: selectedSongId, userId });
      await api.post(`/user/playlists/${playlistId}/songs`, {
        song_id: selectedSongId,
        user_id: userId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã thêm bài hát vào playlist', {
        style: { background: 'black', color: 'white' },
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error adding song to playlist:', err);
      toast.error('Không thể thêm bài hát vào playlist', {
        style: { background: 'black', color: 'white' },
      });
    }
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
      console.log('Handling song click:', { song_id: song.song_id, title: song.title });
      await addToQueue(song, true);
      const queueItems: QueueItem[] = (genre?.songs || []).map((s, i) => ({
        ...s,
        position: i + 1,
        is_current: i === index,
      }));
      setPlaylist(queueItems);
      setCurrentSongIndex(index);
    } catch (error: any) {
      console.error('Error playing song:', error);
      toast.error(error.response?.data?.message || 'Không thể phát bài hát', {
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
    } catch (error: any) {
      console.error('Error adding to queue:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm bài hát vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleAddToPlaylistClick = (songId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSongId(songId);
    fetchUserPlaylists();
    setIsModalOpen(true);
  };

  const handlePlayContent = async (e: React.MouseEvent) => {
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
    if (!genre?.songs || genre.songs.length === 0) {
      toast.error('Danh sách bài hát trống', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      const songIds = genre.songs.map(song => song.song_id);
      console.log('Handling play content with song_ids:', songIds);
      await playContent(songIds);
    } catch (error: any) {
      console.error('Error playing content:', error);
      toast.error(error.response?.data?.message || 'Không thể phát danh sách', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleRelatedGenreClick = (genre: RelatedGenre) => {
    navigate(`/explore/genres/${genre.genre_id}/songs`);
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
    } catch (error: any) {
      console.error('Error downloading song:', error);
      toast.error(error.response?.data?.message || 'Không thể tải bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  if (error) return <div className="text-red-500 text-center p-4">Lỗi: {error}</div>;
  if (!genre) return <div className="text-center p-4">Không tìm thấy thể loại</div>;

  const { name, img, song_count, total_duration, songs, related_genres } = genre;

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
          <div className={`${gradient} h-auto sm:h-64 mb-4 rounded-t-lg flex flex-col`}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-start flex-1 py-4 px-4 sm:px-8">
              <div className="flex-shrink-0">
                {img ? (
                  <img
                    src={img}
                    alt={name}
                    className="w-40 h-40 sm:w-52 sm:h-52 object-cover rounded-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-52 sm:h-52 bg-neutral-700 flex items-center justify-center rounded-sm">
                    <span className="text-neutral-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-start mt-2 sm:mt-0">
                <h2 className="text-xs sm:text-sm text-white">Thể loại</h2>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold uppercase line-clamp-2">{name}</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  {song_count} bài hát • {formatDuration(total_duration)}
                </p>
              </div>
            </div>
            <div className="py-2 px-4 sm:px-7 flex flex-col sm:flex-row items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <button onClick={handlePlayContent} className="hover:text-gray-300 active:text-gray-200">
                  <PlayIcon className="w-6 h-6 text-white" />
                </button>
                <ArrowDownTrayIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                <EllipsisHorizontalIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
              </div>
              <div className="flex items-center space-x-2">
                <QueueListIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                <span className="text-xs sm:text-sm text-gray-400">Danh sách bài hát</span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
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
                            {song.img ? (
                              <img
                                src={song.img}
                                alt={song.title}
                                className={`w-full h-full object-cover rounded transition-opacity duration-200 ${
                                  hoveredSongId === song.song_id ? 'opacity-75' : 'opacity-100'
                                }`}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-neutral-700 flex items-center justify-center rounded">
                                <span className="text-neutral-400 text-xs">No Image</span>
                              </div>
                            )}
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
                            <span className="text-white text-sm sm:text-base">{song.title}</span>
                            <span className="text-gray-400 text-xs sm:text-sm">
                              <Link
                                to={`/artists/${song.artist_id}`}
                                className="hover:underline"
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
                      <td className="py-2 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">
                        {song.album_name || 'Đang cập nhật'}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-gray-400 hidden md:table-cell">
                        {song.listen_count || 'Đang cập nhật'}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-gray-400">
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
                            <DropdownMenuItem onClick={(e) => handleSongClick(song, index, e)}>
                              Phát bài hát
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleAddToQueueClick(song, e)}>
                              Thêm vào danh sách chờ
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleAddToPlaylistClick(song.song_id, e)}>
                              Thêm vào playlist
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
            {related_genres.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">Thể loại liên quan</h2>
                <div className="flex flex-wrap gap-2">
                  {related_genres.map((relatedGenre) => (
                    <div
                      key={relatedGenre.genre_id}
                      className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleRelatedGenreClick(relatedGenre)}
                    >
                      <img
                        src={relatedGenre.img || 'https://via.placeholder.com/144'}
                        alt={relatedGenre.name}
                        className="w-32 h-32 sm:w-36 sm:h-36 rounded mb-2 object-cover"
                        loading="lazy"
                      />
                      <div className="text-center">
                        <span className="text-white font-medium text-sm sm:text-base w-full line-clamp-2">
                          {relatedGenre.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent variant="dark" className="max-w-[90vw] sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Chọn Playlist</DialogTitle>
              </DialogHeader>
              <DialogDescription id="dialog-description" className="text-sm text-gray-400 mb-6">
                Chọn một playlist để thêm bài hát vào danh sách phát của bạn.
              </DialogDescription>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <button
                      key={playlist.playlist_id}
                      onClick={() => handleAddSongToPlaylist(playlist.playlist_id)}
                      className="bg-neutral-900 hover:bg-neutral-800 transition-colors duration-200 rounded-lg p-4 flex items-center gap-4 border border-gray-700 hover:border-gray-600"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                        {playlist.img ? (
                          <img
                            src={playlist.img}
                            alt={playlist.title}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-lg">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                      <span className="text-white text-base sm:text-lg font-semibold truncate flex-1">{playlist.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-400 col-span-1 sm:col-span-2">
                    <p>Không có playlist nào. Vui lòng tạo playlist trong phần quản lý để sử dụng chức năng này.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};