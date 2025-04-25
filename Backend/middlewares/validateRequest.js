const { body, validationResult } = require("express-validator");

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
