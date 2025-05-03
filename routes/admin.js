const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const {
  validateRepaymentIdParam
} = require("../middlewares/validateRequest"); // 👈 your existing file


// Dashboard overview
router.get(
  "/dashboard",
  requireAuth,
  requireAdmin,
  adminController.getDashboardData
);

router.get(
  "/repayments/pending",
  requireAuth,
  requireAdmin,
  adminController.getPendingRepayments
);

router.put(
  "/repayments/:id/approve",
  requireAuth,
  requireAdmin,
  validateRepaymentIdParam,
  adminController.approveRepayment
);
router.put(
  "/repayments/:id/reject",
  requireAuth,
  requireAdmin,
  validateRepaymentIdParam,
  adminController.rejectRepayment
);

// Harvest approvals
// Harvest approvals
router.put("/harvests/:id/approve", requireAuth, requireAdmin, adminController.approveHarvest);
router.put("/harvests/:id/reject", requireAuth, requireAdmin, adminController.rejectHarvest);

// Loan approvals
router.put("/loans/:id/approve", requireAuth, requireAdmin, adminController.approveLoan);
router.put("/loans/:id/reject", requireAuth, requireAdmin, adminController.rejectLoan);

// Input request approvals
router.put("/inputs/:id/approve", requireAuth, requireAdmin, adminController.approveInputRequest);
router.put("/inputs/:id/reject", requireAuth, requireAdmin, adminController.rejectInputRequest);

// Warehouse receipt approvals
router.put("/receipts/:id/approve", requireAuth, requireAdmin, adminController.approveWarehouseReceipt);
router.put("/receipts/:id/reject", requireAuth, requireAdmin, adminController.rejectWarehouseReceipt);

// View farmers
router.get("/farmers", requireAuth, requireAdmin, adminController.getAllFarmers);

router.get(
  "/harvests",
  requireAuth,
  requireAdmin,
  adminController.getAllHarvests
);

router.get("/loans", requireAuth, requireAdmin, adminController.getAllLoans);

router.get(
  "/profile",
  requireAuth,
  requireAdmin,
  adminController.getAdminProfile
);
router.put(
  "/profile",
  requireAuth,
  requireAdmin,
  adminController.updateAdminProfile
);

router.post(
  "/messages/send",
  requireAuth,
  requireAdmin,
  adminController.sendMessageToFarmer
);



module.exports = router;
