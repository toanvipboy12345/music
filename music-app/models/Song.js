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
    validate: {
      isUrl: { msg: 'URL bài hát phải là URL hợp lệ' }
    }
  },
  img: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: { msg: 'URL ảnh bài hát phải là URL hợp lệ' }
    }
  },
  artist_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'ID ca sĩ chính phải là số nguyên' }
    }
  },
  feat_artist_ids: {
    type: DataTypes.STRING, // JSON string, ví dụ: "[2,3]", chỉ chứa ID ca sĩ feat
    allowNull: true, // Cho phép null vì bài hát có thể không có ca sĩ feat
    validate: {
      isValidJsonArray(value) {
        if (!value) return; // Cho phép null hoặc chuỗi rỗng
        try {
          const arr = JSON.parse(value);
          if (!Array.isArray(arr) || !arr.every(id => Number.isInteger(id))) {
            throw new Error('Danh sách ca sĩ feat phải là mảng JSON chứa các ID số nguyên');
          }
          // Kiểm tra feat_artist_ids không chứa artist_id
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
    }
  },
  is_downloadable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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