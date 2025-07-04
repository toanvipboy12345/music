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

  // Sync genres from Spotify
  const handleSyncGenres = async () => {
    try {
      const response = await api.post("/admin/genres/sync-spotify");
      toast.success("Đồng bộ thể loại từ Spotify thành công.", {
        description: `Đã tạo ${response.data.created} thể loại, cập nhật ${response.data.updated} thể loại.`,
      });
      fetchGenres(page, search); // Refresh danh sách thể loại
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi đồng bộ thể loại từ Spotify.", {
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý thể loại</h1>

      {/* Search and Sync Button */}
      <div className="flex justify-between mb-4">
        <div className="w-1/3">
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên thể loại</TableHead>
            <TableHead>Hình ảnh</TableHead>
            <TableHead>Ngày tạo</TableHead>
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
                  {genre.img ? (
                    <img
                      src={genre.img}
                      alt={genre.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    "Không có hình"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(genre.created_at).toLocaleDateString()}
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

      <Toaster />
    </div>
  );
};

export default AdminGenres;