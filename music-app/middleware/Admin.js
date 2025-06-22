const authenticateJWT = require('./auth');

const isAdmin = (req, res, next) => {
    authenticateJWT(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Yêu cầu quyền admin' });
        }
    });
};

module.exports = isAdmin;