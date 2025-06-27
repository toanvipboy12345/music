import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { X, Maximize, Minimize } from 'react-feather';
import './AudioPlayer.css';
import { useAudio } from '../context/AudioContext';

interface Song {
  song_id: number;
  title: string;
  duration: number;
  audio_file_url: string;
  img: string;
  artist_id: number;
  artist_name: string;
  feat_artists: string[];
  album_name: string | null;
}

interface AudioPlayerProps {
  song: Song | null;
  onClose: () => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const AudioPlayerComponent: React.FC<AudioPlayerProps> = ({ song, onClose, isExpanded, setIsExpanded }) => {
  const { playlist, currentSongIndex, setCurrentSong, setCurrentSongIndex } = useAudio();

  if (!song) return null;

  const handlePrevious = () => {
    if (playlist.length > 0 && currentSongIndex > 0) {
      setCurrentSong(playlist[currentSongIndex - 1]);
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  const handleNext = () => {
    if (playlist.length > 0 && currentSongIndex < playlist.length - 1) {
      setCurrentSong(playlist[currentSongIndex + 1]);
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  return (
    <>
      {/* Phần mở rộng thông tin bài hát (trượt từ dưới lên) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 left-0 right-0 bottom-24 bg-black text-white z-50 overflow-y-auto"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{song.title}</h2>
                <button
                  className="text-white hover:scale-110 transition-transform"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize size={24} />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center flex-1">
                <img
                  src={song.img}
                  alt={song.title}
                  className="w-64 h-64 object-cover rounded-lg mb-6 border-4 border-gradient-to-r from-purple-500 to-blue-400"
                />
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white drop-shadow-lg">{song.title}</h3>
                  <p className="text-gray-400">
                    {song.artist_name}
                    {song.feat_artists.length > 0 ? ` feat. ${song.feat_artists.join(', ')}` : ''}
                  </p>
                  {song.album_name && (
                    <p className="text-gray-400">{song.album_name}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini player cố định ở dưới cùng */}
      <div className="fixed bottom-0 left-0 right-0 bg-black shadow-2xl z-50 h-24">
        <div className="flex items-center h-full p-2">
          <div className="flex items-center space-x-3 ml-3">
            <img
              src={song.img}
              alt={song.title}
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="text-white">
              <h3 className="text-sm font-bold truncate">{song.title}</h3>
              <p className="text-xs text-gray-300 truncate">
                {song.artist_name}
                {song.feat_artists.length > 0 ? ` feat. ${song.feat_artists.join(', ')}` : ''}
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center mx-2 justify-center">
            <AudioPlayer
              src={song.audio_file_url}
              autoPlay={true}
              showSkipControls={true}
              showJumpControls={false}
              onClickPrevious={handlePrevious}
              onClickNext={handleNext}
              layout="stacked"
              volume={0.5}
              className="rhap-custom-mini"
            />
          </div>
          <div className="flex items-center space-x-3 mr-3">
            <button
              className="text-white hover:scale-110 transition-transform"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <X
              className="w-5 h-5 text-white cursor-pointer hover:scale-110 transition-transform"
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPlayerComponent;