const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorMiddleware = require('./middleware/errors');
const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from uploads/songs
app.use('/uploads/songs', express.static(path.join(__dirname, 'uploads/songs')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorMiddleware);

// Hàm seeding admin nếu chưa tồn tại
const seedAdminIfNotExists = async () => {
    try {
        const adminEmail = 'admin@musicapp.com';
        const adminPassword = 'admin123'; // Mật khẩu chưa mã hóa
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });
        if (!existingAdmin) {
            await User.create({
                username: 'admin12345',
                email: adminEmail,
                password: adminPassword, // Truyền mật khẩu chưa mã hóa, để hook beforeCreate mã hóa
                role: 'admin'
            });
            console.log(`Tài khoản admin đã được tạo thành công với mật khẩu (chưa mã hóa): ${adminPassword}.`);
        } else {
            console.log('Tài khoản admin đã tồn tại, bỏ qua seeding.');
        }
    } catch (error) {
        console.error('Lỗi khi seeding admin:', error.message);
    }
};

// Kết nối MySQL và seeding admin
sequelize.authenticate()
    .then(async () => {
        console.log('Kết nối MySQL thành công');
        await seedAdminIfNotExists(); // Seeding admin khi khởi động lần đầu
        app.listen(3000, () => console.log('Server chạy trên cổng 3000'));
    })
    .catch(err => console.error('Lỗi kết nối MySQL:', err));

module.exports = app;