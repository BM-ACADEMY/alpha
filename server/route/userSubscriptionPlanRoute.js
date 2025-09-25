const express = require("express");
const router = express.Router();
const userSubscriptionPlan = require("../controller/userSubscriptionPlanController");

// Log incoming requests for debugging
router.use((req, res, next) => {
  console.log(`Route hit: ${req.method} ${req.path}`);
  next();
});

// Search user
router.get("/search-user", userSubscriptionPlan.searchUser);

// Get plans
router.get("/plans", userSubscriptionPlan.getPlans);

// Get admin account
router.get("/admin-account/:role_id", userSubscriptionPlan.getAdminAccount);

// Create subscription
router.post("/subscribe", userSubscriptionPlan.createSubscription);

// Upload screenshot
router.post("/upload-screenshot", userSubscriptionPlan.uploadScreenshot);

// Get purchased plans
router.get("/purchased-plans", userSubscriptionPlan.getPurchasedPlans);

// Verify
router.patch("/verify/:id", userSubscriptionPlan.verifySubscription);


// Reject
router.patch("/reject/:id", userSubscriptionPlan.rejectSubscription);
router.get("/images/:folderName/:fileName", userSubscriptionPlan.getImage);



module.exports = router;