/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Clock, Play, Download, MoreHorizontal, List } from 'react-feather';
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
  const { setCurrentSong, setIsExpanded, setArtistName, setPlaylist, setCurrentSongIndex } = useAudio();

useEffect(() => {
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

  const handleSongClick = (song: Song, index: number) => {
    setCurrentSong(song);
    setPlaylist(playlistDetail?.songs || []);
    setCurrentSongIndex(index);
    setIsExpanded(false);
  };

  const handlePlayPlaylist = () => {
    if (playlistDetail?.songs && playlistDetail.songs.length > 0) {
      setCurrentSong(playlistDetail.songs[0]);
      setPlaylist(playlistDetail.songs);
      setCurrentSongIndex(0);
      setIsExpanded(false);
    }
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!playlistDetail) return <div className="text-center">Không tìm thấy playlist</div>;

  const { title, img, description, username, songs } = playlistDetail;

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
          <div className="bg-gradient-to-b from-purple-600 to-neutral-900 h-64 mb-4 rounded-t-lg">
            <div className="flex flex-col h-full">
              <div className="flex gap-4 items-center justify-start flex-1 py-4 px-8">
                <div>
                  <div className="flex flex-col justify-start items-center">
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        className="w-52 object-contain rounded-sm"
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
                  <MoreHorizontal className="w-6 h-6 text-white" />
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
                    onClick={() => handleSongClick(song, index)}
                  >
                    <td className="py-2 px-4 text-gray-400">
                      {hoveredSongId === song.song_id ? (
                        <Play className="w-5 h-5" />
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
        </div>
      )}
    </div>
  );
};