const sequelize = require('../config/database');
const Song = require('./Song');
const Artist = require('./Artist');
const Genre = require('./Genre');
const User = require('./User');

// Định nghĩa các mối quan hệ
Song.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
Artist.hasMany(Song, { foreignKey: 'artist_id', as: 'Songs' });
Song.belongsTo(Genre, { foreignKey: 'genre_id', as: 'Genre' });
Genre.hasMany(Song, { foreignKey: 'genre_id', as: 'Songs' });

module.exports = {
  sequelize,
  Song,
  Artist,
  Genre,
  User
};