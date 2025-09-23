const express = require('express');
const router = express.Router();
const walletController = require('../controller/walletController');

// Routes for wallet operations
router.get('/search-subscriptions', walletController.searchUserSubscriptions);
router.post('/add-points', walletController.addPointsToWallet);
router.get('/wallets', walletController.getAllWallets);


module.exports = router;