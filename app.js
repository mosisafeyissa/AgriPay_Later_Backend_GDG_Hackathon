const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const errorHandler = require("./middlewares/errorHandler");
const connectDB = require('./config/db');
const farmerRoutes = require("./routes/farmer");
const adminRoutes = require("./routes/admin");

dotenv.config();
const app = express();

connectDB();

app.use(
  cors({
    origin: "http://127.0.0.1:52610",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads")); 

app.use("/api/auth", authRoutes);

app.use("/api/farmer", farmerRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
