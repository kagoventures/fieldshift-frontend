import { API_BASE_URL, backendOrigin } from "../../utils/apiEndpoint";
import {
  demoAi,
  demoAssessment,
  demoClimateSummary,
  demoCrops,
  demoFarm,
} from "./demo";

export const ASSESS_TIMEOUT_MS = 90000;

export const GHANA_PRESETS = [
  {
    id: "kumasi",
    name: "Kumasi",
    region: "Kumasi, Ghana",
    lat: 6.6885,
    lng: -1.6244,
  },
  {
    id: "tamale",
    name: "Tamale",
    region: "Tamale, Ghana",
    lat: 9.4072,
    lng: -0.8532,
  },
  {
    id: "wa",
    name: "Wa",
    region: "Wa, Ghana",
    lat: 10.0601,
    lng: -2.5019,
  },
];

const POWER_PARAMETERS = ["T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN"];
const RETRY_STATUSES = new Set([502, 503, 504]);

function round(value, digits) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(id);
      const error = new Error("cancelled");
      error.name = "AbortError";
      reject(error);
    };
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function cannedGuestResult(requestedLabel) {
  return {
    sample: true,
    requestedLabel,
    supported: demoAssessment.supported,
    message: demoAssessment.message,
    provenance: demoAssessment.provenance,
    moisture: demoAssessment.moisture,
    climateSummary: demoClimateSummary,
    dataSource: "Guest demo sample",
    warnings: [],
    locationName: demoFarm.resolvedLocation,
    lat: demoFarm.coordinates.lat,
    lng: demoFarm.coordinates.lng,
    crop: demoAi.crop,
    reasoning: demoAi.reasoning,
    crops: demoCrops,
  };
}

export function normalizePublicAssessment(data) {
  if (!data || typeof data !== "object") {
    throw new Error("The public assessment returned an empty response.");
  }

  const ai = data.aiRecommendation || {};
  const recommendation = data.recommendation || {};
  const farm = data.farm || data.farmDetails || {};
  const coords = farm.coordinates || data.coordinates || {};
  const rawClimate = data.climateSummary
    ? null
    : data.climate && typeof data.climate === "object"
      ? data.climate
      : null;
  const climateSummary =
    data.climateSummary ||
    (rawClimate
      ? {
          averageTemperatureC: round(rawClimate.avgTemp, 1),
          totalPrecipitationMm: round(rawClimate.totalRain, 0),
          averageSolarRadiation: round(rawClimate.avgSolar, 2),
        }
      : null);

  const crops = ai.crops || recommendation.cropDetails || data.crops || [];
  const crop =
    ai.crop || ai.suggestedAdaptiveCrop || recommendation.name || null;
  const lat = Number(coords.lat ?? data.lat);
  const lng = Number(coords.lng ?? data.lng);

  if (!climateSummary && !crop && !data.provenance) {
    throw new Error("The public assessment response was missing climate data.");
  }

  return {
    sample: false,
    supported: data.supported ?? recommendation.supported,
    message: data.message ?? null,
    provenance: data.provenance ?? null,
    moisture: data.moisture ?? null,
    climateSummary,
    dataSource: data.dataSource || data.provenance?.source || "NASA POWER",
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    locationName:
      farm.resolvedLocation || farm.locationName || data.locationName || null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    crop,
    reasoning: ai.reasoning || recommendation.reasoning || "",
    crops: Array.isArray(crops) ? crops : [],
  };
}

export function provenanceForDisplay(result) {
  const source = result?.provenance?.source
    ? result.provenance.source
    : result?.sample
      ? "Guest demo sample (not a live NASA POWER request)"
      : result?.dataSource || "NASA POWER";
  const fromApi = result?.provenance?.parameters;
  const parameters =
    Array.isArray(fromApi) && fromApi.length ? fromApi : POWER_PARAMETERS;
  return {
    source,
    parameters,
    dateRange: result?.provenance?.dateRange || null,
    community: result?.provenance?.community || null,
  };
}

export function formatPowerDate(value) {
  const text = String(value ?? "");
  if (!/^\d{8}$/.test(text)) return text;
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

export function formatDateRange(range) {
  if (!range?.start) return "";
  const start = formatPowerDate(range.start);
  return range.end ? `${start} – ${formatPowerDate(range.end)}` : start;
}

function assessUrl(query) {
  const params = new URLSearchParams();
  if (query.lat != null && query.lng != null) {
    params.set("lat", String(query.lat));
    params.set("lng", String(query.lng));
  }
  if (query.region) params.set("region", query.region);
  return `${API_BASE_URL}/public/assess?${params.toString()}`;
}

function failureMessage(response, data) {
  if (data?.error) return data.error;
  if (response.status === 404) {
    return "The public assessment endpoint is not available on this server yet.";
  }
  return `The assessment request failed (${response.status}).`;
}

function cancelledError() {
  const cancelled = new Error("cancelled");
  cancelled.name = "AbortError";
  return cancelled;
}

export async function fetchPublicAssessment(query, { signal } = {}) {
  const url = assessUrl(query);
  let lastError = new Error("Could not reach the FieldShift API.");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (signal?.aborted) throw cancelledError();

    let response;
    try {
      response = await fetch(url, {
        signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      if (signal?.aborted || err?.name === "AbortError") throw cancelledError();
      lastError =
        err instanceof Error
          ? err
          : new Error("Could not reach the FieldShift API.");
      if (attempt === 3) break;
      await sleep(1500 * (attempt + 1), signal);
      continue;
    }

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.success !== false) {
      return normalizePublicAssessment(data);
    }

    lastError = new Error(failureMessage(response, data));
    const retry = RETRY_STATUSES.has(response.status) && attempt < 3;
    if (!retry) throw lastError;
    await sleep(1500 * (attempt + 1), signal);
  }

  if (/failed to fetch|network|load failed/i.test(lastError.message)) {
    throw new Error("Could not reach the FieldShift API.");
  }
  throw lastError;
}

export function pingBackend({ signal } = {}) {
  return fetch(`${backendOrigin()}/`, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Wake-up ping failed (${response.status}).`);
    }
    return response;
  });
}
