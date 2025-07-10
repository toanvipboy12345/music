const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: {
                args: [3, 50],
                msg: 'Tên người dùng phải có độ dài từ 3 đến 50 ký tự'
            }
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Email không hợp lệ'
            },
            is: {
                args: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                msg: 'Email không hợp lệ'
            }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: {
                args: [6, 255],
                msg: 'Mật khẩu phải có ít nhất 6 ký tự'
            }
        }
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: {
                args: [2, 100],
                msg: 'Họ tên phải có độ dài từ 2 đến 100 ký tự'
            }
        }
    },
    avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'https://cdn.vectorstock.com/i/1000v/51/99/icon-of-user-avatar-for-web-site-or-mobile-app-vector-3125199.jpg'
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user'
    },
    is_premium: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            isBoolean: { msg: 'Trạng thái Premium phải là giá trị boolean' }
        }
    },
    premium_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Users',
    timestamps: false
});

User.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

module.exports = User;