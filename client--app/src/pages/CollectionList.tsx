import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import api from "../services/api";

// Import Swiper styles
import "swiper/css";

interface Collection {
  artist_id: number;
  title: string;
  artist_name: string;
  img: string;
  popularity: number;
  created_at: string;
}

export const CollectionList: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await api.get("/public/highlight-collections");
        const data = response.data.data;
        console.log("API Response - Collections:", data); // Debug: Kiểm tra dữ liệu từ API
        setCollections(data);
      } catch (err) {
        setError("Không thể tải danh sách tuyển tập");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const colors = [
    "bg-pink-200",
    "bg-yellow-200",
    "bg-orange-200",
    "bg-green-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-red-200",
    "bg-teal-200",
    "bg-indigo-200",
    "bg-amber-200",
  ];

  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">
          Tuyển tập nhạc hay nhất của các nghệ sĩ
        </h2>
        <Link to="/collections" className="hover:underline text-white">
          Hiện tất cả
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="rounded-lg">
              <Skeleton height={40} className="mb-2" />
              <Skeleton height={200} className="mb-2" />
              <Skeleton height={24} />
            </div>
          ))}
        </div>
      ) : (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 6 },
          }}
          className="w-full"
        >
          {collections.map((collection, index) => (
            <SwiperSlide key={collection.artist_id}>
              <Link
                to={`/collection/${collection.artist_id}`}
                state={{ baseColor: colors[index % colors.length] }}
                onClick={() =>
                  console.log(
                    `Clicking collection ${collection.artist_id} with color: ${colors[index % colors.length]}`
                  ) // Debug: Kiểm tra khi click
                }
              >
                <div className={`${colors[index % colors.length]} rounded-lg`}>
                  <div className="bg-white text-black text-4xl font-bold p-0 text-center">
                    THIS IS
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={collection.img}
                      alt={collection.artist_name}
                      className="w-4/5 object-contain"
                    />
                  </div>
                  <div className="bg-inherit text-center p-0">
                    <h3 className="text-xl font-semibold text-black">
                      {collection.artist_name.toUpperCase()}
                    </h3>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};