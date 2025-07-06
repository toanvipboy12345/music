/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import api from '../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PlayIcon, EllipsisHorizontalIcon, QueueListIcon, UsersIcon } from '@heroicons/react/24/solid';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';
import { Button } from "@/components/ui/button";

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

interface Album {
  album_id: number;
  title: string;
  img: string | null;
}

interface Artist {
  artist_id: number;
  stage_name: string;
  profile_picture: string | null;
  bio: string | null;
  follower: number;
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

// Danh sách các gradient tĩnh, tất cả đổ về to-neutral-900
const gradientClasses = [
  'bg-gradient-to-b from-purple-600 to-neutral-900',
  'bg-gradient-to-b from-blue-600 to-neutral-900',
  'bg-gradient-to-b from-red-600 to-neutral-900',
  'bg-gradient-to-b from-green-600 to-neutral-900',
  'bg-gradient-to-b from-pink-600 to-neutral-900',
  'bg-gradient-to-b from-indigo-600 to-neutral-900',
  'bg-gradient-to-b from-teal-600 to-neutral-900',
  'bg-gradient-to-b from-cyan-600 to-neutral-900',
  'bg-gradient-to-b from-orange-600 to-neutral-900',
  'bg-gradient-to-b from-violet-600 to-neutral-900',
];

// Hàm chọn gradient ngẫu nhiên
const generateRandomGradient = () => {
  return gradientClasses[Math.floor(Math.random() * gradientClasses.length)];
};

// Hàm định dạng thời lượng bài hát
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ArtistDetail: React.FC = () => {
  const { artist_id } = useParams<{ artist_id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const { addToQueue, setPlaylist, setCurrentSongIndex, setArtistName, setIsExpanded } = useAudio();
  const { isAuthenticated, userId, token } = useAuth();
  const [gradient, setGradient] = useState<string>(generateRandomGradient());

  // Gọi API để lấy chi tiết ca sĩ và kiểm tra trạng thái follow
  useEffect(() => {
    // Cập nhật gradient khi component mount
    setGradient(generateRandomGradient());

    const fetchArtistDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/public/artists/${artist_id}/detail`);
        const artistData = {
          ...response.data.artist,
          albums: response.data.artist.albums || [], // Gán mảng rỗng nếu undefined
          songs: response.data.artist.songs || [],   // Gán mảng rỗng nếu undefined
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

    const checkArtistFollow = async () => {
      if (!isAuthenticated || !userId || !artist_id) return;
      try {
        const response = await api.get(`/user/follow-artist/${userId}/${artist_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(response.data.hasFollowed);
      } catch (error: any) {
        console.error('Error checking artist follow:', error);
        toast.error(error.response?.data?.message || 'Không thể kiểm tra trạng thái theo dõi', {
          style: { background: 'black', color: 'white' },
        });
      }
    };

    fetchArtistDetails();
    checkArtistFollow();
  }, [artist_id, setArtistName, isAuthenticated, userId, token]);

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
        position: i + 1, // Sử dụng 1-based index để đồng bộ với backend
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

  // Xử lý follow/unfollow artist
  const handleFollowToggle = async () => {
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để theo dõi ca sĩ', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }

    try {
      if (isFollowing) {
        // Gọi API unfollow
        await api.delete(`/user/follow-artist/${artist_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(false);
        setArtist((prev) => prev ? { ...prev, follower: prev.follower - 1 } : null);
        toast.success('Đã bỏ theo dõi ca sĩ', {
          style: { background: 'black', color: 'white' },
        });
      } else {
        // Gọi API follow
        await api.post(`/user/follow-artist/${artist_id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(true);
        setArtist((prev) => prev ? { ...prev, follower: prev.follower + 1 } : null);
        toast.success('Đã theo dõi ca sĩ', {
          style: { background: 'black', color: 'white' },
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error.response?.data?.message || 'Không thể thực hiện hành động theo dõi', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Kiểm tra nếu artist là null
  if (!artist && !loading) {
    return <div className="text-red-500 text-center">Không tìm thấy thông tin ca sĩ</div>;
  }

  return (
    <div className="min-h-screen text-white rounded-lg">
      <Toaster richColors position="top-right" />
      {loading ? (
        <div className="space-y-4 px-4 sm:px-8">
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
          <div className={`${gradient} h-64 mb-6 sm:mb-8 rounded-t-lg`}>
            <div className="flex flex-col h-full">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-start flex-1 py-4 px-4 sm:px-8">
                <div>
                  <div className="flex flex-col justify-start items-center">
                    {artist?.profile_picture ? (
                      <img
                        src={artist.profile_picture}
                        alt={artist.stage_name}
                        className="w-32 h-32 sm:w-52 sm:h-52 object-contain rounded-full"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-32 h-32 sm:w-52 sm:h-52 bg-neutral-700 flex items-center justify-center rounded-full">
                        <span className="text-neutral-400">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-auto text-center sm:text-start ml-0 sm:ml-1.5">
                  <h2 className="text-xs sm:text-sm text-white font-medium">Ca sĩ</h2>
                  <h1 className="text-5xl sm:text-8xl font-bold uppercase">{artist?.stage_name}</h1>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
                    <p className="text-xs sm:text-sm text-gray-400">
                      {artist?.total_listen_count.toLocaleString('vi-VN')} lượt nghe
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 flex items-center">
                      <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> {artist?.follower}
                    </p>
                  </div>
                </div>
              </div>
              <div className="py-2 px-4 sm:px-7 flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <QueueListIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="text-xs sm:text-sm text-gray-400">Danh sách bài hát</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFollowToggle}
                    className="transition-transform"
                  >
                    {isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 pt-8 pb-6 sm:pb-8">
            {/* Phần Bài hát */}
            {artist && artist.songs && artist.songs.length > 0 && (
              <div className="overflow-x-auto mb-6 sm:mb-8">
                <table className="w-full text-left">
                  <tbody>
                    {artist.songs.map((song, index) => (
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
                                <>
                                  <img
                                    src={song.img}
                                    alt={song.title}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 object-cover rounded transition-opacity duration-200 ${
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
                                      <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white hover:text-gray-300 active:text-gray-200" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-700 flex items-center justify-center rounded">
                                  <span className="text-neutral-400 text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-sm sm:text-base">{song.title}</span>
                              <span className="text-gray-400 text-xs sm:text-sm">
                                <Link
                                  to={`/artists/${song.artist_id}`}
                                  className="hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {song.artist_name}
                                </Link>
                                {song.feat_artists?.length > 0 && (
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
                        <td className="py-2 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">
                          {song.album_name || 'Đang cập nhật'}
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-gray-400">
                          {formatDuration(song.duration)}
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">
                          {song.listen_count ? song.listen_count.toLocaleString('vi-VN') : '0'}
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-gray-400">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button>
                                <EllipsisHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5 hover:text-gray-300 active:text-gray-200" />
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Phần Tiểu sử */}
            {artist && artist.bio && (
              <div className="mt-8 px-4 sm:px-0 mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">Tiểu sử</h2>
                <p className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap">{artist.bio}</p>
              </div>
            )}

            {/* Phần Album */}
            {artist && artist.albums && artist.albums.length > 0 && (
              <div className="mt-8 px-4 sm:px-0 mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">Album</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.albums.map((album) => (
                    <div
                      key={album.album_id}
                      className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleAlbumClick(album)}
                    >
                      <img
                        src={album.img || 'https://via.placeholder.com/144'}
                        alt={album.title}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded mb-2 object-cover"
                        loading="lazy"
                      />
                      <div className="text-center">
                        <span className="text-white font-medium text-xs sm:text-sm w-28 sm:w-36 line-clamp-2">
                          {album.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                          {playlist.img ? (
                            <img
                              src={playlist.img}
                              alt={playlist.title}
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 flex items-center justify-center rounded-lg">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        <span className="text-white text-sm sm:text-lg font-semibold truncate flex-1">{playlist.title}</span>
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
        </div>
      )}
    </div>
  );
};