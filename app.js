const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises; // Use fs.promises for async operations
const axios = require("axios"); // For making HTTP requests to your PHP script
const FormData = require("form-data"); // To construct multipart/form-data
const apiKeyMiddleware = require("./middlewares/apiKey.js"); // Assuming this is still needed

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
//  No need for multer storage here, we're forwarding to PHP

// Ensure the uploads directory exists.  This is for local temp storage
fs.mkdir(path.join(process.cwd(), "temp_uploads"), { recursive: true }).catch(
  console.error
);

const tempUpload = multer({ dest: "temp_uploads/" }); // Multer for temp storage

// File upload route, now forwarding to PHP
app.post(
  "/upload",
  apiKeyMiddleware,
  tempUpload.single("image"), // Use tempUpload middleware
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image cannot be empty!" });
      }

      const phpUploadUrl = "https://upload.hallelojowuro.biz"; // **Replace this with your PHP upload URL**

      const form = new FormData();
      form.append("image", fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(phpUploadUrl, form, {
        headers: form.getHeaders(),
      });

      // Clean up the temp file
      await fs.unlink(req.file.path);

      if (response.data.error) {
        // Handle errors from the PHP script
        console.error("PHP Upload Error:", response.data.error);
        return res.status(500).json({ message: response.data.error });
      }

      console.log(200, "POST: /upload (Forwarded to PHP)");
      res.status(200).json(response.data); // Return the response from PHP
    } catch (error) {
      console.error("Error uploading to PHP:", error);
      res
        .status(500)
        .json({ message: "Error occurred while uploading to PHP." });
    }
  }
);

// File delete route, now forwarding to PHP
app.post(
  "/upload/delete",
  apiKeyMiddleware,
  express.json(), //  Use express.json(), as we are sending JSON to PHP
  async (req, res) => {
    const imageToDelete = req.body.image; // Get the URL from the request
    const phpDeleteUrl = "https://upload.hallelojowuro.biz/delete.php"; // **Replace with your PHP delete URL**

    try {
      const response = await axios.post(phpDeleteUrl, { image: imageToDelete }); // Send image URL to PHP

      if (response.data.error) {
        console.error("PHP Delete Error", response.data.error);
        return res.status(500).json({ error: response.data.error });
      }
      console.log(200, "POST: /upload/delete (Forwarded to PHP)");
      res.status(200).json(response.data); // Return response from PHP
    } catch (error) {
      console.error("Error deleting via PHP:", error);
      res
        .status(500)
        .json({ message: "The image could not be deleted via PHP!" });
    }
  }
);

//  No static serving of /uploads here,  PHP handles that

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
