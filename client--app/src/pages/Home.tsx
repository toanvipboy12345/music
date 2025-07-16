import React from "react";
import { CollectionList } from "../components/CollectionList"; // Điều chỉnh đường dẫn nếu cần
import { TopPopularArtists } from "../components/TopPopularArtists"; // Điều chỉnh đường dẫn nếu cần
import { TopLikedPlaylists } from "../components/TopLikedPlaylists"; // Điều chỉnh đường dẫn nếu cần
import { NewReleaseSongs } from "../components/NewReleaseSongs"; // Điều chỉnh đường dẫn nếu cần
import { PlaylistsForYou } from "../components/PlaylistsForYou";
import { TopPopularAlbums } from "@/components/TopPopularAlbums";
import { TopPopularSongs } from "@/components/TopPopularSongs";
export const Home: React.FC = () => {
  return (
    <>
      <TopPopularSongs/>
      <NewReleaseSongs /> {/* Nhúng danh sách bài hát mới phát hành */}
      <CollectionList /> {/* Nhúng danh sách tuyển tập */}
      <PlaylistsForYou /> {/* Nhúng danh sách phát dành cho bạn */}
      <TopPopularArtists /> {/* Nhúng danh sách ca sĩ nổi bật */}
      <TopPopularAlbums /> {/* Nhúng danh sách album phổ biến */}
      <TopLikedPlaylists /> {/* Nhúng danh sách phát được yêu thích */}
      {/* Bạn có thể thêm các thành phần khác ở đây nếu cần */}
      {/* <Footer/> */}
    </>
  );
};
