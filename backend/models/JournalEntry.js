import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    note: { type: String, required: true, trim: true },
    mood: { type: String, default: null },
    energy: { type: Number, min: 1, max: 5, default: null },
    gratitude: { type: String, default: "", trim: true },
    win: { type: String, default: "", trim: true },
    tomorrow: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

journalSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("JournalEntry", journalSchema);
