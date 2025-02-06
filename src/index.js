import  dotenv  from "dotenv";
import  connectDB  from "./db/index.js";
import {app} from "./app.js";
dotenv.config({
    path: "./.env",
});
//console.log(process.env.MONGO_URI);
connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("error with APP: ",error);
    })
    app.listen(process.env.PORT || 3000, () => {
        console.log(`server is running on port ${process.env.PORT}`);
    })
    app.get('/yo',(req,res)=>{
        res.send("yo");
    })
})
.catch((error) => {
    console.log(error);
})