/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Toaster, toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css"; // Import CSS cho skeleton
import { MusicalNoteIcon, UserGroupIcon, PlayCircleIcon, UserIcon } from '@heroicons/react/24/solid'; // Import icons
import api from "../../services/api";

interface Song {
  song_id: number;
  title: string;
  img: string | null;
  download_count: number;
}

interface StatisticsData {
  albums: {
    total_albums: number;
  };
  artists: {
    total_artists: number;
  };
  users: {
    total_users: number;
  };
  songs: {
    total_songs: number;
    top_downloaded_songs: Song[];
  };
}

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/statistics");
      // Thêm độ trễ 1 giây để đảm bảo skeleton hiển thị ít nhất 1 giây
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStats(response.data.data);
      toast.success("Lấy thống kê thành công.", {
        style: { background: "black", color: "white" },
      });
    } catch (error: any) {
      console.error("API error:", error.response?.data || error.message);
      toast.error("Không thể tải dữ liệu thống kê.", {
        description: "Vui lòng thử lại sau.",
        style: { background: "black", color: "white" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Trang chủ quản trị</h1>

      {loading ? (
        <div className="space-y-6">
          {/* Skeleton cho Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="shadow-md">
                <div className="flex flex-row items-center justify-between p-4">
                  <div className="flex flex-col items-center">
                    <Skeleton circle width={48} height={48} />
                    <Skeleton width={120} height={20} className="mt-2" />
                  </div>
                  <div>
                    <Skeleton width={80} height={48} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {/* Skeleton cho ListView */}
          <Card className="shadow-md">
            <CardHeader>
              <Skeleton width={200} height={24} />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 border rounded-xl"
                  >
                    <Skeleton circle width={48} height={48} className="mr-4" />
                    <div className="flex-1">
                      <Skeleton width={200} height={20} className="mb-2" />
                      <Skeleton width={100} height={16} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-300 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-col items-center">
                  <MusicalNoteIcon className="w-12 h-12 text-white" />
                  <CardTitle className="text-base sm:text-lg text-white mt-2 text-center">
                    Tổng số album
                  </CardTitle>
                </div>
                <CardContent className="p-0">
                  <p className="text-4xl sm:text-5xl font-bold text-white">
                    {stats?.albums.total_albums || 0}
                  </p>
                </CardContent>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-300 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-col items-center">
                  <UserGroupIcon className="w-12 h-12 text-white" />
                  <CardTitle className="text-base sm:text-lg text-white mt-2 text-center">
                    Tổng số nghệ sĩ
                  </CardTitle>
                </div>
                <CardContent className="p-0">
                  <p className="text-4xl sm:text-5xl font-bold text-white">
                    {stats?.artists.total_artists || 0}
                  </p>
                </CardContent>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-300 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-col items-center">
                  <PlayCircleIcon className="w-12 h-12 text-white" />
                  <CardTitle className="text-base sm:text-lg text-white mt-2 text-center">
                    Tổng số bài hát
                  </CardTitle>
                </div>
                <CardContent className="p-0">
                  <p className="text-4xl sm:text-5xl font-bold text-white">
                    {stats?.songs.total_songs || 0}
                  </p>
                </CardContent>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-red-500 to-red-300 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-col items-center">
                  <UserIcon className="w-12 h-12 text-white" />
                  <CardTitle className="text-base sm:text-lg text-white mt-2 text-center">
                    Tổng số người dùng
                  </CardTitle>
                </div>
                <CardContent className="p-0">
                  <p className="text-4xl sm:text-5xl font-bold text-white">
                    {stats?.users.total_users || 0}
                  </p>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Top Downloaded Songs ListView */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Top bài hát được tải nhiều nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats?.songs.top_downloaded_songs.length === 0 ? (
                  <div className="text-center text-sm sm:text-base py-4 col-span-2">
                    Không có bài hát nào được tìm thấy.
                  </div>
                ) : (
                  stats?.songs.top_downloaded_songs.map((song) => (
                    <div
                      key={song.song_id}
                      className="flex items-center p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 sm:w-16 flex-shrink-0">
                        {song.img ? (
                          <img
                            src={song.img}
                            alt={song.title}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                        ) : (
                          <span className="text-sm sm:text-base text-gray-500">
                            Không có hình
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm sm:text-base font-semibold line-clamp-1">
                          {song.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Lượt tải: {song.download_count}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Toaster richColors position="top-right" />
    </div>
  );
};

export default AdminHome;