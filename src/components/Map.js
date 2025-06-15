"use client"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix pour les icônes manquantes dans Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png'
})

const Map = ({ points, center, zoom, onPointClick, singleMarker = false }) => {
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
              <h4 className="font-semibold">{points[0].nom}</h4>
              <p className="text-sm">{points[0].adresse.split(',')[0]}</p>
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
                <h4 className="font-semibold">{point.nom}</h4>
                <p className="text-sm">{point.adresse.split(',')[0]}</p>
              </div>
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  )
}

export default Map