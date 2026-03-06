import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import MapIcon from "@mui/icons-material/Map";
import DirectionsIcon from "@mui/icons-material/Directions";
import PeopleIcon from "@mui/icons-material/People";
import ShareLocationIcon from "@mui/icons-material/ShareLocation";

function HomePage() {
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail") || "";
  const userName = localStorage.getItem("userName") || "User";

  // SOS state
  const [showSosPopup, setShowSosPopup] = useState(false);
  const [sosStatus, setSosStatus] = useState(""); // "sending" | "sent" | "error"
  const [sosResult, setSosResult] = useState(null);

  const triggerSOS = async () => {
    setShowSosPopup(true);
    setSosStatus("sending");
    setSosResult(null);

    if (!email) {
      setSosStatus("error");
      setSosResult({ message: "Not logged in. Please login first." });
      return;
    }

    // Get GPS location
    let lat = null, lng = null;
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 8000,
        })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e) { /* location unavailable */ }

    // Call backend SOS endpoint
    try {
      const res = await fetch("/api/sos-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lat, lng }),
      });
      const data = await res.json();
      setSosResult(data);

      if (data.smsDelivered) {
        setSosStatus("sent");
      } else {
        setSosStatus("error");
      }

      // Also open WhatsApp for each contact as backup
      if (data.contactsNotified && data.contactsNotified.length > 0) {
        const locLink = data.locationLink || "Location unavailable";
        const waMsg = encodeURIComponent(
          `🚨 EMERGENCY SOS!\n\nI AM IN DANGER! Please help me immediately!\n\n📍 Location: ${locLink}\n🕐 Time: ${data.timestamp}\n\n⚠️ Please call or reach out immediately!\n📞 If no response, call police: 112`
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
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animations */}
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.2);opacity:0.6} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes sosPulse { 0%{box-shadow:0 0 0 0 rgba(239,68,68,0.7)} 70%{box-shadow:0 0 0 20px rgba(239,68,68,0)} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popIn { from{opacity:0;transform:translateY(20px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Animated bg */}
      <Box sx={{
        position: "absolute", top: "-100px", right: "-100px",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "rgba(233,69,96,0.15)", filter: "blur(60px)",
        animation: "pulse 4s ease-in-out infinite",
      }} />
      <Box sx={{
        position: "absolute", bottom: "-50px", left: "-50px",
        width: "250px", height: "250px", borderRadius: "50%",
        background: "rgba(108,92,231,0.2)", filter: "blur(50px)",
        animation: "pulse 5s ease-in-out infinite",
      }} />

      {/* Shield Logo */}
      <Box sx={{
        width: 90, height: 90, borderRadius: "50%",
        background: "linear-gradient(135deg, #e94560, #c23152)",
        display: "flex", alignItems: "center", justifyContent: "center",
        mb: 3, boxShadow: "0 8px 32px rgba(233,69,96,0.4)",
        animation: "float 3s ease-in-out infinite",
      }}>
        <ShieldIcon sx={{ fontSize: 46, color: "#fff" }} />
      </Box>

      {/* Title */}
      <Typography variant="h3" sx={{
        color: "#fff", fontWeight: 800, mb: 1,
        textAlign: "center", letterSpacing: "1.5px",
        background: "linear-gradient(135deg, #fff, #e94560)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        SafeRoute
      </Typography>
      <Typography variant="body1" sx={{
        color: "rgba(255,255,255,0.55)", mb: 4,
        textAlign: "center", maxWidth: 400, lineHeight: 1.6,
      }}>
        Your trusted companion for safe travel.<br />
        Find crime-aware routes with real-time safety scores.
      </Typography>

      {/* Action Buttons */}
      <Paper elevation={0} sx={{
        background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)",
        borderRadius: "22px", padding: "30px 28px", width: "100%", maxWidth: 380,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        {/* Current Location Map */}
        <Button
          fullWidth variant="contained"
          startIcon={<MapIcon />}
          onClick={() => navigate("/map")}
          sx={{
            py: 1.8, borderRadius: "14px",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            fontSize: "1rem", fontWeight: 600, textTransform: "none",
            letterSpacing: "0.5px",
            boxShadow: "0 6px 25px rgba(34,197,94,0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(135deg, #4ade80, #22c55e)",
              boxShadow: "0 8px 30px rgba(34,197,94,0.45)",
              transform: "translateY(-2px)",
            },
          }}
        >
          📍 View My Location
        </Button>

        {/* Set Destination */}
        <Button
          fullWidth variant="contained"
          startIcon={<DirectionsIcon />}
          onClick={() => navigate("/destination")}
          sx={{
            py: 1.8, borderRadius: "14px",
            background: "linear-gradient(135deg, #e94560, #c23152)",
            fontSize: "1rem", fontWeight: 600, textTransform: "none",
            letterSpacing: "0.5px",
            boxShadow: "0 6px 25px rgba(233,69,96,0.35)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(135deg, #ff6b81, #e94560)",
              boxShadow: "0 8px 30px rgba(233,69,96,0.5)",
              transform: "translateY(-2px)",
            },
          }}
        >
          🛡️ Find Safe Route
        </Button>

        {/* Live Tracking */}
        <Button
          fullWidth variant="contained"
          startIcon={<ShareLocationIcon />}
          onClick={() => navigate("/livetracking")}
          sx={{
            py: 1.8, borderRadius: "14px",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            fontSize: "1rem", fontWeight: 600, textTransform: "none",
            letterSpacing: "0.5px",
            boxShadow: "0 6px 25px rgba(59,130,246,0.35)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              boxShadow: "0 8px 30px rgba(59,130,246,0.5)",
              transform: "translateY(-2px)",
            },
          }}
        >
          📡 Live Tracking
        </Button>

        {/* Trusted Contacts */}
        <Button
          fullWidth variant="contained"
          startIcon={<PeopleIcon />}
          onClick={() => navigate("/trustedcontacts")}
          sx={{
            py: 1.8, borderRadius: "14px",
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            fontSize: "1rem", fontWeight: 600, textTransform: "none",
            letterSpacing: "0.5px",
            boxShadow: "0 6px 25px rgba(139,92,246,0.35)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
              boxShadow: "0 8px 30px rgba(139,92,246,0.5)",
              transform: "translateY(-2px)",
            },
          }}
        >
          👥 Trusted Contacts
        </Button>
      </Paper>

      {/* Features */}
      <Box sx={{ display: "flex", gap: 3, mt: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { emoji: "🔍", text: "Crime Data Analysis" },
          { emoji: "👮", text: "Police Coverage" },
          { emoji: "👥", text: "Crowd Safety" },
        ].map((f, i) => (
          <Box key={i} sx={{
            display: "flex", alignItems: "center", gap: 0.8,
            color: "rgba(255,255,255,0.4)", fontSize: "0.75rem",
            fontWeight: 500, letterSpacing: "0.5px",
          }}>
            <span>{f.emoji}</span> {f.text}
          </Box>
        ))}
      </Box>

      {/* ═══ SOS BUTTON ═══ */}
      <Box
        onClick={triggerSOS}
        sx={{
          mt: 4, width: 130, height: 130, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #fca5a5, #dc2626, #991b1b)",
          border: "5px solid rgba(254,202,202,0.8)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", gap: "2px",
          animation: "sosPulse 1.8s infinite",
          transition: "transform 0.2s",
          "&:hover": { transform: "scale(1.08)" },
          "&:active": { transform: "scale(0.95)" },
        }}
      >
        <span style={{ fontSize: 36, lineHeight: 1 }}>🆘</span>
        <span style={{
          color: "#fff", fontWeight: 800, fontSize: 22,
          letterSpacing: 2, textShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}>SOS</span>
      </Box>

      <Typography variant="caption" sx={{
        color: "rgba(255,255,255,0.3)", mt: 1,
        textAlign: "center", fontSize: "0.65rem",
      }}>
        Tap SOS to alert trusted contacts instantly
      </Typography>

      {/* Tagline */}
      <Typography variant="caption" sx={{
        color: "rgba(255,255,255,0.2)", mt: 3,
        textAlign: "center", letterSpacing: "2px",
        textTransform: "uppercase", fontSize: "0.6rem",
      }}>
        Your safety is our priority
      </Typography>

      {/* ═══ SOS POPUP ═══ */}
      {showSosPopup && (
        <Box
          onClick={() => setShowSosPopup(false)}
          sx={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              borderRadius: "24px", padding: "32px 28px",
              maxWidth: 400, width: "90%",
              border: "2px solid rgba(239,68,68,0.4)",
              boxShadow: "0 16px 64px rgba(239,68,68,0.3)",
              animation: "popIn 0.4s ease",
              maxHeight: "85vh", overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>
                {sosStatus === "sending" ? "⏳" : sosStatus === "sent" ? "✅" : "⚠️"}
              </div>
              <h2 style={{
                color: sosStatus === "sent" ? "#22c55e" : "#ef4444",
                fontSize: 22, fontWeight: 800, margin: "0 0 6px", letterSpacing: 1,
              }}>
                {sosStatus === "sending" ? "SENDING SOS..." : sosStatus === "sent" ? "SMS DELIVERED!" : "SOS ALERT"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0 }}>
                {sosStatus === "sending"
                  ? "Getting your location & sending SMS to contacts..."
                  : sosResult?.message || "Something went wrong"}
              </p>
            </div>

            {/* SMS Delivery Success */}
            {sosStatus === "sent" && sosResult?.smsDelivered && (
              <div style={{
                background: "rgba(34,197,94,0.12)", borderRadius: 14, padding: "14px 16px",
                border: "1px solid rgba(34,197,94,0.3)", marginBottom: 14,
              }}>
                <p style={{ color: "#22c55e", fontSize: 12, margin: "0 0 4px", fontWeight: 700 }}>
                  ✅ SMS DELIVERED to {sosResult.smsSent} contact(s)
                </p>
                <p style={{ color: "rgba(34,197,94,0.7)", fontSize: 11, margin: 0 }}>
                  Messages sent via Fast2SMS. Your contacts received the SMS.
                </p>
              </div>
            )}

            {/* SMS Failed */}
            {sosStatus === "error" && sosResult?.smsError && (
              <div style={{
                background: "rgba(239,68,68,0.12)", borderRadius: 14, padding: "14px 16px",
                border: "1px solid rgba(239,68,68,0.3)", marginBottom: 14,
              }}>
                <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 4px", fontWeight: 700 }}>
                  ❌ SMS NOT Delivered
                </p>
                <p style={{ color: "rgba(239,68,68,0.8)", fontSize: 11, margin: "0 0 6px" }}>
                  Error: {sosResult.smsError}
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>
                  💡 WhatsApp messages will open as backup
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
                        {c.phone} • {sosResult.smsDelivered ? "SMS ✓" : "WhatsApp"}
                      </div>
                    </div>
                  </div>
                ))}
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
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { window.location.href = "tel:112"; }} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>📞 Call 112</button>
              <button onClick={() => navigate("/livetracking")} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>📡 Live Track</button>
              <button onClick={() => setShowSosPopup(false)} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Close</button>
            </div>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default HomePage;