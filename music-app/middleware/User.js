const jwt = require('jsonwebtoken');

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

const isUser = (req, res, next) => {
  authenticateJWT(req, res, () => {
    if (req.user && req.user.user_id) {
      console.log('User authenticated:', req.user); // Debug user
      next();
    } else {
      console.log('Authentication failed: req.user is invalid');
      return res.status(403).json({ message: 'Yêu cầu xác thực người dùng' });
    }
  });
};

module.exports = isUser;