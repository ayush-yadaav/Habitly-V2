import { Router } from "express";
import JournalEntry from "../models/JournalEntry.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const query = { userId: req.userId };

    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = req.query.from;
      if (req.query.to) query.date.$lte = req.query.to;
    }

    const entries = await JournalEntry.find(query).sort({ date: -1 });
    return res.json({ entries });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      date,
      note,
      mood,
      energy,
      gratitude,
      win,
      tomorrow,
      tags,
    } = req.body;

    if (!date || !note?.trim()) {
      return res.status(400).json({ error: "Date and note are required." });
    }

    const cleanTags = Array.isArray(tags)
      ? [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 6)
      : [];

    const entry = await JournalEntry.findOneAndUpdate(
      { userId: req.userId, date },
      {
        note: note.trim(),
        mood: mood || null,
        energy: energy ? Number(energy) : null,
        gratitude: gratitude?.trim() || "",
        win: win?.trim() || "",
        tomorrow: tomorrow?.trim() || "",
        tags: cleanTags,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ entry });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!entry) return res.status(404).json({ error: "Entry not found." });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
