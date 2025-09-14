const express = require("express");
const TicketRoute = express.Router();
const Db = require("./database"); 
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Create uploads directory if not exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// File type validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [
    ".jpeg", ".jpg", ".png", ".gif",
    ".mp3", ".wav", ".mp4", ".mov",
    ".avi", ".mkv", ".pdf"
  ];

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file extension."));
  }
};
// Multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, 
});


// ==============================
// 🚀 POST - Create New Ticket
// ==============================
TicketRoute.post(
  "/",
  upload.fields([
    { name: "beforeAttachments", maxCount: 1 },
    { name: "afterAttachments", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        selectcountry,
        storeName,
        booking,
        stores,
        bookingsummary,
        title,
        DateandTime,
        ticketid,
        expectedEndDate,
        category,
        jobDescription,
        location,
        ticketStatus,
        totalbookings,
      } = req.body;

      const beforeFile = req.files?.beforeAttachments?.[0]?.filename || "";
      const afterFile = req.files?.afterAttachments?.[0]?.filename || "";

      if (!beforeFile || !afterFile) {
        return res.status(400).json({
          message: "Both beforeAttachments and afterAttachments files are required.",
        });
      }

      // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
      const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split(' ')[0].split('-');
        if (parts.length === 3) {
          // Assuming DD-MM-YYYY format
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString; // Return original if format is not as expected
      };

      const parsedDateandTime = DateandTime ? new Date(parseDate(DateandTime) + ' ' + (DateandTime.split(' ')[1] || '')) : null;
      const parsedExpectedEndDate = expectedEndDate ? new Date(parseDate(expectedEndDate)) : null;

      const ticket = new Db.BookingTicket({
        selectcountry,
        storeName,
        booking,
        stores,
        bookingsummary,
        title,
        DateandTime: parsedDateandTime,
        ticketid,
        expectedEndDate: parsedExpectedEndDate,
        category,
        jobDescription,
        location,
        beforeAttachments: beforeFile,
        afterAttachments: afterFile,
        ticketStatus,
        totalbookings,
      });

      await ticket.save();

      res.status(200).json({
        message: "Ticket created successfully",
        data: ticket,
      });
    } catch (error) {
      console.error("POST error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });


// ==============================
// 📥 GET - Retrieve All Tickets
// ==============================
TicketRoute.get("/", async (req, res) => {
  try {
    const tickets = await Db.BookingTicket.find().sort({ DateandTime: -1 });
    res.status(200).json({
      message: "Tickets retrieved successfully",
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("GET error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ==============================
// ✏️ PUT - Update Ticket by ID
// ==============================
TicketRoute.put(
  "/:id",
  upload.fields([
    { name: "beforeAttachments", maxCount: 1 },
    { name: "afterAttachments", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const ticketId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      const existingTicket = await Db.BookingTicket.findById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Handle files (use old if new not uploaded)
      const beforeFile = req.files?.beforeAttachments?.[0]?.filename || existingTicket.beforeAttachments;
      const afterFile = req.files?.afterAttachments?.[0]?.filename || existingTicket.afterAttachments;

      // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
      const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split(' ')[0].split('-');
        if (parts.length === 3) {
          // Assuming DD-MM-YYYY format
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString; // Return original if format is not as expected
      };

      const updatedFields = {
        ...req.body,
        beforeAttachments: beforeFile,
        afterAttachments: afterFile,
      };

      if (updatedFields.DateandTime) updatedFields.DateandTime = new Date(parseDate(updatedFields.DateandTime) + ' ' + (updatedFields.DateandTime.split(' ')[1] || ''));
      if (updatedFields.expectedEndDate) updatedFields.expectedEndDate = new Date(parseDate(updatedFields.expectedEndDate));

      const updatedTicket = await Db.BookingTicket.findByIdAndUpdate(ticketId, updatedFields, {
        new: true,
      });

      res.status(200).json({
        message: "Ticket updated successfully",
        data: updatedTicket,
      });
    } catch (error) {
      console.error("PUT error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);


// ==============================
// 🗑️ DELETE - Delete Ticket & Files
// ==============================
TicketRoute.delete("/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Db.BookingTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Delete files
    const deleteFile = (filename) => {
      if (!filename) return;
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    deleteFile(ticket.beforeAttachments);
    deleteFile(ticket.afterAttachments);

    await Db.BookingTicket.findByIdAndDelete(ticketId);

    res.status(200).json({ message: "Ticket and associated files deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = TicketRoute;
