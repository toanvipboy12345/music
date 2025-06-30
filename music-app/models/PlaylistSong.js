const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlaylistSong = sequelize.define('PlaylistSong', {
  playlist_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Playlists',
      key: 'playlist_id'
    }
  },
  song_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Songs',
      key: 'song_id'
    }
  }
}, {
  tableName: 'PlaylistSongs',
  timestamps: false
});

module.exports = PlaylistSong;