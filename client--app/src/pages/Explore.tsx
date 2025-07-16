import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Skeleton from 'react-loading-skeleton'; // Import Skeleton
import 'react-loading-skeleton/dist/skeleton.css'; // Import CSS của Skeleton
import { Link } from 'react-router-dom'; // Import Link từ react-router-dom

export const Explore: React.FC = () => {
  const [genres, setGenres] = useState<{ genre_id: number; name: string; img: string | null }[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastGenreRef = useRef<HTMLDivElement | null>(null);

  // Hàm fetch danh sách thể loại
  const fetchGenres = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const response = await api.get('/public/explore/genres', {
        params: { page },
      });
      const { genres: newGenres, total, hasMore: newHasMore } = response.data;

      setGenres((prev) => [...prev, ...newGenres]);
      setHasMore(newHasMore);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
    setLoading(false);
  };

  // Cài đặt Intersection Observer để phát hiện cuộn
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchGenres();
        }
      },
      { threshold: 1.0 }
    );

    if (lastGenreRef.current) {
      observerRef.current.observe(lastGenreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading]);

  // Fetch lần đầu khi component mount
  useEffect(() => {
    fetchGenres();
  }, []);

  return (
    <div className="min-h-screen text-white py-6 px-10 bg-neutral-900 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Khám phá Thể Loại</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {genres.map((genre, index) => (
          <Link
            key={genre.genre_id}
            to={`/explore/genres/${genre.genre_id}/songs`} // Đường dẫn động tới chi tiết genre
            className="block" // Đảm bảo Link chiếm toàn bộ không gian của div
          >
            <div
              ref={index === genres.length - 1 ? lastGenreRef : null}
              className="p-4 rounded-lg hover:bg-neutral-800 transition-colors duration-200 flex flex-col items-center cursor-pointer"
            >
              {genre.img ? (
                <img
                  src={genre.img}
                  alt={genre.name}
                  className="w-full h-48 object-cover mb-2"
                />
              ) : (
                <div className="w-full h-48 bg-gray-600 rounded-md flex items-center justify-center mb-2">
                  <span>No Image</span>
                </div>
              )}
              <h2 className="text-lg font-semibold uppercase">{genre.name}</h2>
            </div>
          </Link>
        ))}
        {loading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="bg-neutral-800 p-4 rounded-lg">
              <Skeleton height={192} className="w-full mb-2 rounded-md" /> {/* H-48 = 192px */}
              <Skeleton height={24} width="60%" /> {/* H-6 = 24px cho tiêu đề */}
            </div>
          ))}
      </div>
      {loading && <p className="text-center mt-4">Đang tải...</p>}
    </div>
  );
};