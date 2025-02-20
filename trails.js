// assets/js/trails.js

// Configuration object mapping park keys (in lowercase) to their trails file URL.
export const trailsConfig = {
  "yosemite": {
    url: "https://themissinglist.com/data/nps/yosemite_np.geojson.gz"
  },
  "yellowstone": {
    url: "https://themissinglist.com/data/nps/yellowstone_np.geojson.gz"
  },
  "zion": {
    url: "https://themissinglist.com/data/nps/zion_np.geojson.gz"
  },
  "denali": {
    url: "https://themissinglist.com/data/nps/denali_np.geojson.gz"
  },
  "gates": {
    url: "https://themissinglist.com/data/nps/gatesofthearctic_np.geojson.gz"
  },
  "kobuk": {
    url: "https://themissinglist.com/data/nps/kobuk_np.geojson.gz"
  },
  "grand canyon": {
    url: "https://themissinglist.com/data/nps/grand-canyon_np.geojson.gz"
  },
  "canyonlands": {
    url: "https://themissinglist.com/data/nps/canyonlands_np.geojson.gz"
  },

  // Add more parks as needed...
};

// Cache for fetched trails data.
const parkTrailsDataCache = {};

// Helper: Fetch and cache trails data for a park.
export function fetchTrailsData(parkKey) {
  if (parkTrailsDataCache[parkKey]) {
    return Promise.resolve(parkTrailsDataCache[parkKey]);
  }
  const config = trailsConfig[parkKey];
  if (!config) {
    return Promise.reject(`No trails configuration for park: ${parkKey}`);
  }
  return fetch(config.url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
      // Use pako to decompress the gzipped data.
      const decompressed = window.pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
      const geojsonData = JSON.parse(decompressed);
      parkTrailsDataCache[parkKey] = geojsonData;
      return geojsonData;
    })
    .catch(error => {
      console.error(`Error loading trails for ${parkKey}:`, error);
      throw error;
    });
}  // <-- This closing curly bracket was missing!

// Internal storage for loaded layers.
const parkTrailsLayers = {};

/**
 * Toggle the trails overlay for a given park.
 * @param {L.Map} map - The Leaflet map instance.
 * @param {string} parkKey - The normalized park key (e.g., "yosemite").
 */
export function toggleParkTrails(map, parkKey) {
  const layer = parkTrailsLayers[parkKey];
  if (layer && map.hasLayer(layer)) {
    map.removeLayer(layer);
    return;
  }
  if (layer) {
    map.addLayer(layer);
    return;
  }
  // Get configuration for this park.
  const config = trailsConfig[parkKey];
  if (!config) {
    console.error(`No trails configuration for park: ${parkKey}`);
    return;
  }
  // Fetch the gzipped GeoJSON file.
  fetch(config.url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
      // Use pako to decompress the gzipped data.
      const decompressed = window.pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
      const geojsonData = JSON.parse(decompressed);
      // Create a Leaflet GeoJSON layer with dynamic popup content.
      const newLayer = L.geoJSON(geojsonData, {
        style: { color: "#FF5733", weight: 3 },
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            // Filter out the "@id" field.
            const keys = Object.keys(feature.properties).filter(
              key => key !== '@id' && feature.properties[key] != null && feature.properties[key].toString().trim() !== ""
            );
            if (keys.length > 0) {
              let popupContent = "";
              keys.forEach(key => {
                popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
              });
              layer.bindPopup(popupContent);
            }
          }
        }
      });
      parkTrailsLayers[parkKey] = newLayer;
      map.addLayer(newLayer);
    })
    .catch(error => console.error(`Error loading trails for ${parkKey}:`, error));
}

/**
 * Add a toggle button for a park’s trails overlay.
 * @param {L.Map} map - The Leaflet map instance.
 * @param {string} parkKey - The normalized park key.
 */
export function addParkTrailsToggleButton(map, parkKey) {
  const buttonId = `trails-toggle-${parkKey}`;
  let button = document.getElementById(buttonId);
  if (!button) {
    button = document.createElement("div");
    button.id = buttonId;
    button.textContent = "Trails";
    button.style.cssText =
      "position:absolute; top:170px; right:10px; background:rgba(255,255,255,0.9);" +
      "padding:5px 10px; cursor:pointer; z-index:1000; min-width:70px; text-align:center;";
    button.addEventListener("click", () => {
      toggleParkTrails(map, parkKey);
    });
    document.getElementById("map").appendChild(button);
  } else {
    button.style.display = "block";
  }
}

/**
 * Remove (hide) the trails toggle button and remove its overlay.
 * @param {L.Map} map - The Leaflet map instance.
 * @param {string} parkKey - The normalized park key.
 */
export function removeParkTrailsToggleButton(map, parkKey) {
  const buttonId = `trails-toggle-${parkKey}`;
  const button = document.getElementById(buttonId);
  if (button) {
    button.style.display = "none";
  }
  const layer = parkTrailsLayers[parkKey];
  if (layer && map && map.hasLayer(layer)) {
    map.removeLayer(layer);
  }
}
