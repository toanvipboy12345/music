const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { Op } = require('sequelize');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const Genre = require('../models/Genre');

exports.createSong = async (req, res) => {
  try {
    const { title, duration, release_date, artist_names, genre_id, is_downloadable } = req.body;
    const audio_file = req.file;

    // Validate input
    if (!audio_file) {
      return res.status(400).json({ message: 'Chưa upload file audio' });
    }
    if (!title || typeof title !== 'string' || title.length < 1 || title.length > 100) {
      return res.status(400).json({ message: 'Tiêu đề bài hát không hợp lệ' });
    }
    if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      return res.status(400).json({ message: 'Thời lượng bài hát không hợp lệ' });
    }
    if (release_date && !/^\d{4}-\d{2}-\d{2}$/.test(release_date)) {
      return res.status(400).json({ message: 'Ngày phát hành không hợp lệ' });
    }
    if (!artist_names || !Array.isArray(artist_names) || artist_names.length === 0) {
      return res.status(400).json({ message: 'Phải cung cấp ít nhất một ca sĩ' });
    }
    if (!genre_id || isNaN(parseInt(genre_id))) {
      return res.status(400).json({ message: 'Phải cung cấp một thể loại hợp lệ' });
    }
    if (is_downloadable && !['true', 'false'].includes(is_downloadable.toString())) {
      return res.status(400).json({ message: 'Giá trị is_downloadable không hợp lệ' });
    }

    // Process artists
    const artistIds = [];
    for (const artist_name of artist_names) {
      const artist = await Artist.findOne({ where: { stage_name: artist_name } });
      if (!artist) {
        return res.status(400).json({ message: `Ca sĩ ${artist_name} không tồn tại` });
      }
      artistIds.push(artist.artist_id);
    }

    // Validate genre
    const genre = await Genre.findByPk(genre_id);
    if (!genre) {
      return res.status(400).json({ message: 'Thể loại không tồn tại' });
    }

    // Generate file URL
    const fileExt = audio_file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const audio_file_url = `${process.env.BASE_URL}/uploads/songs/${fileName}`;
    if (!validator.isURL(audio_file_url)) {
      return res.status(400).json({ message: 'URL file audio không hợp lệ' });
    }

    // Create song
    const song = await Song.create({
      title,
      duration: parseInt(duration),
      release_date: release_date || null,
      audio_file_url,
      artist_id: artistIds[0],
      feat_artist_ids: artistIds.length > 1 ? JSON.stringify(artistIds.slice(1)) : null,
      genre_id: parseInt(genre_id),
      is_downloadable: is_downloadable === 'true',
    });

    res.status(201).json({
      message: 'Thêm bài hát thành công',
      song: {
        song_id: song.song_id,
        title,
        duration: song.duration,
        release_date: song.release_date,
        audio_file_url,
        artist_id: song.artist_id,
        feat_artist_ids: song.feat_artist_ids ? JSON.parse(song.feat_artist_ids) : [],
        genre_id: song.genre_id,
        is_downloadable: song.is_downloadable,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({ message: 'Lỗi validation', errors });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getSong = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate song_id
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    // Find song with associations
    const song = await Song.findByPk(id, {
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['artist_id', 'stage_name', 'profile_picture', 'popularity'],
        },
        {
          model: Genre,
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

    // Process feat_artist_ids
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

    res.json({
      message: 'Lấy thông tin bài hát thành công',
      song: songData,
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({ message: 'Lỗi validation', errors });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getAllSongs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '', // Tìm kiếm theo tiêu đề bài hát
    } = req.query;

    // Xây dựng điều kiện lọc
    const whereSong = {};
    if (search) {
      whereSong.title = { [Op.like]: `%${search}%` };
    }

    // Phân trang
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Tìm bài hát với các quan hệ
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

    // Đếm tổng số bài hát
    const total = await Song.count({
      where: whereSong,
    });

    // Xử lý feat_artist_ids để lấy thông tin ca sĩ hợp tác
    const processedSongs = await Promise.all(
      songs.map(async (song) => {
        const songData = song.toJSON();
        if (songData.feat_artist_ids) {
          const featIds = JSON.parse(songData.feat_artist_ids);
          const featArtists = await Artist.findAll({
            where: { artist_id: featIds },
            attributes: ['artist_id', 'stage_name', 'profile_picture'],
          });
          songData.artists = [
            songData.MainArtist,
            ...featArtists,
          ];
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
    console.error(error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};