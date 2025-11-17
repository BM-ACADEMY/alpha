const express = require('express');
const router = express.Router();
const walletController = require('../controller/walletController');

// Routes for wallet operations
router.get('/search-subscriptions', walletController.searchUserSubscriptions);
router.post('/add-points', walletController.addPointsToWallet);
router.get('/wallets', walletController.getAllWallets);
router.get('/user/:userId/wallets', walletController.getUserWallets); // New route for user-specific wallets

module.exports = router;