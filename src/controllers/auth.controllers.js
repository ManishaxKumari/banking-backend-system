const userModel=require("../models/user.model")
const jwt=require("jsonwebtoken")
const emailService=require("../services/email.service")
/**
 * - userRegisterController
 * - POST /api/auth/register
 */
async function userRegisterController(req,res){
    const {email,password,name}=req.body

    const isExists=await userModel.findOne({
        email:email
    })

    if(isExists){
        return res.status(422).json({
            message:"User already exists with this email",
            status:"failed"
        })
    }

    const user=await userModel.create({
        email,
        password,
        name
    })

    const token=jwt.sign({userId:user._id},process.env.JWT_SECRET,{
        expiresIn:"3d"
    })

    res.cookie("token", token, { httpOnly: true, secure: true })

    return res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        message:"User registered successfully",
        status:"success",
        token
    })
}
/**
 * - userLoginController
 * - POST /api/auth/login
 */
async function userLoginController(req,res){
    const {email,password}=req.body
    const user=await userModel.findOne({
        email:email
    }).select("+password") //password ko select karenge kyuki user model me select:false hai
    if(!user) {
        return res.status(401).json({
            message:"User not found or email or password is incorrect",
            status:"failed"
        })
    }
    const isValidPassword=await user.comparePassword(password)
    if(!isValidPassword) {
        return res.status(401).json({
            message:"User not found or email or password is incorrect",
            status:"failed"
        })
    }

    const token=jwt.sign({userId:user._id},process.env.JWT_SECRET,{
        expiresIn:"3d"
    })

    res.cookie("token", token, { httpOnly: true, secure: true })

    return res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        message:"User logged in successfully",
        status:"success",
        token
    })

    await emailService.sendRegistrationEmail(user.email,user.name) //registration email bhejenge
}

module.exports={userRegisterController,userLoginController}
