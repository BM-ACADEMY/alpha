const express = require('express');
const router = express.Router();
const complaintController = require('../controller/complaintController');
const { upload } = require('../utils/FileUpload');
const authMiddleware = require("../middleware/authMiddleware");

// POST /complaints - Create
router.post('/', upload.array('images', 5), complaintController.createComplaint);

// GET /complaints - Get all with pagination
router.get('/fetch-all-complaints', complaintController.getAllComplaints);

// GET /complaints/:id - Get by ID
router.get('/fetch-by-id/:id', complaintController.getComplaintById);

// PATCH /complaints/:id/read - Mark as read
router.patch('/mark-as-read/:id', complaintController.markAsRead);

// POST /complaints/:id/reply - Send reply
router.post('/reply-to-customer/:id/reply', complaintController.sendReply);

// POST /complaints/upload/image - Upload image
router.post('/upload/image', upload.array('images', 5), complaintController.uploadImage);

// DELETE /complaints/:id/images/:filename - Delete image
router.delete('/delete-complaint-images/:id/images/:filename', complaintController.deleteImage);

// GET /complaints/images/:filename - Get image
router.get('/complaint-image/:user_id/:filename',authMiddleware, complaintController.getComplaintImage);

// DELETE /complaints/:id - Delete
router.delete('/delete-complaint/:id', complaintController.deleteComplaint);

module.exports = router;