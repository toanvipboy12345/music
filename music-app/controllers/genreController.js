const { Op } = require('sequelize');
const axios = require('axios');
const Genre = require('../models/Genre');

exports.getGenres = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const where = search ? { name: { [Op.like]: `%${search}%` } } : {};
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const genres = await Genre.findAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']]
        });
        const total = await Genre.count({ where });

        res.json({ 
            message: 'Lấy danh sách thể loại thành công',
            genres, 
            total, 
            page: parseInt(page), 
            limit: parseInt(limit) 
        });
    } catch (error) {
        console.error('Get genres error:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getGenreById = async (req, res) => {
    try {
        const genre = await Genre.findOne({ where: { genre_id: req.params.id } });
        if (!genre) {
            return res.status(404).json({ message: 'Không tìm thấy thể loại' });
        }
        res.json({ 
            message: 'Lấy thể loại thành công',
            genre 
        });
    } catch (error) {
        console.error('Get genre by ID error:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.syncGenresFromSpotify = async (req, res) => {
    try {
        // Lấy thông tin xác thực Spotify từ biến môi trường
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        console.log('Spotify credentials:', { clientId, clientSecret });

        if (!clientId || !clientSecret) {
            console.log('Missing Spotify credentials');
            return res.status(500).json({ message: 'Thiếu thông tin xác thực Spotify' });
        }

        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // Lấy token từ Spotify
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
        const accessToken = tokenResponse.data.access_token;
        console.log('Spotify token received:', accessToken ? 'Success' : 'Failed');

        // Lấy danh sách danh mục từ Spotify API
        console.log('Fetching categories from Spotify...');
        const categoriesResponse = await axios.get(
            'https://api.spotify.com/v1/browse/categories?limit=50',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        console.log('Spotify categories response:', categoriesResponse.data.categories.items.length, 'items fetched');

        const categories = categoriesResponse.data.categories.items;

        // Xử lý từng danh mục
        let createdCount = 0;
        let updatedCount = 0;

        for (const category of categories) {
            const { name, icons } = category;
            const img = icons[0]?.url || null;

            // Kiểm tra xem thể loại đã tồn tại chưa
            const existingGenre = await Genre.findOne({ where: { name } });

            if (existingGenre) {
                // Nếu thể loại đã tồn tại, chỉ cập nhật img
                await existingGenre.update({ img });
                console.log(`Đã cập nhật img cho thể loại: ${name}`);
                updatedCount++;
            } else {
                // Nếu thể loại chưa tồn tại, tạo mới
                await Genre.create({
                    name,
                    img
                });
                console.log(`Đã tạo thể loại mới: ${name}`);
                createdCount++;
            }
        }

        res.status(200).json({
            message: 'Đồng bộ thể loại từ Spotify thành công',
            created: createdCount,
            updated: updatedCount,
            totalProcessed: categories.length
        });
    } catch (error) {
        console.error('Sync genres from Spotify error:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi server khi đồng bộ thể loại từ Spotify', error: error.message });
    }
};

module.exports = exports;