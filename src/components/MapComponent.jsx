import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Fix missing default Leaflet marker icons ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── Pulsing location marker ── */
const locationIcon = L.divIcon({
  html: `
    <div style="position:relative; width:56px; height:56px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="rgba(233, 69, 96, 0.12)" stroke="none">
          <animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="28" cy="28" r="11" fill="#e94560" stroke="#fff" stroke-width="3"/>
      </svg>
      <div style="
        position:absolute;
        bottom:-24px;
        left:50%;
        transform:translateX(-50%);
        background:rgba(0,0,0,0.8);
        color:#fff;
        padding:3px 12px;
        border-radius:10px;
        font-size:12px;
        font-weight:700;
        white-space:nowrap;
        letter-spacing:0.5px;
        backdrop-filter:blur(6px);
      ">📍 You are here</div>
    </div>
  `,
  className: "",
  iconSize: [56, 56],
  iconAnchor: [28, 28],
  popupAnchor: [0, -30],
});

/* ── Force map to resize properly after render ── */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Leaflet sometimes renders blank tiles if container resizes after init
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

const MapComponent = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      // fallback to a default location (Chennai)
      setPosition([13.0827, 80.2707]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (s) => {
        setPosition([s.coords.latitude, s.coords.longitude]);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Could not get location. Showing default (Chennai).");
        // fallback
        setPosition([13.0827, 80.2707]);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  if (!position)
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        color: "#fff", gap: "18px",
      }}>
        <div style={{
          width: 54, height: 54,
          border: "4px solid rgba(233,69,96,0.3)",
          borderTop: "4px solid #e94560",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "1.15rem", fontWeight: 500, letterSpacing: 1 }}>
          Fetching your location…
        </span>
      </div>
    );

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Inline style to ensure leaflet loads properly */}
      <style>{`
        .leaflet-container { width: 100% !important; height: 100% !important; z-index: 1; }
        .leaflet-tile-pane { z-index: 2; }
        .leaflet-overlay-pane { z-index: 3; }
        .leaflet-marker-pane { z-index: 4; }
      `}</style>

      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        whenReady={(map) => {
          // Force invalidateSize after map is ready
          setTimeout(() => map.target.invalidateSize(), 200);
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        <FlyToPosition position={position} />
        <Marker position={position} icon={locationIcon} />
      </MapContainer>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, background: "rgba(239,68,68,0.9)", backdropFilter: "blur(10px)",
          color: "#fff", padding: "8px 20px", borderRadius: 12,
          fontSize: 12, fontWeight: 600, maxWidth: 300, textAlign: "center",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Set Destination Button ── */}
      <button
        onClick={() => navigate("/destination")}
        style={{
          position: "absolute", bottom: "36px", left: "50%",
          transform: "translateX(-50%)", zIndex: 1000,
          display: "flex", alignItems: "center", gap: "10px",
          padding: "16px 40px",
          background: "linear-gradient(135deg, #e94560, #c23152)",
          color: "#fff", border: "none", borderRadius: "60px",
          cursor: "pointer", fontSize: "16px", fontWeight: 700,
          letterSpacing: "1px", textTransform: "uppercase",
          boxShadow: "0 8px 32px rgba(233, 69, 96, 0.5)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateX(-50%) translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(233,69,96,0.65)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateX(-50%)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(233,69,96,0.5)";
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Set Destination
      </button>

      {/* ── Home Button ── */}
      <button
        onClick={() => navigate("/homepage")}
        style={{
          position: "absolute", top: "16px", left: "16px", zIndex: 1000,
          display: "flex", alignItems: "center", gap: "6px",
          padding: "10px 18px",
          background: "rgba(15,12,41,0.85)", color: "#fff",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "50px", cursor: "pointer",
          fontSize: "13px", fontWeight: 600,
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(233,69,96,0.85)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(15,12,41,0.85)"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Home
      </button>
    </div>
  );
};

export default MapComponent;