const Note = require("../model/model.note");

// 1. CREATE NOTE (শুধু লগইন করা ইউজারের জন্য নোট তৈরি)
const createNote = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        status: "error",
        message: "Title and description are required",
      });
    }

    // req.user.id আসছে authMiddleware থেকে
    const newNote = await Note.create({
      title,
      description,
      user: req.user.id,
    });

    res.status(201).json({
      status: "success",
      message: "Note created successfully!",
      data: newNote,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 2. GET ALL NOTES OF LOGGED-IN USER (শুধুমাত্র নিজের নোটগুলো দেখা)
const getMyNotes = async (req, res) => {
  try {
    // শুধুমাত্র সেই নোটগুলো আনবে যার user ফিল্ডে req.user.id রয়েছে
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      totalNotes: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 3. GET SINGLE NOTE (নিজের কোনো নির্দিষ্ট একটি নোট দেখা)
const getSingleNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    // ইউজার শুধু নিজের নোটই দেখতে পারবে
    const note = await Note.findOne({ _id: noteId, user: req.user.id });

    if (!note) {
      return res.status(404).json({
        status: "error",
        message: "Note not found or you do not have permission to view it",
      });
    }

    res.status(200).json({
      status: "success",
      data: note,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 4. DELETE NOTE (নিজের নোট ডিলিট করা)
const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    // ইউজার শুধু নিজের নোটই ডিলিট করতে পারবে
    const deletedNote = await Note.findOneAndDelete({ _id: noteId, user: req.user.id });

    if (!deletedNote) {
      return res.status(404).json({
        status: "error",
        message: "Note not found or you do not have permission to delete it",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Note deleted successfully!",
      data: deletedNote,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  createNote,
  getMyNotes,
  getSingleNote,
  deleteNote,
};
