const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");               // 👈 Add this
const { Server } = require("socket.io");    // 👈 Add this

const authRoutes = require("./routes/auth");
const errorHandler = require("./middlewares/errorHandler");
const connectDB = require('./config/db');
const farmerRoutes = require("./routes/farmer");
const adminRoutes = require("./routes/admin");

dotenv.config();
const app = express();
const server = http.createServer(app); // 👈 Wrap the express app

// 🔌 Setup Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:52610", // 👈 Adjust this to match Flutter web or mobile port
    methods: ["GET", "POST"]
  }
});

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

// 🔌 Socket.io connection logic
io.on("connection", (socket) => {
  console.log("🔌 A client connected: " + socket.id);

  // Example event: admin triggers loan status update
  socket.on("loan-status-update", (data) => {
    console.log("Broadcasting loan-status-update:", data);
    io.emit("loan-status-update", data); // Broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected: " + socket.id);
  });
});

// Use server.listen instead of app.listen
server.listen(process.env.PORT, () => {
  console.log(`🚀 Server with WebSocket running on port ${process.env.PORT}`);
});


// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const authRoutes = require("./routes/auth");
// const errorHandler = require("./middlewares/errorHandler");
// const connectDB = require('./config/db');
// const farmerRoutes = require("./routes/farmer");
// const adminRoutes = require("./routes/admin");

// dotenv.config();
// const app = express();

// connectDB();

// app.use(
//   cors({
//     origin: "http://127.0.0.1:52610",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(express.json());
// app.use("/uploads", express.static("uploads")); 

// app.use("/api/auth", authRoutes);

// app.use("/api/farmer", farmerRoutes);
// app.use("/api/admin", adminRoutes);

// app.use(errorHandler);

// app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`);
// });
