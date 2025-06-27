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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Toaster, toast } from 'sonner';
import { X } from 'lucide-react';
import api from '../../services/api';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  release_date: string | null;
  audio_file_url: string;
  img: string | null;
  artist_id: number;
  feat_artist_ids: number[] | null;
  genre_id: number;
  is_downloadable: boolean;
  created_at: string;
  artists: { artist_id: number; stage_name: string; profile_picture: string | null }[];
  genre: { genre_id: number; name: string };
}

interface Artist {
  artist_id: number;
  stage_name: string;
  profile_picture: string | null;
}

interface Genre {
  genre_id: number;
  name: string;
}

const AdminSongs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [mainArtist, setMainArtist] = useState<string>('');
  const [featArtists, setFeatArtists] = useState<string[]>([]);
  const [genreId, setGenreId] = useState('');
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  // Fetch songs
  const fetchSongs = async (page: number, search: string) => {
    try {
      console.log('Fetching song with:', { page, limit, search, token: localStorage.getItem('token') });
      const response = await api.get('/admin/songs', {
        params: { page, limit, search },
      });
      setSongs(response.data.songs || []);
      setTotal(response.data.total || 0);
      console.log('Songs fetched:', response.data.songs);
    } catch (error: any) {
      toast.error('Không thể tải danh sách bài hát.', {
        description: 'Vui lòng thử lại sau.',
      });
    }
  };

  // Fetch artists and genres
  const fetchArtistsAndGenres = async () => {
    try {
      const [artistsResponse, genresResponse] = await Promise.all([
        api.get('/admin/artists'),
        api.get('/admin/genres'),
      ]);
      console.log('Artists:', artistsResponse.data);
      console.log('Genres:', genresResponse.data);
      setArtists(artistsResponse.data.artists || []);
      setGenres(genresResponse.data.genres || []);
    } catch (error: any) {
      console.error('API error:', error.response?.data || error.message);
      toast.error('Không thể tải danh sách ca sĩ hoặc thể loại.', {
        description: error.response?.data?.message || 'Vui lòng kiểm tra kết nối hoặc token.',
      });
    }
  };

  useEffect(() => {
    fetchSongs(page, search);
    fetchArtistsAndGenres();
  }, [page, search]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
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
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleImgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImgFile(e.target.files[0]);
    }
  };

  // Handle save or update song
  const handleSaveOrUpdateSong = async () => {
    try {
      if (!title.trim()) {
        toast.error('Vui lòng nhập tiêu đề bài hát.');
        return;
      }
      if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
        toast.error('Vui lòng nhập thời lượng hợp lệ (giây).');
        return;
      }
      if (!mainArtist) {
        toast.error('Vui lòng chọn ca sĩ chính.');
        return;
      }
      if (!genreId) {
        toast.error('Vui lòng chọn thể loại.');
        return;
      }
      if (dialogMode === 'create' && !audioFile) {
        toast.error('Vui lòng chọn file âm thanh.');
        return;
      }
      const artistNames = [mainArtist, ...featArtists];
      const formData = new FormData();
      formData.append('title', title);
      formData.append('duration', duration);
      if (releaseDate) formData.append('release_date', releaseDate);
      formData.append('artist_names', JSON.stringify(artistNames));
      formData.append('genre_id', genreId);
      formData.append('is_downloadable', isDownloadable.toString());
      if (audioFile) {
        formData.append('audio_file', audioFile);
      }
      if (imgFile) {
        formData.append('img_file', imgFile);
      }

      if (dialogMode === 'create') {
        await api.post('/admin/songs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Thêm bài hát thành công.');
      } else {
        if (!selectedSong) return;
        await api.put(`/admin/songs/${selectedSong.song_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cập nhật bài hát thành công.');
      }
      setIsSongDialogOpen(false);
      resetForm();
      fetchSongs(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Handle delete song
  const handleDeleteSong = async () => {
    if (!selectedSong) return;
    try {
      await api.delete(`/admin/songs/${selectedSong.song_id}`);
      toast.success('Xóa bài hát thành công.');
      setIsDeleteDialogOpen(false);
      setSelectedSong(null);
      fetchSongs(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Open dialog for create
  const openCreateDialog = () => {
    resetForm();
    setDialogMode('create');
    setIsSongDialogOpen(true);
  };

  // Open dialog for edit
  const openEditDialog = (song: Song) => {
    setSelectedSong(song);
    setTitle(song.title);
    setDuration(song.duration.toString());
    setReleaseDate(song.release_date || '');
    setMainArtist(song.artists[0]?.stage_name || '');
    setFeatArtists(song.artists.slice(1).map((a) => a.stage_name));
    setGenreId(song.genre_id.toString());
    setIsDownloadable(song.is_downloadable);
    setAudioFile(null);
    setImgFile(null);
    setDialogMode('edit');
    setIsSongDialogOpen(true);
  };

  // Open dialog for delete
  const openDeleteDialog = (song: Song) => {
    setSelectedSong(song);
    setIsDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDuration('');
    setReleaseDate('');
    setMainArtist('');
    setFeatArtists([]);
    setGenreId('');
    setIsDownloadable(false);
    setAudioFile(null);
    setImgFile(null);
    setSelectedSong(null);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý bài hát</h1>

      {/* Search and Create Button */}
      <div className="flex justify-between mb-4">
        <div className="w-1/3">
          <Input
            placeholder="Tìm kiếm bài hát..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <Button onClick={openCreateDialog}>Thêm bài hát</Button>
      </div>

      {/* Songs Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Hình ảnh</TableHead>
            <TableHead>Ca sĩ</TableHead>
            <TableHead>Thể loại</TableHead>
            <TableHead>Thời lượng</TableHead>
            <TableHead>Ngày phát hành</TableHead>
            <TableHead>Tải xuống</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                Không có bài hát nào được tìm thấy.
              </TableCell>
            </TableRow>
          ) : (
            songs.map((song) => (
              <TableRow key={song.song_id}>
                <TableCell>{song.song_id}</TableCell>
                <TableCell>{song.title}</TableCell>
                <TableCell>
                  {song.img ? (
                    <img
                      src={song.img}
                      alt={song.title}
                      className="w-1/3 h-auto object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.png';
                      }}
                    />
                  ) : (
                    <img
                      src="/placeholder.png"
                      alt="No image"
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </TableCell>
                <TableCell
                  title={song.artists.map((a) => a.stage_name).join(', ')}
                >
                  {song.artists.length > 3
                    ? `${song.artists.slice(0, 3).map((a) => a.stage_name).join(', ')}...`
                    : song.artists.map((a) => a.stage_name).join(', ')}
                </TableCell>
                <TableCell>{song.genre.name}</TableCell>
                <TableCell>{formatDuration(song.duration)}</TableCell>
                <TableCell>
                  {song.release_date ? new Date(song.release_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>{song.is_downloadable ? 'Có' : 'Không'}</TableCell>
                <TableCell>{new Date(song.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(song)}>
                      Sửa
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(song)}>
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <Button onClick={handlePrevPage} disabled={page === 1}>
          Trang trước
        </Button>
        <span>
          Trang {page} / {totalPages}
        </span>
        <Button onClick={handleNextPage} disabled={page === totalPages}>
          Trang sau
        </Button>
      </div>

      {/* Dialog for Create/Edit Song */}
      <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Thêm bài hát' : 'Sửa bài hát'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Điền thông tin bài hát mới vào các trường bên dưới.'
                : 'Cập nhật thông tin bài hát bên dưới. Các trường không thay đổi có thể để trống.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài hát"
              />
            </div>
            <div>
              <Label htmlFor="duration">Thời lượng (giây)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Nhập thời lượng"
              />
            </div>
            <div>
              <Label htmlFor="release_date">Ngày phát hành</Label>
              <Input
                id="release_date"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="main_artist">Ca sĩ chính</Label>
              <Select
                onValueChange={(value) => {
                  if (value && !featArtists.includes(value)) {
                    setMainArtist(value);
                  } else {
                    toast.error('Ca sĩ này đã được chọn làm ca sĩ hợp tác.');
                  }
                }}
                value={mainArtist}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ca sĩ chính" />
                </SelectTrigger>
                <SelectContent>
                  {artists.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-gray-500">Không có ca sĩ</div>
                  ) : (
                    artists.map((artist) => (
                      <SelectItem key={artist.artist_id} value={artist.stage_name}>
                        {artist.stage_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="feat_artists">Ca sĩ hợp tác (Feat)</Label>
              <Select
                onValueChange={(value) => {
                  if (value && !featArtists.includes(value) && value !== mainArtist) {
                    setFeatArtists([...featArtists, value]);
                  } else if (value === mainArtist) {
                    toast.error('Ca sĩ này đã được chọn làm ca sĩ chính.');
                  } else if (featArtists.includes(value)) {
                    toast.error('Ca sĩ này đã được chọn.');
                  }
                }}
                value="" // Reset dropdown sau khi chọn
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ca sĩ hợp tác" />
                </SelectTrigger>
                <SelectContent>
                  {artists.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-gray-500">Không có ca sĩ</div>
                  ) : (
                    artists.map((artist) => (
                      <SelectItem key={artist.artist_id} value={artist.stage_name}>
                        {artist.stage_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {featArtists.map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm"
                  >
                    {name}
                    <button
                      type="button"
                      className="ml-2 text-red-500"
                      onClick={() => setFeatArtists(featArtists.filter((_, i) => i !== index))}
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="genre_id">Thể loại</Label>
              <Select onValueChange={setGenreId} value={genreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thể loại" />
                </SelectTrigger>
                <SelectContent>
                  {genres.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-gray-500">Chưa có thể loại nào được thêm</div>
                  ) : (
                    genres.map((genre) => (
                      <SelectItem key={genre.genre_id} value={genre.genre_id.toString()}>
                        {genre.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="audio_file">File âm thanh</Label>
              <Input
                id="audio_file"
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
              />
              {dialogMode === 'edit' && selectedSong?.audio_file_url && (
                <p className="text-sm text-gray-500">
                  File hiện tại: {selectedSong.audio_file_url.split('/').pop()}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="img_file">Ảnh bài hát</Label>
              <Input
                id="img_file"
                type="file"
                accept="image/*"
                onChange={handleImgFileChange}
              />
              {dialogMode === 'edit' && selectedSong?.img && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Ảnh hiện tại: {selectedSong.img.split('/').pop()}
                  </p>
                  <img
                    src={selectedSong.img}
                    alt={selectedSong.title}
                    className="w-24 h-24 object-cover rounded mt-1"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.png'; // Placeholder nếu ảnh lỗi
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_downloadable"
                checked={isDownloadable}
                onCheckedChange={(checked) => setIsDownloadable(!!checked)}
              />
              <Label htmlFor="is_downloadable">Cho phép tải xuống</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSongDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveOrUpdateSong}>
              {dialogMode === 'create' ? 'Lưu' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bài hát</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài hát "{selectedSong?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteSong}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminSongs;