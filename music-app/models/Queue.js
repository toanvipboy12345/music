const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Queue = sequelize.define('Queue', {
  queue_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'user_id không được để trống',
      },
      isInt: {
        msg: 'user_id phải là số nguyên',
      },
    },
  },
  song_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'song_id không được để trống',
      },
      isInt: {
        msg: 'song_id phải là số nguyên',
      },
    },
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: {
        msg: 'position phải là số nguyên',
      },
      min: {
        args: [0],
        msg: 'position phải lớn hơn hoặc bằng 0',
      },
    },
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Tiêu đề không được để trống',
      },
      len: {
        args: [1, 255],
        msg: 'Tiêu đề phải có độ dài từ 1 đến 255 ký tự',
      },
    },
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Thời lượng không được để trống',
      },
      isInt: {
        msg: 'Thời lượng phải là số nguyên',
      },
      min: {
        args: [0],
        msg: 'Thời lượng phải lớn hơn hoặc bằng 0',
      },
    },
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
      notNull: {
        msg: 'artist_id không được để trống',
      },
      isInt: {
        msg: 'artist_id phải là số nguyên',
      },
    },
  },
  artist_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Tên nghệ sĩ không được để trống',
      },
      len: {
        args: [1, 100],
        msg: 'Tên nghệ sĩ phải có độ dài từ 1 đến 100 ký tự',
      },
    },
  },
  feat_artists: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  album_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Queue',
  timestamps: false,
  hooks: {
    beforeUpdate: async (queue, options) => {
      console.log('Running beforeUpdate hook for queue_id:', queue.queue_id);
      if (queue.is_current && queue.user_id && queue.queue_id) {
        console.log('Setting is_current=false for other queue items, user_id:', queue.user_id, 'queue_id:', queue.queue_id);
        await Queue.update(
          { is_current: false },
          {
            where: {
              user_id: queue.user_id,
              queue_id: { [Op.ne]: queue.queue_id },
            },
            transaction: options.transaction,
          }
        );
        console.log('Successfully set is_current=false for other queue items');
      } else {
        console.log('Skipping beforeUpdate: missing user_id or queue_id', { user_id: queue.user_id, queue_id: queue.queue_id });
      }
    },
  },
});

module.exports = Queue;