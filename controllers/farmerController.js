// controllers/farmerController.js
const path = require("path");
const Loan = require("../models/Loan");
const Repayment = require("../models/repayment");
const Harvest = require("../models/harvest");
const Message = require("../models/message");
const InputRequest = require("../models/InputRequest");


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
      Message.find({ recipient: farmerId })
        .select("title body isRead createdAt")
        .sort({ isRead: 1, createdAt: -1 }),
    ]);

    const approvedLoans = loans.filter((loan) => loan.status === "approved");
    const totalOwed = approvedLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalPaid = repayments.reduce((sum, rep) => sum + rep.amount, 0);

    const approvedHarvests = harvests.filter((h) => h.status === "approved");
    const latestApprovedHarvest = approvedHarvests[approvedHarvests.length - 1];

    const eligibleLoan = latestApprovedHarvest
      ? Math.floor(latestApprovedHarvest.harvest_amount * 10)
      : 0;

    const recentLoans = loans.slice(-5).reverse();
    const recentMessages = messages.slice(0, 5);
    const unreadMessagesCount = messages.filter((msg) => !msg.isRead).length;

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

    if (!harvest_amount || !crop) {
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
    const harvests = await Harvest.find({ farmer: farmerId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ harvests });
  } catch (err) {
    console.error("Error fetching harvests:", err);
    return next({ status: 500, message: "Failed to fetch harvests" });
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
    const eligibleLoan = latestHarvest.harvest_amount * 10; // Example formula

    if (amount > eligibleLoan) {
      return next({
        status: 400,
        message: `You can only request up to ${eligibleLoan}`,
      });
    }

    const newLoan = new Loan({
      farmer: farmerId,
      amount,
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



exports.editPendingLoan = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const { loanId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
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
    const { loanId, amount, notes } = req.body;
    const receiptImage = req.file?.path;

    if (!receiptImage) {
      return next({ status: 400, message: "Receipt image is required" });
    }

    if (!loanId || !amount || amount <= 0) {
      return next({
        status: 400,
        message: "Valid loanId and repayment amount are required",
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
      receiptImage,
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


exports.sendMessage = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const message = new Message({
      recipient: req.user.id,
      title,
      content,
      isRead: false, // Initially, the message is unread
    });

    await message.save();

    return res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    return next({ status: 500, message: "Failed to send message" });
  }
};


exports.markMessageAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message || message.recipient.toString() !== req.user.id) {
      return next({ status: 404, message: "Message not found" });
    }

    // Mark the message as read
    message.isRead = true;
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
      recipient: req.user.id,
      isRead: false,
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

    if (!message || message.recipient.toString() !== req.user.id) {
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


exports.createInputRequest = async (req, res, next) => {
  try {
    const { items, preferredDate, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next({
        status: 400,
        message: "At least one input item must be provided",
      });
    }

    const invalidItem = items.find(
      (item) =>
        !item.name ||
        typeof item.name !== "string" ||
        !item.quantity ||
        typeof item.quantity !== "number"
    );

    if (invalidItem) {
      return next({
        status: 400,
        message: "Each item must include a name and numeric quantity",
      });
    }

    const newRequest = new InputRequest({
      farmer: req.user.id,
      items,
      preferredDate,
      notes,
    });

    await newRequest.save();

    res.status(201).json({
      message: "Input request submitted successfully",
      inputRequest: newRequest,
    });
  } catch (err) {
    console.error("Error creating input request:", err);
    return next({ status: 500, message: "Error submitting input request" });
  }
};

exports.getInputRequests = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const { status } = req.query;

    const query = { farmer: farmerId };

    if (status) {
      query.status = status;
    }

    const requests = await InputRequest.find(query).sort({ createdAt: -1 });

    res.status(200).json({ inputRequests: requests });
  } catch (err) {
    console.error("Error fetching input requests:", err);
    return next({ status: 500, message: "Failed to fetch input requests" });
  }
};



exports.editInputRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    const { items, preferredDate, notes } = req.body;

    const request = await InputRequest.findOne({ _id: id, farmer: farmerId });

    if (!request) {
      return next({ status: 404, message: "Input request not found" });
    }

    if (request.status !== "pending") {
      return next({
        status: 400,
        message: "Only pending requests can be edited",
      });
    }

    if (items) request.items = items;
    if (preferredDate) request.preferredDate = preferredDate;
    if (notes) request.notes = notes;

    await request.save();

    res.status(200).json({ message: "Input request updated", request });
  } catch (err) {
    console.error("Error editing input request:", err);
    return next({ status: 500, message: "Failed to edit input request" });
  }
};



exports.cancelInputRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;

    const request = await InputRequest.findOne({ _id: id, farmer: farmerId });

    if (!request) {
      return next({ status: 404, message: "Input request not found" });
    }

    if (request.status !== "pending") {
      return next({
        status: 400,
        message: "Only pending requests can be cancelled",
      });
    }

    await InputRequest.deleteOne({ _id: id });

    res.status(200).json({ message: "Input request cancelled" });
  } catch (err) {
    console.error("Error cancelling input request:", err);
    return next({ status: 500, message: "Failed to cancel input request" });
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
