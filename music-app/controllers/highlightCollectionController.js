const { Artist, Song, Album } = require('../models');
const { Sequelize, Op } = require('sequelize');

// Lấy danh sách 10 tuyển tập nổi bật ngẫu nhiên của các ca sĩ (popularity > 50)
const getHighlightCollections = async (req, res) => {
  try {
    const artists = await Artist.findAll({
      where: { popularity: { [Op.gt]: 50 } },
      attributes: ['artist_id', 'stage_name', 'popularity', 'profile_picture', 'created_at'],
      order: Sequelize.literal('RAND()'),
      limit: 10
    });

    const collections = artists.map(artist => ({
      artist_id: artist.artist_id,
      title: `This Is ${artist.stage_name}`,
      artist_name: artist.stage_name,
      img: artist.profile_picture,
      popularity: artist.popularity,
      created_at: artist.created_at
    }));

    res.status(200).json({
      status: 'success',
      data: collections
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Lấy chi tiết tuyển tập (10 bài hát ngẫu nhiên của ca sĩ)
const getHighlightCollectionByArtist = async (req, res) => {
  try {
    const { artist_id } = req.params;
    const artist = await Artist.findByPk(artist_id, {
      attributes: ['artist_id', 'stage_name', 'popularity', 'profile_picture', 'created_at']
    });

    if (!artist) {
      return res.status(404).json({ status: 'error', message: 'Ca sĩ không tồn tại' });
    }

    // Lấy 10 bài hát ngẫu nhiên của ca sĩ, bao gồm thông tin album
    const songs = await Song.findAll({
      where: { artist_id },
      order: Sequelize.literal('RAND()'),
      limit: 10,
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
        'created_at'
      ],
      include: [
        {
          model: Album,
          as: 'Album',
          attributes: ['title'],
          required: false
        }
      ]
    });

    // Xử lý danh sách bài hát để thêm thông tin ca sĩ feat
    const songsWithFeats = await Promise.all(
      songs.map(async (song) => {
        let featArtists = [];
        if (song.feat_artist_ids) {
          try {
            const featIds = JSON.parse(song.feat_artist_ids);
            if (Array.isArray(featIds) && featIds.length > 0) {
              const artists = await Artist.findAll({
                where: { artist_id: { [Op.in]: featIds } },
                attributes: ['stage_name']
              });
              featArtists = artists.map(artist => artist.stage_name);
            }
          } catch (e) {
            console.error(`Lỗi khi parse feat_artist_ids cho bài hát ${song.song_id}:`, e.message);
          }
        }

        return {
          song_id: song.song_id,
          title: song.title,
          duration: song.duration,
          release_date: song.release_date,
          audio_file_url: song.audio_file_url,
          img: song.img,
          artist_id: song.artist_id,
          feat_artists: featArtists,
          album_name: song.Album ? song.Album.title : null,
          is_downloadable: song.is_downloadable,
          created_at: song.created_at
        };
      })
    );

    const collection = {
      artist_id: artist.artist_id,
      title: `This Is ${artist.stage_name}`,
      artist_name: artist.stage_name,
      img: artist.profile_picture,
      popularity: artist.popularity,
      created_at: artist.created_at
    };

    res.status(200).json({
      status: 'success',
      data: { collection, songs: songsWithFeats }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getHighlightCollections,
  getHighlightCollectionByArtist
};