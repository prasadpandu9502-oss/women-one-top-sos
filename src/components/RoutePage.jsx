import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoutePage.css";

const districtCoords = {
  Chennai: [13.0827, 80.2707],
  Kanchipuram: [12.837, 79.7],
  Vellore: [12.9165, 79.1325],
  Krishnagiri: [12.5186, 78.2137],
  "Bengaluru City": [12.9716, 77.5946],
  Villupuram: [11.9395, 79.4924],
  Salem: [11.6643, 78.146],
};

const districtOptions = Object.keys(districtCoords);

/* ── Haversine (for client-side nearest-district fallback) ── */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestDistrict(lat, lng) {
  let best = null,
    bestDist = Infinity;
  for (const [name, [dlat, dlng]] of Object.entries(districtCoords)) {
    const d = haversine(lat, lng, dlat, dlng);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}

function getRouteColor(score) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}
function getRouteEmoji(score) {
  if (score >= 70) return "🟢";
  if (score >= 40) return "🟠";
  return "🔴";
}
function getRouteLabel(score) {
  if (score >= 70) return "Safest";
  if (score >= 40) return "Medium";
  return "Danger";
}

export default function RoutePage() {
  const navigate = useNavigate();
  const [detectedDistrict, setDetectedDistrict] = useState(null);
  const [locating, setLocating] = useState(true);
  const [end, setEnd] = useState("Bengaluru City");
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  /* ── Auto-detect current location → nearest district ── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setDetectedDistrict("Chennai");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = nearestDistrict(pos.coords.latitude, pos.coords.longitude);
        setDetectedDistrict(d);
        setLocating(false);
      },
      () => {
        setDetectedDistrict("Chennai");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  /* ── Init risk data ── */
  useEffect(() => {
    const initRisk = async () => {
      try {
        await fetch("/api/init-risk");
      } catch {
        // ignore
      } finally {
        setInitializing(false);
      }
    };
    initRisk();
  }, []);

  const getSafeRoute = async () => {
    if (!detectedDistrict) return;
    try {
      setError("");
      setLoading(true);
      const res = await fetch("/api/safe-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: detectedDistrict, to: end }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch safe route");
      }
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (e) {
      setRoutes([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openMapPage = () => {
    if (routes.length === 0) return;
    navigate("/mappage", { state: { routes } });
  };

  return (
    <div className="route-page">
      <div className="route-card">
        <h2 className="route-title">🛡️ Safe Route Finder</h2>
        <p className="route-subtitle">
          Find the safest route from your current location using crime &amp;
          police coverage data.
        </p>

        {/* ── Current Location (auto-detected) ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            marginBottom: "16px",
            borderRadius: "12px",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            📍
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Your Location
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#22c55e" }}>
              {locating
                ? "Detecting location..."
                : `${detectedDistrict} (GPS)`}
            </div>
          </div>
        </div>

        {/* ── Destination (To) only ── */}
        <div className="route-inputs">
          <div className="route-input-group" style={{ flex: "1 1 100%" }}>
            <label>🏁 Destination</label>
            <select value={end} onChange={(e) => setEnd(e.target.value)}>
              {districtOptions
                .filter((d) => d !== detectedDistrict)
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          className="route-button"
          onClick={getSafeRoute}
          disabled={loading || initializing || locating}
        >
          {locating
            ? "📍 Detecting location..."
            : initializing
              ? "Initializing safety data..."
              : loading
                ? "Finding safest routes..."
                : "🛡️ Find Safe Routes"}
        </button>

        {error && <p className="route-error">{error}</p>}

        {routes.length > 0 && (
          <>
            <div className="route-result">
              <h3>Recommended Routes</h3>
              <ul className="route-list" style={{ listStyle: "none", paddingLeft: 0 }}>
                {routes.map((r, idx) => {
                  const color = getRouteColor(r.safetyScore);
                  const emoji = getRouteEmoji(r.safetyScore);
                  const label = getRouteLabel(r.safetyScore);
                  return (
                    <li
                      key={idx}
                      style={{
                        padding: "12px 14px",
                        marginBottom: "8px",
                        borderRadius: "10px",
                        border: `1.5px solid ${color}40`,
                        background: `${color}08`,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: color,
                          marginBottom: "4px",
                        }}
                      >
                        {emoji} {label} Route (Score: {r.safetyScore}/100)
                      </div>
                      <div style={{ fontSize: "13px", color: "#374151" }}>
                        {r.path.join(" → ")}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        📏 {Math.round(r.km)} km · ⏱️ {r.estimatedMinutes} min
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="route-note">
                Higher score = safer route (based on crime data, police coverage
                and time of day).
              </p>
            </div>

            <button
              className="route-button"
              style={{ marginTop: 8 }}
              onClick={openMapPage}
            >
              🗺️ View Routes on Map
            </button>
          </>
        )}
      </div>
    </div>
  );
}