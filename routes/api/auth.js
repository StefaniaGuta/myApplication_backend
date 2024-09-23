const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../../models/userSchema");
const Joi = require("joi");
require("dotenv").config();
const authMiddleware = require("../../middlewares/authMiddleware");

router.post("/users/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "Email in use",
        data: "Conflict",
      });
    }

    const newUser = new User({
      email,
      password,
      name,
      subscription: "starter",
    });

    await newUser.save();

    const payload = {
      id: newUser._id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    newUser.token = token;
    await newUser.save();

    res.status(201).json({
      token,
      user: {
        email: newUser.email,
        name: newUser.name,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


router.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || password !== user.password) {
      return res.status(401).json({
        message: "Email or password is wrong",
      });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();
 
    res.status(200).json({
      token,
      user: {
        email: user.email,
        name: user.name,
        subscription: user.subscription
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/users/logout", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    
    user.token = null;
    await user.save();
    
    res.status(204).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


router.get("/users/current", authMiddleware, async (req, res) => {
  try{
    const user = req.user;

    res.status(200).json({
      email: user.email,
      name:user.name,
      subscription: user.subscription
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({message: "Internal Server Error"})
  }
});

module.exports = router;