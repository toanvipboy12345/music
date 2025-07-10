import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { Button } from "../components/ui/button";

const PaymentResult: React.FC = () => {
  const { checkAuth, is_premium, premium_plan } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"success" | "failure" | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const responseCode = query.get("vnp_ResponseCode");

    const updateStatus = async () => {
      try {
        setLoading(true);
        await checkAuth();
        if (responseCode === "00") {
          setStatus("success");
        } else {
          setStatus("failure");
          setError("Thanh toán không thành công. Vui lòng thử lại.");
        }
        setLoading(false);
      } catch (err: any) {
        setStatus("failure");
        setError(err.response?.data?.message || "Lỗi khi kiểm tra trạng thái thanh toán");
        setLoading(false);
      }
    };

    updateStatus();
  }, [location.search, checkAuth]);

  return (
    <div className="bg-neutral-900 text-white min-h-screen flex justify-center items-center px-4">
      <div className=" p-6 rounded-md w-full sm:w-3/4 lg:w-1/2 text-center">

        {loading && (
          <div className="text-gray-400">Đang xử lý kết quả thanh toán...</div>
        )}

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {!loading && status === "success" && (
          <div className=" rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Thanh toán thành công!</h2>
            <p className="text-gray-300 mb-4">
              {is_premium && premium_plan
                ? `Bạn đã kích hoạt thành công gói Premium: ${premium_plan.toUpperCase()}.`
                : "Gói Premium của bạn đã được kích hoạt."}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="mt-4"
            >
              Về trang chủ
            </Button>
          </div>
        )}

        {!loading && status === "failure" && (
          <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Thanh toán thất bại</h2>
            <p className="text-gray-300 mb-4">
              Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/premium")}
              className="mt-4"
            >
              Quay lại danh sách gói
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;
