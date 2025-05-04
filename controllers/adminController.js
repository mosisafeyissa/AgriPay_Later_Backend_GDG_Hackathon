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

const getFarmerById = async (req, res, next) => {
  try {
    const farmerId = req.params.id;

    const farmer = await User.findOne({ _id: farmerId, role: "farmer" }).select(
      "-password"
    );

    if (!farmer) {
      return next({ status: 404, message: "Farmer not found" });
    }

    res.status(200).json(farmer);
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
      .populate("farmer", "name phone")
      .sort({ createdAt: -1 });

    res.json(harvests);
  } catch (err) {
    next(err);
  }
};

const getHarvestById = async (req, res, next) => {
  try {
    const harvestId = req.params.id;

    const harvest = await Harvest.findById(harvestId).populate(
      "farmer",
      "name phone"
    );

    if (!harvest) {
      return res.status(404).json({ message: "Harvest not found" });
    }

    res.status(200).json({
      _id: harvest._id,
      cropType: harvest.crop,
      harvest_amount: harvest.harvest_amount,
      status: harvest.status,
      createdAt: harvest.createdAt,
      farmer: harvest.farmer,
    });
  } catch (err) {
    console.error("Error fetching harvest:", err.message);
    res.status(500).json({ message: "Server error retrieving harvest" });
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


const getAllLoans = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;

    if (startDate || endDate) {
      query.created_at = {}; // not query.date
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    const loans = await Loan.find(query)
      .populate("farmer", "name phone")
      .sort({ created_at: -1 });

    const formatted = loans.map((loan) => ({
      _id: loan._id,
      amount: loan.amount,
      status: loan.status,
      reason: loan.reason,
      date: loan.created_at,
      due_date: loan.due_date,
      amountRepaid: loan.amountRepaid || 0,
      farmer: loan.farmer,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching loans:", err.message);
    res.status(500).json({ message: "Server error retrieving loans" });
  }
};

const getLoanById = async (req, res, next) => {
  try {
    const loanId = req.params.id;

    const loan = await Loan.findById(loanId).populate(
      "farmer",
      "name phone"
    );

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.json({
      _id: loan._id,
      amount: loan.amount,
      status: loan.status,
      reason: loan.reason,
      due_date: loan.due_date,
      amountRemaining: loan.amountRemaining,
      created_at: loan.created_at,
      farmer: loan.farmer,
    });
  } catch (err) {
    console.error("Error fetching loan by ID:", err.message);
    res.status(500).json({ message: "Server error retrieving loan" });
  }
};

const approveLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    if (loan.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending loans can be approved" });
    }

    loan.status = "approved";
    loan.due_date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); 
    loan.approved_by = req.user.id; 
    await loan.save();

    res.json({ message: "Loan approved successfully", loan });
  } catch (err) {
    next(err);
  }
};

const approveRepayment = async (req, res, next) => {
  try {
    const repaymentId = req.params.id;
    const adminId = req.user.id; 

    const repayment = await Repayment.findById(repaymentId);
    if (!repayment) {
      return res.status(404).json({ error: "Repayment not found" });
    }

    if (repayment.status === "approved") {
      return res.status(400).json({ error: "Repayment already approved" });
    }

    // Update repayment fields
    repayment.status = "approved";
    repayment.isApproved = true;
    repayment.approvedAt = new Date();
    repayment.approvedBy = adminId;
    await repayment.save();

    // Update loan balance
    const loan = await Loan.findById(repayment.loan);
    if (!loan) {
      return res.status(404).json({ error: "Associated loan not found" });
    }

    loan.amountRemaining -= repayment.amount;

    if (loan.amountRemaining <= 0) {
      loan.amountRemaining = 0;
      loan.status = "repaid";
    }

    await loan.save();

    res.status(200).json({
      message: "Repayment approved and loan updated successfully",
      repayment,
      loan,
    });
  } catch (err) {
    console.error("Error approving repayment:", err);
    next(err);
  }
};

const getAllRepayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const repayments = await Repayment.find(filter)
      .populate("farmer", "name phone")
      .populate("loan", "amount status amountRemaining")
      .sort({ createdAt: -1 });

    res.status(200).json(repayments);
  } catch (err) {
    console.error("Error fetching repayments:", err);
    res.status(500).json({ message: "Server error retrieving repayments" });
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
        if (typeof updates.password !== "string" || updates.password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
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

const sendMessage = async (req, res, next) => {
  try {
    const { farmerIds, content, type } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    if (!["alert", "reminder", "info"].includes(type)) {
      return res
        .status(400)
        .json({
          message: "Message type must be one of: alert, reminder, info",
        });
    }

    let recipients = [];

    if (farmerIds === "all") {
      recipients = await User.find({ role: "farmer" });
    } else if (Array.isArray(farmerIds)) {
      recipients = await User.find({ _id: { $in: farmerIds }, role: "farmer" });
    } else {
      return res
        .status(400)
        .json({ message: "`farmerIds` must be 'all' or an array of IDs" });
    }

    if (recipients.length === 0) {
      return res
        .status(404)
        .json({ message: "No farmers found to send messages" });
    }

    const messages = recipients.map((farmer) => ({
      sender: req.user.id,
      to_farmer: farmer._id,
      content,
      type,
    }));

    const result = await Message.insertMany(messages);

    res.status(201).json({
      message: `Message sent to ${recipients.length} farmer(s)`,
      data: result,
    });
  } catch (err) {
    console.error("Error sending messages:", err);
    next(err);
  }
};


const getMessageHistory = async (req, res, next) => {
  try {
    const messages = await Message.find()
      .populate("to_farmer", "name phone")
      .populate("sender", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    next(err);
  }
};



// const sendMessageToFarmer = async (req, res, next) => {
//   try {
//     const { farmerId, subject, body } = req.body;

//     if (!farmerId || !subject || !body) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const farmer = await User.findById(farmerId);
//     if (!farmer || farmer.role !== "farmer") {
//       return res.status(404).json({ message: "Farmer not found" });
//     }

//     const message = await Message.create({
//       senderId: req.user.id,
//       recipientId: farmerId,
//       subject,
//       body,
//     });

//     res.status(201).json({ message: "Message sent to farmer", data: message });
//   } catch (err) {
//     next(err);
//   }
// };



module.exports = {
  getDashboardData,
  approveRepayment,
  rejectRepayment,
  approveHarvest,
  rejectHarvest,
  approveLoan,
  rejectLoan,
  getAllFarmers,
  getAllHarvests,
  getAllLoans,
  getAdminProfile,
  updateAdminProfile,
  sendMessage,
  getFarmerById,
  getLoanById,
  getHarvestById,
  getAllRepayments,
  getMessageHistory,
};

