const express=require("express")
const router=express.Router()
const authController=require("../controllers/auth.controllers")
<<<<<<< HEAD
/*POST /api/auth/register */
router.post("/register",authController.userRegisterController) //register route banayenge
/*POST /api/auth/login */
router.post("/login",authController.userLoginController) //login route banayenge
=======

router.post("/register",authController.userRegisterController) //register route banayenge
>>>>>>> b537b83e6b99cf8049c818c14c761facd9bb7f00
module.exports=router