import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import GeminiKey from "../models/GeminiKey.js";
import Habit from "../models/Habit.js";
import Checkin from "../models/Checkin.js";
import AIPlan from "../models/AIPlan.js";
import AIUsage from "../models/AIUsage.js";
import JournalEntry from "../models/JournalEntry.js";

const router = Router();
function sign(userId) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  return jwt.sign({ sub: userId.toString() }, secret, { expiresIn: "30d" });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    theme: user.theme,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are all required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "That email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      token: sign(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({
      email: (req.body.email || "").toLowerCase().trim(),
    });

    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    return res.json({ token: sign(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});


router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.theme !== undefined) user.theme = req.body.theme;

    await user.save();
    return res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.put("/password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!(await bcrypt.compare(currentPassword || "", user.passwordHash))) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/account", requireAuth, async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).select("_id");
    const habitIds = habits.map((habit) => habit._id);

    if (habitIds.length) await Checkin.deleteMany({ habitId: { $in: habitIds } });
    await Habit.deleteMany({ userId: req.userId });
    await AIPlan.deleteMany({ userId: req.userId });
    await AIUsage.deleteMany({ userId: req.userId });
    await JournalEntry.deleteMany({ userId: req.userId });
    await GeminiKey.deleteOne({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
