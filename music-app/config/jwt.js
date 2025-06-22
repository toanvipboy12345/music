require('dotenv').config();

const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h' // Token hết hạn sau 1 giờ
};
module.exports = jwtConfig;