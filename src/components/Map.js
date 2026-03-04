"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const Map = ({ points, center, zoom, onPointClick, singleMarker = false }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Fix pour les icônes manquantes dans Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/marker-icon-2x.png',
      iconUrl: '/images/marker-icon.png',
      shadowUrl: '/images/marker-shadow.png'
    });
  }, []);

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {singleMarker ? (
        <Marker position={[points[0].latitude, points[0].longitude]}>
          <Popup>
            <div className="space-y-1">
              <h4 className="font-semibold">{points[0].name}</h4>
              <p className="text-sm">{points[0].address?.split(',')[0]}</p>
            </div>
          </Popup>
        </Marker>
      ) : (
        points.map(point => (
          <Marker 
            key={point.id} 
            position={[point.latitude, point.longitude]}
            eventHandlers={{
              click: () => onPointClick && onPointClick(point)
            }}
          >
            <Popup>
              <div className="space-y-1">
                <h4 className="font-semibold">{point.name}</h4>
                <p className="text-sm">{point.address?.split(',')[0]}</p>
              </div>
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
};

export default Map;