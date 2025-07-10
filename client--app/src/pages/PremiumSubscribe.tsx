/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import api from "../services/api";
import { Button } from "../components/ui/button";

interface PremiumPlan {
  plan_id: number;
  plan_name: string;
  description: string | null;
  price: number;
  duration_days: number;
  features: string[];
}

const PremiumSubscribe: React.FC = () => {
  const { plan_id } = useParams<{ plan_id: string }>();
  const { isAuthenticated, userId, is_premium, premium_plan } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PremiumPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm định dạng giá tiền theo kiểu Việt Nam
  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Lấy thông tin gói Premium
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/user/premium/plans/${plan_id}`);
        setPlan(response.data.plan);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Lỗi khi tải thông tin gói Premium");
        setLoading(false);
      }
    };

    if (plan_id) {
      fetchPlan();
    } else {
      setError("Không tìm thấy ID gói Premium");
      setLoading(false);
    }
  }, [plan_id]);

  // Xử lý đăng ký gói Premium
  const handlePayment = async () => {
    if (!isAuthenticated || !userId) {
      navigate("/login", { state: { from: `/premium/subscribe/${plan_id}` } });
      return;
    }

    if (is_premium && premium_plan === plan?.plan_name.toLowerCase()) {
      setError("Bạn đang sử dụng gói Premium này!");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/user/premium/vnpay", {
        user_id: userId,
        plan_id: Number(plan_id),
      });
      const { paymentUrl } = response.data;
      window.location.href = paymentUrl; // Chuyển hướng đến URL thanh toán VNPay
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi tạo yêu cầu thanh toán");
      setLoading(false);
    }
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

  return (
    <div className="bg-neutral-900 text-white p-6 min-h-screen rounded-md w-full sm:w-3/4 lg:w-1/2 mx-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Đăng ký gói Premium</h1>

        {loading && (
          <div className="text-center text-gray-400">Đang tải thông tin gói...</div>
        )}
        {error && (
          <div className="text-center text-red-500 mb-4">{error}</div>
        )}

        {plan && !loading && !error && (
          <div className="bg-gradient-to-br from-emerald-500 to-neutral-900 border border-gray-700 rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              {plan.plan_name.toUpperCase()}
            </h2>
            <p className="text-gray-300 mb-4">
              {plan.description || "Không có mô tả"}
            </p>
            <div className="text-white mb-4">
              Giá: {formatPrice(Math.floor(plan.price))} VND
            </div>
            <div className="text-white mb-4">
              Thời hạn: {plan.duration_days} ngày
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Tính năng:</h3>
              <ul className="list-disc list-inside text-white space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index}>{displayFeatureName(feature)}</li>
                ))}
              </ul>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePayment}
              disabled={loading || (is_premium ?? false) && premium_plan === plan.plan_name.toLowerCase()}
            >
              {(is_premium ?? false) && premium_plan === plan.plan_name.toLowerCase()
                ? "Đang sử dụng"
                : "Thanh toán qua VNPay"}
            </Button>
          </div>
        )}

        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => navigate("/premium")}
            className="text-gray-400 hover:text-white"
          >
            Quay lại danh sách gói
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumSubscribe;