const { Playlist, UserPlaylistLikes, Artist, UserArtistFollows, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.likePlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user.user_id; // Lấy user_id từ middleware isUser

  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra playlist tồn tại và công khai
    const playlist = await Playlist.findOne({
      where: {
        playlist_id: parseInt(playlistId),
        is_public: true,
      },
      transaction,
    });

    if (!playlist) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Playlist không tồn tại hoặc không công khai' });
    }

    // Ngăn user like playlist của chính họ
    if (playlist.user_id === userId) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Bạn không thể like playlist của chính mình' });
    }

    // Kiểm tra xem user đã like playlist chưa
    const existingLike = await UserPlaylistLikes.findOne({
      where: {
        user_id: userId,
        playlist_id: parseInt(playlistId),
      },
      transaction,
    });

    if (existingLike) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Bạn đã like playlist này rồi' });
    }

    // Thêm lượt like vào bảng UserPlaylistLikes
    await UserPlaylistLikes.create(
      {
        user_id: userId,
        playlist_id: parseInt(playlistId),
      },
      { transaction }
    );

    // Tăng like_count trong bảng Playlists
    await playlist.increment('like_count', { transaction });

    await transaction.commit();
    return res.status(200).json({ status: 'success', message: 'Like playlist thành công' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};

exports.unlikePlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user.user_id; // Lấy user_id từ middleware isUser

  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra playlist tồn tại và công khai
    const playlist = await Playlist.findOne({
      where: {
        playlist_id: parseInt(playlistId),
        is_public: true,
      },
      transaction,
    });

    if (!playlist) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Playlist không tồn tại hoặc không công khai' });
    }

    // Kiểm tra xem user đã like playlist chưa
    const existingLike = await UserPlaylistLikes.findOne({
      where: {
        user_id: userId,
        playlist_id: parseInt(playlistId),
      },
      transaction,
    });

    if (!existingLike) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Bạn chưa like playlist này' });
    }

    // Xóa lượt like từ bảng UserPlaylistLikes
    await UserPlaylistLikes.destroy({
      where: {
        user_id: userId,
        playlist_id: parseInt(playlistId),
      },
      transaction,
    });

    // Giảm like_count trong bảng Playlists
    await playlist.decrement('like_count', { transaction });

    await transaction.commit();
    return res.status(200).json({ status: 'success', message: 'Bỏ like playlist thành công' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};

exports.checkPlaylistLike = async (req, res) => {
  const { userId, playlistId } = req.params;

  try {
    // Validate userId và playlistId
    if (!Number.isInteger(parseInt(userId)) || !Number.isInteger(parseInt(playlistId))) {
      return res.status(400).json({ status: 'error', message: 'ID người dùng hoặc playlist không hợp lệ' });
    }

    // Kiểm tra xem user đã like playlist chưa
    const existingLike = await UserPlaylistLikes.findOne({
      where: {
        user_id: parseInt(userId),
        playlist_id: parseInt(playlistId),
      },
    });

    return res.status(200).json({
      status: 'success',
      hasLiked: !!existingLike,
    });
  } catch (error) {
    console.error('Check playlist like error:', error.message, error.stack);
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};

exports.followArtist = async (req, res) => {
  const { artistId } = req.params;
  const userId = req.user.user_id; // Lấy user_id từ middleware isUser

  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra artist tồn tại
    const artist = await Artist.findOne({
      where: {
        artist_id: parseInt(artistId),
      },
      transaction,
    });

    if (!artist) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Ca sĩ không tồn tại' });
    }

    // Kiểm tra xem user đã follow artist chưa
    const existingFollow = await UserArtistFollows.findOne({
      where: {
        user_id: userId,
        artist_id: parseInt(artistId),
      },
      transaction,
    });

    if (existingFollow) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Bạn đã follow ca sĩ này rồi' });
    }

    // Thêm lượt follow vào bảng UserArtistFollows
    await UserArtistFollows.create(
      {
        user_id: userId,
        artist_id: parseInt(artistId),
      },
      { transaction }
    );

    // Tăng follower trong bảng Artists
    await artist.increment('follower', { transaction });

    await transaction.commit();
    return res.status(200).json({ status: 'success', message: 'Follow ca sĩ thành công' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};

exports.unfollowArtist = async (req, res) => {
  const { artistId } = req.params;
  const userId = req.user.user_id; // Lấy user_id từ middleware isUser

  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra artist tồn tại
    const artist = await Artist.findOne({
      where: {
        artist_id: parseInt(artistId),
      },
      transaction,
    });

    if (!artist) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Ca sĩ không tồn tại' });
    }

    // Kiểm tra xem user đã follow artist chưa
    const existingFollow = await UserArtistFollows.findOne({
      where: {
        user_id: userId,
        artist_id: parseInt(artistId),
      },
      transaction,
    });

    if (!existingFollow) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Bạn chưa follow ca sĩ này' });
    }

    // Xóa lượt follow từ bảng UserArtistFollows
    await UserArtistFollows.destroy({
      where: {
        user_id: userId,
        artist_id: parseInt(artistId),
      },
      transaction,
    });

    // Giảm follower trong bảng Artists
    await artist.decrement('follower', { transaction });

    await transaction.commit();
    return res.status(200).json({ status: 'success', message: 'Bỏ follow ca sĩ thành công' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};

exports.checkArtistFollow = async (req, res) => {
  const { userId, artistId } = req.params;

  try {
    // Validate userId và artistId
    if (!Number.isInteger(parseInt(userId)) || !Number.isInteger(parseInt(artistId))) {
      return res.status(400).json({ status: 'error', message: 'ID người dùng hoặc ca sĩ không hợp lệ' });
    }

    // Kiểm tra xem user đã follow artist chưa
    const existingFollow = await UserArtistFollows.findOne({
      where: {
        user_id: parseInt(userId),
        artist_id: parseInt(artistId),
      },
    });

    return res.status(200).json({
      status: 'success',
      hasFollowed: !!existingFollow,
    });
  } catch (error) {
    console.error('Check artist follow error:', error.message, error.stack);
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};