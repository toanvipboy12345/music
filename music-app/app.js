
// const express = require('express');
// const cors = require('cors');
// const morgan = require('morgan');
// const path = require('path');
// const authRoutes = require('./routes/authRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const publicRoutes = require('./routes/publicRoutes');
// const userRoutes = require('./routes/userRoutes');
// const errorMiddleware = require('./middleware/errors');
// const { sequelize, User } = require('./models'); // Import từ index.js

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(morgan('dev'));

// // Serve static files
// app.use('/Uploads/songs', express.static(path.join(__dirname, 'Uploads/songs')));
// app.use('/Uploads/album', express.static(path.join(__dirname, 'Uploads/album')));
// app.use('/uploads/playlist', express.static(path.join(__dirname, 'Uploads/playlist')));

// // Routes
// app.use('/v1/auth', authRoutes);
// app.use('/v1/admin', adminRoutes);
// app.use('/v1/public', publicRoutes);
// app.use('/v1/user', userRoutes);

// // Error handling
// app.use(errorMiddleware);

// // Hàm seeding admin
// const seedAdminIfNotExists = async () => {
//   try {
//     const adminEmail = 'admin@musicapp.com';
//     const adminPassword = 'admin123';
//     console.log('Checking for existing admin with email:', adminEmail);
//     const existingAdmin = await User.findOne({ where: { email: adminEmail } });
//     if (!existingAdmin) {
//       await User.create({
//         username: 'admin12345',
//         email: adminEmail,
//         password: adminPassword,
//         role: 'admin',
//       });
//       console.log('Tài khoản admin đã được tạo thành công.');
//     } else {
//       console.log('Tài khoản admin đã tồn tại, bỏ qua seeding.');
//     }
//   } catch (error) {
//     console.error('Lỗi khi seeding admin:', {
//       name: error.name,
//       message: error.message,
//       stack: error.stack,
//     });
//   }
// };

// // Kết nối MySQL và seeding
// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Kết nối MySQL thành công');

//     // Đồng bộ tất cả model
//     await sequelize.sync({ logging: console.log });
//     console.log('Đồng bộ hóa cơ sở dữ liệu thành công');

//     await seedAdminIfNotExists();

//     app.listen(3000, () => console.log('Server chạy trên cổng 3000'));
//   } catch (error) {
//     console.error('Lỗi khi khởi động ứng dụng:', {
//       name: error.name,
//       message: error.message,
//       stack: error.stack,
//     });
//   }
// })();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { Dropbox } = require('dropbox');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const errorMiddleware = require('./middleware/errors');
const { sequelize, User, PremiumPlan, PremiumSubscription, SongListenStats } = require('./models');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files
app.use('/Uploads/songs', express.static(path.join(__dirname, 'Uploads/songs')));
app.use('/Uploads/album', express.static(path.join(__dirname, 'Uploads/album')));
app.use('/uploads/playlist', express.static(path.join(__dirname, 'Uploads/playlist')));

// Khởi tạo Dropbox instance
const dbx = new Dropbox({
  clientId: process.env.DROPBOX_CLIENT_ID,
  clientSecret: process.env.DROPBOX_CLIENT_SECRET,
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
});

// Kiểm tra Dropbox khi khởi động ứng dụng
(async () => {
  try {
    if (process.env.DROPBOX_REFRESH_TOKEN) {
      await dbx.usersGetCurrentAccount();
      console.log('Kết nối Dropbox thành công khi khởi động');
    } else {
      console.log('Chưa có DROPBOX_REFRESH_TOKEN trong .env. Vui lòng cấu hình refresh_token.');
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra Dropbox lúc khởi động:', error.message);
  }
})();

// Middleware kiểm tra kết nối Dropbox
app.use(async (req, res, next) => {
  try {
    if (process.env.DROPBOX_REFRESH_TOKEN) {
      await dbx.usersGetCurrentAccount();
      console.log('Kết nối Dropbox thành công cho request:', req.path);
    } else {
      console.warn('Chưa có DROPBOX_REFRESH_TOKEN trong .env. Vui lòng cấu hình refresh_token.');
    }
    next();
  } catch (error) {
    console.error('Lỗi Dropbox trong middleware:', error.message);
    next();
  }
});

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
        is_premium: false,
        premium_plan: null
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

// Hàm seeding gói Premium mặc định
const seedPremiumPlansIfNotExists = async () => {
  try {
    const existingPlans = await PremiumPlan.findOne();
    if (!existingPlans) {
      await PremiumPlan.bulkCreate([
        {
          plan_name: 'Cơ bản',
          description: 'Gói Cơ bản hỗ trợ tải nhạc và nội dung độc quyền',
          price: 100000.00,
          duration_days: 30,
          features: ['download_songs', 'exclusive_content']
        },
        {
          plan_name: 'Nâng cao',
          description: 'Gói Nâng cao hỗ trợ tất cả tính năng',
          price: 500000.00,
          duration_days: 365,
          features: ['download_songs', 'exclusive_content', 'queue_reorder', 'listening_stats']
        }
      ]);
      console.log('Các gói Premium mặc định đã được tạo thành công.');
    } else {
      console.log('Các gói Premium đã tồn tại, bỏ qua seeding.');
    }
  } catch (error) {
    console.error('Lỗi khi seeding gói Premium:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }
};

// Kết nối MySQL, Dropbox và seeding
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối MySQL thành công');

    // Đồng bộ tất cả model, thêm cột mới nếu cần
    await sequelize.sync({ alter: false, logging: console.log });
    console.log('Đồng bộ hóa cơ sở dữ liệu thành công');

    await seedAdminIfNotExists();
    await seedPremiumPlansIfNotExists();

    app.listen(3000, () => console.log('Server chạy trên cổng 3000'));
  } catch (error) {
    console.error('Lỗi khi khởi động ứng dụng:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }
})();