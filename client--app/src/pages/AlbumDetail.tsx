/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Clock, Play, Download, MoreHorizontal, List } from 'react-feather';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
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

interface RelatedAlbum {
  album_id: number;
  title: string;
  release_date: string;
  img: string | null;
  artist_id: number;
}

interface Album {
  album_id: number;
  title: string;
  release_date: string;
  img: string | null;
  artist_id: number;
  artist_name: string;
  artist_profile_picture: string | null;
  song_count: number;
  total_duration: number;
  songs: Song[];
  related_albums: RelatedAlbum[];
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

export const AlbumDetail: React.FC = () => {
  const { album_id } = useParams<{ album_id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { addToQueue, setPlaylist, setCurrentSongIndex, setArtistName, playContent } = useAudio();
  const { isAuthenticated, userId, token } = useAuth();

  // Function to generate random gradient
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

    const fetchAlbumDetail = async () => {
      if (!album_id) {
        setError('ID album không hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching album detail for album_id:', album_id);
        const response = await api.get(`/public/albums/${album_id}`);
        const albumData = {
          ...response.data.data.album,
          songs: response.data.data.album.songs || [],
          related_albums: response.data.data.album.related_albums || []
        };
        setAlbum(albumData);
        setArtistName(albumData.artist_name || '');
      } catch (err: any) {
        console.error('Error fetching album:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy album');
        } else {
          setError('Không thể tải chi tiết album');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetail();
  }, [album_id, setArtistName]);

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
      const queueItems: QueueItem[] = (album?.songs || []).map((s, i) => ({
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
    if (!album?.songs || album.songs.length === 0) {
      toast.error('Danh sách bài hát trống', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      const songIds = album.songs.map(song => song.song_id);
      console.log('Handling play content with song_ids:', songIds);
      await playContent(songIds);
    } catch (error: any) {
      console.error('Error playing content:', error);
      toast.error(error.response?.data?.message || 'Không thể phát danh sách', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleRelatedAlbumClick = (album: RelatedAlbum) => {
    navigate(`/albums/${album.album_id}`);
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!album) return <div className="text-center">Không tìm thấy album</div>;

  const { title, img, artist_name, release_date, song_count, total_duration, songs, related_albums } = album;

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
                        className="w-52 h-52 object-cover rounded-sm"
                      />
                    ) : (
                      <div className="w-52 h-52 bg-neutral-700 flex items-center justify-center rounded-sm">
                        <span className="text-neutral-400">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-auto text-start ml-1.5">
                  <h2 className="text-sm text-white">Album</h2>
                  <h1 className="text-8xl font-bold uppercase">{title}</h1>
                  <p className="text-sm text-gray-400">
                    {artist_name} • {release_date.split('-')[0]} • {song_count} bài hát • {formatDuration(total_duration)}
                  </p>
                </div>
              </div>
              <div className="py-2 px-7 flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button onClick={handlePlayContent}>
                    <Play className="w-6 h-6 text-white" />
                  </button>
                  <Download className="w-6 h-6 text-white" />
                  <MoreHorizontal className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <List className="w-6 h-6 text-white" />
                  <span className="text-sm text-gray-400">Danh sách bài hát</span>
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
                  <th className="py-2 px-4 text-gray-300 w-16">Hành động</th>
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
                    <td className="py-2 px-4 text-gray-400">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button>
                            <MoreHorizontal className="w-5 h-5" />
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
                          {song.is_downloadable && (
                            <DropdownMenuItem>
                              <a href={song.audio_file_url} download>
                                Tải xuống
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {related_albums.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">Album khác của {artist_name}</h2>
                <div className="flex flex-wrap gap-2">
                  {related_albums.map((relatedAlbum) => (
                    <div
                      key={relatedAlbum.album_id}
                      className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors mr-0"
                      onClick={() => handleRelatedAlbumClick(relatedAlbum)}
                    >
                      <img
                        src={relatedAlbum.img || 'https://via.placeholder.com/144'}
                        alt={relatedAlbum.title}
                        className="w-36 h-36 rounded mb-2 object-cover"
                      />
                      <div className="text-center">
                        <span className="text-white font-medium text-sm w-36 line-clamp-2">
                          {relatedAlbum.title}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {relatedAlbum.release_date.split('-')[0]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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