const express = require("express");
const router = express.Router();
const userController = require("../controller/usersController");
const authMiddleware=require("../middleware/authMiddleware");

router.post('/register', userController.registerUser);
router.post('/verify-email', userController.verifyEmail);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/logout', userController.logout);
// Protected routes (auth required)
router.get("/", authMiddleware, userController.getUsers);
router.get("/user-info", authMiddleware, userController.getUserInfo);
router.post("/", authMiddleware, userController.createUser);
router.put("/:id", authMiddleware, userController.updateUser);
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;
