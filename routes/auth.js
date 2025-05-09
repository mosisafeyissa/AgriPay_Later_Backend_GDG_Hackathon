const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  validateRegistration,
  validateLogin,
} = require("../middlewares/validateRequest");

router.post("/register", validateRegistration, authController.register);

router.post("/login", validateLogin, authController.login);

module.exports = router;