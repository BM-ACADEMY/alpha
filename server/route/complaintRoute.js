const express = require('express');
const router = express.Router();
const complaintController = require('../controller/complaintController');

// POST /complaints - Create
router.post('/', complaintController.createComplaint);

// GET /complaints - Get all
router.get('/', complaintController.getAllComplaints);

// GET /complaints/:id - Get by ID
router.get('/:id', complaintController.getComplaintById);

// DELETE /complaints/:id - Delete
router.delete('/:id', complaintController.deleteComplaint);

module.exports = router;
