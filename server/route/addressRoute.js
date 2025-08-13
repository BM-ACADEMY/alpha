const express = require("express");
const router = express.Router();
const addressController = require("../controller/addressController");

router.get("/", addressController.getAddresses);
router.get("/:id", addressController.getAddressById);
router.post("/", addressController.createAddress);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
