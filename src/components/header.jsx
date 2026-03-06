import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import EmergencyIcon from '@mui/icons-material/Emergency';
import InfoIcon from '@mui/icons-material/Info';
import LoginIcon from '@mui/icons-material/Login';
import CloseIcon from '@mui/icons-material/Close';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './header.css';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [sirenActive, setSirenActive] = useState(false);
    const [copied, setCopied] = useState(false);

    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const gainRef = useRef(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Start alert siren using Web Audio API
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

            // Siren effect: oscillate frequency
            const interval = setInterval(() => {
                osc.frequency.value = osc.frequency.value === 800 ? 1200 : 800;
            }, 500);

            audioCtxRef.current = ctx;
            oscillatorRef.current = osc;
            gainRef.current = gain;
            osc._sirenInterval = interval;
            setSirenActive(true);
        } catch (e) {
            console.error('Siren error:', e);
        }
    }, [sirenActive]);

    // Stop alert siren
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

    // Fetch GPS location
    const fetchLocation = useCallback(() => {
        setLoadingLocation(true);
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported by your browser');
            setLoadingLocation(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoadingLocation(false);
            },
            (err) => {
                setLocationError('Unable to get location. Please enable GPS.');
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Handle Get Help button click
    const handleGetHelp = (e) => {
        e.preventDefault();
        setIsMenuOpen(false);
        setShowSOS(true);
        setCopied(false);
        fetchLocation();
    };

    // Close SOS modal
    const closeSOS = () => {
        stopSiren();
        setShowSOS(false);
        setLocation(null);
        setLocationError('');
    };

    const mapsLink = location
        ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
        : null;

    // Share via WhatsApp
    const shareWhatsApp = () => {
        if (!mapsLink) return;
        const msg = encodeURIComponent(
            `🚨 EMERGENCY SOS! I need help! My current location: ${mapsLink} - Please call or reach out immediately!`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    // Copy location link
    const copyLocation = () => {
        if (!mapsLink) return;
        navigator.clipboard.writeText(mapsLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="logo">
                    <h1><CrisisAlertIcon className="alert" />Women One-Tap SOS</h1>
                </div>

                <button className="hamburger" onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav className={`nav ${isMenuOpen ? 'active' : ''}`}>
                    <div className="login icon chase">
                        <LoginIcon className="ui-icon" />
                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>login</Link>
                    </div>

                    <div className="signup icon chase">
                        <PersonAddIcon className="ui-icon" />
                        <Link to="/register" onClick={() => setIsMenuOpen(false)}>SignUp</Link>
                    </div>

                    <div className="about icon chase">
                        <InfoIcon className="ui-icon" />
                        <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
                    </div>
                    <div className={`sos ${showSOS ? 'sos-active' : ''}`}>
                        <button onClick={handleGetHelp} className="btn-cta">
                            <EmergencyIcon />
                            Get Help
                        </button>
                    </div>
                </nav>
            </div>

            {/* ═══ SOS Emergency Modal ═══ */}
            {showSOS && (
                <div className="sos-modal-overlay" onClick={closeSOS}>
                    <div className="sos-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="sos-modal-close" onClick={closeSOS}>
                            <CloseIcon />
                        </button>

                        <div className="sos-modal-header">
                            <div className="sos-modal-icon-pulse">
                                <EmergencyIcon style={{ fontSize: 48, color: '#fff' }} />
                            </div>
                            <h2>🚨 Emergency SOS</h2>
                            <p>Tap below to call for help immediately</p>
                        </div>

                        {/* Emergency Call Buttons */}
                        <div className="sos-call-buttons">
                            <a href="tel:1091" className="sos-call-btn women-helpline">
                                <LocalPhoneIcon />
                                <div>
                                    <span className="call-label">Women Helpline</span>
                                    <span className="call-number">1091</span>
                                </div>
                            </a>
                            <a href="tel:112" className="sos-call-btn police-btn">
                                <LocalPhoneIcon />
                                <div>
                                    <span className="call-label">Police</span>
                                    <span className="call-number">112</span>
                                </div>
                            </a>
                            <a href="tel:108" className="sos-call-btn ambulance-btn">
                                <LocalPhoneIcon />
                                <div>
                                    <span className="call-label">Ambulance</span>
                                    <span className="call-number">108</span>
                                </div>
                            </a>
                        </div>

                        {/* Location Section */}
                        <div className="sos-location-section">
                            <h3><MyLocationIcon style={{ fontSize: 20 }} /> Your Location</h3>
                            {loadingLocation && (
                                <div className="sos-location-loading">
                                    <div className="sos-spinner"></div>
                                    <span>Fetching GPS location...</span>
                                </div>
                            )}
                            {locationError && (
                                <p className="sos-location-error">⚠️ {locationError}</p>
                            )}
                            {location && (
                                <div className="sos-location-info">
                                    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="sos-map-link">
                                        📍 View on Google Maps
                                    </a>
                                    <div className="sos-share-buttons">
                                        <button onClick={shareWhatsApp} className="sos-share-btn whatsapp-btn">
                                            <ShareIcon style={{ fontSize: 18 }} /> WhatsApp
                                        </button>
                                        <button onClick={copyLocation} className="sos-share-btn copy-btn">
                                            <ContentCopyIcon style={{ fontSize: 18 }} />
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!loadingLocation && !location && !locationError && (
                                <button onClick={fetchLocation} className="sos-share-btn" style={{ marginTop: 8 }}>
                                    <MyLocationIcon style={{ fontSize: 18 }} /> Get Location
                                </button>
                            )}
                        </div>

                        {/* Siren Toggle */}
                        <button
                            onClick={sirenActive ? stopSiren : startSiren}
                            className={`sos-siren-btn ${sirenActive ? 'siren-on' : ''}`}
                        >
                            {sirenActive ? <VolumeOffIcon /> : <VolumeUpIcon />}
                            {sirenActive ? 'Stop Siren' : '🔊 Activate Alert Siren'}
                        </button>
                    </div>
                </div>
            )}

            <div className="hero-section">
                <div className="hero-content">
                    <h2>Empowering Women's Safety</h2>
                    <p>One tap to reach help. Instant protection when you need it most.</p>
                </div>
            </div>

            <div className="body-section">
                <div className="features-container">
                    <div className="feature-card">
                        <h3>🚨 Instant Emergency Alert</h3>
                        <p>Send distress signals to trusted contacts and authorities with a single tap. Your location is automatically shared in real-time.</p>
                    </div>
                    <div className="feature-card">
                        <h3>📍 Real-Time Location Tracking</h3>
                        <p>Emergency responders and trusted contacts can track your live location. Stay connected and protected during critical moments.</p>
                    </div>
                    <div className="feature-card">
                        <h3>📞 Instant Notifications</h3>
                        <p>Nearby women receive alerts in your area. Build a community of support and collective safety awareness.</p>
                    </div>
                    <div className="feature-card">
                        <h3>🛡️ Confidential & Secure</h3>
                        <p>Your privacy and security are our top priority. All data is encrypted and protected with industry-standard security protocols.</p>
                    </div>
                </div>

                <div className="about-section" id="about">
                    <h4>About Women One-Tap SOS</h4>
                    <p>Women One-Tap SOS is a safety-first emergency alert system designed specifically for women. In moments of danger or distress, every second counts. Our app puts the power of instant assistance at your fingertips—literally one tap away.</p>
                    <p>We believe every woman deserves to feel safe, whether walking home late, traveling alone, or facing an emergency. Our mission is to provide immediate, reliable help when you need it most.</p>
                </div>
            </div>

            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-section">
                        <div className="footer-logo">
                            <CrisisAlertIcon className="footer-alert" />
                            <h3>Women One-Tap SOS</h3>
                        </div>
                        <p className="footer-description">
                            Quick emergency assistance at your fingertips. Stay safe with our one-tap SOS service.
                        </p>
                    </div>

                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><a href="#about">About</a></li>
                            <li><Link to="/register">Get Started</Link></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="#help">Help Center</a></li>
                            <li><a href="#privacy">Privacy Policy</a></li>
                            <li><a href="#terms">Terms & Conditions</a></li>
                            <li><a href="#faq">FAQ</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Follow Us</h4>
                        <div className="social-links">
                            <a href="#facebook" className="social-icon">
                                <FacebookIcon />
                            </a>
                            <a href="#twitter" className="social-icon">
                                <TwitterIcon />
                            </a>
                            <a href="#instagram" className="social-icon">
                                <InstagramIcon />
                            </a>
                            <a href="#linkedin" className="social-icon">
                                <LinkedInIcon />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Women One-Tap SOS. All rights reserved. | Empowering Women. Saving Lives.</p>
                </div>
            </footer>
        </header>
    )
}

export default Header