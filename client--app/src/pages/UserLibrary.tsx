/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Button } from '@/components/ui/button';
import { MusicalNoteIcon, HeartIcon, UserIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { Toaster, toast } from 'sonner';
import api from '../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Playlist {
  id: number;
  title: string;
  img: string | null;
  description: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
}

interface Artist {
  id: number;
  stage_name: string;
  profile_picture: string | null;
  follower: number;
  created_at: string;
}

interface Song {
  id: number;
  title: string;
  audio_file_url: string | null;
  img: string | null;
  artist: {
    id: number;
    stage_name: string;
  };
  downloaded_at: string;
  created_at: string;
}

interface LibraryResponse {
  message: string;
  library: {
    user_playlists: Playlist[];
    liked_playlists: Playlist[];
    followed_artists: Artist[];
    downloaded_songs: Song[];
  };
}

interface NewPlaylistForm {
  title: string;
  description?: string;
  imgFile?: File | null;
  is_public?: boolean;
}

export const UserLibrary: React.FC = () => {
  const { isAuthenticated, userId, token, is_premium } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [library, setLibrary] = useState<LibraryResponse['library']>({
    user_playlists: [],
    liked_playlists: [],
    followed_artists: [],
    downloaded_songs: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState<NewPlaylistForm>({
    title: "",
    description: "",
    is_public: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated && userId && token) {
      fetchLibrary();
    } else {
      setLibrary({ user_playlists: [], liked_playlists: [], followed_artists: [], downloaded_songs: [] });
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, token]);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'user-playlists') setFilter('user-playlists');
    else if (path === 'liked-playlists') setFilter('liked-playlists');
    else if (path === 'followed-artists') setFilter('followed-artists');
    else if (path === 'downloaded-songs' && is_premium) setFilter('downloaded-songs');
    else setFilter('all');
  }, [location.pathname, is_premium]);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<LibraryResponse>('/user/library', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => {
        setLibrary(response.data.library);
        setIsLoading(false);
        console.log('Dữ liệu thư viện:', response.data.library);
      }, 1000);
    } catch (error: any) {
      console.error('Lỗi khi lấy dữ liệu thư viện:', error);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(error.response?.data?.message || 'Lỗi khi lấy dữ liệu thư viện', {
          style: { background: 'black', color: 'white' },
        });
      }, 1000);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tạo playlist", {
        style: { background: "black", color: "white" },
      });
      navigate("/login");
      return;
    }
    if (!newPlaylist.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề playlist", {
        style: { background: "black", color: "white" },
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", newPlaylist.title);
    formData.append("user_id", userId!.toString());
    if (newPlaylist.description) {
      formData.append("description", newPlaylist.description);
    }
    if (newPlaylist.imgFile) {
      formData.append("img_file", newPlaylist.imgFile);
    }
    formData.append("is_public", newPlaylist.is_public ? "true" : "false");

    try {
      setIsLoading(true);
      await api.post("/user/playlists", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setTimeout(() => {
        setIsModalOpen(false);
        setNewPlaylist({ title: "", description: "", imgFile: null, is_public: true });
        setImagePreview(null);
        fetchLibrary();
        setIsLoading(false);
        toast.success("Tạo playlist thành công", {
          style: { background: "black", color: "white" },
        });
      }, 1000);
    } catch (error: any) {
      console.error("Lỗi khi tạo playlist:", error);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(error.response?.data?.message || "Lỗi khi tạo playlist", {
          style: { background: "black", color: "white" },
        });
      }, 1000);
    }
  };

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tạo playlist", {
        style: { background: "black", color: "white" },
      });
      navigate("/login");
      return;
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setNewPlaylist({ ...newPlaylist, imgFile: file || null });
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handlePublicChange = (checked: boolean) => {
    setNewPlaylist({ ...newPlaylist, is_public: checked });
  };

  const handlePrivateChange = (checked: boolean) => {
    setNewPlaylist({ ...newPlaylist, is_public: !checked });
  };

  const filteredResults = () => {
    if (!library) return { user_playlists: [], liked_playlists: [], followed_artists: [], downloaded_songs: [] };
    return {
      user_playlists: filter === 'all' || filter === 'user-playlists' ? library.user_playlists : [],
      liked_playlists: filter === 'all' || filter === 'liked-playlists' ? library.liked_playlists : [],
      followed_artists: filter === 'all' || filter === 'followed-artists' ? library.followed_artists : [],
      downloaded_songs: (filter === 'all' || filter === 'downloaded-songs') && is_premium ? library.downloaded_songs : [],
    };
  };

  const { user_playlists, liked_playlists, followed_artists, downloaded_songs } = filteredResults();

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen text-white py-6 px-10 bg-neutral-900 rounded-lg">
        {isAuthenticated ? (
          <>
            {/* Thanh lọc */}
            <div className="flex justify-start gap-4 mb-6">
              <Button
                variant={filter === 'all' ? 'outline' : 'filter'}
                className="px-4 py-2 rounded-full"
                onClick={() => {
                  setFilter('all');
                }}
              >
                Tất cả
              </Button>
              <Button
                variant={filter === 'user-playlists' ? 'outline' : 'filter'}
                className="px-4 py-2 rounded-full"
                onClick={() => {
                  setFilter('user-playlists');
                }}
              >
                Playlist của bạn
              </Button>
              <Button
                variant={filter === 'liked-playlists' ? 'outline' : 'filter'}
                className="px-4 py-2 rounded-full"
                onClick={() => {
                  setFilter('liked-playlists');
                }}
              >
                Playlist đã thích
              </Button>
              <Button
                variant={filter === 'followed-artists' ? 'outline' : 'filter'}
                className="px-4 py-2 rounded-full"
                onClick={() => {
                  setFilter('followed-artists');
                }}
              >
                Nghệ sĩ đã follow
              </Button>
              {is_premium && (
                <Button
                  variant={filter === 'downloaded-songs' ? 'outline' : 'filter'}
                  className="px-4 py-2 rounded-full"
                  onClick={() => {
                    setFilter('downloaded-songs');
                  }}
                >
                  Bài hát đã tải
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {/* Skeleton cho thanh lọc */}
                <div className="flex justify-start gap-4 mb-6">
                  {[...Array(is_premium ? 5 : 4)].map((_, index) => (
                    <Skeleton key={index} height={40} width={120} className="rounded-full" />
                  ))}
                </div>
                {/* Skeleton cho kết quả */}
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center p-3">
                      <Skeleton height={144} width={144} circle={filter === 'followed-artists'} />
                      <Skeleton height={20} width={100} className="ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (user_playlists.length === 0 && liked_playlists.length === 0 && followed_artists.length === 0 && downloaded_songs.length === 0) ? (
              <div className="text-center py-12">
                <MusicalNoteIcon className="h-12 w-12 mx-auto text-neutral-500" />
                <p className="mt-4 text-neutral-400">Thư viện trống. Hãy tạo playlist hoặc follow nghệ sĩ để bắt đầu!</p>

              </div>
            ) : (
              <div className="space-y-8">
                {/* Playlist của bạn */}
                {user_playlists.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <MusicalNoteIcon className="h-5 w-5" />
                        Playlist của bạn
                      </h2>
                      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={handleOpenCreateModal}
                            disabled={!isAuthenticated || isLoading}
                          >
                            <PlusIcon className="h-8 w-8" />
                            Thêm
                          </Button>
                        </DialogTrigger>
                        <DialogContent variant="dark" className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle className="text-white">Tạo Playlist Mới</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreatePlaylist} className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="img_file" className="text-white">Ảnh (tùy chọn)</Label>
                                <Input
                                  id="img_file"
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif"
                                  onChange={handleImageChange}
                                  className="mt-1 text-white file:bg-neutral-700 file:text-white file:border-none file:rounded file:px-3 file:py-1"
                                  disabled={isLoading}
                                />
                              </div>
                              {imagePreview && (
                                <div className="mt-2">
                                  <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 rounded object-cover border border-neutral-700"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="title" className="text-white">Tiêu đề</Label>
                                <Input
                                  id="title"
                                  value={newPlaylist.title}
                                  onChange={(e) =>
                                    setNewPlaylist({ ...newPlaylist, title: e.target.value })
                                  }
                                  placeholder="Nhập tiêu đề playlist"
                                  className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400"
                                  disabled={isLoading}
                                />
                              </div>
                              <div>
                                <Label htmlFor="description" className="text-white">Mô tả</Label>
                                <Input
                                  id="description"
                                  value={newPlaylist.description || ""}
                                  onChange={(e) =>
                                    setNewPlaylist({
                                      ...newPlaylist,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Nhập mô tả (tùy chọn)"
                                  className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400"
                                  disabled={isLoading}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-white">Chế độ</Label>
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="public"
                                      checked={newPlaylist.is_public === true}
                                      onCheckedChange={handlePublicChange}
                                      disabled={isLoading}
                                    />
                                    <Label htmlFor="public" className="text-white">Công khai</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="private"
                                      checked={newPlaylist.is_public === false}
                                      onCheckedChange={handlePrivateChange}
                                      disabled={isLoading}
                                    />
                                    <Label htmlFor="private" className="text-white">Riêng tư</Label>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="submit"
                                variant="outline"
                                disabled={isLoading}
                              >
                                {isLoading ? "Đang tạo..." : "Tạo Playlist"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user_playlists.map((playlist) => (
                        <Link
                          to={`/playlists/${playlist.id}`}
                          key={playlist.id}
                          className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                        >
                          {playlist.img ? (
                            <img
                              src={playlist.img}
                              alt={playlist.title}
                              className="w-36 h-36 rounded mb-2 object-cover"
                            />
                          ) : (
                            <div className="w-36 h-36 rounded bg-neutral-700 flex items-center justify-center mb-2">
                              <MusicalNoteIcon className="h-12 w-12 text-neutral-400" />
                            </div>
                          )}
                          <div className="text-center">
                            <span className="text-white font-medium text-sm w-36 line-clamp-2">
                              {playlist.title}
                            </span>
                            <p className="text-gray-400 text-sm">{playlist.description || 'Không có mô tả'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Playlist đã thích */}
                {liked_playlists.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                      <HeartIcon className="h-5 w-5" />
                      Playlist đã thích
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {liked_playlists.map((playlist) => (
                        <Link
                          to={`/playlists/${playlist.id}`}
                          key={playlist.id}
                          className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                        >
                          {playlist.img ? (
                            <img
                              src={playlist.img}
                              alt={playlist.title}
                              className="w-36 h-36 rounded mb-2 object-cover"
                            />
                          ) : (
                            <div className="w-36 h-36 rounded bg-neutral-700 flex items-center justify-center mb-2">
                              <MusicalNoteIcon className="h-12 w-12 text-neutral-400" />
                            </div>
                          )}
                          <div className="text-center">
                            <span className="text-white font-medium text-sm w-36 line-clamp-2">
                              {playlist.title}
                            </span>
                            <p className="text-gray-400 text-sm">{playlist.description || 'Không có mô tả'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nghệ sĩ đã follow */}
                {followed_artists.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Nghệ sĩ đã follow
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {followed_artists.map((artist) => (
                        <Link
                          to={`/artists/${artist.id}`}
                          key={artist.id}
                          className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                        >
                          {artist.profile_picture ? (
                            <img
                              src={artist.profile_picture}
                              alt={artist.stage_name}
                              className="w-36 h-36 rounded-full mb-2 object-cover"
                            />
                          ) : (
                            <div className="w-36 h-36 rounded-full bg-neutral-700 flex items-center justify-center mb-2">
                              <UserIcon className="h-12 w-12 text-neutral-400" />
                            </div>
                          )}
                          <div className="text-center">
                            <span className="text-white font-medium text-sm w-36 line-clamp-2">
                              {artist.stage_name}
                            </span>
                            <p className="text-gray-400 text-sm">{artist.follower} người theo dõi</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bài hát đã tải */}
                {is_premium && downloaded_songs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Bài hát đã tải
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {downloaded_songs.map((song) => (
                        <Link
                          to={`/songs/${song.id}`}
                          key={song.id}
                          className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                        >
                          {song.img ? (
                            <img
                              src={song.img}
                              alt={song.title}
                              className="w-36 h-36 rounded mb-2 object-cover"
                            />
                          ) : (
                            <div className="w-36 h-36 rounded bg-neutral-700 flex items-center justify-center mb-2">
                              <MusicalNoteIcon className="h-12 w-12 text-neutral-400" />
                            </div>
                          )}
                          <div className="text-center">
                            <span className="text-white font-medium text-sm w-36 line-clamp-2">
                              {song.title}
                            </span>
                            <p className="text-gray-400 text-sm">{song.artist.stage_name}</p>
                            <p className="text-gray-500 text-xs">
                              Tải xuống: {new Date(song.downloaded_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <MusicalNoteIcon className="h-12 w-12 mx-auto text-neutral-500" />
            <p className="mt-4 text-neutral-400">Vui lòng đăng nhập để xem và quản lý thư viện của bạn</p>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="mt-4 text-black border-white hover:bg-white hover:text-black"
            >
              Đăng nhập
            </Button>
          </div>
        )}
      </div>
    </>
  );
};