const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { Client } = require("basic-ftp"); // FTP client
const apiKeyMiddleware = require("./middlewares/apiKey.js");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests only from https://www.cyberwizblog.com.ng
const corsOptions = {
  origin: "https://www.cyberwizblog.com.ng",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies or authorization headers if needed
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Multer storage in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure FTP client connection
async function uploadToFTP(buffer, filename) {
  const client = new Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false, // Set to true if FTP requires secure connection
    });

    await client.ensureDir("/uploads"); // Ensure directory exists on the FTP server
    await client.uploadFrom(buffer, `/uploads/${filename}`); // Upload the file
  } catch (error) {
    console.error("FTP Upload Error:", error);
    throw error;
  } finally {
    client.close();
  }
}

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

      // Generate unique filename
      const filename = Date.now() + req.file.originalname.replace(/\s+/g, "_");

      // Upload directly to FTP
      await uploadToFTP(req.file.buffer, filename);

      // Construct image URL from FTP server path
      const imageUrl = `${process.env.FTP_BASE_URL}/uploads/${filename}`;

      res.status(200).json({ url: imageUrl });
      console.log("File uploaded successfully:", imageUrl);
    } catch (error) {
      console.error("Error during upload:", error);
      res.status(500).json({ message: "The image could not be uploaded!" });
    }
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
