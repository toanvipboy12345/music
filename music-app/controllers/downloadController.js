const { Song } = require('../models');

exports.downloadSong = async (req, res) => {
  try {
    const { song_id } = req.params;

    const song = await Song.findByPk(song_id, {
      attributes: ['song_id', 'title', 'audio_file_url', 'is_downloadable'],
    });

    if (!song) {
      console.log('Song not found:', song_id);
      return res.status(404).json({ message: 'Không tìm thấy bài hát' });
    }

    if (!song.is_downloadable) {
      console.log('Song is not downloadable:', song_id);
      return res.status(403).json({ message: 'Bài hát này không thể tải xuống' });
    }

    return res.status(200).json({
      message: 'Thông tin tải bài hát',
      song: {
        song_id: song.song_id,
        title: song.title,
        audio_file_url: song.audio_file_url,
      },
    });
  } catch (error) {
    console.error('Error in downloadSong:', error);
    return res.status(500).json({
      message: 'Lỗi khi tải bài hát',
      error: error.message,
    });
  }
};