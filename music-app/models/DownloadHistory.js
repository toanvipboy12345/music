const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DownloadHistory = sequelize.define('DownloadHistory', {
  download_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  song_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Songs',
      key: 'song_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  downloaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'DownloadHistories',
  timestamps: false,
});

module.exports = DownloadHistory;