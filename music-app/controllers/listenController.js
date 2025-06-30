const { Song, Artist, Genre } = require('../models');

// Tăng lượt nghe cho một bài hát
exports.incrementSongListen = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID bài hát hợp lệ
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ status: 'error', message: 'ID bài hát không hợp lệ' });
    }

    // Tìm bài hát
    const song = await Song.findByPk(id);
    if (!song) {
      return res.status(404).json({ status: 'error', message: 'Bài hát không tồn tại' });
    }

    // Tăng listen_count
    await song.increment('listen_count', { by: 1 });
    console.log(`Incremented listen_count for song ${id}:`, song.listen_count + 1);

    // Lấy lại thông tin bài hát để trả về
    const updatedSong = await Song.findByPk(id, {
      include: [
        {
          model: Artist,
          as: 'MainArtist',
          attributes: ['artist_id', 'stage_name', 'profile_picture', 'popularity'],
        },
        {
          model: Genre,
          as: 'Genre',
          attributes: ['genre_id', 'name'],
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
        'genre_id',
        'is_downloadable',
        'listen_count',
        'created_at',
      ],
    });

    // Xử lý dữ liệu trả về
    const songData = updatedSong.toJSON();
    if (songData.feat_artist_ids) {
      const featIds = JSON.parse(songData.feat_artist_ids);
      const featArtists = await Artist.findAll({
        where: { artist_id: featIds },
        attributes: ['artist_id', 'stage_name', 'profile_picture'],
      });
      songData.feat_artists = featArtists;
    } else {
      songData.feat_artists = [];
    }
    songData.artists = [songData.MainArtist, ...songData.feat_artists];
    delete songData.MainArtist;
    songData.genre = songData.Genre;
    delete songData.Genre;

    // Thêm base URL cho audio_file_url và img
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    songData.audio_file_url = songData.audio_file_url ? `${baseUrl}${songData.audio_file_url}` : null;
    songData.img = songData.img ? `${baseUrl}${songData.img}` : null;

    res.status(200).json({
      status: 'success',
      message: 'Tăng lượt nghe thành công',
      song: songData,
    });
  } catch (error) {
    console.error('Error in incrementSongListen:', error);
    res.status(500).json({ status: 'error', message: 'Lỗi server: ' + error.message });
  }
};