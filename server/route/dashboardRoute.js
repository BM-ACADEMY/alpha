const express = require('express');
const router = express.Router();
const { getDashboardData,getUserDashboardData } = require('../controller/dashboardController');

router.get('/dashboard', getDashboardData);
router.get('/user-dashboard/:id', getUserDashboardData);

module.exports = router;