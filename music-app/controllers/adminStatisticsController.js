const { Sequelize, Op } = require('sequelize');
const { User, Artist, Song, Album, Genre, PremiumPlan, PremiumSubscription, DownloadHistory } = require('../models');

exports.getStatistics = async (req, res) => {
  try {
    // Thống kê tổng số album
    const albumStats = await Album.findOne({
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('*')), 'total_albums']],
    });

    // Thống kê tổng số nghệ sĩ
    const artistStats = await Artist.findOne({
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('*')), 'total_artists']],
    });

    // Thống kê tổng số bài hát
    const songStats = await Song.findOne({
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('*')), 'total_songs']],
    });

    // Thống kê tổng số người dùng
    const userStats = await User.findOne({
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('*')), 'total_users']],
    });

    // Top 10 bài hát có nhiều lượt tải nhất
    const topDownloadedSongs = await DownloadHistory.findAll({
      attributes: [
        [Sequelize.col('DownloadHistory.song_id'), 'song_id'],
        [Sequelize.fn('COUNT', Sequelize.col('DownloadHistory.song_id')), 'download_count'],
      ],
      include: [
        {
          model: Song,
          as: 'Song',
          attributes: ['title', 'img'],
        },
      ],
      group: ['DownloadHistory.song_id', 'Song.song_id'],
      order: [[Sequelize.literal('download_count'), 'DESC']],
      limit: 10,
    });

    // Chuẩn hóa dữ liệu trả về
    const response = {
      albums: {
        total_albums: Number(albumStats.get('total_albums')),
      },
      artists: {
        total_artists: Number(artistStats.get('total_artists')),
      },
      users: {
        total_users: Number(userStats.get('total_users')),
      },
      songs: {
        total_songs: Number(songStats.get('total_songs')),
        top_downloaded_songs: topDownloadedSongs.map((item) => ({
          song_id: item.song_id,
          title: item.Song.title,
          img: item.Song.img ? `${req.protocol}://${req.get('host')}${item.Song.img}` : null,
          download_count: Number(item.get('download_count')),
        })),
      },
    };

    res.json({
      message: 'Lấy thống kê thành công',
      data: response,
    });
  } catch (error) {
    console.error('Get statistics error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê', error: error.message });
  }
};

exports.getTotalRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Xây dựng điều kiện lọc theo thời gian
    const whereClause = {
      status: 'active', // Chỉ tính các giao dịch active
    };

    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.created_at[Op.lte] = new Date(endDate);
      }
    }

    // Tính tổng doanh thu
    const revenueStats = await PremiumSubscription.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('plan.price')), 'total_revenue'],
      ],
      include: [
        {
          model: PremiumPlan,
          as: 'plan',
          attributes: [],
        },
      ],
      where: whereClause,
      raw: true,
    });

    // Tính doanh thu theo tháng
    const revenueByMonth = await PremiumSubscription.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('PremiumSubscription.created_at'), '%Y-%m'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('plan.price')), 'total_revenue'],
      ],
      include: [
        {
          model: PremiumPlan,
          as: 'plan',
          attributes: [],
        },
      ],
      where: whereClause,
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('PremiumSubscription.created_at'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('PremiumSubscription.created_at'), '%Y-%m'), 'ASC']],
      raw: true,
    });

    const totalRevenue = revenueStats.total_revenue ? Number(revenueStats.total_revenue) : 0;

    res.json({
      message: 'Lấy tổng doanh thu thành công',
      data: {
        total_revenue: totalRevenue,
        revenue_by_month: revenueByMonth.map(item => ({
          month: item.month,
          total_revenue: Number(item.total_revenue),
        })),
        filters: {
          start_date: startDate || null,
          end_date: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Get total revenue error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server khi lấy tổng doanh thu', error: error.message });
  }
};

exports.getRevenueByPlan = async (req, res) => {
  try {
    // Tính tổng doanh thu theo từng gói
    const revenueByPlan = await PremiumSubscription.findAll({
      attributes: [
        [Sequelize.col('plan.plan_id'), 'plan_id'],
        [Sequelize.col('plan.plan_name'), 'plan_name'],
        [Sequelize.fn('SUM', Sequelize.col('plan.price')), 'total_revenue'],
        [Sequelize.fn('COUNT', Sequelize.col('PremiumSubscription.subscription_id')), 'subscription_count'],
      ],
      include: [
        {
          model: PremiumPlan,
          as: 'plan',
          attributes: [],
        },
      ],
      where: {
        status: 'active', // Chỉ tính các giao dịch active
      },
      group: ['plan.plan_id', 'plan.plan_name'],
      order: [[Sequelize.literal('total_revenue'), 'DESC']],
      raw: true,
    });

    // Chuẩn hóa dữ liệu trả về
    const formattedRevenue = revenueByPlan.map((item) => ({
      plan_id: item.plan_id,
      plan_name: item.plan_name,
      total_revenue: Number(item.total_revenue),
      subscription_count: Number(item.subscription_count),
    }));

    res.json({
      message: 'Lấy doanh thu theo gói thành công',
      data: formattedRevenue,
    });
  } catch (error) {
    console.error('Get revenue by plan error:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server khi lấy doanh thu theo gói', error: error.message });
  }
};

module.exports = exports;