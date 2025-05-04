const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, land_size, crop_type } =
      req.body;

    // Check for duplicate email or phone
    const [existingEmail, existingPhone] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ phone }),
    ]);

    if (existingEmail || existingPhone) {
      return next({
        status: 400,
        message:
          existingEmail && existingPhone
            ? "User with this email and phone already exists"
            : existingEmail
            ? "User with this email already exists"
            : "User with this phone number already exists",
      });
    }

    // Validate farmer-specific fields
    if (role === "farmer") {
      if (!land_size || !crop_type) {
        return next({
          status: 400,
          message: "Farmer land size and crop type are required",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      land_size,
      crop_type,
    });

    await newUser.save();

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return next({ status: 500, message: "Server error during registration" });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next({
        status: 400,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) return next({ status: 404, message: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return next({ status: 401, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    let userData = {
      id: user._id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
    };

    if (user.role === "farmer") {
      userData.land_size = user.land_size;
      userData.crop_type = user.crop_type;
    }

    res.json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Login error:", err);
    return next({ status: 500, message: "Server error during login" });
  }
};
