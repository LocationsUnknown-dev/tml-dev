// assets/js/boundaries.js

import { trailsConfig, addParkTrailsToggleButton, removeParkTrailsToggleButton } from './trails.js';

export function toggleNPBoundaries(map, npRef, button) {
  if (npRef.layer && map.hasLayer(npRef.layer)) {
    // Remove the NP boundaries layer.
    map.removeLayer(npRef.layer);
    // Remove any trails overlays and hide their toggle buttons.
    Object.keys(trailsConfig).forEach(key => {
      removeParkTrailsToggleButton(map, key);
    });
    button.innerHTML = "NP Boundaries";
    npRef.layer = null;
  } else {
    if (npRef.layer) {
      map.addLayer(npRef.layer);
      button.innerHTML = "Remove NP Boundaries";
    } else {
      fetch("https://themissinglist.com/data/US_National_Parks.geojson")
        .then(response => response.json())
        .then(geojsonData => {
          const layer = L.geoJSON(geojsonData, {
            style: feature => ({ color: "#228B22", weight: 2, fillOpacity: 0.1 }),
            onEachFeature: function(feature, layer) {
              if (feature.properties && feature.properties.unit_name) {
                // Bind a popup to show the park name.
                layer.bindPopup("<strong>" + feature.properties.unit_name + "</strong>");
                
                // Single click event:
                layer.on('click', function(e) {
                  // Prevent event propagation (in case map click events interfere)
                  L.DomEvent.stopPropagation(e);
                  
                  // Zoom to the feature's bounds
                  const bounds = layer.getBounds();
                  if (bounds.isValid()) {
                    map.fitBounds(bounds);
                  }
                  
                  // Call the global function to show the Trails Data Points list.
                  // Make sure that in your ui.js you set: window.showLocationDetailView = showLocationDetailView;
                  if (typeof window.showLocationDetailView === 'function') {
                    window.showLocationDetailView(feature);
                  } else {
                    console.warn("window.showLocationDetailView is not defined");
                  }
                  
                  // Also, toggle the trails overlay if available.
                  const parkNameLower = feature.properties.unit_name.toLowerCase();
                  let matchedKey = null;
                  for (const key in trailsConfig) {
                    if (parkNameLower.includes(key)) {
                      matchedKey = key;
                      break;
                    }
                  }
                  if (matchedKey) {
                    addParkTrailsToggleButton(map, matchedKey);
                  } else {
                    Object.keys(trailsConfig).forEach(key => {
                      removeParkTrailsToggleButton(map, key);
                    });
                  }
                });
              }
            }
          });
          map.addLayer(layer);
          npRef.layer = layer;
          npRef.nationalParksData = geojsonData;
          // Store NP boundaries data globally for other uses.
          window.nationalParksData = geojsonData;
          button.innerHTML = "Remove NP Boundaries";
        })
        .catch(error => console.error("Error loading NP Boundaries GeoJSON:", error));
    }
  }
}

export function toggleStates(map, stateRef, button, missingData, addMarkersCallback, buildPopupContent, showDetailView) {
  if (stateRef.layer && map.hasLayer(stateRef.layer)) {
    map.removeLayer(stateRef.layer);
    button.innerHTML = "States";
    stateRef.layer = null;
  } else {
    if (stateRef.layer) {
      map.addLayer(stateRef.layer);
      button.innerHTML = "Remove States";
    } else {
      fetch("https://themissinglist.com/data/us-states.json")
        .then(response => response.json())
        .then(geojsonData => {
          const layer = L.geoJSON(geojsonData, {
            style: feature => ({ color: "#3388ff", weight: 2, fillOpacity: 0.1 }),
            onEachFeature: function(feature, layer) {
              layer.on('click', function() {
                map.fitBounds(layer.getBounds());
                const stateName = feature.properties.name;
                const stateFiltered = missingData.filter(item => item.state === stateName);
                if (stateFiltered.length > 0) {
                  addMarkersCallback(map, stateFiltered, buildPopupContent, showDetailView, null);
                }
              });
            }
          });
          map.addLayer(layer);
          stateRef.layer = layer;
          button.innerHTML = "Remove States";
        })
        .catch(error => console.error("Error loading States GeoJSON:", error));
    }
  }
}
