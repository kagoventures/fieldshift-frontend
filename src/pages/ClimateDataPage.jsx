import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  CloudSun,
  Thermometer,
  Droplets,
  Sun,
  Activity,
  Loader2,
  Wind,
} from "lucide-react";
import "../styles/ClimateData.css";
import AssessmentDetails from "../components/AssessmentDetails";
import ClimateChart from "../components/ClimateChart";
import {
  farmFromContext,
  fetchSavedFarmContext,
  telemetryFromContext,
} from "../lib/farm";

export default function ClimateDataPage({ navigate, showToast }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("farmer@spaceapps.org");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("field_shift_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email) setUserEmail(parsed.email);
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchData() {
      try {
        const ctx = await fetchSavedFarmContext();
        const farm = farmFromContext(ctx);
        setData({
          lat: farm.lat ?? "",
          lng: farm.lng ?? "",
          locationName: farm.locationName,
          dataSource: ctx.dataSource || "",
          telemetry: telemetryFromContext(ctx),
          liveWeather: ctx.liveWeather || null,
          supported: ctx.supported,
          message: ctx.message ?? null,
          moisture: ctx.moisture ?? null,
          provenance: ctx.provenance ?? null,
          crops: ctx.aiRecommendation?.crops ?? null,
        });
      } catch (err) {
        setError(err.message || "Failed to load telemetry.");
        if (showToast) showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showToast]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("landing");
  };

  return (
    <div className="app-layout">
      <Sidebar
        activePage="climate"
        setActivePage={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />
      <div className="main-content-wrapper">
        <Header userEmail={userEmail} />
        <main className="dashboard-page-container">
          <div className="climate-view">
            <div className="climate-header">
              <h1>Environmental Telemetry & Weather</h1>
              {data && (
                <>
                  <p>
                    Active Farm: <strong>{data.locationName}</strong> [
                    {data.lat}, {data.lng}]
                  </p>
                  {data.dataSource && (
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: "8px",
                        padding: "4px 10px",
                        background: "#065f46",
                        color: "#34d399",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                      }}
                    >
                      📡 Source: {data.dataSource}
                    </div>
                  )}
                </>
              )}
            </div>

            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "300px",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Loader2 className="animate-spin" size={36} color="#10b981" />
                <p>Gathering sensor and satellite metrics...</p>
              </div>
            ) : error ? (
              <p className="page-status page-status-error" role="alert">
                {error}
              </p>
            ) : data ? (
              <>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    color: "#0f172a",
                    margin: "1.5rem 0 0.75rem",
                  }}
                >
                  📊 NASA POWER Climatology Baseline
                </h3>
                <div className="climate-metrics-grid">
                  <div className="climate-metric-card">
                    <div
                      className="climate-metric-top"
                      style={{ color: "#f59e0b" }}
                    >
                      <Thermometer size={18} /> Avg Temperature
                    </div>
                    <div className="climate-metric-val">
                      {data.telemetry.avgTemp} °C
                    </div>
                    <div className="climate-metric-sub">
                      Mean daily temp at 2 meters (T2M)
                    </div>
                  </div>
                  <div className="climate-metric-card">
                    <div
                      className="climate-metric-top"
                      style={{ color: "#3b82f6" }}
                    >
                      <Droplets size={18} /> Annual Precipitation
                    </div>
                    <div className="climate-metric-val">
                      {data.telemetry.totalRain} mm
                    </div>
                    <div className="climate-metric-sub">
                      Annualised corrected rainfall
                    </div>
                  </div>
                  <div className="climate-metric-card">
                    <div
                      className="climate-metric-top"
                      style={{ color: "#10b981" }}
                    >
                      <Sun size={18} /> Solar Radiation
                    </div>
                    <div className="climate-metric-val">
                      {data.telemetry.avgSolar} kWh/m²
                    </div>
                    <div className="climate-metric-sub">
                      Surface shortwave downward irradiance
                    </div>
                  </div>
                </div>

                <ClimateChart telemetry={data.telemetry} />

                {data.liveWeather && (
                  <>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        color: "black",
                        margin: "2rem 0 0.75rem",
                      }}
                    >
                      🌤️ Live Weather (
                      {data.liveWeather.stationName || "Local Station"})
                    </h3>
                    <div className="climate-metrics-grid">
                      <div className="climate-metric-card">
                        <div
                          className="climate-metric-top"
                          style={{ color: "#f59e0b" }}
                        >
                          <Thermometer size={18} /> Current Temp
                        </div>
                        <div className="climate-metric-val">
                          {data.liveWeather.temp} °C
                        </div>
                        <div className="climate-metric-sub">
                          Feels like {data.liveWeather.feelsLike}°C (
                          {data.liveWeather.weatherDescription})
                        </div>
                      </div>
                      <div className="climate-metric-card">
                        <div
                          className="climate-metric-top"
                          style={{ color: "#3b82f6" }}
                        >
                          <Droplets size={18} /> Humidity
                        </div>
                        <div className="climate-metric-val">
                          {data.liveWeather.humidity} %
                        </div>
                        <div className="climate-metric-sub">
                          Surface atmospheric moisture
                        </div>
                      </div>
                      <div className="climate-metric-card">
                        <div
                          className="climate-metric-top"
                          style={{ color: "#10b981" }}
                        >
                          <Wind size={18} /> Wind & Pressure
                        </div>
                        <div className="climate-metric-val">
                          {data.liveWeather.windSpeed} m/s
                        </div>
                        <div className="climate-metric-sub">
                          Pressure: {data.liveWeather.pressure} hPa | Clouds:{" "}
                          {data.liveWeather.clouds}%
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <AssessmentDetails
                  supported={data.supported}
                  message={data.message}
                  provenance={data.provenance}
                  moisture={data.moisture}
                  crops={data.crops}
                />

                <div className="sentinel-card" style={{ marginTop: "2rem" }}>
                  <h3 className="sentinel-title">
                    <Activity size={18} color="#10b981" /> Sentinel Cleaning
                  </h3>
                  <p className="sentinel-text">
                    Null records (-999 sentinels) automatically filtered from
                    NASA telemetry.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
