const express = require("express");
const router = express.Router();
const { upload } = require("../utils/profileUpload"); // Use profileUpload's upload middleware
const accountController = require("../controller/accountController");

router.get("/", accountController.getAccounts);
// router.get("/:id", accountController.getAccountById);
router.post("/", upload.single('qrcode'), accountController.createAccount);
router.put("/:id", upload.single('qrcode'), accountController.updateAccount);
router.delete("/:id", accountController.deleteAccount);
router.get("/user/:id", accountController.getAccountsByUserId);

module.exports = router;