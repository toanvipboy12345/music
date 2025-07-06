const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPlaylistLikes = sequelize.define('UserPlaylistLikes', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Users',
      key: 'user_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  playlist_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Playlists',
      key: 'playlist_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'UserPlaylistLikes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'playlist_id'],
    },
  ],
});

module.exports = UserPlaylistLikes;