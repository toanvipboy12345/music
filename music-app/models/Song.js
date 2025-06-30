const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Song = sequelize.define('Song', {
  song_id: {
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
        msg: 'Tiêu đề bài hát phải có độ dài từ 1 đến 100 ký tự'
      }
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'Thời lượng phải là số nguyên' },
      min: { args: 1, msg: 'Thời lượng phải lớn hơn 0' }
    }
  },
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: { msg: 'Ngày phát hành phải là định dạng ngày hợp lệ' }
    }
  },
  audio_file_url: {
    type: DataTypes.STRING(255),
    allowNull: false,
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
  feat_artist_ids: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidJsonArray(value) {
        if (!value) return;
        try {
          const arr = JSON.parse(value);
          if (!Array.isArray(arr) || !arr.every(id => Number.isInteger(id))) {
            throw new Error('Danh sách ca sĩ feat phải là mảng JSON chứa các ID số nguyên');
          }
          if (this.artist_id && arr.includes(this.artist_id)) {
            throw new Error('Danh sách ca sĩ feat không được chứa ID ca sĩ chính');
          }
        } catch (e) {
          throw new Error('Danh sách ca sĩ feat không hợp lệ');
        }
      }
    }
  },
  genre_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'ID thể loại phải là số nguyên' }
    },
    references: {
      model: 'Genres',
      key: 'genre_id'
    }
  },
  is_downloadable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  listen_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,

  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Songs',
  timestamps: false
});

module.exports = Song;