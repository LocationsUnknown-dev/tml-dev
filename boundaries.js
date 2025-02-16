// assets/js/boundaries.js

import { trailsConfig, addParkTrailsToggleButton, removeParkTrailsToggleButton } from './trails.js';

export function toggleNPBoundaries(map, npRef, button) {
  // Debug: Log that the function was called and verify the button element.
  console.log("toggleNPBoundaries called", button);
  if (!button) {
    console.error("NP Boundaries toggle button not found.");
    return;
  }
  
  // Initialize the button's original content if not already set.
  if (!button.dataset.original) {
    button.dataset.original = button.innerHTML;
    console.log("Set button dataset.original:", button.dataset.original);
  }
  
  if (npRef.layer && map.hasLayer(npRef.layer)) {
    console.log("Removing NP Boundaries layer");
    map.removeLayer(npRef.layer);
    // Remove trails overlays if any.
    Object.keys(trailsConfig).forEach(key => {
      removeParkTrailsToggleButton(map, key);
    });
    // Restore the original button content.
    button.innerHTML = button.dataset.original;
    npRef.layer = null;
  } else {
    if (npRef.layer) {
      console.log("Re-adding NP Boundaries layer");
      map.addLayer(npRef.layer);
      button.innerHTML = button.dataset.original;
    } else {
      console.log("Fetching NP Boundaries GeoJSON");
      fetch("https://themissinglist.com/data/US_National_Parks.geojson")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(geojsonData => {
          const layer = L.geoJSON(geojsonData, {
            style: feature => ({ color: "#228B22", weight: 2, fillOpacity: 0.1 }),
            onEachFeature: function(feature, layer) {
              if (feature.properties && feature.properties.unit_name) {
                layer.bindPopup("<strong>" + feature.properties.unit_name + "</strong>");
                layer.on('click', function(e) {
                  L.DomEvent.stopPropagation(e);
                  const bounds = layer.getBounds();
                  if (bounds.isValid()) {
                    map.fitBounds(bounds);
                  }
                  if (typeof window.showLocationDetailView === 'function') {
                    window.showLocationDetailView(feature);
                  } else {
                    console.warn("window.showLocationDetailView is not defined");
                  }
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
          window.nationalParksData = geojsonData;
          // Restore the original button content.
          button.innerHTML = button.dataset.original;
          console.log("NP Boundaries layer added");
        })
        .catch(error => {
          console.error("Error loading NP Boundaries GeoJSON:", error);
        });
    }
  }
}

export function toggleStates(map, stateRef, button, missingData, addMarkersCallback, buildPopupContent, showDetailView) {
  if (!button) {
    console.error("States toggle button not found.");
    return;
  }
  
  // Initialize the button's original content if not already set.
  if (!button.dataset.original) {
    button.dataset.original = button.innerHTML;
    console.log("Set states button dataset.original:", button.dataset.original);
  }
  
  if (stateRef.layer && map.hasLayer(stateRef.layer)) {
    console.log("Removing States layer");
    map.removeLayer(stateRef.layer);
    // Restore original button content.
    button.innerHTML = button.dataset.original;
    stateRef.layer = null;
  } else {
    if (stateRef.layer) {
      console.log("Re-adding States layer");
      map.addLayer(stateRef.layer);
      button.innerHTML = button.dataset.original;
    } else {
      console.log("Fetching States GeoJSON");
      fetch("https://themissinglist.com/data/us-states.json")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
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
          // Restore original button content.
          button.innerHTML = button.dataset.original;
          console.log("States layer added");
        })
        .catch(error => console.error("Error loading States GeoJSON:", error));
    }
  }
}
