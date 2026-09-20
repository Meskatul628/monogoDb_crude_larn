const User = require("../model/model.user");
const jwt = require("jsonwebtoken");

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

// 3. CREATE USER (Create)
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user with same email already exists
    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res.status(409).json({ message: "User with this email already exists", status: "error" });
    }

    const newUser = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      message: "User created successfully",
      data: newUser,
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

module.exports = {
  getAllUser,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  refreshTokenController,
};