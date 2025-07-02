const axios = require('axios');
const { Op } = require('sequelize');
const { Artist, Song, Album } = require('../models'); // Nhập từ models/index.js

exports.createArtist = async (req, res) => {
  console.log('POST /artists called with body:', req.body);
  try {
    const { stage_name } = req.body;

    if (!stage_name || typeof stage_name !== 'string' || stage_name.length < 1) {
      console.log('Validation failed:', { stage_name });
      return res.status(400).json({ message: 'Tên ca sĩ không hợp lệ' });
    }

    const existingArtist = await Artist.findOne({ where: { stage_name } });
    if (existingArtist) {
      console.log('Artist already exists:', stage_name);
      return res.status(400).json({ message: `Ca sĩ ${stage_name} đã tồn tại` });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    console.log('Spotify credentials:', { clientId, clientSecret });
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    let accessToken;

    try {
      console.log('Requesting Spotify token...');
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      accessToken = tokenResponse.data.access_token;
      console.log('Spotify token received:', accessToken ? 'Success' : 'Failed');
    } catch (err) {
      console.error('Spotify token error:', err.response?.data || err.message);
      return res.status(500).json({ message: 'Lỗi khi lấy token Spotify', error: err.message });
    }

    console.log('Searching Spotify for artist:', stage_name);
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(stage_name)}&type=artist&limit=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log('Spotify search response:', searchResponse.data);

    const spotifyArtist = searchResponse.data.artists.items[0];
    if (!spotifyArtist || spotifyArtist.name.toLowerCase() !== stage_name.toLowerCase()) {
      console.log('Artist not found on Spotify:', stage_name);
      return res.status(404).json({ message: `Không tìm thấy ca sĩ ${stage_name} trên Spotify` });
    }

    console.log('Creating artist in database:', {
      stage_name: spotifyArtist.name,
      popularity: spotifyArtist.popularity,
      profile_picture: spotifyArtist.images[0]?.url || null,
    });
    const artist = await Artist.create({
      stage_name: spotifyArtist.name,
      popularity: spotifyArtist.popularity,
      profile_picture: spotifyArtist.images[0]?.url || null,
    });

    res.status(201).json({
      message: 'Tạo ca sĩ thành công',
      artist: {
        artist_id: artist.artist_id,
        stage_name: artist.stage_name,
        popularity: artist.popularity,
        profile_picture: artist.profile_picture,
      },
    });
  } catch (error) {
    console.error('Create artist error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getArtists = async (req, res) => {
  console.log('GET /artists called with query:', req.query);
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const where = search ? { stage_name: { [Op.like]: `%${search}%` } } : {};
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const artists = await Artist.findAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });
    const total = await Artist.count({ where });
    console.log('Artists fetched:', artists.length, 'Total:', total);

    res.json({
      message: 'Lấy danh sách ca sĩ thành công',
      artists,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get artists error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.searchArtistsByName = async (req, res) => {
  console.log('GET /artists/search called with query:', req.query);
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    if (!search || typeof search !== 'string' || search.trim().length < 1) {
      console.log('Validation failed: Invalid search query');
      return res.status(400).json({ message: 'Từ khóa tìm kiếm không hợp lệ' });
    }

    const where = { stage_name: { [Op.like]: `%${search}%` } };
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const artists = await Artist.findAll({
      attributes: ['stage_name', 'profile_picture'],
      where,
      limit: parseInt(limit),
      offset,
      order: [['stage_name', 'ASC']],
    });
    const total = await Artist.count({ where });
    console.log('Artists found:', artists.length, 'Total:', total);

    res.json({
      message: 'Tìm kiếm ca sĩ thành công',
      artists,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Search artists error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
exports.getArtistDetail = async (req, res) => {
  console.log('GET /artists/:id/detail called with params:', req.params);
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid artist_id:', id);
      return res.status(400).json({ message: 'ID ca sĩ không hợp lệ' });
    }

    // Tìm nghệ sĩ
    const artist = await Artist.findByPk(id, {
      attributes: ['artist_id', 'stage_name', 'profile_picture'],
    });

    if (!artist) {
      console.log('Artist not found:', id);
      return res.status(404).json({ message: 'Ca sĩ không tồn tại' });
    }

    // Lấy danh sách bài hát (nghệ sĩ chính và góp mặt)
    const songsAsMain = await Song.findAll({
      where: { artist_id: id },
      include: [
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
    });

    const songsAsFeat = await Song.findAll({
      where: {
        feat_artist_ids: {
          [Op.ne]: null,
          [Op.or]: [
            { [Op.like]: `%"${id}"%` },
            { [Op.like]: `%[${id}]%` },
            { [Op.like]: `%[${id},%` },
            { [Op.like]: `%,${id}]%` },
            { [Op.like]: `%,${id},%` },
          ],
        },
      },
      include: [
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
    });

    // Gộp danh sách bài hát và loại bỏ trùng lặp
    const allSongs = [...songsAsMain, ...songsAsFeat].reduce((unique, song) => {
      if (!unique.some(s => s.song_id === song.song_id)) {
        unique.push(song);
      }
      return unique;
    }, []);

    // Tính tổng lượt nghe
    const totalListenCount = allSongs.reduce((sum, song) => sum + (song.listen_count || 0), 0);

    // Lấy danh sách album
    const albums = await Album.findAll({
      where: { artist_id: id },
      attributes: ['album_id', 'title', 'img'],
    });

    // Xử lý danh sách bài hát
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const processedSongs = await Promise.all(
      allSongs.map(async (song) => {
        const songData = song.toJSON();
        
        // Lấy tên nghệ sĩ chính
        const mainArtist = await Artist.findByPk(songData.artist_id, {
          attributes: ['stage_name'],
        });
        
        // Lấy danh sách nghệ sĩ góp mặt
        let featArtists = [];
        if (songData.feat_artist_ids) {
          const featIds = JSON.parse(songData.feat_artist_ids);
          featArtists = await Artist.findAll({
            where: { artist_id: featIds },
            attributes: ['stage_name'],
          });
          featArtists = featArtists.map(artist => artist.stage_name);
        }

        // Áp dụng baseUrl cho audio_file_url và img
        songData.audio_file_url = songData.audio_file_url ? `${baseUrl}${songData.audio_file_url}` : null;
        songData.img = songData.img ? `${baseUrl}${songData.img}` : null;

        return {
          song_id: songData.song_id,
          title: songData.title,
          duration: songData.duration,
          release_date: songData.release_date,
          audio_file_url: songData.audio_file_url,
          img: songData.img,
          artist_id: songData.artist_id,
          artist_name: mainArtist ? mainArtist.stage_name : null,
          feat_artists: featArtists,
          album_name: songData.Album ? songData.Album.title : null,
          is_downloadable: songData.is_downloadable,
          created_at: songData.created_at,
          listen_count: songData.listen_count,
        };
      })
    );

    // Xử lý danh sách album
    const processedAlbums = albums.map(album => ({
      album_id: album.album_id,
      title: album.title,
      img: album.img ? `${baseUrl}${album.img}` : null, // Áp dụng baseUrl cho ảnh album
    }));

    res.json({
      message: 'Lấy chi tiết ca sĩ thành công',
      artist: {
        artist_id: artist.artist_id,
        stage_name: artist.stage_name,
        profile_picture: artist.profile_picture, // Không áp dụng baseUrl
        total_listen_count: totalListenCount,
        albums: processedAlbums,
        songs: processedSongs,
      },
    });
  } catch (error) {
    console.error('Get artist detail error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
module.exports = exports;