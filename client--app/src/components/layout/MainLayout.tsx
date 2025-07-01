import React from "react";
import { Outlet } from "react-router-dom";
import { UserHeader } from "./UserHeader";
import { UserNavigation } from "./UserNavigation";
import AudioPlayer from "../AudioPlayer";
import QueueNav from "./QueueNav";
import { useAudio } from "../../context/AudioContext";

export const MainLayout: React.FC = () => {
  const audioContext = useAudio();
  const { currentSong, isExpanded, setIsExpanded, setCurrentSong, isQueueNavOpen } = audioContext;

  console.log("AudioContext in MainLayout:", audioContext);

  return (
    <div className="flex flex-col min-h-screen relative w-full">
      {/* Hàng 1: Header */}
      <div className="w-full h-16">
        <UserHeader />
      </div>

      {/* Hàng 2: Sidebar, Content, và QueueNav */}
      <div className="flex flex-1 p-2 bg-black gap-2 overflow-hidden w-full">
        <div className="w-[18%] min-w-[100px]">
          <UserNavigation />
        </div>
        <div className="flex-1 bg-neutral-900 rounded-lg overflow-hidden transition-all duration-300">
          <main className="h-full "> {/* Đảm bảo main chiếm toàn bộ chiều cao */}
            <Outlet />
          </main>
        </div>
        <div
          className={`w-[15%] min-w-[150px] ${
            isQueueNavOpen ? "opacity-100" : "hidden"
          } transition-all duration-300`}
        >
          <QueueNav />
        </div>
      </div>

      {/* Audio Player */}
      {currentSong && (
        <div className="absolute bottom-0 left-0 right-0">
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