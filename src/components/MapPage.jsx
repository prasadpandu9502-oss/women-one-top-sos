import { useLocation, useNavigate } from "react-router-dom";
import MapComponent from "./MapComponent";

function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routes = location.state?.routes || [];

  const handleNextClick = () => {
    navigate("/homepage");
  };

  return <MapComponent onNextClick={handleNextClick} routes={routes} />;
}

export default MapPage;