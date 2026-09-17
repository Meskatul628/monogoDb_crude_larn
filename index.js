require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRouter = require("./routes/user.route");

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("json spaces", 2);

// Routes
app.use("/api/v1", userRouter);

app.get("/", (req, res) => {
  res.send("Server is running & ready!");
});

// Database connection & Server start
const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully!");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();