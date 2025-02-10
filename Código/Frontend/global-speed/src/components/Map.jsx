import { useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from 'prop-types'; 

const Map = ({ direccion }) => {
  const mapRef = useRef(null);
  const directionsService = useRef(null);
  const directionsRenderer = useRef(null);

  useEffect(() => {
    const loadScript = (url, callback) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';

      if (script.readyState) {
        // Para navegadores antiguos
        script.onreadystatechange = function () {
          if (script.readyState === 'loaded' || script.readyState === 'complete') {
            script.onreadystatechange = null;
            callback();
          }
        };
      } else {
        // Para navegadores modernos
        script.onload = () => callback();
      }

      script.src = url;
      document.getElementsByTagName('head')[0].appendChild(script);
    };

    const handleApiLoaded = () => {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: { lat: -1.664415, lng: -78.662594 }, // Coordenadas del Parque Infantil en Riobamba
      });

      directionsService.current = new window.google.maps.DirectionsService();
      directionsRenderer.current = new window.google.maps.DirectionsRenderer();
      directionsRenderer.current.setMap(map);
    };

    loadScript(
      'https://maps.googleapis.com/maps/api/js?key=AIzaSyDGppZsz3wouM2n-oaAe79tZy3Z4lIRDE4&libraries=places',
      handleApiLoaded
    );
  }, []);

  useEffect(() => {
    if (direccion && directionsService.current && directionsRenderer.current) {
      const request = {
        origin: { lat: -1.664415, lng: -78.662594 }, // Parque Infantil en Riobamba
        destination: direccion,
        travelMode: 'DRIVING',
      };

      directionsService.current.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
        } else {
          console.error('Error al calcular la ruta:', status);
        }
      });
    }
  }, [direccion]);

  return (
    <div className="card shadow h-100">
      <div id="map" ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

Map.propTypes = {
    direccion: PropTypes.string.isRequired, // `direccion` debe ser una cadena obligatoria
  };
export default Map;
