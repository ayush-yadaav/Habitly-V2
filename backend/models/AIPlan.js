import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    date: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, min: 5, max: 240, default: 30 },
    category: { type: String, default: "Learning" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startDay: { type: Number, required: true },
    endDay: { type: Number, required: true },
  },
  { _id: false }
);

const habitSuggestionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "General" },
    frequency: { type: String, default: "daily" },
    targetCount: { type: Number, min: 1, max: 10, default: 1 },
    reminderTime: { type: String, default: null },
  },
  { _id: false }
);

const aiPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Kept for backward compatibility. It is no longer used to replace older plans.
    cacheKey: { type: String, index: true },
    mode: { type: String, enum: ["roadmap", "single_habit"], required: true },
    prompt: { type: String, required: true, trim: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    durationDays: { type: Number, min: 1, max: 90, default: 1 },
    dailyTimeMinutes: { type: Number, min: 5, max: 480, default: 30 },
    milestones: { type: [milestoneSchema], default: [] },
    tasks: { type: [taskSchema], default: [] },
    suggestedHabits: { type: [habitSuggestionSchema], default: [] },
    startDate: { type: String, required: true },
    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    source: { type: String, enum: ["ai_generated", "uploaded_roadmap"], default: "ai_generated" },
    sourceFileName: { type: String, default: null },
  },
  { timestamps: true }
);

aiPlanSchema.index({ userId: 1, createdAt: -1 });
aiPlanSchema.index({ userId: 1, archived: 1, createdAt: -1 });

export default mongoose.model("AIPlan", aiPlanSchema);
