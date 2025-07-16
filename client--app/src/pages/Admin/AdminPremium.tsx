/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Toaster, toast } from 'sonner';
import { X } from 'lucide-react';
import api from '../../services/api';

interface PremiumPlan {
  plan_id: number;
  plan_name: string;
  description: string | null;
  price: number;
  duration_days: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

interface PremiumSubscription {
  subscription_id: number;
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  user: { user_id: number; username: string; email: string };
  plan: { plan_id: number; plan_name: string; features: string[] };
}

interface User {
  user_id: number;
  username: string;
  email: string;
}

const AdminPremium: React.FC = () => {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<PremiumSubscription[]>([]);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [pageSubscriptions, setPageSubscriptions] = useState(1);
  const [limit] = useState(10);
  const [searchPlans, setSearchPlans] = useState('');
  const [searchSubscriptions, setSearchSubscriptions] = useState('');
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [isDeleteSubscriptionDialogOpen, setIsDeleteSubscriptionDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<PremiumSubscription | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [endDate, setEndDate] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const availableFeatures = [
    { id: 'download_songs', label: 'Tải bài hát' },
    { id: 'exclusive_content', label: 'Nội dung độc quyền' },
    { id: 'queue_reorder', label: 'Sắp xếp danh sách chờ' },
    { id: 'listening_stats', label: 'Thống kê' },
  ];

  // Fetch premium plans
  const fetchPlans = async (search: string) => {
    try {
      const response = await api.get('/admin/premium/plans', {
        params: { search },
      });
      setPlans(response.data.plans || []);
    } catch (error: any) {
      toast.error('Không thể tải danh sách gói Premium.', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau.',
      });
    }
  };

  // Fetch premium subscriptions
  const fetchSubscriptions = async (page: number, search: string) => {
    try {
      const response = await api.get('/admin/premium/subscriptions', {
        params: {
          page,
          limit,
          user_id: search ? parseInt(search, 10) : undefined,
        },
      });
      setSubscriptions(response.data.subscriptions || []);
      setTotalSubscriptions(response.data.total || 0);
    } catch (error: any) {
      toast.error('Không thể tải danh sách đăng ký Premium.', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau.',
      });
    }
  };

  // Fetch users


  useEffect(() => {
    fetchPlans(searchPlans);
    fetchSubscriptions(pageSubscriptions, searchSubscriptions);
  }, [pageSubscriptions, searchPlans, searchSubscriptions]);

  // Handle search
  const handleSearchPlans = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPlans(e.target.value);
  };

  const handleSearchSubscriptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchSubscriptions(e.target.value);
    setPageSubscriptions(1);
  };

  // Handle pagination for subscriptions
  const totalSubscriptionPages = Math.ceil(totalSubscriptions / limit);
  const handleNextSubscriptionPage = () => {
    if (pageSubscriptions < totalSubscriptionPages) setPageSubscriptions(pageSubscriptions + 1);
  };
  const handlePrevSubscriptionPage = () => {
    if (pageSubscriptions > 1) setPageSubscriptions(pageSubscriptions - 1);
  };

  // Handle feature selection
  const handleFeatureSelection = (featureId: string) => {
    if (features.includes(featureId)) {
      setFeatures(features.filter((f) => f !== featureId));
    } else {
      setFeatures([...features, featureId]);
    }
  };

  // Handle save or update plan
  const handleSaveOrUpdatePlan = async () => {
    try {
      if (!planName.trim()) {
        toast.error('Vui lòng nhập tên gói.');
        return;
      }
      if (!price) {
        toast.error('Vui lòng nhập giá.');
        return;
      }
      if (!durationDays) {
        toast.error('Vui lòng nhập thời hạn.');
        return;
      }
      if (features.length === 0) {
        toast.error('Vui lòng chọn ít nhất một tính năng.');
        return;
      }

      const planData = {
        plan_name: planName,
        description: description || null,
        price: parseFloat(price),
        duration_days: parseInt(durationDays, 10),
        features,
      };

      if (dialogMode === 'create') {
        await api.post('/admin/premium/plans', planData);
        toast.success('Thêm gói Premium thành công.');
      } else {
        if (!selectedPlan) return;
        await api.put(`/admin/premium/plans/${selectedPlan.plan_id}`, planData);
        toast.success('Cập nhật gói Premium thành công.');
      }
      setIsPlanDialogOpen(false);
      resetPlanForm();
      fetchPlans(searchPlans);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Handle save subscription
  const handleSaveSubscription = async () => {
    try {
      if (!selectedUser) {
        toast.error('Vui lòng chọn người dùng.');
        return;
      }
      if (!selectedPlanId) {
        toast.error('Vui lòng chọn gói Premium.');
        return;
      }
      if (!endDate) {
        toast.error('Vui lòng chọn ngày hết hạn.');
        return;
      }

      const subscriptionData = {
        user_id: parseInt(selectedUser),
        plan_id: parseInt(selectedPlanId),
        end_date: new Date(endDate).toISOString(),
      };

      await api.post('/admin/premium/subscriptions', subscriptionData);
      toast.success('Kích hoạt đăng ký Premium thành công.');
      setIsSubscriptionDialogOpen(false);
      resetSubscriptionForm();
      fetchSubscriptions(pageSubscriptions, searchSubscriptions);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;
    try {
      await api.delete(`/admin/premium/subscriptions/${selectedSubscription.subscription_id}`);
      toast.success('Hủy đăng ký Premium thành công.');
      setIsDeleteSubscriptionDialogOpen(false);
      setSelectedSubscription(null);
      fetchSubscriptions(pageSubscriptions, searchSubscriptions);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.', {
        description: 'Vui lòng kiểm tra lại.',
      });
    }
  };

  // Open dialogs
  const openCreatePlanDialog = () => {
    resetPlanForm();
    setDialogMode('create');
    setIsPlanDialogOpen(true);
  };

  const openEditPlanDialog = (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    setPlanName(plan.plan_name);
    setDescription(plan.description || '');
    setPrice(plan.price.toString());
    setDurationDays(plan.duration_days.toString());
    setFeatures(plan.features);
    setDialogMode('edit');
    setIsPlanDialogOpen(true);
  };

  const openCreateSubscriptionDialog = () => {
    resetSubscriptionForm();
    setIsSubscriptionDialogOpen(true);
  };

  const openDeleteSubscriptionDialog = (subscription: PremiumSubscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteSubscriptionDialogOpen(true);
  };

  // Reset forms
  const resetPlanForm = () => {
    setPlanName('');
    setDescription('');
    setPrice('');
    setDurationDays('');
    setFeatures([]);
    setSelectedPlan(null);
  };

  const resetSubscriptionForm = () => {
    setSelectedUser('');
    setSelectedPlanId('');
    setEndDate('');
    setSelectedSubscription(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quản lý Premium</h1>

      {/* Premium Plans Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Danh sách gói Premium</h2>
        <div className="flex justify-between mb-4">
          <div className="w-1/3">
            <Input
              placeholder="Tìm kiếm gói Premium..."
              value={searchPlans}
              onChange={handleSearchPlans}
              className="w-full"
            />
          </div>
          <Button variant="link" onClick={openCreatePlanDialog}>
            Thêm gói Premium
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên gói</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Giá (VND)</TableHead>
              <TableHead>Thời hạn (ngày)</TableHead>
              <TableHead>Tính năng</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Ngày cập nhật</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Không có gói Premium nào được tìm thấy.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.plan_id}>
                  <TableCell>{plan.plan_id}</TableCell>
                  <TableCell>{plan.plan_name}</TableCell>
                  <TableCell>{plan.description || '-'}</TableCell>
                  <TableCell>{plan.price.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{plan.duration_days}</TableCell>
                  <TableCell>
                    {plan.features
                      .map(
                        (f) =>
                          availableFeatures.find((af) => af.id === f)?.label || f
                      )
                      .join(', ')}
                  </TableCell>
                  <TableCell>
                    {new Date(plan.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(plan.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => openEditPlanDialog(plan)}
                    >
                      Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Premium Subscriptions Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          Danh sách đăng ký Premium
        </h2>
        <div className="flex justify-between mb-4">
          <div className="w-1/3">
            <Input
              placeholder="Tìm kiếm theo ID người dùng..."
              value={searchSubscriptions}
              onChange={handleSearchSubscriptions}
              className="w-full"
            />
          </div>
          <Button variant="link" onClick={openCreateSubscriptionDialog}>
            Kích hoạt đăng ký
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Gói</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Không có đăng ký Premium nào được tìm thấy.
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription.subscription_id}>
                  <TableCell>{subscription.subscription_id}</TableCell>
                  <TableCell>
                    {subscription.user.username} ({subscription.user.email})
                  </TableCell>
                  <TableCell>{subscription.plan.plan_name}</TableCell>
                  <TableCell>
                    {new Date(subscription.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(subscription.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{subscription.status}</TableCell>
                  <TableCell>
                    {new Date(subscription.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteSubscriptionDialog(subscription)}
                    >
                      Hủy
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex justify-between mt-4">
          <Button
            variant="link"
            onClick={handlePrevSubscriptionPage}
            disabled={pageSubscriptions === 1}
          >
            Trang trước
          </Button>
          <span>
            Trang {pageSubscriptions} / {totalSubscriptionPages}
          </span>
          <Button
            variant="link"
            onClick={handleNextSubscriptionPage}
            disabled={pageSubscriptions === totalSubscriptionPages}
          >
            Trang sau
          </Button>
        </div>
      </div>

      {/* Dialog for Create/Edit Plan */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Thêm gói Premium' : 'Sửa gói Premium'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Điền thông tin gói Premium mới.'
                : 'Cập nhật thông tin gói Premium. Các trường không thay đổi có thể để trống.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan_name">Tên gói</Label>
              <Input
                id="plan_name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Nhập tên gói"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả gói"
              />
            </div>
            <div>
              <Label htmlFor="price">Giá (VND)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Nhập giá gói"
              />
            </div>
            <div>
              <Label htmlFor="duration_days">Thời hạn (ngày)</Label>
              <Input
                id="duration_days"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="Nhập số ngày"
              />
            </div>
            <div>
              <Label>Tính năng</Label>
              <div className="space-y-2">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center">
                    <Checkbox
                      id={feature.id}
                      checked={features.includes(feature.id)}
                      onCheckedChange={() => handleFeatureSelection(feature.id)}
                    />
                    <Label htmlFor={feature.id} className="ml-2">
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsPlanDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="link" onClick={handleSaveOrUpdatePlan}>
              {dialogMode === 'create' ? 'Lưu' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Create Subscription */}
      <Dialog
        open={isSubscriptionDialogOpen}
        onOpenChange={setIsSubscriptionDialogOpen}
      >
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>Kích hoạt đăng ký Premium</DialogTitle>
            <DialogDescription>
              Chọn người dùng, gói Premium và ngày hết hạn để kích hoạt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user_id">Người dùng</Label>
              <Select
                onValueChange={(value) => setSelectedUser(value)}
                value={selectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người dùng" />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      Không có người dùng
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem
                        key={user.user_id}
                        value={user.user_id.toString()}
                      >
                        {user.username} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plan_id">Gói Premium</Label>
              <Select
                onValueChange={(value) => setSelectedPlanId(value)}
                value={selectedPlanId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn gói Premium" />
                </SelectTrigger>
                <SelectContent>
                  {plans.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      Không có gói Premium
                    </div>
                  ) : (
                    plans.map((plan) => (
                      <SelectItem
                        key={plan.plan_id}
                        value={plan.plan_id.toString()}
                      >
                        {plan.plan_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="end_date">Ngày hết hạn</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setIsSubscriptionDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="link" onClick={handleSaveSubscription}>
              Kích hoạt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Cancel Subscription */}
      <Dialog
        open={isDeleteSubscriptionDialogOpen}
        onOpenChange={setIsDeleteSubscriptionDialogOpen}
      >
        <DialogContent variant="white">
          <DialogHeader>
            <DialogTitle>Hủy đăng ký Premium</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy đăng ký của người dùng "
              {selectedSubscription?.user.username}" cho gói "
              {selectedSubscription?.plan.plan_name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="link"
              onClick={() => setIsDeleteSubscriptionDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Hủy đăng ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default AdminPremium;