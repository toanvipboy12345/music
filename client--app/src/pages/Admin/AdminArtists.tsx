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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip';

interface Artist {
  artist_id: number;
  stage_name: string;
  popularity: number | null;
  profile_picture: string | null;
  bio: string | null;
  created_at: string;
}

const AdminArtists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [stageName, setStageName] = useState('');
  const [bio, setBio] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

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
        bio,
        token: localStorage.getItem('token'),
      });
      const response = await api.post('/admin/artists', { stage_name: stageName, bio });
      console.log('Create artist response:', response.data);
      toast.success('Thêm ca sĩ thành công.');
      setIsCreateDialogOpen(false);
      setStageName('');
      setBio(null);
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

  // Handle edit artist bio
  const handleEditArtistBio = async () => {
    try {
      if (selectedArtistId === null) {
        toast.error('Không tìm thấy ID ca sĩ.');
        return;
      }
      if (bio !== undefined && (typeof bio !== 'string' || bio.length > 5000)) {
        toast.error('Tiểu sử không hợp lệ (tối đa 5000 ký tự).');
        return;
      }
      console.log('Updating artist bio with:', {
        artist_id: selectedArtistId,
        bio,
        token: localStorage.getItem('token'),
      });
      const response = await api.put(`/admin/artists/${selectedArtistId}/bio`, { bio });
      console.log('Update artist bio response:', response.data);
      toast.success('Cập nhật tiểu sử ca sĩ thành công.');
      setIsEditDialogOpen(false);
      setBio(null);
      setSelectedArtistId(null);
      fetchArtists(page, search);
    } catch (error: any) {
      console.error('Update artist bio error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng thử lại sau.',
      });
    }
  };

  // Handle sync all artists
  const handleSyncAllArtists = async () => {
    try {
      console.log('Syncing all artists with:', { token: localStorage.getItem('token') });
      const response = await api.post('/admin/artists/sync');
      console.log('Sync all artists response:', response.data);
      toast.success(`Đồng bộ thành công ${response.data.total_updated} ca sĩ.`, {
        description: response.data.total_failed > 0 
          ? `Không thể đồng bộ ${response.data.total_failed} ca sĩ.`
          : 'Tất cả ca sĩ đã được đồng bộ.',
      });
      fetchArtists(page, search);
    } catch (error: any) {
      console.error('Sync all artists error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || 'Lỗi khi đồng bộ ca sĩ.', {
        description: 'Vui lòng thử lại sau.',
      });
    }
  };

  // Handle sync single artist
  const handleSyncArtist = async (artistId: number, stageName: string) => {
    try {
      console.log('Syncing artist with:', { artist_id: artistId, token: localStorage.getItem('token') });
      const response = await api.post(`/admin/artists/${artistId}/sync`);
      console.log('Sync artist response:', response.data);
      toast.success(`Đồng bộ ca sĩ ${stageName} thành công.`);
      fetchArtists(page, search);
    } catch (error: any) {
      console.error('Sync artist error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || `Lỗi khi đồng bộ ca sĩ ${stageName}.`, {
        description: 'Vui lòng thử lại sau.',
      });
    }
  };

  // Open dialog for create
  const openCreateDialog = () => {
    setStageName('');
    setBio(null);
    setIsCreateDialogOpen(true);
  };

  // Open dialog for edit
  const openEditDialog = (artist: Artist) => {
    setSelectedArtistId(artist.artist_id);
    setStageName(artist.stage_name); // Chỉ hiển thị, không chỉnh sửa
    setBio(artist.bio || '');
    setIsEditDialogOpen(true);
  };

  // Open dialog for details
  const openDetailDialog = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsDetailDialogOpen(true);
  };

  // Hàm cắt bio để hiển thị 3-4 dòng (ước lượng 200 ký tự)
  const formatBioForDisplay = (bio: string | null) => {
    if (!bio) return '-';
    const maxLength = 200; // Ước lượng 3-4 dòng (tùy font, khoảng 50 ký tự/dòng)
    return bio.length > maxLength ? `${bio.substring(0, maxLength)}...` : bio;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý ca sĩ</h1>

      {/* Search and Create/Sync All Buttons */}
      <div className="flex justify-between mb-4 items-center">
        <div className="w-1/3">
          <Input
            placeholder="Tìm kiếm ca sĩ..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="link" onClick={openCreateDialog}>Thêm ca sĩ</Button>
          <Button variant="link" onClick={handleSyncAllArtists}>Đồng bộ tất cả</Button>
        </div>
      </div>

      {/* Artists Table */}
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[5%]">ID</TableHead>
            <TableHead className="w-[15%]">Tên ca sĩ</TableHead>
            <TableHead className="w-[10%]">Độ nổi tiếng</TableHead>
            <TableHead className="w-[15%]">Ảnh đại diện</TableHead>
            <TableHead className="w-[35%]">Tiểu sử</TableHead>
            <TableHead className="w-[10%]">Ngày tạo</TableHead>
            <TableHead className="w-[10%]">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artists.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Không có ca sĩ nào được tìm thấy.
              </TableCell>
            </TableRow>
          ) : (
            artists.map((artist) => (
              <TableRow key={artist.artist_id}>
                <TableCell className="text-center">{artist.artist_id}</TableCell>
                <TableCell>{artist.stage_name}</TableCell>
                <TableCell className="text-center">{artist.popularity ?? '-'}</TableCell>
                <TableCell>
                  {artist.profile_picture ? (
                    <img
                      src={artist.profile_picture}
                      alt={artist.stage_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="block whitespace-pre-wrap"
                        style={{ maxHeight: '4em', overflow: 'hidden' }}
                      >
                        {formatBioForDisplay(artist.bio)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md break-words">
                      <p>{artist.bio || '-'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-center">{new Date(artist.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="link" onClick={() => openEditDialog(artist)} className="mr-2">
                    Sửa
                  </Button>
                  <Button variant="link" onClick={() => handleSyncArtist(artist.artist_id, artist.stage_name)}>
                    Đồng bộ
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-between mt-4 items-center">
        <Button variant="link" onClick={handlePrevPage} disabled={page === 1}>
          Trang trước
        </Button>
        <span className="text-lg font-medium">
          Trang {page} / {totalPages}
        </span>
        <Button variant="link" onClick={handleNextPage} disabled={page === totalPages}>
          Trang sau
        </Button>
      </div>

      {/* Dialog for Create */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
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
            <div>
              <Label htmlFor="bio">Tiểu sử</Label>
              <textarea
                id="bio"
                value={bio || ''}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Nhập tiểu sử (tối đa 5000 ký tự)"
                className="w-full p-2 border rounded-md resize-y h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleSaveArtist}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Edit */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa ca sĩ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stage_name">Tên sân khấu</Label>
              <Input
                id="stage_name"
                value={stageName}
                disabled
                placeholder="Tên ca sĩ"
              />
            </div>
            <div>
              <Label htmlFor="bio">Tiểu sử</Label>
              <textarea
                id="bio"
                value={bio || ''}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Nhập tiểu sử (tối đa 5000 ký tự)"
                className="w-full p-2 border rounded-md resize-y h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleEditArtistBio}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Details */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết ca sĩ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID</Label>
              <Input value={selectedArtist?.artist_id || ''} disabled />
            </div>
            <div>
              <Label>Tên sân khấu</Label>
              <Input value={selectedArtist?.stage_name || ''} disabled />
            </div>
            <div>
              <Label>Độ nổi tiếng</Label>
              <Input value={selectedArtist?.popularity?.toString() || '-'} disabled />
            </div>
            <div>
              <Label>Ảnh đại diện</Label>
              <div className="p-2">
                {selectedArtist?.profile_picture ? (
                  <img
                    src={selectedArtist.profile_picture}
                    alt={selectedArtist.stage_name}
                    className="w-32 h-32 object-cover rounded"
                  />
                ) : (
                  '-'
                )}
              </div>
            </div>
            <div>
              <Label>Tiểu sử</Label>
              <textarea
                value={selectedArtist?.bio || ''}
                disabled
                className="w-full p-2 border rounded-md resize-y h-40"
              />
            </div>
            <div>
              <Label>Ngày tạo</Label>
              <Input value={selectedArtist ? new Date(selectedArtist.created_at).toLocaleDateString() : ''} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminArtists;