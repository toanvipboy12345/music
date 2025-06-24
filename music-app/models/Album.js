const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Album = sequelize.define('Album', {
  album_id: {
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
        msg: 'Tên album phải có độ dài từ 1 đến 100 ký tự'
      }
    }
  },
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: { msg: 'Ngày phát hành phải là định dạng ngày hợp lệ' }
    }
  },
  img: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  artist_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'ID ca sĩ chính phải là số nguyên' }
    },
    references: {
      model: 'Artists',
      key: 'artist_id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Albums',
  timestamps: false
});

module.exports = Album;