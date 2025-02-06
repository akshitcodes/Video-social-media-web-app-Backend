import express, { Router } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app=express(); 
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    
}))
// to set the maximum size of the request body
//{limit:"20kb"}
app.use(express.json())
//to set urlencoded
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())
// app.post('/api/v1/users/register',(req,res)=>{
//     res.status(200).json({
//         message:"ok"
//     })
// })
//routes import

import userRouter from "./routes/user.routes.js";
app.use('/api/v1/users',userRouter)
 
export { app }