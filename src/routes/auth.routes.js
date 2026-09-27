const express=require("express")
const router=express.Router()
const authController=require("../controllers/auth.controllers")


/*POST /api/auth/register */
router.post("/register",authController.userRegisterController) //register route banayenge

/*POST /api/auth/login */
router.post("/login",authController.userLoginController) //login route banayenge
router.post("/logout", authController.userLogoutController)

module.exports=router