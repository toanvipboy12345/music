const { Playlist, UserPlaylistLikes, UserArtistFollows, Artist, User, DownloadHistory, Song } = require('../models');

const libraryController = {
  getUserLibrary: async (req, res) => {
    try {
      const userId = req.user.user_id; // Lấy user_id từ req.user (được gán bởi middleware authenticateJWT)

      // 1. Kiểm tra trạng thái premium của người dùng
      const user = await User.findByPk(userId, {
        attributes: ['is_premium'],
      });

      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      // 2. Danh sách playlist của user
      const userPlaylists = await Playlist.findAll({
        where: { user_id: userId },
        attributes: ['playlist_id', 'title', 'img', 'description', 'is_public', 'like_count', 'created_at'],
      });

      const formattedUserPlaylists = userPlaylists.map((playlist) => ({
        id: playlist.playlist_id,
        title: playlist.title,
        img: playlist.img ? `${req.protocol}://${req.get('host')}${playlist.img}` : null,
        description: playlist.description,
        is_public: playlist.is_public,
        like_count: playlist.like_count,
        created_at: playlist.created_at,
      }));

      // 3. Danh sách playlist đã thích
      const likedPlaylists = await UserPlaylistLikes.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Playlist,
            as: 'Playlist',
            attributes: ['playlist_id', 'title', 'img', 'description', 'is_public', 'like_count', 'created_at'],
          },
        ],
      });

      const formattedLikedPlaylists = likedPlaylists.map((like) => ({
        id: like.Playlist.playlist_id,
        title: like.Playlist.title,
        img: like.Playlist.img ? `${req.protocol}://${req.get('host')}${like.Playlist.img}` : null,
        description: like.Playlist.description,
        is_public: like.Playlist.is_public,
        like_count: like.Playlist.like_count,
        created_at: like.Playlist.created_at,
      }));

      // 4. Danh sách ca sĩ follow
      const followedArtists = await UserArtistFollows.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Artist,
            as: 'Artist',
            attributes: ['artist_id', 'stage_name', 'profile_picture', 'follower', 'created_at'],
          },
        ],
      });

      const formattedFollowedArtists = followedArtists.map((follow) => ({
        id: follow.Artist.artist_id,
        stage_name: follow.Artist.stage_name,
        profile_picture: follow.Artist.profile_picture,
        follower: follow.Artist.follower,
        created_at: follow.Artist.created_at,
      }));

      // 5. Danh sách bài hát đã tải (chỉ dành cho premium user)
      let downloadedSongs = [];
      if (user.is_premium) {
        const downloadHistory = await DownloadHistory.findAll({
          where: { user_id: userId },
          include: [
            {
              model: Song,
              as: 'Song',
              attributes: ['song_id', 'title', 'audio_file_url', 'img', 'artist_id', 'created_at'],
              include: [
                {
                  model: Artist,
                  as: 'MainArtist',
                  attributes: ['artist_id', 'stage_name'],
                },
              ],
            },
          ],
          order: [['downloaded_at', 'DESC']], // Sắp xếp theo thời gian tải mới nhất
        });

        downloadedSongs = downloadHistory.map((download) => ({
          id: download.Song.song_id,
          title: download.Song.title,
          audio_file_url: download.Song.audio_file_url ? `${req.protocol}://${req.get('host')}${download.Song.audio_file_url}` : null,
          img: download.Song.img ? `${req.protocol}://${req.get('host')}${download.Song.img}` : null,
          artist: {
            id: download.Song.MainArtist.artist_id,
            stage_name: download.Song.MainArtist.stage_name,
          },
          downloaded_at: download.downloaded_at,
          created_at: download.Song.created_at,
        }));
      }

      // Định dạng phản hồi
      res.json({
        message: 'Lấy thư viện của người dùng thành công',
        library: {
          user_playlists: formattedUserPlaylists,
          liked_playlists: formattedLikedPlaylists,
          followed_artists: formattedFollowedArtists,
          downloaded_songs: downloadedSongs, // Thêm danh sách bài hát đã tải
        },
      });
    } catch (error) {
      console.error('Error getting user library:', error);
      res.status(500).json({ message: 'Lỗi khi lấy thư viện của người dùng', error: error.message });
    }
  },
};

module.exports = libraryController;