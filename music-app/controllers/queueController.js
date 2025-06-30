const { SongQueue, Song, Artist, User, SongQueueHistory, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.addSongToQueue = async (req, res) => {
  try {
    console.log('addSongToQueue - Request headers:', req.headers);
    console.log('addSongToQueue - Request body:', req.body);
    console.log('addSongToQueue - Request user:', req.user);

    const userId = req.user?.id;
    const { song_id, position } = req.body;

    if (!userId) {
      console.log('addSongToQueue - No user_id found');
      return res.status(401).json({ message: 'Không tìm thấy user_id. Vui lòng đăng nhập lại.' });
    }

    const song = await Song.findByPk(song_id, {
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['stage_name']
        }
      ]
    });
    if (!song) {
      console.log('addSongToQueue - Song not found:', song_id);
      return res.status(404).json({ message: 'Bài hát không tồn tại' });
    }

    console.log('addSongToQueue - Found song:', song_id, song.title);
    const queueCount = await SongQueue.count({ where: { user_id: userId } });
    const newPosition = position && position > 0 ? position : queueCount + 1;
    console.log('addSongToQueue - Queue count:', queueCount, 'New position:', newPosition);

    const existingItem = await SongQueue.findOne({
      where: { user_id: userId, position: newPosition }
    });
    if (existingItem) {
      console.log('addSongToQueue - Updating positions for existing item at:', newPosition);
      await SongQueue.update(
        { position: sequelize.literal('position + 1') },
        { where: { user_id: userId, position: { [Op.gte]: newPosition } } }
      );
    }

    const queueItem = await SongQueue.create({
      user_id: userId,
      song_id,
      position: newPosition,
      is_current: queueCount === 0
    });
    console.log('addSongToQueue - Created queue item:', queueItem.queue_id, 'for song:', song_id);

    let featArtists = [];
    if (song.feat_artist_ids) {
      const featArtistIds = JSON.parse(song.feat_artist_ids);
      if (Array.isArray(featArtistIds) && featArtistIds.length > 0) {
        const artists = await Artist.findAll({
          where: { artist_id: { [Op.in]: featArtistIds } },
          attributes: ['stage_name']
        });
        featArtists = artists.map(artist => artist.stage_name);
        console.log('addSongToQueue - Fetched feat artists:', featArtists);
      }
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('addSongToQueue - Base URL:', baseUrl);

    res.status(201).json({
      message: 'Đã thêm bài hát vào hàng đợi',
      queue_item: {
        queue_id: queueItem.queue_id,
        song_id: song.song_id,
        title: song.title,
        artist_name: song.MainArtist.stage_name,
        feat_artists: featArtists,
        img: song.img ? `${baseUrl}${song.img}` : 'https://example.com/default-song.jpg',
        audio_file_url: song.audio_file_url ? `${baseUrl}${song.audio_file_url}` : null,
        duration: song.duration,
        position: queueItem.position,
        is_current: queueItem.is_current,
        created_at: queueItem.created_at.toISOString()
      }
    });
  } catch (error) {
    console.error('addSongToQueue - Error:', error);
    res.status(500).json({ message: 'Không thể thêm bài hát vào hàng đợi', error: error.message });
  }
};

exports.getUserQueue = async (req, res) => {
  try {
    console.log('getUserQueue - Request headers:', req.headers);
    console.log('getUserQueue - Request user:', req.user);

    const userId = req.user?.id;
    if (!userId) {
      console.log('getUserQueue - No user_id found');
      return res.status(401).json({ message: 'Không tìm thấy user_id. Vui lòng đăng nhập lại.' });
    }

    const queueItems = await SongQueue.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'artist_id', 'feat_artist_ids'],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['stage_name']
            }
          ]
        }
      ],
      order: [['position', 'ASC']]
    });
    console.log('getUserQueue - Fetched queue items:', queueItems.map(item => ({ song_id: item.song_id, position: item.position, is_current: item.is_current })));

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('getUserQueue - Base URL:', baseUrl);

    const queue = await Promise.all(queueItems.map(async (item) => {
      let featArtists = [];
      if (item.Song.feat_artist_ids) {
        const featArtistIds = JSON.parse(item.Song.feat_artist_ids);
        if (Array.isArray(featArtistIds) && featArtistIds.length > 0) {
          const artists = await Artist.findAll({
            where: { artist_id: { [Op.in]: featArtistIds } },
            attributes: ['stage_name']
          });
          featArtists = artists.map(artist => artist.stage_name);
          console.log('getUserQueue - Fetched feat artists for song', item.Song.song_id, ':', featArtists);
        }
      }

      return {
        queue_id: item.queue_id,
        song_id: item.Song.song_id,
        title: item.Song.title,
        artist_name: item.Song.MainArtist.stage_name,
        feat_artists: featArtists,
        img: item.Song.img ? `${baseUrl}${item.Song.img}` : 'https://example.com/default-song.jpg',
        audio_file_url: item.Song.audio_file_url ? `${baseUrl}${item.Song.audio_file_url}` : null,
        duration: item.Song.duration,
        position: item.position,
        is_current: item.is_current,
        created_at: item.created_at.toISOString()
      };
    }));

    res.status(200).json({
      user_id: userId,
      queue
    });
  } catch (error) {
    console.error('getUserQueue - Error:', error);
    res.status(500).json({ message: 'Không thể tải danh sách chờ' });
  }
};

exports.removeSongFromQueue = async (req, res) => {
  try {
    console.log('removeSongFromQueue - Request headers:', req.headers);
    console.log('removeSongFromQueue - Request user:', req.user);
    console.log('removeSongFromQueue - Request params:', req.params);

    const userId = req.user?.id;
    const { song_id } = req.params;

    if (!userId) {
      console.log('removeSongFromQueue - No user_id found');
      return res.status(401).json({ message: 'Không tìm thấy user_id. Vui lòng đăng nhập lại.' });
    }

    const queueItem = await SongQueue.findOne({
      where: { user_id: userId, song_id }
    });
    if (!queueItem) {
      console.log('removeSongFromQueue - Song not found in queue:', song_id);
      return res.status(404).json({ message: 'Bài hát không có trong hàng đợi' });
    }

    console.log('removeSongFromQueue - Removing song:', song_id, 'at position:', queueItem.position);
    const isCurrent = queueItem.is_current;
    await queueItem.destroy();
    await SongQueue.update(
      { position: sequelize.literal('position - 1') },
      { where: { user_id: userId, position: { [Op.gt]: queueItem.position } } }
    );
    console.log('removeSongFromQueue - Updated positions after removal');

    if (isCurrent) {
      console.log('removeSongFromQueue - Removed current song, setting new current song');
      const nextQueueItem = await SongQueue.findOne({
        where: { user_id: userId },
        order: [['position', 'ASC']]
      });
      if (nextQueueItem) {
        console.log('removeSongFromQueue - Setting is_current: true for song:', nextQueueItem.song_id);
        await SongQueue.update(
          { is_current: true },
          { where: { user_id: userId, song_id: nextQueueItem.song_id } }
        );
      }
    }

    res.status(200).json({ message: 'Đã xóa bài hát khỏi hàng đợi' });
  } catch (error) {
    console.error('removeSongFromQueue - Error:', error);
    res.status(500).json({ message: 'Không thể xóa bài hát khỏi hàng đợi' });
  }
};

exports.updateCurrentSong = async (req, res) => {
  try {
    console.log('updateCurrentSong - Request headers:', req.headers);
    console.log('updateCurrentSong - Request body:', req.body);
    console.log('updateCurrentSong - Request user:', req.user);

    const userId = req.user?.id;
    const { song_id } = req.body;

    if (!userId) {
      console.log('updateCurrentSong - No user_id found');
      return res.status(401).json({ message: 'Không tìm thấy user_id. Vui lòng đăng nhập lại.' });
    }

    const queueItem = await SongQueue.findOne({
      where: { user_id: userId, song_id }
    });
    if (!queueItem) {
      console.log('updateCurrentSong - Song not found in queue:', song_id);
      return res.status(404).json({ message: 'Bài hát không có trong hàng đợi' });
    }

    console.log('updateCurrentSong - Setting is_current: false for all songs');
    await SongQueue.update(
      { is_current: false },
      { where: { user_id: userId } }
    );

    console.log('updateCurrentSong - Setting is_current: true for song:', song_id);
    await SongQueue.update(
      { is_current: true },
      { where: { user_id: userId, song_id } }
    );

    const updatedQueueItem = await SongQueue.findOne({
      where: { user_id: userId, song_id }
    });
    console.log('updateCurrentSong - Verified is_current:', updatedQueueItem.is_current);

    res.status(200).json({ message: 'Đã cập nhật bài hát hiện tại' });
  } catch (error) {
    console.error('updateCurrentSong - Error:', error);
    res.status(500).json({ message: 'Không thể cập nhật bài hát hiện tại', error: error.message });
  }
};

exports.nextSong = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    console.log('nextSong - Request headers:', req.headers);
    console.log('nextSong - Request user:', req.user);
    console.log('nextSong - Request body:', req.body);

    const userId = req.user?.id;
    if (!userId) {
      console.log('nextSong - No user_id found');
      await t.rollback();
      return res.status(401).json({ message: 'Không tìm thấy user_id. Vui lòng đăng nhập lại.' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('nextSong - Base URL:', baseUrl);

    // Log trạng thái hàng đợi trước khi xử lý
    const initialQueue = await SongQueue.findAll({
      where: { user_id: userId },
      order: [['position', 'ASC']],
      transaction: t
    });
    console.log('nextSong - Initial queue:', initialQueue.map(item => ({ song_id: item.song_id, position: item.position, is_current: item.is_current })));

    // Tìm bài hiện tại
    const currentQueueItem = await SongQueue.findOne({
      where: { user_id: userId, is_current: true },
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'artist_id', 'feat_artist_ids'],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['stage_name']
            }
          ]
        }
      ],
      transaction: t
    });
    console.log('nextSong - Current queue item:', currentQueueItem ? { song_id: currentQueueItem.song_id, title: currentQueueItem.Song?.title } : null);

    // Lưu bài hiện tại vào lịch sử (trừ khi fromEnded: true)
    const fromEnded = req.body.fromEnded === true;
    if (currentQueueItem && !fromEnded) {
      await SongQueueHistory.create(
        {
          user_id: userId,
          song_id: currentQueueItem.song_id
        },
        { transaction: t }
      );
      console.log('nextSong - Saved to history:', currentQueueItem.song_id);
    }

    // Xóa bài hiện tại khỏi hàng đợi
    let currentSongId = null;
    if (currentQueueItem) {
      currentSongId = currentQueueItem.song_id;
      console.log('nextSong - Removing current song from queue:', currentQueueItem.song_id);
      await currentQueueItem.destroy({ transaction: t });
      console.log('nextSong - Updating positions after removal');
      await SongQueue.update(
        { position: sequelize.literal('position - 1') },
        { where: { user_id: userId, position: { [Op.gt]: currentQueueItem.position } }, transaction: t }
      );
    }

    // Kiểm tra trạng thái hàng đợi sau khi xóa
    const queueAfterRemoval = await SongQueue.findAll({
      where: { user_id: userId },
      order: [['position', 'ASC']],
      transaction: t
    });
    console.log('nextSong - Queue after removal:', queueAfterRemoval.map(item => ({ song_id: item.song_id, position: item.position, is_current: item.is_current })));

    // Tìm bài tiếp theo
    const nextQueueItem = await SongQueue.findOne({
      where: { user_id: userId },
      order: [['position', 'ASC']],
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'artist_id', 'feat_artist_ids'],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['stage_name']
            }
          ]
        }
      ],
      transaction: t
    });
    console.log('nextSong - Next queue item:', nextQueueItem ? { song_id: nextQueueItem.song_id, title: nextQueueItem.Song?.title } : null);

    let nextSong = null;
    if (nextQueueItem) {
      // Kiểm tra để đảm bảo nextQueueItem không phải bài vừa xóa
      if (currentSongId && nextQueueItem.song_id === currentSongId) {
        console.log('nextSong - Error: Next queue item is the same as removed song:', currentSongId);
        await t.rollback();
        return res.status(500).json({ message: 'Lỗi: Bài tiếp theo trùng với bài vừa xóa' });
      }

      console.log('nextSong - Setting is_current: false for all songs');
      await SongQueue.update(
        { is_current: false },
        { where: { user_id: userId }, transaction: t }
      );
      console.log('nextSong - Setting is_current: true for song:', nextQueueItem.song_id);
      await SongQueue.update(
        { is_current: true },
        { where: { user_id: userId, song_id: nextQueueItem.song_id }, transaction: t }
      );

      // Kiểm tra trạng thái is_current
      const updatedQueueItem = await SongQueue.findOne({
        where: { user_id: userId, song_id: nextQueueItem.song_id },
        transaction: t
      });
      console.log('nextSong - Verified is_current:', updatedQueueItem ? updatedQueueItem.is_current : null);

      let featArtists = [];
      if (nextQueueItem.Song.feat_artist_ids) {
        const featArtistIds = JSON.parse(nextQueueItem.Song.feat_artist_ids);
        if (Array.isArray(featArtistIds) && featArtistIds.length > 0) {
          const artists = await Artist.findAll({
            where: { artist_id: { [Op.in]: featArtistIds } },
            attributes: ['stage_name'],
            transaction: t
          });
          featArtists = artists.map(artist => artist.stage_name);
          console.log('nextSong - Fetched feat artists for song', nextQueueItem.Song.song_id, ':', featArtists);
        }
      }

      nextSong = {
        song_id: nextQueueItem.Song.song_id,
        title: nextQueueItem.Song.title,
        duration: nextQueueItem.Song.duration,
        audio_file_url: nextQueueItem.Song.audio_file_url ? `${baseUrl}${nextQueueItem.Song.audio_file_url}` : null,
        img: nextQueueItem.Song.img ? `${baseUrl}${nextQueueItem.Song.img}` : 'https://example.com/default-song.jpg',
        artist_id: nextQueueItem.Song.artist_id || 0,
        artist_name: nextQueueItem.Song.MainArtist.stage_name,
        feat_artists: featArtists,
        album_name: null,
        position: nextQueueItem.position,
        is_current: true
      };
      console.log('nextSong - Prepared next song:', nextSong.song_id, nextSong.title);
    } else {
      console.log('nextSong - No next song found, returning empty queue');
    }

    // Lấy hàng đợi mới
    const queueItems = await SongQueue.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'artist_id', 'feat_artist_ids'],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['stage_name']
            }
          ]
        }
      ],
      order: [['position', 'ASC']],
      transaction: t
    });
    console.log('nextSong - Fetched queue items:', queueItems.map(item => ({ song_id: item.song_id, position: item.position, is_current: item.is_current })));

    const queue = await Promise.all(queueItems.map(async (item) => {
      let featArtists = [];
      if (item.Song.feat_artist_ids) {
        const featArtistIds = JSON.parse(item.Song.feat_artist_ids);
        if (Array.isArray(featArtistIds) && featArtistIds.length > 0) {
          const artists = await Artist.findAll({
            where: { artist_id: { [Op.in]: featArtistIds } },
            attributes: ['stage_name'],
            transaction: t
          });
          featArtists = artists.map(artist => artist.stage_name);
          console.log('nextSong - Fetched feat artists for queue item', item.Song.song_id, ':', featArtists);
        }
      }

      return {
        queue_id: item.queue_id,
        song_id: item.Song.song_id,
        title: item.Song.title,
        artist_name: item.Song.MainArtist.stage_name,
        feat_artists: featArtists,
        img: item.Song.img ? `${baseUrl}${item.Song.img}` : 'https://example.com/default-song.jpg',
        audio_file_url: item.Song.audio_file_url ? `${baseUrl}${item.Song.audio_file_url}` : null,
        duration: item.Song.duration,
        position: item.position,
        is_current: item.is_current,
        created_at: item.created_at.toISOString()
      };
    }));

    await t.commit();
    console.log('nextSong - Transaction committed, returning response');
    res.status(200).json({
      message: nextSong ? 'Đã chuyển sang bài tiếp theo' : 'Hàng đợi trống, không có bài hát để phát',
      currentSong: nextSong,
      queue
    });
  } catch (error) {
    console.error('nextSong - Error:', error);
    await t.rollback();
    res.status(500).json({ message: 'Không thể chuyển bài tiếp theo', error: error.message });
  }
};

exports.previousSong = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    console.log('previousSong - Request headers:', req.headers);
    console.log('previousSong - Request user:', req.user);

    const userId = req.user?.id;
    if (!userId) {
      console.log('previousSong - No user_id found');
      await t.rollback();
      return res.status(401).json({ message: 'Không tìm thấy user_id. Vui lòng đăng nhập lại.' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('previousSong - Base URL:', baseUrl);

    const historyItem = await SongQueueHistory.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'artist_id', 'feat_artist_ids'],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['stage_name']
            }
          ]
        }
      ],
      transaction: t
    });
    console.log('previousSong - History item:', historyItem ? { song_id: historyItem.song_id, title: historyItem.Song?.title } : null);

    if (!historyItem) {
      console.log('previousSong - No history item found');
      await t.rollback();
      return res.status(404).json({ message: 'Không có bài hát trước đó' });
    }

    console.log('previousSong - Updating positions for existing queue');
    const queueCount = await SongQueue.count({ where: { user_id: userId }, transaction: t });
    if (queueCount > 0) {
      await SongQueue.update(
        { position: sequelize.literal('position + 1') },
        { where: { user_id: userId }, transaction: t }
      );
    }

    console.log('previousSong - Creating queue item for song:', historyItem.song_id);
    const queueItem = await SongQueue.create(
      {
        user_id: userId,
        song_id: historyItem.song_id,
        position: 1,
        is_current: true
      },
      { transaction: t }
    );

    console.log('previousSong - Setting is_current: false for other songs');
    await SongQueue.update(
      { is_current: false },
      { where: { user_id: userId, song_id: { [Op.ne]: historyItem.song_id } }, transaction: t }
    );

    console.log('previousSong - Removing history item:', historyItem.song_id);
    await historyItem.destroy({ transaction: t });

    let featArtists = [];
    if (historyItem.Song.feat_artist_ids) {
      const featArtistIds = JSON.parse(historyItem.Song.feat_artist_ids);
      if (Array.isArray(featArtistIds) && featArtistIds.length > 0) {
        const artists = await Artist.findAll({
          where: { artist_id: { [Op.in]: featArtistIds } },
          attributes: ['stage_name'],
          transaction: t
        });
        featArtists = artists.map(artist => artist.stage_name);
        console.log('previousSong - Fetched feat artists for song', historyItem.Song.song_id, ':', featArtists);
      }
    }

    const previousSong = {
      song_id: historyItem.Song.song_id,
      title: historyItem.Song.title,
      duration: historyItem.Song.duration,
      audio_file_url: historyItem.Song.audio_file_url ? `${baseUrl}${historyItem.Song.audio_file_url}` : null,
      img: historyItem.Song.img ? `${baseUrl}${historyItem.Song.img}` : 'https://example.com/default-song.jpg',
      artist_id: historyItem.Song.artist_id || 0,
      artist_name: historyItem.Song.MainArtist.stage_name,
      feat_artists: featArtists,
      album_name: null,
      position: queueItem.position,
      is_current: queueItem.is_current
    };
    console.log('previousSong - Prepared previous song:', previousSong.song_id, previousSong.title);

    const queueItems = await SongQueue.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['song_id', 'title', 'duration', 'audio_file_url', 'img', 'artist_id', 'feat_artist_ids'],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['stage_name']
            }
          ]
        }
      ],
      order: [['position', 'ASC']],
      transaction: t
    });
    console.log('previousSong - Fetched queue items:', queueItems.map(item => ({ song_id: item.song_id, position: item.position, is_current: item.is_current })));

    const queue = await Promise.all(queueItems.map(async (item) => {
      let featArtists = [];
      if (item.Song.feat_artist_ids) {
        const featArtistIds = JSON.parse(item.Song.feat_artist_ids);
        if (Array.isArray(featArtistIds) && featArtistIds.length > 0) {
          const artists = await Artist.findAll({
            where: { artist_id: { [Op.in]: featArtistIds } },
            attributes: ['stage_name'],
            transaction: t
          });
          featArtists = artists.map(artist => artist.stage_name);
          console.log('previousSong - Fetched feat artists for queue item', item.Song.song_id, ':', featArtists);
        }
      }

      return {
        queue_id: item.queue_id,
        song_id: item.Song.song_id,
        title: item.Song.title,
        artist_name: item.Song.MainArtist.stage_name,
        feat_artists: featArtists,
        img: item.Song.img ? `${baseUrl}${item.Song.img}` : 'https://example.com/default-song.jpg',
        audio_file_url: item.Song.audio_file_url ? `${baseUrl}${item.Song.audio_file_url}` : null,
        duration: item.Song.duration,
        position: item.position,
        is_current: item.is_current,
        created_at: item.created_at.toISOString()
      };
    }));

    await t.commit();
    console.log('previousSong - Transaction committed, returning response');
    res.status(200).json({
      message: 'Đã chuyển về bài trước đó',
      currentSong: previousSong,
      queue
    });
  } catch (error) {
    console.error('previousSong - Error:', error);
    await t.rollback();
    res.status(500).json({ message: 'Không thể chuyển về bài trước đó', error: error.message });
  }
};