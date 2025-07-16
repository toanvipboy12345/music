const { Song, Artist, Genre, ListenHistory, User, Playlist, PlaylistSongs, Album, UserArtistFollows,UserPlaylistLikes, Sequelize } = require('../models');const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const { Dropbox } = require('dropbox');
require('dotenv').config();

// Khởi tạo Dropbox client
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

// Hàm tạo liên kết trực tiếp từ Dropbox
function getDropboxDirectLink(shareLink) {
  return shareLink.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
}

exports.updateAvatar = async (req, res) => {
  const userId = req.user.user_id; // Lấy user_id từ middleware isUser

  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });
    }

    const busboy = Busboy({ headers: req.headers });
    let avatar_file = null;
    const fileBuffers = {};

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      if (fieldname === 'avatar_file') {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
          file.resume();
          return res.status(400).json({ status: 'error', message: 'Chỉ hỗ trợ file JPEG, PNG hoặc GIF' });
        }
        const fileExt = filename.split('.').pop();
        const newFileName = `${uuidv4()}.${fileExt}`;
        avatar_file = { name: newFileName };
        const chunks = [];
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
          fileBuffers[fieldname] = Buffer.concat(chunks);
        });
      } else {
        file.resume();
      }
    });

    busboy.on('finish', async () => {
      if (!avatar_file || !fileBuffers['avatar_file']) {
        await transaction.rollback();
        return res.status(400).json({ status: 'error', message: 'Chưa upload file avatar' });
      }

      // Upload avatar lên Dropbox
      const avatar_dropbox_path = `/avatars/${avatar_file.name}`;
      await dbx.filesUpload({
        path: avatar_dropbox_path,
        contents: fileBuffers['avatar_file'],
        mode: 'add',
      });

      // Tạo shared link và chuyển thành direct link
      const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: avatar_dropbox_path,
        settings: { requested_visibility: 'public' },
      });
      const avatar_url = getDropboxDirectLink(sharedLinkResponse.result.url);

      // Cập nhật avatar_url trong cơ sở dữ liệu
      await user.update({ avatar_url }, { transaction });

      await transaction.commit();
      return res.status(200).json({ status: 'success', message: 'Cập nhật avatar thành công', avatar_url });
    });

    req.pipe(busboy);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};

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

exports.getUserProfile = async (req, res) => {
  const userId = req.user.user_id; // Lấy user_id từ middleware isUser
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  try {
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      console.log('Invalid user_id:', userId);
      return res.status(400).json({ status: 'error', message: 'ID người dùng không hợp lệ' });
    }

    // Kiểm tra quyền truy cập
    if (req.user.user_id !== parseInt(userId)) {
      console.log('Unauthorized access attempt:', { userId, requester: req.user.user_id });
      return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập hồ sơ này' });
    }

    // Lấy thông tin người dùng
    const user = await User.findByPk(parseInt(userId), {
      attributes: ['username', 'avatar_url']
    });
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });
    }

    // Tính khoảng thời gian 30 ngày trước
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Lấy top nghệ sĩ trong tháng
    const topArtists = await ListenHistory.findAll({
      where: {
        user_id: parseInt(userId),
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['artist_id'],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['artist_id', 'stage_name', 'profile_picture', 'popularity']
            }
          ]
        }
      ],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('ListenHistory.song_id')), 'listen_count'],
        [sequelize.col('Song.artist_id'), 'artist_id']
      ],
      group: [
        'ListenHistory.song_id',
        'Song.artist_id',
        'Song.MainArtist.artist_id',
        'Song.MainArtist.stage_name',
        'Song.MainArtist.profile_picture',
        'Song.MainArtist.popularity'
      ],
      order: [[sequelize.fn('COUNT', sequelize.col('ListenHistory.song_id')), 'DESC']],
      limit: 5 // Top 5 nghệ sĩ
    });

    // Định dạng top nghệ sĩ
    const formattedTopArtists = topArtists.map(artist => ({
      artist_id: artist.Song.MainArtist.artist_id,
      stage_name: artist.Song.MainArtist.stage_name,
      profile_picture: artist.Song.MainArtist.profile_picture || null,
      popularity: artist.Song.MainArtist.popularity || 0,
      listen_count: parseInt(artist.dataValues.listen_count)
    }));

    // Lấy top bài hát trong tháng
    const topSongs = await ListenHistory.findAll({
      where: {
        user_id: parseInt(userId),
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: [
            'song_id',
            'title',
            'duration',
            'release_date',
            'audio_file_url',
            'img',
            'artist_id',
            'feat_artist_ids',
            'album_id',
            'is_downloadable',
            'created_at',
            'listen_count'
          ],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['artist_id', 'stage_name']
            }
          ]
        }
      ],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('ListenHistory.song_id')), 'listen_count']
      ],
      group: [
        'ListenHistory.song_id',
        'Song.song_id',
        'Song.title',
        'Song.duration',
        'Song.release_date',
        'Song.audio_file_url',
        'Song.img',
        'Song.artist_id',
        'Song.feat_artist_ids',
        'Song.album_id',
        'Song.is_downloadable',
        'Song.created_at',
        'Song.listen_count',
        'Song.MainArtist.artist_id',
        'Song.MainArtist.stage_name'
      ],
      order: [[sequelize.fn('COUNT', sequelize.col('ListenHistory.song_id')), 'DESC']],
      limit: 5 // Top 5 bài hát
    });

    // Định dạng top bài hát
    const formattedTopSongs = await Promise.all(topSongs.map(async (listen) => {
      const song = listen.Song;
      const songData = song.toJSON();
      if (songData.feat_artist_ids) {
        const featIds = JSON.parse(songData.feat_artist_ids);
        const featArtists = await Artist.findAll({
          where: { artist_id: featIds },
          attributes: ['artist_id', 'stage_name']
        });
        songData.feat_artists = featArtists.map(artist => ({
          artist_id: artist.artist_id,
          stage_name: artist.stage_name
        }));
      } else {
        songData.feat_artists = [];
      }
      songData.artist_name = song.MainArtist.stage_name;
      songData.album_name = song.album_id ? (await Album.findByPk(song.album_id))?.title || null : null;
      delete songData.MainArtist;
      songData.audio_file_url = songData.audio_file_url && !songData.audio_file_url.startsWith('http') ? `${baseUrl}${songData.audio_file_url}` : songData.audio_file_url;
      songData.img = songData.img && !songData.img.startsWith('http') ? `${baseUrl}${songData.img}` : songData.img;
      songData.listen_count = parseInt(listen.dataValues.listen_count); // Số lượt nghe của người dùng
      return songData;
    }));

    // Lấy danh sách playlist của người dùng
    const playlists = await Playlist.findAll({
      where: { user_id: parseInt(userId) },
      attributes: ['playlist_id', 'title', 'img', 'description', 'is_public', 'like_count', 'created_at'],
      include: [
        {
          model: Song,
          as: 'Songs', // Thêm alias 'Songs'
          through: { attributes: [] }, // Không lấy thuộc tính từ bảng trung gian
          attributes: [
            'song_id',
            'title',
            'duration',
            'release_date',
            'audio_file_url',
            'img',
            'artist_id',
            'feat_artist_ids',
            'album_id',
            'is_downloadable',
            'created_at',
            'listen_count'
          ],
          include: [
            {
              model: Artist,
              as: 'MainArtist',
              attributes: ['artist_id', 'stage_name']
            }
          ]
        }
      ]
    });

    // Định dạng playlist
    const formattedPlaylists = await Promise.all(playlists.map(async (playlist) => {
      const playlistData = playlist.toJSON();
      playlistData.songs = await Promise.all(playlistData.Songs.map(async (song) => {
        if (song.feat_artist_ids) {
          const featIds = JSON.parse(song.feat_artist_ids);
          const featArtists = await Artist.findAll({
            where: { artist_id: featIds },
            attributes: ['artist_id', 'stage_name']
          });
          song.feat_artists = featArtists.map(artist => ({
            artist_id: artist.artist_id,
            stage_name: artist.stage_name
          }));
        } else {
          song.feat_artists = [];
        }
        song.artist_name = song.MainArtist.stage_name;
        song.album_name = song.album_id ? (await Album.findByPk(song.album_id))?.title || null : null;
        delete song.MainArtist;
        song.audio_file_url = song.audio_file_url && !song.audio_file_url.startsWith('http') ? `${baseUrl}${song.audio_file_url}` : song.audio_file_url;
        song.img = song.img && !song.img.startsWith('http') ? `${baseUrl}${song.img}` : song.img;
        return song;
      }));
      delete playlistData.Songs;
      playlistData.img = playlistData.img && !playlistData.img.startsWith('http') ? `${baseUrl}${playlistData.img}` : playlistData.img;
      return playlistData;
    }));

    // Trả về phản hồi
    res.status(200).json({
      status: 'success',
      user: {
        username: user.username,
        avatar: user.avatar_url,
        top_artists_this_month: formattedTopArtists,
        top_songs_this_month: formattedTopSongs,
        playlists: formattedPlaylists
      }
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error.message, error.stack);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
      const errors = error.errors ? error.errors.map((err) => err.message) : [error.message];
      return res.status(400).json({ status: 'error', message: 'Lỗi validation', errors });
    }
    return res.status(500).json({ status: 'error', message: `Lỗi server: ${error.message}` });
  }
};

module.exports = exports;