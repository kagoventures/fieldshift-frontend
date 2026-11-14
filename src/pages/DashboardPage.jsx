import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  Sprout,
  MapPin,
  BrainCircuit,
  ArrowRight,
  Loader2,
  CloudSun,
} from "lucide-react";
import "../styles/Dashboard.css";
import AssessmentDetails from "../components/AssessmentDetails";
import {
  demoAi,
  demoAssessment,
  demoClimateSummary,
  demoFarm,
  disableDemoMode,
  isDemoMode,
} from "../lib/demo";
import { API_BASE_URL } from "../../utils/apiEndpoint";




export default function DashboardPage({ navigate, showToast }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("farmer@spaceapps.org");

  const [error, setError] = useState("");
  const [farmData, setFarmData] = useState(null);
  const [climateSummary, setClimateSummary] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [assessment, setAssessment] = useState(null);

  // Ref guard to prevent double-fetching or infinite loops on re-mounts
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const storedUser = localStorage.getItem("field_shift_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email) setUserEmail(parsed.email);
      } catch (e) {
        console.error(e);
      }
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    if (isDemoMode()) {
      setError("");
      setFarmData(demoFarm);
      setClimateSummary(demoClimateSummary);
      setAiRecommendation(demoAi);
      setAssessment(demoAssessment);
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem("field_shift_token");

    try {
      const response = await fetch(`${API_BASE_URL}/personal-recommendations`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to fetch personalized climate telemetry.",
        );
      }

      setError("");
      setFarmData(data.farm);
      setClimateSummary(data.climateSummary);
      setAiRecommendation(data.aiRecommendation);
      setAssessment({
        supported: data.supported,
        message: data.message,
        provenance: data.provenance,
        moisture: data.moisture,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch personalized climate telemetry.");
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    disableDemoMode();
    localStorage.removeItem("field_shift_token");
    localStorage.removeItem("field_shift_user");
    navigate("landing");
    showToast("Signed out successfully.", "info");
  };

  return (
    <div className="app-layout">
      <Sidebar
        activePage="dashboard"
        setActivePage={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      <div className="main-content-wrapper">
        <Header userEmail={userEmail} />

        <main className="dashboard-page-container">
          <div className="dashboard-view">
            <div className="dashboard-hero-card">
              <h1 className="dashboard-title">Dashboard Overview</h1>
              <p className="dashboard-subtitle">
                Personalized agro-climate telemetry fetched live from NASA POWER
                for your registered region and processed through our trained
                decision tree classifier.
              </p>
              <p className="dashboard-farm-note">
                This overview is your registered primary farm. The Map page is
                for checking other places.
              </p>
            </div>

            {isLoading ? (
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
                  Resolving Geocoded Region & Querying NASA Satellites...
                </span>
              </div>
            ) : error || !farmData ? (
              <p className="page-status page-status-error" role="alert">
                {error || "No farm data was returned."}
              </p>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-header">
                      <MapPin size={16} color="#10b981" /> Registered Region /
                      Location
                    </div>
                    <div
                      className="stat-value"
                      style={{ fontSize: "16px", wordBreak: "break-word" }}
                    >
                      {farmData.resolvedLocation}
                    </div>
                    <span
                      className="stat-footer-tag"
                      style={{ color: "#10b981" }}
                    >
                      Lat: {farmData.coordinates?.lat}, Lng:{" "}
                      {farmData.coordinates?.lng}
                    </span>
                  </div>

                  <div className="stat-box">
                    <div className="stat-header">
                      <CloudSun size={16} color="#3b82f6" /> NASA Climate
                      Indicators
                    </div>
                    <div className="stat-value">
                      {climateSummary?.averageTemperatureC}°C |{" "}
                      {climateSummary?.totalPrecipitationMm}mm
                    </div>
                    <span
                      className="stat-footer-tag"
                      style={{ color: "#3b82f6" }}
                    >
                      Avg Temp & Annualized Rainfall (Solar:{" "}
                      {climateSummary?.averageSolarRadiation} kWh/m²)
                    </span>
                  </div>

                  <div className="stat-box">
                    <div className="stat-header">
                      <BrainCircuit size={16} color="#f59e0b" /> AI Crop
                      Recommendation
                    </div>
                    <div
                      className="stat-value"
                      style={{ color: "#059669", fontSize: "18px" }}
                    >
                      {assessment?.supported === false
                        ? "Outside Ghana"
                        : aiRecommendation?.crop}
                    </div>
                    <span
                      className="stat-footer-tag"
                      style={{ color: "#64748b" }}
                    >
                      {aiRecommendation?.reasoning}
                    </span>
                  </div>
                </div>

                <AssessmentDetails
                  supported={assessment?.supported}
                  message={assessment?.message}
                  provenance={assessment?.provenance}
                  moisture={assessment?.moisture}
                  crops={aiRecommendation?.crops}
                />

                <div className="action-card">
                  <h3 className="action-card-title">Quick Navigation</h3>
                  <p className="action-card-desc">
                    Ready to update your registration region or inspect deep
                    daily solar and humidity graphs?
                  </p>
                  <div className="action-btn-group">
                    <button
                      className="btn-dash-primary"
                      onClick={() => navigate("map")}
                    >
                      Update Farm Coordinates <ArrowRight size={16} />
                    </button>
                    <button
                      className="btn-dash-secondary"
                      onClick={() => navigate("recommendations")}
                    >
                      View Detailed AI Rotation Strategy
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
