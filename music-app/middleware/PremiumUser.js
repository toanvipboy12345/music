const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth Header:', authHeader); // Debug header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header');
    return res.status(401).json({ message: 'Yêu cầu token xác thực' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || require('../config/jwt').secret);
    console.log('Decoded Token:', decoded); // Debug token payload
    if (!decoded.id) {
      console.log('Token does not contain id');
      return res.status(401).json({ message: 'Token không chứa id' });
    }
    req.user = {
      user_id: decoded.id, // Sử dụng decoded.id thay vì decoded.user_id
      role: decoded.role || 'user',
    };
    console.log('req.user set:', req.user); // Debug req.user
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const isPremiumUser = (req, res, next) => {
  authenticateJWT(req, res, async () => {
    if (!req.user || !req.user.user_id) {
      console.log('Authentication failed: req.user is invalid');
      return res.status(403).json({ message: 'Yêu cầu xác thực người dùng' });
    }

    try {
      // Lấy thông tin người dùng từ database để kiểm tra is_premium
      const user = await User.findByPk(req.user.user_id, {
        attributes: ['user_id', 'is_premium'],
      });

      if (!user) {
        console.log('User not found:', req.user.user_id);
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      if (!user.is_premium) {
        console.log('User is not premium:', req.user.user_id);
        return res.status(403).json({ message: 'Yêu cầu tài khoản Premium để thực hiện hành động này' });
      }

      console.log('Premium user authenticated:', req.user.user_id);
      next();
    } catch (error) {
      console.error('Error checking premium status:', error.message);
      return res.status(500).json({
        message: 'Lỗi khi kiểm tra trạng thái Premium',
        error: error.message,
      });
    }
  });
};

module.exports = isPremiumUser;