const express = require("express");

const { 
  getAllUser, 
  getSingleUser, 
  createUser, 
  updateUser, 
  deleteUser,
  loginUser,
  refreshTokenController,
  verifyOtpController,
  resendOtpController
} = require("../controller/controller.user");

const router = express.Router();

router.get("/user", getAllUser);
router.get("/user/:id", getSingleUser);
router.post("/user", createUser);
router.post("/user/login", loginUser);
router.post("/user/refresh-token", refreshTokenController);
router.post("/user/verify-otp", verifyOtpController);
router.post("/user/resend-otp", resendOtpController);

router.put("/user/:id", updateUser);

router.delete("/user/:id", deleteUser);

module.exports = router;