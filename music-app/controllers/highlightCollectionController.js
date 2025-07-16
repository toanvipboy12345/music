const { Artist, Song, Album, Playlist, User} = require('../models');
const { Sequelize, Op } = require('sequelize');
// Lấy danh sách 10 tuyển tập nổi bật ngẫu nhiên của các ca sĩ (popularity > 50)
const getHighlightCollections = async (req, res) => {
  try {
    const artists = await Artist.findAll({
      where: { popularity: { [Op.gt]: 82 } },
      attributes: ['artist_id', 'stage_name', 'popularity', 'profile_picture', 'created_at'],
      order: Sequelize.literal('RAND()'),
      limit: 10
    });

    const collections = artists.map(artist => ({
      artist_id: artist.artist_id,
      title: `This Is ${artist.stage_name}`,
      artist_name: artist.stage_name,
      img: artist.profile_picture,
      popularity: artist.popularity,
      created_at: artist.created_at
    }));

    res.status(200).json({
      status: 'success',
      data: collections
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Lấy chi tiết tuyển tập của một ca sĩ dựa trên artist_id
const getHighlightCollectionByArtist = async (req, res) => {
  try {
    const { artist_id } = req.params;
    const artist = await Artist.findByPk(artist_id, {
      attributes: ['artist_id', 'stage_name', 'popularity', 'profile_picture', 'created_at']
    });

    if (!artist) {
      return res.status(404).json({ status: 'error', message: 'Ca sĩ không tồn tại' });
    }

    // Lấy 10 bài hát ngẫu nhiên của ca sĩ, bao gồm thông tin album và lượt nghe
    const songs = await Song.findAll({
      where: { artist_id },
      order: Sequelize.literal('RAND()'),
      limit: 10,
      attributes: [
        'song_id',
        'title',
        'duration',
        'release_date',
        'audio_file_url',
        'img',
        'artist_id',
        'feat_artist_ids',
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
    });

    // Xử lý danh sách bài hát để thêm thông tin ca sĩ feat, artist_name và listen_count
    const songsWithFeats = await Promise.all(
      songs.map(async (song) => {
        let featArtists = [];
        if (song.feat_artist_ids) {
          try {
            const featIds = JSON.parse(song.feat_artist_ids);
            if (Array.isArray(featIds) && featIds.length > 0) {
              const artists = await Artist.findAll({
                where: { artist_id: { [Op.in]: featIds } },
                attributes: ['artist_id', 'stage_name']
              });
              featArtists = artists.map(artist => ({
                artist_id: artist.artist_id,
                stage_name: artist.stage_name
              }));
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
          audio_file_url: song.audio_file_url,
          img: song.img ? `${req.protocol}://${req.get('host')}${song.img}` : null,
          artist_id: song.artist_id,
          artist_name: artist.stage_name,
          feat_artists: featArtists,
          album_name: song.Album ? song.Album.title : null,
          is_downloadable: song.is_downloadable,
          created_at: song.created_at,
          listen_count: song.listen_count
        };
      })
    );

    const collection = {
      artist_id: artist.artist_id,
      title: `This Is ${artist.stage_name}`,
      artist_name: artist.stage_name,
      img: artist.profile_picture,
      popularity: artist.popularity,
      created_at: artist.created_at
    };

    res.status(200).json({
      status: 'success',
      data: { collection, songs: songsWithFeats }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Lấy danh sách 10 ca sĩ nổi bật nhất dựa trên popularity
const getTopPopularArtists = async (req, res) => {
  try {
    const artists = await Artist.findAll({
      attributes: ['artist_id', 'stage_name', 'profile_picture'],
      order: [['popularity', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      status: 'success',
      data: artists
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Lấy top 10 playlist công khai của role user có nhiều lượt like nhất
const getTopLikedPlaylists = async (req, res) => {
  try {
    const topPlaylists = await Playlist.findAll({
      where: {
        is_public: true,
      },
      include: [{
        model: User,
        as: 'User', // Sử dụng alias 'User' khớp với mối quan hệ
        where: {
          role: 'user',
        },
        attributes: ['user_id', 'username'],
      }],
      order: [['like_count', 'DESC']],
      limit: 10,
    });

    if (!topPlaylists.length) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy playlist nào' });
    }

    // Thêm base URL vào img
    const playlistsWithBaseUrl = topPlaylists.map(playlist => ({
      ...playlist.toJSON(),
      img: playlist.img ? `${req.protocol}://${req.get('host')}${playlist.img}` : null,
    }));

    res.status(200).json({
      status: 'success',
      data: playlistsWithBaseUrl,
    });
  } catch (error) {
    console.error('Error fetching top liked playlists:', error);
    res.status(500).json({ status: 'error', message: 'Lỗi máy chủ nội bộ' });
  }
};
// Lấy danh sách 12 bài hát mới phát hành trong 2 tuần gần đây
const getNewReleaseSongs = async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const songs = await Song.findAll({
      where: {
        release_date: {
          [Op.gte]: twoWeeksAgo,
          [Op.lte]: new Date()
        }
      },
      attributes: [
        'song_id',
        'title',
        'duration',
        'release_date',
        'audio_file_url',
        'img',
        'artist_id',
        'feat_artist_ids',
        'is_downloadable',
        'created_at',
        'listen_count'
      ],
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['stage_name'],
          required: true
        },
        {
          model: Album,
          as: 'Album',
          attributes: ['title'],
          required: false
        }
      ],
      order: [['release_date', 'DESC']],
      limit: 12
    });

    const songsWithFeats = await Promise.all(
      songs.map(async (song) => {
        let featArtists = [];
        if (song.feat_artist_ids) {
          try {
            const featIds = JSON.parse(song.feat_artist_ids);
            if (Array.isArray(featIds) && featIds.length > 0) {
              const artists = await Artist.findAll({
                where: { artist_id: { [Op.in]: featIds } },
                attributes: ['artist_id', 'stage_name']
              });
              featArtists = artists.map(artist => ({
                artist_id: artist.artist_id,
                stage_name: artist.stage_name
              }));
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
          audio_file_url: song.audio_file_url,
          img: song.img ? `${req.protocol}://${req.get('host')}${song.img}` : null,
          artist_id: song.artist_id,
          artist_name: song.MainArtist ? song.MainArtist.stage_name : null,
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
      data: songsWithFeats
    });
  } catch (error) {
    console.error('Error fetching new release songs:', error);
    res.status(500).json({ status: 'error', message: 'Lỗi máy chủ nội bộ' });
  }
};
// Lấy danh sách tất cả playlist công khai của user có role admin
const getAdminPlaylists = async (req, res) => {
  try {
    const adminPlaylists = await Playlist.findAll({
      where: {
        is_public: true,
      },
      include: [{
        model: User,
        as: 'User',
        where: {
          role: 'admin',
        },
        attributes: ['user_id', 'username'],
      }],
      order: [['created_at', 'DESC']], // Sắp xếp theo ngày tạo mới nhất
    });

    if (!adminPlaylists.length) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy playlist nào của admin' });
    }

    // Thêm base URL vào img
    const playlistsWithBaseUrl = adminPlaylists.map(playlist => ({
      ...playlist.toJSON(),
      img: playlist.img ? `${req.protocol}://${req.get('host')}${playlist.img}` : null,
    }));

    res.status(200).json({
      status: 'success',
      data: playlistsWithBaseUrl,
    });
  } catch (error) {
    console.error('Error fetching admin playlists:', error);
    res.status(500).json({ status: 'error', message: 'Lỗi máy chủ nội bộ' });
  }
};

const getTopPopularAlbums = async (req, res) => {
  try {
    console.log('Fetching top popular albums...');
    console.log('Request details:', {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      host: req.get('host'),
      protocol: req.protocol
    });

    // Truy vấn tất cả album và tổng lượt nghe
    console.log('Executing Album.findAll query...');
    const albums = await Album.findAll({
      attributes: [
        'album_id',
        'title',
        'release_date',
        'img',
        'artist_id',
        'created_at',
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('`Songs`.`listen_count`')), 0), 'total_listen_count']
      ],
      include: [
        {
          model: Song,
          as: 'Songs',
          attributes: [],
          required: false
        },
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['stage_name'],
          required: true
        }
      ],
      group: ['Album.album_id', 'Album.title', 'Album.release_date', 'Album.img', 'Album.artist_id', 'Album.created_at', 'MainArtist.artist_id', 'MainArtist.stage_name'],
      order: [[Sequelize.literal('total_listen_count'), 'DESC']],
      limit: 12,
      subQuery: false, // Tắt subquery để đảm bảo JOIN được thực hiện trong truy vấn chính
      logging: console.log // Giữ logging để debug
    });

    console.log('Albums fetched:', {
      count: albums.length,
      data: albums.map(a => ({
        album_id: a.album_id,
        title: a.title,
        artist_id: a.artist_id,
        total_listen_count: a.getDataValue('total_listen_count'),
        raw: a.toJSON()
      }))
    });

    if (!albums.length) {
      console.log('No albums found in database');
      console.log('Checking Albums table...');
      const allAlbums = await Album.findAll({ attributes: ['album_id', 'title', 'artist_id'] });
      console.log('All albums in database:', {
        count: allAlbums.length,
        data: allAlbums.map(a => a.toJSON())
      });
      console.log('Checking Songs table for listen_count...');
      const songs = await Song.findAll({ attributes: ['song_id', 'title', 'album_id', 'listen_count'] });
      console.log('Songs with album_id:', {
        count: songs.length,
        data: songs.map(s => s.toJSON())
      });
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy album nào' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    console.log('Base URL for images:', baseUrl);

    const albumsWithBaseUrl = albums.map(album => {
      const albumData = {
        album_id: album.album_id,
        title: album.title,
        release_date: album.release_date,
        img: album.img ? `${baseUrl}${album.img}` : null,
        artist_id: album.artist_id,
        artist_name: album.MainArtist ? album.MainArtist.stage_name : null,
        total_listen_count: parseInt(album.getDataValue('total_listen_count')) || 0,
        created_at: album.created_at
      };
      console.log('Processed album:', albumData);
      return albumData;
    });

    console.log('Final processed albums:', albumsWithBaseUrl);

    res.status(200).json({
      status: 'success',
      data: albumsWithBaseUrl
    });
  } catch (error) {
    console.error('Error fetching top popular albums:', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    res.status(500).json({ status: 'error', message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};
// Cập nhật exports (giữ nguyên)
module.exports = {
  getHighlightCollections,
  getHighlightCollectionByArtist,
  getTopPopularArtists,
  getTopLikedPlaylists,
  getNewReleaseSongs,
  getAdminPlaylists,
  getTopPopularAlbums
};