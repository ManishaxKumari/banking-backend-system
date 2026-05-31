const express=require("express")
const router=express.Router()
const authController=require("../controllers/auth.controllers")

router.post("/register",authController.userRegisterController) //register route banayenge
module.exports=router