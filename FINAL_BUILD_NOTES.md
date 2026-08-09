# Habitly final build notes

## Included in this build

- Separate saved AI plans: generating a new plan never replaces an older plan.
- AI plans can be archived or permanently deleted; deleting a plan also removes the supporting AI habits and their check-ins.
- Daily Main Goal, each AI plan, and Other Habits remain separate categories.
- Habit delete + confirmation flow is available in Manage Habits.
- Dashboard New Habit uses the dedicated create panel with no backdrop blur.
- Hidden scrollbars remain scrollable on long panels.
- Light theme keeps the soft mint / navy / coral direction.
- Dark theme uses a solid charcoal / navy canvas with warm off-white and orange accents inspired by the supplied reference.
- Glassmorphism/backdrop-filter effects were removed from the application chrome and landing cards.
- Optional personal Gemini API key support is available from Profile.
- Habitly's default Gemini key is used first; after the app's daily limit, a configured personal key can be used automatically.
- Personal Gemini keys are encrypted at rest on the server and never returned to the browser after saving.
- A step-by-step Gemini key guide is included in Profile.
- Gemini key usage correctly distinguishes a user's own project quota from Habitly's project quota.
- Account deletion now cleans up the user's habits, check-ins, AI plans, AI usage records, journal entries and personal Gemini key.
- Backend date-only calculations use APP_TIMEZONE (default example: Asia/Kolkata) to avoid the UTC date rollover issue discussed during development.

## Environment

Copy `backend/.env.example` to `backend/.env` and configure:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `APP_TIMEZONE`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AI_DAILY_LIMIT`
- `GEMINI_USER_KEY_ENCRYPTION_SECRET`

Never commit `backend/.env` or a real Gemini key.

## Verification

All modified backend JavaScript files were checked with Node's syntax checker successfully.

The frontend production build could not be completed in the packaging environment because its npm registry returned a 404 for the `yallist` optional dependency while reinstalling Rollup. This is an environment/package-registry installation issue; the source and package manifests are included so a normal `npm install` on the target machine can install dependencies and run `npm run build`.
