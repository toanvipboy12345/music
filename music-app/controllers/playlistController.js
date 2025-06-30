const { Op } = require('sequelize');
const { Playlist, User, Song, PlaylistSong, Artist, Album } = require('../models'); // Thêm Artist và Album
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const Busboy = require('busboy');
const { v4: uuidv4 } = require('uuid');

// Hàm phụ để xử lý URL
const formatUrl = (url, baseUrl) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${baseUrl}${url}`;
};

exports.getPlaylistByUserId = async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /playlists/user/:userId/:playlistId called with params:`, req.params);
  try {
    const { userId, playlistId } = req.params;

    // Validate userId và playlistId
    if (!Number.isInteger(parseInt(userId))) {
      console.log('Validation failed: Invalid userId', { userId });
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    if (!Number.isInteger(parseInt(playlistId))) {
      console.log('Validation failed: Invalid playlistId', { playlistId });
      return res.status(400).json({ message: 'ID playlist không hợp lệ' });
    }

    // Kiểm tra người dùng tồn tại
    const existingUser = await User.findByPk(userId);
    if (!existingUser) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: `Không tìm thấy người dùng với ID ${userId}` });
    }

    // Tìm playlist cụ thể
    const playlist = await Playlist.findOne({
      where: { user_id: userId, playlist_id: playlistId },
      include: [
        { model: User, as: 'User', attributes: ['username'] },
        {
          model: Song,
          as: 'Songs',
          through: { attributes: [] },
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
            'created_at'
          ],
          include: [
            { model: Artist, as: 'MainArtist', attributes: ['stage_name'] },
            { model: Album, as: 'Album', attributes: ['title'], required: false }
          ]
        }
      ]
    });

    if (!playlist) {
      console.log('Playlist not found:', { userId, playlistId });
      return res.status(404).json({ message: `Không tìm thấy playlist với ID ${playlistId} cho người dùng ${userId}` });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Xử lý danh sách bài hát
    const songs = await Promise.all(playlist.Songs.map(async (song) => {
      let featArtists = [];
      if (song.feat_artist_ids) {
        try {
          const featIds = JSON.parse(song.feat_artist_ids);
          if (Array.isArray(featIds)) {
            const artists = await Artist.findAll({
              where: { artist_id: featIds },
              attributes: ['stage_name']
            });
            featArtists = artists.map(artist => artist.stage_name);
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
        audio_file_url: formatUrl(song.audio_file_url, baseUrl),
        img: formatUrl(song.img, baseUrl),
        artist_id: song.artist_id,
        artist_name: song.MainArtist ? song.MainArtist.stage_name : null,
        feat_artists: featArtists,
        album_name: song.Album ? song.Album.title : null,
        is_downloadable: song.is_downloadable,
        created_at: song.created_at,
        listen_count: song.listen_count
      };
    }));

    // Định dạng phản hồi
    res.json({
      message: 'Lấy chi tiết playlist thành công',
      playlist: {
        playlist_id: playlist.playlist_id,
        title: playlist.title,
        img: formatUrl(playlist.img, baseUrl),
        description: playlist.description,
        user_id: playlist.user_id,
        username: playlist.User.username,
        song_count: playlist.Songs.length,
        songs,
        created_at: playlist.created_at
      }
    });
  } catch (error) {
    console.error('Get playlist by user error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
exports.getUserPlaylistsSummary = async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /playlists/user/:userId/summary called with params:`, req.params);
  try {
    const { userId } = req.params;
    if (!Number.isInteger(parseInt(userId))) {
      console.log('Validation failed:', { userId });
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }

    const existingUser = await User.findByPk(userId);
    if (!existingUser) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: `Không tìm thấy người dùng với ID ${userId}` });
    }

    const playlists = await Playlist.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    console.log('Playlists summary fetched:', playlists.length);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      message: 'Lấy danh sách tóm tắt playlist theo người dùng thành công',
      playlists: playlists.map(playlist => ({
        playlist_id: playlist.playlist_id, // Thêm playlist_id
        title: playlist.title,
        img: formatUrl(playlist.img, baseUrl),
        created_at: playlist.created_at,
        description: playlist.description
      }))
    });
  } catch (error) {
    console.error('Get user playlists summary error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.createPlaylist = async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /playlists called`);
  console.log('Headers:', req.headers);

  try {
    const uploadDir = path.join(__dirname, '../Uploads/playlist');
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir);
      await fsPromises.mkdir(uploadDir, { recursive: true });
    }

    const busboy = Busboy({ headers: req.headers });  
    let img_file = null;
    const fields = {};

    busboy.on('field', (name, value) => {
      fields[name] = value;
      console.log(`Field received: ${name}=${value}`);
    });

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      console.log('Received file:', { fieldname, filename, mimeType });
      if (fieldname === 'img_file') {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
          console.log('Invalid image file type:', mimeType);
          file.resume();
          return res.status(400).json({ message: 'Chỉ hỗ trợ file JPEG, PNG hoặc GIF' });
        }
        const fileExt = filename.split('.').pop();
        const newFileName = `${uuidv4()}.${fileExt}`;
        const savePath = path.join(uploadDir, newFileName);
        img_file = {
          path: savePath,
          url: `/uploads/playlist/${newFileName}`
        };
        console.log('Image file info:', img_file);
        const writeStream = fs.createWriteStream(savePath);
        file.pipe(writeStream);
        writeStream.on('finish', () => {
          console.log('File saved to:', savePath);
        });
        writeStream.on('error', (error) => {
          console.error('Error saving file:', error);
        });
      } else {
        file.resume();
      }
    });

    busboy.on('finish', async () => {
      try {
        console.log('Busboy finished, fields:', fields);
        console.log('Files:', { img_file });

        const { title, user_id, description } = fields;

        // Validation
        if (!title || typeof title !== 'string' || title.length < 1) {
          console.log('Validation failed:', { title });
          return res.status(400).json({ message: 'Tên playlist không hợp lệ' });
        }
        if (!Number.isInteger(parseInt(user_id))) {
          console.log('Validation failed:', { user_id });
          return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }

        const existingUser = await User.findByPk(user_id);
        if (!existingUser) {
          console.log('User not found:', user_id);
          return res.status(400).json({ message: 'Người dùng không tồn tại' });
        }

        // Tạo playlist
        const transaction = await sequelize.transaction();
        try {
          const playlist = await Playlist.create({
            title,
            user_id,
            img: img_file ? img_file.url : null,
            description: description || null
          }, { transaction });
          console.log('Playlist created:', playlist.toJSON());

          await transaction.commit();

          const baseUrl = `${req.protocol}://${req.get('host')}`;
          res.status(201).json({
            message: 'Tạo playlist thành công',
            playlist: {
              playlist_id: playlist.playlist_id,
              title: playlist.title,
              img: formatUrl(playlist.img, baseUrl),
              description: playlist.description,
              user_id: playlist.user_id,
              created_at: playlist.created_at
            }
          });
        } catch (error) {
          await transaction.rollback();
          console.error('Transaction error:', error.message);
          throw error;
        }
      } catch (error) {
        console.error('Error in busboy finish:', error.message);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
      }
    });

    req.pipe(busboy);
  } catch (error) {
    console.error('Error in createPlaylist:', error.message);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.addSongToPlaylist = async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /playlists/:playlistId/songs called with params:`, req.params);
  try {
    const { playlistId } = req.params;
    const { song_id } = req.body;

    if (!Number.isInteger(parseInt(playlistId)) || !Number.isInteger(parseInt(song_id))) {
      console.log('Validation failed:', { playlistId, song_id });
      return res.status(400).json({ message: 'ID playlist hoặc ID bài hát không hợp lệ' });
    }

    const playlist = await Playlist.findByPk(playlistId);
    if (!playlist) {
      console.log('Playlist not found:', playlistId);
      return res.status(404).json({ message: `Không tìm thấy playlist với ID ${playlistId}` });
    }

    const song = await Song.findByPk(song_id);
    if (!song) {
      console.log('Song not found:', song_id);
      return res.status(404).json({ message: `Không tìm thấy bài hát với ID ${song_id}` });
    }

    const existingRelation = await PlaylistSong.findOne({ where: { playlist_id: playlistId, song_id } });
    if (existingRelation) {
      console.log('Song already in playlist:', { playlistId, song_id });
      return res.status(400).json({ message: 'Bài hát đã tồn tại trong playlist' });
    }

    await PlaylistSong.create({ playlist_id: playlistId, song_id });
    console.log('Song added to playlist:', { playlistId, song_id });

    res.status(201).json({
      message: 'Thêm bài hát vào playlist thành công',
      playlist_id: playlistId,
      song_id: song_id
    });
  } catch (error) {
    console.error('Add song to playlist error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.deletePlaylist = async (req, res) => {
  console.log(`[${new Date().toISOString()}] DELETE /playlists/:playlistId called with params:`, req.params);
  try {
    const { playlistId } = req.params;
    const userId = req.user.user_id; // Giả sử middleware isUser thêm user_id vào req.user

    // Validate playlistId
    if (!Number.isInteger(parseInt(playlistId))) {
      console.log('Validation failed:', { playlistId });
      return res.status(400).json({ message: 'ID playlist không hợp lệ' });
    }

    // Tìm playlist
    const playlist = await Playlist.findByPk(playlistId);
    if (!playlist) {
      console.log('Playlist not found:', playlistId);
      return res.status(404).json({ message: `Không tìm thấy playlist với ID ${playlistId}` });
    }
    // Bắt đầu transaction
    const transaction = await sequelize.transaction();
    try {
      // Xóa các bản ghi liên quan trong PlaylistSong
      await PlaylistSong.destroy({
        where: { playlist_id: playlistId },
        transaction
      });
      console.log('Deleted PlaylistSong relations for playlist:', playlistId);

      // Xóa file ảnh nếu có
      if (playlist.img) {
         const imgPath = path.join(__dirname, '../Uploads/playlist', path.basename(playlist.img)); // Sửa đường dẫn
        console.log('Attempting to delete image file:', imgPath);
        try {
          if (fs.existsSync(imgPath)) {
            await fsPromises.unlink(imgPath);
            console.log('Deleted image file:', imgPath);
          } else {
            console.log('Image file not found:', imgPath);
          }
        } catch (fileError) {
          console.error('Error deleting image file:', fileError.message);
          // Không ném lỗi để transaction vẫn tiếp tục
        }
      }

      // Xóa playlist
      await playlist.destroy({ transaction });
      console.log('Playlist deleted:', playlistId);

      await transaction.commit();

      res.status(200).json({
        message: 'Xóa playlist thành công',
        playlist_id: playlistId
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Transaction error:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Delete playlist error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = exports;