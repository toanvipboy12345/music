
const { PremiumPlan, PremiumSubscription, User } = require('../models');
const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');
const sequelize = require('../config/database');

// Hàm sắp xếp object theo key và chuẩn hóa giá trị
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = String(obj[key]);
    }
    return sorted;
}

// Hàm tạo checksum cho VNPay
const createVnpayChecksum = (data, secretKey) => {
    const signData = Object.keys(data)
        .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
        .join('&');
    console.log('Checksum Input String:', signData);
    console.log('Secret Key Used (first 4 chars):', secretKey.substring(0, 4));
    const hmac = crypto.createHmac('sha512', secretKey);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    console.log('Generated Secure Hash:', secureHash);
    return secureHash;
};

// Kiểm tra biến môi trường ngay khi khởi động
const requiredEnv = ['VNPAY_TMN_CODE', 'VNPAY_HASH_SECRET', 'VNPAY_URL', 'VNPAY_RETURN_URL', 'VNPAY_IPN_URL', 'FRONTEND_URL'];
requiredEnv.forEach((env) => {
    if (!process.env[env]) {
        throw new Error(`Missing environment variable: ${env}`);
    }
});

// Lấy danh sách gói Premium cho người dùng
exports.getPublicPremiumPlans = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        const plans = await PremiumPlan.findAll({
            attributes: ['plan_id', 'plan_name', 'description', 'price', 'duration_days', 'features']
        });
        return res.status(200).json({
            message: 'Danh sách gói Premium dành cho người dùng',
            plans
        });
    } catch (error) {
        console.error('Error in getPublicPremiumPlans:', error);
        return res.status(500).json({
            message: 'Lỗi khi lấy danh sách gói Premium',
            error: error.message,
            stack: error.stack
        });
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
        return res.status(500).json({
            message: 'Lỗi khi lấy chi tiết gói Premium',
            error: error.message,
            stack: error.stack
        });
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

        // Sử dụng trực tiếp plan_name từ PremiumPlan
        const premiumPlanValue = plan.plan_name.trim().toLowerCase();
        console.log('Plan_name used for premium_plan:', premiumPlanValue);

        await user.update({
            is_premium: true,
            premium_plan: premiumPlanValue
        });

        return res.status(201).json({ message: 'Kích hoạt đăng ký Premium thành công', subscription });
    } catch (error) {
        console.error('Error in createPremiumSubscription:', error);
        return res.status(500).json({
            message: 'Lỗi khi kích hoạt đăng ký Premium',
            error: error.message,
            stack: error.stack
        });
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
        return res.status(500).json({
            message: 'Lỗi khi hủy đăng ký Premium',
            error: error.message,
            stack: error.stack
        });
    }
};

// Tạo URL thanh toán VNPay
exports.createVnpayPayment = async (req, res) => {
    try {
        const { user_id, plan_id, bankCode } = req.body;
        console.log('VNPay Request:', { user_id, plan_id, bankCode });

        // Lấy biến môi trường
        const tmnCode = process.env.VNPAY_TMN_CODE;
        const secretKey = process.env.VNPAY_HASH_SECRET;
        const vnpUrl = process.env.VNPAY_URL;
        const returnUrl = process.env.VNPAY_RETURN_URL; // Dùng VNPAY_RETURN_URL để redirect về backend

        // Kiểm tra người dùng
        const user = await User.findByPk(user_id);
        if (!user) {
            console.log('User not found:', user_id);
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Kiểm tra gói Premium
        const plan = await PremiumPlan.findByPk(plan_id);
        if (!plan) {
            console.log('Plan not found:', plan_id);
            return res.status(404).json({ message: 'Không tìm thấy gói Premium' });
        }
        console.log('Plan Data:', { plan_id, plan_name: plan.plan_name, price: plan.price, type: typeof plan.price });

        // Kiểm tra gói Premium đang hoạt động
        const activeSubscription = await PremiumSubscription.findOne({
            where: { user_id, status: 'active' }
        });
        if (activeSubscription) {
            console.log('Active subscription found for user:', user_id);
            return res.status(400).json({ message: 'Người dùng đã có gói Premium đang hoạt động' });
        }

        // Tạo tham số thanh toán VNPay
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const expireDate = moment(date).add(30, 'minutes').format('YYYYMMDDHHmmss');

        // Xử lý IP address
        let ipAddr = (req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket?.remoteAddress ||
            req.connection.socket?.remoteAddress ||
            '127.0.0.1').split(',')[0].trim();
        if (ipAddr.startsWith('::ffff:')) {
            ipAddr = ipAddr.substring(7);
        } else if (ipAddr === '::1') {
            ipAddr = '127.0.0.1';
        }
        console.log('Detected IP Address:', ipAddr);

        const orderId = `PREMIUM_${user_id}_${plan_id}_${Date.now()}`;
        const amount = Math.round(Number(plan.price) * 100); // VNPay yêu cầu *100
        const locale = 'vn';
        const currCode = 'VND';

        const cleanPlanName = plan.plan_name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        console.log('Cleaned Plan Name:', cleanPlanName);

        let vnpayParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: currCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: encodeURIComponent(`Thanh toan goi ${cleanPlanName} cho user ${user_id}`).replace(/%20/g, '+'),
            vnp_OrderType: 'other',
            vnp_Amount: String(amount),
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate
        };

        if (bankCode) {
            vnpayParams.vnp_BankCode = bankCode;
            console.log('Bank Code Added:', bankCode);
        }

        console.log('VNPay Params (before sort):', vnpayParams);

        const checksumParams = sortObject(vnpayParams);
        console.log('VNPay Params (sorted):', checksumParams);

        const secureHash = createVnpayChecksum(checksumParams, secretKey);

        const urlParams = { ...checksumParams, vnp_SecureHash: secureHash };
        console.log('URL Params (before encode):', urlParams);

        const queryString = Object.keys(urlParams)
            .map(key => `${key}=${encodeURIComponent(urlParams[key]).replace(/%20/g, '+')}`)
            .join('&');
        const finalUrl = `${vnpUrl}?${queryString}`;
        console.log('Generated Payment URL:', finalUrl);

        return res.status(200).json({ message: 'Tạo URL thanh toán VNPay thành công', paymentUrl: finalUrl });
    } catch (error) {
        console.error('Error in createVnpayPayment:', error);
        return res.status(500).json({
            message: 'Lỗi khi tạo URL thanh toán VNPay',
            error: error.message,
            stack: error.stack
        });
    }
};

// Xử lý VNPay Return
exports.handleVnpayReturn = async (req, res) => {
    console.log('VNPay Return Called at:', new Date().toISOString());
    console.log('VNPay Return Params:', req.query);
    try {
        let vnpayParams = { ...req.query };
        const secureHash = vnpayParams.vnp_SecureHash;
        delete vnpayParams.vnp_SecureHash;
        delete vnpayParams.vnp_SecureHashType;

        vnpayParams = sortObject(vnpayParams);
        console.log('VNPay Return Params (sorted):', vnpayParams);

        const secretKey = process.env.VNPAY_HASH_SECRET;
        const calculatedSecureHash = createVnpayChecksum(vnpayParams, secretKey);
        console.log('Checksum Validation:', { secureHash, calculatedSecureHash });

        if (secureHash !== calculatedSecureHash) {
            console.log('Invalid checksum in VNPay Return');
            const queryString = querystring.stringify({ ...vnpayParams, error: 'Checksum không hợp lệ' });
            return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
        }

        const vnp_ResponseCode = vnpayParams.vnp_ResponseCode;
        const vnp_TxnRef = vnpayParams.vnp_TxnRef;
        const vnp_TransactionNo = vnpayParams.vnp_TransactionNo || 'N/A';
        console.log('VNPay Return Data:', { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo });

        const transaction = await sequelize.transaction();
        try {
            if (vnp_ResponseCode === '00') {
                // Trích xuất user_id từ vnp_OrderInfo
                const orderInfo = decodeURIComponent(vnpayParams.vnp_OrderInfo.replace(/\+/g, ' '));
                const userIdMatch = orderInfo.match(/user (\d+)/);
                if (!userIdMatch) {
                    console.log('Invalid OrderInfo format:', orderInfo);
                    await transaction.rollback();
                    const queryString = querystring.stringify({ ...vnpayParams, error: 'Không tìm thấy user_id' });
                    return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
                }
                const user_id = userIdMatch[1];

                // Trích xuất plan_id từ vnp_TxnRef
                const txnRefMatch = vnp_TxnRef.match(/PREMIUM_(\d+)_(\d+)_(\d+)/);
                if (!txnRefMatch) {
                    console.log('Invalid TxnRef format:', vnp_TxnRef);
                    await transaction.rollback();
                    const queryString = querystring.stringify({ ...vnpayParams, error: 'Mã giao dịch không hợp lệ' });
                    return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
                }
                const [, user_id_from_txn, plan_id] = txnRefMatch;
                console.log('Extracted from Return:', { user_id, user_id_from_txn, plan_id });

                // Kiểm tra user_id nhất quán
                if (user_id !== user_id_from_txn) {
                    console.log('User ID mismatch:', { user_id, user_id_from_txn });
                    await transaction.rollback();
                    const queryString = querystring.stringify({ ...vnpayParams, error: 'User ID không khớp' });
                    return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
                }

                // Kiểm tra giao dịch đã xử lý chưa
                const existingSubscription = await PremiumSubscription.findOne({
                    where: { vnpay_transaction_id: vnp_TransactionNo },
                    transaction
                });
                if (existingSubscription) {
                    console.log('Subscription already processed:', vnp_TransactionNo);
                    await transaction.commit();
                    const queryString = querystring.stringify({
                        ...vnpayParams,
                        message: 'Thanh toán thành công',
                        transactionId: vnp_TxnRef
                    });
                    return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
                }

                // Kiểm tra user
                const user = await User.findByPk(user_id, { transaction });
                if (!user) {
                    console.log('User not found:', user_id);
                    await transaction.rollback();
                    const queryString = querystring.stringify({ ...vnpayParams, error: 'Không tìm thấy người dùng' });
                    return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
                }

                // Kiểm tra plan
                const plan = await PremiumPlan.findByPk(plan_id, { transaction });
                if (!plan) {
                    console.log('Plan not found:', plan_id);
                    await transaction.rollback();
                    const queryString = querystring.stringify({ ...vnpayParams, error: 'Không tìm thấy gói Premium' });
                    return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
                }

                // Tạo subscription
                const end_date = new Date();
                end_date.setDate(end_date.getDate() + plan.duration_days);
                const subscription = await PremiumSubscription.create({
                    user_id,
                    plan_id,
                    start_date: new Date(),
                    end_date,
                    status: 'active',
                    vnpay_transaction_id: vnp_TransactionNo
                }, { transaction });

                // Cập nhật user
                const premiumPlanValue = plan.plan_name.trim().toLowerCase();
                console.log('Plan_name used for premium_plan (Return):', premiumPlanValue);
                await user.update({
                    is_premium: true,
                    premium_plan: premiumPlanValue
                }, { transaction });

                console.log('Subscription created via Return:', { user_id, plan_id, vnp_TransactionNo });
                await transaction.commit();
            }

            // Redirect về frontend với trạng thái
            const queryString = querystring.stringify({
                ...vnpayParams,
                message: vnp_ResponseCode === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
                transactionId: vnp_TxnRef
            });
            return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
        } catch (error) {
            console.error('Error in handleVnpayReturn transaction:', error);
            await transaction.rollback();
            const queryString = querystring.stringify({ ...vnpayParams, error: error.message });
            return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
        }
    } catch (error) {
        console.error('Error in handleVnpayReturn:', error);
        const queryString = querystring.stringify({ ...req.query, error: error.message });
        return res.redirect(`${process.env.FRONTEND_URL}?${queryString}`);
    }
};

// Xử lý IPN từ VNPay
exports.handleVnpayIPN = async (req, res) => {
    console.log('Received VNPay IPN Request at:', new Date().toISOString());
    console.log('IPN Request Body:', req.body);
    try {
        let vnpayParams = { ...req.body };
        const secureHash = vnpayParams.vnp_SecureHash;
        delete vnpayParams.vnp_SecureHash;
        delete vnpayParams.vnp_SecureHashType;

        vnpayParams = sortObject(vnpayParams);
        console.log('VNPay IPN Params (sorted):', vnpayParams);

        const calculatedSecureHash = createVnpayChecksum(vnpayParams, process.env.VNPAY_HASH_SECRET);
        if (secureHash !== calculatedSecureHash) {
            console.log('Invalid checksum:', { secureHash, calculatedSecureHash });
            return res.status(200).json({ RspCode: '97', Message: 'Checksum không hợp lệ' });
        }

        const vnp_ResponseCode = vnpayParams.vnp_ResponseCode;
        const vnp_TxnRef = vnpayParams.vnp_TxnRef;
        const vnp_TransactionNo = vnpayParams.vnp_TransactionNo || 'N/A';
        console.log('VNPay IPN Data:', { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo });

        const transaction = await sequelize.transaction();
        try {
            if (vnp_ResponseCode === '00') {
                // Trích xuất user_id từ vnp_OrderInfo
                const orderInfo = decodeURIComponent(vnpayParams.vnp_OrderInfo.replace(/\+/g, ' '));
                const userIdMatch = orderInfo.match(/user (\d+)/);
                if (!userIdMatch) {
                    console.log('Invalid OrderInfo format:', orderInfo);
                    await transaction.rollback();
                    return res.status(200).json({ RspCode: '97', Message: 'Không tìm thấy user_id trong OrderInfo' });
                }
                const user_id = userIdMatch[1];

                // Trích xuất plan_id từ vnp_TxnRef
                const txnRefMatch = vnp_TxnRef.match(/PREMIUM_(\d+)_(\d+)_(\d+)/);
                if (!txnRefMatch) {
                    console.log('Invalid TxnRef format:', vnp_TxnRef);
                    await transaction.rollback();
                    return res.status(200).json({ RspCode: '97', Message: 'Mã giao dịch không hợp lệ' });
                }
                const [, user_id_from_txn, plan_id] = txnRefMatch;
                console.log('Extracted from IPN:', { user_id, user_id_from_txn, plan_id });

                // Kiểm tra tính nhất quán của user_id
                if (user_id !== user_id_from_txn) {
                    console.log('User ID mismatch:', { user_id, user_id_from_txn });
                    await transaction.rollback();
                    return res.status(200).json({ RspCode: '97', Message: 'User ID không khớp' });
                }

                // Kiểm tra giao dịch đã xử lý chưa
                const existingSubscription = await PremiumSubscription.findOne({
                    where: { vnpay_transaction_id: vnp_TransactionNo },
                    transaction
                });
                if (existingSubscription) {
                    console.log('Subscription already processed:', vnp_TransactionNo);
                    await transaction.commit();
                    return res.status(200).json({ RspCode: '02', Message: 'Giao dịch đã được xử lý' });
                }

                // Kiểm tra user
                const user = await User.findByPk(user_id, { transaction });
                if (!user) {
                    console.log('User not found:', user_id);
                    await transaction.rollback();
                    return res.status(200).json({ RspCode: '01', Message: 'Không tìm thấy người dùng' });
                }

                // Kiểm tra plan
                const plan = await PremiumPlan.findByPk(plan_id, { transaction });
                if (!plan) {
                    console.log('Plan not found:', plan_id);
                    await transaction.rollback();
                    return res.status(200).json({ RspCode: '01', Message: 'Không tìm thấy gói Premium' });
                }

                // Tạo subscription
                const end_date = new Date();
                end_date.setDate(end_date.getDate() + plan.duration_days);
                await PremiumSubscription.create({
                    user_id,
                    plan_id,
                    start_date: new Date(),
                    end_date,
                    status: 'active',
                    vnpay_transaction_id: vnp_TransactionNo
                }, { transaction });

                // Cập nhật user
                const premiumPlanValue = plan.plan_name.trim().toLowerCase();
                console.log('Plan_name used for premium_plan (IPN):', premiumPlanValue);
                await user.update({
                    is_premium: true,
                    premium_plan: premiumPlanValue
                }, { transaction });

                console.log('Subscription created via IPN:', { user_id, plan_id, vnp_TransactionNo });
                await transaction.commit();
                return res.status(200).json({ RspCode: '00', Message: 'Xác nhận giao dịch thành công' });
            } else {
                console.log('VNPay IPN transaction failed:', { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo });
                await transaction.commit();
                return res.status(200).json({ RspCode: vnp_ResponseCode, Message: 'Giao dịch thất bại' });
            }
        } catch (error) {
            console.error('Error in handleVnpayIPN transaction:', error);
            await transaction.rollback();
            return res.status(200).json({
                RspCode: '99',
                Message: 'Lỗi khi xử lý IPN',
                error: error.message
            });
        }
    } catch (error) {
        console.error('Error in handleVnpayIPN:', error);
        return res.status(200).json({
            RspCode: '99',
            Message: 'Lỗi khi xử lý IPN',
            error: error.message
        });
    }
};