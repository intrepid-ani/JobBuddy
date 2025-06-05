import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import getDataUri from "../utils/datauri.js";
import uploadCloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      phoneNumber,
      password,
      role,
      recoveryQuestion,
      recoveryAnswer,
    } = req.body;

    if (
      !fullname ||
      !email ||
      !phoneNumber ||
      !password ||
      !role ||
      !recoveryAnswer ||
      recoveryQuestion === "select"
    ) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    // Check if the file is present in the request
    const filePath = req.file;
    if (!filePath?.path) {
      return res.status(400).json({
        message: "File is missing from the request",
        success: false,
      });
    }

    if (filePath.size > 10 * 1024 * 1024) {
      // 10MB limit example
      return res.status(400).json({
        message: "File size exceeds limit (max 10MB)",
        success: false,
      });
    }

    // Check if the user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User already exist with this email.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let cloudResponse;
    try {
      cloudResponse = await uploadCloudinary(filePath.path, {
        resource_type: "auto",
      });
      console.log("Upload successful:", cloudResponse?.secure_url);

      if (!cloudResponse) {
        return res.status(400).json({
          message: "File upload failed.",
          success: false,
        });
      }
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(400).json({
        message:
          "File upload failed: " + (uploadError.message || "Unknown error"),
        success: false,
      });
    }

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      recoveryQuestion,
      recoveryAnswer,
      profile: {
        profilePhoto: cloudResponse.secure_url,
      },
    });

    console.log("User created successfully", recoveryAnswer);

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    console.log("Entered Login Route");

    const {
      email,
      password,
      role,
      forgotPassword,
      recoveryAnswer,
      recoveryQuestion,
      newPassword,
    } = req.body;

    // Shared user/token variables
    let user;
    let token;

    // Forgot Password Flow
    if (forgotPassword) {
      console.log("Forgot Password Flow Triggered");

      // Validation
      if (
        !email ||
        !recoveryAnswer ||
        !recoveryQuestion ||
        recoveryQuestion === "select" || // Changed to lowercase for consistency
        !role
      ) {
        return res.status(400).json({
          message: "Missing required fields!",
          success: false,
        });
      }

      user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: "Incorrect email or user not found.",
          success: false,
        });
      }

      if (role !== user.role) {
        return res.status(400).json({
          message: "Account doesn't exist with the specified role.",
          success: false,
        });
      }

      // Case-insensitive comparison for recovery answer
      if (
        recoveryAnswer.toLowerCase() !== user.recoveryAnswer.toLowerCase() ||
        recoveryQuestion !== user.recoveryQuestion
      ) {
        return res.status(400).json({
          message: "Recovery question or answer is incorrect!",
          success: false,
        });
      }

      // If newPassword is provided, update the password and proceed to login
      if (newPassword) {
        if (newPassword.length < 6) {
          // Basic password validation
          return res.status(400).json({
            message: "New password must be at least 6 characters long.",
            success: false,
          });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        console.log("Password reset successful");

        // Generate token after password is reset
        token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "1d",
        });
      } else {
        // If no new password provided, ONLY return verification success - DON'T LOGIN
        return res.status(200).json({
          message:
            "Recovery verification successful. Please set a new password.",
          userId: user._id,
          verified: true,
          success: true,
        });
      }
    } else {
      // Normal Login Flow - remains the same
      if (!email || !password || !role) {
        return res.status(400).json({
          message: "Email, password, and role are required.",
          success: false,
        });
      }

      user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: "Incorrect email or password.",
          success: false,
        });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        return res.status(400).json({
          message: "Incorrect email or password.",
          success: false,
        });
      }

      if (role !== user.role) {
        return res.status(400).json({
          message: "Account doesn't exist with the specified role.",
          success: false,
        });
      }

      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
    }

    // Format user object before sending
    const userData = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back, ${user.fullname}!`,
        user: userData,
        success: true,
      });
  } catch (error) {
    console.error("Error during login:", error.message);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const userId = req.id; // middleware authentication

    // Find the current user
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email already in use by another account.",
          success: false,
        });
      }
    }

    // Handle file upload if provided
    const file = req.file;
    let cloudResponse;

    if (file && file.path) {
      cloudResponse = await uploadCloudinary(
        file.path,
        {
          resource_type: "auto",
        },
        (error) => {
          console.log("File upload successful:", cloudResponse?.secure_url);
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(400).json({
              message: "File upload failed.",
              success: false,
            });
          }
        }
      );
    }

    // Process skills
    let skillsArray;
    if (skills) {
      skillsArray = skills.split(",");
    }

    // Update user data
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skillsArray;

    // Update resume if file was uploaded
    if (cloudResponse) {
      user.profile.resume = cloudResponse.secure_url;
      user.profile.resumeOriginalName = file.originalname;
    }

    await user.save();

    // Prepare response
    const userResponse = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: userResponse,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error while updating profile.",
      success: false,
    });
  }
};
