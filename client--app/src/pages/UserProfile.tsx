/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  PlayIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import api from "../services/api";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/authContext";

// Khai báo tên ứng dụng
const APP_NAME = "Spotyfi";

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

interface Artist {
  artist_id: number;
  stage_name: string;
  profile_picture: string | null;
  popularity: number;
  listen_count: number;
}

interface Playlist {
  playlist_id: number;
  title: string;
  img: string | null;
  description: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
  songs: Song[];
}

interface UserProfile {
  username: string;
  avatar: string;
  top_artists_this_month: Artist[];
  top_songs_this_month: Song[];
  playlists: Playlist[];
}

interface QueueItem extends Song {
  position: number;
  is_current: boolean;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToQueue, setPlaylist, setCurrentSongIndex } = useAudio();
  const { isAuthenticated, userId, token, is_premium } = useAuth();

  const generateRandomGradient = () => {
    const colors = [
      "purple-600",
      "blue-600",
      "red-600",
      "green-600",
      "pink-600",
      "indigo-600",
      "teal-600",
      "cyan-600",
      "orange-600",
      "violet-600",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `bg-gradient-to-b from-${randomColor} to-neutral-900`;
  };

  const [gradient, setGradient] = useState<string>(generateRandomGradient());

  useEffect(() => {
    setGradient(generateRandomGradient());

    const fetchUserProfile = async () => {
      if (!isAuthenticated || !userId) {
        setError("Vui lòng đăng nhập để xem hồ sơ");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Fetching user profile for userId:", userId);
        const response = await api.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = response.data.user;
        console.log("User profile fetched:", profileData);
        setProfile(profileData);
        if (profileData.username) {
          document.title = `${profileData.username} - Hồ sơ - ${APP_NAME}`;
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        if (err.response?.status === 401) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("Không có quyền truy cập hồ sơ");
        } else if (err.response?.status === 404) {
          setError("Không tìm thấy hồ sơ người dùng");
        } else {
          setError("Không thể tải hồ sơ người dùng");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, userId, token, navigate]);

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
      setUserPlaylists(response.data.playlists || []);
    } catch (err: any) {
      console.error("Error fetching playlists:", err);
      toast.error("Không thể tải danh sách playlist", {
        style: { background: "black", color: "white" },
      });
    }
  };

  const handleAddSongToPlaylist = async (playlistId: number) => {
    if (!selectedSongId) return;
    try {
      console.log("Adding song to playlist:", {
        playlistId,
        songId: selectedSongId,
        userId,
      });
      await api.post(
        `/user/playlists/${playlistId}/songs`,
        {
          song_id: selectedSongId,
          user_id: userId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Đã thêm bài hát vào playlist", {
        style: { background: "black", color: "white" },
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error adding song to playlist:", err);
      toast.error(
        err.response?.data?.message || "Không thể thêm bài hát vào playlist",
        {
          style: { background: "black", color: "white" },
        }
      );
    }
  };

  const handleSongClick = async (
    song: Song,
    index: number,
    e: React.MouseEvent
  ) => {
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
      console.log("Handling song click:", {
        song_id: song.song_id,
        title: song.title,
      });
      await addToQueue(song, true);
      const queueItems: QueueItem[] = (profile?.top_songs_this_month || []).map(
        (s, i) => ({
          ...s,
          position: i + 1,
          is_current: i === index,
        })
      );
      setPlaylist(queueItems);
      setCurrentSongIndex(index);
    } catch (error: any) {
      console.error("Error playing song:", error);
      toast.error(error.response?.data?.message || "Không thể phát bài hát", {
        style: { background: "black", color: "white" },
      });
    }
  };

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
      await addToQueue(song, false);
      toast.success("Đã thêm bài hát vào danh sách chờ", {
        style: { background: "black", color: "white" },
      });
    } catch (error: any) {
      console.error("Error adding to queue:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể thêm bài hát vào danh sách chờ",
        {
          style: { background: "black", color: "white" },
        }
      );
    }
  };

  const handleAddToPlaylistClick = (songId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSongId(songId);
    fetchUserPlaylists();
    setIsModalOpen(true);
  };

  const handleDownloadClick = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error("Vui lòng đăng nhập để tải bài hát", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login"),
        },
        style: { background: "black", color: "white" },
      });
      return;
    }
    if (!is_premium) {
      toast.error("Vui lòng nâng cấp lên tài khoản Premium để tải bài hát", {
        style: { background: "black", color: "white" },
      });
      return;
    }
    if (!song.is_downloadable) {
      toast.error("Bài hát này không thể tải xuống", {
        style: { background: "black", color: "white" },
      });
      return;
    }
    try {
      console.log("Downloading song:", song.song_id, song.title);
      const response = await api.get(`/user/songs/${song.song_id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${song.song_id}_${song.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải bài hát thành công", {
        style: { background: "black", color: "white" },
      });
    } catch (error: any) {
      console.error("Error downloading song:", error);
      toast.error(error.response?.data?.message || "Không thể tải bài hát", {
        style: { background: "black", color: "white" },
      });
    }
  };

  const handlePlaylistClick = (playlistId: number) => {
    navigate(`/playlists/user/${userId}/${playlistId}`);
  };

  const handleAvatarClick = () => {
    if (isAuthenticated && userId) {
      setIsAvatarModalOpen(true);
    } else {
      toast.error("Vui lòng đăng nhập để thay đổi avatar", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login"),
        },
        style: { background: "black", color: "white" },
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSubmit = async () => {
    if (!selectedAvatarFile || !isAuthenticated || !userId) return;

    const formData = new FormData();
    formData.append("avatar_file", selectedAvatarFile);

    try {
      const response = await api.post("/user/avatar", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile({
        ...profile!,
        avatar: response.data.avatar_url,
      } as UserProfile);
      toast.success("Cập nhật avatar thành công", {
        style: { background: "black", color: "white" },
      });
      setIsAvatarModalOpen(false);
      setSelectedAvatarFile(null);
      setPreviewAvatar(null);
    } catch (err: any) {
      console.error("Error updating avatar:", err);
      toast.error(err.response?.data?.message || "Không thể cập nhật avatar", {
        style: { background: "black", color: "white" },
      });
    }
  };

  if (error)
    return <div className="text-red-500 text-center p-4">Lỗi: {error}</div>;
  if (!profile)
    return <div className="text-center p-4">Không tìm thấy hồ sơ</div>;

  const {
    username,
    avatar,
    top_artists_this_month,
    top_songs_this_month,
    playlists,
  } = profile;

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
          <div
            className={`${gradient} h-auto sm:h-64 mb-4 rounded-t-lg flex flex-col`}
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-start flex-1 py-4 px-4 sm:px-8">
              <div className="flex-shrink-0 relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={username}
                    className="w-40 h-40 sm:w-52 sm:h-52 object-cover rounded-full"
                    loading="lazy"
                    onClick={handleAvatarClick}
                  />
                ) : (
                  <div
                    className="w-40 h-40 sm:w-52 sm:h-52 bg-neutral-700 flex items-center justify-center rounded-full"
                    onClick={handleAvatarClick}
                  >
                    <span className="text-neutral-400 text-sm">No Avatar</span>
                  </div>
                )}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-200 opacity-0 hover:opacity-100"
                  onClick={handleAvatarClick}
                >
                  <PencilIcon className="w-12 h-12 text-white cursor-pointer" />
                </div>
              </div>
              <div className="text-center sm:text-start mt-2 sm:mt-0">
                <h2 className="text-xs sm:text-sm text-white">Hồ sơ</h2>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold uppercase line-clamp-2">
                  {username}
                </h1>
              </div>
            </div>
            <div className="py-2 px-4 sm:px-7 flex flex-col sm:flex-row items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <ArrowDownTrayIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                <EllipsisHorizontalIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 mt-2">
            {top_artists_this_month.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                  Nghệ sĩ hàng đầu tháng này
                </h2>
                <div className="flex flex-wrap gap-2">
                  {top_artists_this_month.map((artist) => (
                    <div
                      key={artist.artist_id}
                      className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                      onClick={() => navigate(`/artists/${artist.artist_id}`)}
                    >
                      <img
                        src={
                          artist.profile_picture ||
                          "https://via.placeholder.com/144"
                        }
                        alt={artist.stage_name}
                        className="w-32 h-32 sm:w-36 sm:h-36 rounded-full mb-2 object-cover"
                        loading="lazy"
                      />
                      <div className="text-center">
                        <span className="text-white font-medium text-sm sm:text-base w-full line-clamp-2">
                          {artist.stage_name}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {artist.listen_count} lượt nghe
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {top_songs_this_month.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                  Bài hát hàng đầu tháng này
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {top_songs_this_month.map((song, index) => (
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
                                      hoveredSongId === song.song_id
                                        ? "opacity-75"
                                        : "opacity-100"
                                    }`}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-neutral-700 flex items-center justify-center rounded">
                                    <span className="text-neutral-400 text-xs">
                                      No Image
                                    </span>
                                  </div>
                                )}
                                <div
                                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                                    hoveredSongId === song.song_id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                >
                                  <button
                                    onClick={(e) =>
                                      handleSongClick(song, index, e)
                                    }
                                  >
                                    <PlayIcon className="w-6 h-6 text-white hover:text-gray-300 active:text-gray-200" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white text-sm sm:text-base">
                                  {song.title}
                                </span>
                                <span className="text-gray-400 text-xs sm:text-sm">
                                  <Link
                                    to={`/artists/${song.artist_id}`}
                                    className="hover:underline"
                                  >
                                    {song.artist_name}
                                  </Link>
                                  {song.feat_artists.length > 0 && (
                                    <span>
                                      {" "}
                                      feat.{" "}
                                      {song.feat_artists.map(
                                        (featArtist, idx) => (
                                          <span key={featArtist.artist_id}>
                                            <Link
                                              to={`/artists/${featArtist.artist_id}`}
                                              className="hover:underline"
                                            >
                                              {featArtist.stage_name}
                                            </Link>
                                            {idx < song.feat_artists.length - 1
                                              ? ", "
                                              : ""}
                                          </span>
                                        )
                                      )}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">
                            {song.album_name || "Đang cập nhật"}
                          </td>
                          <td className="py-2 px-2 sm:px-4 text-gray-400 hidden md:table-cell">
                            {song.listen_count || "Đang cập nhật"}
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
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    handleSongClick(song, index, e)
                                  }
                                >
                                  Phát bài hát
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    handleAddToQueueClick(song, e)
                                  }
                                >
                                  Thêm vào danh sách chờ
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    handleAddToPlaylistClick(song.song_id, e)
                                  }
                                >
                                  Thêm vào playlist
                                </DropdownMenuItem>
                                {is_premium && song.is_downloadable && (
                                  <DropdownMenuItem
                                    onClick={(e) =>
                                      handleDownloadClick(song, e)
                                    }
                                  >
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
            )}
            {playlists.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                  Playlist của bạn
                </h2>
                <div className="flex flex-wrap gap-2">
                  {playlists.map((playlist) => (
                    <Link
                      to={`/playlists/${playlist.playlist_id}`}
                      key={playlist.playlist_id}
                      className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                    >
                      <img
                        src={playlist.img || "https://via.placeholder.com/144"}
                        alt={playlist.title}
                        className="w-32 h-32 sm:w-36 sm:h-36 rounded mb-2 object-cover"
                        loading="lazy"
                      />
                      <div className="text-center">
                        <span className="text-white font-medium text-sm sm:text-base w-full line-clamp-2">
                          {playlist.title}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {playlist.songs.length} bài hát
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent
              variant="dark"
              className="max-w-[90vw] sm:max-w-[600px]"
            >
              <DialogHeader>
                <DialogTitle>Chọn Playlist</DialogTitle>
              </DialogHeader>
              <DialogDescription
                id="dialog-description"
                className="text-sm text-gray-400 mb-6"
              >
                Chọn một playlist để thêm bài hát vào danh sách phát của bạn.
              </DialogDescription>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userPlaylists.length > 0 ? (
                  userPlaylists.map((playlist) => (
                    <button
                      key={playlist.playlist_id}
                      onClick={() =>
                        handleAddSongToPlaylist(playlist.playlist_id)
                      }
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
                            <span className="text-xs text-gray-400">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-white text-base sm:text-lg font-semibold truncate flex-1">
                        {playlist.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-400 col-span-1 sm:col-span-2">
                    <p>
                      Không có playlist nào. Vui lòng tạo playlist trong phần
                      quản lý để sử dụng chức năng này.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
            <DialogContent
              variant="dark"
              className="max-w-[90vw] sm:max-w-[600px]"
            >
              <DialogHeader>
                <DialogTitle>Thay đổi Avatar</DialogTitle>
              </DialogHeader>
              <DialogDescription
                id="dialog-description"
                className="text-sm text-gray-400 mb-6"
              >
                Chọn một hình ảnh để đặt làm avatar của bạn.
              </DialogDescription>
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 sm:w-52 sm:h-52 bg-neutral-800 flex items-center justify-center rounded-full overflow-hidden">
                  {previewAvatar ? (
                    <img
                      src={previewAvatar}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : avatar ? (
                    <img
                      src={avatar}
                      alt="Current Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-neutral-400 text-sm">No Avatar</span>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                />
                <div className="flex justify-around items-center w-3/4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Chọn file
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAvatarSubmit}
                    disabled={!selectedAvatarFile}
                  >
                    Lưu
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};
