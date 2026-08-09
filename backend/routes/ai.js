import { Router } from "express";
import crypto from "node:crypto";
import multer from "multer";
import AIPlan from "../models/AIPlan.js";
import AIUsage from "../models/AIUsage.js";
import Habit from "../models/Habit.js";
import Checkin from "../models/Checkin.js";
import { requireAuth } from "../middleware/auth.js";
import { generateHabitlyPlan } from "../services/gemini.js";
import { todayISO } from "../utils/streaks.js";
import { extractRoadmapText } from "../services/roadmapText.js";
import { getUserGeminiKey, getUserGeminiKeyStatus, saveUserGeminiKey, removeUserGeminiKey } from "../services/userGeminiKey.js";

const router = Router();
router.use(requireAuth);

const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 3);
const MAX_PROMPT = 2000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function normalizePrompt(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function dateFromOffset(startDate, offset) {
  const d = new Date(`${startDate}T00:00:00`);
  d.setDate(d.getDate() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function reserveQuota(userId) {
  const date = todayISO();
  let usage = await AIUsage.findOne({ userId, date });

  if (!usage) {
    try {
      usage = await AIUsage.create({ userId, date, count: 0 });
    } catch (err) {
      if (err.code !== 11000) throw err;
      usage = await AIUsage.findOne({ userId, date });
    }
  }

  const updated = await AIUsage.findOneAndUpdate(
    { _id: usage._id, count: { $lt: DAILY_LIMIT } },
    { $inc: { count: 1 } },
    { new: true }
  );

  if (!updated) {
    const error = new Error(`Daily AI limit reached (${DAILY_LIMIT} requests).`);
    error.code = "AI_LIMIT";
    throw error;
  }

  return { used: updated.count, remaining: Math.max(0, DAILY_LIMIT - updated.count) };
}


async function rollbackQuota(userId) {
  const date = todayISO();
  await AIUsage.findOneAndUpdate(
    { userId, date, count: { $gt: 0 } },
    { $inc: { count: -1 } }
  );
}

async function getDailyUsage(userId) {
  const usage = await AIUsage.findOne({ userId, date: todayISO() });
  const used = usage?.count || 0;
  return { used, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used) };
}

async function chooseGeminiKey(userId) {
  const personalKey = await getUserGeminiKey(userId);
  const usage = await getDailyUsage(userId);

  // Habitly's key is the default while the app-level daily allowance remains.
  // Once it is exhausted, a configured personal key can continue the request.
  if (usage.remaining > 0 && process.env.GEMINI_API_KEY) {
    const quota = await reserveQuota(userId);
    return { apiKey: process.env.GEMINI_API_KEY, personalKey, quota, usedPersonalKey: false };
  }

  if (!personalKey) {
    const quota = await reserveQuota(userId);
    return { apiKey: process.env.GEMINI_API_KEY, personalKey: null, quota, usedPersonalKey: false };
  }

  return { apiKey: personalKey, personalKey, quota: usage, usedPersonalKey: true };
}

function usageForResponse(usage, personalKeyConfigured, usedPersonalKey = false) {
  return {
    ...usage,
    personalKeyConfigured,
    usedPersonalKey,
    canUseAi: usage.remaining > 0 || personalKeyConfigured,
  };
}

router.get("/usage", async (req, res, next) => {
  try {
    const usage = await getDailyUsage(req.userId);
    const keyStatus = await getUserGeminiKeyStatus(req.userId);
    return res.json(usageForResponse(usage, keyStatus.configured));
  } catch (err) {
    next(err);
  }
});

router.get("/personal-key", async (req, res, next) => {
  try {
    return res.json(await getUserGeminiKeyStatus(req.userId));
  } catch (err) {
    next(err);
  }
});

router.put("/personal-key", async (req, res, next) => {
  try {
    const status = await saveUserGeminiKey(req.userId, req.body.apiKey);
    return res.json({ status, message: "Your Gemini key is securely stored." });
  } catch (err) {
    if (err.code === "USER_KEY_INVALID") return res.status(400).json({ error: err.message });
    if (err.code === "USER_KEY_ENCRYPTION_NOT_CONFIGURED") return res.status(503).json({ error: "Secure key storage is not configured on the server." });
    next(err);
  }
});

router.delete("/personal-key", async (req, res, next) => {
  try {
    return res.json(await removeUserGeminiKey(req.userId));
  } catch (err) {
    next(err);
  }
});

router.get("/plans", async (req, res, next) => {
  try {
    const plans = await AIPlan.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-tasks");
    return res.json({ plans });
  } catch (err) {
    next(err);
  }
});

router.get("/plans/active/today", async (req, res, next) => {
  try {
    const plan = await AIPlan.findOne({ userId: req.userId, archived: { $ne: true } })
      .sort({ createdAt: -1 });
    if (!plan) return res.json({ plan: null });

    const today = todayISO();
    const todayTasks = plan.tasks.filter((task) => task.date === today);
    const completedTasks = plan.tasks.filter((task) => task.done).length;
    return res.json({
      plan: {
        _id: plan._id,
        title: plan.title,
        summary: plan.summary,
        durationDays: plan.durationDays,
        dailyTimeMinutes: plan.dailyTimeMinutes,
        startDate: plan.startDate,
        source: plan.source,
        sourceFileName: plan.sourceFileName,
        todayTasks,
        today,
        completedTasks,
        totalTasks: plan.tasks.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/plans/streaks", async (req, res, next) => {
  try {
    const plans = await AIPlan.find({ userId: req.userId, archived: { $ne: true } })
      .sort({ createdAt: -1 })
      .select("title source durationDays tasks createdAt");

    const addDay = (date, delta) => {
      const d = new Date(`${date}T00:00:00`);
      d.setDate(d.getDate() + delta);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const streakFor = (dates) => {
      const set = new Set(dates);
      const today = todayISO();
      let cursor = set.has(today) ? today : addDay(today, -1);
      let current = 0;
      while (set.has(cursor)) {
        current += 1;
        cursor = addDay(cursor, -1);
      }
      const sorted = [...set].sort();
      let best = 0;
      let run = 0;
      let previous = null;
      for (const date of sorted) {
        if (previous && addDay(previous, 1) === date) run += 1;
        else run = 1;
        best = Math.max(best, run);
        previous = date;
      }
      return { current, best };
    };

    const result = plans.map((plan) => {
      const byDate = new Map();
      for (const task of plan.tasks) {
        if (!task.date) continue;
        if (!byDate.has(task.date)) byDate.set(task.date, []);
        byDate.get(task.date).push(Boolean(task.done));
      }
      const completedDates = [...byDate.entries()]
        .filter(([, tasks]) => tasks.length > 0 && tasks.every(Boolean))
        .map(([date]) => date);
      return {
        _id: plan._id,
        title: plan.title,
        source: plan.source,
        durationDays: plan.durationDays,
        createdAt: plan.createdAt,
        ...streakFor(completedDates),
      };
    });

    return res.json({ plans: result });
  } catch (err) {
    next(err);
  }
});


router.get("/plans/:id", async (req, res, next) => {
  try {
    const plan = await AIPlan.findOne({ _id: req.params.id, userId: req.userId });
    if (!plan) return res.status(404).json({ error: "AI plan not found." });
    return res.json({ plan });
  } catch (err) {
    next(err);
  }
});

router.post("/plan", async (req, res, next) => {
  const prompt = String(req.body.prompt || "").trim();

  if (!prompt) return res.status(400).json({ error: "Tell AI what you want to achieve." });
  if (prompt.length > MAX_PROMPT) {
    return res.status(400).json({ error: `Keep the prompt under ${MAX_PROMPT} characters.` });
  }

  try {
    const normalized = normalizePrompt(prompt);
    const cacheKey = crypto.createHash("sha256").update(normalized).digest("hex");

    // Every successful generation is stored as its own plan. We intentionally do
    // not reuse an older plan here: users may want multiple versions of the same goal.
    const keySelection = await chooseGeminiKey(req.userId);

    let generated;
    try {
      generated = await generateHabitlyPlan(prompt, keySelection.apiKey);
    } catch (err) {
      if (!keySelection.usedPersonalKey && keySelection.personalKey && (err.status === 429 || err.code === "RESOURCE_EXHAUSTED")) {
        await rollbackQuota(req.userId);
        generated = await generateHabitlyPlan(prompt, keySelection.personalKey);
        keySelection.quota = await getDailyUsage(req.userId);
        keySelection.usedPersonalKey = true;
      } else {
        if (!keySelection.usedPersonalKey) await rollbackQuota(req.userId);
        throw err;
      }
    }

    const durationDays = Math.min(90, Math.max(1, Number(generated.durationDays) || 1));
    const startDate = todayISO();

    const tasks = (generated.tasks || [])
      .filter((task) => task.day >= 1 && task.day <= durationDays)
      .slice(0, durationDays * 4)
      .map((task) => ({
        day: task.day,
        date: dateFromOffset(startDate, task.day - 1),
        title: String(task.title).trim().slice(0, 160),
        durationMinutes: Math.min(240, Math.max(5, Number(task.durationMinutes) || 30)),
        category: String(task.category || "Learning").slice(0, 50),
        priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
        done: false,
      }));

    const milestones = (generated.milestones || [])
      .slice(0, 12)
      .map((m) => ({
        title: String(m.title).trim().slice(0, 120),
        startDay: Math.max(1, Math.min(durationDays, Number(m.startDay) || 1)),
        endDay: Math.max(1, Math.min(durationDays, Number(m.endDay) || 1)),
      }));

    const suggestedHabits = (generated.suggestedHabits || [])
      .slice(0, 6)
      .map((h) => ({
        name: String(h.name).trim().slice(0, 100),
        category: String(h.category || "Learning").slice(0, 50),
        frequency: ["daily", "weekdays", "weekly"].includes(h.frequency) ? h.frequency : "daily",
        targetCount: Math.max(1, Math.min(10, Number(h.targetCount) || 1)),
        reminderTime: h.reminderTime || null,
      }));

    const plan = await AIPlan.create({
      userId: req.userId,
      cacheKey,
      mode: generated.mode === "single_habit" ? "single_habit" : "roadmap",
      prompt,
      title: String(generated.title || "My AI Plan").slice(0, 120),
      summary: String(generated.summary || "").slice(0, 500),
      durationDays,
      dailyTimeMinutes: Math.min(480, Math.max(5, Number(generated.dailyTimeMinutes) || 30)),
      milestones,
      tasks,
      suggestedHabits,
      startDate,
      active: true,
      archived: false,
      source: "ai_generated",
      sourceFileName: null,
    });

    // Single-habit requests become a real Habit immediately.
    // Roadmaps also create only the recurring support habits; daily execution
    // tasks remain in the plan so the dashboard is not flooded with 60 habits.
    if (plan.mode === "single_habit") {
      const h = plan.suggestedHabits[0];
      if (h) {
        await Habit.create({
          userId: req.userId,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          targetCount: h.targetCount,
          startDate,
          reminderTime: h.reminderTime,
          source: "ai",
          aiPlanId: plan._id,
          trackGroup: "ai",
        });
      }
    } else {
      const toCreate = plan.suggestedHabits.slice(0, 4);
      if (toCreate.length) {
        await Habit.insertMany(
          toCreate.map((h) => ({
            userId: req.userId,
            name: h.name,
            category: h.category,
            frequency: h.frequency,
            targetCount: h.targetCount,
            startDate,
            reminderTime: h.reminderTime,
            source: "ai",
            aiPlanId: plan._id,
            trackGroup: "ai",
          }))
        );
      }
    }

    return res.status(201).json({ plan, cached: false, usage: usageForResponse(keySelection.quota, Boolean(keySelection.personalKey), keySelection.usedPersonalKey) });
  } catch (err) {
    if (err.code === "AI_LIMIT") {
      return res.status(429).json({ error: err.message });
    }
    if (err.code === "USER_KEY_ENCRYPTION_NOT_CONFIGURED") {
      return res.status(503).json({ error: "Secure personal Gemini key storage is not configured on the server." });
    }
    if (err.code === "GEMINI_NOT_CONFIGURED") {
      return res.status(503).json({ error: "AI is not configured on the server yet." });
    }
    if (err.status === 429 || err.code === "RESOURCE_EXHAUSTED") {
      return res.status(429).json({ error: "Gemini is temporarily rate-limited. Try again later." });
    }
    next(err);
  }
});


router.post("/roadmap-upload", upload.single("roadmap"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a roadmap file first." });

    const roadmapText = await extractRoadmapText(req.file);
    const dailyTimeMinutes = Math.min(480, Math.max(5, Number(req.body.dailyTimeMinutes) || 120));
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(req.body.startDate || "")) ? String(req.body.startDate) : todayISO();
    const deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(req.body.deadline || "")) ? String(req.body.deadline) : "";
    const mode = String(req.body.mode || "break_down");
    const availableDays = deadline ? Math.max(1, Math.floor((new Date(`${deadline}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000) + 1) : null;

    const prompt = `You are converting an existing roadmap into a daily execution plan for Habitly.\n\nIMPORTANT: The roadmap below is the source of truth. Do not invent unrelated topics. Preserve its phases, subjects, and ordering as much as possible. Break the supplied roadmap into practical daily tasks.\n\nStart date: ${startDate}\nDaily available time: ${dailyTimeMinutes} minutes\nDeadline: ${deadline || "No fixed deadline"}\nMaximum available days: ${availableDays || "Choose a practical duration"}\nPlanning mode: ${mode === "follow_exactly" ? "Follow the roadmap exactly; do not add unrelated material." : "Break the roadmap into realistic daily actions while preserving all major topics."}\n\nReturn ONLY valid JSON using the same Habitly plan structure: mode, title, summary, durationDays, dailyTimeMinutes, milestones, tasks, suggestedHabits.\n\nSOURCE ROADMAP:\n${roadmapText}`;

    const normalized = normalizePrompt(`${req.file.originalname}|${startDate}|${deadline}|${dailyTimeMinutes}|${mode}|${roadmapText}`);
    const cacheKey = crypto.createHash("sha256").update(normalized).digest("hex");
    // Uploaded roadmaps also create independent saved plans. This keeps a user's
    // history intact even when they upload the same roadmap again with new dates.
    const keySelection = await chooseGeminiKey(req.userId);
    let generated;
    try {
      generated = await generateHabitlyPlan(prompt, keySelection.apiKey);
    } catch (err) {
      if (!keySelection.usedPersonalKey && keySelection.personalKey && (err.status === 429 || err.code === "RESOURCE_EXHAUSTED")) {
        await rollbackQuota(req.userId);
        generated = await generateHabitlyPlan(prompt, keySelection.personalKey);
        keySelection.quota = await getDailyUsage(req.userId);
        keySelection.usedPersonalKey = true;
      } else {
        if (!keySelection.usedPersonalKey) await rollbackQuota(req.userId);
        throw err;
      }
    }

    const durationDays = Math.min(90, availableDays || 90, Math.max(1, Number(generated.durationDays) || 1));
    const tasks = (generated.tasks || []).filter((task) => task.day >= 1 && task.day <= durationDays).slice(0, durationDays * 4).map((task) => ({
      day: task.day,
      date: dateFromOffset(startDate, task.day - 1),
      title: String(task.title || "Task").trim().slice(0, 160),
      durationMinutes: Math.min(240, Math.max(5, Number(task.durationMinutes) || 30)),
      category: String(task.category || "Learning").slice(0, 50),
      priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
      done: false,
    }));
    const milestones = (generated.milestones || []).slice(0, 12).map((m) => ({
      title: String(m.title || "Phase").trim().slice(0, 120),
      startDay: Math.max(1, Math.min(durationDays, Number(m.startDay) || 1)),
      endDay: Math.max(1, Math.min(durationDays, Number(m.endDay) || 1)),
    }));
    const suggestedHabits = (generated.suggestedHabits || []).slice(0, 4).map((h) => ({
      name: String(h.name || "Daily practice").trim().slice(0, 100),
      category: String(h.category || "Learning").slice(0, 50),
      frequency: ["daily", "weekdays", "weekly"].includes(h.frequency) ? h.frequency : "daily",
      targetCount: Math.max(1, Math.min(10, Number(h.targetCount) || 1)),
      reminderTime: h.reminderTime || null,
    }));

    const plan = await AIPlan.create({
      userId: req.userId,
      cacheKey,
      mode: "roadmap",
      prompt,
      title: String(generated.title || req.file.originalname || "My Roadmap").slice(0, 120),
      summary: String(generated.summary || "Converted from your uploaded roadmap.").slice(0, 500),
      durationDays,
      dailyTimeMinutes,
      milestones,
      tasks,
      suggestedHabits,
      startDate,
      active: true,
      archived: false,
      source: "uploaded_roadmap",
      sourceFileName: req.file.originalname.slice(0, 180),
    });

    if (suggestedHabits.length) {
      await Habit.insertMany(suggestedHabits.map((h) => ({
        userId: req.userId,
        name: h.name,
        category: h.category,
        frequency: h.frequency,
        targetCount: h.targetCount,
        startDate,
        reminderTime: h.reminderTime,
        source: "ai",
        aiPlanId: plan._id,
        trackGroup: "ai",
      })));
    }

    return res.status(201).json({ plan, cached: false, usage: usageForResponse(keySelection.quota, Boolean(keySelection.personalKey), keySelection.usedPersonalKey) });
  } catch (err) {
    if (err.code === "AI_LIMIT") return res.status(429).json({ error: err.message });
    if (err.code === "ROADMAP_FILE_TYPE" || err.code === "ROADMAP_EMPTY") return res.status(400).json({ error: err.message });
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Roadmap file is too large. Keep it under 5 MB." });
    if (err.code === "USER_KEY_ENCRYPTION_NOT_CONFIGURED") return res.status(503).json({ error: "Secure personal Gemini key storage is not configured on the server." });
    if (err.code === "GEMINI_NOT_CONFIGURED") return res.status(503).json({ error: "AI is not configured on the server yet." });
    if (err.status === 429 || err.code === "RESOURCE_EXHAUSTED") return res.status(429).json({ error: "Gemini is temporarily rate-limited. Try again later." });
    next(err);
  }
});


router.delete("/plans/:id", async (req, res, next) => {
  try {
    const plan = await AIPlan.findOne({ _id: req.params.id, userId: req.userId });
    if (!plan) return res.status(404).json({ error: "AI plan not found." });

    const linkedHabits = await Habit.find({ userId: req.userId, aiPlanId: plan._id }).select("_id");
    const habitIds = linkedHabits.map((habit) => habit._id);

    if (habitIds.length) {
      await Checkin.deleteMany({ habitId: { $in: habitIds } });
      await Habit.deleteMany({ _id: { $in: habitIds }, userId: req.userId });
    }

    await AIPlan.deleteOne({ _id: plan._id, userId: req.userId });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/plans/:id/archive", async (req, res, next) => {
  try {
    const plan = await AIPlan.findOne({ _id: req.params.id, userId: req.userId });
    if (!plan) return res.status(404).json({ error: "AI plan not found." });
    plan.archived = Boolean(req.body.archived);
    plan.active = !plan.archived;
    await plan.save();
    if (plan.archived) {
      await Habit.updateMany({ userId: req.userId, aiPlanId: plan._id, archived: false }, { $set: { archived: true } });
    }
    return res.json({ plan: { _id: plan._id, archived: plan.archived, active: plan.active } });
  } catch (err) {
    next(err);
  }
});

router.patch("/plans/:id/tasks/:taskId", async (req, res, next) => {
  try {
    const plan = await AIPlan.findOne({ _id: req.params.id, userId: req.userId });
    if (!plan) return res.status(404).json({ error: "AI plan not found." });

    const task = plan.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found." });

    task.done = Boolean(req.body.done);
    await plan.save();

    return res.json({ task });
  } catch (err) {
    next(err);
  }
});

export default router;
