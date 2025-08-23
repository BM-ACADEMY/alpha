const express = require('express');
const router = express.Router();
const reportsController = require('../controller/reportController');

router.get('/overall', reportsController.getOverallReports);
router.get('/expirations/:period', reportsController.getExpirations);
router.get('/settlements/:period', reportsController.getSettlements);

module.exports = router;