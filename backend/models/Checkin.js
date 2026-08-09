import mongoose from "mongoose";

const checkinSchema = new mongoose.Schema(
  {
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["done", "frozen"], default: "done" },
    countValue: { type: Number, default: 1, min: 1 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

checkinSchema.index({ habitId: 1, date: 1 }, { unique: true });
checkinSchema.index({ date: 1 });

export default mongoose.model("Checkin", checkinSchema);
