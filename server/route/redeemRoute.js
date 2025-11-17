
const express = require('express');
const router = express.Router();
const redeemController = require('../controller/redeemController');
const authMiddleware = require('../middleware/authMiddleware'); // Adjust path as needed

// POST /redeem - Create redeem request
router.post('/redeem-amount', authMiddleware, redeemController.createRedeemRequest);

// GET /redeem/wallet/:user_id - Get wallet by user ID
router.get('/wallet/:user_id', authMiddleware, redeemController.getWalletByUserId);



// GET /redeem - Get all redeem requests
router.get('/get-all-request', authMiddleware, redeemController.getAllRedeemRequests);

// PATCH /redeem/:id/status - Update redeem request status
router.put('/update-status/:id', authMiddleware, redeemController.updateRedeemStatus);


router.get('/user-requests/:user_id', authMiddleware, redeemController.getUserRedeemRequests);


router.get('/transactions/:user_id', authMiddleware, redeemController.getUserTransactions);


module.exports = router;