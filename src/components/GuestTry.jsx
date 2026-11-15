import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import AssessmentDetails from "./AssessmentDetails";
import { enableDemoMode } from "../lib/demo";
import {
  GHANA_PRESETS,
  ASSESS_TIMEOUT_MS,
  cannedGuestResult,
  fetchPublicAssessment,
  formatDateRange,
  pingBackend,
  provenanceForDisplay,
} from "../lib/publicAssess";
import "../styles/GuestTry.css";

const fieldIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_PRESET = GHANA_PRESETS[0];

function MapFlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 7), { duration: 0.6 });
    }
  }, [lat, lng, map]);
  return null;
}

function MapPick({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function metric(value, digits) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return digits == null ? String(value) : n.toFixed(digits);
}

export default function GuestTry({ navigate }) {
  const [latText, setLatText] = useState(String(DEFAULT_PRESET.lat));
  const [lngText, setLngText] = useState(String(DEFAULT_PRESET.lng));
  const [regionText, setRegionText] = useState(DEFAULT_PRESET.region);
  const [mode, setMode] = useState("coords");
  const [formError, setFormError] = useState("");
  const [serverStatus, setServerStatus] = useState("waking");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [fallbackNote, setFallbackNote] = useState("");
  const assessRef = useRef(null);

  const runAssess = useCallback((query) => {
    assessRef.current?.abort();
    const controller = new AbortController();
    controller.timedOut = false;
    assessRef.current = controller;
    const timer = setTimeout(() => {
      controller.timedOut = true;
      controller.abort();
    }, ASSESS_TIMEOUT_MS);

    fetchPublicAssessment(query, { signal: controller.signal })
      .then((live) => {
        if (controller.signal.aborted && !controller.timedOut) return;
        setServerStatus("ready");
        setResult({ ...live, requestedLabel: query.label });
        setLoading(false);
      })
      .catch((err) => {
        const replaced = controller.signal.aborted && !controller.timedOut;
        if (replaced) return;
        const reason = controller.timedOut
          ? "The server did not respond in time. It may still be waking up."
          : err?.message || "The live assessment failed.";
        setResult(cannedGuestResult(query.label));
        setFallbackNote(reason);
        setLoading(false);
      })
      .finally(() => clearTimeout(timer));
  }, []);

  const startAssess = useCallback(
    (query) => {
      setLoading(true);
      setResult(null);
      setFallbackNote("");
      runAssess(query);
    },
    [runAssess],
  );

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 75000);
    pingBackend({ signal: controller.signal })
      .then(() => {
        if (!ignore) setServerStatus("ready");
      })
      .catch(() => {
        if (ignore) return;
        setServerStatus((current) =>
          current === "ready" ? current : "unreachable",
        );
      });
    return () => {
      ignore = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    runAssess({
      lat: DEFAULT_PRESET.lat,
      lng: DEFAULT_PRESET.lng,
      region: DEFAULT_PRESET.region,
      label: DEFAULT_PRESET.region,
    });
    return () => assessRef.current?.abort();
  }, [runAssess]);

  const latNum = Number(latText);
  const lngNum = Number(lngText);
  const mapLat = Number.isFinite(latNum) ? latNum : DEFAULT_PRESET.lat;
  const mapLng = Number.isFinite(lngNum) ? lngNum : DEFAULT_PRESET.lng;

  const loadingCopy =
    serverStatus === "ready"
      ? "Server is awake. Reading NASA POWER temperature, rainfall, and solar data for this field…"
      : serverStatus === "unreachable"
        ? "The wake-up ping did not answer. Still asking for a live recommendation — the first request can take about a minute while the server starts."
        : "Waking up the server. Free hosting sleeps when it has been idle, so the first request can take about a minute. The recommendation shows here when NASA POWER answers.";

  function selectPreset(preset) {
    setLatText(String(preset.lat));
    setLngText(String(preset.lng));
    setRegionText(preset.region);
    setMode("coords");
    setFormError("");
    startAssess({
      lat: preset.lat,
      lng: preset.lng,
      region: preset.region,
      label: preset.region,
    });
  }

  function onPick(lat, lng) {
    const nextLat = lat.toFixed(4);
    const nextLng = lng.toFixed(4);
    setLatText(nextLat);
    setLngText(nextLng);
    setRegionText(`Pinned field (${nextLat}, ${nextLng})`);
    setMode("coords");
    setFormError("");
  }

  function onSubmit(event) {
    event.preventDefault();
    if (mode === "region") {
      const region = regionText.trim();
      if (!region) {
        setFormError("Type a region, such as Kumasi or Tamale.");
        return;
      }
      setFormError("");
      startAssess({ region, label: region });
      return;
    }

    const lat = Number(latText);
    const lng = Number(lngText);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      setFormError("Enter a valid latitude and longitude, or type a region.");
      return;
    }
    setFormError("");
    const label = regionText.trim() || `${lat}, ${lng}`;
    startAssess({
      lat,
      lng,
      region: regionText.trim(),
      label,
    });
  }

  const provenance = result ? provenanceForDisplay(result) : null;
  const dateRange = provenance ? formatDateRange(provenance.dateRange) : "";

  return (
    <section
      id="try-without-signup"
      className="guest-try"
      aria-labelledby="guest-try-title"
    >
      <div className="guest-try-copy">
        <p className="guest-kicker">No account</p>
        <h2 id="guest-try-title">Try it without signing up</h2>
        <p>
          Pick a field in Ghana on the map, or type a region. FieldShift asks
          the public assessment for a live recommendation. Kumasi loads on its
          own so you can see a result without creating an account.
        </p>
      </div>

      <p
        className={`guest-server guest-server-${serverStatus}`}
        role="status"
      >
        {serverStatus === "ready"
          ? "Server is awake"
          : serverStatus === "unreachable"
            ? "Wake-up ping did not get a reply. A labeled sample shows if the live request fails."
            : "Waking up the server…"}
      </p>

      <div className="guest-layout">
        <div className="guest-map-card">
          <h3>
            <MapPin size={18} color="#10b981" aria-hidden="true" /> Ghana field
          </h3>
          <div className="guest-map">
            <MapContainer
              center={[DEFAULT_PRESET.lat, DEFAULT_PRESET.lng]}
              zoom={7}
              minZoom={6}
              maxBounds={[
                [3.8, -4.2],
                [12.2, 2.2],
              ]}
              maxBoundsViscosity={0.6}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapFlyTo lat={mapLat} lng={mapLng} />
              <MapPick onPick={onPick} />
              <Marker position={[mapLat, mapLng]} icon={fieldIcon} />
            </MapContainer>
          </div>
          <div className="guest-presets" role="group" aria-label="Preset towns">
            {GHANA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={
                  regionText === preset.region ? "is-selected" : undefined
                }
                aria-pressed={regionText === preset.region}
                onClick={() => selectPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form className="guest-form" onSubmit={onSubmit}>
          <label htmlFor="guest-region">Region</label>
          <input
            id="guest-region"
            value={regionText}
            onChange={(event) => {
              setRegionText(event.target.value);
              setMode("region");
            }}
            placeholder="Tamale, Ghana"
            autoComplete="off"
          />

          <div className="guest-coords">
            <div>
              <label htmlFor="guest-lat">Latitude</label>
              <input
                id="guest-lat"
                inputMode="decimal"
                value={latText}
                onChange={(event) => {
                  setLatText(event.target.value);
                  setMode("coords");
                }}
              />
            </div>
            <div>
              <label htmlFor="guest-lng">Longitude</label>
              <input
                id="guest-lng"
                inputMode="decimal"
                value={lngText}
                onChange={(event) => {
                  setLngText(event.target.value);
                  setMode("coords");
                }}
              />
            </div>
          </div>

          <p className="guest-mode">
            {mode === "region"
              ? "This request sends the place name."
              : "This request sends the map coordinates."}
          </p>
          {formError && (
            <p className="guest-form-error" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className="guest-submit">
            {loading ? "Checking this field…" : "Get live recommendation"}
          </button>
        </form>
      </div>

      <div className="guest-result" aria-live="polite">
        {loading ? (
          <div className="guest-loading" role="status">
            <Loader2 className="guest-spin" size={28} aria-hidden="true" />
            <p>{loadingCopy}</p>
          </div>
        ) : result ? (
          <article>
            <div className="guest-result-head">
              <span className={result.sample ? "guest-badge sample" : "guest-badge live"}>
                {result.sample ? "Sample data" : "Live"}
              </span>
              <h3>
                {result.supported === false
                  ? "Outside Ghana"
                  : result.crop || "Recommendation"}
              </h3>
            </div>

            {result.sample && (
              <p className="guest-sample-banner" role="status">
                <strong>Sample data.</strong> The live assessment did not load
                {fallbackNote ? ` (${fallbackNote})` : ""}. These figures are
                the built-in Accra guest sample, not a NASA POWER reading for{" "}
                {result.requestedLabel || "the place you picked"}.
              </p>
            )}

            <p className="guest-place">
              {result.locationName || result.requestedLabel}
              {result.lat != null && result.lng != null
                ? ` · ${result.lat}, ${result.lng}`
                : ""}
            </p>
            {result.reasoning && <p>{result.reasoning}</p>}

            {result.climateSummary && (
              <dl className="guest-metrics">
                <div>
                  <dt>Temperature (T2M)</dt>
                  <dd>
                    {metric(result.climateSummary.averageTemperatureC, 1)} °C
                  </dd>
                </div>
                <div>
                  <dt>Rainfall (PRECTOTCORR)</dt>
                  <dd>
                    {metric(result.climateSummary.totalPrecipitationMm, 0)} mm
                  </dd>
                </div>
                <div>
                  <dt>Solar (ALLSKY_SFC_SW_DWN)</dt>
                  <dd>
                    {metric(result.climateSummary.averageSolarRadiation, 2)}{" "}
                    kWh/m²
                  </dd>
                </div>
              </dl>
            )}

            <div className="guest-provenance">
              <h4>Data provenance</h4>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{provenance.source}</dd>
                </div>
                <div>
                  <dt>Parameters</dt>
                  <dd>{provenance.parameters.join(", ")}</dd>
                </div>
                <div>
                  <dt>Date range</dt>
                  <dd>
                    {dateRange ||
                      "Not included in this response. FieldShift asks NASA POWER for the previous full calendar year."}
                  </dd>
                </div>
                {provenance.community && (
                  <div>
                    <dt>Community</dt>
                    <dd>{provenance.community}</dd>
                  </div>
                )}
              </dl>
            </div>

            {!result.sample && result.warnings?.[0] && (
              <p className="guest-warning">{result.warnings[0]}</p>
            )}

            <AssessmentDetails
              supported={result.supported}
              message={result.message}
              moisture={result.moisture}
              crops={result.crops}
            />

            {result.sample && (
              <button
                type="button"
                className="guest-sample-link"
                onClick={() => {
                  enableDemoMode();
                  navigate("/dashboard");
                }}
              >
                Open the sample dashboard
              </button>
            )}
          </article>
        ) : null}
      </div>
    </section>
  );
}
