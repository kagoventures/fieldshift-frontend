import { API_BASE_URL } from "../../utils/apiEndpoint";

export function authHeaders() {
  const token = localStorage.getItem("field_shift_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * The map pin saved with PUT /api/farm, or the registered region when no pin
 * exists yet. GET /api/farm is not a route, so these two recommendation
 * endpoints are the sources that actually return the farm.
 */
export async function fetchSavedFarmContext() {
  const headers = authHeaders();

  const pinRes = await fetch(`${API_BASE_URL}/climate-recommendations`, {
    headers,
  });
  const pinJson = await readJson(pinRes);
  if (pinRes.ok && pinJson.success && pinJson.farmDetails) {
    return { source: "pin", ...pinJson };
  }
  if (pinRes.status !== 404) {
    // A 401/500 should surface. Only "no farm yet" falls through.
    if (!pinRes.ok || pinJson.success === false) {
      const error = new Error(
        pinJson.error || "Could not load your saved farm.",
      );
      error.status = pinRes.status;
      throw error;
    }
  }

  const regionRes = await fetch(`${API_BASE_URL}/personal-recommendations`, {
    headers,
  });
  const regionJson = await readJson(regionRes);
  if (!regionRes.ok || !regionJson.success || !regionJson.farm) {
    const error = new Error(
      regionJson.error || "Could not load your saved farm.",
    );
    error.status = regionRes.status;
    throw error;
  }
  return { source: "region", ...regionJson };
}

export function farmFromContext(ctx) {
  if (ctx.source === "pin") {
    const farm = ctx.farmDetails || {};
    return {
      locationName: farm.locationName || "Saved farm",
      lat: farm.coordinates?.lat,
      lng: farm.coordinates?.lng,
      currentCrop: farm.currentCrop,
      fieldSize: farm.fieldSize,
    };
  }
  const farm = ctx.farm || {};
  return {
    locationName: farm.resolvedLocation || "Registered farm",
    lat: farm.coordinates?.lat,
    lng: farm.coordinates?.lng,
    currentCrop: farm.currentCrop,
    fieldSize: farm.fieldSize,
  };
}

export function telemetryFromContext(ctx) {
  const summary = ctx.climateSummary || {};
  return {
    avgTemp: summary.averageTemperatureC ?? "--",
    totalRain: summary.totalPrecipitationMm ?? "--",
    avgSolar: summary.averageSolarRadiation ?? "--",
  };
}
