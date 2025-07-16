const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { Op } = require('sequelize');
const { Artist, Song, Genre } = require('../models');
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const { Dropbox } = require('dropbox');
require('dotenv').config();

// Khởi tạo Dropbox client
const dbx = new Dropbox({
  clientId: process.env.DROPBOX_CLIENT_ID,
  clientSecret: process.env.DROPBOX_CLIENT_SECRET,
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
});

// Hàm tạo liên kết trực tiếp từ Dropbox
function getDropboxDirectLink(shareLink) {
  return shareLink.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
}

exports.createSong = async (req, res) => {
  try {
    console.log('Starting createSong, headers:', req.headers);
    const uploadDir = path.join(__dirname, '../Uploads/songs');
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const busboy = Busboy({ headers: req.headers });
    let audio_file = null;
    let img_file = null;
    const fields = {};
    const fileBuffers = {};

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      console.log('Received file:', { fieldname, filename, mimeType });
      const fileExt = filename.split('.').pop();
      const newFileName = `${uuidv4()}.${fileExt}`;

      if (fieldname === 'audio_file') {
        if (!['audio/mpeg', 'audio/wav'].includes(mimeType)) {
          console.log('Invalid audio file type:', mimeType);
          file.resume();
          return res.status(400).json({ message: 'Chỉ hỗ trợ file MP3 hoặc WAV' });
        }
        audio_file = { name: newFileName };
        const chunks = [];
        file.on('data', (chunk) => {
          chunks.push(chunk);
        });
        file.on('end', () => {
          fileBuffers[fieldname] = Buffer.concat(chunks);
          console.log(`File ${fieldname} buffered in memory`);
        });
      } else if (fieldname === 'img_file') {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
          console.log('Invalid image file type:', mimeType);
          file.resume();
          return res.status(400).json({ message: 'Chỉ hỗ trợ file JPEG, PNG hoặc GIF' });
        }
        const savePath = path.join(uploadDir, newFileName);
        img_file = {
          path: savePath,
          url: `/Uploads/songs/${newFileName}`,
        };
        console.log('Image file info:', img_file);
        const writeStream = fs.createWriteStream(savePath);
        file.pipe(writeStream);
        writeStream.on('finish', () => {
          console.log('File saved to:', savePath);
        });
        writeStream.on('error', (error) => {
          console.error('Error saving file:', error);
        });
      } else {
        file.resume();
      }
    });

    busboy.on('finish', async () => {
      try {
        console.log('Busboy finished, fields:', fields);
        console.log('Files:', { audio_file, img_file });

        const { title, duration, release_date, artist_names, genre_id, is_downloadable } = fields;

        let parsed_artist_names;
        try {
          parsed_artist_names = JSON.parse(artist_names);
          console.log('Parsed artist_names:', parsed_artist_names);
        } catch (e) {
          console.error('Error parsing artist_names:', e);
          return res.status(400).json({ message: 'Danh sách ca sĩ không hợp lệ' });
        }

        // Validation
        if (!audio_file) {
          console.log('No audio file uploaded');
          return res.status(400).json({ message: 'Chưa upload file audio' });
        }
        if (!title || typeof title !== 'string' || title.length < 1 || title.length > 100) {
          console.log('Invalid title:', title);
          return res.status(400).json({ message: 'Tiêu đề bài hát không hợp lệ' });
        }
        if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
          console.log('Invalid duration:', duration);
          return res.status(400).json({ message: 'Thời lượng bài hát không hợp lệ' });
        }
        if (release_date && !/^\d{4}-\d{2}-\d{2}$/.test(release_date)) {
          console.log('Invalid release_date:', release_date);
          return res.status(400).json({ message: 'Ngày phát hành không hợp lệ' });
        }
        if (!parsed_artist_names || !Array.isArray(parsed_artist_names) || parsed_artist_names.length === 0) {
          console.log('Invalid artist_names:', parsed_artist_names);
          return res.status(400).json({ message: 'Phải cung cấp ít nhất một ca sĩ' });
        }
        if (!genre_id || isNaN(parseInt(genre_id))) {
          console.log('Invalid genre_id:', genre_id);
          return res.status(400).json({ message: 'Phải cung cấp một thể loại hợp lệ' });
        }
        if (is_downloadable && !['true', 'false'].includes(is_downloadable)) {
          console.log('Invalid is_downloadable:', is_downloadable);
          return res.status(400).json({ message: 'Giá trị is_downloadable không hợp lệ' });
        }

        // Kiểm tra nghệ sĩ
        const artistIds = [];
        for (const artist_name of parsed_artist_names) {
          const artist = await Artist.findOne({ where: { stage_name: artist_name } });
          console.log(`Artist lookup for ${artist_name}:`, artist ? artist.toJSON() : null);
          if (!artist) {
            return res.status(400).json({ message: `Ca sĩ ${artist_name} không tồn tại` });
          }
          artistIds.push(artist.artist_id);
        }

        // Kiểm tra thể loại
        const genre = await Genre.findByPk(genre_id);
        console.log('Genre lookup for genre_id:', genre_id, genre ? genre.toJSON() : null);
        if (!genre) {
          return res.status(400).json({ message: 'Thể loại không tồn tại' });
        }

        // Upload file audio lên Dropbox
        let audio_file_url = null;
        let audio_dropbox_path = null;
        if (audio_file && fileBuffers['audio_file']) {
          audio_dropbox_path = `/songs/${audio_file.name}`;
          await dbx.filesUpload({
            path: audio_dropbox_path,
            contents: fileBuffers['audio_file'],
            mode: 'add',
          });
          console.log('Uploaded audio to Dropbox:', audio_dropbox_path);

          // Tạo shared link và chuyển thành direct link
          const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
            path: audio_dropbox_path,
            settings: { requested_visibility: 'public' },
          });
          audio_file_url = getDropboxDirectLink(sharedLinkResponse.result.url);
          console.log('Audio direct link:', audio_file_url);
        }

        // Kiểm tra URL ảnh
        let img_url = null;
        if (img_file) {
          img_url = img_file.url;
          console.log('Checking img_url:', img_url);
          if (!img_url || typeof img_url !== 'string' || !img_url.startsWith('/Uploads/songs/')) {
            console.log('Image URL validation failed:', img_url);
            return res.status(400).json({ message: 'URL file ảnh không hợp lệ' });
          }
        }

        // Tạo bài hát trong cơ sở dữ liệu
        console.log('Creating song with data:', {
          title,
          duration: parseInt(duration),
          release_date: release_date || null,
          audio_file_url,
          audio_dropbox_path,
          img: img_file ? img_file.url : null,
          artist_id: artistIds[0],
          feat_artist_ids: artistIds.length > 1 ? JSON.stringify(artistIds.slice(1)) : null,
          genre_id: parseInt(genre_id),
          is_downloadable: is_downloadable === 'true',
          listen_count: 0,
        });

        const song = await Song.create({
          title,
          duration: parseInt(duration),
          release_date: release_date || null,
          audio_file_url,
          audio_dropbox_path,
          img: img_file ? img_file.url : null,
          artist_id: artistIds[0],
          feat_artist_ids: artistIds.length > 1 ? JSON.stringify(artistIds.slice(1)) : null,
          genre_id: parseInt(genre_id),
          is_downloadable: is_downloadable === 'true',
          listen_count: 0,
        });

        console.log('Song created:', song.toJSON());

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.status(201).json({
          message: 'Thêm bài hát thành công',
          song: {
            song_id: song.song_id,
            title,
            duration: song.duration,
            release_date: song.release_date,
            audio_file_url: song.audio_file_url,
            img: song.img ? `${baseUrl}${song.img}` : null,
            artist_id: song.artist_id,
            feat_artist_ids: song.feat_artist_ids ? JSON.parse(song.feat_artist_ids) : [],
            genre_id: song.genre_id,
            is_downloadable: song.is_downloadable,
            listen_count: song.listen_count,
          },
        });
      } catch (error) {
        console.error('Error in busboy finish:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
          const errors = error.errors ? error.errors.map((err) => err.message) : [error.message];
          return res.status(400).json({ message: 'Lỗi validation', errors });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
      }
    });

    req.pipe(busboy);
  } catch (error) {
    console.error('Error in createSong:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getSong = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    const song = await Song.findByPk(id, {
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

    if (!song) {
      return res.status(404).json({ message: 'Bài hát không tồn tại' });
    }

    const songData = song.toJSON();
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    songData.audio_file_url = songData.audio_file_url;
    songData.img = songData.img ? `${baseUrl}${songData.img}` : null;

    res.json({
      message: 'Lấy thông tin bài hát thành công',
      song: songData,
    });
  } catch (error) {
    console.error('Error in getSong:', error);
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map((err) => err.message);
      return res.status(400).json({ message: 'Lỗi validation', errors });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getAllSongs = async (req, res) => {
  try {
    console.log('Fetching songs with query:', req.query);
    const { page = 1, limit = 10, search = '' } = req.query;

    const whereSong = {};
    if (search) {
      whereSong.title = { [Op.like]: `%${search}%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const songs = await Song.findAll({
      where: whereSong,
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
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    console.log('Songs fetched:', songs.length);
    const total = await Song.count({ where: whereSong });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const processedSongs = await Promise.all(
      songs.map(async (song) => {
        const songData = song.toJSON();
        if (songData.feat_artist_ids) {
          const featIds = JSON.parse(songData.feat_artist_ids);
          const featArtists = await Artist.findAll({
            where: { artist_id: featIds },
            attributes: ['artist_id', 'stage_name', 'profile_picture'],
          });
          songData.artists = [songData.MainArtist, ...featArtists];
        } else {
          songData.artists = [songData.MainArtist];
        }
        delete songData.MainArtist;
        songData.genre = songData.Genre;
        delete songData.Genre;

        songData.audio_file_url = songData.audio_file_url;
        songData.img = songData.img ? `${baseUrl}${songData.img}` : null;

        return songData;
      })
    );

    res.json({
      message: 'Lấy danh sách bài hát thành công',
      songs: processedSongs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error in getAllSongs:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Starting updateSong, id:', id, 'headers:', req.headers);
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    const song = await Song.findByPk(id);
    if (!song) {
      return res.status(404).json({ message: 'Bài hát không tồn tại' });
    }

    const uploadDir = path.join(__dirname, '../Uploads/songs');
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const busboy = Busboy({ headers: req.headers });
    let audio_file = null;
    let img_file = null;
    const fields = {};
    const fileBuffers = {};

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      console.log('Received file:', { fieldname, filename, mimeType });
      const fileExt = filename.split('.').pop();
      const newFileName = `${uuidv4()}.${fileExt}`;

      if (fieldname === 'audio_file') {
        if (!['audio/mpeg', 'audio/wav'].includes(mimeType)) {
          console.log('Invalid audio file type:', mimeType);
          file.resume();
          return res.status(400).json({ message: 'Chỉ hỗ trợ file MP3 hoặc WAV' });
        }
        audio_file = { name: newFileName };
        const chunks = [];
        file.on('data', (chunk) => {
          chunks.push(chunk);
        });
        file.on('end', () => {
          fileBuffers[fieldname] = Buffer.concat(chunks);
          console.log(`File ${fieldname} buffered in memory`);
        });
      } else if (fieldname === 'img_file') {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
          console.log('Invalid image file type:', mimeType);
          file.resume();
          return res.status(400).json({ message: 'Chỉ hỗ trợ file JPEG, PNG hoặc GIF' });
        }
        const savePath = path.join(uploadDir, newFileName);
        img_file = {
          path: savePath,
          url: `/Uploads/songs/${newFileName}`,
        };
        console.log('Image file info:', img_file);
        const writeStream = fs.createWriteStream(savePath);
        file.pipe(writeStream);
        writeStream.on('finish', () => {
          console.log('File saved to:', savePath);
        });
        writeStream.on('error', (error) => {
          console.error('Error saving file:', error);
        });
      } else {
        file.resume();
      }
    });

    busboy.on('finish', async () => {
      try {
        console.log('Busboy finished, fields:', fields);
        console.log('Files:', { audio_file, img_file });

        const { title, duration, release_date, artist_names, genre_id, is_downloadable, listen_count } = fields;

        // Ngăn cập nhật trực tiếp listen_count
        if (listen_count !== undefined) {
          console.log('Attempt to update listen_count detected:', listen_count);
          return res.status(400).json({ message: 'Không được phép cập nhật trực tiếp lượt nghe' });
        }

        let parsed_artist_names;
        if (artist_names) {
          try {
            parsed_artist_names = JSON.parse(artist_names);
            console.log('Parsed artist_names:', parsed_artist_names);
          } catch (e) {
            console.error('Error parsing artist_names:', e);
            return res.status(400).json({ message: 'Danh sách ca sĩ không hợp lệ' });
          }
        }

        // Validation
        if (title && (typeof title !== 'string' || title.length < 1 || title.length > 100)) {
          console.log('Invalid title:', title);
          return res.status(400).json({ message: 'Tiêu đề bài hát không hợp lệ' });
        }
        if (duration && (isNaN(parseInt(duration)) || parseInt(duration) <= 0)) {
          console.log('Invalid duration:', duration);
          return res.status(400).json({ message: 'Thời lượng bài hát không hợp lệ' });
        }
        if (release_date && !/^\d{4}-\d{2}-\d{2}$/.test(release_date)) {
          console.log('Invalid release_date:', release_date);
          return res.status(400).json({ message: 'Ngày phát hành không hợp lệ' });
        }
        if (artist_names && (!parsed_artist_names || !Array.isArray(parsed_artist_names) || parsed_artist_names.length === 0)) {
          console.log('Invalid artist_names:', parsed_artist_names);
          return res.status(400).json({ message: 'Phải cung cấp ít nhất một ca sĩ' });
        }
        if (genre_id && isNaN(parseInt(genre_id))) {
          console.log('Invalid genre_id:', genre_id);
          return res.status(400).json({ message: 'Phải cung cấp một thể loại hợp lệ' });
        }
        if (is_downloadable && !['true', 'false'].includes(is_downloadable)) {
          console.log('Invalid is_downloadable:', is_downloadable);
          return res.status(400).json({ message: 'Giá trị is_downloadable không hợp lệ' });
        }

        // Kiểm tra nghệ sĩ
        let artistIds = [];
        if (parsed_artist_names) {
          for (const artist_name of parsed_artist_names) {
            const artist = await Artist.findOne({ where: { stage_name: artist_name } });
            console.log(`Artist lookup for ${artist_name}:`, artist ? artist.toJSON() : null);
            if (!artist) {
              return res.status(400).json({ message: `Ca sĩ ${artist_name} không tồn tại` });
            }
            artistIds.push(artist.artist_id);
          }
        }

        // Kiểm tra thể loại
        if (genre_id) {
          const genre = await Genre.findByPk(genre_id);
          console.log('Genre lookup for genre_id:', genre_id, genre ? genre.toJSON() : null);
          if (!genre) {
            return res.status(400).json({ message: 'Thể loại không tồn tại' });
          }
        }

        // Upload file audio lên Dropbox
        let audio_file_url = song.audio_file_url;
        let audio_dropbox_path = song.audio_dropbox_path;
        if (audio_file && fileBuffers['audio_file']) {
          audio_dropbox_path = `/songs/${audio_file.name}`;
          await dbx.filesUpload({
            path: audio_dropbox_path,
            contents: fileBuffers['audio_file'],
            mode: 'add',
          });
          console.log('Uploaded audio to Dropbox:', audio_dropbox_path);

          // Tạo shared link và chuyển thành direct link
          const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
            path: audio_dropbox_path,
            settings: { requested_visibility: 'public' },
          });
          audio_file_url = getDropboxDirectLink(sharedLinkResponse.result.url);
          console.log('Audio direct link:', audio_file_url);
        }

        // Xóa file ảnh cũ nếu có
        let oldImgFilePath = null;
        if (img_file && song.img) {
          oldImgFilePath = path.join(__dirname, '../', song.img);
        }

        // Cập nhật bài hát
        const updateData = {
          title: title || song.title,
          duration: duration ? parseInt(duration) : song.duration,
          release_date: release_date || song.release_date,
          audio_file_url,
          audio_dropbox_path,
          img: img_file ? img_file.url : song.img,
          artist_id: artistIds.length > 0 ? artistIds[0] : song.artist_id,
          feat_artist_ids: artistIds.length > 1 ? JSON.stringify(artistIds.slice(1)) : song.feat_artist_ids,
          genre_id: genre_id ? parseInt(genre_id) : song.genre_id,
          is_downloadable: is_downloadable ? is_downloadable === 'true' : song.is_downloadable,
        };

        console.log('Updating song with data:', updateData);
        await song.update(updateData);

        if (oldImgFilePath && fs.existsSync(oldImgFilePath)) {
          fs.unlinkSync(oldImgFilePath);
          console.log('Deleted old image file:', oldImgFilePath);
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const updatedSong = song.toJSON();
        updatedSong.audio_file_url = updatedSong.audio_file_url;
        updatedSong.img = updatedSong.img ? `${baseUrl}${updatedSong.img}` : null;
        updatedSong.feat_artist_ids = updatedSong.feat_artist_ids ? JSON.parse(updatedSong.feat_artist_ids) : [];

        res.json({
          message: 'Cập nhật bài hát thành công',
          song: updatedSong,
        });
      } catch (error) {
        console.error('Error in busboy finish:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
          const errors = error.errors ? error.errors.map((err) => err.message) : [error.message];
          return res.status(400).json({ message: 'Lỗi validation', errors });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
      }
    });

    req.pipe(busboy);
  } catch (error) {
    console.error('Error in updateSong:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Starting deleteSong, id:', id);

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    const song = await Song.findByPk(id);
    if (!song) {
      return res.status(404).json({ message: 'Bài hát không tồn tại' });
    }

    // Xóa file audio trên Dropbox
    if (song.audio_dropbox_path) {
      try {
        await dbx.filesDeleteV2({ path: song.audio_dropbox_path });
        console.log('Deleted audio file from Dropbox:', song.audio_dropbox_path);
      } catch (error) {
        console.error('Error deleting audio file from Dropbox:', error);
      }
    }

    // Xóa file ảnh cục bộ
    if (song.img) {
      const imgFilePath = path.join(__dirname, '../', song.img);
      if (fs.existsSync(imgFilePath)) {
        fs.unlinkSync(imgFilePath);
        console.log('Deleted image file:', imgFilePath);
      }
    }

    await song.destroy();
    console.log('Song deleted:', id);

    res.json({ message: 'Xóa bài hát thành công' });
  } catch (error) {
    console.error('Error in deleteSong:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};