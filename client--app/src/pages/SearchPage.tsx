/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import api from '../services/api';
import { Button } from '../components/ui/button';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Play, MoreHorizontal } from 'react-feather';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';

// Định nghĩa interface cho kết quả tìm kiếm
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

interface QueueItem extends Song {
  position: number;
  is_current: boolean;
}

interface Artist {
  artist_id: number;
  stage_name: string;
  profile_picture: string | null;
}

interface Album {
  album_id: number;
  title: string;
  img: string | null;
  release_year: number;
}

interface Playlist {
  playlist_id: number;
  title: string;
  img: string | null;
}

interface SearchResults {
  artists: { items: Artist[]; total: number };
  songs: { items: Song[]; total: number };
  albums: { items: Album[]; total: number };
}

// Hàm định dạng thời lượng bài hát
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const SearchPage: React.FC = () => {
  const { query, type } = useParams<{ query: string; type?: string }>();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>(type || 'all');
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { addToQueue, setPlaylist, setCurrentSongIndex } = useAudio();
  const { isAuthenticated, userId, token } = useAuth();

  // Gọi API tìm kiếm
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query || query.trim().length < 1) {
        setSearchResults(null);
        setLoading(false);
        return;
      }

      if (initialLoad) {
        setLoading(true);
        setTimeout(async () => {
          try {
            console.log('Fetching search results for query:', query);
            const response = await api.get('/public/search', {
              params: { search: query, page: 1, limit: 10 },
            });
            setSearchResults(response.data);
          } catch (error: any) {
            console.error('Search error:', error);
            toast.error(error.response?.data?.message || 'Không thể tìm kiếm', {
              style: { background: 'black', color: 'white' },
            });
            setSearchResults(null);
          } finally {
            setLoading(false);
            setInitialLoad(false);
          }
        }, 1000);
      } else {
        setLoading(false);
        try {
          console.log('Fetching search results for query:', query);
          const response = await api.get('/public/search', {
            params: { search: query, page: 1, limit: 10 },
          });
          setSearchResults(response.data);
        } catch (error: any) {
          console.error('Search error:', error);
          toast.error(error.response?.data?.message || 'Không thể tìm kiếm', {
            style: { background: 'black', color: 'white' },
          });
          setSearchResults(null);
        }
      }
    };

    fetchSearchResults();
  }, [query, filter]);

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

  // Xử lý thêm bài hát vào playlist
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

  // Xử lý nhấp vào bài hát (chuyển hướng)
  const handleSongClick = (song: Song) => {
    navigate(`/search/${encodeURIComponent(query || '')}/tracks`);
  };

  // Xử lý phát bài hát
  const handlePlaySong = async (song: Song, index: number, e: React.MouseEvent) => {
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
      const queueItems: QueueItem[] = (searchResults?.songs.items || []).map((s, i) => ({
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

  // Xử lý thêm vào danhdensity chờ
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
      await addToQueue(song, false); // Thêm vào cuối queue
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

  // Xử lý nhấp vào ca sĩ
  const handleArtistClick = (artist: Artist) => {
    navigate(`/artists/${artist.artist_id}/detail`);
  };

  // Xử lý nhấp vào album
  const handleAlbumClick = (album: Album) => {
    navigate(`/albums/${album.album_id}`);
  };

  // Lọc kết quả theo filter
  const filteredResults = () => {
    if (!searchResults) return { artists: [], songs: [], albums: [] };

    return {
      artists: filter === 'all' || filter === 'artists' ? searchResults.artists.items : [],
      songs: filter === 'all' || filter === 'tracks' ? searchResults.songs.items : [],
      albums: filter === 'all' || filter === 'albums' ? searchResults.albums.items : [],
    };
  };

  const { artists, songs, albums } = filteredResults();

  return (
    <div className="min-h-screen text-white py-6 px-10 bg-neutral-900 rounded-lg">
      <Toaster richColors position="top-right" />

      {/* Thanh lọc */}
      <div className="flex justify-start gap-4 mb-6">
        <Button
          variant={filter === 'all' ? 'outline' : 'filter'}
          className="px-4 py-2 rounded-full"
          onClick={() => {
            setFilter('all');
            navigate(`/search/${encodeURIComponent(query || '')}`);
          }}
        >
          Tất cả
        </Button>
        <Button
          variant={filter === 'tracks' ? 'outline' : 'filter'}
          className="px-4 py-2 rounded-full"
          onClick={() => {
            setFilter('tracks');
            navigate(`/search/${encodeURIComponent(query || '')}/tracks`);
          }}
        >
          Bài hát
        </Button>
        <Button
          variant={filter === 'artists' ? 'outline' : 'filter'}
          className="px-4 py-2 rounded-full"
          onClick={() => {
            setFilter('artists');
            navigate(`/search/${encodeURIComponent(query || '')}/artists`);
          }}
        >
          Nghệ sĩ
        </Button>
        <Button
          variant={filter === 'albums' ? 'outline' : 'filter'}
          className="px-4 py-2 rounded-full"
          onClick={() => {
            setFilter('albums');
            navigate(`/search/${encodeURIComponent(query || '')}/albums`);
          }}
        >
          Album
        </Button>
      </div>

      {loading && initialLoad ? (
        <div className="space-y-6">
          {/* Skeleton cho thanh lọc */}
          <div className="flex justify-start gap-4 mb-6">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} height={40} width={80} className="rounded-full" />
            ))}
          </div>
          {/* Skeleton cho kết quả */}
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center p-3">
                <Skeleton height={144} width={144} circle={true} />
                <Skeleton height={20} width={100} className="ml-2" />
              </div>
            ))}
          </div>
        </div>
      ) : !searchResults || (artists.length === 0 && songs.length === 0 && albums.length === 0) ? (
        <div className="text-gray-400 text-center">Không tìm thấy kết quả cho "{query}"</div>
      ) : (
        <div className="space-y-8">
          {/* Phần Bài hát */}
          {songs.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-3">Bài hát</h2>
              <div className="grid grid-cols-2 gap-4">
                {songs.map((song, index) => (
                  <div
                    key={song.song_id}
                    className="flex items-center p-3 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredSongId(song.song_id)}
                    onMouseLeave={() => setHoveredSongId(null)}
                    onClick={() => handleSongClick(song)}
                  >
                    <div className="w-12 flex-shrink-0 flex items-center justify-center">
                      {hoveredSongId === song.song_id ? (
                        <button onClick={(e) => handlePlaySong(song, index, e)}>
                          <Play className="text-white" size={24} />
                        </button>
                      ) : (
                        <span className="text-gray-400">{index + 1}</span>
                      )}
                    </div>
                    <img
                      src={song.img || 'https://via.placeholder.com/40'}
                      alt={song.title}
                      className="w-12 h-12 rounded mr-4"
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium">{song.title}</span>
                      <p className="text-sm text-gray-400">
                        <Link
                          to={`/artists/${song.artist_id}/detail`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {song.artist_name}
                        </Link>
                        {song.feat_artists.length > 0 && `, feat. ${song.feat_artists.join(', ')}`}
                        {song.album_name && <span> - {song.album_name}</span>}
                      </p>
                    </div>
                    <span className="text-gray-400">{formatDuration(song.duration)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ml-4">
                          <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="z-50 bg-neutral-900 border border-gray-700 text-white">
                        <DropdownMenuItem onClick={(e) => handlePlaySong(song, index, e)}>
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
                ))}
              </div>
            </div>
          )}

          {/* Phần Nghệ sĩ */}
          {artists.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-3">Nghệ sĩ</h2>
              <div className="flex flex-wrap gap-2">
                {artists.map((artist) => (
                  <Link
                    to={`/artists/${artist.artist_id}`}
                    key={artist.artist_id}
                    className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors mr-0"
                  >
                    <img
                      src={artist.profile_picture || 'https://via.placeholder.com/144'}
                      alt={artist.stage_name}
                      className="w-36 h-36 rounded-full mb-2 object-cover"
                    />
                    <span className="text-white font-medium text-center text-sm w-36 line-clamp-2">
                      {artist.stage_name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Phần Album */}
          {albums.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-3">Album</h2>
              <div className="flex flex-wrap gap-2">
                {albums.map((album) => (
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
                      <p className="text-gray-400 text-sm">{album.release_year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
  );
};

export default SearchPage;