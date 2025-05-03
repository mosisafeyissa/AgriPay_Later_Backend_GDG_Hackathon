const { body, validationResult } = require("express-validator");
const { param } = require("express-validator");

exports.validateRegistration = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isAlpha("en-US", { ignore: " " })
    .withMessage("Name must contain only letters"),

  body("id_number")
    .isLength({ min: 5 })
    .withMessage("ID number must be at least 5 digits"),

  body("phone")
    .matches(/^(\+251|0)?9\d{8}$/)
    .withMessage("Invalid Ethiopian phone number"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .isIn(["farmer", "admin"])
    .withMessage("Role must be farmer or admin"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];


exports.validateLogin = [
  body("id_number")
    .notEmpty()
    .withMessage("ID number is required")
    .isLength({ min: 5 })
    .withMessage("ID number must be at least 5 digits"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];

exports.validateHarvest = [
  body("harvest_amount")
    .notEmpty()
    .withMessage("Harvest amount is required")
    .isNumeric()
    .withMessage("Harvest amount must be a number"),

  body("crop").notEmpty().withMessage("Crop type is required"),

  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string"),

  body("notes").optional().isString().withMessage("Notes must be a string"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];



exports.validateLoanRequest = [
  body("amount")
    .notEmpty()
    .withMessage("Loan amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Loan amount must be a positive number"),

  body("reason")
    .optional()
    .isString()
    .withMessage("Reason must be a string"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];


exports.validateRepaymentRequest = [
  body("loanId").notEmpty().withMessage("Loan ID is required"),
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];


exports.validateInputRequest = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one input item is required"),

  body("items.*.name").notEmpty().withMessage("Item name is required"),

  body("items.*.quantity")
    .isFloat({ gt: 0 })
    .withMessage("Quantity must be a positive number"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];



exports.validateEditInputRequest = [
  body("items")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Items must be a non-empty array"),
  body("items.*.name")
    .optional()
    .isString()
    .withMessage("Each item must have a name"),
  body("items.*.quantity")
    .optional()
    .isNumeric()
    .withMessage("Quantity must be a number"),
  body("items.*.unit")
    .optional()
    .isString()
    .withMessage("Each item must have a unit"),
  body("preferredDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Preferred date must be a valid date"),
  body("notes").optional().isString().withMessage("Notes must be a string"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];

exports.validateRepaymentIdParam = [
  param("id").isMongoId().withMessage("Invalid repayment ID"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ status: 400, message: errors.array() });
    }
    next();
  },
];