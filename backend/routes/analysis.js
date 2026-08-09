import { Router } from "express";
import Habit from "../models/Habit.js";
import Checkin from "../models/Checkin.js";
import { requireAuth } from "../middleware/auth.js";
import { addDays, todayISO } from "../utils/streaks.js";

const router = Router();
router.use(requireAuth);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

router.get("/summary", async (req, res, next) => {
  try {
    const days = Math.max(1, Number(req.query.days || 30));
    const today = todayISO();
    const from = addDays(today, -days + 1);
    const prevFrom = addDays(from, -days);
    const prevTo = addDays(from, -1);

    const habits = await Habit.find({
      userId: req.userId,
      archived: false,
    }).select("_id name color");

    if (!habits.length) {
      return res.json({
        overallCompletion: 0,
        previousCompletion: 0,
        dailySeries: [],
        byHabit: [],
        bestHabit: null,
        worstHabit: null,
        byWeekday: WEEKDAYS.map((day) => ({ day, completion: 0 })),
        totalCompleted: 0,
        totalMissed: 0,
      });
    }

    const habitIds = habits.map((habit) => habit._id);

    const rows = await Checkin.find({
      habitId: { $in: habitIds },
      date: { $gte: from, $lte: today },
      status: { $in: ["done", "frozen"] },
    }).select("date habitId status");

    const prevRows = await Checkin.find({
      habitId: { $in: habitIds },
      date: { $gte: prevFrom, $lte: prevTo },
      status: { $in: ["done", "frozen"] },
    }).select("date habitId");

    const totalSlots = habits.length * days;
    const overallCompletion = Math.round((rows.length / totalSlots) * 100);
    const previousCompletion = Math.round((prevRows.length / totalSlots) * 100);

    const dailyMap = {};
    for (let i = 0; i < days; i += 1) {
      dailyMap[addDays(from, i)] = 0;
    }

    rows.forEach((row) => {
      dailyMap[row.date] = (dailyMap[row.date] || 0) + 1;
    });

    const dailySeries = Object.keys(dailyMap)
      .sort()
      .map((date) => ({
        date,
        completed: dailyMap[date],
        percent: Math.round((dailyMap[date] / habits.length) * 100),
      }));

    const byHabit = habits
      .map((habit) => {
        const count = rows.filter(
          (row) => row.habitId.toString() === habit._id.toString()
        ).length;

        return {
          id: habit._id,
          name: habit.name,
          color: habit.color,
          completion: Math.round((count / days) * 100),
        };
      })
      .sort((a, b) => b.completion - a.completion);

    const weekdayTotals = WEEKDAYS.map(() => ({ completed: 0, slots: 0 }));

    for (let i = 0; i < days; i += 1) {
      const date = addDays(from, i);
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      weekdayTotals[weekday].slots += habits.length;
      weekdayTotals[weekday].completed += dailyMap[date] || 0;
    }

    const byWeekday = WEEKDAYS.map((day, index) => ({
      day,
      completion: weekdayTotals[index].slots
        ? Math.round(
            (weekdayTotals[index].completed / weekdayTotals[index].slots) * 100
          )
        : 0,
    }));

    return res.json({
      overallCompletion,
      previousCompletion,
      dailySeries,
      byHabit,
      bestHabit: byHabit[0] || null,
      worstHabit: byHabit[byHabit.length - 1] || null,
      byWeekday,
      totalCompleted: rows.length,
      totalMissed: Math.max(totalSlots - rows.length, 0),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
