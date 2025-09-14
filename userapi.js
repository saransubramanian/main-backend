const express = require("express");
const UserRoute = express.Router();
const bcrypt = require('bcrypt');
let userdt=require('./database')
const jwt = require('jsonwebtoken');



// CreateUserpost
UserRoute.post("/CreateUser", async (req, res) => {
  
  const {
    firstname,
    lastname,
    email,
    countryCode,
    mobileNumber,
    password,
    confirmPassword,
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await userdt.UserDetail.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Check password match
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new userdt.UserDetail({
      firstname,
      lastname,
      email,
      countryCode,
      mobileNumber,
      password: hashedPassword,
    });
    console.log(newUser)
    await newUser.save();

    res
      .status(201)
      .json({ message: "Account created successfully", user: userdt.UserDetail });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// CreateUserget

UserRoute.get("/CreateUser", async (req, res) => {
  try {
    const users = await userdt.UserDetail.find();
    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      data: users,
    });
    } catch (error) {
    console.error("GET error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
  
// CreateUserput
UserRoute.put("/CreateUser/:id", async (req, res) => {
  const { id } = req.params;
  const {
    firstname,
    lastname,
    email,
    countryCode,
    mobileNumber,
    password,
    confirmPassword,
  } = req.body;

  try {
    // Check if user exists
    const user = await userdt.UserDetail.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

     // Update fields if provided
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email;
    if (countryCode) user.countryCode = countryCode;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (confirmPassword) user.password = await bcrypt.hash(confirmPassword, 10);
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.status(200).json({ message: "User updated successfully", user : {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      countryCode: user.countryCode,
      mobileNumber: user.mobileNumber,
    },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// CreateUserdelete
UserRoute.delete("/CreateUser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await userdt.UserDetail.findByIdAndDelete(id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
//---------------------------------------------------------------------------//

// LoginUserpost
UserRoute.post("/LoginUser", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const foundUser = await userdt.UserDetail.findOne({ email });
    if (!foundUser) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, foundUser.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: foundUser._id }, "your_jwt_secret", {
      expiresIn: "1h",
    });

    // Successful login response
    res.status(200).json({
      message: "Sign in successful",
      token,
      user: {
        id: foundUser._id,
        email: foundUser.email,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        countryCode: foundUser.countryCode,
        mobileNumber: foundUser.mobileNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LoginUserget
UserRoute.get("/LoginUser", async (req, res) => {
  try {
    const users = await userdt.UserDetail.find().select("-password -confirmPassword");
    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("GET error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LoginUserput
UserRoute.put("/LoginUser/:id", async (req, res) => {
  const { id } = req.params;
  const {
    firstname,
    lastname,
    email,
    countryCode,
    mobileNumber,
    password,
    confirmPassword,
  } = req.body;

  try {
    const user = await userdt.UserDetail.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email;
    if (countryCode) user.countryCode = countryCode;
    if (mobileNumber) user.mobileNumber = mobileNumber;

    // Password update with confirmation
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        countryCode: user.countryCode,
        mobileNumber: user.mobileNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LoginUserdelete
UserRoute.delete("/LoginUser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await userdt.UserDetail.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = UserRoute;
