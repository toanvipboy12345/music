const { Queue, Song, Artist, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getUserQueue = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    console.log('Fetching queue for userId:', userId);
    const queue = await Queue.findAll({
      where: { user_id: userId },
      order: [['position', 'ASC']],
    });

    // Lấy danh sách tên ca sĩ feat
    const formattedQueue = await Promise.all(queue.map(async (item) => {
      let featArtists = [];
      if (item.feat_artists && item.feat_artists.length > 0) {
        const featArtistIds = Array.isArray(item.feat_artists) ? item.feat_artists : JSON.parse(item.feat_artists);
        const artists = await Artist.findAll({
          where: { artist_id: featArtistIds },
          attributes: ['stage_name'],
        });
        featArtists = artists.map(artist => artist.stage_name);
      }

      return {
        ...item.toJSON(),
        audio_file_url: item.audio_file_url ? `${baseUrl}${item.audio_file_url}` : null,
        img: item.img ? `${baseUrl}${item.img}` : null,
        feat_artists: featArtists,
      };
    }));

    res.status(200).json({ queue: formattedQueue });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ message: 'Không thể tải danh sách chờ' });
  }
};

exports.addSongToQueue = async (req, res) => {
  const { song_id, playImmediately = false } = req.body;
  const userId = req.user.user_id;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  if (!song_id) {
    return res.status(400).json({ message: 'Yêu cầu song_id' });
  }

  try {
    console.log('Adding song to queue:', { song_id, userId, playImmediately });
    const song = await Song.findByPk(song_id);
    if (!song) {
      return res.status(404).json({ message: 'Không tìm thấy bài hát' });
    }

    let featArtists = [];
    if (song.feat_artist_ids) {
      const featArtistIds = Array.isArray(song.feat_artist_ids) ? song.feat_artist_ids : JSON.parse(song.feat_artist_ids);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['stage_name'],
      });
      featArtists = artists.map(artist => artist.stage_name);
    }

    const transaction = await sequelize.transaction();

    try {
      const existingQueueItem = await Queue.findOne({
        where: { user_id: userId, song_id },
        transaction,
      });

      if (existingQueueItem && playImmediately) {
        console.log('Song already in queue, updating is_current and position:', song_id);
        await Queue.update(
          { is_current: false },
          { where: { user_id: userId }, transaction }
        );

        const currentSong = await Queue.findOne({
          where: { user_id: userId, is_current: true },
          transaction,
        });

        const newPosition = currentSong ? currentSong.position : 1;

        const queueItems = await Queue.findAll({
          where: { user_id: userId, position: { [Op.gte]: newPosition } },
          order: [['position', 'ASC']],
          transaction,
        });

        for (let i = queueItems.length - 1; i >= 0; i--) {
          await queueItems[i].update({ position: queueItems[i].position + 1 }, { transaction });
        }

        await existingQueueItem.update({ is_current: true, position: newPosition }, { transaction });

        const updatedQueue = await Queue.findAll({
          where: { user_id: userId },
          order: [['position', 'ASC']],
          transaction,
        });

        const formattedQueue = await Promise.all(updatedQueue.map(async (item) => {
          let itemFeatArtists = [];
          if (item.feat_artists && item.feat_artists.length > 0) {
            const featArtistIds = Array.isArray(item.feat_artists) ? item.feat_artists : JSON.parse(item.feat_artists);
            const artists = await Artist.findAll({
              where: { artist_id: featArtistIds },
              attributes: ['stage_name'],
              transaction,
            });
            itemFeatArtists = artists.map(artist => artist.stage_name);
          }

          return {
            ...item.toJSON(),
            audio_file_url: item.audio_file_url ? `${baseUrl}${item.audio_file_url}` : null,
            img: item.img ? `${baseUrl}${item.img}` : null,
            feat_artists: itemFeatArtists,
          };
        }));

        await transaction.commit();
        console.log('Successfully updated existing song in queue:', existingQueueItem);
        return res.status(200).json({ queue: formattedQueue });
      }

      if (playImmediately) {
        const currentSong = await Queue.findOne({
          where: { user_id: userId, is_current: true },
          transaction,
        });

        const newPosition = currentSong ? currentSong.position : 1;

        const queueItems = await Queue.findAll({
          where: { user_id: userId, position: { [Op.gte]: newPosition } },
          order: [['position', 'ASC']],
          transaction,
        });

        for (let i = queueItems.length - 1; i >= 0; i--) {
          await queueItems[i].update({ position: queueItems[i].position + 1 }, { transaction });
        }

        await Queue.update(
          { is_current: false },
          { where: { user_id: userId }, transaction }
        );

        const queueItem = await Queue.create(
          {
            user_id: userId,
            song_id,
            position: newPosition,
            is_current: true,
            title: song.title,
            duration: song.duration,
            audio_file_url: song.audio_file_url,
            img: song.img,
            artist_id: song.artist_id,
            artist_name: (await song.getMainArtist()).stage_name,
            feat_artists: featArtists,
            album_name: song.album_id ? (await song.getAlbum())?.title : null,
          },
          { transaction }
        );

        const updatedQueue = await Queue.findAll({
          where: { user_id: userId },
          order: [['position', 'ASC']],
          transaction,
        });

        const formattedQueue = await Promise.all(updatedQueue.map(async (item) => {
          let itemFeatArtists = [];
          if (item.feat_artists && item.feat_artists.length > 0) {
            const featArtistIds = Array.isArray(item.feat_artists) ? item.feat_artists : JSON.parse(item.feat_artists);
            const artists = await Artist.findAll({
              where: { artist_id: featArtistIds },
              attributes: ['stage_name'],
              transaction,
            });
            itemFeatArtists = artists.map(artist => artist.stage_name);
          }

          return {
            ...item.toJSON(),
            audio_file_url: item.audio_file_url ? `${baseUrl}${item.audio_file_url}` : null,
            img: item.img ? `${baseUrl}${item.img}` : null,
            feat_artists: itemFeatArtists,
          };
        }));

        await transaction.commit();
        console.log('Successfully added song to queue at position:', newPosition);
        return res.status(201).json({ queue: formattedQueue });
      } else {
        const maxPosition = (await Queue.max('position', { where: { user_id: userId }, transaction })) || 0;
        const isQueueEmpty = maxPosition === 0;

        const queueItem = await Queue.create(
          {
            user_id: userId,
            song_id,
            position: maxPosition + 1,
            is_current: isQueueEmpty,
            title: song.title,
            duration: song.duration,
            audio_file_url: song.audio_file_url,
            img: song.img,
            artist_id: song.artist_id,
            artist_name: (await song.getMainArtist()).stage_name,
            feat_artists: featArtists,
            album_name: song.album_id ? (await song.getAlbum())?.title : null,
          },
          { transaction }
        );

        const updatedQueue = await Queue.findAll({
          where: { user_id: userId },
          order: [['position', 'ASC']],
          transaction,
        });

        const formattedQueue = await Promise.all(updatedQueue.map(async (item) => {
          let itemFeatArtists = [];
          if (item.feat_artists && item.feat_artists.length > 0) {
            const featArtistIds = Array.isArray(item.feat_artists) ? item.feat_artists : JSON.parse(item.feat_artists);
            const artists = await Artist.findAll({
              where: { artist_id: featArtistIds },
              attributes: ['stage_name'],
              transaction,
            });
            itemFeatArtists = artists.map(artist => artist.stage_name);
          }

          return {
            ...item.toJSON(),
            audio_file_url: item.audio_file_url ? `${baseUrl}${item.audio_file_url}` : null,
            img: item.img ? `${baseUrl}${item.img}` : null,
            feat_artists: itemFeatArtists,
          };
        }));

        await transaction.commit();
        console.log('Successfully added song to queue at end:', queueItem);
        return res.status(201).json({ queue: formattedQueue });
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error adding song to queue:', error);
    res.status(500).json({ message: 'Không thể thêm bài hát vào danh sách chờ' });
  }
};

// Các hàm khác được điều chỉnh tương tự
exports.removeSongFromQueue = async (req, res) => {
  const { song_id } = req.params;
  const userId = req.user.user_id;

  const transaction = await sequelize.transaction();

  try {
    console.log('Removing song from queue:', { song_id, userId });
    const queueItem = await Queue.findOne({
      where: { user_id: userId, song_id },
      transaction,
    });

    if (!queueItem) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Bài hát không có trong danh sách chờ' });
    }

    await queueItem.destroy({ transaction });

    await Queue.update(
      { position: sequelize.literal('position - 1') },
      {
        where: {
          user_id: userId,
          position: { [Op.gt]: queueItem.position },
        },
        transaction,
      }
    );

    await transaction.commit();
    console.log('Successfully removed song from queue:', song_id);
    res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error('Error removing song from queue:', error);
    res.status(500).json({ message: 'Không thể xóa bài hát khỏi danh sách chờ' });
  }
};

exports.updateCurrentSong = async (req, res) => {
  const { song_id } = req.body;
  const userId = req.user.user_id;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  if (!song_id) {
    return res.status(400).json({ message: 'Yêu cầu song_id' });
  }

  const transaction = await sequelize.transaction();

  try {
    console.log('Updating current song:', { song_id, userId });
    const queueItem = await Queue.findOne({
      where: { user_id: userId, song_id },
      transaction,
    });

    if (!queueItem) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Bài hát không có trong danh sách chờ' });
    }

    // Lấy danh sách tên ca sĩ feat
    let featArtists = [];
    if (queueItem.feat_artists && queueItem.feat_artists.length > 0) {
      const featArtistIds = Array.isArray(queueItem.feat_artists) ? queueItem.feat_artists : JSON.parse(queueItem.feat_artists);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['stage_name'],
      });
      featArtists = artists.map(artist => artist.stage_name);
    }

    console.log('Setting is_current=false for all queue items, userId:', userId);
    await Queue.update(
      { is_current: false },
      { where: { user_id: userId }, transaction }
    );

    console.log('Setting is_current=true for queue item:', queueItem.queue_id);
    await queueItem.update({ is_current: true }, { transaction });

    const formattedQueueItem = {
      ...queueItem.toJSON(),
      audio_file_url: queueItem.audio_file_url ? `${baseUrl}${queueItem.audio_file_url}` : null,
      img: queueItem.img ? `${baseUrl}${queueItem.img}` : null,
      feat_artists: featArtists,
    };

    await transaction.commit();
    console.log('Successfully updated current song:', queueItem);
    res.status(200).json({ success: true, queue_item: formattedQueueItem });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating current song:', error);
    res.status(500).json({ message: 'Không thể cập nhật bài hát hiện tại' });
  }
};

exports.nextSong = async (req, res) => {
  const userId = req.user.user_id;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const transaction = await sequelize.transaction();

  try {
    console.log('Fetching next song for userId:', userId);
    const currentSong = await Queue.findOne({
      where: { user_id: userId, is_current: true },
      transaction,
    });

    if (!currentSong) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không có bài hát hiện tại' });
    }

    const nextSong = await Queue.findOne({
      where: {
        user_id: userId,
        position: { [Op.gt]: currentSong.position },
      },
      order: [['position', 'ASC']],
      transaction,
    });

    if (!nextSong) {
      await transaction.commit();
      return res.status(404).json({ message: 'Không có bài hát tiếp theo' });
    }

    // Lấy danh sách tên ca sĩ feat
    let featArtists = [];
    if (nextSong.feat_artists && nextSong.feat_artists.length > 0) {
      const featArtistIds = Array.isArray(nextSong.feat_artists) ? nextSong.feat_artists : JSON.parse(nextSong.feat_artists);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['stage_name'],
      });
      featArtists = artists.map(artist => artist.stage_name);
    }

    console.log('Setting is_current=false for current song:', currentSong.queue_id);
    await currentSong.update({ is_current: false }, { transaction });

    console.log('Setting is_current=true for next song:', nextSong.queue_id);
    await nextSong.update({ is_current: true }, { transaction });

    const formattedNextSong = {
      ...nextSong.toJSON(),
      audio_file_url: nextSong.audio_file_url ? `${baseUrl}${nextSong.audio_file_url}` : null,
      img: nextSong.img ? `${baseUrl}${nextSong.img}` : null,
      feat_artists: featArtists,
    };

    await transaction.commit();
    console.log('Successfully moved to next song:', nextSong);
    res.status(200).json({ queue_item: formattedNextSong });
  } catch (error) {
    await transaction.rollback();
    console.error('Error moving to next song:', error);
    res.status(500).json({ message: 'Không thể chuyển sang bài hát tiếp theo' });
  }
};

exports.prevSong = async (req, res) => {
  const userId = req.user.user_id;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const transaction = await sequelize.transaction();

  try {
    console.log('Fetching previous song for userId:', userId);
    const currentSong = await Queue.findOne({
      where: { user_id: userId, is_current: true },
      transaction,
    });

    if (!currentSong) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không có bài hát hiện tại' });
    }

    const prevSong = await Queue.findOne({
      where: {
        user_id: userId,
        position: { [Op.lt]: currentSong.position },
      },
      order: [['position', 'DESC']],
      transaction,
    });

    if (!prevSong) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không có bài hát trước đó' });
    }

    // Lấy danh sách tên ca sĩ feat
    let featArtists = [];
    if (prevSong.feat_artists && prevSong.feat_artists.length > 0) {
      const featArtistIds = Array.isArray(prevSong.feat_artists) ? prevSong.feat_artists : JSON.parse(prevSong.feat_artists);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['stage_name'],
      });
      featArtists = artists.map(artist => artist.stage_name);
    }

    console.log('Setting is_current=false for current song:', currentSong.queue_id);
    await currentSong.update({ is_current: false }, { transaction });

    console.log('Setting is_current=true for previous song:', prevSong.queue_id);
    await prevSong.update({ is_current: true }, { transaction });

    const formattedPrevSong = {
      ...prevSong.toJSON(),
      audio_file_url: prevSong.audio_file_url ? `${baseUrl}${prevSong.audio_file_url}` : null,
      img: prevSong.img ? `${baseUrl}${prevSong.img}` : null,
      feat_artists: featArtists,
    };

    await transaction.commit();
    console.log('Successfully moved to previous song:', prevSong);
    res.status(200).json({ queue_item: formattedPrevSong });
  } catch (error) {
    await transaction.rollback();
    console.error('Error moving to previous song:', error);
    res.status(500).json({ message: 'Không thể chuyển sang bài hát trước đó' });
  }
};

exports.clearQueue = async (req, res) => {
  const userId = req.user.user_id;

  try {
    await Queue.destroy({ where: { user_id: userId } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Không thể làm trống danh sách chờ' });
  }
};
exports.playContent = async (req, res) => {
  const { song_ids } = req.body;
  const userId = req.user.user_id;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  if (!song_ids || !Array.isArray(song_ids) || song_ids.length === 0) {
    return res.status(400).json({ message: 'Yêu cầu danh sách song_ids hợp lệ' });
  }

  try {
    console.log('Playing content for userId:', userId, 'with song_ids:', song_ids);

    const transaction = await sequelize.transaction();

    try {
      // Bước 1: Xóa toàn bộ danh sách chờ hiện tại
      await Queue.destroy({ where: { user_id: userId }, transaction });
      console.log('Cleared queue for userId:', userId);

      // Bước 2: Xáo trộn danh sách song_ids
      const shuffledSongIds = [...song_ids].sort(() => Math.random() - 0.5);
      console.log('Shuffled song_ids:', shuffledSongIds);

      // Bước 3: Lấy thông tin bài hát từ danh sách song_ids theo thứ tự xáo trộn
      const songs = await Song.findAll({
        where: { song_id: shuffledSongIds },
        transaction,
      });

      if (songs.length !== song_ids.length) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Một hoặc nhiều bài hát không tồn tại' });
      }

      // Bước 4: Thêm các bài hát vào danh sách chờ
      // Bài hát đầu tiên (index = 0) sẽ có position = 1 và is_current = true
      const queueItems = await Promise.all(
        songs.map(async (song, index) => {
          // Lấy danh sách tên ca sĩ feat
          let featArtists = [];
          if (song.feat_artist_ids) {
            const featArtistIds = Array.isArray(song.feat_artist_ids) 
              ? song.feat_artist_ids 
              : JSON.parse(song.feat_artist_ids);
            const artists = await Artist.findAll({
              where: { artist_id: featArtistIds },
              attributes: ['stage_name'],
              transaction,
            });
            featArtists = artists.map(artist => artist.stage_name);
          }

          const queueItem = await Queue.create(
            {
              user_id: userId,
              song_id: song.song_id,
              position: index + 1, // Vị trí bắt đầu từ 1
              is_current: index === 0, // Bài hát ở position = 1 (index = 0) được đặt is_current = true
              title: song.title,
              duration: song.duration,
              audio_file_url: song.audio_file_url,
              img: song.img,
              artist_id: song.artist_id,
              artist_name: (await song.getMainArtist({ transaction })).stage_name,
              feat_artists: featArtists,
              album_name: song.album_id ? (await song.getAlbum({ transaction }))?.title : null,
            },
            { transaction }
          );

          return {
            ...queueItem.toJSON(),
            audio_file_url: queueItem.audio_file_url ? `${baseUrl}${queueItem.audio_file_url}` : null,
            img: queueItem.img ? `${baseUrl}${queueItem.img}` : null,
            feat_artists: featArtists,
          };
        })
      );

      await transaction.commit();
      console.log('Successfully added songs to queue with random order, first song (position = 1) as current');
      return res.status(200).json({ queue: queueItems });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error playing content:', error);
    res.status(500).json({ message: 'Không thể phát nội dung' });
  }
};