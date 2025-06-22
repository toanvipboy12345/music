const { Op } = require('sequelize');
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
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.createGenre = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Tên thể loại là bắt buộc' });
        }

        const existingGenre = await Genre.findOne({ where: { name } });
        if (existingGenre) {
            return res.status(409).json({ message: 'Tên thể loại đã tồn tại' });
        }

        const genre = await Genre.create({ name });
        res.status(201).json({ 
            message: 'Tạo thể loại thành công', 
            genre: { genre_id: genre.genre_id, name, created_at: genre.created_at } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.updateGenre = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Tên thể loại là bắt buộc' });
        }

        const genre = await Genre.findOne({ where: { genre_id: req.params.id } });
        if (!genre) {
            return res.status(404).json({ message: 'Không tìm thấy thể loại' });
        }

        const existingGenre = await Genre.findOne({ where: { name, genre_id: { [Op.ne]: req.params.id } } });
        if (existingGenre) {
            return res.status(409).json({ message: 'Tên thể loại đã tồn tại' });
        }

        await genre.update({ name });
        res.json({ 
            message: 'Cập nhật thể loại thành công', 
            genre: { genre_id: genre.genre_id, name, created_at: genre.created_at } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.deleteGenre = async (req, res) => {
    try {
        const genre = await Genre.findOne({ where: { genre_id: req.params.id } });
        if (!genre) {
            return res.status(404).json({ message: 'Không tìm thấy thể loại' });
        }

        await genre.destroy();
        res.json({ message: 'Xóa thể loại thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};