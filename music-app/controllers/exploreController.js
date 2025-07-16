const { Op, Sequelize } = require('sequelize');
const Genre = require('../models/Genre');
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');

exports.getGenres = async (req, res) => {
    try {
        const { page = 1, search = '' } = req.query;
        const limit = 30; // Mỗi lần trả về đúng 30 thể loại để hỗ trợ cuộn
        const offset = (parseInt(page) - 1) * limit; // Tính offset dựa trên trang

        const where = search ? { name: { [Op.like]: `%${search}%` } } : {};

        const genres = await Genre.findAll({
            attributes: ['genre_id', 'name', 'img'], // Chỉ lấy các trường yêu cầu
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']] // Sắp xếp theo thời gian tạo giảm dần
        });

        const total = await Genre.count({ where }); // Tổng số thể loại phù hợp

        res.json({
            message: 'Lấy danh sách thể loại thành công',
            genres,
            total,
            page: parseInt(page),
            limit,
            hasMore: offset + genres.length < total // Thông báo liệu có thêm dữ liệu để cuộn không
        });
    } catch (error) {
        console.error('Get genres error:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách thể loại', error: error.message });
    }
};

exports.getTopSongsByGenre = async (req, res) => {
    try {
        const genreId = req.params.id;
        const genre = await Genre.findOne({
            where: { genre_id: genreId },
            attributes: ['genre_id', 'name', 'img'] // Thêm img vào attributes
        });
        if (!genre) {
            return res.status(404).json({ message: 'Không tìm thấy thể loại' });
        }

        // Tạo baseUrl để ghép với img của songs
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const songs = await Song.findAll({
            where: { genre_id: genreId },
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
                    attributes: ['stage_name'],
                    as: 'MainArtist' // Alias khớp với association
                },
                {
                    model: Album,
                    attributes: ['title'],
                    as: 'Album' // Alias khớp với association
                }
            ],
            order: [['listen_count', 'DESC'], [Sequelize.fn('RAND')]], // Sắp xếp theo lượt nghe, sau đó ngẫu nhiên
            limit: 10 // Lấy ngẫu nhiên 10 bài hát
        });

        const formattedSongs = await Promise.all(
            songs.map(async (song) => {
                let featArtists = [];
                if (song.feat_artist_ids) {
                    try {
                        const featIds = JSON.parse(song.feat_artist_ids);
                        featArtists = await Artist.findAll({
                            where: { artist_id: { [Op.in]: featIds } },
                            attributes: ['artist_id', 'stage_name']
                        });
                    } catch (e) {
                        console.error('Error parsing feat_artist_ids:', e.message);
                    }
                }

                return {
                    song_id: song.song_id,
                    title: song.title,
                    duration: song.duration,
                    release_date: song.release_date,
                    audio_file_url: song.audio_file_url,
                    img: song.img ? `${baseUrl}${song.img}` : null, // Chỉ ghép baseUrl với img của songs
                    artist_id: song.artist_id,
                    artist_name: song.MainArtist ? song.MainArtist.stage_name : null,
                    feat_artists: featArtists.map(artist => ({
                        artist_id: artist.artist_id,
                        stage_name: artist.stage_name
                    })),
                    album_name: song.Album ? song.Album.title : null,
                    is_downloadable: song.is_downloadable,
                    created_at: song.created_at,
                    listen_count: song.listen_count
                };
            })
        );

        res.json({
            message: 'Lấy danh sách bài hát ngẫu nhiên theo thể loại thành công',
            genre: { 
                genre_id: genre.genre_id, 
                name: genre.name, 
                img: genre.img // Không ghép baseUrl, giữ nguyên đường dẫn tương đối
            },
            songs: formattedSongs
        });
    } catch (error) {
        console.error('Get top songs by genre error:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài hát theo thể loại', error: error.message });
    }
};

module.exports = exports;