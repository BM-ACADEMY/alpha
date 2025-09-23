const mongoose = require("mongoose");
const User = require("../model/usersModel");
const Plan = require("../model/planModel");
const UserPlanSubscription = require("../model/userSubscriptionPlanModel");
const Wallet = require("../model/walletModel");

const getDashboardData = async (req, res) => {
  try {
    const { filter = "monthly" } = req.query; // Default to monthly
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total Users
    const totalUsers = await User.countDocuments();

    // Total Plans
    const totalPlans = await Plan.countDocuments();

    // Current Month Amount by currency
    const currentMonthAmount = await UserPlanSubscription.aggregate([
      {
        $match: {
          purchased_at: { $gte: startOfMonth, $lte: endOfToday },
          status: "verified",
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "plan_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      {
        $group: {
          _id: "$plan.amount_type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Total Amount by currency
    const totalAmount = await UserPlanSubscription.aggregate([
      { $match: { status: "verified" } },
      {
        $lookup: {
          from: "plans",
          localField: "plan_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      {
        $group: {
          _id: "$plan.amount_type",
          total: { $sum: "$amount" },
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

    // Plan-wise User Count Over Time
    let periods = [];
    if (filter === "weekly") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        periods.push({
          name: `Week ${i + 1}`,
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999)),
        });
      }
    } else if (filter === "yearly") {
      for (let i = 2; i >= 0; i--) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - i);
        periods.push({
          name: date.getFullYear().toString(),
          start: new Date(date.getFullYear(), 0, 1),
          end: new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999),
        });
      }
    } else {
      // Monthly (default)
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        periods.push({
          name: date.toLocaleString("default", { month: "short" }),
          start: new Date(date.getFullYear(), date.getMonth(), 1),
          end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
        });
      }
    }

    const planUserCounts = await Promise.all(
      periods.map(async (period) => {
        const subscriptions = await UserPlanSubscription.aggregate([
          {
            $match: {
              purchased_at: { $gte: period.start, $lte: period.end },
              status: "verified",
            },
          },
          {
            $lookup: {
              from: "plans",
              localField: "plan_id",
              foreignField: "_id",
              as: "plan",
            },
          },
          { $unwind: "$plan" },
          {
            $group: {
              _id: {
                $toLower: {
                  $trim: {
                    input: {
                      $replaceAll: {
                        input: "$plan.plan_name",
                        find: " ",
                        replacement: "",
                      },
                    },
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
        ]);

        const result = { name: period.name };
        subscriptions.forEach((sub) => {
          result[sub._id] = sub.count;
        });
        return {
          name: period.name,
          starter: result.starter || 0,
          advanced: result.advanced || 0,
          premium: result.premium || 0,
          elite: result.elite || 0,
        };
      })
    );

    // Currency Distribution
    const currencyDistribution = await UserPlanSubscription.aggregate([
      { $match: { status: "verified" } },
      {
        $lookup: {
          from: "plans",
          localField: "plan_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      {
        $group: {
          _id: "$plan.amount_type",
          value: { $sum: "$amount" },
        },
      },
      {
        $project: {
          name: {
            $concat: [
              { $cond: [{ $eq: ["$_id", "INR"] }, "₹ ", "₮ "] },
              "$_id",
            ],
          },
          value: 1,
          _id: 0,
        },
      },
    ]);

    const dashboardData = {
      totalUsers,
      totalPlans,
      currentMonthAmount: {
        INR: currentMonthAmount.find((c) => c._id === "INR")?.total || 0,
        USDT: currentMonthAmount.find((c) => c._id === "USDT")?.total || 0,
      },
      totalAmount: {
        INR: totalAmount.find((c) => c._id === "INR")?.total || 0,
        USDT: totalAmount.find((c) => c._id === "USDT")?.total || 0,
      },
      newUsersToday,
      referralUsers,
      planUserCounts,
      currencyDistribution,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user profile
    const user = await User.findById(userId).select(
      "customerId username email referral_code referred_by"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch wallet information
    const wallet = await Wallet.findOne({ user_id: userId }).select(
      "userPlanCapitalAmount dailyProfitAmount totalWalletPoint"
    );

    // Fetch active plans
    const activePlans = await UserPlanSubscription.find({
      user_id: userId,
      planStatus: "Active",
      status: "verified",
    })
      .populate(
        "plan_id",
        "plan_name amount_type min_investment profit_percentage"
      )
      .select("amount profit_percentage purchased_at expires_at");

    // Fetch referral count
    const referralCount = await User.countDocuments({ referred_by: userId });

    // Fetch profit over time (last 7 months)
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        name: date.toLocaleString("default", { month: "short" }),
        date: date,
      });
    }

    const profitOverTime = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(
          month.date.getFullYear(),
          month.date.getMonth(),
          1
        );
        const endOfMonth = new Date(
          month.date.getFullYear(),
          month.date.getMonth() + 1,
          0
        );

        const walletData = await Wallet.find({
          user_id: userId,
          updated_at: { $gte: startOfMonth, $lte: endOfMonth },
        }).select("dailyProfitAmount updated_at");

        // Sum daily profits for the month
        const totalProfit = walletData.reduce(
          (sum, data) => sum + Number(data.dailyProfitAmount || 0),
          0
        );

        return {
          name: month.name,
          profit: totalProfit,
        };
      })
    );

    // Fetch daily profit for the last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        name: date.toLocaleString("default", { day: "numeric", month: "short" }),
        date: date,
      });
    }

    const dailyProfitOverTime = await Promise.all(
      days.map(async (day) => {
        const startOfDay = new Date(day.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day.date);
        endOfDay.setHours(23, 59, 59, 999);

        const walletData = await Wallet.findOne({
          user_id: userId,
          updated_at: { $gte: startOfDay, $lte: endOfDay },
        }).select("dailyProfitAmount");

        return {
          name: day.name,
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
        referredBy: user.referred_by
          ? (await User.findById(user.referred_by).select("username"))?.username
          : "None",
      },
      wallet: wallet
        ? {
            userPlanCapitalAmount: Number(wallet.userPlanCapitalAmount),
            dailyProfitAmount: Number(wallet.dailyProfitAmount),
            totalWalletPoint: Number(wallet.totalWalletPoint),
          }
        : {
            userPlanCapitalAmount: 0,
            dailyProfitAmount: 0,
            totalWalletPoint: 0,
          },
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
      dailyProfitOverTime,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getDashboardData, getUserDashboardData };