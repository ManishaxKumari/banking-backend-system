const express = require('express');
const authRoutes=require("./routes/auth.routes")
const cookieParser=require("cookie-parser")
const app = express()

app.use(express.json()) //middleware to parse json data
app.use(cookieParser()) //middleware to parse cookies
app.use("/api/auth",authRoutes) //auth routes ko use karenge
module.exports = app; 



