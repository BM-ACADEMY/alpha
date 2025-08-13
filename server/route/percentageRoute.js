const express = require("express");
const router = express.Router();
const percentageController = require("../controller/percentageController");

router.get("/", percentageController.getPercentages);
router.get("/:id", percentageController.getPercentageById);
router.post("/", percentageController.createPercentage);
router.put("/:id", percentageController.updatePercentage);
router.delete("/:id", percentageController.deletePercentage);

module.exports = router;
