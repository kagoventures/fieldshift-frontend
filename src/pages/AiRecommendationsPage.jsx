import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  BrainCircuit,
  Sprout,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import "../styles/AiRecommendations.css";
import AssessmentDetails from "../components/AssessmentDetails";
import {
  demoAiResult,
  demoClimateSummary,
  demoFarmDetails,
  disableDemoMode,
  isDemoMode,
} from "../lib/demo";
import { API_BASE_URL } from "../../utils/apiEndpoint";



export default function AiRecommendationsPage({ navigate, showToast }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("farmer@spaceapps.org");

  const [farmData, setFarmData] = useState(null);
  const [climateSummary, setClimateSummary] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Load user email/username from local storage
    const storedUser = localStorage.getItem("field_shift_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email) setUserEmail(parsed.email);
        else if (parsed.name) setUserEmail(parsed.name);
      } catch (e) {
        console.error(e);
      }
    }

    // Check if we already fetched this session to prevent remount loops
    if (isDemoMode()) {
      setFarmData(demoFarmDetails);
      setClimateSummary(demoClimateSummary);
      setResult(demoAiResult);
      setLoading(false);
      return;
    }

    const cachedData = sessionStorage.getItem("field_shift_ai_cache");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setFarmData(parsed.farmData);
        setClimateSummary(parsed.climateSummary);
        setResult(parsed.result);
        setLoading(false);
        return; // Exit immediately, no duplicate network request
      } catch (e) {
        sessionStorage.removeItem("field_shift_ai_cache");
      }
    }

    fetchInferenceData(false);
  }, []);

  const fetchInferenceData = async (isManualRefresh = false) => {
    setLoading(true);
    if (isDemoMode()) {
      setError("");
      setFarmData(demoFarmDetails);
      setClimateSummary(demoClimateSummary);
      setResult(demoAiResult);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("field_shift_token");

    try {
      const response = await fetch(`${API_BASE_URL}/climate-recommendations`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to run ml-cart inference.");
      }

      const newFarmData = data.farmDetails || null;
      const newClimateSummary = data.climateSummary || null;
      const newResult = {
        recommendedCrop:
          data.aiRecommendation?.suggestedAdaptiveCrop || "—",
        confidence: data.aiRecommendation?.confidenceScore || "",
        reasoning: data.aiRecommendation?.reasoning || "",
        modelEngine: data.aiRecommendation?.modelEngine || "",
        supported: data.supported,
        message: data.message,
        provenance: data.provenance,
        moisture: data.moisture,
        crops: data.aiRecommendation?.crops,
        confidenceValue: data.aiRecommendation?.confidence,
      };

      setError("");
      setFarmData(newFarmData);
      setClimateSummary(newClimateSummary);
      setResult(newResult);

      // Cache the result in sessionStorage so remounts won't trigger re-fetching
      sessionStorage.setItem(
        "field_shift_ai_cache",
        JSON.stringify({
          farmData: newFarmData,
          climateSummary: newClimateSummary,
          result: newResult,
        }),
      );

      if (isManualRefresh && showToast) {
        showToast(
          "ml-cart inference re-evaluated successfully via NASA POWER!",
          "success",
        );
      }
    } catch (err) {
      setError(err.message || "Failed to run ml-cart inference.");
      if (showToast) showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    sessionStorage.removeItem("field_shift_ai_cache");
    fetchInferenceData(true);
  };

  const handleLogout = () => {
    disableDemoMode();
    sessionStorage.clear();
    localStorage.removeItem("field_shift_token");
    localStorage.removeItem("field_shift_user");
    navigate("landing");
    if (showToast) showToast("Signed out successfully.", "info");
  };

  return (
    <div className="app-layout">
      <Sidebar
        activePage="recommendations"
        setActivePage={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      <div className="main-content-wrapper">
        <Header userEmail={userEmail} />

        <main
          className="dashboard-page-container"
          style={{ paddingTop: "0px", marginTop: "0px" }}
        >
          <div className="ai-view" style={{ paddingTop: "0px" }}>
            <div
              className="ai-header-row"
              style={{ marginTop: "0px", paddingTop: "0px" }}
            >
              <div className="ai-header">
                <h1 style={{ marginTop: "0px", color: "#0f172a" }}>
                  AI Crop Rotation Decision Engine
                </h1>
                <p>
                  Powered by Node.js{" "}
                  <code style={{ color: "#059669" }}>ml-cart</code> in-memory
                  decision tree classifier and live NASA POWER data.
                </p>
              </div>
              <button
                className="btn-run-ml"
                onClick={handleManualRefresh}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Running ML Inference..." : "Refresh Inference"}
              </button>
            </div>

            {loading && !result ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "60px",
                }}
              >
                <Loader2
                  size={36}
                  className="animate-spin"
                  style={{ color: "#10b981" }}
                />
                <span
                  style={{
                    marginLeft: "12px",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Evaluating agroclimate metrics through decision tree...
                </span>
              </div>
            ) : error && !result ? (
              <p className="page-status page-status-error" role="alert">
                {error}
              </p>
            ) : result && farmData && climateSummary ? (
              <>
                <div className="ai-strategy-card">
                  <span className="ai-tag-label">
                    Recommended Rotation Strategy ({farmData.locationName})
                  </span>

                  <div className="rotation-flow">
                    <div className="rotation-box">
                      <span>Current Cultivar</span>
                      <span>{farmData.currentCrop}</span>
                    </div>
                    <ArrowRight size={22} color="#10b981" />
                    <div className="rotation-box highlight">
                      <span>AI Recommended Target</span>
                      <span>
                        {result.supported === false
                          ? "Outside Ghana"
                          : result.recommendedCrop}
                      </span>
                    </div>
                  </div>

                  <p className="ai-reasoning-text">{result.reasoning}</p>
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "11px",
                      color: "#64748b",
                      fontStyle: "italic",
                    }}
                  >
                    Engine: {result.modelEngine}
                  </div>
                </div>

                <AssessmentDetails
                  supported={result.supported}
                  message={result.message}
                  provenance={result.provenance}
                  moisture={result.moisture}
                  crops={result.crops}
                />

                <div className="ai-metrics-grid">
                  <div className="ai-metric-box">
                    <span>Average Temperature</span>
                    <div style={{ color: "#f59e0b" }}>
                      {climateSummary.averageTemperatureC} °C
                    </div>
                  </div>
                  <div className="ai-metric-box">
                    <span>Total Precipitation</span>
                    <div style={{ color: "#3b82f6" }}>
                      {climateSummary.totalPrecipitationMm} mm
                    </div>
                  </div>
                  <div className="ai-metric-box">
                    <span>Solar Radiation</span>
                    <div style={{ color: "#059669" }}>
                      {climateSummary.averageSolarRadiation} kWh/m²
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
