/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Clock, Play, Download, MoreHorizontal, List, Trash2 } from 'react-feather';
import { Toaster, toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  release_date: string;
  audio_file_url: string;
  img: string;
  artist_id: number;
  artist_name: string;
  feat_artists: string[];
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
  songs: Song[];
  created_at: string;
}

export const PlaylistDetail: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { userId, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [playlistDetail, setPlaylistDetail] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { addToQueue, playContent, setPlaylist, setCurrentSongIndex, setArtistName, setIsExpanded } = useAudio();

  // Function to generate random gradient
  const generateRandomGradient = () => {
    const colors = [
      'purple-600', 'blue-600', 'red-600', 'green-600', 'pink-600', 
      'indigo-600', 'teal-600', 'cyan-600', 'orange-600', 'violet-600'
    ];
    const randomColor1 = colors[Math.floor(Math.random() * colors.length)];
    const randomColor2 = colors[Math.floor(Math.random() * colors.length)];
    return `bg-gradient-to-b from-${randomColor1} to-${randomColor2}`;
  };

  const [gradient, setGradient] = useState<string>(generateRandomGradient());

  useEffect(() => {
    // Update gradient on component mount
    setGradient(generateRandomGradient());

    const fetchPlaylistDetail = async () => {
      console.log('PlaylistDetail: Trạng thái xác thực:', { isAuthenticated, userId, token, playlistId });

      if (!playlistId) {
        console.log('PlaylistDetail: playlistId không hợp lệ');
        setError('ID playlist không hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/user/playlists/user/${userId}/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('PlaylistDetail: Phản hồi từ API:', response.data);
        const playlistData = {
          ...response.data.playlist,
          songs: response.data.playlist.songs.map((song: any) => ({
            ...song,
            img: song.img || ''
          }))
        };
        setPlaylistDetail(playlistData);
        setArtistName(playlistData.username);
      } catch (err: any) {
        console.error('PlaylistDetail: Lỗi khi lấy chi tiết playlist:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else if (err.response?.status === 404) {
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
      console.log('Handling song click:', { song_id: song.song_id, title: song.title });
      await addToQueue(song, true); // Phát ngay bài hát
      // Chuyển đổi songs thành QueueItem[] cho setPlaylist
      const queueItems: QueueItem[] = (playlistDetail?.songs || []).map((s, i) => ({
        ...s,
        position: i + 1, // Gán position dựa trên thứ tự trong danh sách
        is_current: i === index, // Chỉ bài hát được chọn là is_current
      }));
      setPlaylist(queueItems);
      setCurrentSongIndex(index); // Sử dụng index thực tế của bài hát
      setIsExpanded(false);
    } catch (error: any) {
      console.error('Error playing song:', error);
      toast.error(error.response?.data?.message || 'Không thể phát bài hát', {
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
      console.log('Handling play playlist with song_ids:', songIds);
      await playContent(songIds);
      setIsExpanded(false);
    } catch (error: any) {
      console.error('Error playing playlist:', error);
      toast.error(error.response?.data?.message || 'Không thể phát danh sách', {
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
        toast.success(`Xóa playlist "${playlistDetail?.title}" thành công`, {
          style: { background: 'black', color: 'white' },
        });
        navigate('/'); // Điều hướng về trang chính sau khi xóa
      }, 1000);
    } catch (error: any) {
      console.error('Lỗi khi xóa playlist:', error);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(error.response?.data?.message || 'Lỗi khi xóa playlist', {
          style: { background: 'black', color: 'white' },
        });
      }, 1000);
    }
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!playlistDetail) return <div className="text-center">Không tìm thấy playlist</div>;

  const { title, img, description, username, songs } = playlistDetail;

  return (
    <div className="min-h-screen text-white rounded-lg">
      <Toaster richColors position="top-right" />
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
                  <div className="flex flex-col justify-start items-center">
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        className="w-52 h-52 object-contain rounded-sm"
                      />
                    ) : (
                      <div className="w-52 h-52 bg-neutral-700 flex items-center justify-center rounded-sm">
                        <span className="text-neutral-400">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-auto text-start ml-1.5">
                  <h2 className="text-sm text-white">Playlist</h2>
                  <h1 className="text-8xl font-bold uppercase">{title}</h1>
                  <p className="text-sm text-white">{description || 'Không có mô tả'}</p>
                  <p className="text-sm text-gray-400">Tạo bởi: {username}</p>
                </div>
              </div>
              <div className="py-2 px-7 flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button onClick={handlePlayPlaylist}>
                    <Play className="w-6 h-6 text-white" />
                  </button>
                  <Download className="w-6 h-6 text-white" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button>
                        <MoreHorizontal className="w-6 h-6 text-white" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-50 bg-neutral-800 text-white border-neutral-700">
                      <DropdownMenuItem
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="hover:bg-neutral-700 focus:bg-neutral-700"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Xóa playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center space-x-2">
                  <List className="w-6 h-6 text-white" />
                  <span className="text-sm text-gray-400">Danh sách</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 pt-8">
            <table className="w-full text-left">
              <thead className="border-b border-gray-600">
                <tr>
                  <th className="py-2 px-4 text-gray-300 w-16">#</th>
                  <th className="py-2 px-4 text-gray-300">Tiêu đề</th>
                  <th className="py-2 px-4 text-gray-300">Album</th>
                  <th className="py-2 px-4 text-gray-300">Lượt nghe</th>
                  <th className="py-2 px-4 text-gray-300 w-24">
                    <Clock className="inline-block w-5 h-5" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song, index) => (
                  <tr
                    key={song.song_id}
                    className="hover:bg-zinc-800 rounded-lg cursor-pointer"
                    onMouseEnter={() => setHoveredSongId(song.song_id)}
                    onMouseLeave={() => setHoveredSongId(null)}
                    onClick={(e) => handleSongClick(song, index, e)}
                  >
                    <td className="py-2 px-4 text-gray-400">
                      {hoveredSongId === song.song_id ? (
                        <button onClick={(e) => handleSongClick(song, index, e)}>
                          <Play className="w-5 h-5" />
                        </button>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        {song.img ? (
                          <img
                            src={song.img}
                            alt={song.title}
                            className="w-12 h-12 object-cover mr-4 rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-700 flex items-center justify-center mr-4 rounded">
                            <span className="text-neutral-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-white">{song.title}</span>
                          <span className="text-gray-400 text-sm">
                            {song.artist_name}
                            {song.feat_artists.length > 0 && (
                              <span> feat. {song.feat_artists.join(', ')}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {song.album_name || 'Đang cập nhật'}
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {song.listen_count || 'Đang cập nhật'}
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {formatDuration(song.duration)}
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
                  Bạn có chắc muốn xóa playlist "<span className="font-semibold">{playlistDetail?.title}</span>" không? Hành động này không thể hoàn tác.
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