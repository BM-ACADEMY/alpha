const mongoose = require("mongoose");
const UserPlanSubscription = require("../model/userSubscriptionPlanModel");
const Wallet = require("../model/walletModel");
const User = require("../model/usersModel");
const Plan = require("../model/planModel");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

// Log cron runs to a file for debugging
const logCronRun = (message) => {
  const logMessage = `${new Date().toISOString()}: ${message}\n`;
  fs.appendFileSync(path.join(__dirname, "cron.log"), logMessage);
};

// Search user subscriptions by email, phone number, or customerId
const searchUserSubscriptions = async (req, res) => {
  const { query } = req.query;
  try {
    const user = await User.findOne({
      $or: [{ email: query }, { phone_number: query }, { customerId: query }],
    }).select("_id username email phone_number");

    if (!user) return res.status(404).json({ message: "User not found" });

    const subscriptions = await UserPlanSubscription.find({
      user_id: user._id,
      status: "verified",
      expires_at: { $gt: new Date() },
    })
      .populate("plan_id", "plan_name capital_lockin")
      .lean();

    if (!subscriptions.length)
      return res
        .status(404)
        .json({ message: "No active verified subscriptions found" });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
      },
      subscriptions: subscriptions.map(sub => ({
        ...sub,
        pointsAdded: sub.pointsAdded || false, // Ensure pointsAdded is included
      })),
    });
  } catch (error) {
    console.error("Search user subscriptions error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// Add points to wallet manually
const addPointsToWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { user_id, subscription_id, amount, profit_percentage } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      !mongoose.Types.ObjectId.isValid(subscription_id)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid user_id or subscription_id format" });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (isNaN(profit_percentage) || Number(profit_percentage) <= 0) {
      return res.status(400).json({ message: "Invalid profit percentage" });
    }

    const subscription = await UserPlanSubscription.findById(
      subscription_id
    ).session(session);
    if (
      !subscription ||
      subscription.user_id.toString() !== user_id ||
      subscription.status !== "verified" ||
      subscription.expires_at <= new Date()
    ) {
      return res.status(404).json({ message: "Valid subscription not found" });
    }

    // Check if points have already been added for this subscription
    if (subscription.pointsAdded) {
      return res.status(400).json({ message: "Points already added for this subscription" });
    }

    const plan = await Plan.findById(subscription.plan_id).session(session);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const capitalLockin = plan.capital_lockin || 30;
    const totalProfit = (amount * Number(profit_percentage)) / 100;
    const dailyProfit = totalProfit / capitalLockin;

    let wallet = await Wallet.findOneAndUpdate(
      { user_id },
      {
        $inc: {
          userPlanCapitalAmount: amount,
          dailyProfitAmount: dailyProfit,
          totalWalletPoint: amount + dailyProfit,
        },
        $setOnInsert: {
          referral_amount: 0,
          amount_type: [], // Set default for new field
        },
      },
      { new: true, upsert: true, session }
    );

    // Mark subscription as points added
    subscription.pointsAdded = true;
    await subscription.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      message: "Points added to wallet successfully",
      wallet: {
        user_id: wallet.user_id,
        userPlanCapitalAmount: wallet.userPlanCapitalAmount,
        dailyProfitAmount: wallet.dailyProfitAmount,
        totalWalletPoint: wallet.totalWalletPoint,
        referral_amount: wallet.referral_amount,
        amount_type: wallet.amount_type,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Add points to wallet error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  } finally {
    session.endSession();
  }
};

// Get all wallet points with pagination, search, and status filter
const getAllWallets = async (req, res) => {
  const { page = 1, limit = 10, search = '', planStatus = 'all' } = req.query;
  try {
    let matchQuery = {};

    if (search) {
      const users = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone_number: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = users.map(user => user._id);
      matchQuery.user_id = { $in: userIds.length ? userIds : [null] };
    }

    const wallets = await Wallet.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'userplansubscriptions',
          let: { user_id: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$user_id'] },
                status: 'verified',
                expires_at: { $gt: new Date() },
              },
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 },
          ],
          as: 'subscription',
        },
      },
      {
        $unwind: {
          path: '$subscription',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: planStatus !== 'all' ? {
          'subscription.planStatus': planStatus,
        } : {},
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_id',
        },
      },
      {
        $unwind: {
          path: '$user_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          user_id: {
            _id: '$user_id._id',
            username: '$user_id.username',
            email: '$user_id.email',
            phone_number: '$user_id.phone_number',
          },
          userPlanCapitalAmount: 1,
          dailyProfitAmount: 1,
          referral_amount: 1,
          totalWalletPoint: 1,
          amount_type: 1,
          planStatus: '$subscription.planStatus',
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit * 1 },
    ]);

    const countPipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'userplansubscriptions',
          let: { user_id: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$user_id'] },
                status: 'verified',
                expires_at: { $gt: new Date() },
              },
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 },
          ],
          as: 'subscription',
        },
      },
      {
        $unwind: {
          path: '$subscription',
          preserveNullAndEmptyArrays: true,
        },
      },
      planStatus !== 'all' ? {
        $match: {
          'subscription.planStatus': planStatus,
        },
      } : { $match: {} },
      { $count: 'total' },
    ];

    const countResult = await Wallet.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    res.json({
      wallets,
      totalPages: Math.ceil(total / limit),
      currentPage: page * 1,
    });
  } catch (error) {
    console.error("Get wallets error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// Scheduler: Update wallets every minute for testing
cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("Daily profit scheduler started at:", new Date().toISOString());
    logCronRun("Daily profit scheduler started");
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const now = new Date();
      const activeSubscriptions = await UserPlanSubscription.find({
        status: "verified",
        planStatus: "Active",
        expires_at: { $gt: now },
      })
        .populate("plan_id")
        .session(session);

      console.log(`Found ${activeSubscriptions.length} active subscriptions`);
      logCronRun(`Found ${activeSubscriptions.length} active subscriptions`);

      for (const subscription of activeSubscriptions) {
        const plan = subscription.plan_id;
        if (!plan) {
          console.warn(`Plan not found for subscription ${subscription._id}`);
          logCronRun(`Plan not found for subscription ${subscription._id}`);
          continue;
        }

        const capitalLockin = plan.capital_lockin || 30;
        const totalProfit =
          (subscription.amount * Number(plan.profit_percentage)) / 100;
        const dailyProfit = totalProfit / capitalLockin;

        let wallet = await Wallet.findOne({
          user_id: subscription.user_id,
        }).session(session);
        if (!wallet) {
          wallet = new Wallet({
            user_id: subscription.user_id,
            userPlanCapitalAmount: subscription.amount,
            dailyProfitAmount: dailyProfit,
            totalWalletPoint: subscription.amount + dailyProfit,
            referral_amount: 0,
            amount_type: [],
          });
        } else {
          wallet.dailyProfitAmount = dailyProfit;
          wallet.totalWalletPoint += dailyProfit;
        }
        await wallet.save({ session });
        console.log(
          `Updated wallet for user ${subscription.user_id}: Daily Profit = ${dailyProfit}`
        );
        logCronRun(
          `Updated wallet for user ${subscription.user_id}: Daily Profit = ${dailyProfit}`
        );

        const user = await User.findById(subscription.user_id).session(session);
        if (user?.referred_by) {
          const referrer = await User.findById(user.referred_by).session(
            session
          );
          if (!referrer) {
            console.warn(
              `Referrer ${user.referred_by} not found for user ${subscription.user_id}`
            );
            logCronRun(
              `Referrer ${user.referred_by} not found for user ${subscription.user_id}`
            );
            continue;
          }

          const referralProfit = dailyProfit * 0.01;

          let referrerWallet = await Wallet.findOne({
            user_id: user.referred_by,
          }).session(session);
          if (!referrerWallet) {
            referrerWallet = new Wallet({
              user_id: user.referred_by,
              userPlanCapitalAmount: 0,
              dailyProfitAmount: 0,
              totalWalletPoint: referralProfit,
              referral_amount: referralProfit,
              amount_type: [],
            });
          } else {
            referrerWallet.referral_amount += referralProfit;
            referrerWallet.totalWalletPoint += referralProfit;
          }
          await referrerWallet.save({ session });
          console.log(
            `Added referral profit ${referralProfit.toFixed(2)} to referrer ${
              user.referred_by
            } from user ${subscription.user_id}`
          );
          logCronRun(
            `Added referral profit ${referralProfit.toFixed(2)} to referrer ${
              user.referred_by
            } from user ${subscription.user_id}`
          );
        }
      }

      const inactiveUpdate = await UserPlanSubscription.updateMany(
        { status: "verified", planStatus: "Active", expires_at: { $lte: now } },
        { planStatus: "Inactive" },
        { session }
      );
      console.log(
        `Updated ${inactiveUpdate.modifiedCount} subscriptions to Inactive`
      );
      logCronRun(
        `Updated ${inactiveUpdate.modifiedCount} subscriptions to Inactive`
      );

      await session.commitTransaction();
      console.log("Daily profit scheduler completed successfully");
      logCronRun("Daily profit scheduler completed successfully");
    } catch (error) {
      await session.abortTransaction();
      console.error("Daily profit scheduler error:", error);
      logCronRun(`Daily profit scheduler error: ${error.message}`);
    } finally {
      session.endSession();
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

module.exports = {
  searchUserSubscriptions,
  addPointsToWallet,
  getAllWallets,
};