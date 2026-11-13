# Changes

## 13 Nov 2026 — Frontend fixes for navigation, saved farms, and new API fields

The original app is on `main` (`Import original frontend`). This branch keeps those screens and fixes the items below. New API fields (`supported`, `message`, `moisture`, `provenance`, `aiRecommendation.crops`) are optional, so an older Render deploy still loads.

### 1. Landing buttons and the sign-in toast

**Why.** Explore Dashboard and Farmer Portal Log In only fired a "sign in!" toast. Sign In opened `/auth` and already showed "Signed in as Farmer successfully." The auth form also called `localhost`, so a deployed login could not reach the API.

**What.** Explore Dashboard goes to `/dashboard`. Farmer Portal Log In and Sign In go to `/auth` with no success toast. Auth uses `https://nasa-space-challenge-backend.onrender.com/api`.

**Files.** `src/pages/LandingPage.jsx`, `src/pages/AuthPage.jsx`

### 2. Saved farm on Climate and the Map

**Why.** Climate called `GET /api/data`, which falls back to "Accra Test Field" when the user has no stored pin. The map form started on that same Accra default. The climate title was near-white (`#f8fafc`) on a white page.

**What.** Both pages load the saved map pin from `GET /api/climate-recommendations`. If that farm does not exist yet (404), they use the registered region from `GET /api/personal-recommendations`. The climate heading and section title use dark text.

**Files.** `src/lib/farm.js`, `src/pages/ClimateDataPage.jsx`, `src/pages/FarmMapPage.jsx`, `src/styles/ClimateData.css`

### 3. Remove the 404 farm fetch; loading and error states

**Why.** `GET /api/farm` is not a route (only `PUT /api/farm` is). The map called it on load. Dashboard, climate, map, and recommendations also rendered Accra, maize, and sample climate numbers before the request finished, and left those numbers up when the request failed.

**What.** The GET is gone. Those pages stay on a loading state, then show an error message instead of placeholder farms.

**Files.** `src/pages/FarmMapPage.jsx`, `src/pages/ClimateDataPage.jsx`, `src/pages/DashboardPage.jsx`, `src/pages/AiRecommendationsPage.jsx`, `src/index.css`

### 4. Dashboard label for the registered primary farm

**Why.** The dashboard geocodes the region from registration. That is intentional and is not the map pin. Nothing on the page said so.

**What.** A note says this overview is the registered primary farm, and that the Map page is for checking other places.

**Files.** `src/pages/DashboardPage.jsx`, `src/styles/Dashboard.css`

### 5. Outside Ghana, provenance, and per-crop reasons

**Why.** The backend can now return `supported: false` for pins outside Ghana, plus `message`, `moisture`, `provenance` (NASA POWER parameters, date range, source), and `aiRecommendation.crops[]` with `reason` and `confidence`. The UI ignored them and could present "Unsupported location" as a crop zone.

**What.** When `supported === false`, dashboard, climate, and recommendations show "Outside supported region (Ghana)" and the API message. Provenance, the moisture sentence, and each crop's reason and confidence render only when those fields are present. Inside Ghana the crop name is unchanged.

**Files.** `src/components/AssessmentDetails.jsx`, `src/styles/AssessmentDetails.css`, `src/pages/DashboardPage.jsx`, `src/pages/ClimateDataPage.jsx`, `src/pages/AiRecommendationsPage.jsx`

### 6. Branding and unsupported claims

**Why.** The browser tab said "my-map-app". Sign-in said "NASA Agroclimate Portal". The landing page claimed "+22%" yield and "35%" water savings that the app does not measure.

**What.** The tab title is FieldShift, with a meta description. The sign-in toast says FieldShift. The two stats now say crop suggestions follow local climate and that water guidance comes from measured rain.

**Files.** `index.html`, `src/pages/AuthPage.jsx`, `src/pages/LandingPage.jsx`

### 7. Climate chart

**Why.** The climate numbers were only three cards. A chart makes the same temperature, rainfall, and solar values easier to scan.

**What.** `chart.js` draws one bar chart per metric, each with its own axis, so millimetres are not plotted against degrees.

**Files.** `package.json`, `package-lock.json`, `src/components/ClimateChart.jsx`, `src/pages/ClimateDataPage.jsx`, `src/styles/ClimateData.css`

### 8. About page and guest demo

**Why.** Teammates and visitors had no short account of the problem, the NASA POWER parameters, or the method, and every screen required a live account.

**What.** `/about` covers the problem, the POWER parameters (T2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN), the annual-rainfall method, and links to [NASA POWER](https://power.larc.nasa.gov/). "Try guest demo" opens the dashboard on a labeled Accra sample and does not call the API. Sign-in or sign-out leaves demo mode.

**Files.** `src/pages/AboutPage.jsx`, `src/styles/AboutPage.css`, `src/lib/demo.js`, `src/App.jsx`, `src/pages/LandingPage.jsx`, `src/components/Sidebar.jsx`, `src/components/Header.jsx`, `src/pages/AuthPage.jsx`, `src/pages/DashboardPage.jsx`, `src/pages/ClimateDataPage.jsx`, `src/pages/FarmMapPage.jsx`, `src/pages/AiRecommendationsPage.jsx`
