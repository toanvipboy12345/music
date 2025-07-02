const { Op } = require('sequelize');
const { Album, Artist, Song } = require('../models');
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const Busboy = require('busboy');
const { v4: uuidv4 } = require('uuid');

// Hàm phụ để xử lý URL
const formatUrl = (url, baseUrl) => {
  if (!url) return null;
  // Giữ nguyên URL nếu đã là http:// hoặc https://
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Thêm baseUrl nếu là đường dẫn tương đối
  return `${baseUrl}${url}`;
};

exports.createAlbum = async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /admin/albums called`);
  console.log('Headers:', req.headers);

  try {
    const uploadDir = path.join(__dirname, '../Uploads/album');
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
          url: `/uploads/album/${newFileName}`, // Lưu đường dẫn tương đối với /
          // Nếu model yêu cầu \\uploads\\album\\, dùng: url: `\\uploads\\album\\${newFileName}`
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

        const { title, release_date, artist, songs } = fields;

        // Validation
        if (!title || typeof title !== 'string' || title.length < 1) {
          console.log('Validation failed:', { title });
          return res.status(400).json({ message: 'Tên album không hợp lệ' });
        }

        // Tạo hoặc tìm ca sĩ
        let artistId;
        if (artist) {
          let parsedArtist;
          try {
            parsedArtist = JSON.parse(artist);
            console.log('Parsed artist:', parsedArtist);
          } catch (error) {
            console.log('Invalid artist format:', artist, 'Error:', error.message);
            return res.status(400).json({ message: 'Định dạng ca sĩ không hợp lệ' });
          }
          if (parsedArtist && parsedArtist.artist_id) {
            const existingArtist = await Artist.findByPk(parsedArtist.artist_id);
            if (!existingArtist) {
              console.log('Artist not found:', parsedArtist.artist_id);
              return res.status(400).json({ message: 'Ca sĩ không tồn tại' });
            }
            artistId = existingArtist.artist_id;
          } else {
            console.log('Invalid artist data:', parsedArtist);
            return res.status(400).json({ message: 'Thông tin ca sĩ không hợp lệ' });
          }
        } else {
          console.log('No artist provided');
          return res.status(400).json({ message: 'Phải cung cấp thông tin ca sĩ' });
        }

        // Xử lý bài hát
        let parsedSongs = [];
        if (songs) {
          try {
            parsedSongs = JSON.parse(songs);
            console.log('Parsed songs:', parsedSongs);
          } catch (error) {
            console.log('Invalid songs format:', songs, 'Error:', error.message);
            return res.status(400).json({ message: 'Định dạng danh sách bài hát không hợp lệ' });
          }
          if (Array.isArray(parsedSongs)) {
            const existingSongs = await Song.findAll({
              where: { song_id: parsedSongs.map(s => s.song_id) },
            });
            console.log('Found songs:', existingSongs.map(s => s.toJSON()));

            const foundSongIds = existingSongs.map(s => s.song_id);
            const invalidSongIds = parsedSongs.filter(s => !foundSongIds.includes(s.song_id));
            if (invalidSongIds.length > 0) {
              console.log('Invalid song IDs:', invalidSongIds);
              return res.status(400).json({ message: `Các bài hát với ID ${invalidSongIds.map(s => s.song_id).join(', ')} không tồn tại` });
            }
          }
        }

        // Log giá trị img trước khi tạo album
        console.log('Image URL before Album.create:', img_file ? img_file.url : null);

        // Tạo album
        const transaction = await sequelize.transaction();
        try {
          const album = await Album.create({
            title,
            release_date: release_date || null,
            img: img_file ? img_file.url : null,
            artist_id: artistId,
          }, { transaction });
          console.log('Album created:', album.toJSON());

          // Liên kết bài hát với album
          if (Array.isArray(parsedSongs) && parsedSongs.length > 0) {
            const existingSongs = await Song.findAll({
              where: { song_id: parsedSongs.map(s => s.song_id) },
              transaction,
            });
            await Promise.all(existingSongs.map(song => song.update({ album_id: album.album_id }, { transaction })));
            console.log('Songs linked to album:', album.album_id);
          }

          // Lấy album với dữ liệu đầy đủ
          const createdAlbum = await Album.findByPk(album.album_id, {
            include: [
              { model: Artist, as: 'MainArtist', attributes: ['stage_name', 'profile_picture'] },
              { model: Song, as: 'Songs', attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'is_downloadable'] },
            ],
            transaction,
          });
          console.log('Created album with includes:', createdAlbum.toJSON());

          await transaction.commit();

          // Tạo URL đầy đủ khi trả về
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          res.status(201).json({
            message: 'Tạo album thành công',
            album: {
              album_id: createdAlbum.album_id,
              title: createdAlbum.title,
              release_date: createdAlbum.release_date,
              img: formatUrl(createdAlbum.img, baseUrl),
              artist_id: createdAlbum.artist_id,
              artist: {
                stage_name: createdAlbum.MainArtist.stage_name,
                profile_picture: formatUrl(createdAlbum.MainArtist.profile_picture, baseUrl),
              },
              songs: createdAlbum.Songs.map(song => ({
                ...song.toJSON(),
                audio_file_url: formatUrl(song.audio_file_url, baseUrl),
                img: formatUrl(song.img, baseUrl),
              })),
            },
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
    console.error('Error in createAlbum:', error.message);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getAllAlbums = async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/albums called with query:`, req.query);
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const where = search ? { title: { [Op.like]: `%${search}%` } } : {};
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const albums = await Album.findAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Artist, as: 'MainArtist', attributes: ['stage_name', 'profile_picture'] },
        { model: Song, as: 'Songs', attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'is_downloadable'] },
      ],
    });
    console.log('Albums fetched:', albums.length, 'Total:', await Album.count({ where }));

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      message: 'Lấy danh sách album thành công',
      albums: albums.map(album => ({
        album_id: album.album_id,
        title: album.title,
        release_date: album.release_date,
        img: formatUrl(album.img, baseUrl),
        artist_id: album.artist_id,
        artist_name: album.MainArtist.stage_name,
        artist_profile_picture: formatUrl(album.MainArtist.profile_picture, baseUrl),
        song_count: album.Songs.length,
        songs: album.Songs.map(song => ({
          ...song.toJSON(),
          audio_file_url: formatUrl(song.audio_file_url, baseUrl),
          img: formatUrl(song.img, baseUrl),
        })),
        created_at: album.created_at,
      })),
      total: await Album.count({ where }),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get all albums error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getAlbumsByArtist = async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/albums/artist/:artistId called with params:`, req.params);
  try {
    const { artistId } = req.params;
    if (!Number.isInteger(parseInt(artistId))) {
      console.log('Validation failed:', { artistId });
      return res.status(400).json({ message: 'ID ca sĩ không hợp lệ' });
    }

    const existingArtist = await Artist.findByPk(artistId);
    if (!existingArtist) {
      console.log('Artist not found:', artistId);
      return res.status(404).json({ message: `Không tìm thấy ca sĩ với ID ${artistId}` });
    }

    const albums = await Album.findAll({
      where: { artist_id: artistId },
      order: [['created_at', 'DESC']],
      include: [
        { model: Artist, as: 'MainArtist', attributes: ['stage_name', 'profile_picture'] },
        { model: Song, as: 'Songs', attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'is_downloadable'] },
      ],
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      message: 'Lấy danh sách album theo ca sĩ thành công',
      albums: albums.map(album => ({
        album_id: album.album_id,
        title: album.title,
        release_date: album.release_date,
        img: formatUrl(album.img, baseUrl),
        artist_id: album.artist_id,
        artist_name: album.MainArtist.stage_name,
        artist_profile_picture: formatUrl(album.MainArtist.profile_picture, baseUrl),
        song_count: album.Songs.length,
        songs: album.Songs.map(song => ({
          ...song.toJSON(),
          audio_file_url: formatUrl(song.audio_file_url, baseUrl),
          img: formatUrl(song.img, baseUrl),
        })),
        created_at: album.created_at,
      })),
    });
  } catch (error) {
    console.error('Get albums by artist error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
exports.getAlbumById = async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /albums/:albumId called with params:`, req.params);
  try {
    const { albumId } = req.params;
    if (!Number.isInteger(parseInt(albumId))) {
      console.log('Validation failed:', { albumId });
      return res.status(400).json({ status: 'error', message: 'ID album không hợp lệ' });
    }

    const album = await Album.findByPk(albumId, {
      include: [
        { model: Artist, as: 'MainArtist', attributes: ['stage_name', 'profile_picture'] },
        {
          model: Song,
          as: 'Songs',
          attributes: [
            'song_id',
            'title',
            'duration',
            'release_date',
            'audio_file_url',
            'img',
            'artist_id',
            'feat_artist_ids',
 "album_id",
            'is_downloadable',
            'created_at',
            'listen_count'
          ],
          include: [
            {
              model: Album,
              as: 'Album',
              attributes: ['title'],
              required: false
            }
          ]
        }
      ],
    });

    if (!album) {
      console.log('Album not found:', albumId);
      return res.status(404).json({ status: 'error', message: `Không tìm thấy album với ID ${albumId}` });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Xử lý danh sách bài hát để thêm thông tin ca sĩ feat, artist_name và album_name
    const songsWithFeats = await Promise.all(
      album.Songs.map(async (song) => {
        let featArtists = [];
        if (song.feat_artist_ids) {
          try {
            const featIds = JSON.parse(song.feat_artist_ids);
            if (Array.isArray(featIds) && featIds.length > 0) {
              const artists = await Artist.findAll({
                where: { artist_id: { [Op.in]: featIds } },
                attributes: ['stage_name']
              });
              featArtists = artists.map(artist => artist.stage_name);
            }
          } catch (e) {
            console.error(`Lỗi khi parse feat_artist_ids cho bài hát ${song.song_id}:`, e.message);
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
          artist_name: album.MainArtist.stage_name,
          feat_artists: featArtists,
          album_name: song.Album ? song.Album.title : null,
          is_downloadable: song.is_downloadable,
          created_at: song.created_at,
          listen_count: song.listen_count
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        album: {
          album_id: album.album_id,
          title: album.title,
          release_date: album.release_date,
          img: formatUrl(album.img, baseUrl),
          artist_id: album.artist_id,
          artist_name: album.MainArtist.stage_name,
          artist_profile_picture: formatUrl(album.MainArtist.profile_picture, baseUrl),
          song_count: album.Songs.length,
          songs: songsWithFeats,
          created_at: album.created_at,
        }
      }
    });
  } catch (error) {
    console.error('Get album by ID error:', error.message, error.stack);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
module.exports = exports;