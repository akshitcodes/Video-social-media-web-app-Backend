import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "user not found")
        }
        //console.log("user ",user)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        console.log("refresh token: ", refreshToken)
        // user.refreshToken=refreshToken
        await user.save({ validateBeforeSave: false })
        //console.log("Access token: " ,accessToken)

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "something went wrong while generating access token and refresh token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // if (!req.body || Object.getPrototypeOf(req.body) === null) {
    //     return res.status(400).json({ message: "Invalid request body" });
    //   }
    const { fullName, email, username, password } = req.body
    // console.log(req.body); 
    console.log(email, username);
    // if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    //     throw new ApiError(400)
    // }
    const existedUser = await User.exists({
        username
    })

    if (existedUser) {
        throw new ApiError(409, "Username with email or username already exists")
    }
    // console.log(req.files)
    //const avatarLocalPath = req.files?.avatar[0]?.path
    let avatarLocalPath;
    //console.log(req.files," now avatar: ",req.files.avatar[0])
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files?.avatar[0]?.path
        // console.log("I am here",avatarLocalPath)
    }
    // const coverImageLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.avatar[0]?.path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    //console.log("avatar url: ",newAvatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required ")
    }

    const user = await User.create({
        fullName: fullName,
        avatar: avatar.secure_url,
        coverImage: coverImage?.url || "",
        email: email,
        password: password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "error while registering user ")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "registered successfully")
    )
}
)

const loginUser = asyncHandler(async (req, res) => {
    console.log(req.body)
    const { username, email, password } = req.body;
    console.log(username, email, password)
    if (!(username || email && password)) {
        throw new ApiError(400, "username or email and password is required")
    }
    const user = await User.findOne({ $or: [{ username }, { email }] })
    if (!user) {
        throw new ApiError(401, "user not found")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "incorrect password")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // console.log("yaha" ,generated)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    if (!req.user) {
        throw new ApiError(401, "Invalid request")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out "))

})
const refreshAccessToken = asyncHandler(async (req, res) => {
    console.log("req body", req.body)
    const incomingRefreshToken = req.body.refreshToken
    //req.cookies.refreshToken ||

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    //console.log(decodedToken)

    const user = await User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(401, "Invalid refresh token ")
    }
    console.log("user refresh token: ", user.refreshToken)
    console.log("incoming refresh token: ", incomingRefreshToken)
    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "refresh token is expired or used")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    user.refreshToken = newRefreshToken
    await user.save({ validateBeforeSave: false })
    console.log("access token: ", accessToken)
    console.log("refresh token: ", newRefreshToken)
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, { newRefreshToken }, "Access token refreshed"))
})
export { registerUser, loginUser, logoutUser, refreshAccessToken }