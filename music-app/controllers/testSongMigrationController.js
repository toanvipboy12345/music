const { Dropbox } = require('dropbox');
const fs = require('fs').promises;
const path = require('path');
const { Song, Queue } = require('../models');
require('dotenv').config();

// Khởi tạo Dropbox
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

// Hàm tạo liên kết trực tiếp từ Dropbox
function getDropboxDirectLink(shareLink) {
  return shareLink.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
}

const testMigrateSongToCloud = async (req, res) => {
  const { id } = req.params;
  try {
    // Tìm bài hát
    const song = await Song.findByPk(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Đường dẫn file cục bộ
    const localFilePath = path.join(__dirname, '../uploads/songs', path.basename(song.audio_file_url));
    const fileName = `/MusicAppSongs/${song.song_id}.mp3`; // Đường dẫn trên Dropbox
    try {
      await fs.access(localFilePath);
    } catch {
      return res.status(404).json({ message: 'Local MP3 file not found' });
    }

    // Tải file lên Dropbox
    const fileContent = await fs.readFile(localFilePath);
    await dbx.filesUpload({
      path: fileName,
      contents: fileContent,
      mode: 'add',
      mute: true,
    });

    // Tạo liên kết chia sẻ công khai
    const shareResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: fileName,
      settings: { requested_visibility: 'public' },
    });

    // Lấy liên kết trực tiếp
    const directLink = getDropboxDirectLink(shareResponse.result.url);

    // Cập nhật CSDL
    await Song.update({ audio_file_url: directLink }, { where: { song_id: id } });
    await Queue.update({ audio_file_url: directLink }, { where: { song_id: id } });

    // Xóa file cục bộ
    await fs.unlink(localFilePath);

    return res.status(200).json({
      message: 'Song migrated to Dropbox successfully',
      song_id: id,
      audio_file_url: directLink,
    });
  } catch (error) {
    console.error('Error migrating song:', error);
    return res.status(500).json({ message: 'Error migrating song', error: error.message });
  }
};

const migrateAllSongsToCloud = async (req, res) => {
  try {
    // Lấy tất cả bài hát từ CSDL
    const songs = await Song.findAll();
    const results = [];
    const errors = [];

    // Migrate từng bài hát
    for (const song of songs) {
      const localFilePath = path.join(__dirname, '../uploads/songs', path.basename(song.audio_file_url));
      const fileName = `/MusicAppSongs/${song.song_id}.mp3`;

      try {
        // Kiểm tra file cục bộ
        await fs.access(localFilePath);

        // Tải file lên Dropbox
        const fileContent = await fs.readFile(localFilePath);
        await dbx.filesUpload({
          path: fileName,
          contents: fileContent,
          mode: 'add',
          mute: true,
        });

        // Tạo liên kết chia sẻ công khai
        const shareResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: fileName,
          settings: { requested_visibility: 'public' },
        });

        // Lấy liên kết trực tiếp
        const directLink = getDropboxDirectLink(shareResponse.result.url);

        // Cập nhật CSDL
        await Song.update({ audio_file_url: directLink }, { where: { song_id: song.song_id } });
        await Queue.update({ audio_file_url: directLink }, { where: { song_id: song.song_id } });

        // Xóa file cục bộ
        await fs.unlink(localFilePath);

        results.push({
          song_id: song.song_id,
          title: song.title,
          audio_file_url: directLink,
        });
      } catch (error) {
        errors.push({
          song_id: song.song_id,
          title: song.title,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      message: 'Migration completed',
      migrated: results,
      failed: errors,
    });
  } catch (error) {
    console.error('Error migrating all songs:', error);
    return res.status(500).json({ message: 'Error migrating all songs', error: error.message });
  }
};

const getTestSong = async (req, res) => {
  const { id } = req.params;
  try {
    const song = await Song.findByPk(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    return res.status(200).json({
      song_id: song.song_id,
      title: song.title,
      audio_file_url: song.audio_file_url,
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    return res.status(500).json({ message: 'Error fetching song', error: error.message });
  }
};

const downloadSong = async (req, res) => {
  const { id } = req.params;
  try {
    const song = await Song.findByPk(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.redirect(song.audio_file_url); // Chuyển hướng tới URL Dropbox
  } catch (error) {
    console.error('Error downloading song:', error);
    return res.status(500).json({ message: 'Error downloading song', error: error.message });
  }
};

module.exports = {
  testMigrateSongToCloud,
  migrateAllSongsToCloud,
  getTestSong,
  downloadSong,
};