/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
  DialogFooter,
} from "../../components/ui/dialog";
import { Toaster, toast } from "sonner";
import api from "../../services/api";

interface Genre {
  genre_id: number;
  name: string;
  created_at: string;
}

const AdminGenres: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<Genre | null>(null);
  const [name, setName] = useState("");

  // Fetch genres
  const fetchGenres = async (page: number, search: string) => {
    try {
      const response = await api.get("/admin/genres", {
        params: { page, limit, search },
      });
      console.log("API response:", response.data);
      setGenres(response.data.genres);
      setTotal(response.data.total);
    } catch (error: any) {
      console.error("API error:", error.response?.data || error.message);
      toast.error("Không thể tải danh sách thể loại.", {
        description: "Vui lòng thử lại sau.",
      });
    }
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

  // Handle create/edit genre
  const handleSaveGenre = async () => {
    try {
      if (isEditMode && currentGenre) {
        // Update genre
        await api.put(`/admin/genres/${currentGenre.genre_id}`, { name });
        toast.success("Cập nhật thể loại thành công.");
      } else {
        // Create genre
        await api.post("/admin/genres", { name });
        toast.success("Tạo thể loại thành công.");
      }
      setIsDialogOpen(false);
      setName("");
      setCurrentGenre(null);
      fetchGenres(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra.", {
        description: "Vui lòng kiểm tra lại.",
      });
    }
  };

  // Handle delete genre
  const handleDeleteGenre = async (id: number) => {
    try {
      await api.delete(`/admin/genres/${id}`);
      toast.success("Xóa thể loại thành công.");
      fetchGenres(page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra.", {
        description: "Vui lòng thử lại sau.",
      });
    }
  };

  // Open dialog for create/edit
  const openDialog = (genre?: Genre) => {
    if (genre) {
      setIsEditMode(true);
      setCurrentGenre(genre);
      setName(genre.name);
    } else {
      setIsEditMode(false);
      setCurrentGenre(null);
      setName("");
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý thể loại</h1>

      {/* Search and Create Button */}
      <div className="flex justify-between mb-4">
        <div className="w-1/3">
          <Input
            placeholder="Tìm kiếm thể loại..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <Button variant="link" onClick={() => openDialog()}>
          Thêm thể loại
        </Button>
      </div>

      {/* Genres Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên thể loại</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {genres.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Không có thể loại nào được tìm thấy.
              </TableCell>
            </TableRow>
          ) : (
            genres.map((genre) => (
              <TableRow key={genre.genre_id}>
                <TableCell>{genre.genre_id}</TableCell>
                <TableCell>{genre.name}</TableCell>
                <TableCell>
                  {new Date(genre.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="mr-2"
                    onClick={() => openDialog(genre)}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteGenre(genre.genre_id)}
                  >
                    Xóa
                  </Button>
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

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Sửa thể loại" : "Thêm thể loại"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên thể loại</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên thể loại"
              />
            </div>
          </div>
          <DialogFooter>
            <Button  variant="destructive" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleSaveGenre}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminGenres;
