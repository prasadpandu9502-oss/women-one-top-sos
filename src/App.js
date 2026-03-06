import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import RegisterPage from './components/register';
import LoginPage from './components/login';
import HomePage from "./components/HomePage";
import MapComponent from './components/MapComponent';
import DestinationPage from './components/DestinationPage';
import RouteMapPage from './components/RouteMapPage';
import TrustedContactsPage from './components/TrustedContactsPage';
import LiveTrackingPage from './components/LiveTrackingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Header />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/map" element={<MapComponent />} />
        <Route path="/destination" element={<DestinationPage />} />
        <Route path="/routemap" element={<RouteMapPage />} />
        <Route path="/trustedcontacts" element={<TrustedContactsPage />} />
        <Route path="/livetracking" element={<LiveTrackingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
