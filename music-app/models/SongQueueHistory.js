const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongQueueHistory = sequelize.define('SongQueueHistory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    },
    validate: {
      isInt: { msg: 'ID người dùng phải là số nguyên' }
    }
  },
  song_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Songs',
      key: 'song_id'
    },
    validate: {
      isInt: { msg: 'ID bài hát phải là số nguyên' }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'SongQueueHistory',
  timestamps: true,
  updatedAt: false
});

module.exports = SongQueueHistory;