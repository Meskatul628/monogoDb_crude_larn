const express = require("express");

const { getAllUser, getSingleUser, createUser, updateUser, deleteUser} = require("../controller/controller.user");

const router = express.Router();

router.get("/user", getAllUser);

router.get("/user/:id", getSingleUser);

router.post("/user", createUser);

router.put("/user/:id", updateUser);

router.delete("/user/:id", deleteUser);

module.exports = router;