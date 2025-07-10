const { PremiumPlan, PremiumSubscription, User } = require('../models');
const { Op } = require('sequelize');

// Tạo gói Premium
exports.createPremiumPlan = async (req, res) => {
    try {
        const { plan_name, description, price, duration_days, features } = req.body;

        // Validate features
        const validFeatures = ['download_songs', 'exclusive_content', 'queue_reorder', 'listening_stats'];
        if (!features || !Array.isArray(features) || !features.every(f => validFeatures.includes(f))) {
            return res.status(400).json({ message: 'Tính năng phải là mảng chứa: download_songs, exclusive_content, queue_reorder, listening_stats' });
        }

        // Validate price
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ message: 'Giá phải là số không âm' });
        }

        const plan = await PremiumPlan.create({
            plan_name,
            description,
            price: parsedPrice,
            duration_days,
            features
        });

        return res.status(201).json({ message: 'Tạo gói Premium thành công', plan });
    } catch (error) {
        console.error('Error in createPremiumPlan:', error);
        return res.status(500).json({ message: 'Lỗi khi tạo gói Premium', error: error.message });
    }
};

// Cập nhật gói Premium
exports.updatePremiumPlan = async (req, res) => {
    try {
        const { plan_id } = req.params;
        const { plan_name, description, price, duration_days, features } = req.body;

        const plan = await PremiumPlan.findByPk(plan_id);
        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy gói Premium' });
        }

        // Validate inputs
        if (plan_name && typeof plan_name !== 'string') {
            return res.status(400).json({ message: 'Tên gói phải là chuỗi' });
        }

        let parsedPrice;
        if (price !== undefined) {
            parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice)) {
                return res.status(400).json({ message: 'Giá phải là số hợp lệ' });
            }
            if (parsedPrice < 0) {
                return res.status(400).json({ message: 'Giá phải là số không âm' });
            }
        }

        const parsedDuration = duration_days !== undefined ? parseInt(duration_days, 10) : undefined;
        if (parsedDuration !== undefined && (isNaN(parsedDuration) || parsedDuration <= 0)) {
            return res.status(400).json({ message: 'Thời hạn phải là số nguyên dương' });
        }

        const validFeatures = ['download_songs', 'exclusive_content', 'queue_reorder', 'listening_stats'];
        if (features && (!Array.isArray(features) || !features.every(f => validFeatures.includes(f)))) {
            return res.status(400).json({ message: 'Tính năng phải là mảng chứa: download_songs, exclusive_content, queue_reorder, listening_stats' });
        }

        await plan.update({
            plan_name: plan_name || plan.plan_name,
            description: description !== undefined ? description : plan.description,
            price: parsedPrice !== undefined ? parsedPrice : plan.price,
            duration_days: parsedDuration !== undefined ? parsedDuration : plan.duration_days,
            features: features || plan.features
        });

        return res.status(200).json({ message: 'Cập nhật gói Premium thành công', plan });
    } catch (error) {
        console.error('Error in updatePremiumPlan:', error);
        return res.status(500).json({ message: 'Lỗi khi cập nhật gói Premium', error: error.message });
    }
};

// Lấy danh sách gói Premium
exports.getPremiumPlans = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        const plans = await PremiumPlan.findAll();
        return res.status(200).json({ message: 'Danh sách gói Premium', plans });
    } catch (error) {
        console.error('Error in getPremiumPlans:', error);
        return res.status(500).json({ message: 'Lỗi khi lấy danh sách gói Premium', error: error.message });
    }
};

// Lấy chi tiết gói Premium
exports.getPremiumPlanById = async (req, res) => {
    try {
        const { plan_id } = req.params;
        const plan = await PremiumPlan.findByPk(plan_id);
        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy gói Premium' });
        }
        return res.status(200).json({ message: 'Chi tiết gói Premium', plan });
    } catch (error) {
        console.error('Error in getPremiumPlanById:', error);
        return res.status(500).json({ message: 'Lỗi khi lấy chi tiết gói Premium', error: error.message });
    }
};

// Lấy danh sách đăng ký Premium
exports.getPremiumSubscriptions = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        const { page = 1, limit = 10, user_id, status } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ message: 'Tham số page và limit phải là số nguyên dương' });
        }

        const where = {};
        if (user_id) {
            const userIdNum = parseInt(user_id, 10);
            if (isNaN(userIdNum)) {
                return res.status(400).json({ message: 'Tham số user_id phải là số nguyên' });
            }
            where.user_id = userIdNum;
        }
        if (status) {
            if (!['active', 'expired', 'cancelled'].includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
            }
            where.status = status;
        }

        const subscriptions = await PremiumSubscription.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['user_id', 'username', 'email'] },
                { model: PremiumPlan, as: 'plan', attributes: ['plan_id', 'plan_name', 'features'] }
            ],
            limit: limitNum,
            offset
        });

        return res.status(200).json({
            message: 'Danh sách đăng ký Premium',
            subscriptions: subscriptions.rows,
            total: subscriptions.count,
            page: pageNum,
            limit: limitNum
        });
    } catch (error) {
        console.error('Error in getPremiumSubscriptions:', error);
        return res.status(500).json({ message: 'Lỗi khi lấy danh sách đăng ký Premium', error: error.message });
    }
};

// Kích hoạt đăng ký Premium cho người dùng
exports.createPremiumSubscription = async (req, res) => {
    try {
        const { user_id, plan_id, end_date } = req.body;

        const user = await User.findByPk(user_id);
        if (!user) {
            console.log('User not found:', user_id);
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const plan = await PremiumPlan.findByPk(plan_id);
        if (!plan) {
            console.log('Plan not found:', plan_id);
            return res.status(404).json({ message: 'Không tìm thấy gói Premium' });
        }

        const activeSubscription = await PremiumSubscription.findOne({
            where: { user_id, status: 'active' }
        });
        if (activeSubscription) {
            console.log('Active subscription found for user:', user_id);
            return res.status(400).json({ message: 'Người dùng đã có gói Premium đang hoạt động' });
        }

        const subscription = await PremiumSubscription.create({
            user_id,
            plan_id,
            start_date: new Date(),
            end_date: new Date(end_date),
            status: 'active'
        });

        await user.update({
            is_premium: true,
            premium_plan: plan.plan_name.toLowerCase()
        });

        return res.status(201).json({ message: 'Kích hoạt đăng ký Premium thành công', subscription });
    } catch (error) {
        console.error('Error in createPremiumSubscription:', error);
        return res.status(500).json({ message: 'Lỗi khi kích hoạt đăng ký Premium', error: error.message });
    }
};

// Hủy đăng ký Premium
exports.cancelPremiumSubscription = async (req, res) => {
    try {
        const { subscription_id } = req.params;
        const subscription = await PremiumSubscription.findByPk(subscription_id);
        if (!subscription) {
            console.log('Subscription not found:', subscription_id);
            return res.status(404).json({ message: 'Không tìm thấy đăng ký Premium' });
        }

        await subscription.update({ status: 'cancelled' });

        const user = await User.findByPk(subscription.user_id);
        await user.update({ is_premium: false, premium_plan: null });

        return res.status(200).json({ message: 'Hủy đăng ký Premium thành công', subscription_id });
    } catch (error) {
        console.error('Error in cancelPremiumSubscription:', error);
        return res.status(500).json({ message: 'Lỗi khi hủy đăng ký Premium', error: error.message });
    }
};