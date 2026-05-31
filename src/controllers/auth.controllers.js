const userModel=require("../models/user.model")
const jwt=require("jsonwebtoken")
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

module.exports={userRegisterController}