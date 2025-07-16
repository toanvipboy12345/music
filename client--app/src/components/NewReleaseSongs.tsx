/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { PlayIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/solid";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import api from "../services/api";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/authContext";

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
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const NewReleaseSongs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { addToQueue, setPlaylist, setCurrentSongIndex } = useAudio();
  const { isAuthenticated, userId, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNewReleaseSongs = async () => {
      try {
        const response = await api.get("/public/songs/new-releases");
        const data = response.data.data;
        console.log("API Response - New Release Songs:", data); // Debug: Kiểm tra dữ liệu từ API
        setSongs(data);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Không thể tải danh sách bài hát mới");
        console.error(err);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };
    fetchNewReleaseSongs();
  }, []);

  // Lấy danh sách playlist của người dùng
  const fetchUserPlaylists = async () => {
    if (!isAuthenticated || !userId) {
      toast.error("Vui lòng đăng nhập để thêm bài hát vào playlist", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login"),
        },
        style: { background: "black", color: "white" },
      });
      return;
    }
    try {
      console.log("Fetching playlists for userId:", userId);
      const response = await api.get(`/user/playlists/user/${userId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(response.data.playlists || []);
    } catch (err: any) {
      console.error("Error fetching playlists:", err);
      toast.error("Không thể tải danh sách playlist", {
        style: { background: "black", color: "white" },
      });
    }
  };

  // Xử lý phát bài hát
  const handlePlaySong = async (song: Song, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error("Vui lòng đăng nhập để phát bài hát", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login"),
        },
        style: { background: "black", color: "white" },
      });
      return;
    }
    try {
      console.log("Handling song click:", { song_id: song.song_id, title: song.title });
      const queueItem: QueueItem = {
        ...song,
        position: index + 1,
        is_current: true,
      };
      await addToQueue(queueItem, true); // Phát ngay bài hát
      const queueItems: QueueItem[] = songs.map((s, i) => ({
        ...s,
        position: i + 1,
        is_current: i === index,
      }));
      setPlaylist(queueItems);
      setCurrentSongIndex(index);

    } catch (error: any) {
      console.error("Error playing song:", error);
      toast.error(error.response?.data?.message || "Không thể phát bài hát", {
        style: { background: "black", color: "white" },
      });
    }
  };

  // Xử lý thêm vào danh sách chờ
  const handleAddToQueueClick = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error("Vui lòng đăng nhập để thêm vào danh sách chờ", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login"),
        },
        style: { background: "black", color: "white" },
      });
      return;
    }
    try {
      console.log("Adding song to queue:", song.song_id, song.title);
      const queueItem: QueueItem = {
        ...song,
        position: (songs.length || 0) + 1,
        is_current: false,
      };
      await addToQueue(queueItem, false); // Thêm vào cuối queue
      toast.success("Đã thêm bài hát vào danh sách chờ", {
        style: { background: "black", color: "white" },
      });
    } catch (error: any) {
      console.error("Error adding to queue:", error);
      toast.error(error.response?.data?.message || "Không thể thêm bài hát vào danh sách chờ", {
        style: { background: "black", color: "white" },
      });
    }
  };

  // Xử lý thêm vào playlist
  const handleAddToPlaylistClick = (songId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSongId(songId);
    fetchUserPlaylists();
    setIsModalOpen(true);
  };

  // Xử lý thêm bài hát vào playlist
  const handleAddSongToPlaylist = async (playlistId: number) => {
    if (!selectedSongId) return;
    try {
      console.log("Adding song to playlist:", { playlistId, songId: selectedSongId, userId });
      await api.post(
        `/user/playlists/${playlistId}/songs`,
        { song_id: selectedSongId, user_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã thêm bài hát vào playlist", {
        style: { background: "black", color: "white" },
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error adding song to playlist:", err);
      toast.error("Không thể thêm bài hát vào playlist", {
        style: { background: "black", color: "white" },
      });
    }
  };

  if (error) return <div className="text-red-500 text-center">Lỗi: {error}</div>;

  return (
    <div className="w-full py-4 px-4 sm:px-6 bg-neutral-900 rounded-lg">
      <Toaster richColors position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white hover:underline">
        Mới Phát Hành
        </h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="flex items-center p-3">
              <Skeleton height={48} width={48} className="rounded mr-4" />
              <div className="flex-1 mr-1">
                <Skeleton height={20} width="80%" className="mb-2" />
                <Skeleton height={16} width="60%" />
              </div>
              <Skeleton height={20} width={20} className="ml-4" />
            </div>
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="text-gray-400 text-center">Không có bài hát mới</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {songs.map((song, index) => (
            <div
              key={song.song_id}
              className="flex items-center py-2 px-3 hover:bg-neutral-800 transition-colors border-t border-gray-700"
              onMouseEnter={() => setHoveredSongId(song.song_id)}
              onMouseLeave={() => setHoveredSongId(null)}
            >
              <div className="relative w-14 h-14 flex-shrink-0 mr-4">
                {song.img ? (
                  <>
                    <img
                      src={song.img}
                      alt={song.title}
                      className={`w-14 h-14 rounded object-cover transition-opacity duration-200 ${
                        hoveredSongId === song.song_id ? "opacity-75" : "opacity-100"
                      }`}
                      loading="lazy"
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                        hoveredSongId === song.song_id ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <button onClick={(e) => handlePlaySong(song, index, e)}>
                        <PlayIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-12 h-12 bg-neutral-700 flex items-center justify-center rounded">
                    <span className="text-neutral-400 text-xs">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 mr-1">
                <Link
                  to={`/songs/${song.song_id}`}
                  className="text-white font-medium text-sm sm:text-base hover:underline"
                >
                  {song.title}
                </Link>
                <p className="text-sm text-gray-400">
                  <Link
                    to={`/artists/${song.artist_id}`}
                    className="hover:underline"
                  >
                    {song.artist_name}
                  </Link>
                  {song.feat_artists.length > 0 && (
                    <span>
                      {" feat. "}
                      {song.feat_artists.map((featArtist, idx) => (
                        <span key={featArtist.artist_id}>
                          <Link
                            to={`/artists/${featArtist.artist_id}`}
                            className="hover:underline"
                          >
                            {featArtist.stage_name}
                          </Link>
                          {idx < song.feat_artists.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  )}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-4">
                    <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400 hover:text-gray-300 active:text-gray-200" />
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
      )}
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