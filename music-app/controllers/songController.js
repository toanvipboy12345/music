const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { Op } = require('sequelize');
const { Artist, Song, Genre } = require('../models'); // Nhập từ models/index.js
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');

exports.createSong = async (req, res) => {
  try {
    console.log('Starting createSong, headers:', req.headers); // Debug: Log headers
    const uploadDir = path.join(__dirname, '../uploads/songs');
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir); // Debug: Log directory creation
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const busboy = Busboy({ headers: req.headers });
    let audio_file = null;
    let img_file = null;
    const fields = {};

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      console.log('Received file:', { fieldname, filename, mimeType }); // Debug: Log file info
      const fileExt = filename.split('.').pop();
      const newFileName = `${uuidv4()}.${fileExt}`;
      const savePath = path.join(uploadDir, newFileName);

      if (fieldname === 'audio_file') {
        if (!['audio/mpeg', 'audio/wav'].includes(mimeType)) {
          console.log('Invalid audio file type:', mimeType); // Debug: Log invalid mimeType
          file.resume();
          return res.status(400).json({ message: 'Chỉ hỗ trợ file MP3 hoặc WAV' });
        }
        audio_file = {
          path: savePath,
          url: `http://localhost:3000/uploads/songs/${newFileName}`,
        };
        console.log('Audio file info:', audio_file); // Debug: Log audio file details
      } else if (fieldname === 'img_file') {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
          console.log('Invalid image file type:', mimeType); // Debug: Log invalid mimeType
          file.resume();
          return res.status(400).json({ message: 'Chỉ hỗ trợ file JPEG, PNG hoặc GIF' });
        }
        img_file = {
          path: savePath,
          url: `http://localhost:3000/uploads/songs/${newFileName}`,
        };
        console.log('Image file info:', img_file); // Debug: Log image file details
      }

      if (audio_file || img_file) {
        const writeStream = fs.createWriteStream(savePath);
        file.pipe(writeStream);
        writeStream.on('finish', () => {
          console.log('File saved to:', savePath); // Debug: Log file save completion
        });
        writeStream.on('error', (error) => {
          console.error('Error saving file:', error); // Debug: Log file save error
        });
      } else {
        file.resume();
      }
    });

    busboy.on('finish', async () => {
      try {
        console.log('Busboy finished, fields:', fields); // Debug: Log all fields
        console.log('Files:', { audio_file, img_file }); // Debug: Log file objects

        const { title, duration, release_date, artist_names, genre_id, is_downloadable } = fields;

        let parsed_artist_names;
        try {
          parsed_artist_names = JSON.parse(artist_names);
          console.log('Parsed artist_names:', parsed_artist_names); // Debug: Log parsed artist names
        } catch (e) {
          console.error('Error parsing artist_names:', e); // Debug: Log parsing error
          return res.status(400).json({ message: 'Danh sách ca sĩ không hợp lệ' });
        }

        if (!audio_file) {
          console.log('No audio file uploaded'); // Debug: Log missing audio file
          return res.status(400).json({ message: 'Chưa upload file audio' });
        }
        if (!title || typeof title !== 'string' || title.length < 1 || title.length > 100) {
          console.log('Invalid title:', title); // Debug: Log invalid title
          return res.status(400).json({ message: 'Tiêu đề bài hát không hợp lệ' });
        }
        if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
          console.log('Invalid duration:', duration); // Debug: Log invalid duration
          return res.status(400).json({ message: 'Thời lượng bài hát không hợp lệ' });
        }
        if (release_date && !/^\d{4}-\d{2}-\d{2}$/.test(release_date)) {
          console.log('Invalid release_date:', release_date); // Debug: Log invalid release date
          return res.status(400).json({ message: 'Ngày phát hành không hợp lệ' });
        }
        if (!parsed_artist_names || !Array.isArray(parsed_artist_names) || parsed_artist_names.length === 0) {
          console.log('Invalid artist_names:', parsed_artist_names); // Debug: Log invalid artist names
          return res.status(400).json({ message: 'Phải cung cấp ít nhất một ca sĩ' });
        }
        if (!genre_id || isNaN(parseInt(genre_id))) {
          console.log('Invalid genre_id:', genre_id); // Debug: Log invalid genre_id
          return res.status(400).json({ message: 'Phải cung cấp một thể loại hợp lệ' });
        }
        if (is_downloadable && !['true', 'false'].includes(is_downloadable)) {
          console.log('Invalid is_downloadable:', is_downloadable); // Debug: Log invalid is_downloadable
          return res.status(400).json({ message: 'Giá trị is_downloadable không hợp lệ' });
        }

        const artistIds = [];
        for (const artist_name of parsed_artist_names) {
          const artist = await Artist.findOne({ where: { stage_name: artist_name } });
          console.log(`Artist lookup for ${artist_name}:`, artist ? artist.toJSON() : null); // Debug: Log artist lookup
          if (!artist) {
            return res.status(400).json({ message: `Ca sĩ ${artist_name} không tồn tại` });
          }
          artistIds.push(artist.artist_id);
        }

        const genre = await Genre.findByPk(genre_id);
        console.log('Genre lookup for genre_id:', genre_id, genre ? genre.toJSON() : null); // Debug: Log genre lookup
        if (!genre) {
          return res.status(400).json({ message: 'Thể loại không tồn tại' });
        }

        const audio_file_url = audio_file.url;
        console.log('Checking audio_file_url:', audio_file_url); // Debug: Log audio URL
        // Kiểm tra thủ công cho audio_file_url
        if (!audio_file_url || typeof audio_file_url !== 'string' || !audio_file_url.startsWith('http://localhost:3000/uploads/songs/')) {
          console.log('Audio URL validation failed:', audio_file_url); // Debug: Log failed validation
          return res.status(400).json({ message: 'URL file audio không hợp lệ' });
        }
        let img_url = null;
        if (img_file) {
          img_url = img_file.url;
          console.log('Checking img_url:', img_url); // Debug: Log image URL
          // Kiểm tra thủ công cho img_url
          if (!img_url || typeof img_url !== 'string' || !img_url.startsWith('http://localhost:3000/uploads/songs/')) {
            console.log('Image URL validation failed:', img_url); // Debug: Log failed validation
            return res.status(400).json({ message: 'URL file ảnh không hợp lệ' });
          }
        }

        console.log('Creating song with data:', { // Debug: Log data before creating song
          title,
          duration: parseInt(duration),
          release_date: release_date || null,
          audio_file_url,
          img: img_file ? img_file.url : null,
          artist_id: artistIds[0],
          feat_artist_ids: artistIds.length > 1 ? JSON.stringify(artistIds.slice(1)) : null,
          genre_id: parseInt(genre_id),
          is_downloadable: is_downloadable === 'true',
        });

        const song = await Song.create({
          title,
          duration: parseInt(duration),
          release_date: release_date || null,
          audio_file_url: audio_file.url,
          img: img_file ? img_file.url : null,
          artist_id: artistIds[0],
          feat_artist_ids: artistIds.length > 1 ? JSON.stringify(artistIds.slice(1)) : null,
          genre_id: parseInt(genre_id),
          is_downloadable: is_downloadable === 'true',
        });

        console.log('Song created:', song.toJSON()); // Debug: Log created song

        res.status(201).json({
          message: 'Thêm bài hát thành công',
          song: {
            song_id: song.song_id,
            title,
            duration: song.duration,
            release_date: song.release_date,
            audio_file_url: song.audio_file_url,
            img: song.img,
            artist_id: song.artist_id,
            feat_artist_ids: song.feat_artist_ids ? JSON.parse(song.feat_artist_ids) : [],
            genre_id: song.genre_id,
            is_downloadable: song.is_downloadable,
          },
        });
      } catch (error) {
        console.error('Error in busboy finish:', error); // Debug: Log error details
        if (error.name === 'SequelizeValidationError') {
          const errors = error.errors.map((err) => err.message);
          return res.status(400).json({ message: 'Lỗi validation', errors });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
      }
    });

    req.pipe(busboy);
  } catch (error) {
    console.error('Error in createSong:', error); // Debug: Log outer error
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getSong = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    const song = await Song.findByPk(id, {
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['artist_id', 'stage_name', 'profile_picture', 'popularity'],
        },
        {
          model: Genre,
          as: 'Genre',
          attributes: ['genre_id', 'name'],
        },
      ],
      attributes: [
        'song_id',
        'title',
        'duration',
        'release_date',
        'audio_file_url',
        'img',
        'artist_id',
        'feat_artist_ids',
        'genre_id',
        'is_downloadable',
        'created_at',
      ],
    });

    if (!song) {
      return res.status(404).json({ message: 'Bài hát không tồn tại' });
    }

    const songData = song.toJSON();
    if (songData.feat_artist_ids) {
      const featIds = JSON.parse(songData.feat_artist_ids);
      const featArtists = await Artist.findAll({
        where: { artist_id: featIds },
        attributes: ['artist_id', 'stage_name', 'profile_picture'],
      });
      songData.feat_artists = featArtists;
    } else {
      songData.feat_artists = [];
    }
    songData.artists = [songData.MainArtist, ...songData.feat_artists];
    delete songData.MainArtist;
    songData.genre = songData.Genre;
    delete songData.Genre;

    res.json({
      message: 'Lấy thông tin bài hát thành công',
      song: songData,
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map((err) => err.message);
      return res.status(400).json({ message: 'Lỗi validation', errors });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getAllSongs = async (req, res) => {
  try {
    console.log('Fetching songs with query:', req.query);
    const { page = 1, limit = 10, search = '' } = req.query;

    const whereSong = {};
    if (search) {
      whereSong.title = { [Op.like]: `%${search}%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const songs = await Song.findAll({
      where: whereSong,
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['artist_id', 'stage_name', 'profile_picture', 'popularity'],
        },
        {
          model: Genre,
          as: 'Genre',
          attributes: ['genre_id', 'name'],
        },
      ],
      attributes: [
        'song_id',
        'title',
        'duration',
        'release_date',
        'audio_file_url',
        'img',
        'artist_id',
        'feat_artist_ids',
        'genre_id',
        'is_downloadable',
        'created_at',
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    console.log('Songs fetched:', songs.length);
    const total = await Song.count({ where: whereSong });

    const processedSongs = await Promise.all(
      songs.map(async (song) => {
        const songData = song.toJSON();
        if (songData.feat_artist_ids) {
          const featIds = JSON.parse(songData.feat_artist_ids);
          const featArtists = await Artist.findAll({
            where: { artist_id: featIds },
            attributes: ['artist_id', 'stage_name', 'profile_picture'],
          });
          songData.artists = [songData.MainArtist, ...featArtists];
        } else {
          songData.artists = [songData.MainArtist];
        }
        delete songData.MainArtist;
        songData.genre = songData.Genre;
        delete songData.Genre;
        return songData;
      })
    );

    res.json({
      message: 'Lấy danh sách bài hát thành công',
      songs: processedSongs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error in getAllSongs:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};