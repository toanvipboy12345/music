import React from 'react';
import { UserHeader } from './UserHeader';
import { UserNavigation } from './UserNavigation';
import { Outlet } from 'react-router-dom'; // Component để render các route con

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hàng 1: Header */}
      <div className="w-full">
        <UserHeader />
      </div>

      {/* Hàng 2: Sidebar và Content */}
      <div className="flex flex-1 p-2 bg-black gap-2">
        {/* Sidebar Navigation - 2 phần */}
        <div className="w-2/10">
          <UserNavigation />
        </div>

        {/* Main Content - 8 phần */}
        <div className="w-8/10  bg-neutral-900 rounded-lg">
          <main>
            <Outlet /> {/* Render các page con như Home hoặc CollectionDetail */}
          </main>
        </div>
      </div>
    </div>
  );
};