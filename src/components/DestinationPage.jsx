import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DestinationPage() {
    const navigate = useNavigate();

    const [state, setState] = useState("");
    const [districts, setDistricts] = useState([]);
    const [startDist, setStartDist] = useState("");
    const [endDist, setEndDist] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingDistricts, setFetchingDistricts] = useState(false);

    /* ── Fetch districts from backend when state is selected ── */
    useEffect(() => {
        if (!state) { setDistricts([]); return; }
        const fetchDistricts = async () => {
            setFetchingDistricts(true);
            try {
                const res = await fetch(`/api/districts?state=${state}`);
                const data = await res.json();
                setDistricts(data.districts || []);
                setStartDist("");
                setEndDist("");
            } catch {
                setDistricts([]);
            } finally {
                setFetchingDistricts(false);
            }
        };
        fetchDistricts();
    }, [state]);

    const handleFindRoute = async () => {
        if (!startDist || !endDist) return alert("Please select both starting and ending locations");
        if (startDist === endDist) return alert("Start and end cannot be the same");
        setLoading(true);
        try {
            await fetch("/api/init-risk");
            const res = await fetch("/api/safe-route", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from: startDist, to: endDist }),
            });
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
                navigate("/routemap", { state: { routes: data.routes, from: startDist, to: endDist } });
            } else {
                alert("No routes found between these locations. Try different districts.");
            }
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "20px",
            position: "relative", overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
            {/* Animated bg blobs */}
            <div style={{
                position: "absolute", top: "-80px", right: "-80px", width: "280px", height: "280px",
                borderRadius: "50%", background: "rgba(233,69,96,0.12)", filter: "blur(60px)",
                animation: "pulse 4s ease-in-out infinite",
            }} />
            <div style={{
                position: "absolute", bottom: "-60px", left: "-60px", width: "220px", height: "220px",
                borderRadius: "50%", background: "rgba(108,92,231,0.18)", filter: "blur(50px)",
                animation: "pulse 5s ease-in-out infinite",
            }} />
            <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.2);opacity:.6} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        select option { background: #1e1b3a; color: #fff; padding: 8px; }
      `}</style>

            {/* Shield icon */}
            <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #e94560, #c23152)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "20px",
                boxShadow: "0 8px 32px rgba(233,69,96,0.4)",
                animation: "float 3s ease-in-out infinite",
            }}>
                <span style={{ fontSize: "32px" }}>🛡️</span>
            </div>

            {/* Title */}
            <h1 style={{
                color: "#fff", fontSize: "26px", fontWeight: 700,
                marginBottom: "6px", textAlign: "center", letterSpacing: "1px",
            }}>
                Choose Your Destination
            </h1>
            <p style={{
                color: "rgba(255,255,255,0.55)", fontSize: "14px",
                marginBottom: "28px", textAlign: "center", maxWidth: 380,
            }}>
                Select your state and route — we'll find the safest path for you
            </p>

            {/* Main Card */}
            <div style={{
                background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)",
                borderRadius: "22px", padding: "32px 28px", width: "100%", maxWidth: 420,
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 12px 48px rgba(0,0,0,0.35)",
            }}>
                {/* ── Step 1: State Selection ── */}
                <label style={labelStyle}>🗺️ Select State</label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
                    {[
                        { val: "tamilnadu", label: "Tamil Nadu", emoji: "🏛️" },
                        { val: "karnataka", label: "Karnataka", emoji: "🏰" },
                    ].map((s) => (
                        <button
                            key={s.val}
                            onClick={() => setState(s.val)}
                            style={{
                                flex: 1,
                                padding: "14px 10px",
                                borderRadius: "14px",
                                border: state === s.val
                                    ? "2px solid #e94560"
                                    : "2px solid rgba(255,255,255,0.1)",
                                background: state === s.val
                                    ? "rgba(233,69,96,0.2)"
                                    : "rgba(255,255,255,0.05)",
                                color: "#fff",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.25s ease",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span style={{ fontSize: "24px" }}>{s.emoji}</span>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* ── Step 2: Source & Destination dropdowns ── */}
                {state && (
                    <div style={{
                        animation: "fadeIn 0.4s ease",
                    }}>
                        <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

                        {fetchingDistricts ? (
                            <div style={{
                                textAlign: "center", color: "rgba(255,255,255,0.5)",
                                fontSize: "13px", padding: "16px 0",
                            }}>
                                Loading districts...
                            </div>
                        ) : (
                            <>
                                {/* Starting Location */}
                                <label style={labelStyle}>📍 Starting Location</label>
                                <select
                                    value={startDist}
                                    onChange={(e) => setStartDist(e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="">-- Select start area --</option>
                                    {districts.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>

                                {/* Ending Location */}
                                <label style={labelStyle}>🏁 Ending Location</label>
                                <select
                                    value={endDist}
                                    onChange={(e) => setEndDist(e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="">-- Select destination --</option>
                                    {districts
                                        .filter((d) => d !== startDist)
                                        .map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                </select>
                            </>
                        )}
                    </div>
                )}

                {/* ── Find Safest Route Button ── */}
                {state && startDist && endDist && (
                    <button
                        onClick={handleFindRoute}
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "15px",
                            marginTop: "10px",
                            borderRadius: "14px",
                            border: "none",
                            background: loading
                                ? "rgba(233,69,96,0.4)"
                                : "linear-gradient(135deg, #e94560, #c23152)",
                            color: "#e37a7aff",
                            fontSize: "16px",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            cursor: loading ? "default" : "pointer",
                            boxShadow: "0 6px 28px rgba(233,69,96,0.35)",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: 18, height: 18,
                                    border: "3px solid rgba(255,255,255,0.3)",
                                    borderTop: "3px solid #fff",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite",
                                }} />
                                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                                Finding safest routes…
                            </>
                        ) : (
                            <>🛡️ Find Safest Route</>
                        )}
                    </button>
                )}

                {/* back link */}
                <div style={{ textAlign: "center", marginTop: "18px" }}>
                    <span
                        onClick={() => navigate("/map")}
                        style={{
                            color: "rgba(255,255,255,0.4)", fontSize: "13px",
                            cursor: "pointer", textDecoration: "underline",
                            transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => { e.target.style.color = "#e94560"; }}
                        onMouseLeave={(e) => { e.target.style.color = "rgba(255,255,255,0.4)"; }}
                    >
                        ← Back to Map
                    </span>
                </div>
            </div>

            {/* Tagline */}
            <p style={{
                color: "rgba(255,255,255,0.25)", fontSize: "0.65rem",
                marginTop: "28px", letterSpacing: "2px", textTransform: "uppercase",
            }}>
                Your safety is our priority
            </p>
        </div>
    );
}

/* ── Shared styles ── */
const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.6)",
    marginBottom: "6px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
};

const selectStyle = {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "18px",
    borderRadius: "12px",
    border: "1.5px solid rgba(255,255,255,0.12)",
    background: "#1e1b3a",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.2s",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
};
