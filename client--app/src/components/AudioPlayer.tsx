/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { X, Maximize, Minimize, List } from "react-feather";
import "./AudioPlayer.css";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/authContext";
import api from "../services/api";
import { toast } from "sonner";

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

const AudioPlayerComponent: React.FC<AudioPlayerProps> = ({
  song,
  onClose,
  isExpanded,
  setIsExpanded,
}) => {
  const {
    setCurrentSong,
    setCurrentSongIndex,
    setPlaylist,
    setQueue,
    queue,
    setArtistName,
    fetchQueue,
    isQueueNavOpen,
    setIsQueueNavOpen,
  } = useAudio();
  const { isAuthenticated, token } = useAuth();
  const hasIncrementedRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<AudioPlayer>(null);
  const isPlayingRef = useRef<boolean>(false);
  const lastSongIdRef = useRef<number | null>(null);
  const [randomColor, setRandomColor] = useState<string>("bg-purple-500"); // State để lưu màu ngẫu nhiên

  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-yellow-500",
  ]; // Mảng màu Tailwind

  useEffect(() => {
    if (isExpanded) {
      // Chọn màu ngẫu nhiên khi mở rộng
      const randomIndex = Math.floor(Math.random() * colors.length);
      setRandomColor(colors[randomIndex]);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("User logged out, resetting audio state");
      setCurrentSong(null);
      setPlaylist([]);
      setCurrentSongIndex(0);
      setIsExpanded(false);
      setQueue([]);
      setArtistName("");
      if (audioPlayerRef.current?.audio.current) {
        console.log("Pausing and resetting audio player");
        audioPlayerRef.current.audio.current.pause();
        audioPlayerRef.current.audio.current.currentTime = 0;
        audioPlayerRef.current.audio.current.src = "";
        isPlayingRef.current = false;
      }
    }
  }, [
    isAuthenticated,
    setCurrentSong,
    setPlaylist,
    setCurrentSongIndex,
    setIsExpanded,
    setQueue,
    setArtistName,
  ]);

  useEffect(() => {
    if (!song) {
      console.log("No song, resetting document title");
      document.title = "Music App";
      if (audioPlayerRef.current?.audio.current) {
        audioPlayerRef.current.audio.current.pause();
        audioPlayerRef.current.audio.current.currentTime = 0;
        audioPlayerRef.current.audio.current.src = "";
        isPlayingRef.current = false;
      }
      return;
    }

    console.log("Updating document title for song:", song.song_id, song.title);
    const artistString =
      song.feat_artists.length > 0
        ? `${song.artist_name}, ${song.feat_artists.join(", ")}`
        : song.artist_name;
    document.title = `${song.title} - ${artistString}`;

    const timer = setTimeout(async () => {
      if (song.song_id !== hasIncrementedRef.current) {
        try {
          console.log("Incrementing listen count for song:", song.song_id);
          await api.post(`/public/listen/song/${song.song_id}`);
          hasIncrementedRef.current = song.song_id;
          console.log("Listen count incremented for song:", song.song_id);
        } catch (error) {
          console.error("Error incrementing listen count:", error);
        }
      }
    }, 3000);

    return () => {
      console.log("Cleaning up document title and timer");
      document.title = "Music App";
      clearTimeout(timer);
    };
  }, [song]);

  const playSong = useCallback(async () => {
    if (!song || !audioPlayerRef.current?.audio.current) {
      console.log("No song or audio element, skipping play");
      return;
    }

    if (lastSongIdRef.current === song.song_id) {
      console.log("Song unchanged, checking play state:", song.song_id);
      const audio = audioPlayerRef.current.audio.current;
      if (!isPlayingRef.current && !audio.paused) {
        console.log("Audio already playing, skipping");
        return;
      }
    }

    console.log("Playing song:", song.song_id, song.title);
    const audio = audioPlayerRef.current.audio.current;
    if (audio.src !== song.audio_file_url) {
      console.log("Setting audio source:", song.audio_file_url);
      audio.src = song.audio_file_url;
    }

    try {
      await audio.play();
      isPlayingRef.current = true;
      lastSongIdRef.current = song.song_id;
      console.log("Song playing successfully:", song.song_id);
      toast.success(`Đang phát: ${song.title}`, {
        style: { background: "black", color: "white" },
      });
    } catch (error: any) {
      console.error("Error playing song:", song.song_id, error);
      if (error.name !== "AbortError") {
        toast.error("Không thể phát bài hát", {
          style: { background: "black", color: "white" },
        });
      }
    }
  }, [song]);

  useEffect(() => {
    playSong();
  }, [playSong]);

  const handleNext = async () => {
    if (!isAuthenticated || !token) {
      console.log("handleNext: Not authenticated or no token");
      toast.error("Yêu cầu đăng nhập để phát bài tiếp theo", {
        style: { background: "black", color: "white" },
        action: {
          label: "Đăng nhập",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return;
    }

    if (!song || !audioPlayerRef.current?.audio.current) {
      console.log("No current song or audio element");
      return;
    }

    try {
      console.log("Current song:", song.song_id, song.title);
      const currentIndex = queue.findIndex((item) => item.is_current);
      if (currentIndex === -1 || currentIndex + 1 >= queue.length) {
        console.log(
          "Last song in queue, replaying current song:",
          song.song_id
        );
        const audio = audioPlayerRef.current.audio.current;
        audio.currentTime = 0;
        await audio.play();
        isPlayingRef.current = true;
        toast.info(`Phát lại: ${song.title}`, {
          style: { background: "black", color: "white" },
        });
        return;
      }

      const nextSong = queue[currentIndex + 1];
      console.log("Next song:", nextSong.song_id, nextSong.title);

      await api.put(
        "/user/queue/update-current",
        { song_id: nextSong.song_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Updated current song on server:", nextSong.song_id);

      setCurrentSong({
        song_id: nextSong.song_id,
        title: nextSong.title,
        duration: nextSong.duration,
        audio_file_url: nextSong.audio_file_url,
        img: nextSong.img,
        artist_id: nextSong.artist_id || 0,
        artist_name: nextSong.artist_name,
        feat_artists: nextSong.feat_artists,
        album_name: nextSong.album_name,
      });
      setCurrentSongIndex(currentIndex + 1);
      setArtistName(nextSong.artist_name);
      await fetchQueue();
    } catch (error: any) {
      console.error(
        "Error in handleNext:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Không thể chuyển bài tiếp theo",
        {
          style: { background: "black", color: "white" },
        }
      );
    }
  };

  const handlePrevious = async () => {
    if (!isAuthenticated || !token) {
      console.log("handlePrevious: Not authenticated or no token");
      toast.error("Yêu cầu đăng nhập để phát bài trước đó", {
        style: { background: "black", color: "white" },
        action: {
          label: "Đăng nhập",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return;
    }

    if (!song || !audioPlayerRef.current?.audio.current) {
      console.log("No current song or audio element");
      return;
    }

    try {
      console.log("Current song:", song.song_id, song.title);
      const currentIndex = queue.findIndex((item) => item.is_current);
      if (currentIndex <= 0) {
        console.log(
          "First song in queue, replaying current song:",
          song.song_id
        );
        const audio = audioPlayerRef.current.audio.current;
        audio.currentTime = 0;
        await audio.play();
        isPlayingRef.current = true;
        toast.info(`Phát lại: ${song.title}`, {
          style: { background: "black", color: "white" },
        });
        return;
      }

      const prevSong = queue[currentIndex - 1];
      console.log("Previous song:", prevSong.song_id, prevSong.title);

      await api.put(
        "/user/queue/update-current",
        { song_id: prevSong.song_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Updated current song on server:", prevSong.song_id);

      setCurrentSong({
        song_id: prevSong.song_id,
        title: prevSong.title,
        duration: prevSong.duration,
        audio_file_url: prevSong.audio_file_url,
        img: prevSong.img,
        artist_id: prevSong.artist_id || 0,
        artist_name: prevSong.artist_name,
        feat_artists: prevSong.feat_artists,
        album_name: prevSong.album_name,
      });
      setCurrentSongIndex(currentIndex - 1);
      setArtistName(prevSong.artist_name);
      await fetchQueue();
    } catch (error: any) {
      console.error(
        "Error in handlePrevious:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Không thể chuyển bài trước đó",
        {
          style: { background: "black", color: "white" },
        }
      );
    }
  };

  const handleEnded = async () => {
    if (!isAuthenticated || !token || !song) {
      console.log("handleEnded: Not authenticated, no token, or no song");
      return;
    }
    await handleNext();
  };

  const handleClose = async () => {
    try {
      if (isAuthenticated && token) {
        console.log("Sending DELETE /user/queue/clear");
        await api.delete("/user/queue/clear", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Queue cleared successfully");
        toast.success("Đã làm trống danh sách chờ", {
          style: { background: "black", color: "white" },
        });
      }

      setCurrentSong(null);
      setCurrentSongIndex(0);
      setPlaylist([]);
      setQueue([]);
      setArtistName("");
      setIsExpanded(false);
      if (audioPlayerRef.current?.audio.current) {
        console.log("Pausing and resetting audio player");
        audioPlayerRef.current.audio.current.pause();
        audioPlayerRef.current.audio.current.currentTime = 0;
        audioPlayerRef.current.audio.current.src = "";
        isPlayingRef.current = false;
      }
      document.title = "Music App";
      onClose();
    } catch (error: any) {
      console.error(
        "Error in handleClose:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Không thể làm trống danh sách chờ",
        {
          style: { background: "black", color: "white" },
        }
      );
      onClose();
    }
  };



  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed top-0 left-0 right-0 bottom-24 ${randomColor} text-white z-50 overflow-y-auto`}
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {song?.title || "Không có bài hát"}
                </h2>
                <button
                  className="text-white hover:scale-110 transition-transform"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize size={24} />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center flex-1">
                {song ? (
                  <>
                    <img
                      src={song.img}
                      alt={song.title}
                      className="sm:w-64 sm:h-64 md:w-120 md:h-120 lg:w-128 lg:h-128 xl:w-150 xl:h-150 object-cover rounded-lg mb-6 border-3"
                    />
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-white drop-shadow-lg">
                        {song.title}
                      </h3>
                      <p className="text-white text-lg">
                        {song.artist_name}
                        {song.feat_artists.length > 0
                          ? ` feat. ${song.feat_artists.join(", ")}`
                          : ""}
                      </p>
                      {song.album_name && (
                        <p className="text-gray-400">{song.album_name}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">Không có bài hát đang phát</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 bg-black shadow-2xl z-50 h-24 grid grid-cols-12 items-center p-2">
        <div className="col-span-3 flex items-center space-x-3 ml-3">
          {song ? (
            <>
              <img
                src={song.img}
                alt={song.title}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="text-white">
                <h3 className="text-sm font-bold truncate">{song.title}</h3>
                <p className="text-xs text-gray-300 truncate">
                  {song.artist_name}
                  {song.feat_artists.length > 0
                    ? ` feat. ${song.feat_artists.join(", ")}`
                    : ""}
                </p>
              </div>
            </>
          ) : (
            <div className="text-white">
              <h3 className="text-sm font-bold">Không có bài hát</h3>
              <p className="text-xs text-gray-300">Chọn một bài hát để phát</p>
            </div>
          )}
        </div>
        <div className="col-span-6 flex items-center justify-center">
          <AudioPlayer
            ref={audioPlayerRef}
            src={song?.audio_file_url || ""}
            autoPlay={!!song}
            showSkipControls={true}
            showJumpControls={false}
            onClickPrevious={handlePrevious}
            onClickNext={handleNext}
            onEnded={handleEnded}
            layout="stacked"
            volume={0.5}
            className="rhap-custom-mini"
          />
        </div>
        <div className="col-span-3 flex items-center justify-end space-x-3 mr-3">
          <button
            className="text-white hover:scale-110 transition-transform"
            onClick={() => setIsQueueNavOpen(!isQueueNavOpen)}
          >
            <List size={18} />
          </button>
          <button
            className="text-white hover:scale-110 transition-transform"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <X
            className="w-5 h-5 text-white cursor-pointer hover:scale-110 transition-transform"
            onClick={handleClose}
          />
        </div>
      </div>
    </>
  );
};

export default AudioPlayerComponent;