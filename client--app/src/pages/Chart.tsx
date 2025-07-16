/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PlayIcon, EllipsisHorizontalIcon, QueueListIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import * as Tooltip from '@radix-ui/react-tooltip';
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
  rank: number;
  rank_change: string; // Đổi sang string để khớp với backend
}

interface ChartData {
  image: string;
  color: string;
  description: string;
  total_songs: number;
  songs: Song[];
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

const formatRankChange = (rankChange: string) => {
  let tooltipText = '';
  if (rankChange === 'new') {
    tooltipText = 'Bài hát mới trong bảng xếp hạng';
    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="text-green-500 font-semibold">New</span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="bg-neutral-800 text-white text-xs p-2 rounded shadow-lg" sideOffset={5}>
              {tooltipText}
              <Tooltip.Arrow className="fill-neutral-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  } else if (rankChange === '0') {
    tooltipText = 'Không thay đổi thứ hạng';
    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="text-gray-400">-</span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="bg-neutral-800 text-white text-xs p-2 rounded shadow-lg" sideOffset={5}>
              {tooltipText}
              <Tooltip.Arrow className="fill-neutral-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  } else if (rankChange.startsWith('+')) {
    tooltipText = `Tăng ${rankChange.slice(1)} hạng so với 5 phút trước`;
    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="text-green-500 flex items-center">
              <ArrowUpIcon className="w-4 h-4 mr-1" /> {rankChange.slice(1)}
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="bg-neutral-800 text-white text-xs p-2 rounded shadow-lg" sideOffset={5}>
              {tooltipText}
              <Tooltip.Arrow className="fill-neutral-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  } else if (rankChange.startsWith('-')) {
    tooltipText = `Giảm ${rankChange.slice(1)} hạng so với 5 phút trước`;
    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="text-red-500 flex items-center">
              <ArrowDownIcon className="w-4 h-4 mr-1" /> {rankChange.slice(1)}
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="bg-neutral-800 text-white text-xs p-2 rounded shadow-lg" sideOffset={5}>
              {tooltipText}
              <Tooltip.Arrow className="fill-neutral-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="text-gray-400">-</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-neutral-800 text-white text-xs p-2 rounded shadow-lg" sideOffset={5}>
            Không có dữ liệu thay đổi thứ hạng
            <Tooltip.Arrow className="fill-neutral-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export const Chart: React.FC = () => {
  const navigate = useNavigate();
  const [chart, setChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { addToQueue, setPlaylist, setCurrentSongIndex, playContent } = useAudio();
  const { isAuthenticated, userId, token, is_premium } = useAuth();

  useEffect(() => {
    const fetchChart = async () => {
      setLoading(true);
      try {
        console.log('Fetching chart data');
        const response = await api.get('/public/ranking/top-songs');
        const chartData = response.data.data;
        console.log('Chart data fetched:', chartData);
        setChart(chartData);
        document.title = `Bảng xếp hạng - ${APP_NAME}`;
      } catch (err: any) {
        console.error('Error fetching chart:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy bảng xếp hạng');
        } else {
          setError('Không thể tải bảng xếp hạng');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChart();
  }, []);

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
      toast.error(err.response?.data?.message || 'Không thể thêm bài hát vào playlist', {
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
      const queueItems: QueueItem[] = (chart?.songs || []).map((s, i) => ({
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
    if (!chart?.songs || chart.songs.length === 0) {
      toast.error('Danh sách bài hát rỗng', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      const songIds = chart.songs.map(song => song.song_id);
      console.log('Handling play content with song_ids:', songIds);
      await playContent(songIds);
    } catch (error: any) {
      console.error('Error playing content:', error);
      toast.error(error.response?.data?.message || 'Không thể phát danh sách', {
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
    } catch (error: any) {
      console.error('Error downloading song:', error);
      toast.error(error.response?.data?.message || 'Không thể tải bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  if (error) return <div className="text-red-500 text-center p-4">Lỗi: {error}</div>;
  if (!chart) return <div className="text-center p-4">Không tìm thấy bảng xếp hạng</div>;

  const { image, description, total_songs, songs } = chart;

  return (
    <div className="min-h-screen text-white rounded-lg">
      <Toaster richColors position="top-right" />
      {loading ? (
        <div className="space-y-4">
          <Skeleton height={200} className="w-full rounded-lg" />
          <Skeleton height={40} className="w-full sm:w-1/2" />
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} height={50} className="w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className={`bg-gradient-to-b from-purple-600 to-neutral-900 h-auto sm:h-64 mb-4 rounded-t-lg flex flex-col`}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-start flex-1 py-4 px-4 sm:px-8">
              <div className="flex-shrink-0">
                {image ? (
                  <img
                    src={image}
                    alt="Chart"
                    className="w-40 h-40 sm:w-50 sm:h-50 object-cover rounded-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-50 sm:h-50 bg-neutral-700 flex items-center justify-center rounded-sm">
                    <span className="text-neutral-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-start mt-2 sm:mt-0">
                <h2 className="text-xs sm:text-sm text-white">Bảng xếp hạng</h2>
                <h1 className="text-4xl sm:text-6xl md:text-6xl font-bold uppercase line-clamp-2">Bài hát hàng đầu tại Toàn Cầu</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  {description} • {total_songs} bài hát
                </p>
              </div>
            </div>
            <div className="py-2 px-4 sm:px-7 flex flex-col sm:flex-row items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <button onClick={handlePlayContent} className="hover:text-gray-300 active:text-gray-200">
                  <PlayIcon className="w-6 h-6 text-white" />
                </button>
                <EllipsisHorizontalIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
              </div>
              <div className="flex items-center space-x-2">
                <QueueListIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                <span className="text-xs sm:text-sm text-gray-400">Danh sách bài hát</span>
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
                      <td className="py-2 px-2 sm:px-4 w-16">
                        <div className="flex items-center">
                          <span className="text-gray-400 w-6 text-center">{song.rank}</span>
                          <span className="text-gray-400 w-12 text-center">{formatRankChange(song.rank_change)}</span>
                        </div>
                      </td>
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
                        {song.listen_count.toLocaleString()}
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