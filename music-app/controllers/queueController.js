
const { Queue, Song, Artist, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getUserQueue = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const queue = await Queue.findAll({
      where: { user_id: userId },
      order: [['position', 'ASC']],
    });

    const formattedQueue = await Promise.all(queue.map(async (item) => {
      let featArtists = [];
      if (item.feat_artists && item.feat_artists.length > 0) {
        const featArtistIds = Array.isArray(item.feat_artists) ? item.feat_artists : JSON.parse(item.feat_artists);
        const artists = await Artist.findAll({
          where: { artist_id: featArtistIds },
          attributes: ['artist_id', 'stage_name'],
        });
        featArtists = artists.map(artist => ({
          artist_id: artist.artist_id,
          stage_name: artist.stage_name,
        }));
      }

      return {
        ...item.toJSON(),
        audio_file_url: item.audio_file_url,
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
    const song = await Song.findByPk(song_id);
    if (!song) {
      return res.status(404).json({ message: 'Không tìm thấy bài hát' });
    }

    let featArtists = [];
    if (song.feat_artist_ids) {
      const featArtistIds = Array.isArray(song.feat_artist_ids) ? song.feat_artist_ids : JSON.parse(song.feat_artist_ids);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['artist_id', 'stage_name'],
      });
      featArtists = artists.map(artist => ({
        artist_id: artist.artist_id,
        stage_name: artist.stage_name,
      }));
    }

    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra xem bài hát đã tồn tại trong hàng đợi của người dùng chưa
      const existingQueueItem = await Queue.findOne({
        where: { user_id: userId, song_id },
        transaction,
      });

      if (existingQueueItem) {
        if (playImmediately) {
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
                attributes: ['artist_id', 'stage_name'],
                transaction,
              });
              itemFeatArtists = artists.map(artist => ({
                artist_id: artist.artist_id,
                stage_name: artist.stage_name,
              }));
            }

            return {
              ...item.toJSON(),
              audio_file_url: item.audio_file_url,
              img: item.img ? `${baseUrl}${item.img}` : null,
              feat_artists: itemFeatArtists,
            };
          }));

          await transaction.commit();
          return res.status(200).json({ queue: formattedQueue });
        } else {
          await transaction.rollback();
          return res.status(400).json({ message: 'Bài hát đã có trong danh sách chờ' });
        }
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
              attributes: ['artist_id', 'stage_name'],
              transaction,
            });
            itemFeatArtists = artists.map(artist => ({
              artist_id: artist.artist_id,
              stage_name: artist.stage_name,
            }));
          }

          return {
            ...item.toJSON(),
            audio_file_url: item.audio_file_url,
            img: item.img ? `${baseUrl}${item.img}` : null,
            feat_artists: itemFeatArtists,
          };
        }));

        await transaction.commit();
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
              attributes: ['artist_id', 'stage_name'],
              transaction,
            });
            itemFeatArtists = artists.map(artist => ({
              artist_id: artist.artist_id,
              stage_name: artist.stage_name,
            }));
          }

          return {
            ...item.toJSON(),
            audio_file_url: item.audio_file_url,
            img: item.img ? `${baseUrl}${item.img}` : null,
            feat_artists: itemFeatArtists,
          };
        }));

        await transaction.commit();
        return res.status(201).json({ queue: formattedQueue });
      }
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Bài hát đã có trong danh sách chờ' });
      }
      console.error('Error adding song to queue:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error adding song to queue:', error);
    res.status(500).json({ message: 'Không thể thêm bài hát vào danh sách chờ' });
  }
};

exports.removeSongFromQueue = async (req, res) => {
  const { song_id } = req.params;
  const userId = req.user.user_id;

  const transaction = await sequelize.transaction();

  try {
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
    const queueItem = await Queue.findOne({
      where: { user_id: userId, song_id },
      transaction,
    });

    if (!queueItem) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Bài hát không có trong danh sách chờ' });
    }

    let featArtists = [];
    if (queueItem.feat_artists && queueItem.feat_artists.length > 0) {
      const featArtistIds = Array.isArray(queueItem.feat_artists) ? queueItem.feat_artists : JSON.parse(queueItem.feat_artists);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['artist_id', 'stage_name'],
      });
      featArtists = artists.map(artist => ({
        artist_id: artist.artist_id,
        stage_name: artist.stage_name,
      }));
    }

    await Queue.update(
      { is_current: false },
      { where: { user_id: userId }, transaction }
    );

    await queueItem.update({ is_current: true }, { transaction });

    const formattedQueueItem = {
      ...queueItem.toJSON(),
      audio_file_url: queueItem.audio_file_url,
      img: queueItem.img ? `${baseUrl}${queueItem.img}` : null,
      feat_artists: featArtists,
    };

    await transaction.commit();
    res.status(200).json({ success: true, queue_item: formattedQueueItem });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Không thể cập nhật bài hát hiện tại' });
  }
};

exports.nextSong = async (req, res) => {
  const userId = req.user.user_id;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const transaction = await sequelize.transaction();

  try {
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

    let featArtists = [];
    if (nextSong.feat_artists && nextSong.feat_artists.length > 0) {
      const featArtistIds = Array.isArray(nextSong.feat_artists) ? nextSong.feat_artists : JSON.parse(nextSong.feat_artists);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['artist_id', 'stage_name'],
      });
      featArtists = artists.map(artist => ({
        artist_id: artist.artist_id,
        stage_name: artist.stage_name,
      }));
    }

    await currentSong.update({ is_current: false }, { transaction });

    await nextSong.update({ is_current: true }, { transaction });

    const formattedNextSong = {
      ...nextSong.toJSON(),
      audio_file_url: nextSong.audio_file_url,
      img: nextSong.img ? `${baseUrl}${nextSong.img}` : null,
      feat_artists: featArtists,
    };

    await transaction.commit();
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

    let featArtists = [];
    if (prevSong.feat_artists && prevSong.feat_artists.length > 0) {
      const featArtistIds = Array.isArray(prevSong.feat_artists) ? prevSong.feat_artists : JSON.parse(prevSong.feat_artists);
      const artists = await Artist.findAll({
        where: { artist_id: featArtistIds },
        attributes: ['artist_id', 'stage_name'],
      });
      featArtists = artists.map(artist => ({
        artist_id: artist.artist_id,
        stage_name: artist.stage_name,
      }));
    }

    await currentSong.update({ is_current: false }, { transaction });

    await prevSong.update({ is_current: true }, { transaction });

    const formattedPrevSong = {
      ...prevSong.toJSON(),
      audio_file_url: prevSong.audio_file_url,
      img: prevSong.img ? `${baseUrl}${prevSong.img}` : null,
      feat_artists: featArtists,
    };

    await transaction.commit();
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
    console.error('Error clearing queue:', error);
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

    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra các song_id đã tồn tại trong hàng đợi
      const existingQueueItems = await Queue.findAll({
        where: { user_id: userId, song_id: song_ids },
        attributes: ['song_id'],
        transaction,
      });

      const existingSongIds = existingQueueItems.map(item => item.song_id);
      const newSongIds = song_ids.filter(id => !existingSongIds.includes(id));

      if (newSongIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Tất cả bài hát đã có trong danh sách chờ' });
      }

      // Xóa toàn bộ danh sách chờ hiện tại
      await Queue.destroy({ where: { user_id: userId }, transaction });

      // Xáo trộn danh sách newSongIds
      const shuffledSongIds = [...newSongIds].sort(() => Math.random() - 0.5);

      // Lấy thông tin bài hát từ danh sách shuffledSongIds
      const songs = await Song.findAll({
        where: { song_id: shuffledSongIds },
        transaction,
      });

      if (songs.length !== newSongIds.length) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Một hoặc nhiều bài hát không tồn tại' });
      }

      // Thêm các bài hát vào danh sách chờ
      const queueItems = await Promise.all(
        songs.map(async (song, index) => {
          let featArtists = [];
          if (song.feat_artist_ids) {
            const featArtistIds = Array.isArray(song.feat_artist_ids) 
              ? song.feat_artist_ids 
              : JSON.parse(song.feat_artist_ids);
            const artists = await Artist.findAll({
              where: { artist_id: featArtistIds },
              attributes: ['artist_id', 'stage_name'],
              transaction,
            });
            featArtists = artists.map(artist => ({
              artist_id: artist.artist_id,
              stage_name: artist.stage_name,
            }));
          }

          const queueItem = await Queue.create(
            {
              user_id: userId,
              song_id: song.song_id,
              position: index + 1,
              is_current: index === 0,
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
            audio_file_url: queueItem.audio_file_url,
            img: queueItem.img ? `${baseUrl}${queueItem.img}` : null,
            feat_artists: featArtists,
          };
        })
      );

      await transaction.commit();
      return res.status(200).json({ queue: queueItems });
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Một hoặc nhiều bài hát đã có trong danh sách chờ' });
      }
      console.error('Error playing content:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error playing content:', error);
    res.status(500).json({ message: 'Không thể phát nội dung' });
  }
};