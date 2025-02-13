// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs"; 
// cloudinary.config({
//    // cloud_name: process.env.CLOUDINARY_NAME,
//     cloud_name:"dlho70i0b",
//     // api_key: process.env.CLOUDINARY_API_KEY,
//     api_key: 926665148688152,
//    // api_secret: process.env.CLOUDINARY_API_SECRET,
//     api_secret:"P3dYpKaRmdBRQBsWS6NRZA1OySI"
//   });
// const uploadOnCloudinary=async (localFilePath)=>{
//     try{
//         if(!localFilePath) return null;
//         const response=await cloudinary.uploader.upload(localFilePath,{
//             resource_type: "auto",
//             folder: "auto"
//         })
//         console.log("file is uploaded on cloudinary successfully",response)
//         // if(fs.existsSync(localFilePath)){
//         //     console.log("file exists...")
//         //     fs.unlinkSync(localFilePath);
//         // }
        
//         return response
//     }
//     catch(error){
//         console.log("error in cloudinary is : ",error)
//         if (fs.existsSync(localFilePath)) {
//             console.log("File exists, proceeding...",localFilePath);
//             fs.unlinkSync(localFilePath);
//             return null;
//           } else {
//             console.error("File does not exist:", localFilePath);
//           }
        
//         return null;
//     }
// }
  
// export {uploadOnCloudinary}
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dlho70i0b",
  api_key: 926665148688152,
  api_secret: "P3dYpKaRmdBRQBsWS6NRZA1OySI",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "auto",
    });

    console.log("File is uploaded on Cloudinary successfully:", response);

    // Delete file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("File unlinked successfully:", localFilePath);
    }

    return response;
  } catch (error) {
    console.error("Error during Cloudinary upload:", error);

    // Ensure the file is deleted only if it exists
    if (fs.existsSync(localFilePath)) {
      console.log("File exists, deleting in catch block:", localFilePath);
      fs.unlinkSync(localFilePath);
    } else {
      console.error("File does not exist in catch block:", localFilePath);
    }

    return null;
  }
};
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    console.log("File is deleted from Cloudinary successfully:", response);
    return response;
  } catch (error) {
    console.error("Error during Cloudinary delete:", error);
    return null;
  }
};

export { uploadOnCloudinary };

