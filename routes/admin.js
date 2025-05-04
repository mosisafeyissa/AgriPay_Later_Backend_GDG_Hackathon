const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const {
  validateRepaymentIdParam
} = require("../middlewares/validateRequest"); //  your existing file


// Dashboard overview
router.get(
  "/dashboard",
  requireAuth,
  requireAdmin,
  adminController.getDashboardData
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

router.get(
  "/repayments",
  requireAuth,
  requireAdmin,
  adminController.getAllRepayments
);


router.put("/harvests/:id/approve", requireAuth, requireAdmin, adminController.approveHarvest);
router.put("/harvests/:id/reject", requireAuth, requireAdmin, adminController.rejectHarvest);


router.put("/loans/:id/approve", requireAuth, requireAdmin, adminController.approveLoan);
router.put("/loans/:id/reject", requireAuth, requireAdmin, adminController.rejectLoan);



router.get("/farmers", requireAuth, requireAdmin, adminController.getAllFarmers);
router.get(
  "/farmers/:id",
  requireAuth,
  requireAdmin,
  adminController.getFarmerById
);


router.get(
  "/harvests",
  requireAuth,
  requireAdmin,
  adminController.getAllHarvests
);

router.get(
  "/harvests/:id",
  requireAuth,
  requireAdmin,
  adminController.getHarvestById
);

router.get("/loans/:id", requireAuth, requireAdmin, adminController.getLoanById);
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
  adminController.sendMessage
);

router.get(
  "/messages/history",
  requireAuth,
  requireAdmin,
  adminController.getMessageHistory
);



module.exports = router;
