const express = require("express");
const TicketRoute = express.Router();
const Db = require("./database"); // Must export BookingTicket mongoose model
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Create uploads directory if not exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
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

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Helper to parse DD-MM-YYYY to YYYY-MM-DD
function parseDate(dateString, includeTime = false) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Check if it's already a valid date string that JS can parse
  if (!isNaN(new Date(dateString).getTime())) {
    return dateString;
  }

  // Handle DD-MM-YYYY format
  const [datePart, timePart] = dateString.split(' ');
  const [day, month, year] = datePart.split('-');
  if (day && month && year) {
    const isoDate = `${year}-${month}-${day}`;
    if (includeTime && timePart) {
      return `${isoDate}T${timePart}`;
    }
    return isoDate;
  }

  return null; // Return null if parsing fails
}

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

      const parsedDateTimeStr = parseDate(DateandTime, true);
      const parsedDateandTime = parsedDateTimeStr ? new Date(parsedDateTimeStr) : null;

      const parsedEndDateStr = parseDate(expectedEndDate, false);
      const parsedExpectedEndDate = parsedEndDateStr ? new Date(parsedEndDateStr) : null;

      if ((DateandTime && !parsedDateandTime) || (expectedEndDate && !parsedExpectedEndDate)) {
        return res.status(400).json({ message: 'Invalid date format. Please use DD-MM-YYYY HH:mm or a valid ISO date format.' });
      }

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
  }
);

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

      const beforeFile = req.files?.beforeAttachments?.[0]?.filename || existingTicket.beforeAttachments;
      const afterFile = req.files?.afterAttachments?.[0]?.filename || existingTicket.afterAttachments;

      const updatedFields = {
        ...req.body,
        beforeAttachments: beforeFile,
        afterAttachments: afterFile,
      };

      if (updatedFields.DateandTime) {
        const parsedDateTimeStr = parseDate(updatedFields.DateandTime, true);
        const parsedDateandTime = parsedDateTimeStr ? new Date(parsedDateTimeStr) : null;
        if (!parsedDateandTime) {
          return res.status(400).json({ message: 'Invalid DateandTime format. Please use DD-MM-YYYY HH:mm or a valid ISO date format.' });
        }
        updatedFields.DateandTime = parsedDateandTime;
      }

      if (updatedFields.expectedEndDate) {
        const parsedEndDateStr = parseDate(updatedFields.expectedEndDate, false);
        updatedFields.expectedEndDate = parsedEndDateStr ? new Date(parsedEndDateStr) : null;
      }

      const updatedTicket = await Db.BookingTicket.findByIdAndUpdate(ticketId, updatedFields, { new: true });

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

    // Delete files from disk
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
