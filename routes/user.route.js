const express = require("express");

const { 
  getAllUser, 
  getSingleUser, 
  createUser, 
  updateUser, 
  deleteUser,
  loginUser 
} = require("../controller/controller.user");

const router = express.Router();

router.get("/user", getAllUser);
router.get("/user/:id", getSingleUser);
router.post("/user", createUser);
router.post("/user/login", loginUser);

router.put("/user/:id", updateUser);

router.delete("/user/:id", deleteUser);

module.exports = router;