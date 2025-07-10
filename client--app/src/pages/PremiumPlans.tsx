import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Thêm Link
import { Button } from "../components/ui/button";
import { useAuth } from "../context/authContext";
import api from "../services/api";
import { CheckIcon } from "@heroicons/react/24/solid";

interface PremiumPlan {
  plan_id: number;
  plan_name: string;
  description: string | null;
  price: number;
  duration_days: number;
  features: string[];
}

// Hàm định dạng giá tiền theo kiểu Việt Nam (phân cách hàng nghìn bằng dấu chấm)
const formatPrice = (price: number): string => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const PremiumPlans: React.FC = () => {
  const { isAuthenticated, is_premium, premium_plan } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Danh sách gradient chuyển về bg-neutral-900
  const gradientColors = [
    { from: "from-emerald-500", to: "to-neutral-900" },
    { from: "from-blue-600", to: "to-neutral-900" },
    { from: "from-purple-500", to: "to-neutral-900" },
    { from: "from-indigo-500", to: "to-neutral-900" },
    { from: "from-teal-500", to: "to-neutral-900" },
  ];

  // Hàm xáo trộn mảng (Fisher-Yates shuffle)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Hàm lấy danh sách gradient không trùng lặp
  const getUniqueGradients = (count: number) => {
    const shuffled = shuffleArray(gradientColors);
    const result: typeof gradientColors = [];
    for (let i = 0; i < count; i++) {
      result.push(shuffled[i % shuffled.length]);
    }
    return result;
  };

  // Gọi API để lấy danh sách gói Premium
  useEffect(() => {
    const fetchPremiumPlans = async () => {
      try {
        setLoading(true);
        const response = await api.get("/user/premium/plans");
        setPlans(response.data.plans);
        setLoading(false);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Lỗi khi tải danh sách gói Premium"
        );
        setLoading(false);
      }
    };

    fetchPremiumPlans();
  }, []);

  // Lấy tất cả tính năng không trùng lặp từ các gói
  const getUniqueFeatures = () => {
    const allFeatures = new Set<string>();
    plans.forEach((plan) =>
      plan.features.forEach((feature) => allFeatures.add(feature))
    );
    return Array.from(allFeatures);
  };

  // Hàm hiển thị tên tính năng bằng tiếng Việt
  const displayFeatureName = (feature: string) => {
    switch (feature) {
      case "download_songs":
        return "Tải bài hát";
      case "exclusive_content":
        return "Nội dung độc quyền";
      case "queue_reorder":
        return "Sắp xếp lại hàng đợi";
      case "listening_stats":
        return "Thống kê nghe nhạc";
      default:
        return feature;
    }
  };

  // Lấy danh sách gradient cho các gói
  const uniqueGradients = getUniqueGradients(plans.length);

  return (
    <div className="bg-neutral-900 text-white p-3 min-h-screen rounded-md w-full sm:w-3/4 lg:w-1/2 py-6 px-4 sm:px-6 lg:px-10 mx-auto">
      <div className="max-w-7xl mx-auto">
        {/* Phần tiêu đề chính */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-wide">
            Khám phá gói Premium
          </h1>
          <p className="text-lg text-gray-300 mt-2">
            Gói hợp túi tiền cho mọi hoàn cảnh. Nghe nhạc không quảng cáo trên
            mọi thiết bị. Thanh toán linh hoạt, hủy bất cứ lúc nào.
          </p>
        </div>

        {/* Lợi ích và tính năng tổng hợp */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-semibold">Lợi ích của tất cả các gói</h2>
          <div className="text-right sm:mt-0 mt-4 sm:text-right">
            <ul className="space-y-2">
              {getUniqueFeatures().map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  {displayFeatureName(feature)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Hiển thị trạng thái Premium của người dùng */}
        {isAuthenticated && (is_premium ?? false) && premium_plan && (
          <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold">
              Gói Premium hiện tại của bạn: {premium_plan.toUpperCase()}
            </h2>
            <p className="text-gray-400">
              Bạn đang sử dụng gói Premium. Cảm ơn bạn đã ủng hộ chúng tôi!
            </p>
          </div>
        )}

        {/* Hiển thị thông báo tải hoặc lỗi */}
        {loading && (
          <div className="text-center text-gray-400">
            Đang tải danh sách gói Premium...
          </div>
        )}
        {error && <div className="text-center text-red-500">{error}</div>}

        {/* Danh sách gói Premium */}
        {!loading && !error && plans.length === 0 && (
          <div className="text-center text-gray-400">
            Hiện tại không có gói Premium nào.
          </div>
        )}
        {!loading && !error && plans.length > 0 && (
          <div className="flex flex-wrap justify-center gap-12">
            {plans.map((plan, index) => {
              const gradient = uniqueGradients[index]; // Gradient duy nhất cho mỗi gói
              return (
                <div
                  key={plan.plan_id}
                  className={`bg-gradient-to-br ${gradient.from} ${gradient.to} border border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 max-w-xs`}
                >
                  <div className="pb-2">
                    <h2 className="text-2xl font-bold text-white">
                      {plan.plan_name.toUpperCase()}
                    </h2>
                  </div>
                  <div className="space-y-4 p-2">
                    <p className="text-white text-sm">
                      {plan.description || "Không có mô tả"}
                    </p>
                    <div className="text-white text-sm">
                      Giá: {formatPrice(Math.floor(plan.price))} VND - Thời hạn:{" "}
                      {plan.duration_days} ngày
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">
                        Tính năng:
                      </h3>
                      <ul className="list-disc list-inside text-white text-sm space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index}>{displayFeatureName(feature)}</li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      disabled={(is_premium ?? false) && premium_plan === plan.plan_name.toLowerCase()}
                    >
                      {isAuthenticated ? (
                        <Link to={`/premium/subscribe/${plan.plan_id}`}>
                          {(is_premium ?? false) && premium_plan === plan.plan_name.toLowerCase()
                            ? "Đang sử dụng"
                            : "Đăng ký ngay"}
                        </Link>
                      ) : (
                        <Link to="/login" state={{ from: `/premium/subscribe/${plan.plan_id}` }}>
                          Đăng nhập để đăng ký
                        </Link>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bảng so sánh các gói */}
        {!loading && !error && plans.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-center mb-6">
              So sánh các gói Premium
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="border border-gray-700 p-4 text-left">
                      Tính năng
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.plan_id}
                        className="border border-gray-700 p-4 text-center"
                      >
                        {plan.plan_name.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getUniqueFeatures().map((feature, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="border border-gray-700 p-4">
                        {displayFeatureName(feature)}
                      </td>
                      {plans.map((plan) => (
                        <td
                          key={plan.plan_id}
                          className="border border-gray-700 p-4 text-center"
                        >
                          {plan.features.includes(feature) ? (
                            <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Phần tiêu đề cuối */}
        <div className="text-center mt-12">
          <h1 className="text-4xl font-bold tracking-wide">
            Trải nghiệm sự khác biệt
          </h1>
          <p className="text-lg text-gray-300 mt-2">
            Dùng Premium để nắm toàn quyền kiểm soát trải nghiệm nghe nhạc. Hủy
            bất cứ lúc nào.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumPlans;