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
        console.log("refresh token in upper function: ", refreshToken)
        user.refreshToken=refreshToken
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
            $unset: {
                refreshToken: 1
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
    //console.log("req body", req.body)
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
  //  console.log("incoming refresh token: ", incomingRefreshToken)
    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "refresh token is expired or used")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    //user.refreshToken = newRefreshToken
    //await user.save({ validateBeforeSave: false })
    console.log("access token: ", accessToken)
    console.log("new refresh token: ", refreshToken)
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { refreshToken }, "Access token refreshed"))
})
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "user not found")
    }
    const isCurrentPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isCurrentPasswordCorrect) {
        throw new ApiError(400, "incorrect current password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))
})
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "user not found")
    }
    return res.status(200).json(new ApiResponse(200, user, "user found"))
})
const updateAccountdetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "fullName and email is required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName: fullName,
            email: email
        }
    }
        , { new: true }).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200, user, "account details updated successfully"))

})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }
        , { new: true }).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200, user, "avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }
        , { new: true }).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200, user, "coverImage updated successfully"))
})
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username.trim()) {
        throw new ApiError(400, "username is required")
    }
    const channel = await User.aggregate([{
        $match: { username: username?.trim() }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    }, {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            subscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }

            }
        }
    }, {

        $project: {
            fullName: 1,
            username: 1,
            avatar: 1,
            coverImage: 1,
            subscribers: 1,
            subscribedTo: 1,
            isSubscribed: 1,
            email: 1
        }

    }
    ])
    if (!channel?.length()) {
        throw new ApiError(404, "channel not found")
    }
    return res.status(200).json(new ApiResponse(200, channel[0], "channel found"))
})
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [{
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            //this
                            pipeline: [{
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    }, {
                        owner: {
                            $first: "$owner"
                        }
                    }
                    ]
                }
            }
            ,
            {

            }
        ]
    )
    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "watch history found"))
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountdetails, updateUserAvatar, updateUserCoverImage,getUserChannelProfile,getWatchHistory }