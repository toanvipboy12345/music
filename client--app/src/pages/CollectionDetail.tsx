import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Clock, Play, List, Download, MoreHorizontal } from 'react-feather';
import api from '../services/api';
import { useAudio } from '../context/AudioContext';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  release_date: string;
  audio_file_url: string;
  img: string;
  artist_id: number;
  feat_artists: string[];
  album_name: string | null;
  is_downloadable: boolean;
  created_at: string;
  artist_name: string;
}

interface CollectionDetail {
  collection: {
    artist_id: number;
    title: string;
    artist_name: string;
    img: string;
    popularity: number;
    created_at: string;
  };
  songs: Song[];
}

export const CollectionDetail: React.FC = () => {
  const { artist_id } = useParams<{ artist_id: string }>();
  const location = useLocation();
  const [collectionDetail, setCollectionDetail] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const { setCurrentSong, setIsExpanded, setArtistName, setPlaylist, setCurrentSongIndex } = useAudio();

  useEffect(() => {
    const fetchCollectionDetail = async () => {
      try {
        const response = await api.get(`/public/highlight-collections/${artist_id}`);
        setCollectionDetail(response.data.data);
        setArtistName(response.data.data.collection.artist_name);
      } catch (err) {
        setError('Không thể tải chi tiết tuyển tập');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (artist_id) fetchCollectionDetail();
    console.log('Location State in useEffect:', location.state);
  }, [artist_id, setArtistName]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSongClick = (song: Song, index: number) => {
    setCurrentSong(song);
    setPlaylist(collectionDetail?.songs || []); // Lưu toàn bộ danh sách bài hát
    setCurrentSongIndex(index); // Lưu chỉ số bài hát được chọn
    setIsExpanded(false);
  };

  const handlePlayCollection = () => {
    if (collectionDetail?.songs && collectionDetail.songs.length > 0) {
      setCurrentSong(collectionDetail.songs[0]); // Phát bài hát đầu tiên
      setPlaylist(collectionDetail.songs); // Lưu danh sách bài hát
      setCurrentSongIndex(0); // Đặt chỉ số bài đầu tiên
      setIsExpanded(false);
    }
  };

  const baseColor = location.state?.baseColor || 'bg-pink-200';
  const gradientFrom = baseColor.replace('bg-', '');
  let gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
  switch (gradientFrom) {
    case 'pink-200': gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900'; break;
    case 'yellow-200': gradientClass = 'bg-gradient-to-b from-yellow-200 to-neutral-900'; break;
    case 'orange-200': gradientClass = 'bg-gradient-to-b from-orange-200 to-neutral-900'; break;
    case 'green-200': gradientClass = 'bg-gradient-to-b from-green-200 to-neutral-900'; break;
    case 'blue-200': gradientClass = 'bg-gradient-to-b from-blue-200 to-neutral-900'; break;
    case 'purple-200': gradientClass = 'bg-gradient-to-b from-purple-200 to-neutral-900'; break;
    case 'red-200': gradientClass = 'bg-gradient-to-b from-red-200 to-neutral-900'; break;
    case 'teal-200': gradientClass = 'bg-gradient-to-b from-teal-200 to-neutral-900'; break;
    case 'indigo-200': gradientClass = 'bg-gradient-to-b from-indigo-200 to-neutral-900'; break;
    case 'amber-200': gradientClass = 'bg-gradient-to-b from-amber-200 to-neutral-900'; break;
    default: gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
  }

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!collectionDetail) return <div className="text-center">Không tìm thấy tuyển tập</div>;

  const { collection, songs } = collectionDetail;

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
          <div className={`${gradientClass} h-64 mb-4 rounded-t-lg`}>
            <div className="flex gap-4 items-center justify-start h-full py-4 px-8">
              <div>
                <div className="flex flex-col justify-start items-center h-full">
                  <img
                    src={collection.img}
                    alt={collection.artist_name}
                    className="w-52 object-contain rounded-sm"
                  />
                </div>
              </div>
              <div className="h-auto text-start ml-1.5">
                <h2 className="text-sm text-gray-300">Danh sách phát công khai</h2>
                <h1 className="text-8xl font-bold uppercase">
                  This Is {collection.artist_name}
                </h1>
                <p className="text-sm text-white">
                  Các bản nhạc bạn nên nghe, tất cả trong một danh sách phát.
                </p>
              </div>
            </div>
          </div>
          <div className="py-2 px-7 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={handlePlayCollection}>
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
          <div className="p-4 pt-16">
            <table className="w-full text-left">
              <thead className="border-b border-gray-600">
                <tr>
                  <th className="py-2 px-4 text-gray-300 w-16">#</th>
                  <th className="py-2 px-4 text-gray-300">Tiêu đề</th>
                  <th className="py-2 px-4 text-gray-300">Album</th>
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
                        <img
                          src={song.img}
                          alt={song.title}
                          className="w-12 h-12 object-cover mr-4 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-white">{song.title}</span>
                          {song.feat_artists.length > 0 && (
                            <span className="text-gray-400 text-sm block">
                              feat. {song.feat_artists.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {song.album_name || '-'}
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