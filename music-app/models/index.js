
// const sequelize = require('../config/database');
// const Song = require('./Song');
// const Artist = require('./Artist');
// const Genre = require('./Genre');
// const User = require('./User');
// const Album = require('./Album');
// const Playlist = require('./Playlist');
// const PlaylistSong = require('./PlaylistSong');
// const SongQueue = require('./SongQueue');

// // Định nghĩa các mối quan hệ
// Song.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
// Artist.hasMany(Song, { foreignKey: 'artist_id', as: 'Songs' });
// Song.belongsTo(Genre, { foreignKey: 'genre_id', as: 'Genre' });
// Genre.hasMany(Song, { foreignKey: 'genre_id', as: 'Songs' });

// Song.belongsTo(Album, { foreignKey: 'album_id', as: 'Album' });
// Album.hasMany(Song, { foreignKey: 'album_id', as: 'Songs' });
// Album.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
// Artist.hasMany(Album, { foreignKey: 'artist_id', as: 'Albums' });

// Playlist.belongsToMany(Song, { through: PlaylistSong, foreignKey: 'playlist_id', as: 'Songs' });
// Song.belongsToMany(Playlist, { through: PlaylistSong, foreignKey: 'song_id', as: 'Playlists' });
// Playlist.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
// User.hasMany(Playlist, { foreignKey: 'user_id', as: 'Playlists' });

// SongQueue.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
// User.hasMany(SongQueue, { foreignKey: 'user_id', as: 'Queue' });
// SongQueue.belongsTo(Song, { foreignKey: 'song_id', as: 'Song' });
// Song.hasMany(SongQueue, { foreignKey: 'song_id', as: 'Queue' });

// module.exports = {
//   sequelize,
//   Song,
//   Artist,
//   Genre,
//   User,
//   Album,
//   Playlist,
//   PlaylistSong,
//   SongQueue
// };
const sequelize = require('../config/database');
const Song = require('./Song');
const Artist = require('./Artist');
const Genre = require('./Genre');
const User = require('./User');
const Album = require('./Album');
const Playlist = require('./Playlist');
const PlaylistSong = require('./PlaylistSong');
const SongQueue = require('./SongQueue');
const SongQueueHistory = require('./SongQueueHistory');

// Định nghĩa các mối quan hệ
Song.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
Artist.hasMany(Song, { foreignKey: 'artist_id', as: 'Songs' });
Song.belongsTo(Genre, { foreignKey: 'genre_id', as: 'Genre' });
Genre.hasMany(Song, { foreignKey: 'genre_id', as: 'Songs' });

Song.belongsTo(Album, { foreignKey: 'album_id', as: 'Album' });
Album.hasMany(Song, { foreignKey: 'album_id', as: 'Songs' });
Album.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
Artist.hasMany(Album, { foreignKey: 'artist_id', as: 'Albums' });

Playlist.belongsToMany(Song, { through: PlaylistSong, foreignKey: 'playlist_id', as: 'Songs' });
Song.belongsToMany(Playlist, { through: PlaylistSong, foreignKey: 'song_id', as: 'Playlists' });
Playlist.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(Playlist, { foreignKey: 'user_id', as: 'Playlists' });

SongQueue.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(SongQueue, { foreignKey: 'user_id', as: 'Queue' });
SongQueue.belongsTo(Song, { foreignKey: 'song_id', as: 'Song' });
Song.hasMany(SongQueue, { foreignKey: 'song_id', as: 'Queue' });

SongQueueHistory.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(SongQueueHistory, { foreignKey: 'user_id', as: 'QueueHistory' });
SongQueueHistory.belongsTo(Song, { foreignKey: 'song_id', as: 'Song' });
Song.hasMany(SongQueueHistory, { foreignKey: 'song_id', as: 'QueueHistory' });

module.exports = {
  sequelize,
  Song,
  Artist,
  Genre,
  User,
  Album,
  Playlist,
  PlaylistSong,
  SongQueue,
  SongQueueHistory
};