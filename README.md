# FieldShift

React + Vite frontend for FieldShift, a field-level climate check for farms in Ghana, built for NASA Space Apps 2026. It reads NASA POWER air temperature (`T2M`), corrected precipitation (`PRECTOTCORR`), and all-sky surface shortwave radiation (`ALLSKY_SFC_SW_DWN`) through the FieldShift API, then shows crop ideas that fit that place.

Judges can use **Try it without signing up** on the landing page. No account is required. The page pings the API when it loads. If the live assessment does not answer, the page shows the built-in Accra guest sample and labels it **Sample data**.

What changed, and why, is in [CHANGES.md](CHANGES.md).

## Run locally

```bash
npm install
npm run dev
```

With no `VITE_API_URL`, the dev server calls `http://localhost:5000/api`.

```bash
npm run build
npm run preview
npm run lint
```

## Environment: `VITE_API_URL`

`VITE_API_URL` is the API base and includes the `/api` suffix.

| Situation | API base |
| --- | --- |
| `VITE_API_URL` is set | That value, with any trailing slash removed |
| Dev server, variable unset | `http://localhost:5000/api` |
| Production build, variable unset | `https://nasa-space-challenge-backend.onrender.com/api` |

Example `.env.local` (this file is gitignored):

```bash
VITE_API_URL=https://nasa-space-challenge-backend.onrender.com/api
```

Vite inlines the variable at build time. Set it in the host before the build, and rebuild after you change it. See [.env.example](.env.example).

## Deploy on Vercel

1. Import this GitHub repository in Vercel. The framework preset is Vite. `vercel.json` sets the build to `npm run build`, the output to `dist`, and rewrites every path to `index.html` so `/about`, `/auth`, and the dashboard routes still load on refresh.
2. Add an environment variable for Production (and Preview, if you want the same API):
   - Name: `VITE_API_URL`
   - Value: `https://nasa-space-challenge-backend.onrender.com/api`
   - You can leave it unset. A production build then uses that same Render URL.
3. Deploy. Vercel prints a public `*.vercel.app` URL. That URL is the link to share.
4. Open the site and choose **Try it without signing up**. The Render free tier sleeps. The landing page pings the API root on load and shows **Waking up the server** until the process answers. The first recommendation can take about a minute. After that, Kumasi, Tamale, Wa, a map pin, or a typed region runs `GET /api/public/assess`.
5. If that route is down, the page stays usable: it shows the Accra sample and a **Sample data** label, including the NASA POWER parameter names and the sample date range.

`public/_redirects` is the same SPA fallback for a Netlify-style host.

## Use of AI

Cursor AI agents assisted with this code, including the guest recommendation flow, the API URL configuration, and the deploy setup.
