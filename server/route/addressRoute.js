// Updated addressRouter.js

const express = require("express");
const router = express.Router();
const addressController = require("../controller/addressController");

router.get("/", addressController.getAddresses);
router.get("/user/:userId", addressController.getUserAddresses);
router.get("/:id", addressController.getAddressById);
router.post("/create-address", addressController.createAddress);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);
router.patch("/:id", addressController.updateAddress);

module.exports = router;