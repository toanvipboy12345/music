const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email đã được sử dụng' });
        }

        const user = await User.create({ username, email, password, role: 'user' });
        res.status(201).json({ 
            message: 'Đăng ký thành công', 
            user: { id: user.user_id, username, email, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`Đăng nhập: Email = ${email}, Mật khẩu (chưa mã hóa) = ${password}`);

        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu không đúng' });
        }

        const token = jwt.sign({ id: user.user_id, role: user.role }, jwtConfig.secret, {
            expiresIn: jwtConfig.expiresIn
        });
        res.json({ message: 'Đăng nhập thành công', token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.logout = (req, res) => {
    try {
        res.json({ message: 'Đăng xuất thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.check = (req, res) => {
    try {
        if (req.user) {
            res.json({ message: 'Đã đăng nhập', user: { id: req.user.id, role: req.user.role } });
        } else {
            res.status(401).json({ message: 'Chưa đăng nhập' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};