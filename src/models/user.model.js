import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
 
const userSchema = new Schema(
    {
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, //cloudinary
        required: true,
    },
    coverImage: {
        type: String, //cloudinary
        
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video",
    }
       
    ],
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,

    }
    },{
        timestamps: true,
        
    }
    
)
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10);
    next();
    
})
userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password);
}
 userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName: this.fullName
    },
   // process.env.ACCESS_TOKEN_SECRET,
   "V6SmmzO2h9jDmup5ncOcYXC6E",
    {
        expiresIn://process.env.ACCESS_TOKEN_EXPIRY,
        "1d"
    }
)
 }
 userSchema.methods.generateRefreshToken=function(){
   return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName: this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,
    //"OltO8zfvzj2IF92osLbzfdduc",
    {
        expiresIn://process.env.REFRESH_TOKEN_EXPIRY,
        "15d"
    }
)
 }
export const User=mongoose.model("User",userSchema)