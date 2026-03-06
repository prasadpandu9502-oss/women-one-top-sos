import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Fix Leaflet icons ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── Big red live pin (like Google Maps) ── */
const livePin = L.divIcon({
    html: `
    <div style="display:flex;flex-direction:column;align-items:center">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 14 20 32 20 32s20-18 20-32C40 8.95 31.05 0 20 0z" fill="#ef4444">
          <animate attributeName="fill" values="#ef4444;#dc2626;#ef4444" dur="2s" repeatCount="indefinite"/>
        </path>
        <circle cx="20" cy="18" r="7" fill="#fff"/>
      </svg>
      <div style="
        margin-top:2px; background:rgba(0,0,0,0.85); color:#fff;
        padding:4px 12px; border-radius:12px;
        font-size:11px; font-weight:700; white-space:nowrap;
        letter-spacing:0.5px;
      ">📡 LIVE</div>
    </div>
  `,
    className: "", iconSize: [40, 70], iconAnchor: [20, 52],
});

/* ── Auto-follow position ── */
function AutoFollow({ pos }) {
    const map = useMap();
    useEffect(() => {
        if (pos) map.setView(pos, map.getZoom(), { animate: true });
    }, [pos, map]);
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 300);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}

export default function LiveTrackingPage() {
    const navigate = useNavigate();
    const email = localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "User";

    const [position, setPosition] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [sharing, setSharing] = useState(false);
    const [lastShared, setLastShared] = useState(null);
    const [shareCount, setShareCount] = useState(0);
    const watchRef = useRef(null);
    const autoShareRef = useRef(null);

    // Fetch trusted contacts
    useEffect(() => {
        if (!email) return;
        fetch(`/api/trusted-contacts?email=${encodeURIComponent(email)}`)
            .then(r => r.json())
            .then(d => setContacts(d.contacts || []))
            .catch(() => { });
    }, [email]);

    // Start live GPS watch
    useEffect(() => {
        if (!navigator.geolocation) {
            setPosition([13.0827, 80.2707]); // fallback
            return;
        }
        watchRef.current = navigator.geolocation.watchPosition(
            (s) => setPosition([s.coords.latitude, s.coords.longitude]),
            () => setPosition([13.0827, 80.2707]),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
        );
        return () => {
            if (watchRef.current !== null)
                navigator.geolocation.clearWatch(watchRef.current);
        };
    }, []);

    // ── AUTO SHARE every 10 seconds ──
    useEffect(() => {
        if (!position || !email || contacts.length === 0) return;

        const shareNow = async () => {
            try {
                setSharing(true);
                await fetch("/api/share-location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, lat: position[0], lng: position[1] }),
                });
                setLastShared(new Date());
                setShareCount(prev => prev + 1);
            } catch (e) {
                console.warn("Share failed:", e);
            } finally {
                setSharing(false);
            }
        };

        // Share immediately on first load
        if (shareCount === 0) shareNow();

        // Then auto-share every 10 seconds
        autoShareRef.current = setInterval(shareNow, 10000);
        return () => clearInterval(autoShareRef.current);
    }, [position, email, contacts.length]); // eslint-disable-line

    // Format time
    const timeStr = lastShared
        ? lastShared.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : null;

    if (!position) {
        return (
            <div style={{
                minHeight: "100vh", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "#1a1a2e", color: "#fff", gap: 18,
            }}>
                <div style={{
                    width: 54, height: 54,
                    border: "4px solid rgba(239,68,68,0.3)",
                    borderTop: "4px solid #ef4444",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                    Starting live tracking…
                </span>
            </div>
        );
    }

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
            <style>{`
        .leaflet-container { width:100%!important; height:100%!important; z-index:1; }
        @keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(239,68,68,0.6)} 70%{box-shadow:0 0 0 12px rgba(239,68,68,0)} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

            {/* Dark map */}
            <MapContainer center={position} zoom={17} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer
                    attribution="&copy; OpenStreetMap &copy; CartoDB"
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapResizer />
                <AutoFollow pos={position} />
                <Marker position={position} icon={livePin} />
            </MapContainer>

            {/* Back button */}
            <button onClick={() => {
                clearInterval(autoShareRef.current);
                navigate(-1);
            }} style={{
                position: "absolute", top: 16, left: 16, zIndex: 1000,
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", background: "rgba(15,12,41,0.9)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 50, cursor: "pointer", fontSize: 13, fontWeight: 600,
                backdropFilter: "blur(10px)",
            }}>← Back</button>

            {/* LIVE badge top-center */}
            <div style={{
                position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
                zIndex: 1000, display: "flex", alignItems: "center", gap: 8,
                background: "rgba(15,12,41,0.94)", backdropFilter: "blur(16px)",
                padding: "10px 20px", borderRadius: 50,
                border: "1.5px solid rgba(239,68,68,0.5)",
            }}>
                <div style={{
                    width: 10, height: 10, borderRadius: "50%", background: "#ef4444",
                    animation: "livePulse 1.5s infinite",
                }} />
                <span style={{ color: "#ef4444", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
                    ● LIVE TRACKING
                </span>
            </div>

            {/* Bottom info panel */}
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
                background: "rgba(10,10,20,0.95)", backdropFilter: "blur(20px)",
                borderRadius: "20px 20px 0 0", padding: "20px 20px 24px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
                {/* User info row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, flexShrink: 0,
                    }}>�</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
                            {userName}'s Live Location
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                            {position[0].toFixed(5)}°N, {position[1].toFixed(5)}°E
                        </div>
                    </div>
                    {timeStr && (
                        <div style={{
                            background: "rgba(239,68,68,0.15)", padding: "6px 12px",
                            borderRadius: 10, color: "#ef4444", fontSize: 11, fontWeight: 700,
                        }}>
                            {timeStr}
                        </div>
                    )}
                </div>

                {/* Auto-sharing status + WhatsApp */}
                {contacts.length > 0 ? (
                    <div style={{
                        background: "rgba(34,197,94,0.1)", borderRadius: 14,
                        padding: "12px 16px", border: "1px solid rgba(34,197,94,0.2)",
                        marginBottom: 12, animation: "fadeSlide 0.4s ease",
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                        }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: sharing ? "#f59e0b" : "#22c55e",
                                boxShadow: sharing ? "0 0 6px #f59e0b" : "0 0 6px #22c55e",
                            }} />
                            <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>
                                {sharing ? "⏳ Updating..." : "✅ Auto-sharing active"}
                            </span>
                            {shareCount > 0 && (
                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginLeft: "auto" }}>
                                    Updated {shareCount}x · {timeStr}
                                </span>
                            )}
                        </div>

                        {/* WhatsApp send to each contact */}
                        <div style={{ marginTop: 8 }}>
                            {contacts.map((c, i) => {
                                const phone = (c.phone || "").replace(/[^0-9+]/g, "");
                                const waPhone = phone.startsWith("+") ? phone.slice(1) : (phone.startsWith("0") ? "91" + phone.slice(1) : phone.length === 10 ? "91" + phone : phone);
                                const msg = encodeURIComponent(
                                    `🚨 SOS ALERT from ${userName}!\n\n📍 My live location:\nhttps://www.google.com/maps?q=${position[0]},${position[1]}\n\n⏰ ${new Date().toLocaleString("en-IN")}\n\n🆘 I may need help. Please check on me!`
                                );
                                return (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "8px 0",
                                        borderBottom: i < contacts.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                    }}>
                                        <div style={{
                                            width: 34, height: 34, borderRadius: "50%",
                                            background: "rgba(255,255,255,0.08)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 16, flexShrink: 0,
                                        }}>👤</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>📱 {c.phone}</div>
                                        </div>
                                        <a
                                            href={`https://wa.me/${waPhone}?text=${msg}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{
                                                display: "flex", alignItems: "center", gap: 4,
                                                padding: "6px 12px", borderRadius: 20,
                                                background: "#25D366", color: "#fff",
                                                fontSize: 11, fontWeight: 700, textDecoration: "none",
                                                boxShadow: "0 2px 8px rgba(37,211,102,0.3)",
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.614-1.46A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.09 0-4.037-.656-5.638-1.773l-.405-.26-2.735.866.721-2.632-.284-.427A9.72 9.72 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75S21.75 6.615 21.75 12s-4.365 9.75-9.75 9.75z" />
                                            </svg>
                                            Send
                                        </a>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Send to ALL via WhatsApp */}
                        <button
                            onClick={() => {
                                contacts.forEach((c, i) => {
                                    const phone = (c.phone || "").replace(/[^0-9+]/g, "");
                                    const waPhone = phone.startsWith("+") ? phone.slice(1) : (phone.startsWith("0") ? "91" + phone.slice(1) : phone.length === 10 ? "91" + phone : phone);
                                    const msg = encodeURIComponent(
                                        `🚨 SOS ALERT from ${userName}!\n\n📍 My live location:\nhttps://www.google.com/maps?q=${position[0]},${position[1]}\n\n⏰ ${new Date().toLocaleString("en-IN")}\n\n🆘 I may need help. Please check on me!`
                                    );
                                    setTimeout(() => {
                                        window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
                                    }, i * 800);
                                });
                            }}
                            style={{
                                width: "100%", marginTop: 10, padding: "12px",
                                borderRadius: 12, border: "none",
                                background: "#25D366", color: "#fff",
                                fontSize: 14, fontWeight: 700, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.614-1.46A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.09 0-4.037-.656-5.638-1.773l-.405-.26-2.735.866.721-2.632-.284-.427A9.72 9.72 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75S21.75 6.615 21.75 12s-4.365 9.75-9.75 9.75z" />
                            </svg>
                            📲 Send to All via WhatsApp
                        </button>
                    </div>
                ) : (
                    <button onClick={() => navigate("/trustedcontacts")} style={{
                        width: "100%", padding: "14px", borderRadius: 14,
                        border: "2px dashed rgba(239,68,68,0.4)",
                        background: "rgba(239,68,68,0.08)", color: "#ef4444",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                        ⚠️ Add Trusted Contacts to Enable Auto-Share
                    </button>
                )}
            </div>
        </div>
    );
}
