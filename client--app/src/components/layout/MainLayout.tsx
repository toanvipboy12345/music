import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UserHeader } from "./UserHeader";
import { UserNavigation } from "./UserNavigation";
import AudioPlayer from "../AudioPlayer";
import QueueNav from "./QueueNav";
import { useAudio } from "../../context/AudioContext";
import Footer from "./Footer";
import logo from '../../assets/1725820319spotify-logo-black.png';
import './../layout.css';

export const MainLayout: React.FC = () => {
  const audioContext = useAudio();
  const { currentSong, isExpanded, setIsExpanded, setCurrentSong, isQueueNavOpen } = audioContext;
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(location.pathname === '/');
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (location.pathname === '/') {
      setIsLoading(true);
      setStartAnimation(false);
      const timer = setTimeout(() => {
        setStartAnimation(true); // Bắt đầu hiệu ứng sau 1.5 giây
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
      setStartAnimation(false);
    }
  }, [location.pathname, location.key]);

  console.log("AudioContext in MainLayout:", audioContext);

  if (isLoading) {
    return (
      <div
        className={`flex justify-center items-center h-screen bg-neutral-900 ${
          startAnimation ? 'animate-fadeOut' : ''
        }`}
        onAnimationEnd={() => {
          if (startAnimation) setIsLoading(false); // Chỉ đóng splash screen sau khi hiệu ứng hoàn tất
        }}
      >
        <img
          src={logo}
          alt="Loading"
          className={`w-64 h-auto ${startAnimation ? 'animate-scaleDown' : ''}`}
        />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn flex flex-col h-screen w-full relative bg-black">
      {/* Hàng 1: Header */}
      <div className="w-full h-16">
        <UserHeader />
      </div>

      {/* Hàng 2: Sidebar, Content, và QueueNav */}
      <div className="flex flex-1 px-2 pb-0 pt-2 bg-black gap-2 overflow-hidden w-full">
        <div className="hidden md:block w-[18%] min-w-[100px] rounded-lg">
          <UserNavigation />
        </div>
        <div className="flex-1 bg-neutral-900 rounded-lg overflow-hidden transition-all duration-300">
          <main className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-600 scrollbar-track-gray-800 pb-20">
            <Outlet />
            <Footer />
          </main>
        </div>
        {isQueueNavOpen && (
          <div className="hidden md:block w-[15%] min-w-[150px] opacity-100 transition-all duration-300">
            <QueueNav />
          </div>
        )}
      </div>

      {/* Audio Player */}
      {currentSong && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <AudioPlayer
            song={currentSong}
            onClose={() => setCurrentSong(null)}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />
        </div>
      )}
    </div>
  );
};