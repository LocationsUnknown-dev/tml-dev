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
                layer.bindPopup("<strong>" + feature.properties.unit_name + "</strong>");
                layer.on('click', function(e) {
                  // Convert the park's name to lowercase for matching.
                  const parkNameLower = feature.properties.unit_name.toLowerCase();
                  let matchedKey = null;
                  // Loop through trailsConfig keys and check if the park name includes the key.
                  for (const key in trailsConfig) {
                    if (parkNameLower.includes(key)) {
                      matchedKey = key;
                      break;
                    }
                  }
                  if (matchedKey) {
                    // When a park with trails is clicked, show its toggle button.
                    addParkTrailsToggleButton(e.target._map, matchedKey);
                  } else {
                    // Remove any existing trails toggle buttons and overlays.
                    Object.keys(trailsConfig).forEach(key => {
                      removeParkTrailsToggleButton(e.target._map, key);
                    });
                  }
                });
              }
            }
          });
          map.addLayer(layer);
          npRef.layer = layer;
          npRef.nationalParksData = geojsonData;
          // Store the NP boundaries data globally for use in the location list.
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