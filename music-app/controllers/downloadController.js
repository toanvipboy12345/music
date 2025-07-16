const axios = require('axios');
const { DROPBOX_ACCESS_TOKEN } = process.env;
const { Song, DownloadHistory } = require('../models'); // Import Song và DownloadHistory

const downloadController = {
  downloadSong: async (req, res) => {
    try {
      const { songId } = req.params; // Lấy songId từ URL
      const userId = req.user.user_id; // Lấy user_id từ req.user (được gán bởi middleware authenticateJWT)

      // Tìm bài hát trong cơ sở dữ liệu dựa trên song_id
      const song = await Song.findByPk(songId, {
        attributes: ['song_id', 'audio_file_url', 'is_downloadable'],
      });

      // Kiểm tra xem bài hát có tồn tại không
      if (!song) {
        return res.status(404).json({ message: 'Bài hát không tồn tại' });
      }

      // Kiểm tra nếu bài hát cho phép tải xuống
      if (!song.is_downloadable) {
        return res.status(403).json({ message: 'Bài hát không cho phép tải xuống' });
      }

      // Lấy file từ Dropbox
      const response = await axios({
        method: 'get',
        url: song.audio_file_url,
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
        },
      });

      // Đặt header để trình duyệt tải file
      res.setHeader('Content-Disposition', `attachment; filename="${song.song_id}_song.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      // Ghi lại thông tin tải xuống vào bảng DownloadHistory
      await DownloadHistory.create({
        user_id: userId,
        song_id: songId,
      });

      // Stream file về client
      response.data.pipe(res);
    } catch (error) {
      console.error('Error downloading song:', error);
      res.status(500).json({ message: 'Lỗi khi tải file audio', error: error.message });
    }
  },

  getDownloadHistory: async (req, res) => {
    try {
      const userId = req.user.user_id; // Lấy user_id từ req.user

      // Lấy danh sách lịch sử tải xuống của người dùng
      const downloadHistory = await DownloadHistory.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Song,
            as: 'Song',
            attributes: [
              'song_id',
              'title',
              'duration',
              'release_date',
              'audio_file_url',
              'img',
              'artist_id',
              'feat_artist_ids',
              'is_downloadable',
              'listen_count',
              'created_at',
            ],
            include: [
              {
                model: require('../models/Artist'),
                as: 'MainArtist',
                attributes: ['stage_name'],
              },
              {
                model: require('../models/Album'),
                as: 'Album',
                attributes: ['title'],
                required: false,
              },
            ],
          },
        ],
        order: [['downloaded_at', 'DESC']], // Sắp xếp theo thời gian tải gần nhất
      });

      // Xử lý danh sách bài hát
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const songs = await Promise.all(
        downloadHistory.map(async (history) => {
          const song = history.Song;
          let featArtists = [];
          if (song.feat_artist_ids) {
            try {
              const featIds = JSON.parse(song.feat_artist_ids);
              if (Array.isArray(featIds)) {
                const artists = await require('../models/Artist').findAll({
                  where: { artist_id: featIds },
                  attributes: ['artist_id', 'stage_name'],
                });
                featArtists = artists.map((artist) => ({
                  artist_id: artist.artist_id,
                  stage_name: artist.stage_name,
                }));
              }
            } catch (e) {
              console.error('Error parsing feat_artist_ids:', e.message);
            }
          }

          return {
            song_id: song.song_id,
            title: song.title,
            duration: song.duration,
            release_date: song.release_date,
            audio_file_url: song.audio_file_url,
            img: song.img ? `${baseUrl}${song.img}` : null,
            artist_id: song.artist_id,
            artist_name: song.MainArtist ? song.MainArtist.stage_name : null,
            feat_artists: featArtists,
            album_name: song.Album ? song.Album.title : null,
            is_downloadable: song.is_downloadable,
            created_at: song.created_at,
            listen_count: song.listen_count,
            downloaded_at: history.downloaded_at,
          };
        })
      );

      // Định dạng phản hồi
      res.json({
        message: 'Lấy danh sách lịch sử tải xuống thành công',
        download_history: {
          user_id: userId,
          total_downloads: downloadHistory.length,
          songs,
        },
      });
    } catch (error) {
      console.error('Error getting download history:', error);
      res.status(500).json({ message: 'Lỗi khi lấy lịch sử tải xuống', error: error.message });
    }
  },
};

module.exports = downloadController;