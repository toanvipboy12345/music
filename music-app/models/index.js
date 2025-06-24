const sequelize = require('../config/database');
const Song = require('./Song');
const Artist = require('./Artist');
const Genre = require('./Genre');
const User = require('./User');
const Album = require('./Album');

// Định nghĩa các mối quan hệ
Song.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
Artist.hasMany(Song, { foreignKey: 'artist_id', as: 'Songs' });
Song.belongsTo(Genre, { foreignKey: 'genre_id', as: 'Genre' });
Genre.hasMany(Song, { foreignKey: 'genre_id', as: 'Songs' });

// Mối quan hệ cho Album
Song.belongsTo(Album, { foreignKey: 'album_id', as: 'Album' });
Album.hasMany(Song, { foreignKey: 'album_id', as: 'Songs' });
Album.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
Artist.hasMany(Album, { foreignKey: 'artist_id', as: 'Albums' });

module.exports = {
  sequelize,
  Song,
  Artist,
  Genre,
  User,
  Album
};