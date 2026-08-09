import { Router } from "express";
import Habit from "../models/Habit.js";
import Checkin from "../models/Checkin.js";
import { requireAuth } from "../middleware/auth.js";
import { computeCurrentStreak, computeBestStreak, todayISO } from "../utils/streaks.js";

const router = Router();
router.use(requireAuth);

function withStreaks(habit, datesByHabit = new Map()) {
  const dates = datesByHabit.get(String(habit._id)) || [];
  return {
    ...habit.toObject(),
    id: habit._id,
    currentStreak: computeCurrentStreak(dates, todayISO()),
    bestStreak: computeBestStreak(dates),
  };
}

function ownedHabit(userId, habitId) {
  return Habit.findOne({ _id: habitId, userId });
}

router.get("/", async (req, res, next) => {
  try {
    const includeArchived = req.query.archived === "true";
    const habits = await Habit.find({
      userId: req.userId,
      archived: includeArchived,
    }).sort({ pinned: -1, createdAt: 1 });

    const habitIds = habits.map((habit) => habit._id);
    const checkins = await Checkin.find({
      habitId: { $in: habitIds },
      status: { $in: ["done", "frozen"] },
    }).select("habitId date -_id");

    const datesByHabit = new Map();
    checkins.forEach((checkin) => {
      const key = String(checkin.habitId);
      if (!datesByHabit.has(key)) datesByHabit.set(key, []);
      datesByHabit.get(key).push(checkin.date);
    });

    return res.json({
      habits: habits.map((habit) => withStreaks(habit, datesByHabit)),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      category,
      icon,
      color,
      frequency,
      targetCount,
      startDate,
      reminderTime,
      trackGroup,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Habit name is required." });

    const habit = await Habit.create({
      userId: req.userId,
      name,
      category: category || "General",
      icon: icon || "Sparkles",
      color: color || "#74D4C1",
      frequency: frequency || "daily",
      targetCount: targetCount || 1,
      startDate: startDate || todayISO(),
      reminderTime: reminderTime || null,
      trackGroup: trackGroup === "other" ? "other" : "main",
    });

    return res.status(201).json({ habit: withStreaks(habit, new Map([[String(habit._id), (await Checkin.find({ habitId: habit._id, status: { $in: ["done", "frozen"] } }).select("date -_id")).map((r) => r.date)]])) });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const habit = await ownedHabit(req.userId, req.params.id);
    if (!habit) return res.status(404).json({ error: "Habit not found." });

    const body = req.body;

    habit.name = body.name ?? habit.name;
    habit.category = body.category ?? habit.category;
    habit.icon = body.icon ?? habit.icon;
    habit.color = body.color ?? habit.color;
    habit.frequency = body.frequency ?? habit.frequency;
    habit.targetCount = body.targetCount ?? habit.targetCount;
    habit.reminderTime = body.reminderTime ?? habit.reminderTime;
    if (body.trackGroup !== undefined && ["main", "other"].includes(body.trackGroup)) habit.trackGroup = body.trackGroup;
    if (body.pinned !== undefined) habit.pinned = Boolean(body.pinned);

    await habit.save();

    return res.json({ habit: withStreaks(habit, new Map([[String(habit._id), (await Checkin.find({ habitId: habit._id, status: { $in: ["done", "frozen"] } }).select("date -_id")).map((r) => r.date)]])) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/archive", async (req, res, next) => {
  try {
    const habit = await ownedHabit(req.userId, req.params.id);
    if (!habit) return res.status(404).json({ error: "Habit not found." });

    habit.archived = Boolean(req.body.archived);
    await habit.save();

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const habit = await ownedHabit(req.userId, req.params.id);
    if (!habit) return res.status(404).json({ error: "Habit not found." });

    await Checkin.deleteMany({ habitId: habit._id });
    await Habit.deleteOne({ _id: habit._id });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/freeze", async (req, res, next) => {
  try {
    const { date } = req.body;
    const habit = await ownedHabit(req.userId, req.params.id);

    if (!habit) return res.status(404).json({ error: "Habit not found." });
    if (!date) return res.status(400).json({ error: "Date is required." });
    if (habit.freezePassesRemaining <= 0) {
      return res.status(400).json({ error: "No freeze passes left for this habit." });
    }

    const existing = await Checkin.findOne({ habitId: habit._id, date });

    if (existing) {
      if (existing.status !== "frozen") {
        existing.status = "frozen";
        await existing.save();
        habit.freezePassesRemaining -= 1;
        await habit.save();
      }
    } else {
      await Checkin.create({
        habitId: habit._id,
        date,
        status: "frozen",
        countValue: 1,
      });
      habit.freezePassesRemaining -= 1;
      await habit.save();
    }

    return res.json({ habit: withStreaks(habit, new Map([[String(habit._id), (await Checkin.find({ habitId: habit._id, status: { $in: ["done", "frozen"] } }).select("date -_id")).map((r) => r.date)]])) });
  } catch (err) {
    next(err);
  }
});

export default router;
