import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import api from "../services/api";

// Import Swiper styles
import "swiper/css";

interface Artist {
  artist_id: number;
  stage_name: string;
  profile_picture: string;
}

export const TopPopularArtists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        const response = await api.get("/public/artists/top-popular");
        const data = response.data.data;
        console.log("API Response - Top Artists:", data); // Debug: Kiểm tra dữ liệu từ API
        setArtists(data);
        // Trì hoãn set loading thành false trong 1 giây
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Không thể tải danh sách ca sĩ nổi bật");
        console.error(err);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };
    fetchTopArtists();
  }, []);

  if (error) return <div className="text-red-500 text-center">Lỗi: {error}</div>;

  return (
    <div className="w-full py-4 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white hover:underline">
          Ca sĩ Nổi Bật
        </h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <Skeleton circle={true} height={120} width={120} className="mb-2" />
              <Skeleton height={24} width={100} />
            </div>
          ))}
        </div>
      ) : (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={10}
          slidesPerView={2.5} // Hiển thị 2 slide đầy đủ và một nửa slide thứ 3
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            0: { slidesPerView: 2.5, spaceBetween: 8 }, // Mobile: 2.5 slides
            640: { slidesPerView: 4, spaceBetween: 10 }, // Tablet: 4 slides
            1024: { slidesPerView: 7, spaceBetween: 10 }, // Desktop: 8 slides
          }}
          className="w-full"
        >
          {artists.map((artist) => (
            <SwiperSlide key={artist.artist_id}>
              <div className="flex flex-col items-center rounded-lg hover:bg-neutral-800 p-1 transition-colors duration-200">
                <Link
                  to={`/artists/${artist.artist_id}`}
                  onClick={() =>
                    console.log(`Clicking artist ${artist.artist_id}`) // Debug: Kiểm tra khi click
                  }
                >
                  <img
                    src={artist.profile_picture}
                    alt={artist.stage_name}
                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-38 lg:h-38 rounded-full object-cover"
                  />
                </Link>
                <Link
                  to={`/artists/${artist.artist_id}`}
                  className="hover:underline text-white mt-2 text-center text-sm sm:text-base"
                >
                  <h3 className="font-semibold">
                    {artist.stage_name}
                  </h3>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};