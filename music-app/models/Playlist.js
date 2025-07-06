const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Playlist = sequelize.define('Playlist', {
  playlist_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [1, 100],
        msg: 'Tiêu đề playlist phải có độ dài từ 1 đến 100 ký tự'
      }
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'ID người dùng phải là số nguyên' }
    },
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  img: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    validate: {
      isBoolean: { msg: 'Chế độ công khai phải là giá trị boolean' }
    }
  },
  like_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,

  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Playlists',
  timestamps: false
});

module.exports = Playlist;