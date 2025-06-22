const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Artist = sequelize.define('Artist', {
  artist_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  stage_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Tên sân khấu đã tồn tại'
    },
    validate: {
      len: {
        args: [1, 100],
        msg: 'Tên sân khấu phải có độ dài từ 1 đến 100 ký tự'
      }
    }
  },
popularity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0, // Ràng buộc: popularity >= 0
    },
  },
  profile_picture: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Profile picture phải là URL hợp lệ'
      }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Artists',
  timestamps: false
});

module.exports = Artist;