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
import { Toaster, toast } from 'sonner';
import { X } from 'lucide-react';
import api from '../../services/api';

interface Album {
  album_id: number;
  title: string;
  release_date: string | null;
  img: string | null;
  artist_id: number;
  created_at: string;
  artist_name: string;
  artist_profile_picture: string | null;
  song_count: number;
  songs: { song_id: number; title: string; duration: number; audio_file_url: string; img: string | null; is_downloadable: boolean }[];
}

interface Artist {
  artist_id: number;
  stage_name: string;
  profile_picture: string | null;
}

interface Song {
  song_id: number;
  title: string;
  duration: number;
  audio_file_url: string;
  img: string | null;
  is_downloadable: boolean;
}

const AdminAlbums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [title, setTitle] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [mainArtist, setMainArtist] = useState<string>('');
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]); // Lưu danh sách song_id đã chọn

  // Fetch albums
  const fetchAlbums = async (page: number, search: string) => {
    try {
      console.log('Fetching albums with:', { page, limit, search, token: localStorage.getItem('token') });
      const response = await api.get('/admin/albums', {
        params: { page, limit, search },
      });
      setAlbums(response.data.albums || []);
      setTotal(response.data.total || 0);
      console.log('Albums response:', response.data);
    } catch (error: any) {
      toast.error('Không thể tải danh sách album.', {
        description: 'Vui lòng thử lại sau.',
      });
    }
  };

  // Fetch artists
  const fetchArtists = async () => {
    try {
      const response = await api.get('/admin/artists');
      console.log('Artists:', response.data);
      setArtists(response.data.artists || []);
    } catch (error: any) {
      console.error('API error:', error.response?.data || error.message);
      toast.error('Không thể tải danh sách ca sĩ.', {
        description: error.response?.data?.message || 'Vui lòng kiểm tra kết nối hoặc token.',
      });
    }
  };

  // Fetch songs
  const fetchSongs = async () => {
    try {
      const response = await api.get('/admin/songs', {
        params: { page: 1, limit: 1000 }, // Lấy tất cả bài hát (giới hạn lớn)
      });
      console.log('Songs:', response.data);
      setSongs(response.data.songs || []);
    } catch (error: any) {
      console.error('API error:', error.response?.data || error.message);
      toast.error('Không thể tải danh sách bài hát.', {
        description: error.response?.data?.message || 'Vui lòng kiểm tra kết nối hoặc token.',
      });
    }
  };

  useEffect(() => {
    fetchAlbums(page, search);
    fetchArtists();
    fetchSongs();
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
  const handleImgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImgFile(e.target.files[0]);
    }
  };

  // Handle song selection
  const handleSongSelection = (songId: string) => {
    const id = parseInt(songId);
    if (selectedSongs.includes(id)) {
      setSelectedSongs(selectedSongs.filter((sid) => sid !== id));
    } else {
      setSelectedSongs([...selectedSongs, id]);
    }
  };

  // Handle save or update album
  const handleSaveOrUpdateAlbum = async () => {
    try {
      if (!title.trim()) {
        toast.error('Vui lòng nhập tiêu đề album.');
        return;
      }
      if (!mainArtist) {
        toast.error('Vui lòng chọn ca sĩ chính.');
        return;
      }
      const formData = new FormData();
      formData.append('title', title);
      if (releaseDate) formData.append('release_date', releaseDate);
      formData.append('artist', JSON.stringify({ artist_id: mainArtist }));
      if (imgFile) {
        formData.append('img_file', imgFile);
      }
      if (selectedSongs.length > 0) {
        // Gửi danh sách song_id đã chọn
        const songsData = selectedSongs.map((songId) => ({ song_id: songId }));
        formData.append('songs', JSON.stringify(songsData));
      }
      

      if (dialogMode === 'create') {
        await api.post('/admin/albums', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Thêm album thành công.');
      } else {
        if (!selectedAlbum) return;
        await api.put(`/admin/albums/${selectedAlbum.album_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cập nhật album thành công.');
      }
      setIsAlbumDialogOpen(false);
      resetForm();
      fetchAlbums(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Handle delete album
  const handleDeleteAlbum = async () => {
    if (!selectedAlbum) return;
    try {
      await api.delete(`/admin/albums/${selectedAlbum.album_id}`);
      toast.success('Xóa album thành công.');
      setIsDeleteDialogOpen(false);
      setSelectedAlbum(null);
      fetchAlbums(page, search);
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
    setIsAlbumDialogOpen(true);
  };

  // Open dialog for edit
  const openEditDialog = (album: Album) => {
    setSelectedAlbum(album);
    setTitle(album.title);
    setReleaseDate(album.release_date || '');
    setMainArtist(album.artist_id.toString());
    setImgFile(null);
    setSelectedSongs(album.songs.map((song) => song.song_id)); // Khởi tạo danh sách bài hát đã chọn
    setDialogMode('edit');
    setIsAlbumDialogOpen(true);
  };

  // Open dialog for delete
  const openDeleteDialog = (album: Album) => {
    setSelectedAlbum(album);
    setIsDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setReleaseDate('');
    setMainArtist('');
    setImgFile(null);
    setSelectedSongs([]);
    setSelectedAlbum(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý album</h1>

      {/* Search and Create Button */}
      <div className="flex justify-between mb-4">
        <div className="w-1/3">
          <Input
            placeholder="Tìm kiếm album..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <Button variant="link" onClick={openCreateDialog}>Thêm album</Button>
      </div>

      {/* Albums Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Hình ảnh</TableHead>
            <TableHead>Ca sĩ chính</TableHead>
            <TableHead>Ảnh ca sĩ</TableHead>
            <TableHead>Ngày phát hành</TableHead>
            <TableHead>Số bài hát</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                Không có album nào được tìm thấy.
              </TableCell>
            </TableRow>
          ) : (
            albums.map((album) => (
              <TableRow key={album.album_id}>
                <TableCell>{album.album_id}</TableCell>
                <TableCell>{album.title}</TableCell>
                <TableCell>
                  {album.img ? (
                    <img
                      src={album.img}
                      alt={album.title}
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
                <TableCell>{album.artist_name}</TableCell>
                <TableCell>
                  {album.artist_profile_picture ? (
                    <img
                      src={album.artist_profile_picture}
                      alt={album.artist_name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.png';
                      }}
                    />
                  ) : (
                    <img
                      src="/placeholder.png"
                      alt="No profile"
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {album.release_date ? new Date(album.release_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>{album.song_count || 0}</TableCell>
                <TableCell>{new Date(album.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="link" size="sm" onClick={() => openEditDialog(album)}>
                      Sửa
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(album)}>
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

      {/* Dialog for Create/Edit Album */}
      <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Thêm album' : 'Sửa album'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Điền thông tin album mới và chọn bài hát vào các trường bên dưới.'
                : 'Cập nhật thông tin album và danh sách bài hát bên dưới. Các trường không thay đổi có thể để trống.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề album"
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
                onValueChange={(value) => setMainArtist(value)}
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
                      <SelectItem key={artist.artist_id} value={artist.artist_id.toString()}>
                        {artist.stage_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="img_file">Ảnh album</Label>
              <Input
                id="img_file"
                type="file"
                accept="image/*"
                onChange={handleImgFileChange}
              />
              {dialogMode === 'edit' && selectedAlbum?.img && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Ảnh hiện tại: {selectedAlbum.img.split('/uploads/album/').pop()}
                  </p>
                  <img
                    src={selectedAlbum.img.startsWith('/uploads/album/') ? selectedAlbum.img : `/Uploads${selectedAlbum.img}`}
                    alt={selectedAlbum.title}
                    className="w-24 h-24 object-cover rounded mt-1"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.png';
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="songs">Bài hát</Label>
              <Select
                onValueChange={handleSongSelection}
                value=""
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bài hát để thêm vào album" />
                </SelectTrigger>
                <SelectContent>
                  {songs.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-gray-500">Không có bài hát</div>
                  ) : (
                    songs.map((song) => (
                      <SelectItem key={song.song_id} value={song.song_id.toString()}>
                        {song.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Label>Danh sách bài hát đã chọn:</Label>
                {selectedSongs.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có bài hát nào được chọn.</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {selectedSongs.map((songId) => {
                      const song = songs.find((s) => s.song_id === songId);
                      return (
                        <li key={songId} className="flex items-center justify-between">
                          <span>{song ? song.title : `Bài hát ${songId}`}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSongs(selectedSongs.filter((sid) => sid !== songId))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsAlbumDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleSaveOrUpdateAlbum}>
              {dialogMode === 'create' ? 'Lưu' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>Xóa album</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa album "{selectedAlbum?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="link" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteAlbum}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminAlbums;