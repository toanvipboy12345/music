const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Sequelize = require('sequelize');

exports.register = async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /auth/register called with body:`, req.body);
  try {
    const { username, email, password } = req.body;

    // Kiểm tra trường trống
    if (!username || !email || !password) {
      console.log('Validation failed: Missing required fields', { username, email, password });
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra email đã tồn tại
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    // Kiểm tra username đã tồn tại
    console.log('Checking for existing user with username:', username);
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      console.log('Username already exists:', username);
      return res.status(409).json({ message: 'Tên người dùng đã được sử dụng' });
    }

    // Tạo người dùng (hook beforeCreate sẽ mã hóa mật khẩu)
    console.log('Creating user with:', { username, email });
    const user = await User.create({ username, email, password, role: 'user' });
    console.log('User created successfully:', {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { id: user.user_id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
   console.error('Register error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors ? error.errors.map((err) => ({
        message: err.message,
        type: err.type,
        path: err.path,
        value: err.value,
      })) : null,
    });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email hoặc tên người dùng đã được sử dụng' });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: error.errors.map((err) => err.message),
      });
    }
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ message: 'Lỗi cơ sở dữ liệu', error: error.message });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.login = async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /auth/login called with body:`, req.body);
  try {
    const { email, username, password } = req.body;

    console.log(`Đăng nhập: Email/Username = ${email || username}, Mật khẩu (chưa mã hóa) = ${password}`);

    if (!password) {
      console.log('Validation failed: Missing password', { email, username, password });
      return res.status(400).json({ message: 'Vui lòng điền mật khẩu' });
    }

    if (!email && !username) {
      console.log('Validation failed: Missing email or username', { email, username });
      return res.status(400).json({ message: 'Vui lòng điền email hoặc tên người dùng' });
    }

    // Tạo whereClause, chỉ thêm các trường không rỗng
    const whereClause = {};
    if (email && email.trim()) whereClause['email'] = email.trim();
    if (username && username.trim()) whereClause['username'] = username.trim();

    const user = await User.findOne({ where: whereClause });
    if (!user) {
      console.log('User not found:', { email, username });
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', { email: user.email, username: user.username });
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign({ id: user.user_id, role: user.role }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
    console.log('Login successful, token generated:', { userId: user.user_id, role: user.role });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      role: user.role,
      user: { id: user.user_id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
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