const express = require("express");
const ImageRoute = express.Router();
const Db = require("./database"); // Assuming BookingTicket is in Db
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Unsupported file extension."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /upload
ImageRoute.post("/", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    const newImage = new Db.Image({
      filename: file.originalname,
      contentType: file.mimetype,
      data: fs.readFileSync(file.path),
      path: file.path,
    });

    await newImage.save();

    res.status(200).json({
      message: "Image uploaded successfully",
      data: newImage,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = ImageRoute;