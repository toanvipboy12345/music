/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Toaster, toast } from "sonner";
import api from "../../services/api";

interface Genre {
  genre_id: number;
  name: string;
  img: string | null;
  created_at: string;
}

const AdminGenres: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  // Fetch genres
  const fetchGenres = async (page: number, search: string) => {
    try {
      const response = await api.get("/admin/genres", {
        params: { page, limit, search },
      });
      console.log("API response:", response.data);
      setGenres(response.data.genres || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error("API error:", error.response?.data || error.message);
      toast.error("Không thể tải danh sách thể loại.", {
        description: "Vui lòng thử lại sau.",
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Sync genres from Spotify
  const handleSyncGenres = async () => {
    try {
      const response = await api.post("/admin/genres/sync-spotify");
      toast.success("Đồng bộ thể loại từ Spotify thành công.", {
        description: `Đã tạo ${response.data.created} thể loại, cập nhật ${response.data.updated} thể loại.`,
        style: { background: 'black', color: 'white' },
      });
      fetchGenres(page, search); // Refresh danh sách thể loại
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi đồng bộ thể loại từ Spotify.", {
        description: "Vui lòng thử lại sau.",
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Handle delete genre
  const handleDeleteGenre = async () => {
    if (!selectedGenre) return;
    try {
      await api.delete(`/admin/genres/${selectedGenre.genre_id}`);
      toast.success("Xóa thể loại thành công.", {
        style: { background: 'black', color: 'white' },
      });
      setIsDeleteDialogOpen(false);
      setSelectedGenre(null);
      fetchGenres(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa thể loại.", {
        description: "Vui lòng kiểm tra lại.",
        style: { background: 'black', color: 'white' },
      });
    }
  };

  // Open dialog for delete
  const openDeleteDialog = (genre: Genre) => {
    setSelectedGenre(genre);
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => {
    fetchGenres(page, search);
  }, [page, search]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  // Handle pagination
  const totalPages = Math.ceil(total / limit);
  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Quản lý thể loại</h1>

      {/* Search and Sync Button */}
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
        <div className="w-full sm:w-1/3">
          <Input
            placeholder="Tìm kiếm thể loại..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <Button variant="link" onClick={handleSyncGenres}>
          Đồng bộ từ Spotify
        </Button>
      </div>

      {/* Genres Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/12 min-w-[60px] sm:w-1/12">ID</TableHead>
              <TableHead className="w-3/12 min-w-[120px] sm:w-3/12">Tên thể loại</TableHead>
              <TableHead className="w-2/12 min-w-[80px] sm:w-2/12">Hình ảnh</TableHead>
              <TableHead className="w-2/12 min-w-[80px] sm:w-2/12">Ngày tạo</TableHead>
              <TableHead className="w-2/12 min-w-[100px] sm:w-2/12">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {genres.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm sm:text-base">
                  Không có thể loại nào được tìm thấy.
                </TableCell>
              </TableRow>
            ) : (
              genres.map((genre) => (
                <TableRow key={genre.genre_id}>
                  <TableCell className="w-1/12 min-w-[60px] sm:w-1/12 text-sm sm:text-base">{genre.genre_id}</TableCell>
                  <TableCell className="w-3/12 min-w-[120px] sm:w-3/12 text-sm sm:text-base">{genre.name}</TableCell>
                  <TableCell className="w-2/12 min-w-[80px] sm:w-2/12">
                    {genre.img ? (
                      <img
                        src={genre.img}
                        alt={genre.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <span className="text-sm sm:text-base">Không có hình</span>
                    )}
                  </TableCell>
                  <TableCell className="w-2/12 min-w-[80px] sm:w-2/12 text-sm sm:text-base">
                    {new Date(genre.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="w-2/12 min-w-[100px] sm:w-2/12">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(genre)}
                    >
                      Xóa
                    </Button>
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
        <span className="text-sm sm:text-base">
          Trang {page} / {totalPages}
        </span>
        <Button variant="link" onClick={handleNextPage} disabled={page === totalPages}>
          Trang sau
        </Button>
      </div>

      {/* Dialog for Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>Xóa thể loại</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa thể loại "<span className="font-semibold">{selectedGenre?.name}</span>"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="link" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteGenre}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-right" />
    </div>
  );
};

export default AdminGenres;