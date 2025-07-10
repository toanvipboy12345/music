const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PremiumPlan = sequelize.define('PremiumPlan', {
    plan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    plan_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: {
                args: [1, 50],
                msg: 'Tên gói phải có độ dài từ 1 đến 50 ký tự'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            min: { args: 0, msg: 'Giá gói phải lớn hơn hoặc bằng 0' }
        }
    },
    duration_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: 'Thời hạn gói phải là số nguyên' },
            min: { args: 1, msg: 'Thời hạn gói phải lớn hơn 0' }
        }
    },
    features: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
            isValidFeatures(value) {
                const validFeatures = [
                    'download_songs',
                    'exclusive_content',
                    'queue_reorder',
                    'listening_stats'
                ];
                if (!Array.isArray(value) || !value.every(f => validFeatures.includes(f))) {
                    throw new Error('Tính năng phải là mảng chứa các giá trị hợp lệ: download_songs, exclusive_content, queue_reorder, listening_stats');
                }
            }
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'PremiumPlans',
    timestamps: false
});

module.exports = PremiumPlan;