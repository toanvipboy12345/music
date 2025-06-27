import React from 'react';
import { Outlet } from 'react-router-dom';
import AudioPlayer from '../AudioPlayer';
import { useAudio } from '../../context/AudioContext';

export const AudioPlayerLayout: React.FC = () => {
  const { currentSong, isExpanded, setIsExpanded, setCurrentSong } = useAudio();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Outlet />
      </div>
      <AudioPlayer
        song={currentSong}
        onClose={() => setCurrentSong(null)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
    </div>
  );
};