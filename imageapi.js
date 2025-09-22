const express = require("express");
const ImageRoute = express.Router();
const Db = require("./database"); 
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
  limits: { fileSize: 100 * 1024 * 1024 }, 
});

// POST 
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
// GET

ImageRoute.get("/", async (req, res) => {
  try {
    const images = await Db.Image.find();
    res.status(200).json({
      message: "Images retrieved successfully",
      count: images.length,
      data: images,
    });
  } catch (error) {
    console.error("GET error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT
ImageRoute.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const imageId = req.params.id;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }
    const image = await Db.Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found." });
    }

    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    image.filename = file.originalname;
    image.contentType = file.mimetype;
    image.data = fs.readFileSync(file.path);
    image.path = file.path;

    await image.save();
    res.status(200).json({ message: "Image updated successfully", data: image });
  } catch (error) {
    console.error("PUT error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE
ImageRoute.delete("/:id", async (req, res) => {
  try {
    const imageId = req.params.id;
    const image = await Db.Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found." });
    }
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }
    await Db.Image.deleteOne({ _id: mongoose.Types.ObjectId(imageId) });
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }

});

module.exports = ImageRoute;