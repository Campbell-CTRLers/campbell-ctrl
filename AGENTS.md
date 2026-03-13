# AGENTS.md

## Cursor Cloud specific instructions

**Product:** Campbell CTRL — a React SPA for a school esports/gaming club. Client-side only; no custom backend server. Firebase (Firestore + Auth) is the cloud backend.

**Tech stack:** React 19, Vite 7, Tailwind CSS 3, Firebase, GSAP, npm.

### Running the app

- `npm run dev` starts the Vite dev server (default port 5173).
- A `.env` file with `VITE_FIREBASE_*` variables is required for Firebase to initialize. Without real credentials, mock values allow the UI to render but Firebase-dependent features (admin auth, live data) won't work. See `src/firebase.js` for the full list of required env vars.
- When the Firebase secrets are provided as environment variables (e.g. via Cursor Secrets), generate the `.env` file before starting the dev server:
  ```
  env | grep ^VITE_FIREBASE_ | while IFS='=' read -r k v; do echo "$k=$v"; done > .env
  ```
- The Vite dev server must be restarted after changing `.env` (env vars are only read at server startup).

### Linting

- `npm run lint` — ESLint (JS/JSX)
- `npm run lint:css` — Stylelint (CSS)

### Building

- `npm run build` — Vite production build to `dist/`

### Notes

- No automated test suite exists in this repo (no test runner configured).
- The admin dashboard (`/admin`) requires Google Auth via Firebase; it cannot be tested without valid Firebase credentials.
- Package manager is **npm** (lockfile: `package-lock.json`).
