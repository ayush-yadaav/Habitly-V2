import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export async function generateHabitlyPlan(prompt, apiKey = process.env.GEMINI_API_KEY) {
  if (!apiKey) {
    const error = new Error("Gemini API is not configured.");
    error.code = "GEMINI_NOT_CONFIGURED";
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey });

  const system = `
You are Habitly's AI planning engine.

Convert the user's goal or supplied roadmap into a practical, executable plan.

IMPORTANT:
Return ONLY valid JSON.
Do NOT use markdown.
Do NOT wrap JSON inside code fences.
Do NOT add explanations outside the JSON.

The JSON MUST follow this structure:
{
  "mode": "roadmap",
  "title": "string",
  "summary": "string",
  "durationDays": 30,
  "dailyTimeMinutes": 120,
  "milestones": [
    { "title": "string", "startDay": 1, "endDay": 7 }
  ],
  "tasks": [
    { "day": 1, "title": "string", "durationMinutes": 30, "category": "Learning", "priority": "medium" }
  ],
  "suggestedHabits": [
    { "name": "string", "category": "Learning", "frequency": "daily", "targetCount": 1, "reminderTime": null }
  ]
}

Rules:
- Use mode "roadmap" for roadmaps, syllabi, phases, multi-day goals, or uploaded roadmaps.
- Use mode "single_habit" for one simple ongoing habit. For single_habit use durationDays=1 and exactly one sensible suggested habit.
- For roadmaps create 1-4 small, actionable tasks per day.
- Keep daily workload realistic for dailyTimeMinutes.
- Never exceed 90 days.
- If no duration is given, choose 14-60 practical days.
- Suggested habits are recurring support behaviors, not every daily task. Keep them to 1-4.
- For an uploaded roadmap, preserve its phases/topics/order and do not invent unrelated material.
- priority must be low, medium, or high.
- frequency must be daily, weekdays, or weekly.
- reminderTime must be a time string such as 08:00 or null.
- durationDays must be 1-90.
- dailyTimeMinutes must be 5-480.
- task durationMinutes should be 5-240.
- Keep recommendations practical and safe.
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${system}\n\nUSER REQUEST:\n${prompt}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("Gemini returned an empty plan.");

  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Gemini returned invalid JSON:", raw);
    const error = new Error("Gemini returned invalid plan data.");
    error.code = "GEMINI_INVALID_JSON";
    throw error;
  }
}
