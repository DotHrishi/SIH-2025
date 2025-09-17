import React from 'react';
import { Marker, Popup, Circle, LayerGroup } from 'react-leaflet';
import L from 'leaflet';

// Custom icons for different layer types
const createCustomIcon = (color, symbol) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${symbol}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Icons for different layer types
const LAYER_ICONS = {
  waterBody: createCustomIcon('#3B82F6', '💧'),
  clinic: createCustomIcon('#10B981', '+'),
  hospital: createCustomIcon('#EF4444', '🏥'),
  ngo: createCustomIcon('#8B5CF6', '🤝'),
  outbreak: createCustomIcon('#F59E0B', '⚠️')
};

// Water Bodies Layer Component
export const WaterBodiesLayer = ({ waterBodies = [], visible = true }) => {
  if (!visible) return null;

  return (
    <LayerGroup>
      {waterBodies.map((waterBody, index) => (
        <Marker
          key={waterBody.id || index}
          position={[waterBody.lat, waterBody.lng]}
          icon={LAYER_ICONS.waterBody}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-blue-800">{waterBody.name}</h3>
              <p className="text-sm text-gray-600">Type: {waterBody.type}</p>
              {waterBody.lastTested && (
                <p className="text-sm text-gray-600">
                  Last Tested: {new Date(waterBody.lastTested).toLocaleDateString()}
                </p>
              )}
              {waterBody.status && (
                <p className={`text-sm font-medium ${
                  waterBody.status === 'safe' ? 'text-green-600' : 
                  waterBody.status === 'contaminated' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  Status: {waterBody.status}
                </p>
              )}
              {waterBody.reports && (
                <p className="text-sm text-gray-600">Reports: {waterBody.reports}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </LayerGroup>
  );
};

// Outbreak Areas Layer Component
export const OutbreakAreasLayer = ({ outbreakAreas = [], visible = true }) => {
  if (!visible) return null;

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <LayerGroup>
      {outbreakAreas.map((area, index) => (
        <React.Fragment key={area.id || index}>
          {/* Circle overlay for outbreak area */}
          <Circle
            center={[area.lat, area.lng]}
            radius={area.radius || 1000}
            pathOptions={{
              color: getRiskColor(area.riskLevel),
              fillColor: getRiskColor(area.riskLevel),
              fillOpacity: 0.2,
              weight: 2
            }}
          />
          
          {/* Marker for outbreak center */}
          <Marker
            position={[area.lat, area.lng]}
            icon={LAYER_ICONS.outbreak}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-orange-800">{area.name}</h3>
                <p className={`text-sm font-medium ${
                  area.riskLevel === 'high' ? 'text-red-600' : 
                  area.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  Risk Level: {area.riskLevel}
                </p>
                {area.cases && (
                  <p className="text-sm text-gray-600">Cases: {area.cases}</p>
                )}
                {area.disease && (
                  <p className="text-sm text-gray-600">Disease: {area.disease}</p>
                )}
                {area.lastUpdated && (
                  <p className="text-sm text-gray-600">
                    Updated: {new Date(area.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}
    </LayerGroup>
  );
};

// Clinics & Hospitals Layer Component
export const ClinicsHospitalsLayer = ({ facilities = [], visible = true }) => {
  if (!visible) return null;

  return (
    <LayerGroup>
      {facilities.map((facility, index) => (
        <Marker
          key={facility.id || index}
          position={[facility.lat, facility.lng]}
          icon={facility.type === 'hospital' ? LAYER_ICONS.hospital : LAYER_ICONS.clinic}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-green-800">{facility.name}</h3>
              <p className="text-sm text-gray-600">Type: {facility.type}</p>
              {facility.contact && (
                <p className="text-sm text-gray-600">Contact: {facility.contact}</p>
              )}
              {facility.capacity && (
                <p className="text-sm text-gray-600">Capacity: {facility.capacity} beds</p>
              )}
              {facility.services && (
                <div className="text-sm text-gray-600">
                  <p>Services:</p>
                  <ul className="list-disc list-inside ml-2">
                    {facility.services.map((service, idx) => (
                      <li key={idx}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className={`text-sm font-medium ${
                facility.status === 'operational' ? 'text-green-600' : 'text-red-600'
              }`}>
                Status: {facility.status}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </LayerGroup>
  );
};

// NGOs Layer Component
export const NGOsLayer = ({ ngos = [], visible = true }) => {
  if (!visible) return null;

  return (
    <LayerGroup>
      {ngos.map((ngo, index) => (
        <Marker
          key={ngo.id || index}
          position={[ngo.lat, ngo.lng]}
          icon={LAYER_ICONS.ngo}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-purple-800">{ngo.name}</h3>
              {ngo.leadWorker && (
                <p className="text-sm text-gray-600">Lead: {ngo.leadWorker}</p>
              )}
              {ngo.contact && (
                <p className="text-sm text-gray-600">Contact: {ngo.contact}</p>
              )}
              {ngo.coverage && (
                <p className="text-sm text-gray-600">Coverage: {ngo.coverage}</p>
              )}
              {ngo.services && (
                <div className="text-sm text-gray-600">
                  <p>Services:</p>
                  <ul className="list-disc list-inside ml-2">
                    {ngo.services.map((service, idx) => (
                      <li key={idx}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className={`text-sm font-medium ${
                ngo.status === 'active' ? 'text-green-600' : 'text-gray-600'
              }`}>
                Status: {ngo.status}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </LayerGroup>
  );
};

// Main MapLayers component that combines all layers
const MapLayers = ({
  waterBodies = [],
  outbreakAreas = [],
  facilities = [],
  ngos = [],
  visibleLayers = {
    waterBodies: true,
    outbreakAreas: true,
    facilities: true,
    ngos: true
  }
}) => {
  return (
    <>
      <WaterBodiesLayer 
        waterBodies={waterBodies} 
        visible={visibleLayers.waterBodies} 
      />
      <OutbreakAreasLayer 
        outbreakAreas={outbreakAreas} 
        visible={visibleLayers.outbreakAreas} 
      />
      <ClinicsHospitalsLayer 
        facilities={facilities} 
        visible={visibleLayers.facilities} 
      />
      <NGOsLayer 
        ngos={ngos} 
        visible={visibleLayers.ngos} 
      />
    </>
  );
};

export default MapLayers;