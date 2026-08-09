// import dns from "node:dns";

// dns.setServers([
//   "1.1.1.1",
//   "8.8.8.8"
// ]);


// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import { connectDB } from "./config/db.js";
// import authRoutes from "./routes/auth.js";
// import habitRoutes from "./routes/habits.js";
// import checkinRoutes from "./routes/checkins.js";
// import journalRoutes from "./routes/journal.js";
// import analysisRoutes from "./routes/analysis.js";
// import aiRoutes from "./routes/ai.js";

// const app = express();

// const allowedOrigin = process.env.CLIENT_URL;
// app.use(cors(allowedOrigin ? { origin: allowedOrigin } : undefined));
// app.use(express.json({ limit: "1mb" }));

// app.get("/api/health", (req, res) => {
//   res.json({ ok: true, service: "habitly-api" });
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/habits", habitRoutes);
// app.use("/api/checkins", checkinRoutes);
// app.use("/api/journal", journalRoutes);
// app.use("/api/analysis", analysisRoutes);
// app.use("/api/ai", aiRoutes);

// app.use((req, res) => {
//   res.status(404).json({ error: "Not found." });
// });

// app.use((err, req, res, next) => {
//   console.error(err);

//   if (err?.code === "LIMIT_FILE_SIZE") {
//     return res.status(413).json({ error: "Uploaded file is too large. Keep it under 5 MB." });
//   }

//   if (err?.code === 11000) {
//     return res.status(409).json({ error: "A record with that value already exists." });
//   }

//   if (err?.name === "ValidationError") {
//     return res.status(400).json({ error: err.message });
//   }

//   return res.status(500).json({ error: "Something went wrong on the server." });
// });

// const PORT = process.env.PORT || 4000;

// async function start() {
//   try {
//     await connectDB();
//     app.listen(PORT, () => {
//       console.log(`Habitly API running on http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// }

// start();


import dns from "node:dns";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import checkinRoutes from "./routes/checkins.js";
import journalRoutes from "./routes/journal.js";
import analysisRoutes from "./routes/analysis.js";
import aiRoutes from "./routes/ai.js";

const app = express();

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://habitly-v2.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json({ limit: "1mb" }));

/* =========================
   HEALTH
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "habitly-api",
  });
});

/* =========================
   ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai", aiRoutes);

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    error: "Not found.",
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error(err);

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "Uploaded file is too large. Keep it under 5 MB.",
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: "A record with that value already exists.",
    });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    error: "Something went wrong on the server.",
  });
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Habitly API running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

start();