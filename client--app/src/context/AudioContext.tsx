import React, { createContext, useContext, useState, type ReactNode } from 'react';

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

interface AudioContextType {
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  artistName: string;
  setArtistName: (name: string) => void;
  playlist: Song[];
  setPlaylist: (playlist: Song[]) => void;
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  isShuffle: boolean; // Thêm trạng thái shuffle
  setIsShuffle: (isShuffle: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [artistName, setArtistName] = useState<string>('');
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        setCurrentSong,
        isExpanded,
        setIsExpanded,
        artistName,
        setArtistName,
        playlist,
        setPlaylist,
        currentSongIndex,
        setCurrentSongIndex,
        isShuffle,
        setIsShuffle,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};