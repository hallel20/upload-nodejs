const express = require("express");
const multer = require("multer");
const cors = require("cors");
const apiKeyMiddleware = require("../middlewares/apiKey.js");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests only from https://www.cyberwizblog.com.ng
// const corsOptions = {
//   origin: "https://www.cyberwizblog.com.ng",
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

app.use(cors());

// Multer storage to save files to a specific directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + file.originalname.replace(/\s+/g, "_");
    cb(null, filename);
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("Hello from your serverless Express app!");
});

// File upload route
app.post(
  "/upload",
  apiKeyMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image cannot be empty!" });
      }

      // Construct the file path
      const filePath = `uploads/${req.file.filename}`;

      res
        .status(200)
        .json({ message: "File uploaded successfully!", path: filePath });
      console.log("File uploaded successfully:", filePath);
    } catch (error) {
      console.error("Error during upload:", error);
      res.status(500).json({ message: "The image could not be uploaded!" });
    }
  }
);

// module.exports = app;

// Start the server
if(process.env.NODE_ENV="development") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}