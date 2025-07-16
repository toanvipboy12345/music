const { Song, Artist, Genre, SongListenStats } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

exports.getWeeklyRanking = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    startOfWeek.setUTCDate(now.getUTCDate() - (now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1));
    startOfWeek.setUTCHours(17, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(16, 59, 59, 999);

    const previousWeekStart = new Date(startOfWeek);
    previousWeekStart.setUTCDate(startOfWeek.getUTCDate() - 7);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setUTCDate(previousWeekStart.getUTCDate() + 6);
    previousWeekEnd.setUTCHours(16, 59, 59, 999);

    console.log('Server time:', now.toISOString(), 'Timezone offset:', now.getTimezoneOffset());
    console.log('Current week:', startOfWeek.toISOString(), 'to', endOfWeek.toISOString());
    console.log('Previous week:', previousWeekStart.toISOString(), 'to', previousWeekEnd.toISOString());

    const currentRanking = await SongListenStats.findAll({
      where: {
        period_start: {
          [Op.between]: [startOfWeek, endOfWeek],
        },
      },
      attributes: ['song_id', 'listen_count', 'period_start', 'previous_rank', 'current_rank'],
      order: [['listen_count', 'DESC'], ['song_id', 'ASC']],
      limit: 30,
      include: [
        {
          model: Song,
          as: 'Song',
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
        },
      ],
    });

    // Log bảng xếp hạng hiện tại
    console.table(
      currentRanking.map((item, index) => ({
        Rank: index + 1,
        'Song ID': item.song_id,
        Title: item.Song ? item.Song.title : 'Unknown',
        'Listen Count': Number(item.getDataValue('listen_count')),
        'Previous Rank': item.getDataValue('previous_rank') || 'none',
        'Current Rank': item.getDataValue('current_rank') || 'none',
        'Period Start': item.getDataValue('period_start') instanceof Date 
          ? item.getDataValue('period_start').toISOString() 
          : item.getDataValue('period_start'),
      })),
      ['Rank', 'Song ID', 'Title', 'Listen Count', 'Previous Rank', 'Current Rank', 'Period Start']
    );

    const previousRanking = await SongListenStats.findAll({
      where: {
        period_start: {
          [Op.between]: [previousWeekStart, previousWeekEnd],
        },
      },
      attributes: ['song_id', 'listen_count', 'period_start'],
      order: [['listen_count', 'DESC'], ['song_id', 'ASC']],
      limit: 30,
    });

    // Log bảng xếp hạng tuần trước
    console.table(
      previousRanking.map((item, index) => ({
        Rank: index + 1,
        'Song ID': item.song_id,
        'Listen Count': Number(item.getDataValue('listen_count')),
        'Period Start': item.getDataValue('period_start') instanceof Date 
          ? item.getDataValue('period_start').toISOString() 
          : item.getDataValue('period_start'),
      })),
      ['Rank', 'Song ID', 'Listen Count', 'Period Start']
    );

    const previousRankMap = new Map();
    previousRanking.forEach((item, index) => {
      previousRankMap.set(item.song_id, index + 1);
    });

    console.log('Previous rank map:', Object.fromEntries(previousRankMap));

    if (currentRanking.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Chưa có dữ liệu bảng xếp hạng cho tuần hiện tại',
        data: {
          image: 'https://charts-images.scdn.co/assets_generated/locale_vi/regional/weekly/region_global_default.jpg',
          color: 'purple-700',
          description: 'Thông tin cập nhật hàng tuần về những bản nhạc được nghe nhiều nhất tại Toàn Cầu.',
          total_songs: 0,
          songs: [],
        },
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const rankingSummary = [];
    const rankingData = await Promise.all(
      currentRanking.map(async (item, index) => {
        if (!item.Song) {
          console.warn(`Song not found for song_id: ${item.song_id}`);
          return null;
        }
        const song = item.Song.toJSON();
        const currentRank = index + 1;

        let featArtists = [];
        if (song.feat_artist_ids) {
          try {
            const featIds = JSON.parse(song.feat_artist_ids);
            featArtists = await Artist.findAll({
              where: { artist_id: { [Op.in]: featIds } },
              attributes: ['artist_id', 'stage_name'],
            });
          } catch (error) {
            console.error(`Error parsing feat_artist_ids for song_id ${item.song_id}:`, error);
          }
        }

        // Tính rank_change
        let previousRank = item.previous_rank !== null ? item.previous_rank : previousRankMap.get(item.song_id);
        let rankChange;
        if (previousRank === undefined || previousRank === null) {
          rankChange = 'new';
        } else {
          const change = previousRank - currentRank;
          rankChange = change > 0 ? `+${change}` : change < 0 ? `${change}` : '0';
        }

        // Log chi tiết
        console.log(`Song ${item.song_id} (${song.title}): previousRank=${previousRank || 'none'}, currentRank=${currentRank}, rankChange=${rankChange}`);

        // Cập nhật current_rank nếu không khớp
        if (item.current_rank !== currentRank) {
          await SongListenStats.update(
            { current_rank: currentRank },
            { where: { song_id: item.song_id, period_start: startOfWeek } }
          );
          console.log(`Updated current_rank for song_id: ${item.song_id} to ${currentRank}`);
        }

        const songData = {
          song_id: song.song_id,
          title: song.title,
          duration: song.duration,
          release_date: song.release_date,
          audio_file_url: song.audio_file_url || null,
          img: song.img ? `${baseUrl}${song.img}` : null,
          artist_id: song.artist_id,
          artist_name: song.MainArtist ? song.MainArtist.stage_name : 'Unknown',
          feat_artists: featArtists.map(artist => ({
            artist_id: artist.artist_id,
            stage_name: artist.stage_name,
          })),
          album_name: null,
          is_downloadable: song.is_downloadable,
          created_at: song.created_at,
          listen_count: Number(item.getDataValue('listen_count')),
          rank: currentRank,
          rank_change: rankChange,
        };

        // Thêm vào summary để log bảng tổng hợp
        rankingSummary.push({
          Rank: currentRank,
          'Song ID': songData.song_id,
          Title: songData.title,
          'Listen Count': songData.listen_count,
          'Previous Rank': previousRank || 'none',
          'Current Rank': currentRank,
          'Rank Change': rankChange
        });

        console.log('Song data:', songData);

        return songData;
      })
    );

    // Log bảng tổng hợp
    console.table(rankingSummary, ['Rank', 'Song ID', 'Title', 'Listen Count', 'Previous Rank', 'Current Rank', 'Rank Change']);

    const filteredRankingData = rankingData.filter(item => item !== null);
    const totalSongs = filteredRankingData.length;

    const response = {
      status: 'success',
      message: 'Lấy bảng xếp hạng tuần thành công',
      data: {
        image: 'https://charts-images.scdn.co/assets_generated/locale_vi/regional/weekly/region_global_default.jpg',
        color: 'purple-700',
        description: 'Thông tin cập nhật hàng tuần về những bản nhạc được nghe nhiều nhất tại Toàn Cầu.',
        total_songs: totalSongs,
        songs: filteredRankingData,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getWeeklyRanking:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
      const errors = error.errors ? error.errors.map((err) => err.message) : [error.message];
      return res.status(400).json({ status: 'error', message: 'Lỗi validation', errors });
    }
    res.status(500).json({ status: 'error', message: 'Lỗi server: ' + error.message });
  }
};

module.exports = exports;