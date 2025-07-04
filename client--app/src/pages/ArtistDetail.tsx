/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import api from '../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Clock, Play, MoreHorizontal, List } from 'react-feather';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';

// Định nghĩa interface cho dữ liệu ca sĩ
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

interface Album {
  album_id: number;
  title: string;
  img: string | null;
}

interface Artist {
  artist_id: number;
  stage_name: string;
  profile_picture: string | null;
  total_listen_count: number;
  albums: Album[];
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

// Hàm định dạng thời lượng bài hát
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export  const ArtistDetail: React.FC = () => {
  const { artist_id } = useParams<{ artist_id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { addToQueue, setPlaylist, setCurrentSongIndex, setArtistName, setIsExpanded } = useAudio();
  const { isAuthenticated, userId, token } = useAuth();

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

  // Gọi API để lấy chi tiết ca sĩ
  useEffect(() => {
    // Update gradient on component mount
    setGradient(generateRandomGradient());

    const fetchArtistDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/public/artists/${artist_id}/detail`);
        const artistData = {
          ...response.data.artist,
          albums: response.data.artist.albums || [], // Gán mảng rỗng nếu undefined
          songs: response.data.artist.songs || []   // Gán mảng rỗng nếu undefined
        };
        setArtist(artistData);
        setArtistName(artistData.stage_name || '');
      } catch (error: any) {
        console.error('Error fetching artist details:', error);
        toast.error(error.response?.data?.message || 'Không thể tải thông tin ca sĩ', {
          style: { background: 'black', color: 'white' },
        });
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistDetails();
  }, [artist_id, setArtistName]);

  // Lấy danh sách playlist của người dùng
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

  // Xử lý thêm bài hát vào playlist
  const handleAddSongToPlaylist = async (playlistId: number) => {
    if (!selectedSongId) return;
    try {
      await api.post(`/user/playlists/${playlistId}/songs`, {
        song_id: selectedSongId,
        user_id: userId,
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

  // Xử lý phát bài hát
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
      const queueItems: QueueItem[] = (artist?.songs || []).map((s, i) => ({
        ...s,
        position: i + 1,
        is_current: i === index,
      }));
      setPlaylist(queueItems);
      setCurrentSongIndex(index);
      setIsExpanded(false);
    } catch (error: any) {
      console.error('Error playing song:', error);
      toast.error(error.response?.data?.message || 'Không thể phát bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Xử lý thêm vào danh sách chờ
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

  // Xử lý mở modal thêm vào playlist
  const handleAddToPlaylistClick = (songId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSongId(songId);
    fetchUserPlaylists();
    setIsModalOpen(true);
  };

  // Xử lý nhấp vào album
  const handleAlbumClick = (album: Album) => {
    navigate(`/albums/${album.album_id}`);
  };

  // Kiểm tra nếu artist là null
  if (!artist && !loading) {
    return <div className="text-red-500 text-center">Không tìm thấy thông tin ca sĩ</div>;
  }

  return (
    <div className="min-h-screen text-white rounded-lg">
      <Toaster richColors position="top-right" />
      {loading ? (
        <div className="space-y-4">
          <Skeleton height={200} className="w-full rounded-l g" />
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
                    {artist?.profile_picture ? (
                      <img
                        src={artist.profile_picture}
                        alt={artist.stage_name}
                        className="w-52 h-52 object-contain rounded-full"
                      />
                    ) : (
                      <div className="w-52 h-52 bg-neutral-700 flex items-center justify-center rounded-full">
                        <span className="text-neutral-400">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-auto text-start ml-1.5">
                  <h2 className="text-sm text-white">Ca sĩ</h2>
                  <h1 className="text-8xl font-bold uppercase">{artist?.stage_name}</h1>
                  <p className="text-sm text-gray-400">Tổng lượt nghe: {artist?.total_listen_count}</p>
                </div>
              </div>
              <div className="py-2 px-7 flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <List className="w-6 h-6 text-white" />
                  <span className="text-sm text-gray-400">Danh sách bài hát</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 pt-8">
            {/* Phần Bài hát */}
            {artist && artist.songs && artist.songs.length > 0 && (
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
                  {artist.songs.map((song, index) => (
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
                              {song.feat_artists?.length > 0 && (
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
                        <div className="flex items-center justify-between">
                          <span>{formatDuration(song.duration)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button>
                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Phần Album */}
            {artist && artist.albums && artist.albums.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">Album</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.albums.map((album) => (
                    <div
                      key={album.album_id}
                      className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors mr-0"
                      onClick={() => handleAlbumClick(album)}
                    >
                      <img
                        src={album.img || 'https://via.placeholder.com/144'}
                        alt={album.title}
                        className="w-36 h-36 rounded mb-2 object-cover"
                      />
                      <div className="text-center">
                        <span className="text-white font-medium text-sm w-36 line-clamp-2">
                          {album.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal chọn playlist */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent variant="dark" className="sm:max-w-[600px]">
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
                      <div className="w-16 h-16 flex-shrink-0">
                        {playlist.img ? (
                          <img
                            src={playlist.img}
                            alt={playlist.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-700 flex items-center justify-center rounded-lg">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                      <span className="text-white text-lg font-semibold truncate flex-1">{playlist.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-400 col-span-2">
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

