/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Toaster, toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../../services/api';

// Đăng ký các thành phần Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface RevenueByPlan {
  plan_id: number;
  plan_name: string;
  total_revenue: number;
  subscription_count: number;
}

interface RevenueByMonth {
  month: string;
  total_revenue: number;
}

interface TotalRevenueData {
  total_revenue: number;
  revenue_by_month: RevenueByMonth[];
  filters: {
    start_date: string | null;
    end_date: string | null;
  };
}

const AdminReports: React.FC = () => {
  const [totalRevenue, setTotalRevenue] = useState<TotalRevenueData | null>(null);
  const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<{ day: string; month: string; year: string }>({ day: '', month: '', year: '' });
  const [endDate, setEndDate] = useState<{ day: string; month: string; year: string }>({ day: '', month: '', year: '' });

  // Tạo danh sách tùy chọn cho ngày, tháng, năm
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 6 }, (_, i) => (2020 + i).toString()); // Từ 2020 đến 2025

  // Fetch dữ liệu thống kê
  const fetchRevenueData = async (start?: string, end?: string) => {
    try {
      setLoading(true);

      // Gọi API tổng doanh thu
      const totalRevenueResponse = await api.get('/admin/statistics/total-revenue', {
        params: { startDate: start, endDate: end },
      });

      // In response để debug
      console.log('API /admin/statistics/total-revenue response:', totalRevenueResponse.data);

      // Gọi API doanh thu theo gói
      const revenueByPlanResponse = await api.get('/admin/statistics/revenue-by-plan');

      // In response để debug
      console.log('API /admin/statistics/revenue-by-plan response:', revenueByPlanResponse.data);

      // Thêm độ trễ 1 giây để skeleton hiển thị
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTotalRevenue(totalRevenueResponse.data.data);
      setRevenueByPlan(revenueByPlanResponse.data.data);

      toast.success('Lấy dữ liệu báo cáo thành công.', {
        style: { background: 'black', color: 'white' },
      });
    } catch (error: any) {
      console.error('API error:', error.response?.data || error.message);
      toast.error('Không thể tải dữ liệu báo cáo.', {
        description: 'Vui lòng thử lại sau.',
        style: { background: 'black', color: 'white' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  // Xử lý submit form lọc thời gian
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In giá trị để debug
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    // Kiểm tra tất cả các trường đã được chọn
    if (!startDate.day || !startDate.month || !startDate.year || !endDate.day || !endDate.month || !endDate.year) {
      toast.error('Vui lòng chọn đầy đủ ngày, tháng, năm.', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }

    // Tạo chuỗi ngày YYYY-MM-DD
    const start = `${startDate.year}-${startDate.month}-${startDate.day}`;
    const end = `${endDate.year}-${endDate.month}-${endDate.day}`;

    // In chuỗi ngày để debug
    console.log('start (YYYY-MM-DD):', start);
    console.log('end (YYYY-MM-DD):', end);

    // Validate startDate <= endDate
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    if (startDateObj > endDateObj) {
      toast.error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.', {
        style: { background: 'black', color: 'white' },
      });
      return;
    }

    // Chuyển thành ISO để gửi API
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();

    // In ISO để debug
    console.log('startISO:', startISO);
    console.log('endISO:', endISO);

    fetchRevenueData(startISO, endISO);
  };

  // Dữ liệu cho biểu đồ Line (doanh thu theo tháng)
  const lineChartData = {
    labels: totalRevenue && totalRevenue.revenue_by_month ? totalRevenue.revenue_by_month.map(item => item.month) : [],
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: totalRevenue && totalRevenue.revenue_by_month ? totalRevenue.revenue_by_month.map(item => item.total_revenue) : [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Bar (doanh thu theo gói)
  const barChartData = {
    labels: revenueByPlan.map((plan) => plan.plan_name),
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: revenueByPlan.map((plan) => plan.total_revenue),
        backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
        borderColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)'],
        borderWidth: 1,
      },
      {
        label: 'Số lượng đăng ký',
        data: revenueByPlan.map((plan) => plan.subscription_count),
        backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(75, 192, 192, 0.6)'],
        borderColor: ['rgb(153, 102, 255)', 'rgb(255, 159, 64)', 'rgb(75, 192, 192)'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Báo cáo & Thống kê</h1>

      {loading ? (
        <div className="space-y-6">
          {/* Skeleton cho Form lọc và Tổng doanh thu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-md">
              <CardHeader>
                <Skeleton width={200} height={24} />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Skeleton width={150} height={40} />
                  <Skeleton width={150} height={40} />
                  <Skeleton width={100} height={40} />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <Skeleton width={200} height={24} />
              </CardHeader>
              <CardContent>
                <Skeleton width={100} height={48} />
              </CardContent>
            </Card>
          </div>
          {/* Skeleton cho Tabs */}
          <Card className="shadow-md">
            <CardHeader>
              <Skeleton width={200} height={24} />
            </CardHeader>
            <CardContent>
              <Skeleton height={300} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Form lọc thời gian và Tổng doanh thu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Form lọc thời gian */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Lọc theo thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Ngày bắt đầu</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Select value={startDate.day} onValueChange={(value) => setStartDate({ ...startDate, day: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ngày" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={startDate.month} onValueChange={(value) => setStartDate({ ...startDate, month: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tháng" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={startDate.year} onValueChange={(value) => setStartDate({ ...startDate, year: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Năm" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Ngày kết thúc</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Select value={endDate.day} onValueChange={(value) => setEndDate({ ...endDate, day: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ngày" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={endDate.month} onValueChange={(value) => setEndDate({ ...endDate, month: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tháng" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={endDate.year} onValueChange={(value) => setEndDate({ ...endDate, year: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Năm" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="link" >
                      Lọc
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Tổng doanh thu */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">Tổng doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl sm:text-5xl font-bold text-white">
                  {totalRevenue?.total_revenue.toLocaleString('vi-VN')} VNĐ
                </p>
                {totalRevenue?.filters.start_date || totalRevenue?.filters.end_date ? (
                  <p className="text-sm text-white mt-2">
                    Khoảng thời gian: {totalRevenue?.filters.start_date || 'N/A'} -{' '}
                    {totalRevenue?.filters.end_date || 'N/A'}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Tabs cho biểu đồ */}
          <Tabs defaultValue="time" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="time">Doanh thu theo thời gian</TabsTrigger>
              <TabsTrigger value="plan">Doanh thu theo gói</TabsTrigger>
            </TabsList>

            {/* Tab: Doanh thu theo thời gian */}
            <TabsContent value="time">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Doanh thu theo thời gian</CardTitle>
                </CardHeader>
                <CardContent>
                  {totalRevenue && totalRevenue.revenue_by_month && totalRevenue.revenue_by_month.length > 0 ? (
                    <Line
                      data={lineChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: true, text: 'Doanh thu hàng tháng (VNĐ)' },
                        },
                      }}
                      height={100}
                    />
                  ) : (
                    <p className="text-center text-sm sm:text-base py-4">
                      Không có dữ liệu doanh thu.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Doanh thu theo gói */}
            <TabsContent value="plan">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Doanh thu theo gói Premium</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueByPlan.length > 0 ? (
                    <Bar
                      data={barChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: true, text: 'Doanh thu và số lượng đăng ký theo gói' },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Giá trị' },
                          },
                        },
                      }}
                      height={100}
                    />
                  ) : (
                    <p className="text-center text-sm sm:text-base py-4">
                      Không có dữ liệu doanh thu theo gói.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Toaster richColors position="top-right" />
    </div>
  );
};

export default AdminReports;