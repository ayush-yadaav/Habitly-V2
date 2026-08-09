import mongoose from "mongoose";

const geminiKeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    fingerprint: { type: String, required: true },
    last4: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("GeminiKey", geminiKeySchema);
