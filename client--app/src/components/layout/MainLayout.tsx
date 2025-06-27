import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserHeader } from './UserHeader';
import { UserNavigation } from './UserNavigation';
import AudioPlayer from '../AudioPlayer';
import { useAudio } from '../../context/AudioContext';

export const MainLayout: React.FC = () => {
  const { currentSong, isExpanded, setIsExpanded, setCurrentSong } = useAudio();

  return (
    <div className="flex flex-col min-h-screen relative">
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
        <div className="w-8/10 bg-neutral-900 rounded-lg">
          <main>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Audio Player - Absolute ở dưới cùng */}
      <div className="absolute bottom-0 left-0 right-0">
        <AudioPlayer
          song={currentSong}
          onClose={() => setCurrentSong(null)}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />
      </div>
    </div>
  );
};