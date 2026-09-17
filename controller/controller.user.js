const User = require("../model/model.user");

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

module.exports = {
  getAllUser,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
};