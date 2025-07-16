const { Song, Artist, Genre, ListenHistory, User, SongListenStats } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

exports.incrementSongListen = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id;

    if (!req.user) {
      console.log('Middleware isUser failed: req.user is undefined');
      return res.status(401).json({ status: 'error', message: 'Yêu cầu xác thực người dùng. Vui lòng đăng nhập lại.' });
    }

    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid song_id:', id);
      return res.status(400).json({ status: 'error', message: 'ID bài hát không hợp lệ' });
    }

    if (!user_id || isNaN(parseInt(user_id))) {
      console.log('Invalid or missing user_id:', user_id);
      return res.status(400).json({ status: 'error', message: 'ID người dùng không hợp lệ hoặc không được cung cấp' });
    }

    const song = await Song.findByPk(id);
    if (!song) {
      console.log('Song not found:', id);
      return res.status(404).json({ status: 'error', message: 'Bài hát không tồn tại' });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      console.log('User not found:', user_id);
      return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });
    }

    const now = new Date();
    const startOfWeek = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    startOfWeek.setUTCDate(now.getUTCDate() - (now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1));
    startOfWeek.setUTCHours(17, 0, 0, 0);

    console.log(`Processing listen for song_id: ${id}, user_id: ${user_id}, week_start: ${startOfWeek.toISOString()}`);

    await sequelize.transaction(async (t) => {
      await song.increment('listen_count', { by: 1, transaction: t });
      await song.reload({ transaction: t }); // Lấy listen_count mới nhất
      console.log(`Incremented listen_count for song ${id}: ${song.listen_count}`);

      // Lấy ranking hiện tại trước khi cập nhật
      const currentRanking = await SongListenStats.findAll({
        where: { period_start: startOfWeek },
        attributes: ['song_id', 'listen_count', 'current_rank'],
        order: [['listen_count', 'DESC'], ['song_id', 'ASC']],
        transaction: t
      });

      const currentRankMap = new Map();
      currentRanking.forEach((item, index) => {
        currentRankMap.set(item.song_id, index + 1);
      });

      console.log('Ranking before update:', Object.fromEntries(currentRankMap));

      const [stats, created] = await SongListenStats.findOrCreate({
        where: { song_id: parseInt(id), period_start: startOfWeek },
        defaults: {
          song_id: parseInt(id),
          period_start: startOfWeek,
          listen_count: 1,
          previous_rank: null,
          current_rank: null,
          created_at: now
        },
        transaction: t
      });

      if (!created) {
        await stats.update(
          {
            listen_count: stats.listen_count + 1,
            previous_rank: currentRankMap.get(parseInt(id)) || null
          },
          { transaction: t }
        );
        console.log(`Updated SongListenStats (song_id: ${id}, week_start: ${startOfWeek.toISOString()}): listen_count=${stats.listen_count + 1}, previous_rank=${currentRankMap.get(parseInt(id)) || 'null'}`);
      } else {
        console.log(`Created new SongListenStats record for song_id: ${id}, week_start: ${startOfWeek.toISOString()}`);
      }

      // Cập nhật current_rank và previous_rank cho tất cả bài hát
      const updatedRanking = await SongListenStats.findAll({
        where: { period_start: startOfWeek },
        attributes: ['song_id', 'listen_count', 'current_rank'],
        order: [['listen_count', 'DESC'], ['song_id', 'ASC']],
        transaction: t
      });

      const newRankMap = new Map();
      updatedRanking.forEach((item, index) => {
        newRankMap.set(item.song_id, index + 1);
      });

      for (const [songId, newRank] of newRankMap) {
        const currentStats = updatedRanking.find(item => item.song_id === songId);
        const oldRank = currentRankMap.get(songId) || null;
        await SongListenStats.update(
          {
            current_rank: newRank,
            previous_rank: oldRank !== null ? oldRank : currentStats?.previous_rank
          },
          { where: { song_id: songId, period_start: startOfWeek }, transaction: t }
        );
      }

      console.log('Ranking after update:', Object.fromEntries(newRankMap));

      const existingRecord = await ListenHistory.findOne({
        where: { user_id: parseInt(user_id), song_id: parseInt(id) },
        transaction: t
      });

      if (!existingRecord) {
        await ListenHistory.create({
          user_id: parseInt(user_id),
          song_id: parseInt(id),
          created_at: now
        }, { transaction: t });
        console.log('Added new record to ListenHistory:', { user_id, song_id: id });
      } else {
        console.log('Record already exists in ListenHistory:', { user_id, song_id: id });
      }
    });

    const updatedSong = await Song.findByPk(id, {
      include: [
        { model: Artist, as: 'MainArtist', attributes: ['artist_id', 'stage_name', 'profile_picture', 'popularity'] },
        { model: Genre, as: 'Genre', attributes: ['genre_id', 'name'] },
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
        'listen_count',
        'created_at',
      ],
    });

    const songData = updatedSong.toJSON();
    if (songData.feat_artist_ids) {
      try {
        const featIds = JSON.parse(songData.feat_artist_ids);
        const featArtists = await Artist.findAll({
          where: { artist_id: { [Op.in]: featIds } },
          attributes: ['artist_id', 'stage_name', 'profile_picture'],
        });
        songData.feat_artists = featArtists;
      } catch (error) {
        console.error('Error parsing feat_artist_ids:', error);
        songData.feat_artists = [];
      }
    } else {
      songData.feat_artists = [];
    }
    songData.artists = [songData.MainArtist, ...songData.feat_artists];
    delete songData.MainArtist;
    songData.genre = songData.Genre;
    delete songData.Genre;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    songData.audio_file_url = songData.audio_file_url || null;
    songData.img = songData.img ? `${baseUrl}${songData.img}` : null;

    res.status(200).json({
      status: 'success',
      message: 'Tăng lượt nghe và thêm vào lịch sử nghe thành công',
      song: songData,
    });
  } catch (error) {
    console.error('Error in incrementSongListen:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
      const errors = error.errors ? error.errors.map((err) => err.message) : [error.message];
      return res.status(400).json({ status: 'error', message: 'Lỗi validation', errors });
    }
    res.status(500).json({ status: 'error', message: 'Lỗi server: ' + error.message });
  }
};

module.exports = exports;