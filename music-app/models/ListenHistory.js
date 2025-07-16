const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ListenHistory = sequelize.define('ListenHistory', {
  history_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  song_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'ID bài hát phải là số nguyên' }
    },
    references: {
      model: 'Songs',
      key: 'song_id'
    }
  }
}, {
  tableName: 'ListenHistory',
  timestamps: true, // Bật timestamps để tự động thêm createdAt và updatedAt
  hooks: {
    // Hook beforeCreate để giới hạn lịch sử nghe tối đa 20 bài
    beforeCreate: async (history, options) => {
      const historyCount = await ListenHistory.count({
        where: { user_id: history.user_id }
      });

      if (historyCount >= 20) {
        // Xóa bản ghi cũ nhất dựa trên createdAt
        const oldestHistory = await ListenHistory.findOne({
          where: { user_id: history.user_id },
          order: [['createdAt', 'ASC']]
        });

        if (oldestHistory) {
          await oldestHistory.destroy();
        }
      }
    }
  }
});

module.exports = ListenHistory;