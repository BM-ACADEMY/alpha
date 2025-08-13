const express = require("express");
const router = express.Router();
const planController = require("../controller/planController");

router.get("/", planController.getPlans);
router.get("/:id", planController.getPlanById);
router.post("/", planController.createPlan);
router.put("/:id", planController.updatePlan);
router.delete("/:id", planController.deletePlan);

module.exports = router;
