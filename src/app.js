
const express = require('express');
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// Middleware
app.use(require("cors")());
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");

// Serve Hearth Frontend
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "hearth-bank.html")
    );
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/accounts", accountRoutes);

module.exports = app;