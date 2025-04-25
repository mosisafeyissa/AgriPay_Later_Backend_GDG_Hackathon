const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { deleteFile } = require("../services/fileHelper");

exports.register = async (req, res, next) => {
  try {
    const { name, id_number, phone, password, role, land_size, crop_type } =
      req.body;

    if (!req.file) {
      return next({ status: 400, message: "ID photo is required" });
    }

    const id_photo_url = `/uploads/id_photos/${req.file.filename}`;

    const [existingId, existingPhone] = await Promise.all([
      User.findOne({ id_number }),
      User.findOne({ phone }),
    ]);

    if (existingId || existingPhone) {
      const filePath = path.join(
        __dirname,
        "../uploads/id_photos",
        req.file.filename
      );
      deleteFile(filePath);

      if (existingId && existingPhone) {
        return next({
          status: 400,
          message: "User with this ID and phone number already exists",
        });
      } else if (existingId) {
        return next({
          status: 400,
          message: "User with this ID already exists",
        });
      } else {
        return next({
          status: 400,
          message: "User with this phone number already exists",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "farmer") {
      if (!land_size || !crop_type) {
        return next({
          status: 400,
          message: "Farmer land size and crop type are required",
        });
        const filePath = path.join(
          __dirname,
          "../uploads/id_photos",
          req.file.filename
        );
        deleteFile(filePath);
      }
    }

    const newUser = new User({
      name,
      id_number,
      phone,
      password: hashedPassword,
      role,
      land_size,
      crop_type,
      id_photo: id_photo_url,
    });

    await newUser.save();

    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return next({ status: 500, message: "Server error during registration" });
  }
};


exports.login = async (req, res, next) => {
  try {
    const { id_number, password } = req.body;

    if (!id_number || !password) {
      return next({
        status: 400,
        message: "ID number and password are required",
      });
    }

    const user = await User.findOne({ id_number });
    if (!user) return next({ status: 404, message: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return next({ status: 401, message: "Invalid credentials" });

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
