const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const errorMiddleware = require('./middleware/errors');
const sequelize = require('./config/database');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files
app.use('/uploads/songs', express.static(path.join(__dirname, 'Uploads/songs')));
app.use('/uploads/album', express.static(path.join(__dirname, 'uploads/album')));
app.use('/uploads/playlist', express.static(path.join(__dirname, 'uploads/playlist')));

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/admin', adminRoutes);
app.use('/v1/public', publicRoutes);
app.use('/v1/user', userRoutes);

// Error handling
app.use(errorMiddleware);

// Hàm seeding admin
const seedAdminIfNotExists = async () => {
  try {
    const adminEmail = 'admin@musicapp.com';
    const adminPassword = 'admin123';
    console.log('Checking for existing admin with email:', adminEmail);
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await User.create({
        username: 'admin12345',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('Tài khoản admin đã được tạo thành công.');
    } else {
      console.log('Tài khoản admin đã tồn tại, bỏ qua seeding.');
    }
  } catch (error) {
    console.error('Lỗi khi seeding admin:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }
};

// Kết nối MySQL và seeding
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối MySQL thành công');

    // Đồng bộ hóa với force: false, không sửa đổi bảng
    await sequelize.sync({ force: false, logging: console.log });
    console.log('Đồng bộ hóa cơ sở dữ liệu thành công');

    await seedAdminIfNotExists();

    app.listen(3000, () => console.log('Server chạy trên cổng 3000'));
  } catch (error) {
    console.error('Lỗi khi khởi động ứng dụng:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }
})();