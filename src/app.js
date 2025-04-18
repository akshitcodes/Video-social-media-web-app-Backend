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
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

 
export { app }