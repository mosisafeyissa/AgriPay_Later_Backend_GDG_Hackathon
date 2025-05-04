// controllers/farmerController.js
const path = require("path");
const Loan = require("../models/Loan");
const Repayment = require("../models/repayment");
const Harvest = require("../models/harvest");
const Message = require("../models/Message");
const InputRequest = require("../models/InputRequest");
const mongoose = require("mongoose");


exports.getFarmerDashboard = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next({ status: 400, message: "Invalid user information" });
    }

    const farmerId = req.user.id;

    const [loans, repayments, harvests, messages] = await Promise.all([
      Loan.find({ farmer: farmerId }),
      Repayment.find({ farmer: farmerId }),
      Harvest.find({ farmer: farmerId }),
      Message.find({ to_farmer: farmerId })
        .select("content type seen createdAt")
        .sort({ isRead: 1, createdAt: -1 }),
    ]);

    const approvedLoans = loans.filter((loan) => loan.status === "approved");
    const totalOwed = approvedLoans.reduce(
      (sum, loan) => sum + loan.amountRemaining,
      0
    );

    const totalPaid = repayments.reduce((sum, rep) => sum + rep.amount, 0);

    const approvedHarvests = harvests.filter((h) => h.status === "approved");
    const latestApprovedHarvest = approvedHarvests[approvedHarvests.length - 1];

    const eligibleLoan = latestApprovedHarvest?.harvest_amount
      ? Math.floor(latestApprovedHarvest.harvest_amount * 10)
      : 0;

    const recentLoans = loans.slice(-5).reverse();
    const recentMessages = messages.slice(0, 5);
    const unreadMessagesCount = messages.filter((msg) => !msg.seen).length;

    res.status(200).json({
      summary: {
        totalOwed,
        totalPaid,
        eligibleLoan,
        totalLoans: loans.length,
        totalRepayments: repayments.length,
        totalHarvests: harvests.length,
        unreadMessagesCount,
      },
      recentLoans,
      recentMessages,
    });
  } catch (err) {
    console.error("Farmer dashboard error:", err);
    return next({ status: 500, message: "Error loading dashboard" });
  }
};

exports.createHarvest = async (req, res, next) => {
  try {
    const { harvest_amount, crop, location, notes } = req.body;

    if (harvest_amount == null || crop == null || crop.trim() === "") {
      return next({
        status: 400,
        message: "Harvest amount and crop are required",
      });
    }

    const newHarvest = new Harvest({
      farmer: req.user.id,
      harvest_amount,
      crop,
      status: "pending",
      location,
      notes,
    });

    await newHarvest.save();

    return res
      .status(201)
      .json({ message: "Harvest logged successfully", harvest: newHarvest });
  } catch (err) {
    console.error("Error logging harvest:", err);
    return next({ status: 500, message: "Failed to log harvest" });
  }
};


exports.getHarvests = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const harvests = await Harvest.find({
      farmer: new mongoose.Types.ObjectId(farmerId),
    }).sort({
      createdAt: -1,
    });
    res.status(200).json({ harvests });
  } catch (err) {
    console.error("Error fetching harvests:", err);
    return next({ status: 500, message: "Failed to fetch harvests" });
  }
};

exports.getHarvestById = async (req, res, next) => {
  try {
    const harvestId = req.params.id;
    const farmerId = req.user.id;

    const harvest = await Harvest.findById(harvestId);

    if (!harvest) {
      return next({ status: 404, message: "Harvest not found" });
    }

    // Ensure the harvest belongs to the logged-in farmer
    if (harvest.farmer.toString() !== farmerId) {
      return next({
        status: 403,
        message: "Unauthorized to access this harvest",
      });
    }

    res.status(200).json({ harvest });
  } catch (err) {
    console.error("Error fetching specific harvest:", err);
    return next({ status: 500, message: "Failed to fetch harvest" });
  }
};


exports.updateHarvest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { harvest_amount, crop, location, notes } = req.body;

    // Find the harvest first
    const harvest = await Harvest.findOne({ _id: id, farmer: req.user.id });

    if (!harvest) {
      return next({ status: 404, message: "Harvest not found" });
    }

    if (harvest.status !== "pending") {
      return next({
        status: 400,
        message: "Only pending harvests can be edited",
      });
    }

    // Update fields
    harvest.harvest_amount = harvest_amount;
    harvest.crop = crop;
    harvest.location = location;
    harvest.notes = notes;

    // After editing, reset the status to pending again (optional)
    harvest.status = "pending";

    await harvest.save();

    res.status(200).json({ message: "Harvest updated successfully", harvest });
  } catch (err) {
    console.error("Error updating harvest:", err);
    return next({ status: 500, message: "Failed to update harvest" });
  }
};


exports.requestLoan = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const farmerId = req.user.id;

    if (!amount || isNaN(amount)) {
      return next({ status: 400, message: "Amount must be a valid number" });
    }

    // Find latest approved harvest
    const latestHarvest = await Harvest.findOne({
      farmer: farmerId,
      status: "approved",
    }).sort({ createdAt: -1 });

    if (!latestHarvest) {
      return next({
        status: 400,
        message:
          "You must have at least one approved harvest to request a loan",
      });
    }

    // Calculate eligible loan
    if (!latestHarvest.harvest_amount || isNaN(latestHarvest.harvest_amount)) {
      return next({ status: 400, message: "Harvest amount is invalid" });
    }

    const eligibleLoan = Math.floor(latestHarvest.harvest_amount * 10);
 // Example formula

    if (amount > eligibleLoan) {
      return next({
        status: 400,
        message: `You can only request up to ${eligibleLoan}`,
      });
    }

    const newLoan = new Loan({
      farmer: farmerId,
      amount,
      amountRemaining: amount,
      status: "pending",
    });

    await newLoan.save();

    res
      .status(201)
      .json({ message: "Loan request submitted successfully", loan: newLoan });
  } catch (err) {
    console.error("Error requesting loan:", err);
    return next({ status: 500, message: "Failed to request loan" });
  }
};


exports.getLoanById = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const loanId = req.params.id;

    const loan = await Loan.findOne({ _id: loanId, farmer: farmerId });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json({ loan });
  } catch (err) {
    console.error("Error fetching loan:", err);
    next({ status: 500, message: "Failed to fetch loan" });
  }
};


exports.cancelPendingLoan = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const { loanId } = req.params;

    const loan = await Loan.findOne({ _id: loanId, farmer: farmerId });

    if (!loan) {
      return next({ status: 404, message: "Loan not found" });
    }

    if (loan.status !== "pending") {
      return next({
        status: 400,
        message: "Only pending loans can be canceled",
      });
    }

    await Loan.deleteOne({ _id: loanId });

    res.status(200).json({ message: "Pending loan canceled successfully" });
  } catch (err) {
    console.error("Cancel loan error:", err);
    next({ status: 500, message: "Failed to cancel loan" });
  }
};

exports.getMyLoans = async (req, res, next) => {
  try {
    const farmerId = req.user.id;

    const loans = await Loan.find({ farmer: farmerId }).sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (err) {
    console.error("Error fetching loans:", err);
    next({ status: 500, message: "Failed to fetch loans" });
  }
};

exports.editPendingLoan = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const { loanId } = req.params;
    const { amount } = req.body;
    const { reason } = req.body; 

    if (amount == null || isNaN(amount) || amount <= 0) {
      return next({
        status: 400,
        message: "Loan amount must be a positive number",
      });
    }

    const loan = await Loan.findOne({ _id: loanId, farmer: farmerId });

    if (!loan) {
      return next({ status: 404, message: "Loan not found" });
    }

    if (loan.status !== "pending") {
      return next({ status: 400, message: "Only pending loans can be edited" });
    }

    loan.amount = amount;
    loan.amountRemaining = amount;
    if (reason) {
      loan.reason = reason;
    }
    await loan.save();

    res
      .status(200)
      .json({ message: "Pending loan updated successfully", loan });
  } catch (err) {
    console.error("Edit loan error:", err);
    next({ status: 500, message: "Failed to edit loan" });
  }
};


// exports.createRepayment = async (req, res, next) => {
//   try {
//     const { loanId, amount, notes } = req.body;

//     // Validate repayment amount
//     if (amount <= 0) {
//       return next({
//         status: 400,
//         message: "Repayment amount must be greater than zero",
//       });
//     }

//     // Find the loan by ID
//     const loan = await Loan.findById(loanId);

//     if (!loan) {
//       return next({ status: 404, message: "Loan not found" });
//     }

//     if (amount > loan.amountRemaining) {
//       return next({
//         status: 400,
//         message: "Repayment amount cannot exceed the remaining loan balance",
//       });
//     }

//     if (loan.status === "repaid") {
//       return next({
//         status: 400,
//         message: "Loan has already been fully repaid",
//       });
//     }

//     // Create repayment
//     const repayment = new Repayment({
//       loan: loanId,
//       amount,
//       notes,
//     });

//     await repayment.save();

//     // Update loan balance
//     loan.amountRemaining -= amount;

//     // If loan is fully repaid, update its status
//     if (loan.amountRemaining <= 0) {
//       loan.status = "repaid";
//     }

//     await loan.save();

//     res.status(201).json({
//       message: "Repayment successful",
//       repayment,
//       loan,
//     });
//   } catch (err) {
//     console.error("Error making repayment:", err);
//     return next({ status: 500, message: "Error processing repayment" });
//   }
// };

exports.createRepayment = async (req, res, next) => {
  try {
    const { loanId, amount, notes, method } = req.body;

    if (!loanId || !amount || amount <= 0) {
      return next({
        status: 400,
        message: "Valid loanId and repayment amount are required",
      });
    }

    if (!method || !["mobile_money", "bank", "cash"].includes(method)) {
      return next({
        status: 400,
        message: "Repayment method must be one of: mobile_money, bank, or cash",
      });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) return next({ status: 404, message: "Loan not found" });

    if (loan.status === "repaid") {
      return next({
        status: 400,
        message: "Loan has already been fully repaid",
      });
    }

    const repayment = new Repayment({
      loan: loanId,
      amount,
      notes,
      method,
      status: "pending",
      farmer: req.user.id,
    });

    await repayment.save();

    res.status(201).json({
      message: "Repayment submitted. Awaiting approval.",
      repayment,
    });
  } catch (err) {
    console.error("Error submitting repayment:", err);
    return next({ status: 500, message: "Error processing repayment" });
  }
};


exports.getProfile = async (req, res, next) => {
  try {
    const farmer = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }
    res.json(farmer);
  } catch (err) {
    next(err);
  }
};

// PUT /api/farmer/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["name", "phone", "location", "email"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updates[field] = req.body[field];
      }
    });

    const updated = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    next(err);
  }
};



exports.markMessageAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message || message.to_farmer.toString() !== req.user.id) {
      return next({ status: 404, message: "Message not found" });
    }

    // Mark the message as read
    message.seen = true;
    await message.save();

    return res.status(200).json({
      message: "Message marked as read",
      data: message,
    });
  } catch (err) {
    console.error("Error marking message as read:", err);
    return next({ status: 500, message: "Failed to mark message as read" });
  }
};



exports.getUnreadMessages = async (req, res, next) => {
  try {
    const unreadMessages = await Message.find({
      to_farmer: req.user.id, // Use to_farmer instead of recipient
      seen: false, // Check if the message has been seen
    });

    return res.status(200).json({
      message: "Unread messages fetched successfully",
      unreadMessages,
    });
  } catch (err) {
    console.error("Error fetching unread messages:", err);
    return next({ status: 500, message: "Failed to fetch unread messages" });
  }
};



exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message || message.to_farmer.toString() !== req.user.id) {
      return next({ status: 404, message: "Message not found" });
    }

    await message.remove();

    return res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting message:", err);
    return next({ status: 500, message: "Failed to delete message" });
  }
};



exports.getMessagesFromAdmin = async (req, res, next) => {
  try {
    const farmerId = req.user.id;

    const messages = await Message.find({
      to_farmer: farmerId, // Recipient is the logged-in farmer
      sender: { $ne: null }, // Sender should be a valid user (assuming admin sends the message)
    })
      .populate("sender", "name email") // Populate sender's details if needed (e.g., name and email)
      .sort({ timestamp: -1 }); // Sort messages by timestamp in descending order (most recent first)

    if (!messages || messages.length === 0) {
      return res.status(404).json({ message: "No messages from admin found" });
    }

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Error fetching messages from admin:", err);
    return next({
      status: 500,
      message: "Failed to fetch messages from admin",
    });
  }
};
