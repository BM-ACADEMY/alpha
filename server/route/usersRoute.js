const express = require("express");
const router = express.Router();
const userController = require("../controller/usersController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/register', userController.registerUser);
router.get('/admin-info', userController.getAdminInfo);
router.post('/verify-email', userController.verifyEmail);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/logout', userController.logout);
router.put('/update-user/:id', userController.updateUser);
// Protected routes (auth required)
router.get("/fetch-all-users-details", authMiddleware, userController.getUsers);
router.get("/fetch-all-users-details-filter", authMiddleware, userController.getUsersFilter);

router.get("/user-info", authMiddleware, userController.getUserInfo);
router.post("/", authMiddleware, userController.createUser);
router.patch("/:id", authMiddleware, upload.fields([{ name: 'pan_image', maxCount: 1 }, { name: 'aadhar_image', maxCount: 1 }]), userController.updateUser);router.delete("/:id", authMiddleware, userController.deleteUser);
router.get("/:id", authMiddleware, userController.getUserById);
router.get("/fetch-full-details/:id", authMiddleware, userController.getUserDetails);
router.get("/fetch-all-users-details-referral", authMiddleware, userController.getReferralUsers);

router.get("/user-dashboards/:id", authMiddleware, userController.getUserreferralDashboard);
module.exports = router;