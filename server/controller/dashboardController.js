const mongoose = require('mongoose');
const User = require('../model/usersModel'); // Adjust path as needed
const Plan = require('../model/planModel'); // Adjust path as needed
const UserPlanSubscription = require('../model/userSubscriptionPlanModel'); // Adjust path as needed
const Wallet = require('../model/walletModel'); // Adjust path as needed

const getDashboardData = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Total Users
    const totalUsers = await User.countDocuments();

    // Total Plans
    const totalPlans = await Plan.countDocuments();

    // Current Month Amount (sum of verified subscriptions this month)
    const currentMonthAmount = await UserPlanSubscription.aggregate([
      {
        $match: {
          purchased_at: { $gte: startOfMonth },
          status: 'verified',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Total Amount (sum of all verified subscriptions)
    const totalAmount = await UserPlanSubscription.aggregate([
      {
        $match: { status: 'verified' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // New Users Today
    const newUsersToday = await User.countDocuments({
      created_at: { $gte: startOfToday, $lte: endOfToday },
    });

    // Referral Users
    const referralUsers = await User.countDocuments({
      referred_by: { $ne: null },
    });

    // Plan-wise User Count Over Time (last 7 months)
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        name: date.toLocaleString('default', { month: 'short' }),
        date: date,
      });
    }

    const planUserCounts = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endOfMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        const subscriptions = await UserPlanSubscription.aggregate([
          {
            $match: {
              purchased_at: { $gte: startOfMonth, $lte: endOfMonth },
              status: 'verified',
            },
          },
          {
            $group: {
              _id: '$plan_id',
              count: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: 'plans',
              localField: '_id',
              foreignField: '_id',
              as: 'plan',
            },
          },
          {
            $unwind: '$plan',
          },
        ]);

        const result = { name: month.name };
        subscriptions.forEach((sub) => {
          result[sub.plan.plan_name] = sub.count;
        });
        return result;
      })
    );

    // Currency Distribution
    const currencyDistribution = await UserPlanSubscription.aggregate([
      {
        $match: { status: 'verified' },
      },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan_id',
          foreignField: '_id',
          as: 'plan',
        },
      },
      {
        $unwind: '$plan',
      },
      {
        $group: {
          _id: '$plan.amount_type',
          value: { $sum: '$amount' },
        },
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0,
        },
      },
    ]);

    const dashboardData = {
      totalUsers,
      totalPlans,
      currentMonthAmount: currentMonthAmount[0]?.total || 0,
      totalAmount: totalAmount[0]?.total || 0,
      newUsersToday,
      referralUsers,
      planUserCounts: planUserCounts.map((month) => ({
        name: month.name,
        PlanA: month['Plan A'] || 0, // Adjust plan names as per your actual data
        PlanB: month['Plan B'] || 0,
        PlanC: month['Plan C'] || 0,
      })),
      currencyDistribution,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.params.id; // Assuming user ID is available from authentication middleware

    // Fetch user profile
    const user = await User.findById(userId).select('customerId username email referral_code referred_by');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch wallet information
    const wallet = await Wallet.findOne({ user_id: userId }).select('userPlanCapitalAmount dailyProfitAmount totalWalletPoint');

    // Fetch active plans
    const activePlans = await UserPlanSubscription.find({
      user_id: userId,
      planStatus: 'Active',
      status: 'verified',
    })
      .populate('plan_id', 'plan_name amount_type min_investment profit_percentage')
      .select('amount profit_percentage purchased_at expires_at');

    // Fetch referral count
    const referralCount = await User.countDocuments({ referred_by: userId });

    // Fetch profit over time (last 7 months)
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        name: date.toLocaleString('default', { month: 'short' }),
        date: date,
      });
    }

    const profitOverTime = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endOfMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        const walletData = await Wallet.findOne({
          user_id: userId,
          created_at: { $gte: startOfMonth, $lte: endOfMonth },
        }).select('dailyProfitAmount');

        return {
          name: month.name,
          profit: walletData ? Number(walletData.dailyProfitAmount) : 0,
        };
      })
    );

    const dashboardData = {
      profile: {
        customerId: user.customerId,
        username: user.username,
        email: user.email,
        referralCode: user.referral_code,
        referredBy: user.referred_by ? (await User.findById(user.referred_by).select('username'))?.username : 'None',
      },
      wallet: wallet
        ? {
            userPlanCapitalAmount: Number(wallet.userPlanCapitalAmount),
            dailyProfitAmount: Number(wallet.dailyProfitAmount),
            totalWalletPoint: Number(wallet.totalWalletPoint),
        }
        : { userPlanCapitalAmount: 0, dailyProfitAmount: 0, totalWalletPoint: 0 },
      activePlans: activePlans.map((plan) => ({
        planName: plan.plan_id.plan_name,
        amount: plan.amount,
        amountType: plan.plan_id.amount_type,
        profitPercentage: Number(plan.profit_percentage),
        purchasedAt: plan.purchased_at,
        expiresAt: plan.expires_at,
      })),
      referralCount,
      profitOverTime,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching user dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { getDashboardData,getUserDashboardData };