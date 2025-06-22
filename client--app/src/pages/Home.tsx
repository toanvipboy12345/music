import React from 'react';
import { UserHeader } from '../components/layout/UserHeader';
import { UserNavigation } from '../components/layout/UserNavigation';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hàng 1: Header */}
      <div className="w-full">
        <UserHeader />
      </div>

      {/* Hàng 2: Sidebar và Content */}
      <div className="flex flex-1 p-2 bg-black gap-2"> {/* Thêm gap-2 để tạo khoảng cách */}
        {/* Sidebar Navigation - 2 phần */}
        <div className="w-2/10">
          <UserNavigation />
        </div>

        {/* Main Content - 8 phần */}
        <div className="w-8/10 p-4 bg-neutral-900 rounded-md">
          <main>
            <h1 className="text-2xl mb-4">Trang chủ</h1>
            <p>Chào mừng bạn đến với Music App!</p>
            {/* Nội dung trang chủ có thể được thêm ở đây */}
          </main>
        </div>
      </div>
    </div>
  );
};