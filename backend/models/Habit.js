import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General" },
    icon: { type: String, default: "Sparkles" },
    color: { type: String, default: "#74D4C1" },
    frequency: { type: String, default: "daily" },
    targetCount: { type: Number, default: 1, min: 1 },
    startDate: { type: String, required: true },
    reminderTime: { type: String, default: null },
    freezePassesRemaining: { type: Number, default: 2, min: 0 },
    archived: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
    trackGroup: { type: String, enum: ["main", "other", "ai"], default: "main" },
    aiPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "AIPlan", default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

habitSchema.index({ userId: 1, archived: 1, pinned: -1, createdAt: 1 });

export default mongoose.model("Habit", habitSchema);
