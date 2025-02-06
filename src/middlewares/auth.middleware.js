import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
export const verifyJWT=asyncHandler(async(req,res,next)=>{
   try {
     const accessToken=req.cookies?.accessToken || req.header("Authorization").replace("bearer ","")
     if(!accessToken){
         throw new ApiError(401,"Invalid request")
     }
    const decodedToken= jwt.verify(accessToken,"V6SmmzO2h9jDmup5ncOcYXC6E")
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
     throw new ApiError(401,"Invalid Access Token")
    }
    req.user=user;
    next();
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid access token")
   }
})