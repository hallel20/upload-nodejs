import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import apiKeyMiddleware from "./middlewares/apiKey.js";

import { config } from "dotenv";

config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Configure multer storage for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "public/uploads"));
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + file.originalname.replace(/\s+/g, "_");
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Ensure the uploads directory exists
fs.mkdir(path.join(process.cwd(), "public/uploads"), { recursive: true }).catch(
  console.error
);

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

      // Get file information
      const filename = req.file.filename;
      const filePath = `/uploads/${filename}`;
      const imageUrl = `${req.protocol}://${req.get("host")}${filePath}`;

      // Return the file path or URL
      res.status(200).json({ url: imageUrl });
    } catch (error) {
      console.error("Error occurred:", error);
      res.status(500).json({ message: "The image could not be uploaded!" });
    }
  }
);

app.post(
  "/upload/delete",
  apiKeyMiddleware,
  upload.none(),
  async (req, res) => {
    const image = req.body.image; // Expecting the image path relative to the public directory
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = image.replace(baseUrl, "");
    const imageUrl = `public/${relativePath}`; // Correct path for accessing in the public folder
    const imagePath = path.join(process.cwd(), imageUrl); // Full path to the file

    try {
      await fs.unlink(imagePath); // Deleting the file
      return res.status(200).json({ message: "File Deleted Successfully!" });
    } catch (ex) {
      console.log("Something went wrong", ex);
      return res.status(500).json({ error: "The Image could not be deleted!" });
    }
  }
);

// Static route to serve the uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
