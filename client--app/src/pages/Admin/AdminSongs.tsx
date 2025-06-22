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
import { Plus, X } from 'lucide-react';
import api from '../../services/api';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  release_date: string | null;
  audio_file_url: string;
  img: string | null;
  artist_id: number;
  feat_artist_ids: string | null;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [mainArtist, setMainArtist] = useState<string>(''); // Ca sĩ chính
  const [featArtists, setFeatArtists] = useState<string[]>([]); // Ca sĩ feat
  const [featArtistInputs, setFeatArtistInputs] = useState<string[]>(['']); // Input cho ca sĩ feat
  const [genreId, setGenreId] = useState('');
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  // Fetch songs
  const fetchSongs = async (page: number, search: string) => {
    try {
      const response = await api.get('/songs', {
        params: { page, limit, search },
      });
      setSongs(response.data.songs);
      setTotal(response.data.total);
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
        api.get('/artists'),
        api.get('/genres'),
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  // Handle add new feat artist input
  const handleAddFeatArtistInput = () => {
    setFeatArtistInputs([...featArtistInputs, '']);
  };

  // Handle feat artist input change
  const handleFeatArtistInputChange = (index: number, value: string) => {
    const newInputs = [...featArtistInputs];
    newInputs[index] = value;
    setFeatArtistInputs(newInputs);
  };

  // Handle remove feat artist input
  const handleRemoveFeatArtistInput = (index: number) => {
    setFeatArtistInputs(featArtistInputs.filter((_, i) => i !== index));
  };

  // Handle add feat artist to list
  const handleAddFeatArtist = (index: number) => {
    const artistName = featArtistInputs[index].trim();
    if (!artistName) {
      toast.error('Vui lòng chọn ca sĩ hợp tác.');
      return;
    }
    if (mainArtist === artistName) {
      toast.error('Ca sĩ này đã được chọn làm ca sĩ chính.');
      return;
    }
    if (featArtists.includes(artistName)) {
      toast.error('Ca sĩ này đã được chọn.');
      return;
    }
    setFeatArtists([...featArtists, artistName]);
    const newInputs = [...featArtistInputs];
    newInputs[index] = '';
    setFeatArtistInputs(newInputs);
  };

  // Handle create song
  const handleSaveSong = async () => {
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
      if (!audioFile) {
        toast.error('Vui lòng chọn file âm thanh.');
        return;
      }
      const artistNames = [mainArtist, ...featArtists];
      const formData = new FormData();
      formData.append('title', title);
      formData.append('duration', duration);
      if (releaseDate) formData.append('release_date', releaseDate);
      artistNames.forEach((name, index) => {
        formData.append(`artist_names[${index}]`, name);
      });
      formData.append('genre_id', genreId);
      formData.append('is_downloadable', isDownloadable.toString());
      formData.append('audio_file', audioFile);

      await api.post('/songs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Thêm bài hát thành công.');
      setIsDialogOpen(false);
      resetForm();
      fetchSongs(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Open dialog for create
  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDuration('');
    setReleaseDate('');
    setMainArtist('');
    setFeatArtists([]);
    setFeatArtistInputs(['']);
    setGenreId('');
    setIsDownloadable(false);
    setAudioFile(null);
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
        <Button onClick={openDialog}>Thêm bài hát</Button>
      </div>

      {/* Songs Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Ca sĩ</TableHead>
            <TableHead>Thể loại</TableHead>
            <TableHead>Thời lượng</TableHead>
            <TableHead>Ngày phát hành</TableHead>
            <TableHead>Tải xuống</TableHead>
            <TableHead>Ngày tạo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Không có bài hát nào được tìm thấy.
              </TableCell>
            </TableRow>
          ) : (
            songs.map((song) => (
              <TableRow key={song.song_id}>
                <TableCell>{song.song_id}</TableCell>
                <TableCell>{song.title}</TableCell>
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

      {/* Dialog for Create */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm bài hát</DialogTitle>
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
                    <SelectItem value="" disabled>
                      Không có ca sĩ
                    </SelectItem>
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
              <Label>Ca sĩ hợp tác (Feat)</Label>
              <div className="space-y-2">
                {featArtistInputs.map((input, index) => (
                  <div key={index} className="flex space-x-2 items-center">
                    <Select
                      onValueChange={(value) => {
                        if (value && !featArtists.includes(value) && value !== mainArtist) {
                          const newInputs = [...featArtistInputs];
                          newInputs[index] = value;
                          setFeatArtistInputs(newInputs);
                          setFeatArtists([...featArtists, value]);
                        } else if (value === mainArtist) {
                          toast.error('Ca sĩ này đã được chọn làm ca sĩ chính.');
                        } else {
                          toast.error('Ca sĩ này đã được chọn.');
                        }
                      }}
                      value={input}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ca sĩ hợp tác" />
                      </SelectTrigger>
                      <SelectContent>
                        {artists.length === 0 ? (
                          <SelectItem value="" disabled>
                            Không có ca sĩ
                          </SelectItem>
                        ) : (
                          artists.map((artist) => (
                            <SelectItem key={artist.artist_id} value={artist.stage_name}>
                              {artist.stage_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddFeatArtist(index)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveFeatArtistInput(index)}
                      disabled={featArtistInputs.length === 1 && !input}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddFeatArtistInput}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Thêm ca sĩ hợp tác
                </Button>
              </div>
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
                      ×
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
                    <SelectItem value="" disabled>
                      Không có thể loại
                    </SelectItem>
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
                onChange={handleFileChange}
              />
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveSong}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminSongs;