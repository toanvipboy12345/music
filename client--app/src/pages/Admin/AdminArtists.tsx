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
import { Toaster, toast } from 'sonner';
import api from '../../services/api';

interface Artist {
  artist_id: number;
  stage_name: string;
  popularity: number | null;
  profile_picture: string | null;
  created_at: string;
}

const AdminArtists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stageName, setStageName] = useState('');

  // Fetch artists
  const fetchArtists = async (page: number, search: string) => {
    try {
      console.log('Fetching artists with:', { page, limit, search, token: localStorage.getItem('token') });
      const response = await api.get('/admin/artists', {
        params: { page, limit, search },
      });
      console.log('Artists response:', response.data);
      setArtists(response.data.artists || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Fetch artists error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error('Không thể tải danh sách ca sĩ.', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau.',
      });
    }
  };

  useEffect(() => {
    fetchArtists(page, search);
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

  // Handle create artist
  const handleSaveArtist = async () => {
    try {
      if (!stageName.trim()) {
        toast.error('Vui lòng nhập tên ca sĩ.');
        return;
      }
      console.log('Creating artist with:', {
        stage_name: stageName,
        token: localStorage.getItem('token'),
      });
      const response = await api.post('/admin/artists', { stage_name: stageName }); // Sửa thành /admin/artists
      console.log('Create artist response:', response.data);
      toast.success('Thêm ca sĩ thành công.');
      setIsDialogOpen(false);
      setStageName('');
      fetchArtists(page, search);
    } catch (error: any) {
      console.error('Create artist error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại tên ca sĩ hoặc kết nối.',
      });
    }
  };

  // Open dialog for create
  const openDialog = () => {
    setStageName('');
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý ca sĩ</h1>

      {/* Search and Create Button */}
      <div className="flex justify-between mb-4">
        <div className="w-1/3">
          <Input
            placeholder="Tìm kiếm ca sĩ..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <Button variant="link" onClick={openDialog}>Thêm ca sĩ</Button>
      </div>

      {/* Artists Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên ca sĩ</TableHead>
            <TableHead>Độ nổi tiếng</TableHead>
            <TableHead>Ảnh đại diện</TableHead>
            <TableHead>Ngày tạo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artists.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Không có ca sĩ nào được tìm thấy.
              </TableCell>
            </TableRow>
          ) : (
            artists.map((artist) => (
              <TableRow key={artist.artist_id}>
                <TableCell>{artist.artist_id}</TableCell>
                <TableCell>{artist.stage_name}</TableCell>
                <TableCell>{artist.popularity ?? '-'}</TableCell>
                <TableCell>
                  {artist.profile_picture ? (
                    <img
                      src={artist.profile_picture}
                      alt={artist.stage_name}
                      className="w-1/6 h-auto object-cover rounded"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{new Date(artist.created_at).toLocaleDateString()}</TableCell>
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

      {/* Dialog for Create */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>Thêm ca sĩ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stage_name">Tên sân khấu</Label>
              <Input
                id="stage_name"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="Nhập tên ca sĩ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleSaveArtist}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminArtists;