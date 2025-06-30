// /* eslint-disable @typescript-eslint/no-unused-vars */
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/authContext";
// import { Button } from "@/components/ui/button";
// import { Plus, Music, Trash2 } from "react-feather";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Toaster, toast } from "sonner";
// import api from "../../services/api";

// // Interface cho playlist
// interface PlaylistSummary {
//   playlist_id: number;
//   title: string;
//   img: string | null;
//   created_at: string;
//   description: string | null;
// }

// // Interface cho phản hồi API
// interface PlaylistSummaryResponse {
//   message: string;
//   playlists: PlaylistSummary[];
// }

// // Interface cho form tạo playlist
// interface NewPlaylistForm {
//   title: string;
//   description?: string;
//   imgFile?: File | null;
// }

// export const UserNavigation: React.FC = () => {
//   const { isAuthenticated, userId, token } = useAuth();
//   const navigate = useNavigate();
//   const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [selectedPlaylist, setSelectedPlaylist] = useState<{ id: number; title: string } | null>(null);
//   const [newPlaylist, setNewPlaylist] = useState<NewPlaylistForm>({
//     title: "",
//     description: "",
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);

//   useEffect(() => {
//     if (isAuthenticated && userId) {
//       fetchPlaylists();
//     } else {
//       setPlaylists([]);
//       setIsLoading(false);
//     }
//   }, [isAuthenticated, userId]);

//   const fetchPlaylists = async () => {
//     if (!isAuthenticated || !userId) {
//       console.log("Không gọi fetchPlaylists: Người dùng chưa đăng nhập");
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const response = await api.get<PlaylistSummaryResponse>(
//         `/user/playlists/user/${userId}/summary`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       // Trì hoãn hiển thị dữ liệu để đảm bảo skeleton loading kéo dài ít nhất 1 giây
//       setTimeout(() => {
//         setPlaylists(response.data.playlists);
//         setIsLoading(false);
//         console.log("Danh sách playlist:", response.data.playlists);
//       }, 1000);
//     } catch (error) {
//       console.error("Lỗi khi lấy danh sách playlist:", error);
//       setTimeout(() => {
//         setIsLoading(false);
//         toast.error(error.response?.data?.message || "Lỗi khi lấy danh sách playlist", {
//           style: { background: "black", color: "white" },
//         });
//       }, 1000);
//     }
//   };

//   const handleCreatePlaylist = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isAuthenticated) {
//       toast.error("Vui lòng đăng nhập để tạo playlist", {
//         style: { background: "black", color: "white" },
//       });
//       navigate("/login");
//       return;
//     }
//     if (!newPlaylist.title.trim()) {
//       toast.error("Vui lòng nhập tiêu đề playlist", {
//         style: { background: "black", color: "white" },
//       });
//       return;
//     }

//     const formData = new FormData();
//     formData.append("title", newPlaylist.title);
//     formData.append("user_id", userId!.toString());
//     if (newPlaylist.description) {
//       formData.append("description", newPlaylist.description);
//     }
//     if (newPlaylist.imgFile) {
//       formData.append("img_file", newPlaylist.imgFile);
//     }

//     try {
//       setIsLoading(true);
//       await api.post("/user/playlists", formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       setTimeout(() => {
//         setIsModalOpen(false);
//         setNewPlaylist({ title: "", description: "", imgFile: null });
//         setImagePreview(null);
//         fetchPlaylists();
//         setIsLoading(false);
//         toast.success("Tạo playlist thành công", {
//           style: { background: "black", color: "white" },
//         });
//       }, 1000);
//     } catch (error) {
//       console.error("Lỗi khi tạo playlist:", error);
//       setTimeout(() => {
//         setIsLoading(false);
//         toast.error(error.response?.data?.message || "Lỗi khi tạo playlist", {
//           style: { background: "black", color: "white" },
//         });
//       }, 1000);
//     }
//   };

//   const handleDeletePlaylist = async () => {
//     if (!isAuthenticated) {
//       toast.error("Vui lòng đăng nhập để xóa playlist", {
//         style: { background: "black", color: "white" },
//       });
//       navigate("/login");
//       return;
//     }
//     if (!selectedPlaylist) return;

//     try {
//       setIsLoading(true);
//       await api.delete(`/user/playlists/${selectedPlaylist.id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setTimeout(() => {
//         setIsDeleteModalOpen(false);
//         setSelectedPlaylist(null);
//         fetchPlaylists();
//         setIsLoading(false);
//         toast.success(`Xóa playlist "${selectedPlaylist.title}" thành công`, {
//           style: { background: "black", color: "white" },
//         });
//       }, 1000);
//     } catch (error) {
//       console.error("Lỗi khi xóa playlist:", error);
//       setTimeout(() => {
//         setIsLoading(false);
//         toast.error(error.response?.data?.message || "Lỗi khi xóa playlist", {
//           style: { background: "black", color: "white" },
//         });
//       }, 1000);
//     }
//   };

//   const handleOpenDeleteModal = (playlistId: number, playlistTitle: string) => {
//     if (!isAuthenticated) {
//       toast.error("Vui lòng đăng nhập để xóa playlist", {
//         style: { background: "black", color: "white" },
//       });
//       navigate("/login");
//       return;
//     }
//     if (!playlistId) {
//       console.error("Playlist ID is undefined:", { playlistId, playlistTitle });
//       toast.error("Không thể xóa: ID playlist không hợp lệ", {
//         style: { background: "black", color: "white" },
//       });
//       return;
//     }
//     setSelectedPlaylist({ id: playlistId, title: playlistTitle });
//     setIsDeleteModalOpen(true);
//   };

//   const handleOpenCreateModal = () => {
//     if (!isAuthenticated) {
//       toast.error("Vui lòng đăng nhập để tạo playlist", {
//         style: { background: "black", color: "white" },
//       });
//       navigate("/login");
//       return;
//     }
//     setIsModalOpen(true);
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     setNewPlaylist({ ...newPlaylist, imgFile: file || null });
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = () => {
//         setImagePreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     } else {
//       setImagePreview(null);
//     }
//   };

//   return (
//     <>
//       <Toaster position="top-right" />
//       <nav className="bg-neutral-900 text-white w-full p-6 h-screen rounded-md">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-xl font-bold flex items-center gap-2">
//             <Music className="h-5 w-5" />
//             Danh sách phát
//           </h2>
//           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//             <DialogTrigger asChild>
//               <Button
//                 variant="outline"
//                 className="text-black border-white hover:bg-white hover:text-black"
//                 onClick={handleOpenCreateModal}
//                 disabled={!isAuthenticated || isLoading}
//               >
//                 <Plus className="h-8 w-8" />
//                 Thêm
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-[600px] bg-neutral-900 text-white">
//               <DialogHeader>
//                 <DialogTitle className="text-white">Tạo Playlist Mới</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={handleCreatePlaylist} className="grid grid-cols-2 gap-4">
//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="img_file" className="text-white">Ảnh (tùy chọn)</Label>
//                     <Input
//                       id="img_file"
//                       type="file"
//                       accept="image/jpeg,image/png,image/gif"
//                       onChange={handleImageChange}
//                       className="mt-1 text-white file:bg-neutral-700 file:text-white file:border-none file:rounded file:px-3 file:py-1"
//                       disabled={isLoading}
//                     />
//                   </div>
//                   {imagePreview && (
//                     <div className="mt-2">
//                       <img
//                         src={imagePreview}
//                         alt="Preview"
//                         className="w-32 h-32 rounded object-cover border border-neutral-700"
//                       />
//                     </div>
//                   )}
//                 </div>
//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="title" className="text-white">Tiêu đề</Label>
//                     <Input
//                       id="title"
//                       value={newPlaylist.title}
//                       onChange={(e) =>
//                         setNewPlaylist({ ...newPlaylist, title: e.target.value })
//                       }
//                       placeholder="Nhập tiêu đề playlist"
//                       className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400"
//                       disabled={isLoading}
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="description" className="text-white">Mô tả</Label>
//                     <Input
//                       id="description"
//                       value={newPlaylist.description || ""}
//                       onChange={(e) =>
//                         setNewPlaylist({
//                           ...newPlaylist,
//                           description: e.target.value,
//                         })
//                       }
//                       placeholder="Nhập mô tả (tùy chọn)"
//                       className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400"
//                       disabled={isLoading}
//                     />
//                   </div>
//                   <Button
//                     type="submit"
//                     variant="outline"
//                     className="w-full border-white text-black hover:bg-white hover:scale-105 transition-transform"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? "Đang tạo..." : "Tạo Playlist"}
//                   </Button>
//                 </div>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {isAuthenticated ? (
//           isLoading ? (
//             <div className="space-y-4">
//               {[...Array(3)].map((_, index) => (
//                 <div key={index} className="animate-pulse">
//                   <div className="h-6 bg-neutral-700 rounded w-3/4"></div>
//                 </div>
//               ))}
//             </div>
//           ) : playlists.length === 0 ? (
//             <div className="text-center py-12">
//               <Music className="h-12 w-12 mx-auto text-neutral-500" />
//               <p className="mt-4 text-neutral-400">Chưa có playlist nào</p>
//               <Button
//                 onClick={handleOpenCreateModal}
//                 variant="outline"
//                 className="mt-4 text-black border-white hover:bg-white hover:text-black"
//                 disabled={isLoading}
//               >
//                 Tạo playlist đầu tiên
//               </Button>
//             </div>
//           ) : (
//             <ul className="space-y-2">
//               {playlists.map((playlist) => (
//                 <li key={playlist.title} className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-800 transition-colors">
//                   <Link
//                     to={`/playlists/${encodeURIComponent(playlist.title)}`}
//                     className="flex items-center gap-3 flex-1"
//                   >
//                     {playlist.img ? (
//                       <img
//                         src={playlist.img}
//                         alt={playlist.title}
//                         className="w-10 h-10 rounded object-cover"
//                       />
//                     ) : (
//                       <div className="w-10 h-10 rounded bg-neutral-700 flex items-center justify-center">
//                         <Music className="h-5 w-5 text-neutral-400" />
//                       </div>
//                     )}
//                     <div>
//                       <p className="font-medium hover:text-green-500">
//                         {playlist.title}
//                       </p>
//                       <p className="text-sm text-neutral-400">
//                         {playlist.description || "No description"}
//                       </p>
//                     </div>
//                   </Link>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => handleOpenDeleteModal(playlist.playlist_id, playlist.title)}
//                     className="text-white hover:bg-white hover:text-black"
//                     disabled={isLoading}
//                   >
//                     <Trash2 className="h-6 w-6" />
//                   </Button>
//                 </li>
//               ))}
//             </ul>
//           )
//         ) : (
//           <div className="text-center py-12">
//             <Music className="h-12 w-12 mx-auto text-neutral-500" />
//             <p className="mt-4 text-neutral-400">Vui lòng đăng nhập để xem và quản lý playlist</p>
//             <Button
//               onClick={() => navigate("/login")}
//               variant="outline"
//               className="mt-4 text-black border-white hover:bg-white hover:text-black"
//             >
//               Đăng nhập
//             </Button>
//           </div>
//         )}
//       </nav>

//       <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
//         <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white">
//           <DialogHeader>
//             <DialogTitle>Xóa Playlist</DialogTitle>
//           </DialogHeader>
//           <div className="py-4">
//             <p>
//               Bạn có chắc muốn xóa playlist "
//               <span className="font-semibold">{selectedPlaylist?.title}</span>" không?
//             </p>
//             <p className="text-sm text-neutral-400 mt-2">
//               Hành động này không thể hoàn tác.
//             </p>
//           </div>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsDeleteModalOpen(false)}
//               className="border-white text-black hover:bg-zinc-300"
//               disabled={isLoading}
//             >
//               Hủy
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={handleDeletePlaylist}
//               className="bg-red-600 hover:bg-red-700"
//               disabled={isLoading}
//             >
//               {isLoading ? "Đang xóa..." : "Xóa"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { Button } from "@/components/ui/button";
import { Plus, Music, Trash2 } from "react-feather";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from "sonner";
import api from "../../services/api";

interface PlaylistSummary {
  playlist_id: number;
  title: string;
  img: string | null;
  created_at: string;
  description: string | null;
}

interface PlaylistSummaryResponse {
  message: string;
  playlists: PlaylistSummary[];
}

interface NewPlaylistForm {
  title: string;
  description?: string;
  imgFile?: File | null;
}

export const UserNavigation: React.FC = () => {
  const { isAuthenticated, userId, token } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ id: number; title: string } | null>(null);
  const [newPlaylist, setNewPlaylist] = useState<NewPlaylistForm>({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  const fetchPlaylists = async () => {
    if (!isAuthenticated || !userId) {
      console.log("Không gọi fetchPlaylists: Người dùng chưa đăng nhập");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get<PlaylistSummaryResponse>(
        `/user/playlists/user/${userId}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTimeout(() => {
        setPlaylists(response.data.playlists);
        setIsLoading(false);
        console.log("Danh sách playlist:", response.data.playlists);
      }, 1000);
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách playlist:", error);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(error.response?.data?.message || "Lỗi khi lấy danh sách playlist", {
          style: { background: "black", color: "white" },
        });
      }, 1000);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tạo playlist", {
        style: { background: "black", color: "white" },
      });
      navigate("/login");
      return;
    }
    if (!newPlaylist.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề playlist", {
        style: { background: "black", color: "white" },
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", newPlaylist.title);
    formData.append("user_id", userId!.toString());
    if (newPlaylist.description) {
      formData.append("description", newPlaylist.description);
    }
    if (newPlaylist.imgFile) {
      formData.append("img_file", newPlaylist.imgFile);
    }

    try {
      setIsLoading(true);
      await api.post("/user/playlists", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setTimeout(() => {
        setIsModalOpen(false);
        setNewPlaylist({ title: "", description: "", imgFile: null });
        setImagePreview(null);
        fetchPlaylists();
        setIsLoading(false);
        toast.success("Tạo playlist thành công", {
          style: { background: "black", color: "white" },
        });
      }, 1000);
    } catch (error: any) {
      console.error("Lỗi khi tạo playlist:", error);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(error.response?.data?.message || "Lỗi khi tạo playlist", {
          style: { background: "black", color: "white" },
        });
      }, 1000);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để xóa playlist", {
        style: { background: "black", color: "white" },
      });
      navigate("/login");
      return;
    }
    if (!selectedPlaylist) return;

    try {
      setIsLoading(true);
      await api.delete(`/user/playlists/${selectedPlaylist.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setSelectedPlaylist(null);
        fetchPlaylists();
        setIsLoading(false);
        toast.success(`Xóa playlist "${selectedPlaylist.title}" thành công`, {
          style: { background: "black", color: "white" },
        });
      }, 1000);
    } catch (error: any) {
      console.error("Lỗi khi xóa playlist:", error);
      setTimeout(() => {
        setIsLoading(false);
        toast.error(error.response?.data?.message || "Lỗi khi xóa playlist", {
          style: { background: "black", color: "white" },
        });
      }, 1000);
    }
  };

  const handleOpenDeleteModal = (playlistId: number, playlistTitle: string) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để xóa playlist", {
        style: { background: "black", color: "white" },
      });
      navigate("/login");
      return;
    }
    if (!playlistId) {
      console.error("Playlist ID is undefined:", { playlistId, playlistTitle });
      toast.error("Không thể xóa: ID playlist không hợp lệ", {
        style: { background: "black", color: "white" },
      });
      return;
    }
    setSelectedPlaylist({ id: playlistId, title: playlistTitle });
    setIsDeleteModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tạo playlist", {
        style: { background: "black", color: "white" },
      });
      navigate("/login");
      return;
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setNewPlaylist({ ...newPlaylist, imgFile: file || null });
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <nav className="bg-neutral-900 text-white w-full p-6 h-screen rounded-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Music className="h-5 w-5" />
            Danh sách phát
          </h2>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                
                onClick={handleOpenCreateModal}
                disabled={!isAuthenticated || isLoading}
              >
                <Plus className="h-8 w-8" />
                Thêm
              </Button>
            </DialogTrigger>
            <DialogContent variant="dark" className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-white">Tạo Playlist Mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePlaylist} className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="img_file" className="text-white">Ảnh (tùy chọn)</Label>
                    <Input
                      id="img_file"
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleImageChange}
                      className="mt-1 text-white file:bg-neutral-700 file:text-white file:border-none file:rounded file:px-3 file:py-1"
                      disabled={isLoading}
                    />
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 rounded object-cover border border-neutral-700"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Tiêu đề</Label>
                    <Input
                      id="title"
                      value={newPlaylist.title}
                      onChange={(e) =>
                        setNewPlaylist({ ...newPlaylist, title: e.target.value })
                      }
                      placeholder="Nhập tiêu đề playlist"
                      className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-white">Mô tả</Label>
                    <Input
                      id="description"
                      value={newPlaylist.description || ""}
                      onChange={(e) =>
                        setNewPlaylist({
                          ...newPlaylist,
                          description: e.target.value,
                        })
                      }
                      placeholder="Nhập mô tả (tùy chọn)"
                      className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang tạo..." : "Tạo Playlist"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isAuthenticated ? (
          isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-6 bg-neutral-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto text-neutral-500" />
              <p className="mt-4 text-neutral-400">Chưa có playlist nào</p>
              <Button
                onClick={handleOpenCreateModal}
                variant="outline"
                className="mt-4 text-black border-white hover:bg-white hover:text-black"
                disabled={isLoading}
              >
                Tạo playlist đầu tiên
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {playlists.map((playlist) => (
                <li key={playlist.playlist_id} className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-800 transition-colors">
                  <Link
                    to={`/playlists/${playlist.playlist_id}`} // Sử dụng playlist_id để khớp với route
                    className="flex items-center gap-3 flex-1"
                  >
                    {playlist.img ? (
                      <img
                        src={playlist.img}
                        alt={playlist.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-neutral-700 flex items-center justify-center">
                        <Music className="h-5 w-5 text-neutral-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium hover:text-green-500">
                        {playlist.title}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {playlist.description || "No description"}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDeleteModal(playlist.playlist_id, playlist.title)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="text-center py-12">
            <Music className="h-12 w-12 mx-auto text-neutral-500" />
            <p className="mt-4 text-neutral-400">Vui lòng đăng nhập để xem và quản lý playlist</p>
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="mt-4 text-black border-white hover:bg-white hover:text-black"
            >
              Đăng nhập
            </Button>
          </div>
        )}
      </nav>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent variant="dark" className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xóa Playlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Bạn có chắc muốn xóa playlist "
              <span className="font-semibold">{selectedPlaylist?.title}</span>" không?
            </p>
            <p className="text-sm text-neutral-400 mt-2">
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlaylist}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};