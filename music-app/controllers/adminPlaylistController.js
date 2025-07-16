const { Op } = require('sequelize');
const { Playlist, User, Song, PlaylistSong, Artist, Album } = require('../models');
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const Busboy = require('busboy');
const { v4: uuidv4 } = require('uuid');
const isAdmin = require('../middleware/Admin');

// Hàm phụ để xử lý URL
const formatUrl = (url, baseUrl) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${baseUrl}${url}`;
};

exports.createAdminPlaylist = async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /v1/admin/playlists called`);
  console.log('Headers:', req.headers);

  // Áp dụng middleware isAdmin
  isAdmin(req, res, async () => {
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
            url: `/Uploads/playlist/${newFileName}`
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

          const { title, user_id, description, is_public, song_ids } = fields;

          // Validation
          if (!title || typeof title !== 'string' || title.length < 1 || title.length > 100) {
            console.log('Validation failed:', { title });
            return res.status(400).json({ message: 'Tên playlist không hợp lệ (phải từ 1 đến 100 ký tự)' });
          }
          if (!user_id || isNaN(parseInt(user_id))) {
            console.log('Validation failed:', { user_id });
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
          }
          if (song_ids) {
            try {
              const parsedSongIds = JSON.parse(song_ids);
              if (!Array.isArray(parsedSongIds) || parsedSongIds.length === 0 || !parsedSongIds.every(id => Number.isInteger(parseInt(id)))) {
                console.log('Validation failed:', { song_ids });
                return res.status(400).json({ message: 'Danh sách ID bài hát phải là mảng các số nguyên' });
              }
              fields.parsedSongIds = parsedSongIds;
            } catch (e) {
              console.error('Error parsing song_ids:', e.message);
              return res.status(400).json({ message: 'Danh sách ID bài hát không hợp lệ' });
            }
          }

          // Kiểm tra người dùng tồn tại
          const existingUser = await User.findByPk(user_id);
          if (!existingUser) {
            console.log('User not found:', user_id);
            return res.status(404).json({ message: `Không tìm thấy người dùng với ID ${user_id}` });
          }

          // Kiểm tra bài hát tồn tại
          let validSongIds = [];
          if (fields.parsedSongIds) {
            const songs = await Song.findAll({
              where: { song_id: fields.parsedSongIds }
            });
            validSongIds = songs.map(song => song.song_id);
            const invalidSongIds = fields.parsedSongIds.filter(id => !validSongIds.includes(id));
            if (invalidSongIds.length > 0) {
              console.log('Invalid song IDs:', invalidSongIds);
              return res.status(404).json({ message: `Không tìm thấy bài hát với ID: ${invalidSongIds.join(', ')}` });
            }
          }

          // Xử lý is_public
          const isPublicValue = is_public === undefined ? true : is_public === 'true' || is_public === true;

          // Tạo playlist và thêm bài hát trong transaction
          const transaction = await sequelize.transaction();
          try {
            const playlist = await Playlist.create({
              title,
              user_id,
              img: img_file ? img_file.url : null,
              description: description || null,
              is_public: isPublicValue,
              like_count: 0
            }, { transaction });
            console.log('Playlist created:', playlist.toJSON());

            // Thêm bài hát vào playlist
            if (validSongIds.length > 0) {
              const playlistSongData = validSongIds.map(song_id => ({
                playlist_id: playlist.playlist_id,
                song_id
              }));
              await PlaylistSong.bulkCreate(playlistSongData, { transaction });
              console.log('Songs added to playlist:', validSongIds);
            }

            await transaction.commit();

            // Lấy thông tin chi tiết playlist để trả về
            const createdPlaylist = await Playlist.findByPk(playlist.playlist_id, {
              include: [
                { model: User, as: 'User', attributes: ['username'] },
                {
                  model: Song,
                  as: 'Songs',
                  through: { attributes: [] },
                  attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'artist_id', 'is_downloadable'],
                  include: [
                    { model: Artist, as: 'MainArtist', attributes: ['stage_name'] }
                  ]
                }
              ]
            });

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const songs = createdPlaylist.Songs.map(song => ({
              song_id: song.song_id,
              title: song.title,
              duration: song.duration,
              audio_file_url: song.audio_file_url,
              img: formatUrl(song.img, baseUrl),
              artist_name: song.MainArtist ? song.MainArtist.stage_name : null,
              is_downloadable: song.is_downloadable
            }));

            res.status(201).json({
              message: 'Tạo playlist và thêm bài hát thành công',
              playlist: {
                playlist_id: createdPlaylist.playlist_id,
                title: createdPlaylist.title,
                img: formatUrl(createdPlaylist.img, baseUrl),
                description: createdPlaylist.description,
                user_id: createdPlaylist.user_id,
                username: createdPlaylist.User.username,
                song_count: createdPlaylist.Songs.length,
                is_public: createdPlaylist.is_public,
                like_count: createdPlaylist.like_count,
                songs,
                created_at: createdPlaylist.created_at
              }
            });
          } catch (error) {
            await transaction.rollback();
            console.error('Transaction error:', error.message);
            throw error;
          }
        } catch (error) {
          console.error('Error in busboy finish:', error.message);
          if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
            const errors = error.errors ? error.errors.map(err => err.message) : [error.message];
            return res.status(400).json({ message: 'Lỗi validation', errors });
          }
          res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
      });

      req.pipe(busboy);
    } catch (error) {
      console.error('Error in createAdminPlaylist:', error.message);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  });
};

// Phương thức lấy danh sách tóm tắt playlist của admin
exports.getAdminPlaylistsSummary = async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /v1/admin/playlists called`);
  console.log('Query params:', req.query);

  // Áp dụng middleware isAdmin
  isAdmin(req, res, async () => {
    try {
      // Lấy tham số phân trang và lọc từ query
      const { page = 1, limit = 10, search } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {
        [Op.and]: [
          { '$User.role$': 'admin' }
        ]
      };

      // Xây dựng điều kiện lọc
      if (search) {
        where.title = { [Op.like]: `%${search}%` };
      }

      // Truy vấn danh sách playlist của admin
      const playlists = await Playlist.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        include: [
          { model: User, as: 'User', attributes: ['user_id', 'username', 'full_name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      // Định dạng dữ liệu trả về
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const formattedPlaylists = playlists.rows.map(playlist => ({
        playlist_id: playlist.playlist_id,
        title: playlist.title,
        img: formatUrl(playlist.img, baseUrl),
        description: playlist.description,
        user_id: playlist.user_id,
        username: playlist.User ? playlist.User.username : null,
        full_name: playlist.User ? playlist.User.full_name : null,
        is_public: playlist.is_public,
        like_count: playlist.like_count,
        created_at: playlist.created_at
      }));

      res.status(200).json({
        message: 'Lấy danh sách tóm tắt playlist của admin thành công',
        total: playlists.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(playlists.count / parseInt(limit)),
        playlists: formattedPlaylists
      });
    } catch (error) {
      console.error('Error in getAdminPlaylistsSummary:', error.message);
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
        const errors = error.errors ? error.errors.map(err => err.message) : [error.message];
        return res.status(400).json({ message: 'Lỗi validation', errors });
      }
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  });
};

// Phương thức lấy chi tiết playlist của admin
exports.getAdminPlaylistById = async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /v1/admin/playlists/:playlistId called with params:`, req.params);

  // Áp dụng middleware isAdmin
  isAdmin(req, res, async () => {
    try {
      const { playlistId } = req.params;

      // Validate playlistId
      if (!Number.isInteger(parseInt(playlistId))) {
        console.log('Validation failed: Invalid playlistId', { playlistId });
        return res.status(400).json({ message: 'ID playlist không hợp lệ' });
      }

      // Tìm playlist cụ thể
      const playlist = await Playlist.findOne({
        where: { playlist_id: playlistId },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'username', 'full_name'],
            where: { role: 'admin' }, // Lọc người dùng có role admin
            required: true // Đảm bảo chỉ trả về playlist của admin
          },
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
              { model: Artist, as: 'MainArtist', attributes: ['artist_id', 'stage_name'] },
              { model: Album, as: 'Album', attributes: ['title'], required: false }
            ]
          }
        ]
      });

      if (!playlist) {
        console.log('Playlist not found or not owned by admin:', { playlistId });
        return res.status(404).json({ message: `Không tìm thấy playlist với ID ${playlistId} thuộc admin` });
      }

      // Định dạng dữ liệu trả về
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const songs = await Promise.all(playlist.Songs.map(async (song) => {
        let featArtists = [];
        if (song.feat_artist_ids) {
          try {
            const featIds = JSON.parse(song.feat_artist_ids);
            if (Array.isArray(featIds)) {
              const artists = await Artist.findAll({
                where: { artist_id: featIds },
                attributes: ['artist_id', 'stage_name']
              });
              featArtists = artists.map(artist => ({
                artist_id: artist.artist_id,
                stage_name: artist.stage_name
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
          audio_file_url: formatUrl(song.audio_file_url, baseUrl),
          img: formatUrl(song.img, baseUrl),
          artist_id: song.artist_id,
          artist_name: song.MainArtist ? song.MainArtist.stage_name : null,
          feat_artists: featArtists,
          album_name: song.Album ? song.Album.title : null,
          is_downloadable: song.is_downloadable,
          listen_count: song.listen_count,
          created_at: song.created_at
        };
      }));

      res.status(200).json({
        message: 'Lấy chi tiết playlist thành công',
        playlist: {
          playlist_id: playlist.playlist_id,
          title: playlist.title,
          img: formatUrl(playlist.img, baseUrl),
          description: playlist.description,
          user_id: playlist.user_id,
          username: playlist.User ? playlist.User.username : null,
          full_name: playlist.User ? playlist.User.full_name : null,
          song_count: playlist.Songs.length,
          is_public: playlist.is_public,
          like_count: playlist.like_count,
          created_at: playlist.created_at,
          songs
        }
      });
    } catch (error) {
      console.error('Error in getAdminPlaylistById:', error.message);
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
        const errors = error.errors ? error.errors.map(err => err.message) : [error.message];
        return res.status(400).json({ message: 'Lỗi validation', errors });
      }
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  });
};

module.exports = exports;