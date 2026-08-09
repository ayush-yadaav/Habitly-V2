import { Router } from "express";
import Checkin from "../models/Checkin.js";
import Habit from "../models/Habit.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

async function habitBelongsToUser(userId, habitId) {
  return Habit.exists({ _id: habitId, userId });
}

router.post("/toggle", async (req, res, next) => {
  try {
    const { habitId, date, countValue } = req.body;

    if (!await habitBelongsToUser(req.userId, habitId)) {
      return res.status(404).json({ error: "Habit not found." });
    }
    if (!date) return res.status(400).json({ error: "Date is required." });

    const existing = await Checkin.findOne({ habitId, date });

    // Dashboard completion is a one-way action for the selected day.
    // Corrections are intentionally handled from History/Edit instead.
    if (existing) {
      return res.status(409).json({
        error: "This habit is already completed for this date. Use History to correct it."
      });
    }

    await Checkin.create({
      habitId,
      date,
      status: "done",
      countValue: countValue || 1,
    });

    return res.json({ done: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:habitId/:date", async (req, res, next) => {
  try {
    if (!await habitBelongsToUser(req.userId, req.params.habitId)) {
      return res.status(404).json({ error: "Habit not found." });
    }

    await Checkin.deleteOne({
      habitId: req.params.habitId,
      date: req.params.date,
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { from, to, habitId } = req.query;
    const habitQuery = { userId: req.userId };

    if (habitId) habitQuery._id = habitId;

    const habits = await Habit.find(habitQuery).select("_id");
    const habitIds = habits.map((habit) => habit._id);

    const query = { habitId: { $in: habitIds } };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const checkins = await Checkin.find(query).sort({ date: 1 });
    return res.json({ checkins });
  } catch (err) {
    next(err);
  }
});

export default router;
