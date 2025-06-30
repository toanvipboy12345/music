const authenticateJWT = require('./auth');

const isUser = (req, res, next) => {
    authenticateJWT(req, res, () => {
        if (req.user) {
            next();
        } else {
            res.status(403).json({ message: 'Yêu cầu xác thực người dùng' });
        }
    });
};

module.exports = isUser;