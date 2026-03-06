import React, { useState, useRef, useCallback } from "react";
import "./loginhome.css";

function Home() {
    const [active, setActive] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [sirenActive, setSirenActive] = useState(false);
    const [copied, setCopied] = useState(false);

    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);

    const handleSOS = () => {
        setActive(true);
        setTimeout(() => {
            setActive(false);
            alert("🚨 Emergency Alert Sent!");
        }, 3000);
    };

    const handleOptionClick = (option) => {
        alert(`${option} Activated`);
    };

    // ── SOS Modal Functions ──
    const startSiren = useCallback(() => {
        if (sirenActive) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            const interval = setInterval(() => {
                osc.frequency.value = osc.frequency.value === 800 ? 1200 : 800;
            }, 500);
            audioCtxRef.current = ctx;
            oscillatorRef.current = osc;
            osc._sirenInterval = interval;
            setSirenActive(true);
        } catch (e) { console.error('Siren error:', e); }
    }, [sirenActive]);

    const stopSiren = useCallback(() => {
        try {
            if (oscillatorRef.current) {
                clearInterval(oscillatorRef.current._sirenInterval);
                oscillatorRef.current.stop();
                oscillatorRef.current = null;
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
        } catch (e) { /* ignore */ }
        setSirenActive(false);
    }, []);

    const fetchLocation = useCallback(() => {
        setLoadingLocation(true);
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported');
            setLoadingLocation(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoadingLocation(false);
            },
            () => {
                setLocationError('Unable to get location. Please enable GPS.');
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const openSOSModal = () => {
        setShowSOS(true);
        setCopied(false);
        fetchLocation();
    };

    const closeSOS = () => {
        stopSiren();
        setShowSOS(false);
        setLocation(null);
        setLocationError('');
    };

    const mapsLink = location
        ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
        : null;

    const shareWhatsApp = () => {
        if (!mapsLink) return;
        const msg = encodeURIComponent(
            `🚨 EMERGENCY SOS! I need help! My current location: ${mapsLink} - Please call or reach out immediately!`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    const copyLocation = () => {
        if (!mapsLink) return;
        navigator.clipboard.writeText(mapsLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className={`home ${active ? "alert-mode" : ""}`}>
            <div className="overlay"></div>

            <div className="content">
                <h1 className="title">
                    Women Safety <span>One-Tap SOS</span>
                </h1>

                <p className="subtitle">
                    Stay safe. Instantly alert trusted contacts with one tap.
                </p>

                {/* OPTIONS GRID */}
                <div className="options-grid">
                    <div className="option-card" onClick={() => handleOptionClick("📍 Live Location")}>
                        📍 <span>Live Location</span>
                    </div>

                    <div className="option-card" onClick={openSOSModal}>
                        📞 <span>Emergency Call</span>
                    </div>

                    <div className="option-card" onClick={() => handleOptionClick("👥 Trusted Contacts")}>
                        👥 <span>Trusted Contacts</span>
                    </div>

                    <div className="option-card" onClick={() => handleOptionClick("🎥 Live Recording")}>
                        🎥 <span>Live Recording</span>
                    </div>

                    <div className="option-card" onClick={() => handleOptionClick("🔊 Siren Mode")}>
                        🔊 <span>Siren Mode</span>
                    </div>
                </div>

                {/* SOS BUTTON */}
                <button className="sos-btn" onClick={handleSOS}>
                    <span className="ripple"></span>
                    SOS
                </button>
            </div>

            {/* ═══ SOS Emergency Modal ═══ */}
            {showSOS && (
                <div className="sos-modal-overlay" onClick={closeSOS}>
                    <div className="sos-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="sos-modal-close" onClick={closeSOS}>✕</button>

                        <div className="sos-modal-header">
                            <div className="sos-modal-icon-pulse">🚨</div>
                            <h2>Emergency SOS</h2>
                            <p>Tap below to call for help immediately</p>
                        </div>

                        {/* Emergency Call Buttons */}
                        <div className="sos-call-buttons">
                            <a href="tel:1091" className="sos-call-btn women-helpline">
                                📞 <div><span className="call-label">Women Helpline</span><span className="call-number">1091</span></div>
                            </a>
                            <a href="tel:112" className="sos-call-btn police-btn">
                                📞 <div><span className="call-label">Police</span><span className="call-number">112</span></div>
                            </a>
                            <a href="tel:108" className="sos-call-btn ambulance-btn">
                                📞 <div><span className="call-label">Ambulance</span><span className="call-number">108</span></div>
                            </a>
                        </div>

                        {/* Location Section */}
                        <div className="sos-location-section">
                            <h3>📍 Your Location</h3>
                            {loadingLocation && (
                                <div className="sos-location-loading">
                                    <div className="sos-spinner"></div>
                                    <span>Fetching GPS location...</span>
                                </div>
                            )}
                            {locationError && <p className="sos-location-error">⚠️ {locationError}</p>}
                            {location && (
                                <div className="sos-location-info">
                                    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="sos-map-link">
                                        📍 View on Google Maps
                                    </a>
                                    <div className="sos-share-buttons">
                                        <button onClick={shareWhatsApp} className="sos-share-btn whatsapp-btn">
                                            📤 WhatsApp
                                        </button>
                                        <button onClick={copyLocation} className="sos-share-btn copy-btn">
                                            {copied ? '✅ Copied!' : '📋 Copy Link'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Siren Toggle */}
                        <button
                            onClick={sirenActive ? stopSiren : startSiren}
                            className={`sos-siren-btn ${sirenActive ? 'siren-on' : ''}`}
                        >
                            {sirenActive ? '🔇 Stop Siren' : '🔊 Activate Alert Siren'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
