const express = require("express");
const router = express.Router();
const percentageController = require("../controller/percentageController");

router.get("/fetch-all-percentages", percentageController.getPercentages);
router.get("/fetch-percentage-by-id/:id", percentageController.getPercentageById);
router.post("/add-percentage", percentageController.createPercentage);
router.put("/update-percentage/:id", percentageController.updatePercentage);
router.delete("/delete-percentage/:id", percentageController.deletePercentage);

module.exports = router;
