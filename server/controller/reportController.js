const UserPlanSubscription = require('../model/userSubscriptionPlanModel');
const Wallet = require('../model/walletModel');
const User = require('../model/usersModel');
const Plan = require('../model/planModel');
const mongoose = require('mongoose');

// Helper to get current date
const getCurrentDate = () => new Date();

// Helper to get week range (Monday to Sunday)
const getWeekRange = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
};

// Helper to get month range
const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

// Overall Reports
exports.getOverallReports = async (req, res) => {
  try {
    const currentDate = getCurrentDate();

    // Total available plans
    const totalPlans = await Plan.countDocuments();
    const inrPlans = await Plan.countDocuments({ amount_type: 'INR' });
    const usdtPlans = await Plan.countDocuments({ amount_type: 'USDT' });

    // Total chosen (verified subscriptions)
    const chosenCount = await UserPlanSubscription.countDocuments({ status: 'verified' });

    // Chosen by currency
    const chosenByCurrency = await UserPlanSubscription.aggregate([
      { $match: { status: 'verified' } },
      { $lookup: { from: 'plans', localField: 'plan_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.amount_type', count: { $sum: 1 } } },
    ]);
    let chosenINR = 0, chosenUSDT = 0;
    chosenByCurrency.forEach((g) => {
      if (g._id === 'INR') chosenINR = g.count;
      else if (g._id === 'USDT') chosenUSDT = g.count;
    });

    // Expired count
    const expiredCount = await UserPlanSubscription.countDocuments({
      status: 'verified',
      expires_at: { $lt: currentDate },
    });

    // Expired by currency
    const expiredByCurrency = await UserPlanSubscription.aggregate([
      { $match: { status: 'verified', expires_at: { $lt: currentDate } } },
      { $lookup: { from: 'plans', localField: 'plan_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.amount_type', count: { $sum: 1 } } },
    ]);
    let expiredINR = 0, expiredUSDT = 0;
    expiredByCurrency.forEach((g) => {
      if (g._id === 'INR') expiredINR = g.count;
      else if (g._id === 'USDT') expiredUSDT = g.count;
    });

    // Rejected count
    const rejectedCount = await UserPlanSubscription.countDocuments({ status: 'rejected' });

    // Rejected by currency
    const rejectedByCurrency = await UserPlanSubscription.aggregate([
      { $match: { status: 'rejected' } },
      { $lookup: { from: 'plans', localField: 'plan_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.amount_type', count: { $sum: 1 } } },
    ]);
    let rejectedINR = 0, rejectedUSDT = 0;
    rejectedByCurrency.forEach((g) => {
      if (g._id === 'INR') rejectedINR = g.count;
      else if (g._id === 'USDT') rejectedUSDT = g.count;
    });

    // Plan wise chosen counts
    const planWise = await UserPlanSubscription.aggregate([
      { $match: { status: 'verified' } },
      { $lookup: { from: 'plans', localField: 'plan_id', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.plan_name', count: { $sum: 1 } } },
    ]);
    let planWiseCounts = {};
    planWise.forEach((g) => {
      planWiseCounts[g._id] = g.count;
    });

    res.json({
      totalPlans,
      inrPlans,
      usdtPlans,
      chosenCount,
      chosenINR,
      chosenUSDT,
      expiredCount,
      expiredINR,
      expiredUSDT,
      rejectedCount,
      rejectedINR,
      rejectedUSDT,
      planWiseCounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upcoming Expirations (per plan)
exports.getExpirations = async (req, res) => {
  const { period } = req.params; // 'week' or 'month'
  try {
    const currentDate = getCurrentDate();
    let range;
    if (period === 'week') {
      range = getWeekRange(currentDate);
    } else if (period === 'month') {
      range = getMonthRange(currentDate);
    } else {
      return res.status(400).json({ message: 'Invalid period' });
    }

    const [result] = await UserPlanSubscription.aggregate([
      {
        $match: {
          status: 'verified',
          planStatus: 'Active',
          expires_at: { $gte: currentDate, $lte: range.end },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan_id',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },
      {
        $facet: {
          list: [
            {
              $project: {
                user: { username: 1, email: 1, phone_number: 1 },
                plan: { plan_name: 1, amount_type: 1 },
                amount: 1,
                expires_at: 1,
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: '$plan.amount_type',
                totalAmount: { $sum: '$amount' },
              },
            },
          ],
        },
      },
    ]);

    const expirations = result?.list || [];
    const totals = result?.totals || [];
    let totalAmounts = { INR: 0, USDT: 0 };
    totals.forEach((t) => {
      totalAmounts[t._id] = t.totalAmount;
    });

    res.json({
      expirations,
      totalAmounts,
      count: expirations.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upcoming Settlements (grouped by user and currency, using Wallet model for amounts)
exports.getSettlements = async (req, res) => {
  const { period } = req.params; // 'week' or 'month'
  try {
    const currentDate = getCurrentDate();
    let range;
    if (period === 'week') {
      range = getWeekRange(currentDate);
    } else if (period === 'month') {
      range = getMonthRange(currentDate);
    } else {
      return res.status(400).json({ message: 'Invalid period' });
    }

    const [result] = await UserPlanSubscription.aggregate([
      {
        $match: {
          status: 'verified',
          expires_at: { $gte: currentDate, $lte: range.end },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan_id',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },
      {
        $lookup: {
          from: 'wallets',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'wallet',
        },
      },
      { $unwind: '$wallet' },
      {
        $facet: {
          list: [
            {
              $group: {
                _id: { user_id: '$user._id', amount_type: '$plan.amount_type' },
                user: { $first: '$user' },
                plan: { $first: { plan_name: '$plan.plan_name', amount_type: '$plan.amount_type' } },
                userPlanCapitalAmount: { $first: '$wallet.userPlanCapitalAmount' },
                dailyProfitAmount: { $first: '$wallet.dailyProfitAmount' },
                totalAmountToSettle: { $first: '$wallet.totalWalletPoint' },
                expires_at: { $max: '$expires_at' },
              },
            },
            {
              $project: {
                user: { username: 1, email: 1, phone_number: 1 },
                plan: { plan_name: 1, amount_type: 1 },
                userPlanCapitalAmount: 1,
                dailyProfitAmount: 1,
                totalAmountToSettle: 1,
                expires_at: 1,
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: '$plan.amount_type',
                totalAmount: { $sum: '$wallet.totalWalletPoint' },
              },
            },
          ],
        },
      },
    ]);

    const settlements = result?.list || [];
    const totals = result?.totals || [];
    let totalSettlementAmounts = { INR: 0, USDT: 0 };
    totals.forEach((t) => {
      totalSettlementAmounts[t._id] = t.totalAmount;
    });

    res.json({
      settlements,
      totalSettlementAmounts,
      count: settlements.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};