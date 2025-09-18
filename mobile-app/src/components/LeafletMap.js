import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletMap = ({ 
  latitude = 25.4670, 
  longitude = 91.3662, 
  markers = [], 
  style,
  onMarkerPress 
}) => {
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .custom-popup {
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
        .popup-title {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .popup-content {
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Initialize map
        var map = L.map('map').setView([${latitude}, ${longitude}], 13);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add current location marker
        var currentLocationIcon = L.divIcon({
          className: 'current-location-marker',
          html: '<div style="background-color: #2196F3; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        L.marker([${latitude}, ${longitude}], { icon: currentLocationIcon })
          .addTo(map)
          .bindPopup('<div class="custom-popup"><div class="popup-title">Your Location</div><div class="popup-content">Current GPS position</div></div>');
        
        // Add sample markers
        var markers = [
          { lat: ${latitude + 0.001}, lng: ${longitude + 0.001}, type: 'water', title: 'Water Quality Report', desc: 'Test Spring Location' },
          { lat: ${latitude - 0.001}, lng: ${longitude + 0.001}, type: 'patient', title: 'Patient Report', desc: 'Cholera case reported' },
          { lat: ${latitude + 0.001}, lng: ${longitude - 0.001}, type: 'water', title: 'Water Quality Report', desc: 'Well water testing' },
          { lat: ${latitude - 0.001}, lng: ${longitude - 0.001}, type: 'alert', title: 'Health Alert', desc: 'Water contamination detected' },
          { lat: ${latitude + 0.002}, lng: ${longitude}, type: 'water', title: 'Water Quality Report', desc: 'River water analysis' }
        ];
        
        markers.forEach(function(marker) {
          var color = marker.type === 'water' ? '#4CAF50' : 
                     marker.type === 'patient' ? '#2196F3' : 
                     marker.type === 'alert' ? '#F44336' : '#FF9800';
          
          var icon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ' + color + '; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          L.marker([marker.lat, marker.lng], { icon: icon })
            .addTo(map)
            .bindPopup('<div class="custom-popup"><div class="popup-title">' + marker.title + '</div><div class="popup-content">' + marker.desc + '</div></div>');
        });
        
        // Handle marker clicks
        map.on('popupopen', function(e) {
          // You can send data back to React Native here if needed
          console.log('Marker clicked:', e.popup.getContent());
        });
        
        // Disable zoom controls for mobile
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        
        // Add scale control
        L.control.scale().addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: mapHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        onMessage={(event) => {
          // Handle messages from WebView if needed
          console.log('WebView message:', event.nativeEvent.data);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default LeafletMap;