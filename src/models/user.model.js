const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const userSchema= new mongoose.Schema({
    email:{
        type:String,
        required:[true,"email is required for creating an user"],
        trim:true, //agar user email me space de to usko trim kar denge
        lowercase:true, //agar user email me capital letter de to usko lowercase kar denge
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Please fill a valid email address"],
        unique:[true,"email already exists"]
    },
    name:{
        type:String,
        required:[true,"name is required for creating an user"]
    },
    password:{
        type:String,
        required:[true,"password is required for creating an user"],
        minlength:[6,"password must be at least 6 characters long"],
        select:false //agar password ko query me na lana hai to select:false kar denge
    }
},{
    timestamps:true //createdAt and updatedAt fields automatically add ho jayenge
})

userSchema.pre("save",async function(next){ //pre save hook lagayenge jisse password ko hash kar sake
    if(!this.isModified("password")){ //agar password modify nahi hua hai to next kar denge
        return next()
    }
    const hash=await bcrypt.hash(this.password,10) //password ko hash karenge
    this.password=hash //hash kiye password ko user ke password field me daal denge
    return next() //next kar denge
})

