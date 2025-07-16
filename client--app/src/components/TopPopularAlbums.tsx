/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { PlayIcon } from "@heroicons/react/24/solid";
import { Toaster, toast } from "sonner";
import api from "../services/api";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/authContext";

interface Album {
  album_id: number;
  title: string;
  img: string | null;
  artist_id: number;
  artist_name: string;
  release_date: string;
  total_listen_count: number;
  created_at: string;
}

interface Song {
  song_id: number;
  title: string;
  duration: number;
  release_date: string;
  audio_file_url: string;
  img: string;
  artist_id: number;
  artist_name: string;
  feat_artists: { artist_id: number; stage_name: string }[];
  album_name: string | null;
  is_downloadable: boolean;
  created_at: string;
  listen_count: number;
}

interface QueueItem extends Song {
  position: number;
  is_current: boolean;
}

export const TopPopularAlbums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredAlbumId, setHoveredAlbumId] = useState<number | null>(null);
  const { playContent } = useAudio();
  const { isAuthenticated, userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopPopularAlbums = async () => {
      try {
        const response = await api.get("/public/albums/top-popular");
        const data = response.data.data;
        console.log("API Response - Top Popular Albums:", data);
        setAlbums(data);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Không thể tải danh sách album phổ biến");
        console.error(err);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };
    fetchTopPopularAlbums();
  }, []);

  const handlePlayContent = async (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      toast.error("Vui lòng đăng nhập để phát danh sách", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login"),
        },
        style: { background: "black", color: "white" },
      });
      return;
    }
    try {
      console.log("Fetching songs for album_id:", album.album_id);
      const response = await api.get(`/public/albums/${album.album_id}`);
      const albumData = response.data.data.album;
      const songs: Song[] = albumData.songs || [];
      
      if (!songs || songs.length === 0) {
        toast.error("Danh sách bài hát trống", {
          style: { background: "black", color: "white" },
        });
        return;
      }

      const songIds = songs.map((song: Song) => song.song_id);
      console.log("Handling play content with song_ids:", songIds);
      await playContent(songIds);
      toast.success(`Đang phát album: ${album.title}`, {
        style: { background: "black", color: "white" },
      });
    } catch (error: any) {
      console.error("Error playing album:", error);
      toast.error(error.response?.data?.message || "Không thể phát album", {
        style: { background: "black", color: "white" },
      });
    }
  };

  if (error) return <div className="text-red-500 text-center">Lỗi: {error}</div>;

  return (
    <div className="w-full py-4 px-4 sm:px-6 bg-neutral-900 rounded-lg">
      <Toaster richColors position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white hover:underline">
          Album Phổ Biến
        </h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="flex items-center p-3">
              <Skeleton height={32} width={32} className="rounded mr-4" />
              <div className="flex-1 mr-1">
                <Skeleton height={16} width="80%" className="mb-2" />
                <Skeleton height={12} width="60%" />
              </div>
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-gray-400 text-center">Không có album nào</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {albums.map((album) => (
            <div
              key={album.album_id}
              className="flex items-center py-2 px-2 md:py-3 hover:bg-neutral-800 transition-colors border-t border-gray-700"
              onMouseEnter={() => setHoveredAlbumId(album.album_id)}
              onMouseLeave={() => setHoveredAlbumId(null)}
            >
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 mr-4">
                {album.img ? (
                  <>
                    <img
                      src={album.img}
                      alt={album.title}
                      className={`w-full h-full rounded object-cover transition-opacity duration-200 ${
                        hoveredAlbumId === album.album_id ? "opacity-75" : "opacity-100"
                      }`}
                      loading="lazy"
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                        hoveredAlbumId === album.album_id ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <button onClick={(e) => handlePlayContent(album, e)}>
                        <PlayIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white hover:text-gray-300 active:text-gray-200" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-neutral-700 flex items-center justify-center rounded">
                    <span className="text-neutral-400 text-xs">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 mr-1">
                <Link
                  to={`/albums/${album.album_id}`}
                  className="text-white font-medium text-xs sm:text-base hover:underline line-clamp-1"
                >
                  {album.title}
                </Link>
                <p className="text-xs sm:text-sm text-gray-400 line-clamp-1">
                  <Link
                    to={`/artists/${album.artist_id}`}
                    className="hover:underline"
                  >
                    {album.artist_name}
                  </Link>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};