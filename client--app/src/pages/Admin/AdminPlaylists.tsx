/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Toaster, toast } from 'sonner';
import { X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Custom useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Playlist {
  playlist_id: number;
  title: string;
  img: string | null;
  description: string | null;
  user_id: number;
  username: string | null;
  full_name: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
}

interface Song {
  song_id: number;
  title: string;
}

const AdminPlaylists: React.FC = () => {
  const { userId } = useAuth(); // Lấy userId từ AuthContext
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [songIds, setSongIds] = useState<string[]>([]);
  const [songSearch, setSongSearch] = useState('');
  const [songSuggestions, setSongSuggestions] = useState<Song[]>([]);
  const [showSongSuggestions, setShowSongSuggestions] = useState(false);

  // Debounce song search
  const debouncedSongSearch = useDebounce(songSearch, 300);

  // Fetch playlists
  const fetchPlaylists = async (page: number, search: string) => {
    try {
      console.log('Fetching playlists with:', { page, limit, search, token: localStorage.getItem('token') });
      const response = await api.get('/admin/playlists/summary', {
        params: { page, limit, search },
      });
      setPlaylists(response.data.playlists || []);
      setTotal(response.data.total || 0);
      console.log('Playlists fetched:', response.data.playlists);
    } catch (error: any) {
      toast.error('Không thể tải danh sách playlist.', {
        description: 'Vui lòng thử lại sau.',
      });
    }
  };

  // Fetch song suggestions
  const fetchSongSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSongSuggestions([]);
      return;
    }
    try {
      const response = await api.get('/admin/songs', {
        params: { search: searchTerm, page: 1, limit: 10 },
      });
      setSongSuggestions(response.data.songs || []);
    } catch (error: any) {
      toast.error('Không thể tìm kiếm bài hát.', {
        description: error.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  // Fetch suggestions when debounced song search changes
  useEffect(() => {
    fetchSongSuggestions(debouncedSongSearch);
  }, [debouncedSongSearch]);

  // Fetch playlists on mount
  useEffect(() => {
    fetchPlaylists(page, search);
  }, [page, search]);

  // Handle search input for playlists
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Handle song search
  const handleSongSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSongSearch(e.target.value);
    setShowSongSuggestions(true);
  };

  // Handle select song
  const handleSelectSong = (song: Song) => {
    if (!songIds.includes(song.song_id.toString())) {
      setSongIds([...songIds, song.song_id.toString()]);
      setSongSearch('');
      setShowSongSuggestions(false);
    } else {
      toast.error('Bài hát này đã được chọn.');
    }
  };

  // Handle remove song
  const handleRemoveSong = (songId: string) => {
    setSongIds(songIds.filter((id) => id !== songId));
  };

  // Handle pagination
  const totalPages = Math.ceil(total / limit);
  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  // Handle file change
  const handleImgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImgFile(e.target.files[0]);
    }
  };

  // Handle create playlist
  const handleCreatePlaylist = async () => {
    try {
      if (!title.trim()) {
        toast.error('Vui lòng nhập tiêu đề playlist.');
        return;
      }
      if (!userId) {
        toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }
      const formData = new FormData();
      formData.append('title', title);
      formData.append('user_id', userId.toString());
      formData.append('description', description);
      formData.append('is_public', isPublic.toString());
      if (imgFile) {
        formData.append('img_file', imgFile);
      }
      if (songIds.length > 0) {
        formData.append('song_ids', JSON.stringify(songIds.map(id => parseInt(id))));
      }

      await api.post('/admin/playlists', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Tạo playlist thành công.');
      setIsPlaylistDialogOpen(false);
      resetForm();
      fetchPlaylists(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setImgFile(null);
    setSongIds([]);
    setSongSearch('');
    setSongSuggestions([]);
    setShowSongSuggestions(false);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý danh sách phát</h1>

      {/* Search and Create Button */}
      <div className="flex justify-between mb-4">
        <div className="w-1/3">
          <Input
            placeholder="Tìm kiếm playlist..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <Button variant="link" onClick={() => setIsPlaylistDialogOpen(true)}>
          Thêm playlist
        </Button>
      </div>

      {/* Playlists Table */}
      <div className="overflow-x-auto">
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/12 min-w-[60px] sm:w-1/12">ID</TableHead>
              <TableHead className="w-3/12 min-w-[120px] sm:w-3/12">Tiêu đề</TableHead>
              <TableHead className="w-2/12 min-w-[80px] sm:w-2/12">Hình ảnh</TableHead>
              <TableHead className="w-2/12 min-w-[100px] sm:w-2/12">Người tạo</TableHead>
              <TableHead className="w-2/12 min-w-[100px] sm:w-2/12">Mô tả</TableHead>
              <TableHead className="w-1/12 min-w-[80px] sm:w-1/12">Công khai</TableHead>
              <TableHead className="w-1/12 min-w-[80px] sm:w-1/12">Lượt thích</TableHead>
              <TableHead className="w-1/12 min-w-[80px] sm:w-1/12">Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Không có playlist nào được tìm thấy.
                </TableCell>
              </TableRow>
            ) : (
              playlists.map((playlist) => (
                <TableRow key={playlist.playlist_id}>
                  <TableCell className="w-1/12 min-w-[60px] sm:w-1/12 text-sm sm:text-base">{playlist.playlist_id}</TableCell>
                  <TableCell className="w-3/12 min-w-[120px] sm:w-3/12 text-sm sm:text-base truncate">{playlist.title}</TableCell>
                  <TableCell className="w-2/12 min-w-[80px] sm:w-2/12">
                    {playlist.img ? (
                      <img
                        src={playlist.img}
                        alt={playlist.title}
                        className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <img
                        src="/placeholder.png"
                        alt="No image"
                        className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell className="w-2/12 min-w-[100px] sm:w-2/12 text-sm sm:text-base">{playlist.username || 'N/A'}</TableCell>
                  <TableCell className="w-2/12 min-w-[100px] sm:w-2/12 text-sm sm:text-base truncate">{playlist.description || '-'}</TableCell>
                  <TableCell className="w-1/12 min-w-[80px] sm:w-1/12 text-sm sm:text-base">{playlist.is_public ? 'Có' : 'Không'}</TableCell>
                  <TableCell className="w-1/12 min-w-[80px] sm:w-1/12 text-sm sm:text-base">{playlist.like_count}</TableCell>
                  <TableCell className="w-1/12 min-w-[80px] sm:w-1/12 text-sm sm:text-base">{formatDate(playlist.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <Button variant="link" onClick={handlePrevPage} disabled={page === 1}>
          Trang trước
        </Button>
        <span>
          Trang {page} / {totalPages}
        </span>
        <Button variant="link" onClick={handleNextPage} disabled={page === totalPages}>
          Trang sau
        </Button>
      </div>

      {/* Dialog for Create Playlist */}
      <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>Thêm playlist</DialogTitle>
            <DialogDescription>
              Điền thông tin playlist mới vào các trường bên dưới.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề playlist"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả (tùy chọn)"
              />
            </div>
            <div>
              <Label htmlFor="song_search">Thêm bài hát</Label>
              <Input
                id="song_search"
                value={songSearch}
                onChange={handleSongSearch}
                placeholder="Tìm kiếm bài hát..."
                onFocus={() => setShowSongSuggestions(true)}
              />
              {showSongSuggestions && songSuggestions.length > 0 && (
                <div className="mt-1 max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg">
                  {songSuggestions.map((song) => (
                    <div
                      key={song.song_id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectSong(song)}
                    >
                      {song.title}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {songIds.map((songId, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm"
                  >
                    {songSuggestions.find(s => s.song_id.toString() === songId)?.title || `ID: ${songId}`}
                    <button
                      type="button"
                      className="ml-2 text-red-500"
                      onClick={() => handleRemoveSong(songId)}
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="img_file">Ảnh playlist</Label>
              <Input
                id="img_file"
                type="file"
                accept="image/*"
                onChange={handleImgFileChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(!!checked)}
              />
              <Label htmlFor="is_public">Công khai</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsPlaylistDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleCreatePlaylist}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminPlaylists;