const { User } = require('../models');

const isPremiumUser = async (req, res, next) => {
  try {
    console.log('Checking premium status for user_id:', req.user.user_id);
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
    console.log('Premium user authenticated:', req.user);
    next();
  } catch (error) {
    console.error('Error in isPremiumUser middleware:', error);
    return res.status(500).json({
      message: 'Lỗi khi kiểm tra trạng thái Premium',
      error: error.message,
    });
  }
};

module.exports = isPremiumUser;