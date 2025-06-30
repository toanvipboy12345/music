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
  artist_id?: number; // Optional, vì API /admin/artists/search không trả artist_id
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
  const [mainArtistSearch, setMainArtistSearch] = useState('');
  const [featArtistSearch, setFeatArtistSearch] = useState('');
  const [mainArtistSuggestions, setMainArtistSuggestions] = useState<Artist[]>([]);
  const [featArtistSuggestions, setFeatArtistSuggestions] = useState<Artist[]>([]);
  const [showMainSuggestions, setShowMainSuggestions] = useState(false);
  const [showFeatSuggestions, setShowFeatSuggestions] = useState(false);

  // Debounce search terms
  const debouncedMainArtistSearch = useDebounce(mainArtistSearch, 300);
  const debouncedFeatArtistSearch = useDebounce(featArtistSearch, 300);

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
        api.get('/admin/artists', { params: { page: 1, limit: 50 } }),
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

  // Fetch artist suggestions
  const fetchArtistSuggestions = async (searchTerm: string, type: 'main' | 'feat') => {
    if (!searchTerm.trim()) {
      type === 'main' ? setMainArtistSuggestions([]) : setFeatArtistSuggestions([]);
      return;
    }
    try {
      const response = await api.get('/admin/artists/search', {
        params: { search: searchTerm, page: 1, limit: 10 },
      });
      const suggestions = response.data.artists || [];
      type === 'main' ? setMainArtistSuggestions(suggestions) : setFeatArtistSuggestions(suggestions);
    } catch (error: any) {
      toast.error('Không thể tìm kiếm ca sĩ.', {
        description: error.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  // Fetch suggestions when debounced search terms change
  useEffect(() => {
    fetchArtistSuggestions(debouncedMainArtistSearch, 'main');
  }, [debouncedMainArtistSearch]);

  useEffect(() => {
    fetchArtistSuggestions(debouncedFeatArtistSearch, 'feat');
  }, [debouncedFeatArtistSearch]);

  // Fetch songs and initial artists/genres
  useEffect(() => {
    fetchSongs(page, search);
    fetchArtistsAndGenres();
  }, [page, search]);

  // Handle search input for artists
  const handleMainArtistSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMainArtistSearch(e.target.value);
    setShowMainSuggestions(true);
  };

  const handleFeatArtistSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatArtistSearch(e.target.value);
    setShowFeatSuggestions(true);
  };

  // Handle select artist
  const handleSelectMainArtist = (artist: Artist) => {
    if (!featArtists.includes(artist.stage_name)) {
      setMainArtist(artist.stage_name);
      setMainArtistSearch('');
      setMainArtistSuggestions([]);
      setShowMainSuggestions(false);
    } else {
      toast.error('Ca sĩ này đã được chọn làm ca sĩ hợp tác.');
    }
  };

  const handleSelectFeatArtist = (artist: Artist) => {
    if (artist.stage_name !== mainArtist && !featArtists.includes(artist.stage_name)) {
      setFeatArtists([...featArtists, artist.stage_name]);
      setFeatArtistSearch('');
      setFeatArtistSuggestions([]);
      setShowFeatSuggestions(false);
    } else if (artist.stage_name === mainArtist) {
      toast.error('Ca sĩ này đã được chọn làm ca sĩ chính.');
    } else {
      toast.error('Ca sĩ này đã được chọn.');
    }
  };

  // Handle remove main artist
  const handleRemoveMainArtist = () => {
    setMainArtist('');
    setMainArtistSearch('');
  };

  // Handle search for songs
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
    setMainArtistSearch(song.artists[0]?.stage_name || '');
    setFeatArtistSearch('');
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
    setMainArtistSearch('');
    setFeatArtistSearch('');
    setMainArtistSuggestions([]);
    setFeatArtistSuggestions([]);
    setShowMainSuggestions(false);
    setShowFeatSuggestions(false);
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
        <Button variant="link" onClick={openCreateDialog}>Thêm bài hát</Button>
      </div>

      {/* Songs Table */}
      <div className="overflow-x-auto">
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/12 min-w-[60px] sm:w-1/12">ID</TableHead>
              <TableHead className="w-3/12 min-w-[120px] sm:w-3/12">Tiêu đề</TableHead>
              <TableHead className="w-2/12 min-w-[80px] sm:w-2/12">Hình ảnh</TableHead>
              <TableHead className="w-3/12 min-w-[150px] sm:w-1/4 truncate">Ca sĩ</TableHead>
              <TableHead className="w-1/12 min-w-[100px] sm:w-1/6">Thể loại</TableHead>
              <TableHead className="w-1/12 min-w-[80px] sm:w-1/12">Thời lượng</TableHead>
              <TableHead className="w-1/12 min-w-[80px] sm:w-1/12">Ngày phát hành</TableHead>
              <TableHead className="w-1/12 min-w-[80px] sm:w-1/12">Tải xuống</TableHead>
              <TableHead className="w-1/12 min-w-[80px] sm:w-1/12">Ngày tạo</TableHead>
              <TableHead className="w-2/12 min-w-[120px] sm:w-1/6">Hành động</TableHead>
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
                  <TableCell className="w-1/12 min-w-[60px] sm:w-1/12 text-sm sm:text-base">{song.song_id}</TableCell>
                  <TableCell className="w-3/12 min-w-[120px] sm:w-3/12 text-sm sm:text-base truncate">{song.title}</TableCell>
                  <TableCell className="w-2/12 min-w-[80px] sm:w-2/12">
                    {song.img ? (
                      <img
                        src={song.img}
                        alt={song.title}
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
                  <TableCell
                    className="w-3/12 min-w-[150px] sm:w-1/4 text-sm sm:text-base truncate"
                    title={song.artists.map((a) => a.stage_name).join(', ')}
                  >
                    {song.artists.length > 3
                      ? `${song.artists.slice(0, 3).map((a) => a.stage_name).join(', ')}...`
                      : song.artists.map((a) => a.stage_name).join(', ')}
                  </TableCell>
                  <TableCell className="w-1/12 min-w-[100px] sm:w-1/6 text-sm sm:text-base">{song.genre.name}</TableCell>
                  <TableCell className="w-1/12 min-w-[80px] sm:w-1/12 text-sm sm:text-base">{formatDuration(song.duration)}</TableCell>
                  <TableCell className="w-1/12 min-w-[80px] sm:w-1/12 text-sm sm:text-base">
                    {song.release_date ? new Date(song.release_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="w-1/12 min-w-[80px] sm:w-1/12 text-sm sm:text-base">{song.is_downloadable ? 'Có' : 'Không'}</TableCell>
                  <TableCell className="w-1/12 min-w-[80px] sm:w-1/12 text-sm sm:text-base">{new Date(song.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="w-2/12 min-w-[120px] sm:w-1/6">
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

      {/* Dialog for Create/Edit Song */}
      <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
        <DialogContent variant="white">
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
              <Input
                id="main_artist"
                value={mainArtistSearch}
                onChange={handleMainArtistSearch}
                placeholder="Tìm kiếm ca sĩ chính..."
                onFocus={() => setShowMainSuggestions(true)}
              />
              {showMainSuggestions && mainArtistSuggestions.length > 0 && (
                <div className="mt-1 max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg">
                  {mainArtistSuggestions.map((artist) => (
                    <div
                      key={artist.stage_name}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectMainArtist(artist)}
                    >
                      {artist.profile_picture ? (
                        <img
                          src={artist.profile_picture}
                          alt={artist.stage_name}
                          className="w-8 h-8 object-cover rounded mr-2"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                      ) : (
                        <img
                          src="/placeholder.png"
                          alt="No image"
                          className="w-8 h-8 object-cover rounded mr-2"
                        />
                      )}
                      <span>{artist.stage_name}</span>
                    </div>
                  ))}
                </div>
              )}
              {mainArtist && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm">
                    {mainArtist}
                    <button
                      type="button"
                      className="ml-2 text-red-500"
                      onClick={handleRemoveMainArtist}
                    >
                      <X size={16} />
                    </button>
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="feat_artists">Ca sĩ hợp tác (Feat)</Label>
              <Input
                id="feat_artists"
                value={featArtistSearch}
                onChange={handleFeatArtistSearch}
                placeholder="Tìm kiếm ca sĩ hợp tác..."
                onFocus={() => setShowFeatSuggestions(true)}
              />
              {showFeatSuggestions && featArtistSuggestions.length > 0 && (
                <div className="mt-1 max-h-60 overflow-y-auto border rounded-md bg-white shadow-lg">
                  {featArtistSuggestions.map((artist) => (
                    <div
                      key={artist.stage_name}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectFeatArtist(artist)}
                    >
                      {artist.profile_picture ? (
                        <img
                          src={artist.profile_picture}
                          alt={artist.stage_name}
                          className="w-8 h-8 object-cover rounded mr-2"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                      ) : (
                        <img
                          src="/placeholder.png"
                          alt="No image"
                          className="w-8 h-8 object-cover rounded mr-2"
                        />
                      )}
                      <span>{artist.stage_name}</span>
                    </div>
                  ))}
                </div>
              )}
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
                      e.currentTarget.src = '/placeholder.png';
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
            <Button variant="destructive" onClick={() => setIsSongDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleSaveOrUpdateSong}>
              {dialogMode === 'create' ? 'Lưu' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>Xóa bài hát</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài hát "{selectedSong?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="link" onClick={() => setIsDeleteDialogOpen(false)}>
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