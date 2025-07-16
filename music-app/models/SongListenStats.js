const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongListenStats = sequelize.define('SongListenStats', {
  song_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    validate: {
      isInt: { msg: 'ID bài hát phải là số nguyên' }
    },
    references: {
      model: 'Songs',
      key: 'song_id'
    }
  },
  period_start: {
    type: DataTypes.DATE,
    allowNull: false,
    primaryKey: true,
    validate: {
      isDate: { msg: 'Ngày bắt đầu thống kê phải là định dạng ngày giờ hợp lệ' }
    }
  },
  listen_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Số lượt nghe phải lớn hơn hoặc bằng 0' }
    }
  },
  previous_rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: { msg: 'Thứ hạng trước đó phải là số nguyên' },
      min: { args: [1], msg: 'Thứ hạng trước đó phải lớn hơn hoặc bằng 1' }
    }
  },
  current_rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: { msg: 'Thứ hạng hiện tại phải là số nguyên' },
      min: { args: [1], msg: 'Thứ hạng hiện tại phải lớn hơn hoặc bằng 1' }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'SongListenStats',
  timestamps: false,
  indexes: [
    { fields: ['song_id', 'period_start'] },
    { fields: ['period_start', 'listen_count'] }
  ]
});

module.exports = SongListenStats;