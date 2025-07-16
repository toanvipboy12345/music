import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import api from "../services/api";

// Import Swiper styles
import "swiper/css";

interface Song {
  song_id: number;
  title: string;
  img: string | null;
  artist_name: string;
  artist_id: number;
  rank: number;
}

export const TopPopularSongs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Danh sách gradient dựa trên sắc độ của các màu
  const gradients = [
    "bg-gradient-to-r from-red-700 to-red-900",
    "bg-gradient-to-r from-blue-700 to-blue-900",
    "bg-gradient-to-r from-green-700 to-green-900",
    "bg-gradient-to-r from-yellow-700 to-yellow-900",
    "bg-gradient-to-r from-purple-700 to-purple-900",
    "bg-gradient-to-r from-indigo-700 to-indigo-900",
  ];

  // Lấy màu border tương ứng với gradient
  const borderColors = [
    "border-red-700",
    "border-blue-700",
    "border-green-700",
    "border-yellow-700",
    "border-purple-700",
    "border-indigo-700",
  ];

  useEffect(() => {
    const fetchTopSongs = async () => {
      try {
        const response = await api.get("/public/ranking/top-songs");
        const data = response.data.data.songs.map((song: any) => ({
          song_id: song.song_id,
          title: song.title,
          img: song.img || "http://localhost:3000/Uploads/songs/default.jpg",
          artist_name: song.artist_name,
          artist_id: song.artist_id || Math.floor(Math.random() * 100) + 1,
          rank: song.rank,
        }));
        console.log("API Response - Top Songs:", data);
        setSongs(data);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Không thể tải bảng xếp hạng bài hát");
        console.error(err);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };
    fetchTopSongs();
  }, []);

  if (error)
    return <div className="text-red-500 text-center">Lỗi: {error}</div>;

  return (
    <div className="w-full py-4 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white hover:underline">
          Bảng Xếp Hạng
        </h2>
        <Link to="/ranking" className="text-white hover:underline">
          Xem tất cả
        </Link>
      </div>
      {loading ? (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={3.5}
          loop={false}
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 10 },
            640: { slidesPerView: 2, spaceBetween: 15 },
            1024: { slidesPerView: 3.5, spaceBetween: 15 },
          }}
          className="w-full"
        >
          {[...Array(4)].map((_, index) => (
            <SwiperSlide key={index}>
              <div className="p-3 shadow-lg flex flex-col w-full relative">
                <span className="absolute top-2 right-2">
                  <Skeleton circle width={40} height={40} />
                </span>
                <div className="flex items-center">
                  <Skeleton width={112} height={112} className="mr-6" />
                  <div className="flex-1">
                    <Skeleton width={150} height={20} className="mb-2" />
                    <Skeleton width={100} height={16} />
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={3.5}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={false}
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 10 },
            640: { slidesPerView: 2, spaceBetween: 15 },
            1024: { slidesPerView: 3.5, spaceBetween: 15 },
          }}
          className="w-full"
        >
          {songs.map((song, index) => {
            const gradient = gradients[index % gradients.length];
            const borderColor = borderColors[index % borderColors.length];
            return (
              <SwiperSlide key={song.song_id}>
                <div className={`p-3 shadow-lg text-white flex flex-col w-full relative ${gradient}`}>
                  <span className={`absolute top-2 right-2 text-white text-base font-bold bg-transparent ${borderColor} border-2 px-3 py-1`}>
                    {song.rank}
                  </span>
                  <div className="flex items-center">
                    <Link to={`/songs/${song.song_id}`}>
                      <img
                        src={song.img ?? "http://localhost:3000/Uploads/songs/default.jpg"}
                        alt={song.title}
                        className="w-28 h-28 object-cover mr-6 filter drop-shadow-2xl"
                      />
                    </Link>
                    <div className="flex-1 mt-3">
                      <Link
                        to={`/songs/${song.song_id}`}
                        className="hover:underline text-white text-base font-semibold"
                      >
                        {song.title}
                      </Link>
                      <Link
                        to={`/artists/${song.artist_id}`}
                        className="text-gray-300 text-sm mt-1 hover:underline block"
                      >
                        {song.artist_name}
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </div>
  );
};