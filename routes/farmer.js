// routes/farmer.js
const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmerController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireFarmer } = require("../middlewares/authMiddleware");
const {
  validateHarvest,
  validateLoanRequest,
  validateRepaymentRequest,
} = require("../middlewares/validateRequest");
const { validateInputRequest } = require("../middlewares/validateRequest");
const { validateEditInputRequest } = require("../middlewares/validateRequest");
const multer = require("multer");
const upload = multer({ dest: "uploads/receipts/" });


router.get(
  "/dashboard",
  requireAuth,
  requireFarmer,
  farmerController.getFarmerDashboard
);

router.post(
  "/harvests",
  requireAuth,
  requireFarmer,
  validateHarvest,
  farmerController.createHarvest
);

router.get(
  "/harvests",
  requireAuth,
  requireFarmer,
  farmerController.getHarvests
);

router.put(
  "/harvests/:id",
  requireAuth,
  requireFarmer,
  validateHarvest,
  farmerController.updateHarvest
);

router.post(
  "/loans",
  requireAuth,
  requireFarmer,
  validateLoanRequest,
  farmerController.requestLoan
);


//not found
// router.get("/loans", requireAuth, requireFarmer, farmerController.getLoans);

router.patch(
  "/loans/:loanId",
  requireAuth,
  requireFarmer,
  validateLoanRequest, 
  farmerController.editPendingLoan
);

router.delete(
  "/loans/:loanId",
  requireAuth,
  requireFarmer,
  farmerController.cancelPendingLoan
);

router.post(
  "/repayments",
  requireAuth,
  requireFarmer,
  upload.single("receiptImage"),
  validateRepaymentRequest,
  farmerController.createRepayment
);


router.post(
  "/messages",
  requireAuth,
  requireFarmer,
  farmerController.sendMessage
);


router.put(
  "/messages/:messageId/markAsRead",
  requireAuth,
  requireFarmer,
  farmerController.markMessageAsRead
);


router.get(
  "/messages/unread",
  requireAuth,
  requireFarmer,
  farmerController.getUnreadMessages
);

router.delete(
  "/messages/:messageId",
  requireAuth,
  requireFarmer,
  farmerController.deleteMessage
);


router.post(
  "/input-requests",
  requireAuth,
  requireFarmer,
  validateInputRequest,
  farmerController.createInputRequest
);


router.get(
  "/input-requests",
  requireAuth,
  requireFarmer,
  farmerController.getInputRequests
);


router.patch(
  "/input-requests/:id",
  requireAuth,
  requireFarmer,
  validateEditInputRequest,
  farmerController.editInputRequest
);

router.delete(
  "/input-requests/:id",
  requireAuth,
  requireFarmer,
  farmerController.cancelInputRequest
);


// View profile
router.get("/profile", requireAuth, requireFarmer, farmerController.getProfile);

// Update profile
router.put("/profile", requireAuth, requireFarmer, farmerController.updateProfile);

module.exports = router;