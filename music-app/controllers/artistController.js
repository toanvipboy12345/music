const axios = require('axios');
const { Op } = require('sequelize');
const { Artist } = require('../models'); // Nhập từ models/index.js

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

module.exports = exports;