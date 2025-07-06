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
      min: 0,
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
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 5000],
        msg: 'Tiểu sử không được vượt quá 5000 ký tự'
      }
    }
  },
follower: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 0,
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