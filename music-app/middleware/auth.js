const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không có token' });

    jwt.verify(token, jwtConfig.secret, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token không hợp lệ' });
        req.user = user;
        next();
    });
};

module.exports = authenticateJWT;