const express = require('express');
const cookieParser=require("cookie-parser")

const app = express()

app.use(express.json()) 
app.use(cookieParser()) 
/**
 * Routes 
 */
const authRoutes=require("./routes/auth.routes")
const accountRoutes=require("./routes/account.routes")
const transactionRoutes=require("./routes/transaction.routes")

/**
 * - Use Routes
 */

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})

/**
 * Route Middlewares
 */
app.use("/api/auth",authRoutes)
app.use("/api/transactions",transactionRoutes)
app.use("/api/accounts",accountRoutes)


module.exports = app; 



