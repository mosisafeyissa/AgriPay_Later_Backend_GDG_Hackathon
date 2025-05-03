const User = require("../models/User");
const Loan = require("../models/Loan");
const Harvest = require("../models/harvest");
const Repayment = require("../models/repayment");
const CropReport = require("../models/CropReport");
const WarehouseReceipt = require("../models/WarehouseReceipt");
const InputRequest = require("../models/InputRequest");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");


const getDashboardData = async (req, res) => {
  try {
    const farmerCount = await User.countDocuments({ role: "farmer" });
    const loanCount = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: "pending" });
    const repaymentCount = await Repayment.countDocuments();
    const pendingHarvests = await Harvest.countDocuments({ status: "pending" });
    const pendingRepayments = await Repayment.countDocuments({
      status: "pending",
    });
    const cropReportCount = await CropReport.countDocuments();
    const receiptCount = await WarehouseReceipt.countDocuments();
    const inputRequestCount = await InputRequest.countDocuments();

    res.json({
      farmerCount,
      loanCount,
      pendingHarvests,
      pendingLoans,
      repaymentCount,
      pendingRepayments,
      cropReportCount,
      receiptCount,
      inputRequestCount,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error.message);
    res.status(500).json({ message: "Server error retrieving dashboard data" });
  }
};

const getPendingRepayments = async (req, res) => {
  try {
    const repayments = await Repayment.find({ status: "pending" }).populate(
      "farmerId",
      "fullName phoneNumber"
    );
    const formatted = repayments.map((r) => ({
      _id: r._id,
      farmer: r.farmerId,
      amount: r.amount,
      date: r.date,
      receiptImage: `${req.protocol}://${req.get("host")}/${r.receiptImage}`, // Full URL
      status: r.status,
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching repayments:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const approveRepayment = async (req, res, next) => {
  try {
    const repaymentId = req.params.id;

    const repayment = await Repayment.findById(repaymentId);
    if (!repayment) {
      return res.status(404).json({ error: "Repayment not found" });
    }

    if (repayment.status === "approved") {
      return res.status(400).json({ error: "Repayment already approved" });
    }

    repayment.status = "approved";
    await repayment.save();

    // Optional: Update loan balance
    const loan = await Loan.findById(repayment.loanId);
    if (loan) {
      loan.amountRepaid = (loan.amountRepaid || 0) + repayment.amount;
      if (loan.amountRepaid >= loan.amount) {
        loan.status = "fully paid";
      }
      await loan.save();
    }

    res
      .status(200)
      .json({ message: "Repayment approved successfully", repayment });
  } catch (err) {
    next(err);
  }
};

// Reject repayment
const rejectRepayment = async (req, res, next) => {
  try {
    const repaymentId = req.params.id;

    const repayment = await Repayment.findById(repaymentId);
    if (!repayment) {
      return res.status(404).json({ error: "Repayment not found" });
    }

    if (repayment.status === "rejected") {
      return res.status(400).json({ error: "Repayment already rejected" });
    }

    repayment.status = "rejected";
    await repayment.save();

    res
      .status(200)
      .json({ message: "Repayment rejected successfully", repayment });
  } catch (err) {
    next(err);
  }
};

const approveHarvest = async (req, res, next) => {
  try {
    const harvest = await Harvest.findById(req.params.id);
    if (!harvest) return res.status(404).json({ message: "Harvest not found" });

    harvest.status = "approved";
    await harvest.save();
    res.json({ message: "Harvest approved successfully", harvest });
  } catch (err) {
    next(err);
  }
};

// Reject harvest
const rejectHarvest = async (req, res, next) => {
  try {
    const harvest = await Harvest.findById(req.params.id);
    if (!harvest) return res.status(404).json({ message: "Harvest not found" });

    harvest.status = "rejected";
    await harvest.save();
    res.json({ message: "Harvest rejected successfully", harvest });
  } catch (err) {
    next(err);
  }
};

// Approve loan
const approveLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    loan.status = "approved";
    await loan.save();
    res.json({ message: "Loan approved successfully", loan });
  } catch (err) {
    next(err);
  }
};

// Reject loan
const rejectLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    loan.status = "rejected";
    await loan.save();
    res.json({ message: "Loan rejected successfully", loan });
  } catch (err) {
    next(err);
  }
};

// Approve input request
const approveInputRequest = async (req, res, next) => {
  try {
    const request = await InputRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Input request not found" });
    }

    request.status = "approved";
    await request.save();

    res.json({ message: "Input request approved successfully", request });
  } catch (err) {
    next(err);
  }
};

// Reject input request
const rejectInputRequest = async (req, res, next) => {
  try {
    const request = await InputRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Input request not found" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Input request rejected successfully", request });
  } catch (err) {
    next(err);
  }
};


// Approve warehouse receipt
const approveWarehouseReceipt = async (req, res, next) => {
  try {
    const receipt = await WarehouseReceipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: "Warehouse receipt not found" });
    }

    receipt.status = "approved";
    await receipt.save();

    res.json({ message: "Warehouse receipt approved successfully", receipt });
  } catch (err) {
    next(err);
  }
};

// Reject warehouse receipt
const rejectWarehouseReceipt = async (req, res, next) => {
  try {
    const receipt = await WarehouseReceipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: "Warehouse receipt not found" });
    }

    receipt.status = "rejected";
    await receipt.save();

    res.json({ message: "Warehouse receipt rejected successfully", receipt });
  } catch (err) {
    next(err);
  }
};


const getAllFarmers = async (req, res, next) => {
  try {
    const { name, phone } = req.query;

    const query = { role: "farmer" };

    if (name) {
      query.name = { $regex: name, $options: "i" }; // case-insensitive partial match
    }

    if (phone) {
      query.phone = { $regex: phone, $options: "i" };
    }

    const farmers = await User.find(query).select("-password");

    res.json(farmers);
  } catch (err) {
    next(err);
  }
};


const getAllHarvests = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;

    const filter = {};

    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const harvests = await Harvest.find(filter)
      .populate("farmerId", "fullName phoneNumber id_number")
      .sort({ createdAt: -1 });

    res.json(harvests);
  } catch (err) {
    next(err);
  }
};


const getAllLoans = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const loans = await Loan.find(query)
      .populate("farmerId", "fullName phoneNumber")
      .sort({ date: -1 });

    const formatted = loans.map((loan) => ({
      _id: loan._id,
      amount: loan.amount,
      status: loan.status,
      reason: loan.reason,
      date: loan.date,
      amountRepaid: loan.amountRepaid || 0,
      farmer: loan.farmerId,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching loans:", err.message);
    res.status(500).json({ message: "Server error retrieving loans" });
  }
};


// Get admin profile
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.id).select("-password");
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (err) {
    next(err);
  }
};

// Update admin profile
const updateAdminProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update fields (except role and password unless explicitly changed)
    for (let key of Object.keys(updates)) {
      if (key === "password") {
        admin.password = await bcrypt.hash(updates.password, 10);
      } else if (key !== "role") {
        admin[key] = updates[key];
      }
    }

    await admin.save();

    res.json({ message: "Profile updated successfully", admin: admin.toObject({ getters: true }) });
  } catch (err) {
    next(err);
  }
};

const sendMessageToFarmer = async (req, res, next) => {
  try {
    const { farmerId, subject, body } = req.body;

    if (!farmerId || !subject || !body) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const farmer = await User.findById(farmerId);
    if (!farmer || farmer.role !== "farmer") {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const message = await Message.create({
      senderId: req.user.id,
      recipientId: farmerId,
      subject,
      body,
    });

    res.status(201).json({ message: "Message sent to farmer", data: message });
  } catch (err) {
    next(err);
  }
};



module.exports = {
  getPendingRepayments,
  getDashboardData,
  approveRepayment,
  rejectRepayment,
  approveHarvest,
  rejectHarvest,
  approveLoan,
  rejectLoan,
  approveInputRequest,
  rejectInputRequest,
  approveWarehouseReceipt,
  rejectWarehouseReceipt,
  getAllFarmers,
  getAllHarvests,
  getAllLoans,
  getAdminProfile,
  updateAdminProfile,
  sendMessageToFarmer,
};

