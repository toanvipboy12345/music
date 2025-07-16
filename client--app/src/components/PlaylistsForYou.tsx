import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import api from "../services/api";

// Import Swiper styles
import "swiper/css";

interface Playlist {
  playlist_id: number;
  title: string;
  img: string | null;
  description: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
  User: {
    user_id: number;
    username: string;
  };
}

export const PlaylistsForYou: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminPlaylists = async () => {
      try {
        const response = await api.get("/public/playlists/admin");
        const data = response.data.data;
        console.log("API Response - Admin Playlists:", data); // Debug: Kiểm tra dữ liệu từ API
        setPlaylists(data);
        // Trì hoãn set loading trong 1 giây
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Không thể tải danh sách playlist của quản trị viên");
        console.error(err);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };
    fetchAdminPlaylists();
  }, []);

  if (error) {
    return <div className="text-red-500 text-center">Lỗi: {error}</div>;
  }

  return (
    <div className="w-full py-4 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white hover:underline">
          Dành cho bạn
        </h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <Skeleton height={120} width={120} className="mb-2 rounded-md" />
              <Skeleton height={24} width={100} />
              <Skeleton height={20} width={80} />
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-gray-400 text-center">
          Không có playlist nào từ quản trị viên
        </div>
      ) : (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={10}
          slidesPerView={2.5}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={true} // Thêm loop để carousel lặp vô hạn
          breakpoints={{
            0: { slidesPerView: 2.5, spaceBetween: 8 }, // Mobile: 2.5 slides
            640: { slidesPerView: 4, spaceBetween: 10 }, // Tablet: 4 slides
            1024: { slidesPerView: 7, spaceBetween: 10 }, // Desktop: 8 slides
          }}
          className="w-full"
        >
          {playlists.map((playlist) => (
            <SwiperSlide key={playlist.playlist_id}>
              <div className="flex flex-col items-center rounded-lg hover:bg-neutral-800 p-1 transition-colors duration-200">
                <Link to={`/playlists/${playlist.playlist_id}`}>
                  <img
                    src={playlist.img || "/default-playlist.jpg"} // Hình ảnh mặc định nếu img là null
                    alt={playlist.title}
                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-38 lg:h-38 object-cover"
                    loading="lazy"
                  />
                </Link>
                <Link
                  to={`/playlists/${playlist.playlist_id}`}
                  className="hover:underline text-white mt-2 text-center text-sm sm:text-base"
                >
                  <h3 className="font-semibold">{playlist.title}</h3>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};