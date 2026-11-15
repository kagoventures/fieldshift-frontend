const PRODUCTION_API_URL =
  "https://nasa-space-challenge-backend.onrender.com/api";
const DEV_API_URL = "http://localhost:5000/api";

function trimUrl(value) {
  return String(value).trim().replace(/\/+$/, "");
}

function currentViteEnv() {
  // Member expressions on import.meta.env are what Vite inlines. Reading the
  // object and then a property drops VITE_API_URL from the production bundle.
  const viteEnv = import.meta.env;
  if (!viteEnv) return {};
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    DEV: import.meta.env.DEV,
  };
}

/**
 * VITE_API_URL wins in every mode. Otherwise dev uses localhost and a
 * production build uses the Render API.
 */
export function resolveApiBaseUrl(env = currentViteEnv()) {
  const configured = env?.VITE_API_URL;
  if (typeof configured === "string" && configured.trim()) {
    return trimUrl(configured);
  }
  return env?.DEV ? DEV_API_URL : PRODUCTION_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export function backendOrigin(base = API_BASE_URL) {
  return trimUrl(base).replace(/\/api$/i, "");
}
