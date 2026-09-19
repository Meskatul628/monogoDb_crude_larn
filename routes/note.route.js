const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createNote,
  getMyNotes,
  getSingleNote,
  deleteNote,
} = require("../controller/controller.note");

const router = express.Router();

// সব নোট রাউট authMiddleware দিয়ে প্রটেক্টেড
router.post("/notes", authMiddleware, createNote);
router.get("/notes", authMiddleware, getMyNotes);
router.get("/notes/:id", authMiddleware, getSingleNote);
router.delete("/notes/:id", authMiddleware, deleteNote);

module.exports = router;
