import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── District coordinates (duplicated for frontend use) ── */
const districtCoords = {
    "Chennai": [13.0827, 80.2707], "Kanchipuram": [12.837, 79.7], "Tiruvallur": [13.1431, 79.9094],
    "Chengalpattu": [12.6819, 79.9888], "Vellore": [12.9165, 79.1325], "Tiruvannamalai": [12.2253, 79.0747],
    "Villupuram": [11.9395, 79.4924], "Cuddalore": [11.7480, 79.7714], "Salem": [11.6643, 78.146],
    "Namakkal": [11.2189, 78.1674], "Erode": [11.3410, 77.7172], "Coimbatore": [11.0168, 76.9558],
    "Tirupur": [11.1085, 77.3411], "Nilgiris": [11.4916, 76.7337], "Krishnagiri": [12.5186, 78.2137],
    "Dharmapuri": [12.1211, 78.1582], "Tiruchirappalli": [10.7905, 78.7047], "Thanjavur": [10.787, 79.1378],
    "Nagapattinam": [10.7672, 79.8449], "Pudukkottai": [10.3833, 78.8001], "Dindigul": [10.3673, 77.9803],
    "Madurai": [9.9252, 78.1198], "Theni": [10.0104, 77.4768], "Sivagangai": [9.8433, 78.4809],
    "Virudhunagar": [9.5851, 77.9526], "Ramanathapuram": [9.3762, 78.8308], "Thoothukudi": [8.7642, 78.1348],
    "Tirunelveli": [8.7139, 77.7567], "Kanyakumari": [8.0883, 77.5385],
    "Bengaluru City": [12.9716, 77.5946], "Bengaluru Rural": [13.1263, 77.3920], "Ramanagara": [12.7159, 77.2814],
    "Tumakuru": [13.3379, 77.1173], "Kolar": [13.1362, 78.1292], "Chikkaballapura": [13.4355, 77.7315],
    "Mandya": [12.5222, 76.8952], "Mysuru": [12.2958, 76.6394], "Chamarajanagar": [11.9236, 76.9398],
    "Hassan": [13.0072, 76.0996], "Kodagu": [12.4244, 75.7382], "Chikkamagaluru": [13.3161, 75.7720],
    "Shimoga": [13.9299, 75.5681], "Davangere": [14.4644, 75.9218], "Chitradurga": [14.2226, 76.3980],
    "Bellary": [15.1394, 76.9214], "Haveri": [14.7951, 75.3991], "Dharwad": [15.4589, 75.0078],
    "Belagavi": [15.8497, 74.4977], "Gadag": [15.4319, 75.6348], "Bagalkot": [16.1691, 75.6968],
    "Koppal": [15.3547, 76.1548], "Raichur": [16.2076, 77.3463], "Yadgir": [16.7700, 77.1330],
    "Kalaburagi": [17.3297, 76.8343], "Bidar": [17.9104, 77.5199], "Udupi": [13.3409, 74.7421],
    "Dakshina Kannada": [12.8438, 75.2479],
};

/* ── Marker icons ── */
const startIcon = L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
    <div style="width:20px;height:20px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 8px rgba(34,197,94,0.5)"></div>
    <div style="margin-top:4px;background:rgba(0,0,0,0.8);color:#22c55e;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap">START</div>
  </div>`,
    className: "", iconSize: [60, 40], iconAnchor: [30, 12],
});

const endIcon = L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 11.2 16 26 16 26s16-14.8 16-26C32 7.16 24.84 0 16 0z" fill="#ef4444"/>
      <circle cx="16" cy="14" r="6" fill="#fff"/>
    </svg>
    <div style="margin-top:2px;background:rgba(0,0,0,0.8);color:#ef4444;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap">DESTINATION</div>
  </div>`,
    className: "", iconSize: [60, 54], iconAnchor: [30, 42],
});

function makeDistrictIcon(name) {
    return L.divIcon({
        html: `<div style="background:rgba(30,30,50,0.88);color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:600;white-space:nowrap;border:1.5px solid rgba(255,255,255,0.25);backdrop-filter:blur(4px)">${name}</div>`,
        className: "", iconSize: [80, 24], iconAnchor: [40, 12],
    });
}

/* ── OSRM road-following geometry ── */
async function fetchOSRMRoute(waypoints) {
    const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
    try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes?.[0]) return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    } catch (e) { console.warn("OSRM failed:", e); }
    return null;
}

/* ── Color helpers (RANK-BASED: best route=green, middle=orange, worst=red) ── */
const ROUTE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];
const ROUTE_LABELS = ["Safest Route", "Moderate Route", "Risky Route"];
const ROUTE_EMOJIS = ["🟢", "🟠", "🔴"];
function getColor(idx) { return ROUTE_COLORS[idx] || "#ef4444"; }
function getLabel(idx) { return ROUTE_LABELS[idx] || "Route"; }
function getEmoji(idx) { return ROUTE_EMOJIS[idx] || "🔴"; }

/* ── Fit Bounds ── */
function FitBounds({ points }) {
    const map = useMap();
    useEffect(() => {
        if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 12 });
    }, [points, map]);
    return null;
}

/* ══════════════ MAIN COMPONENT ══════════════ */
export default function RouteMapPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { routes = [], from = "", to = "" } = location.state || {};

    const [osrmPaths, setOsrmPaths] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [showSosPopup, setShowSosPopup] = useState(false);
    const [sosStatus, setSosStatus] = useState(""); // "sending" | "sent" | "error"
    const [sosResult, setSosResult] = useState(null);

    /* ── Fetch OSRM road geometry for each route ── */
    useEffect(() => {
        if (!routes.length) return;
        Promise.all(routes.map(async (r) => {
            const wp = r.path.map(n => districtCoords[n]).filter(Boolean);
            if (wp.length < 2) return wp;
            return (await fetchOSRMRoute(wp)) || wp;
        })).then(setOsrmPaths);
    }, [routes]);

    if (!routes.length) {
        return (
            <div style={{
                minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", color: "#fff", flexDirection: "column", gap: 16
            }}>
                <span style={{ fontSize: "48px" }}>🗺️</span>
                <p>No route data. Please go back and search again.</p>
                <button onClick={() => navigate("/destination")} style={{
                    padding: "10px 24px", borderRadius: 12,
                    background: "linear-gradient(135deg,#e94560,#c23152)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600
                }}>
                    Go to Destination
                </button>
            </div>
        );
    }

    /* Collect all points for bounds */
    const allPts = [];
    routes.forEach(r => r.path.forEach(n => { const c = districtCoords[n]; if (c) allPts.push(c); }));
    osrmPaths.forEach(p => p?.forEach(c => allPts.push(c)));

    const startCoord = districtCoords[from] || districtCoords[routes[0]?.path[0]];
    const endCoord = districtCoords[to] || districtCoords[routes[0]?.path[routes[0].path.length - 1]];

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <style>{`
        @keyframes sosPulse { 0%{box-shadow:0 0 0 0 rgba(185,28,28,0.7)} 70%{box-shadow:0 0 0 22px rgba(185,28,28,0)} 100%{box-shadow:0 0 0 0 rgba(185,28,28,0)} }
        @keyframes sosBounce { 0%,100%{transform:translateX(50%) scale(1)} 50%{transform:translateX(50%) scale(1.06)} }
        @keyframes sosPopIn { from{opacity:0;transform:translateX(50%) translateY(20px) scale(0.8)} to{opacity:1;transform:translateX(50%) translateY(0) scale(1)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>

            <MapContainer center={startCoord || [12.5, 78]} zoom={8} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {allPts.length > 1 && <FitBounds points={allPts} />}

                {/* Start marker */}
                {startCoord && <Marker position={startCoord} icon={startIcon} />}
                {/* End marker */}
                {endCoord && <Marker position={endCoord} icon={endIcon} />}

                {/* Intermediate district labels */}
                {(() => {
                    const shown = new Set([from, to]);
                    return routes.flatMap(r => r.path.slice(1, -1).map(name => {
                        if (shown.has(name)) return null;
                        shown.add(name);
                        const c = districtCoords[name];
                        return c ? <Marker key={`d-${name}`} position={c} icon={makeDistrictIcon(name)} /> : null;
                    }));
                })()}

                {/* Route polylines — only show selected route, hide others */}
                {routes.map((r, idx) => {
                    const coords = osrmPaths[idx] || r.path.map(n => districtCoords[n]).filter(Boolean);
                    if (coords.length < 2) return null;
                    const color = getColor(idx);
                    const isSel = selectedRoute === idx;
                    const isHidden = selectedRoute !== null && !isSel;
                    if (isHidden) return null; // completely remove non-selected routes
                    return (
                        <Polyline key={idx} positions={coords}
                            color={color}
                            weight={isSel ? 8 : 6}
                            opacity={1}
                            dashArray={idx === 2 ? "12 8" : undefined}
                            eventHandlers={{ click: () => setSelectedRoute(isSel ? null : idx) }}
                        >
                            <Popup>
                                <div style={{ fontFamily: "system-ui", fontSize: 13 }}>
                                    <strong style={{ color }}>{getLabel(idx)}</strong><br />
                                    Safety: {r.safetyScore}/100<br />
                                    Distance: {Math.round(r.km)} km<br />
                                    Time: ~{r.estimatedMinutes} min
                                </div>
                            </Popup>
                        </Polyline>
                    );
                })}
            </MapContainer>

            {/* ── Route Info Header ── */}
            <div style={{
                position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
                background: "rgba(15,12,41,0.9)", backdropFilter: "blur(16px)", borderRadius: 16,
                padding: "10px 20px", display: "flex", alignItems: "center", gap: 10,
                border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}>
                <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 13 }}>{from}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>→</span>
                <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 13 }}>{to}</span>
            </div>

            {/* ── Back button ── */}
            <button onClick={() => navigate("/destination")} style={{
                position: "absolute", top: 16, left: 16, zIndex: 1000,
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px", background: "rgba(15,12,41,0.85)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 50, cursor: "pointer", fontSize: 13, fontWeight: 600,
                backdropFilter: "blur(10px)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}>
                ← Back
            </button>

            {/* ── Route Legend ── */}
            <div style={{
                position: "absolute", bottom: 160, left: 16, zIndex: 1000,
                background: "rgba(15,12,41,0.92)", backdropFilter: "blur(16px)",
                borderRadius: 16, padding: "14px 16px", maxWidth: 260,
                border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                    🛡️ Routes
                </div>
                {routes.map((r, idx) => {
                    const color = getColor(idx);
                    const isSel = selectedRoute === idx;
                    return (
                        <div key={idx} onClick={() => setSelectedRoute(isSel ? null : idx)} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 10px", marginBottom: idx < routes.length - 1 ? 4 : 0,
                            borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                            background: isSel ? `${color}22` : "rgba(255,255,255,0.04)",
                            border: isSel ? `1.5px solid ${color}` : "1.5px solid transparent",
                        }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}80`, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{getEmoji(idx)} {getLabel(idx)}</div>
                                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
                                    Score: {r.safetyScore}/100 · {Math.round(r.km)}km · {r.estimatedMinutes}min
                                </div>
                            </div>
                        </div>
                    );
                })}
                {/* Show All button when a route is selected */}
                {selectedRoute !== null && (
                    <div
                        onClick={() => setSelectedRoute(null)}
                        style={{
                            marginTop: 6, padding: "7px 10px", borderRadius: 10,
                            cursor: "pointer", textAlign: "center",
                            background: "rgba(255,255,255,0.08)",
                            border: "1.5px solid rgba(255,255,255,0.2)",
                            color: "#fff", fontSize: 11, fontWeight: 600,
                            transition: "all 0.2s",
                        }}
                    >
                        👁️ Show All Routes
                    </div>
                )}
            </div>

            {/* ── SOS BUTTON (BIG + PULSING) ── */}
            <button
                id="sos-button"
                onClick={async () => {
                    setShowSosPopup(true);
                    setSosStatus("sending");
                    setSosResult(null);

                    const email = localStorage.getItem("userEmail") || "";
                    if (!email) { setSosStatus("error"); setSosResult({ message: "Not logged in" }); return; }

                    // Get GPS location
                    let lat = null, lng = null;
                    try {
                        const pos = await new Promise((resolve, reject) =>
                            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
                        );
                        lat = pos.coords.latitude;
                        lng = pos.coords.longitude;
                    } catch (e) { /* location unavailable */ }

                    // Call backend SOS endpoint — this does the REAL SMS sending
                    try {
                        const res = await fetch("/api/sos-alert", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, lat, lng }),
                        });
                        const data = await res.json();
                        setSosResult(data);

                        // Check if SMS was actually delivered
                        if (data.smsDelivered) {
                            setSosStatus("sent");
                        } else {
                            setSosStatus("error");
                        }

                        // Also open WhatsApp for each contact as backup
                        if (data.contactsNotified && data.contactsNotified.length > 0) {
                            const locLink = data.locationLink || "Location unavailable";
                            const waMsg = encodeURIComponent(
                                `🚨 EMERGENCY SOS!\n\nI AM IN DANGER! Please track my location and help me!\n\n📍 Location: ${locLink}\n🕐 Time: ${data.timestamp}\n\n⚠️ Please call or reach out immediately!\n📞 If no response, call police: 112`
                            );
                            data.contactsNotified.forEach((c, i) => {
                                const phone = (c.phone || "").replace(/[^0-9]/g, "");
                                const waPhone = phone.length === 10 ? "91" + phone : phone;
                                setTimeout(() => {
                                    window.open(`https://wa.me/${waPhone}?text=${waMsg}`, "_blank");
                                }, (i + 1) * 1000);
                            });
                        }
                    } catch (e) {
                        setSosStatus("error");
                        setSosResult({ message: e.message });
                    }
                }}
                style={{
                    position: "absolute", bottom: 32, right: "50%",
                    transform: "translateX(50%)", zIndex: 1000,
                    width: 120, height: 120, borderRadius: "50%",
                    border: "5px solid rgba(254,202,202,0.8)",
                    background: "radial-gradient(circle at 35% 35%, #fca5a5, #dc2626, #991b1b)",
                    color: "#fff", fontWeight: 800, letterSpacing: 2, fontSize: 24,
                    textTransform: "uppercase", cursor: "pointer",
                    animation: "sosPulse 1.8s infinite, sosBounce 2s ease-in-out infinite",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 2, textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
            >
                <span style={{ fontSize: 32, lineHeight: 1 }}>🆘</span>
                <span>SOS</span>
            </button>

            {/* ── SOS Popup ── */}
            {showSosPopup && (
                <div style={{
                    position: "absolute", inset: 0, zIndex: 2000,
                    background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "fadeIn 0.3s ease",
                }} onClick={() => setShowSosPopup(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "linear-gradient(135deg,#1a1a2e,#16213e)",
                        borderRadius: 24, padding: "32px 28px", maxWidth: 400, width: "90%",
                        border: "2px solid rgba(239,68,68,0.4)", boxShadow: "0 16px 64px rgba(239,68,68,0.3)",
                        animation: "sosPopIn 0.4s ease", maxHeight: "85vh", overflowY: "auto",
                    }}>
                        {/* Header */}
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{ fontSize: 48, marginBottom: 8 }}>
                                {sosStatus === "sending" ? "⏳" : sosStatus === "sent" ? "✅" : "⚠️"}
                            </div>
                            <h2 style={{
                                color: sosStatus === "sent" ? "#22c55e" : "#ef4444",
                                fontSize: 22, fontWeight: 800, margin: "0 0 6px", letterSpacing: 1
                            }}>
                                {sosStatus === "sending" ? "SENDING SOS..." : sosStatus === "sent" ? "SMS DELIVERED!" : "SOS ALERT"}
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0 }}>
                                {sosStatus === "sending"
                                    ? "Getting your location & sending SMS to contacts..."
                                    : sosResult?.message || "Something went wrong"}
                            </p>
                        </div>

                        {/* SMS Delivery Status — GREEN if delivered, RED if failed */}
                        {sosStatus === "sent" && sosResult?.smsDelivered && (
                            <div style={{
                                background: "rgba(34,197,94,0.12)", borderRadius: 14, padding: "14px 16px",
                                border: "1px solid rgba(34,197,94,0.3)", marginBottom: 14,
                            }}>
                                <p style={{ color: "#22c55e", fontSize: 12, margin: "0 0 4px", fontWeight: 700 }}>
                                    ✅ SMS DELIVERED to {sosResult.smsSent} contact(s)
                                </p>
                                <p style={{ color: "rgba(34,197,94,0.7)", fontSize: 11, margin: 0 }}>
                                    Messages sent via Fast2SMS. Your contacts received the SMS on their phone.
                                </p>
                            </div>
                        )}

                        {/* SMS FAILED — Show exact error */}
                        {sosStatus === "error" && sosResult?.smsError && (
                            <div style={{
                                background: "rgba(239,68,68,0.12)", borderRadius: 14, padding: "14px 16px",
                                border: "1px solid rgba(239,68,68,0.3)", marginBottom: 14,
                            }}>
                                <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 4px", fontWeight: 700 }}>
                                    ❌ SMS NOT Delivered
                                </p>
                                <p style={{ color: "rgba(239,68,68,0.8)", fontSize: 11, margin: "0 0 6px" }}>
                                    Fast2SMS Error: {sosResult.smsError}
                                </p>
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>
                                    💡 To fix: Add ₹100 to your Fast2SMS wallet at fast2sms.com → Wallet → Add Money
                                </p>
                            </div>
                        )}

                        {/* SOS Message that was attempted */}
                        {(sosStatus === "sent" || sosStatus === "error") && sosResult?.sosMessage && (
                            <div style={{
                                background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "14px 16px",
                                border: "1px solid rgba(255,255,255,0.1)", marginBottom: 14,
                            }}>
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase" }}>
                                    📩 SOS Message:
                                </p>
                                <p style={{ color: "#fff", fontSize: 12, margin: 0, lineHeight: 1.5, opacity: 0.8 }}>
                                    {sosResult.sosMessage}
                                </p>
                            </div>
                        )}

                        {/* Contacts list */}
                        {(sosStatus === "sent" || sosStatus === "error") && sosResult?.contactsNotified?.length > 0 && (
                            <div style={{
                                background: "rgba(96,165,250,0.08)", borderRadius: 14, padding: "14px 16px",
                                border: "1px solid rgba(96,165,250,0.2)", marginBottom: 14,
                            }}>
                                <p style={{ color: "#60a5fa", fontSize: 12, margin: "0 0 8px", fontWeight: 700 }}>
                                    📱 Trusted Contacts ({sosResult.contactsNotified.length}):
                                </p>
                                {sosResult.contactsNotified.map((c, i) => (
                                    <div key={i} style={{
                                        color: "#fff", fontSize: 12, marginTop: 5,
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: "rgba(255,255,255,0.05)", padding: "7px 10px", borderRadius: 10,
                                    }}>
                                        <span>{sosResult.smsDelivered ? "✅" : "💬"}</span>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                                                {c.phone} • {sosResult.smsDelivered ? "SMS ✓" : "WhatsApp only"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Location Link */}
                        {sosResult?.locationLink && (
                            <div style={{
                                color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 14,
                                padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10,
                            }}>
                                📍 {sosResult.locationLink}
                            </div>
                        )}

                        {/* Loading spinner */}
                        {sosStatus === "sending" && (
                            <div style={{ textAlign: "center", padding: "16px 0" }}>
                                <div style={{
                                    width: 36, height: 36, margin: "0 auto",
                                    border: "4px solid rgba(239,68,68,0.2)",
                                    borderTop: "4px solid #ef4444",
                                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                                }} />
                                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => { window.location.href = "tel:112"; }} style={{
                                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                            }}>📞 Call 112</button>
                            <button onClick={() => setShowSosPopup(false)} style={{
                                flex: 1, padding: "12px", borderRadius: 12,
                                border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
                                color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                            }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

