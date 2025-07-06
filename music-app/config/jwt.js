require('dotenv').config();

const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: undefined
};
module.exports = jwtConfig;