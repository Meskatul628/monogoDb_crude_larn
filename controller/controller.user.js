const User = require("../model/model.user");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// 1. GET ALL USERS (Read all)
const getAllUser = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      message: "success",
      totalUsers: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, status: "error" });
  }
};

// 2. GET SINGLE USER (Read by ID)
const getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found", status: "error" });
    }

    res.status(200).json({ message: "success", data: user });
  } catch (error) {
    res.status(500).json({ message: error.message, status: "error" });
  }
};

// 3. CREATE USER (Register User & Send OTP)
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ১. চেক করা যে এই ইমেইল দিয়ে আগেই ইউজার আছে কিনা
    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res.status(409).json({ message: "User with this email already exists", status: "error" });
    }

    // ২. ৬-ডিজিটের র্যান্ডম OTP কোড তৈরি করা (যেমন: 583920)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // ৩. OTP-এর মেয়াদের সময় নির্ধারণ করা (বর্তমান সময় থেকে ৫ মিনিট)
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // ৪. ডেটাবেজে ইউজার তৈরি করা (isVerified: false থাকবে)
    const newUser = await User.create({
      name,
      email,
      password,
      otp: generatedOtp,
      otpExpires: otpExpires,
    });

    // ৫. ইউজারের ইমেইলে OTP কোড পাঠানো
    try {
      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50;">Welcome to Our Platform, ${name}!</h2>
          <p>Thank you for registering. Please use the following 6-digit OTP code to verify your email address:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
            ${generatedOtp}
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 15px;">This OTP code will expire in <b>5 minutes</b>.</p>
        </div>
      `;

      await sendEmail({
        email: newUser.email,
        subject: "Verify Your Email - OTP Code",
        htmlMessage,
      });
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
      // ইমেইল পাঠাতে ব্যর্থ হলেও ইউজার ক্রিয়েট হয়েছে, ইউজারকে রিসেন্ড OTP অপশন দেওয়া যাবে
    }

    res.status(201).json({
      status: "success",
      message: "User registered successfully! Please check your email for the 6-digit OTP verification code.",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message, status: "error" });
  }
};

// 4. UPDATE USER (Update by ID)
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, password },
      { returnDocument: 'after', runValidators: true } // returns updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found", status: "error" });
    }

    res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ message: error.message, status: "error" });
  }
};

// 5. DELETE USER (Delete by ID)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found", status: "error" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, status: "error" });
  }
};

// 6. LOGIN USER (Authentication)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ১. ইমেইল এবং পাসওয়ার্ড রিকোয়েস্টে দেওয়া হয়েছে কিনা যাচাই
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    // ২. ডেটাবেজে ইউজার সন্ধান এবং পাসওয়ার্ড সিলেক্ট করা (যেহেতু Schema-তে select: false আছে)
    const user = await User.findOne({ email }).select("+password");

    // ৩. ইউজার অস্তিত্ব এবং পাসওয়ার্ড হ্যাশ যাচাই করা
    const isPasswordValid = user ? await user.comparePassword(password) : false;

    if (!user || !isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // 🔒 ৩.৫ ইমেইল ভেরিফাইড কিনা চেক করা (isVerified: true না হলে লগইন করা যাবে না)
    if (!user.isVerified) {
      return res.status(403).json({
        status: "error",
        message: "Your email address is not verified. Please verify your email using OTP first.",
      });
    }

    // ৪. Access Token এবং Refresh Token তৈরি করা
    // Access Token (১৫ মিনিট মেয়াদী - রেগুলার API কলের জন্য)
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Refresh Token (৭ দিন মেয়াদী - Access Token Expire হলে নতুন টোকেন নেওয়ার জন্য)
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // ৫. লগইন সফল হলে Access Token, Refresh Token এবং ইউজারের তথ্য পাঠানো
    res.status(200).json({
      status: "success",
      message: "Login successful!",
      accessToken: accessToken,
      refreshToken: refreshToken,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 7. REFRESH TOKEN CONTROLLER (Access Token Expire হলে নতুন Access Token জেনারেট করার জন্য)
const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // ১. ক্লায়েন্ট রিকোয়েস্টে Refresh Token পাঠিয়েছে কিনা যাচাই
    if (!refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token is required",
      });
    }

    // ২. Refresh Token টি ভ্যালিড এবং মেয়াদের মধ্যে আছে কিনা চেক করা
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            status: "error",
            message: "Invalid or expired refresh token. Please login again.",
          });
        }

        // ৩. টোকেন থেকে পাওয়া ইউজার আইডি দিয়ে ইউজার চেক করা
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(404).json({
            status: "error",
            message: "User not found",
          });
        }

        // ৪. ইউজার সঠিক হলে নতুন Access Token (15m) জেনারেট করে পাঠানো
        const newAccessToken = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        res.status(200).json({
          status: "success",
          message: "New access token generated successfully",
          accessToken: newAccessToken,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 8. VERIFY OTP CONTROLLER (ইমেইল ভেরিফাই করার জন্য)
const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Email and OTP code are required",
      });
    }

    // ১. ইউজার খোঁজা এবং hidden field (otp, otpExpires) সিলেক্ট করা
    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found with this email",
      });
    }

    // ২. ইউজার কি ইতোমধ্যে ভেরিফাইড?
    if (user.isVerified) {
      return res.status(400).json({
        status: "error",
        message: "This email is already verified. You can log in directly.",
      });
    }

    // ৩. OTP মেয়াদের সময় পার হয়ে গেছে কিনা চেক (5 minutes check)
    if (new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({
        status: "error",
        message: "OTP code has expired. Please request a new OTP code.",
      });
    }

    // ৪. ইনপুট দেওয়া OTP এবং DB-র OTP মিলছে কিনা চেক
    if (user.otp !== otp.toString().trim()) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP code. Please enter the correct code.",
      });
    }

    // ৫. OTP সঠিক হলে isVerified: true করে দেওয়া এবং OTP ডিলিট করা
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 9. RESEND OTP CONTROLLER (নতুন OTP পুনরায় পাঠানোর জন্য)
const resendOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found with this email",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: "error",
        message: "User is already verified. No need to resend OTP.",
      });
    }

    // নতুন OTP ও মেয়াদ তৈরি
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = newOtp;
    user.otpExpires = newOtpExpires;
    await user.save({ validateBeforeSave: false });

    // ইমেইল পাঠানো
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Resent OTP Code</h2>
        <p>Your new OTP verification code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
          ${newOtp}
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 15px;">This OTP code will expire in <b>5 minutes</b>.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "Resent OTP Verification Code",
      htmlMessage,
    });

    res.status(200).json({
      status: "success",
      message: "A new OTP code has been sent to your email.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getAllUser,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  refreshTokenController,
  verifyOtpController,
  resendOtpController,
};