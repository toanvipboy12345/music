const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserArtistFollows = sequelize.define('UserArtistFollows', {
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
  artist_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Artists',
      key: 'artist_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'UserArtistFollows',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'artist_id'],
    },
  ],
});

module.exports = UserArtistFollows;