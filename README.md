# Habitly

Habitly is a responsive MERN habit and goal system that combines everyday routines with an AI planning workspace.

## Core product model

- **Daily Main Goal** — the habits that define today's core routine.
- **AI Goals** — independent plans generated from a goal or converted from an existing roadmap.
- **Other Habits** — supporting routines that should not affect the main goal.
- **History** — corrections happen here; the dashboard completion action is intentionally one-way for the selected day.
- **Journal** — daily reflection and context.
- **Insights** — progress over time.

## AI Planner

Habitly supports two inputs:

1. **Create with AI** — describe a goal and generate milestones + daily tasks + a small number of supporting habits.
2. **Use my roadmap** — upload PDF, DOCX, TXT or Markdown and convert the supplied roadmap into daily execution without replacing the source topics.

Every generation is saved as a separate plan. Creating another plan never deletes or deactivates an older one. The AI Planner includes a **Your plans** history so users can reopen previous plans. Plans can be archived manually.

AI daily tasks remain tasks. They are not converted into hundreds of habits. Only the plan's small set of supporting habits become Habitly habits and remain linked to that plan.

## Streak model

- Daily Main Goal has its own goal streak.
- Every AI plan has its own roadmap streak based on completed daily tasks.
- Other habits keep individual streaks.
- AI and manual streaks are never mixed.

## Performance work

- Dashboard uses a lightweight endpoint for the latest plan's current-day tasks instead of downloading a complete roadmap.
- Habit streak calculation is batched to avoid one database query per habit.
- AI runs are limited per user/day through MongoDB usage tracking.
- Gemini is called only from the backend.

## Theme

The visual system uses the supplied visual direction rather than a generic AI SaaS template:

- Light: soft mint/cream background with deep navy structure and restrained coral/yellow accents.
- Dark: deep navy/Tokyo-night surfaces with muted lavender/blue and warm accent colors.
- Minimal gradients, no decorative grid, restrained radius and shadow usage.
- Playfair Display + Lato with Airone/Built supported as optional local font fallbacks.

## Run locally

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Copy `backend/.env.example` to `backend/.env` and add your own MongoDB, JWT and Gemini credentials.

## Personal Gemini key (optional)

Habitly uses the server's default Gemini key for the first `AI_DAILY_LIMIT` generations per user/day. After that limit is reached, a user can connect their own Gemini API key from **Profile → Use your Gemini quota**. The personal key is sent only to the Habitly backend and is encrypted at rest; it is never returned to the browser after saving.

For production, set `GEMINI_USER_KEY_ENCRYPTION_SECRET` to a long random secret and keep it private. Do not commit `backend/.env`.

Users can create a Gemini API key in Google AI Studio. Gemini rate limits are applied per Google project, not per API key, so creating another key in the same project does not create additional quota. A separate project or paid tier may have different limits.
