// const mongoose = require('mongoose');
// const UserPlanSubscription = require('../model/userSubscriptionPlanModel');
// const Wallet = require('../model/walletModel');
// const User = require('../model/usersModel');
// const Plan = require('../model/planModel');
// const cron = require('node-cron');

// // Search user subscriptions by email, phone number, or customerId
// const searchUserSubscriptions = async (req, res) => {
//   const { query } = req.query;
//   try {
//     const user = await User.findOne({
//       $or: [{ email: query }, { phone_number: query }, { customerId: query }],
//     }).select('_id username email phone_number');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const subscriptions = await UserPlanSubscription.find({
//       user_id: user._id,
//       status: 'verified',
//       expires_at: { $gt: new Date() },
//     })
//       .populate('plan_id', 'plan_name capital_lockin')
//       .lean();

//     if (!subscriptions.length) {
//       return res.status(404).json({ message: 'No active verified subscriptions found for this user' });
//     }

//     res.json({
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         phone_number: user.phone_number,
//       },
//       subscriptions,
//     });
//   } catch (error) {
//     console.error('Search user subscriptions error:', error);
//     res.status(500).json({ message: error.message || 'Internal server error' });
//   }
// };

// // Add points to wallet
// const addPointsToWallet = async (req, res) => {
//   const { user_id, subscription_id, amount, profit_percentage } = req.body;
//   try {
//     if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(subscription_id)) {
//       return res.status(400).json({ message: 'Invalid user_id or subscription_id format' });
//     }
//     if (isNaN(amount) || Number(amount) <= 0) {
//       return res.status(400).json({ message: 'Invalid amount' });
//     }
//     if (isNaN(profit_percentage) || Number(profit_percentage) <= 0) {
//       return res.status(400).json({ message: 'Invalid profit percentage' });
//     }

//     const subscription = await UserPlanSubscription.findById(subscription_id);
//     if (!subscription || subscription.user_id.toString() !== user_id || subscription.status !== 'verified' || subscription.expires_at <= new Date()) {
//       return res.status(404).json({ message: 'Valid subscription not found' });
//     }

//     const plan = await Plan.findById(subscription.plan_id);
//     if (!plan) {
//       return res.status(404).json({ message: 'Plan not found' });
//     }

//     const capitalLockin = plan.capital_lockin || 30;
//     const totalProfit = (amount * Number(profit_percentage)) / 100;
//     const dailyProfit = totalProfit / capitalLockin;

//     let wallet = await Wallet.findOne({ user_id });
//     if (!wallet) {
//       wallet = new Wallet({
//         user_id,
//         userPlanCapitalAmount: amount,
//         dailyProfitAmount: dailyProfit,
//         totalWalletPoint: amount + dailyProfit,
//       });
//     } else {
//       wallet.userPlanCapitalAmount = amount;
//       wallet.dailyProfitAmount = dailyProfit;
//       wallet.totalWalletPoint += dailyProfit;
//     }

//     await wallet.save();

//     res.status(200).json({
//       message: 'Points added to wallet successfully',
//       wallet: {
//         user_id: wallet.user_id,
//         userPlanCapitalAmount: wallet.userPlanCapitalAmount,
//         dailyProfitAmount: wallet.dailyProfitAmount,
//         totalWalletPoint: wallet.totalWalletPoint,
//       },
//     });
//   } catch (error) {
//     console.error('Add points to wallet error:', error);
//     res.status(500).json({ message: error.message || 'Internal server error' });
//   }
// };

// // Get all wallet points with pagination
// const getAllWallets = async (req, res) => {
//   const { page = 1, limit = 10 } = req.query;
//   try {
//     const wallets = await Wallet.find()
//       .populate('user_id', 'username email phone_number')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .exec();
//     const count = await Wallet.countDocuments();
//     res.json({
//       wallets,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page * 1,
//     });
//   } catch (error) {
//     console.error('Get wallets error:', error);
//     res.status(500).json({ message: error.message || 'Internal server error' });
//   }
// };

// // Scheduler to update wallet points daily at 12:00 AM
// cron.schedule('0 0 * * *', async () => {
//   try {
//     const now = new Date();
//     const activeSubscriptions = await UserPlanSubscription.find({
//       status: 'verified',
//       planStatus: 'Active',
//       expires_at: { $gt: now },
//     }).populate('plan_id', 'capital_lockin');

//     for (const subscription of activeSubscriptions) {
//       const plan = subscription.plan_id;
//       const capitalLockin = plan.capital_lockin || 30;
//       const totalProfit = (subscription.amount * Number(subscription.profit_percentage)) / 100;
//       const dailyProfit = totalProfit / capitalLockin;

//       let wallet = await Wallet.findOne({ user_id: subscription.user_id });
//       if (!wallet) {
//         wallet = new Wallet({
//           user_id: subscription.user_id,
//           userPlanCapitalAmount: subscription.amount,
//           dailyProfitAmount: dailyProfit,
//           totalWalletPoint: subscription.amount + dailyProfit,
//         });
//       } else {
//         wallet.dailyProfitAmount = dailyProfit;
//         wallet.totalWalletPoint += dailyProfit;
//       }

//       await wallet.save();
//       console.log(`Updated wallet for user ${subscription.user_id}: Added daily profit ${dailyProfit}`);
//     }

//     // Update inactive plans
//     const updated = await UserPlanSubscription.updateMany({
//       status: 'verified',
//       planStatus: 'Active',
//       expires_at: { $lte: now },
//     }, { planStatus: 'Inactive' });
//     console.log(`Updated ${updated.nModified} expired plans to Inactive`);
//   } catch (error) {
//     console.error('Scheduler error:', error);
//   }
// });

// module.exports = {
//   searchUserSubscriptions,
//   addPointsToWallet,
//   getAllWallets,
// };




const mongoose = require('mongoose');
const UserPlanSubscription = require('../model/userSubscriptionPlanModel');
const Wallet = require('../model/walletModel');
const User = require('../model/usersModel');
const Plan = require('../model/planModel');
const cron = require('node-cron');

// Search user subscriptions by email, phone number, or customerId
const searchUserSubscriptions = async (req, res) => {
  const { query } = req.query;
  try {
    const user = await User.findOne({
      $or: [{ email: query }, { phone_number: query }, { customerId: query }],
    }).select('_id username email phone_number');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const subscriptions = await UserPlanSubscription.find({
      user_id: user._id,
      status: 'verified',
      expires_at: { $gt: new Date() },
    })
      .populate('plan_id', 'plan_name capital_lockin')
      .lean();

    if (!subscriptions.length)
      return res.status(404).json({ message: 'No active verified subscriptions found' });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
      },
      subscriptions,
    });
  } catch (error) {
    console.error('Search user subscriptions error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Add points to wallet manually
const addPointsToWallet = async (req, res) => {
  const { user_id, subscription_id, amount, profit_percentage } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(subscription_id))
      return res.status(400).json({ message: 'Invalid user_id or subscription_id format' });

    if (isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    if (isNaN(profit_percentage) || Number(profit_percentage) <= 0)
      return res.status(400).json({ message: 'Invalid profit percentage' });

    const subscription = await UserPlanSubscription.findById(subscription_id);
    if (
      !subscription ||
      subscription.user_id.toString() !== user_id ||
      subscription.status !== 'verified' ||
      subscription.expires_at <= new Date()
    )
      return res.status(404).json({ message: 'Valid subscription not found' });

    const plan = await Plan.findById(subscription.plan_id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const capitalLockin = plan.capital_lockin || 30;
    const totalProfit = (amount * Number(profit_percentage)) / 100;
    const dailyProfit = totalProfit / capitalLockin;

    let wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      wallet = new Wallet({
        user_id,
        userPlanCapitalAmount: amount,
        dailyProfitAmount: dailyProfit,
        totalWalletPoint: amount + dailyProfit,
      });
    } else {
      wallet.userPlanCapitalAmount = amount;
      wallet.dailyProfitAmount = dailyProfit;
      wallet.totalWalletPoint += dailyProfit;
    }

    await wallet.save();

    res.status(200).json({
      message: 'Points added to wallet successfully',
      wallet: {
        user_id: wallet.user_id,
        userPlanCapitalAmount: wallet.userPlanCapitalAmount,
        dailyProfitAmount: wallet.dailyProfitAmount,
        totalWalletPoint: wallet.totalWalletPoint,
      },
    });
  } catch (error) {
    console.error('Add points to wallet error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get all wallet points with pagination
const getAllWallets = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const wallets = await Wallet.find()
      .populate('user_id', 'username email phone_number')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Wallet.countDocuments();
    res.json({
      wallets,
      totalPages: Math.ceil(count / limit),
      currentPage: page * 1,
    });
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Scheduler: update wallets daily at 12:00 AM
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();

    // 1️⃣ Get all active subscriptions
    const activeSubscriptions = await UserPlanSubscription.find({
      status: 'verified',
      planStatus: 'Active',
      expires_at: { $gt: now },
    }).populate('plan_id');

    for (const subscription of activeSubscriptions) {
      const plan = subscription.plan_id;
      if (!plan) continue;

      // Calculate user's daily profit
      const capitalLockin = plan.capital_lockin || 30;
      const totalProfit = (subscription.amount * Number(plan.profit_percentage)) / 100;
      const dailyProfit = totalProfit / capitalLockin;

      // Update subscription owner's wallet
      let wallet = await Wallet.findOne({ user_id: subscription.user_id });
      if (!wallet) {
        wallet = new Wallet({
          user_id: subscription.user_id,
          userPlanCapitalAmount: subscription.amount,
          dailyProfitAmount: dailyProfit,
          totalWalletPoint: subscription.amount + dailyProfit,
        });
      } else {
        wallet.dailyProfitAmount = dailyProfit;
        wallet.totalWalletPoint += dailyProfit;
      }
      await wallet.save();

      // 2️⃣ Handle referral profit
      const user = await User.findById(subscription.user_id);
      if (user?.referred_by) {
        const referralProfit = dailyProfit * 0.01; // 1% of daily profit
        let referrerWallet = await Wallet.findOne({ user_id: user.referred_by });
        if (!referrerWallet) {
          referrerWallet = new Wallet({
            user_id: user.referred_by,
            userPlanCapitalAmount: 0,
            dailyProfitAmount: referralProfit,
            totalWalletPoint: referralProfit,
          });
        } else {
          referrerWallet.dailyProfitAmount += referralProfit;
          referrerWallet.totalWalletPoint += referralProfit;
        }
        await referrerWallet.save();
        console.log(
          `Added referral profit ${referralProfit.toFixed(2)} to referrer ${user.referred_by} from user ${subscription.user_id}`
        );
      }
    }

    // Update inactive subscriptions
    await UserPlanSubscription.updateMany(
      { status: 'verified', planStatus: 'Active', expires_at: { $lte: now } },
      { planStatus: 'Inactive' }
    );
  } catch (error) {
    console.error('Daily profit scheduler error:', error);
  }
});

module.exports = {
  searchUserSubscriptions,
  addPointsToWallet,
  getAllWallets,
};
