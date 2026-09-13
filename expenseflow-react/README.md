# ExpenseFlow (React + Firebase)

React rewrite of the original single-file ExpenseFlow. Data lives in
**Firebase Firestore** instead of `localStorage`, so it persists across devices and
browsers and can be deployed to any host.

## Views

- **Dashboard** — KPIs, daily spending chart, category breakdown, recent transactions
- **Transactions** — searchable/filterable table for the selected month
- **Bulk Import** — paste your original text format; parser detects dates and `amount - description` lines
- **Other Expenses** — recurring/separate items kept out of daily spending
- **Year Summary** — full-year totals, monthly chart, category breakdown

## Data model (Firestore)

Two top-level collections:

- `transactions` — `{ date: "YYYY-MM-DD", amount: number, desc: string, cat: string, month: "YYYY-MM" }`
- `others` — `{ desc: string, amount: number, month: "YYYY-MM" }`

On first run, if `transactions` is empty, the app seeds the original July/August demo data.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Firebase project at https://console.firebase.google.com, add a Web app, and
   enable **Firestore Database**.

3. Copy env template and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

## Firestore security rules

The default rules below allow open read/write — fine for a quick personal demo, but
**not safe for production**. Add Firebase Authentication and scope data per user before
exposing this publicly.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // TODO: replace with auth-based rules
    }
  }
}
```

## Build & deploy

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

Deploy `dist/` to any static host (Firebase Hosting, Netlify, Vercel, etc.). Because
storage is in Firestore, your data is shared across every device that opens the app.

## Notes carried over from the original

- The bulk-import parser fixes the year to **2026** to match the source data format.
- Imports are append-only (no duplicate detection).
- "Deca Payment" is treated as **House Payment** in the Year Summary.
