const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PremiumSubscription = sequelize.define('PremiumSubscription', {
    subscription_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'PremiumPlans',
            key: 'plan_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: { msg: 'Ngày hết hạn phải là định dạng ngày hợp lệ' }
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'expired', 'cancelled']],
                msg: 'Trạng thái gói phải là active, expired hoặc cancelled'
            }
        }
    },
    vnpay_transaction_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        validate: {
            len: {
                args: [0, 50],
                msg: 'ID giao dịch VNPay không được vượt quá 50 ký tự'
            }
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'PremiumSubscriptions',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'status'],
            where: { status: 'active' }
        }
    ]
});

module.exports = PremiumSubscription;