# Campbell CTRL

Official website for Campbell High esports — schedules, standings, and updates.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env` and fill in your Firebase config (get values from the [Firebase Console](https://console.firebase.google.com/)).

3. **Run locally**

   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Firebase

Firestore holds `global/data` (games, standings, rankings) and `config/admins` (admin emails). Ensure Firestore security rules in the Firebase Console restrict write access to authenticated admins as needed.
