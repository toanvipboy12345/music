const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongQueue = sequelize.define('SongQueue', {
  queue_id: {
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
    }
  },
  song_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Songs',
      key: 'song_id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 1, msg: 'Vị trí phải lớn hơn 0' }
    }
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'SongQueue',
  timestamps: false,
  indexes: [
    { fields: ['user_id', 'position'], unique: true }
  ]
});

module.exports = SongQueue;