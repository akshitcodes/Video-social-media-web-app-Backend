import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"; 

const connectDB = async () => {
    try {
       
       const connectionInstance = await mongoose.connect(`mongodb+srv://akshitharjai04:C4E8ERrIC0YEkLd3@cluster0.bhgyc.mongodb.net/${DB_NAME}`);
        console.log(`connected to D B || host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit("failed",1);
    }
};
export default connectDB;