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

router.get(
  "/harvests/:id",
  requireAuth,
  requireFarmer,
  farmerController.getHarvestById
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

router.get("/loans/:id", requireAuth, farmerController.getLoanById);
router.get("/loans", requireAuth, requireFarmer, farmerController.getMyLoans);

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
  validateRepaymentRequest,
  farmerController.createRepayment
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


// View profile
router.get("/profile", requireAuth, requireFarmer, farmerController.getProfile);

// Update profile
router.put("/profile", requireAuth, requireFarmer, farmerController.updateProfile);

module.exports = router;