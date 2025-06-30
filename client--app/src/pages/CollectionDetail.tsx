// // import React, { useEffect, useState } from 'react';
// // import { useParams, useLocation } from 'react-router-dom';
// // import Skeleton from 'react-loading-skeleton';
// // import 'react-loading-skeleton/dist/skeleton.css';
// // import { Clock, Play, List, Download, MoreHorizontal } from 'react-feather';
// // import api from '../services/api';
// // import { useAudio } from '../context/AudioContext';

// // interface Song {
// //   song_id: number;
// //   title: string;
// //   duration: number;
// //   release_date: string;
// //   audio_file_url: string;
// //   img: string;
// //   artist_id: number;
// //   feat_artists: string[];
// //   album_name: string | null;
// //   is_downloadable: boolean;
// //   created_at: string;
// //   artist_name: string;
// //   listen_count: number; // Thêm trường listen_count
// // }

// // interface CollectionDetail {
// //   collection: {
// //     artist_id: number;
// //     title: string;
// //     artist_name: string;
// //     img: string;
// //     popularity: number;
// //     created_at: string;
// //   };
// //   songs: Song[];
// // }

// // export const CollectionDetail: React.FC = () => {
// //   const { artist_id } = useParams<{ artist_id: string }>();
// //   const location = useLocation();
// //   const [collectionDetail, setCollectionDetail] = useState<CollectionDetail | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
// //   const { setCurrentSong, setIsExpanded, setArtistName, setPlaylist, setCurrentSongIndex } = useAudio();

// //   useEffect(() => {
// //     const fetchCollectionDetail = async () => {
// //       try {
// //         const response = await api.get(`/public/highlight-collections/${artist_id}`);
// //         setCollectionDetail(response.data.data);
// //         setArtistName(response.data.data.collection.artist_name);
// //       } catch (err) {
// //         setError('Không thể tải chi tiết tuyển tập');
// //         console.error(err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     if (artist_id) fetchCollectionDetail();
// //     console.log('Location State in useEffect:', location.state);
// //   }, [artist_id, setArtistName]);

// //   const formatDuration = (seconds: number): string => {
// //     const minutes = Math.floor(seconds / 60);
// //     const remainingSeconds = seconds % 60;
// //     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
// //   };

// //   const handleSongClick = (song: Song, index: number) => {
// //     setCurrentSong(song);
// //     setPlaylist(collectionDetail?.songs || []); // Lưu toàn bộ danh sách bài hát
// //     setCurrentSongIndex(index); // Lưu chỉ số bài hát được chọn
// //     setIsExpanded(false);
// //   };

// //   const handlePlayCollection = () => {
// //     if (collectionDetail?.songs && collectionDetail.songs.length > 0) {
// //       setCurrentSong(collectionDetail.songs[0]); // Phát bài hát đầu tiên
// //       setPlaylist(collectionDetail.songs); // Lưu danh sách bài hát
// //       setCurrentSongIndex(0); // Đặt chỉ số bài đầu tiên
// //       setIsExpanded(false);
// //     }
// //   };

// //   const baseColor = location.state?.baseColor || 'bg-pink-200';
// //   const gradientFrom = baseColor.replace('bg-', '');
// //   let gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
// //   switch (gradientFrom) {
// //     case 'pink-200': gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900'; break;
// //     case 'yellow-200': gradientClass = 'bg-gradient-to-b from-yellow-200 to-neutral-900'; break;
// //     case 'orange-200': gradientClass = 'bg-gradient-to-b from-orange-200 to-neutral-900'; break;
// //     case 'green-200': gradientClass = 'bg-gradient-to-b from-green-200 to-neutral-900'; break;
// //     case 'blue-200': gradientClass = 'bg-gradient-to-b from-blue-200 to-neutral-900'; break;
// //     case 'purple-200': gradientClass = 'bg-gradient-to-b from-purple-200 to-neutral-900'; break;
// //     case 'red-200': gradientClass = 'bg-gradient-to-b from-red-200 to-neutral-900'; break;
// //     case 'teal-200': gradientClass = 'bg-gradient-to-b from-teal-200 to-neutral-900'; break;
// //     case 'indigo-200': gradientClass = 'bg-gradient-to-b from-indigo-200 to-neutral-900'; break;
// //     case 'amber-200': gradientClass = 'bg-gradient-to-b from-amber-200 to-neutral-900'; break;
// //     default: gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
// //   }

// //   if (error) return <div className="text-red-500 text-center">{error}</div>;
// //   if (!collectionDetail) return <div className="text-center">Không tìm thấy tuyển tập</div>;

// //   const { collection, songs } = collectionDetail;

// //   return (
// //     <div className="min-h-screen text-white rounded-lg">
// //       {loading ? (
// //         <div className="space-y-4">
// //           <Skeleton height={200} className="w-full rounded-lg" />
// //           <Skeleton height={40} className="w-1/2" />
// //           <div className="space-y-2">
// //             {[...Array(3)].map((_, index) => (
// //               <Skeleton key={index} height={50} className="w-full" />
// //             ))}
// //           </div>
// //         </div>
// //       ) : (
// //         <div>
// //           <div className={`${gradientClass} h-64 mb-4 rounded-t-lg`}>
// //             <div className="flex flex-col h-full">
// //               <div className="flex gap-4 items-center justify-start flex-1 py-4 px-8">
// //                 <div>
// //                   <div className="flex flex-col justify-start items-center">
// //                     <img
// //                       src={collection.img}
// //                       alt={collection.artist_name}
// //                       className="w-52 object-contain rounded-sm"
// //                     />
// //                   </div>
// //                 </div>
// //                 <div className="h-auto text-start ml-1.5">
// //                   <h2 className="text-sm text-white">Danh sách phát công khai</h2>
// //                   <h1 className="text-8xl font-bold uppercase">
// //                     This Is {collection.artist_name}
// //                   </h1>
// //                   <p className="text-sm text-white">
// //                     Các bản nhạc bạn nên nghe, tất cả trong một danh sách phát.
// //                   </p>
// //                 </div>
// //               </div>
// //               <div className="py-2 px-7 flex items-center justify-between">
// //                 <div className="flex items-center space-x-4">
// //                   <button onClick={handlePlayCollection}>
// //                     <Play className="w-6 h-6 text-white" />
// //                   </button>
// //                   <Download className="w-6 h-6 text-white" />
// //                   <MoreHorizontal className="w-6 h-6 text-white" />
// //                 </div>
// //                 <div className="flex items-center space-x-2">
// //                   <List className="w-6 h-6 text-white" />
// //                   <span className="text-sm text-gray-400">Danh sách</span>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //           <div className="p-4 pt-8">
// //             <table className="w-full text-left">
// //               <thead className="border-b border-gray-600">
// //                 <tr>
// //                   <th className="py-2 px-4 text-gray-300 w-16">#</th>
// //                   <th className="py-2 px-4 text-gray-300">Tiêu đề</th>
// //                   <th className="py-2 px-4 text-gray-300">Album</th>
// //                   <th className="py-2 px-4 text-gray-300">Lượt nghe</th>
// //                   <th className="py-2 px-4 text-gray-300 w-24">
// //                     <Clock className="inline-block w-5 h-5" />
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {songs.map((song, index) => (
// //                   <tr
// //                     key={song.song_id}
// //                     className="hover:bg-zinc-800 rounded-lg cursor-pointer"
// //                     onMouseEnter={() => setHoveredSongId(song.song_id)}
// //                     onMouseLeave={() => setHoveredSongId(null)}
// //                     onClick={() => handleSongClick(song, index)}
// //                   >
// //                     <td className="py-2 px-4 text-gray-400">
// //                       {hoveredSongId === song.song_id ? (
// //                         <Play className="w-5 h-5" />
// //                       ) : (
// //                         index + 1
// //                       )}
// //                     </td>
// //                     <td className="py-2 px-4">
// //                       <div className="flex items-center">
// //                         <img
// //                           src={song.img}
// //                           alt={song.title}
// //                           className="w-12 h-12 object-cover mr-4 rounded"
// //                         />
// //                         <div className="flex flex-col">
// //                           <span className="text-white">{song.title}</span>
// //                           {song.feat_artists.length > 0 && (
// //                             <span className="text-gray-400 text-sm block">
// //                               feat. {song.feat_artists.join(', ')}
// //                             </span>
// //                           )}
// //                         </div>
// //                       </div>
// //                     </td>
// //                     <td className="py-2 px-4 text-gray-400">
// //                       {song.album_name || 'Đang cập nhật'}
// //                     </td>
// //                     <td className="py-2 px-4 text-gray-400">
// //                       {song.listen_count || 'Đang cập nhật'}
// //                     </td>
// //                     <td className="py-2 px-4 text-gray-400">
// //                       {formatDuration(song.duration)}
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };
// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import Skeleton from 'react-loading-skeleton';
// import 'react-loading-skeleton/dist/skeleton.css';
// import { Clock, Play, List, Download, MoreHorizontal } from 'react-feather';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { Toaster, toast } from "sonner";
// import api from '../services/api';
// import { useAudio } from '../context/AudioContext';
// import { useAuth } from '../context/authContext';

// interface Song {
//   song_id: number;
//   title: string;
//   duration: number;
//   release_date: string;
//   audio_file_url: string;
//   img: string;
//   artist_id: number;
//   feat_artists: string[];
//   album_name: string | null;
//   is_downloadable: boolean;
//   created_at: string;
//   artist_name: string;
//   listen_count: number;
// }

// interface Playlist {
//   playlist_id: number;
//   title: string;
//   img: string | null;
// }

// interface CollectionDetail {
//   collection: {
//     artist_id: number;
//     title: string;
//     artist_name: string;
//     img: string;
//     popularity: number;
//     created_at: string;
//   };
//   songs: Song[];
// }

// export const CollectionDetail: React.FC = () => {
//   const { artist_id } = useParams<{ artist_id: string }>();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [collectionDetail, setCollectionDetail] = useState<CollectionDetail | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
//   const [playlists, setPlaylists] = useState<Playlist[]>([]);
//   const { setCurrentSong, setIsExpanded, setArtistName, setPlaylist, setCurrentSongIndex } = useAudio();
//   const { isAuthenticated, userId, token } = useAuth();

//   useEffect(() => {
//     const fetchCollectionDetail = async () => {
//       try {
//         const response = await api.get(`/public/highlight-collections/${artist_id}`);
//         setCollectionDetail(response.data.data);
//         setArtistName(response.data.data.collection.artist_name);
//       } catch (err: any) {
//         if (err.response?.status === 404) {
//           setError('Không tìm thấy tuyển tập');
//         } else {
//           setError('Không thể tải chi tiết tuyển tập');
//         }
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (artist_id) fetchCollectionDetail();
//     console.log('Location State in useEffect:', location.state);
//   }, [artist_id, setArtistName]);

//   const fetchUserPlaylists = async () => {
//     if (!isAuthenticated || !userId) {
//       toast.error('Vui lòng đăng nhập để thêm bài hát vào playlist', {
//         action: {
//           label: 'Đăng nhập',
//           onClick: () => navigate('/login'),
//         },
//         style: { background: 'black', color: 'white' },
//       });
//       return;
//     }
//     try {
//       const response = await api.get(`/user/playlists/user/${userId}/summary`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setPlaylists(response.data.playlists || []);
//     } catch (err: any) {
//       console.error('Lỗi fetch playlists:', err);
//       toast.error('Không thể tải danh sách playlist', {
//         style: { background: 'black', color: 'white' },
//       });
//     }
//   };

//   const handleAddToPlaylistClick = (songId: number, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setSelectedSongId(songId);
//     fetchUserPlaylists();
//     setIsModalOpen(true);
//   };

//   const handleAddSongToPlaylist = async (playlistId: number) => {
//     if (!selectedSongId) return;
//     try {
//       await api.post(`/user/playlists/${playlistId}/songs`, { 
//         song_id: selectedSongId,
//         user_id: userId 
//       }, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       toast.success('Đã thêm bài hát vào playlist', {
//         style: { background: 'black', color: 'white' },
//       });
//       setIsModalOpen(false);
//     } catch (err: any) {
//       console.error('Lỗi thêm bài hát:', err);
//       toast.error('Không thể thêm bài hát vào playlist', {
//         style: { background: 'black', color: 'white' },
//       });
//     }
//   };

//   const formatDuration = (seconds: number): string => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
//   };

//   const handleSongClick = (song: Song, index: number) => {
//     setCurrentSong(song);
//     setPlaylist(collectionDetail?.songs || []);
//     setCurrentSongIndex(index);
//     setIsExpanded(false);
//   };

//   const handlePlayCollection = () => {
//     if (collectionDetail?.songs && collectionDetail.songs.length > 0) {
//       setCurrentSong(collectionDetail.songs[0]);
//       setPlaylist(collectionDetail.songs);
//       setCurrentSongIndex(0);
//       setIsExpanded(false);
//     }
//   };

//   const baseColor = location.state?.baseColor || 'bg-pink-200';
//   const gradientFrom = baseColor.replace('bg-', '');
//   let gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
//   switch (gradientFrom) {
//     case 'pink-200': gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900'; break;
//     case 'yellow-200': gradientClass = 'bg-gradient-to-b from-yellow-200 to-neutral-900'; break;
//     case 'orange-200': gradientClass = 'bg-gradient-to-b from-orange-200 to-neutral-900'; break;
//     case 'green-200': gradientClass = 'bg-gradient-to-b from-green-200 to-neutral-900'; break;
//     case 'blue-200': gradientClass = 'bg-gradient-to-b from-blue-200 to-neutral-900'; break;
//     case 'purple-200': gradientClass = 'bg-gradient-to-b from-purple-200 to-neutral-900'; break;
//     case 'red-200': gradientClass = 'bg-gradient-to-b from-red-200 to-neutral-900'; break;
//     case 'teal-200': gradientClass = 'bg-gradient-to-b from-teal-200 to-neutral-900'; break;
//     case 'indigo-200': gradientClass = 'bg-gradient-to-b from-indigo-200 to-neutral-900'; break;
//     case 'amber-200': gradientClass = 'bg-gradient-to-b from-amber-200 to-neutral-900'; break;
//     default: gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
//   }

//   if (error) return <div className="text-red-500 text-center">{error}</div>;
//   if (!collectionDetail) return <div className="text-center">Không tìm thấy tuyển tập</div>;

//   const { collection, songs } = collectionDetail;

//   return (
//     <div className="min-h-screen text-white rounded-lg">
//       <Toaster richColors position="top-right" />
//       {loading ? (
//         <div className="space-y-4">
//           <Skeleton height={200} className="w-full rounded-lg" />
//           <Skeleton height={40} className="w-1/2" />
//           <div className="space-y-2">
//             {[...Array(3)].map((_, index) => (
//               <Skeleton key={index} height={50} className="w-full" />
//             ))}
//           </div>
//         </div>
//       ) : (
//         <div>
//           <div className={`${gradientClass} h-64 mb-4 rounded-t-lg`}>
//             <div className="flex flex-col h-full">
//               <div className="flex gap-4 items-center justify-start flex-1 py-4 px-8">
//                 <div>
//                   <div className="flex flex-col justify-start items-center">
//                     <img
//                       src={collection.img}
//                       alt={collection.artist_name}
//                       className="w-52 object-contain rounded-sm"
//                     />
//                   </div>
//                 </div>
//                 <div className="h-auto text-start ml-1.5">
//                   <h2 className="text-sm text-white">Danh sách phát công khai</h2>
//                   <h1 className="text-8xl font-bold uppercase">
//                     This Is {collection.artist_name}
//                   </h1>
//                   <p className="text-sm text-white">
//                     Các bản nhạc bạn nên nghe, tất cả trong một danh sách phát.
//                   </p>
//                 </div>
//               </div>
//               <div className="py-2 px-7 flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                   <button onClick={handlePlayCollection}>
//                     <Play className="w-6 h-6 text-white" />
//                   </button>
//                   <Download className="w-6 h-6 text-white" />
//                   <MoreHorizontal className="w-6 h-6 text-white" />
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <List className="w-6 h-6 text-white" />
//                   <span className="text-sm text-gray-400">Danh sách</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="p-4 pt-8">
//             <table className="w-full text-left">
//               <thead className="border-b border-gray-600">
//                 <tr>
//                   <th className="py-2 px-4 text-gray-300 w-16">#</th>
//                   <th className="py-2 px-4 text-gray-300">Tiêu đề</th>
//                   <th className="py-2 px-4 text-gray-300">Album</th>
//                   <th className="py-2 px-4 text-gray-300">Lượt nghe</th>
//                   <th className="py-2 px-4 text-gray-300 w-24">
//                     <Clock className="inline-block w-5 h-5" />
//                   </th>
//                   <th className="py-2 px-4 text-gray-300 w-16">Hành động</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {songs.map((song, index) => (
//                   <tr
//                     key={song.song_id}
//                     className="hover:bg-zinc-800 rounded-lg cursor-pointer"
//                     onMouseEnter={() => setHoveredSongId(song.song_id)}
//                     onMouseLeave={() => setHoveredSongId(null)}
//                     onClick={() => handleSongClick(song, index)}
//                   >
//                     <td className="py-2 px-4 text-gray-400">
//                       {hoveredSongId === song.song_id ? (
//                         <Play className="w-5 h-5" />
//                       ) : (
//                         index + 1
//                       )}
//                     </td>
//                     <td className="py-2 px-4">
//                       <div className="flex items-center">
//                         <img
//                           src={song.img}
//                           alt={song.title}
//                           className="w-12 h-12 object-cover mr-4 rounded"
//                         />
//                         <div className="flex flex-col">
//                           <span className="text-white">{song.title}</span>
//                           {song.feat_artists.length > 0 && (
//                             <span className="text-gray-400 text-sm block">
//                               feat. {song.feat_artists.join(', ')}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="py-2 px-4 text-gray-400">
//                       {song.album_name || 'Đang cập nhật'}
//                     </td>
//                     <td className="py-2 px-4 text-gray-400">
//                       {song.listen_count || 'Đang cập nhật'}
//                     </td>
//                     <td className="py-2 px-4 text-gray-400">
//                       {formatDuration(song.duration)}
//                     </td>
//                     <td className="py-2 px-4 text-gray-400">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <button>
//                             <MoreHorizontal className="w-5 h-5" />
//                           </button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent className="z-50">
//                           {isAuthenticated ? (
//                             <DropdownMenuItem onClick={(e) => handleAddToPlaylistClick(song.song_id, e)}>
//                               Thêm vào playlist
//                             </DropdownMenuItem>
//                           ) : (
//                             <DropdownMenuItem
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 toast.error('Vui lòng đăng nhập để thêm bài hát vào playlist', {
//                                   action: {
//                                     label: 'Đăng nhập',
//                                     onClick: () => navigate('/login'),
//                                   },
//                                   style: { background: 'black', color: 'white' },
//                                 });
//                               }}
//                             >
//                               Thêm vào playlist
//                             </DropdownMenuItem>
//                           )}
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//             <DialogContent variant="dark" className="sm:max-w-[600px]">
//               <DialogHeader>
//                 <DialogTitle>Chọn Playlist</DialogTitle>
//               </DialogHeader>
//               <DialogDescription id="dialog-description" className="text-sm text-gray-400 mb-6">
//                 Chọn một playlist để thêm bài hát vào danh sách phát của bạn.
//               </DialogDescription>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 {playlists.length > 0 ? (
//                   playlists.map((playlist) => (
//                     <button
//                       key={playlist.playlist_id}
//                       onClick={() => handleAddSongToPlaylist(playlist.playlist_id)}
//                       className="bg-neutral-900 hover:bg-neutral-800 transition-colors duration-200 rounded-lg p-4 flex items-center gap-4 border border-gray-700 hover:border-gray-600"
//                     >
//                       <div className="w-16 h-16 flex-shrink-0">
//                         {playlist.img ? (
//                           <img
//                             src={playlist.img}
//                             alt={playlist.title}
//                             className="w-16 h-16 object-cover rounded-lg"
//                           />
//                         ) : (
//                           <div className="w-16 h-16 bg-gray-700 flex items-center justify-center rounded-lg">
//                             <span className="text-xs text-gray-400">No Image</span>
//                           </div>
//                         )}
//                       </div>
//                       <span className="text-white text-lg font-semibold truncate flex-1">{playlist.title}</span>
//                     </button>
//                   ))
//                 ) : (
//                   <div className="text-center text-gray-400 col-span-2">
//                     <p>Không có playlist nào. Vui lòng tạo playlist trong phần quản lý để sử dụng chức năng này.</p>
//                   </div>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Clock, Play, List, Download, MoreHorizontal } from 'react-feather';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import api from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/authContext';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  release_date: string;
  audio_file_url: string;
  img: string;
  artist_id: number;
  feat_artists: string[];
  album_name: string | null;
  is_downloadable: boolean;
  created_at: string;
  artist_name: string;
  listen_count: number;
}

interface Playlist {
  playlist_id: number;
  title: string;
  img: string | null;
}

interface CollectionDetail {
  collection: {
    artist_id: number;
    title: string;
    artist_name: string;
    img: string;
    popularity: number;
    created_at: string;
  };
  songs: Song[];
}

export const CollectionDetail: React.FC = () => {
  const { artist_id } = useParams<{ artist_id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [collectionDetail, setCollectionDetail] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { setCurrentSong, setIsExpanded, setArtistName, setPlaylist, setCurrentSongIndex, addToQueue, queue } = useAudio();
  const { isAuthenticated, userId, token } = useAuth();

  useEffect(() => {
    const fetchCollectionDetail = async () => {
      try {
        const response = await api.get(`/public/highlight-collections/${artist_id}`);
        setCollectionDetail(response.data.data);
        setArtistName(response.data.data.collection.artist_name);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Không tìm thấy tuyển tập');
        } else {
          setError('Không thể tải chi tiết tuyển tập');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (artist_id) fetchCollectionDetail();
    console.log('Location State in useEffect:', location.state);
  }, [artist_id, setArtistName]);

  const fetchUserPlaylists = async () => {
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để thêm bài hát vào playlist', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      const response = await api.get(`/user/playlists/user/${userId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(response.data.playlists || []);
    } catch (err: any) {
      console.error('Lỗi fetch playlists:', err);
      toast.error('Không thể tải danh sách playlist', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleAddToPlaylistClick = (songId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSongId(songId);
    fetchUserPlaylists();
    setIsModalOpen(true);
  };

  const handleAddSongToPlaylist = async (playlistId: number) => {
    if (!selectedSongId) return;
    try {
      await api.post(`/user/playlists/${playlistId}/songs`, { 
        song_id: selectedSongId,
        user_id: userId 
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã thêm bài hát vào playlist', {
        style: { background: 'black', color: 'white' },
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi thêm bài hát:', err);
      toast.error('Không thể thêm bài hát vào playlist', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handleAddToQueueClick = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để thêm vào danh sách chờ', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      await addToQueue(song);
      toast.success('Đã thêm bài hát vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    } catch (error: any) {
      console.error('Lỗi khi thêm vào danh sách chờ:', error);
      toast.error(error.response?.data?.error || 'Không thể thêm bài hát vào danh sách chờ', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSongClick = async (song: Song, index: number) => {
    if (!isAuthenticated || !userId) {
      toast.error('Vui lòng đăng nhập để phát bài hát', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        style: { background: 'black', color: 'white' },
      });
      return;
    }
    try {
      // Thêm bài hát vào danh sách chờ
      await addToQueue(song);
      // Cập nhật trạng thái bài hiện tại
      setCurrentSong(song);
      setPlaylist(collectionDetail?.songs || []);
      setCurrentSongIndex(queue.length); // Chỉ số của bài vừa thêm
      setIsExpanded(false);
      // Cập nhật is_current trên server
      await api.put(
        '/user/queue/update-current',
        { song_id: song.song_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: any) {
      console.error('Lỗi khi phát bài hát:', error);
      toast.error(error.response?.data?.error || 'Không thể phát bài hát', {
        style: { background: 'black', color: 'white' },
      });
    }
  };

  const handlePlayCollection = async () => {
    if (collectionDetail?.songs && collectionDetail.songs.length > 0) {
      if (!isAuthenticated || !userId) {
        toast.error('Vui lòng đăng nhập để phát danh sách', {
          action: {
            label: 'Đăng nhập',
            onClick: () => navigate('/login'),
          },
          style: { background: 'black', color: 'white' },
        });
        return;
      }
      try {
        // Thêm bài hát đầu tiên vào danh sách chờ
        await addToQueue(collectionDetail.songs[0]);
        setCurrentSong(collectionDetail.songs[0]);
        setPlaylist(collectionDetail.songs);
        setCurrentSongIndex(queue.length); // Chỉ số của bài vừa thêm
        setIsExpanded(false);
        // Cập nhật is_current trên server
        await api.put(
          '/user/queue/update-current',
          { song_id: collectionDetail.songs[0].song_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error: any) {
        console.error('Lỗi khi phát danh sách:', error);
        toast.error(error.response?.data?.error || 'Không thể phát danh sách', {
          style: { background: 'black', color: 'white' },
        });
      }
    }
  };

  const baseColor = location.state?.baseColor || 'bg-pink-200';
  const gradientFrom = baseColor.replace('bg-', '');
  let gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
  switch (gradientFrom) {
    case 'pink-200': gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900'; break;
    case 'yellow-200': gradientClass = 'bg-gradient-to-b from-yellow-200 to-neutral-900'; break;
    case 'orange-200': gradientClass = 'bg-gradient-to-b from-orange-200 to-neutral-900'; break;
    case 'green-200': gradientClass = 'bg-gradient-to-b from-green-200 to-neutral-900'; break;
    case 'blue-200': gradientClass = 'bg-gradient-to-b from-blue-200 to-neutral-900'; break;
    case 'purple-200': gradientClass = 'bg-gradient-to-b from-purple-200 to-neutral-900'; break;
    case 'red-200': gradientClass = 'bg-gradient-to-b from-red-200 to-neutral-900'; break;
    case 'teal-200': gradientClass = 'bg-gradient-to-b from-teal-200 to-neutral-900'; break;
    case 'indigo-200': gradientClass = 'bg-gradient-to-b from-indigo-200 to-neutral-900'; break;
    case 'amber-200': gradientClass = 'bg-gradient-to-b from-amber-200 to-neutral-900'; break;
    default: gradientClass = 'bg-gradient-to-b from-pink-200 to-neutral-900';
  }

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!collectionDetail) return <div className="text-center">Không tìm thấy tuyển tập</div>;

  const { collection, songs } = collectionDetail;

  return (
    <div className="min-h-screen text-white rounded-lg">
      <Toaster richColors position="top-right" />
      {loading ? (
        <div className="space-y-4">
          <Skeleton height={200} className="w-full rounded-lg" />
          <Skeleton height={40} className="w-1/2" />
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} height={50} className="w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className={`${gradientClass} h-64 mb-4 rounded-t-lg`}>
            <div className="flex flex-col h-full">
              <div className="flex gap-4 items-center justify-start flex-1 py-4 px-8">
                <div>
                  <div className="flex flex-col justify-start items-center">
                    <img
                      src={collection.img}
                      alt={collection.artist_name}
                      className="w-52 object-contain rounded-sm"
                    />
                  </div>
                </div>
                <div className="h-auto text-start ml-1.5">
                  <h2 className="text-sm text-white">Danh sách phát công khai</h2>
                  <h1 className="text-8xl font-bold uppercase">
                    This Is {collection.artist_name}
                  </h1>
                  <p className="text-sm text-white">
                    Các bản nhạc bạn nên nghe, tất cả trong một danh sách phát.
                  </p>
                </div>
              </div>
              <div className="py-2 px-7 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button onClick={handlePlayCollection}>
                    <Play className="w-6 h-6 text-white" />
                  </button>
                  <Download className="w-6 h-6 text-white" />
                  <MoreHorizontal className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <List className="w-6 h-6 text-white" />
                  <span className="text-sm text-gray-400">Danh sách</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 pt-8">
            <table className="w-full text-left">
              <thead className="border-b border-gray-600">
                <tr>
                  <th className="py-2 px-4 text-gray-300 w-16">#</th>
                  <th className="py-2 px-4 text-gray-300">Tiêu đề</th>
                  <th className="py-2 px-4 text-gray-300">Album</th>
                  <th className="py-2 px-4 text-gray-300">Lượt nghe</th>
                  <th className="py-2 px-4 text-gray-300 w-24">
                    <Clock className="inline-block w-5 h-5" />
                  </th>
                  <th className="py-2 px-4 text-gray-300 w-16">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song, index) => (
                  <tr
                    key={song.song_id}
                    className="hover:bg-zinc-800 rounded-lg cursor-pointer"
                    onMouseEnter={() => setHoveredSongId(song.song_id)}
                    onMouseLeave={() => setHoveredSongId(null)}
                    onClick={() => handleSongClick(song, index)}
                  >
                    <td className="py-2 px-4 text-gray-400">
                      {hoveredSongId === song.song_id ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <img
                          src={song.img}
                          alt={song.title}
                          className="w-12 h-12 object-cover mr-4 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-white">{song.title}</span>
                          {song.feat_artists.length > 0 && (
                            <span className="text-gray-400 text-sm block">
                              feat. {song.feat_artists.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {song.album_name || 'Đang cập nhật'}
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {song.listen_count || 'Đang cập nhật'}
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      {formatDuration(song.duration)}
                    </td>
                    <td className="py-2 px-4 text-gray-400">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button>
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="z-50">
                          <DropdownMenuItem onClick={(e) => handleAddToPlaylistClick(song.song_id, e)}>
                            Thêm vào playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleAddToQueueClick(song, e)}>
                            Thêm vào danh sách chờ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent variant="dark" className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Chọn Playlist</DialogTitle>
              </DialogHeader>
              <DialogDescription id="dialog-description" className="text-sm text-gray-400 mb-6">
                Chọn một playlist để thêm bài hát vào danh sách phát của bạn.
              </DialogDescription>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <button
                      key={playlist.playlist_id}
                      onClick={() => handleAddSongToPlaylist(playlist.playlist_id)}
                      className="bg-neutral-900 hover:bg-neutral-800 transition-colors duration-200 rounded-lg p-4 flex items-center gap-4 border border-gray-700 hover:border-gray-600"
                    >
                      <div className="w-16 h-16 flex-shrink-0">
                        {playlist.img ? (
                          <img
                            src={playlist.img}
                            alt={playlist.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-700 flex items-center justify-center rounded-lg">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                      <span className="text-white text-lg font-semibold truncate flex-1">{playlist.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-400 col-span-2">
                    <p>Không có playlist nào. Vui lòng tạo playlist trong phần quản lý để sử dụng chức năng này.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};