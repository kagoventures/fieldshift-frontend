export function isDemoMode() {
  return sessionStorage.getItem("field_shift_demo") === "1";
}

export function enableDemoMode() {
  sessionStorage.setItem("field_shift_demo", "1");
}

export function disableDemoMode() {
  sessionStorage.removeItem("field_shift_demo");
}

const provenance = {
  source: "Guest demo sample (not a live NASA POWER request)",
  parameters: ["T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN"],
  dateRange: { start: "20250101", end: "20251231" },
  community: "AG",
};

export const demoFarm = {
  resolvedLocation: "Accra demo field, Ghana",
  coordinates: { lat: 5.6037, lng: -0.187 },
  currentCrop: "Maize",
  fieldSize: 2.5,
};

export const demoClimateSummary = {
  averageTemperatureC: 27.1,
  totalPrecipitationMm: 810,
  averageSolarRadiation: 18.4,
};

const moisture = {
  level: "low",
  annualRainfallMm: 810,
  summary:
    "Sample only: annual rainfall is 810 mm, low moisture. This is not a live NASA reading.",
};

export const demoAssessment = {
  supported: true,
  message: null,
  provenance,
  moisture,
};

export const demoCrops = [
  {
    name: "Maize",
    reason:
      "Sample reason: maize is commonly grown in Ghana's coastal savannah when rains are moderate.",
    confidence: 0.8,
  },
  {
    name: "Cassava",
    reason:
      "Sample reason: cassava tolerates the warm temperatures in this demo profile.",
    confidence: 0.7,
  },
];

export const demoAi = {
  crop: "Coastal savannah sample (Maize, Cassava)",
  reasoning:
    "Guest demo for an Accra field. Sign in to load your own farm from NASA POWER.",
  crops: demoCrops,
};

export const demoClimatePage = {
  lat: demoFarm.coordinates.lat,
  lng: demoFarm.coordinates.lng,
  locationName: demoFarm.resolvedLocation,
  dataSource: "Guest demo sample",
  telemetry: {
    avgTemp: demoClimateSummary.averageTemperatureC,
    totalRain: demoClimateSummary.totalPrecipitationMm,
    avgSolar: demoClimateSummary.averageSolarRadiation,
  },
  liveWeather: null,
  ...demoAssessment,
  crops: demoCrops,
};

export const demoFarmDetails = {
  locationName: demoFarm.resolvedLocation,
  coordinates: demoFarm.coordinates,
  currentCrop: demoFarm.currentCrop,
  fieldSize: "2.5 Hectares",
};

export const demoAiResult = {
  recommendedCrop: demoAi.crop,
  confidence: "Guest demo",
  reasoning: demoAi.reasoning,
  modelEngine: "Guest demo (no model call)",
  supported: true,
  message: null,
  provenance,
  moisture,
  crops: demoCrops,
};
