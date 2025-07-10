const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import các model
const User = require('./User');
const Playlist = require('./Playlist');
const UserPlaylistLikes = require('./UserPlaylistLikes');
const Album = require('./Album');
const Artist = require('./Artist');
const Genre = require('./Genre');
const PlaylistSong = require('./PlaylistSong');
const Queue = require('./Queue');
const Song = require('./Song');
const UserArtistFollows = require('./UserArtistFollows');
const PremiumPlan = require('./PremiumPlan');
const PremiumSubscription = require('./PremiumSubscription');

// Định nghĩa các mối quan hệ
// Song ↔ Artist (1:N)
Song.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
Artist.hasMany(Song, { foreignKey: 'artist_id', as: 'Songs' });

// Song ↔ Genre (1:N)
Song.belongsTo(Genre, { foreignKey: 'genre_id', as: 'Genre' });
Genre.hasMany(Song, { foreignKey: 'genre_id', as: 'Songs' });

// Song ↔ Album (1:N)
Song.belongsTo(Album, { foreignKey: 'album_id', as: 'Album' });
Album.hasMany(Song, { foreignKey: 'album_id', as: 'Songs' });

// Album ↔ Artist (1:N)
Album.belongsTo(Artist, { foreignKey: 'artist_id', as: 'MainArtist' });
Artist.hasMany(Album, { foreignKey: 'artist_id', as: 'Albums' });

// Playlist ↔ Song (N:N qua PlaylistSong)
Playlist.belongsToMany(Song, { through: PlaylistSong, foreignKey: 'playlist_id', as: 'Songs' });
Song.belongsToMany(Playlist, { through: PlaylistSong, foreignKey: 'song_id', as: 'Playlists' });

// Playlist ↔ User (1:N)
Playlist.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(Playlist, { foreignKey: 'user_id', as: 'Playlists' });

// Queue ↔ User (1:N)
Queue.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(Queue, { foreignKey: 'user_id', as: 'Queue' });

// Queue ↔ Song (1:N)
Queue.belongsTo(Song, { foreignKey: 'song_id', as: 'Song' });
Song.hasMany(Queue, { foreignKey: 'song_id', as: 'Queue' });

// User ↔ Playlist (N:N qua UserPlaylistLikes)
User.belongsToMany(Playlist, { through: UserPlaylistLikes, foreignKey: 'user_id', as: 'LikedPlaylists' });
Playlist.belongsToMany(User, { through: UserPlaylistLikes, foreignKey: 'playlist_id', as: 'LikedByUsers' });

// User ↔ Artist (N:N qua UserArtistFollows)
User.belongsToMany(Artist, { through: UserArtistFollows, foreignKey: 'user_id', as: 'FollowedArtists' });
Artist.belongsToMany(User, { through: UserArtistFollows, foreignKey: 'artist_id', as: 'Followers' });

// User ↔ PremiumSubscription (1:N)
User.hasMany(PremiumSubscription, { foreignKey: 'user_id', as: 'subscriptions' });
PremiumSubscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// PremiumPlan ↔ PremiumSubscription (1:N)
PremiumPlan.hasMany(PremiumSubscription, { foreignKey: 'plan_id', as: 'subscriptions' });
PremiumSubscription.belongsTo(PremiumPlan, { foreignKey: 'plan_id', as: 'plan' });

// Export tất cả model
module.exports = {
  sequelize,
  User,
  Playlist,
  UserPlaylistLikes,
  Album,
  Artist,
  Genre,
  PlaylistSong,
  Queue,
  Song,
  UserArtistFollows,
  PremiumPlan,
  PremiumSubscription
};