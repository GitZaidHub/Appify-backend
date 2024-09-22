const express = require("express");
const cors = require("cors");
const { connect } = require("mongoose");
const fs = require("fs")
require("dotenv").config();
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const PostRoutes = require("./routes/postRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL
}));


// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Serve static files
app.use(express.static(path.join(__dirname, "/uploads")));
app.use("/uploads", express.static(uploadsDir));

app.use("/api/users", userRoutes);
app.use("/api/posts", PostRoutes);
app.use(errorHandler);
app.use(notFound);
connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000; // Use environment variable or fallback to 5000
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error); // Log the error properly
  });
