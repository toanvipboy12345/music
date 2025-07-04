const { Op, Sequelize } = require('sequelize');
const { Artist, Song, Album } = require('../models');

exports.searchAll = async (req, res) => {
  console.log('GET /search called with query:', req.query);
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    if (!search || typeof search !== 'string' || search.trim().length < 1) {
      console.log('Validation failed: Invalid search query');
      return res.status(400).json({ message: 'Từ khóa tìm kiếm không hợp lệ' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Tìm kiếm ca sĩ
    const artistWhere = {
      stage_name: {
        [Op.like]: `%${search}%`,
      },
    };
    const artists = await Artist.findAll({
      where: artistWhere,
      attributes: ['artist_id', 'stage_name', 'profile_picture'],
      limit: parseInt(limit),
      offset,
      order: [['stage_name', 'ASC']],
    });
    const artistTotal = await Artist.count({ where: artistWhere });

    // Log kết quả tìm kiếm ca sĩ
    console.log(`Found ${artistTotal} artists:`, artists.map(artist => ({
      artist_id: artist.artist_id,
      stage_name: artist.stage_name,
      profile_picture: artist.profile_picture,
    })));

    // Tìm kiếm bài hát (bao gồm tiêu đề và nghệ sĩ chính)
    const songWhere = {
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { '$MainArtist.stage_name$': { [Op.like]: `%${search}%` } },
      ],
    };
    const songs = await Song.findAll({
      where: songWhere,
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['stage_name'],
        },
        {
          model: Album,
          as: 'Album',
          attributes: ['title'],
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
        'is_downloadable',
        'created_at',
        'listen_count',
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });
    const songTotal = await Song.count({
      where: songWhere,
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: [],
        },
      ],
    });

    // Xử lý danh sách bài hát
    const processedSongs = await Promise.all(
      songs.map(async (song) => {
        const songData = song.toJSON();
        let featArtists = [];
        if (songData.feat_artist_ids) {
          let featIds;
          try {
            featIds = Array.isArray(songData.feat_artist_ids)
              ? songData.feat_artist_ids
              : JSON.parse(songData.feat_artist_ids);
          } catch (error) {
            console.error(`Error parsing feat_artist_ids for song ${songData.song_id}:`, error);
            featIds = [];
          }
          featArtists = await Artist.findAll({
            where: { artist_id: featIds },
            attributes: ['stage_name'],
          });
          featArtists = featArtists.map(artist => artist.stage_name);
        }

        return {
          song_id: songData.song_id,
          title: songData.title,
          duration: songData.duration,
          release_date: songData.release_date,
          audio_file_url: songData.audio_file_url ? `${baseUrl}${songData.audio_file_url}` : null,
          img: songData.img ? `${baseUrl}${songData.img}` : null,
          artist_id: songData.artist_id,
          artist_name: songData.MainArtist ? songData.MainArtist.stage_name : null,
          feat_artists: featArtists,
          album_name: songData.Album ? songData.Album.title : null,
          is_downloadable: songData.is_downloadable,
          created_at: songData.created_at,
          listen_count: songData.listen_count,
        };
      })
    );

    // Log kết quả tìm kiếm bài hát
    console.log(`Found ${songTotal} songs:`, processedSongs);

    // Tìm kiếm album
    const albumWhere = {
      title: {
        [Op.like]: `%${search}%`,
      },
    };
    const albums = await Album.findAll({
      where: albumWhere,
      attributes: ['album_id', 'title', 'img', 'release_date'],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });
    const albumTotal = await Album.count({ where: albumWhere });

    // Xử lý danh sách album
    const processedAlbums = albums.map(album => ({
      album_id: album.album_id,
      title: album.title,
      img: album.img ? `${baseUrl}${album.img}` : null,
      release_year: album.release_date ? new Date(album.release_date).getFullYear() : null,
    }));

    // Log kết quả tìm kiếm album
    console.log(`Found ${albumTotal} albums:`, processedAlbums);

    // Xử lý danh sách ca sĩ
    const processedArtists = artists.map(artist => ({
      artist_id: artist.artist_id,
      stage_name: artist.stage_name,
      profile_picture: artist.profile_picture,
    }));

    res.json({
      message: 'Tìm kiếm thành công',
      artists: {
        items: processedArtists,
        total: artistTotal,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      songs: {
        items: processedSongs,
        total: songTotal,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      albums: {
        items: processedAlbums,
        total: albumTotal,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Search error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = exports;