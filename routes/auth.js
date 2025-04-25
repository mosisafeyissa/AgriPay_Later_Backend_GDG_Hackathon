const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const upload = require("../middlewares/uploadMiddleware");
const {
  validateRegistration,
  validateLogin,
} = require("../middlewares/validateRequest");

router.post(
  "/register",
  upload.single("id_photo"),
  validateRegistration,
  authController.register
);

router.post("/login", validateLogin, authController.login);
 
module.exports = router;