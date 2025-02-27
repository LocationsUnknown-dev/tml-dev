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
  "arches": {
    url: "https://themissinglist.com/data/nps/arches_np.geojson.gz"
  },
 "badlands": {
    url: "https://themissinglist.com/data/nps/badlands_np.geojson.gz"
  },
 "big": {
    url: "https://themissinglist.com/data/nps/bigbend_np.geojson.gz"
  },
 "biscayne": {
    url: "https://themissinglist.com/data/nps/biscayne_np.geojson.gz"
  },
 "crater": {
    url: "https://themissinglist.com/data/nps/crater_np.geojson.gz"
  },
 "rocky": {
    url: "https://themissinglist.com/data/nps/rocky_np.geojson.gz"
  },
 "rainier": {
    url: "https://themissinglist.com/data/nps/rainier_np.geojson.gz"
  },
 "carlsbad": {
    url: "https://themissinglist.com/data/nps/carlsbad_np.geojson.gz"
  },
 "adams": {
    url: "https://themissinglist.com/data/nps/adams_hp.geojson.gz"
  },
 "gunnison": {
    url: "https://themissinglist.com/data/nps/gunnison_np.geojson.gz"
  },
 "bryce": {
    url: "https://themissinglist.com/data/nps/bryce_np.geojson.gz"
  },
 "reef": {
    url: "https://themissinglist.com/data/nps/reef_np.geojson.gz"
  },
 "channel": {
    url: "https://themissinglist.com/data/nps/channel_np.geojson.gz"
  },
 "congaree": {
    url: "https://themissinglist.com/data/nps/congaree_np.geojson.gz"
  },
 "cuyahoga": {
    url: "https://themissinglist.com/data/nps/cuyahoga_np.geojson.gz"
  },
 "death": {
    url: "https://themissinglist.com/data/nps/death_np.geojson.gz"
  },
 "tortugas": {
    url: "https://themissinglist.com/data/nps/tortugas_np.geojson.gz"
  },
 "everglades": {
    url: "https://themissinglist.com/data/nps/everglades_np.geojson.gz"
  },
 "bay": {
    url: "https://themissinglist.com/data/nps/bay_np.geojson.gz"
  },
 "teton": {
    url: "https://themissinglist.com/data/nps/teton_np.geojson.gz"
  },
 "joshua": {
    url: "https://themissinglist.com/data/nps/joshua_np.geojson.gz"
  },
 "smoky": {
    url: "https://themissinglist.com/data/nps/smoky_np.geojson.gz"
  },
 "kings": {
    url: "https://themissinglist.com/data/nps/kings_np.geojson.gz"
  },
 "cascades": {
    url: "https://themissinglist.com/data/nps/cascades_np.geojson.gz"
  },
 "olympic": {
    url: "https://themissinglist.com/data/nps/olympic_np.geojson.gz"
  },
 "pinnacles": {
    url: "https://themissinglist.com/data/nps/pinnacles_np.geojson.gz"
  },
 "gateway": {
    url: "https://themissinglist.com/data/nps/gateway_np.geojson.gz"
  },
 "basin": {
    url: "https://themissinglist.com/data/nps/basin_np.geojson.gz"
  },
 "sand": {
    url: "https://themissinglist.com/data/nps/sand_np.geojson.gz"
  },
 "guadalupe": {
    url: "https://themissinglist.com/data/nps/guadalupe_np.geojson.gz"
  },
 "springs": {
    url: "https://themissinglist.com/data/nps/springs_np.geojson.gz"
  },
 "katmai": {
    url: "https://themissinglist.com/data/nps/katmai_np.geojson.gz"
  },
 "fjords": {
    url: "https://themissinglist.com/data/nps/fjords_np.geojson.gz"
  },
 "clark": {
    url: "https://themissinglist.com/data/nps/clark_np.geojson.gz"
  },
 "lassen": {
    url: "https://themissinglist.com/data/nps/lassen_np.geojson.gz"
  },
 "mammoth": {
    url: "https://themissinglist.com/data/nps/mammoth_np.geojson.gz"
  },
 "mesa": {
    url: "https://themissinglist.com/data/nps/mesa_np.geojson.gz"
  },

  // Add more parks as needed...
  "angeles": {
    url: "https://themissinglist.com/data/nfs/angeles_nf.geojson.gz"
  },
  "nicolet": {
    url: "https://themissinglist.com/data/nfs/nicolet_nf.geojson.gz"
  },
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
/**
 * Toggle the trails overlay for a given park.
 * @param {L.Map} map - The Leaflet map instance.
 * @param {string} parkKey - The normalized park key (e.g., "yosemite").
 */
export function toggleParkTrails(map, parkKey) {
  const layer = parkTrailsLayers[parkKey];
  if (layer && map.hasLayer(layer)) {
    console.log("Removing trails layer for park:", parkKey);
    map.removeLayer(layer);
    return;
  }
  if (layer) {
    console.log("Re-adding trails layer for park:", parkKey);
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
      // Decompress the gzipped data.
      const decompressed = window.pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
      const geojsonData = JSON.parse(decompressed);
      
      // Helper function to create a custom marker based on feature properties.
      function createCustomMarker(feature, latlng) {
        let iconUrl = null;
        if (feature.properties) {
          // Check "natural" property.
          if (feature.properties.natural) {
            const naturalVal = feature.properties.natural.trim().toLowerCase();
            if (naturalVal === "peak") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/placeholder_12339367.png";
            } else if (naturalVal === "spring") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/location_8085844.png";
            } else if (naturalVal === "arch") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/arches_18666823.png";
            } else if (naturalVal === "rock") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/stone_10163153.png";
            } else if (naturalVal === "cliff") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/nature_13992531.png";
            } else if (naturalVal === "gorge") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/canyon_10981901.png";
            } else if (naturalVal === "cave_entrance") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/cave_11420912.png";
            } else if (naturalVal === "tree") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/pin_3251129.png";
            }
          }
          // Check "amenity" property.
          if (!iconUrl && feature.properties.amenity) {
            const amenityVal = feature.properties.amenity.trim().toLowerCase();
            if (amenityVal === "parking") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/parking_652271.png";
            } else if (amenityVal === "toilets") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/bath_11539443.png";
            } else if (amenityVal === "drinking_water") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/water_9849745.png";
            } else if (amenityVal === "restaurant") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/location-pin_9425746.png";
            } else if (amenityVal === "shelter") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/home_5385604.png";
            }
          }
          // Check "tourism" property.
          if (!iconUrl && feature.properties.tourism) {
            const tourismVal = feature.properties.tourism.trim().toLowerCase();
            if (tourismVal === "information") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/search_3883726.png";
            } else if (tourismVal === "camp_site") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/fire_16775003.png";
            } else if (tourismVal === "museum") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/statue_13447259.png";
            }
          }
          // Check "leisure" property.
          if (!iconUrl && feature.properties.leisure) {
            const leisureVal = feature.properties.leisure.trim().toLowerCase();
            if (leisureVal === "picnic_table") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/picnic-table_17479031.png";
            }
          }
          // Check "waterway" property.
          if (!iconUrl && feature.properties.waterway) {
            const waterwayVal = feature.properties.waterway.trim().toLowerCase();
            if (waterwayVal === "waterfall") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/waterfall_2881906.png";
            }
          }
          // Check "historic" property.
          if (!iconUrl && feature.properties.historic) {
            const historicVal = feature.properties.historic.trim().toLowerCase();
            if (historicVal === "ruins") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/obelisk_1395095.png";
            } else if (historicVal === "archaeological_site") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/vase_1862599.png";
            } else if (historicVal === "mine" || historicVal === "mine_shaft") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/tools_13286009.png";
            } else if (historicVal === "wreck") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/shipwreck_3605350.png";
            } else if (historicVal === "memorial") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/tourism_3307738.png";
            } else if (historicVal === "boundary_stone") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/geology_6347983.png";
            }
          }
          // Check "geological" property.
          if (!iconUrl && feature.properties.geological) {
            const geologicalVal = feature.properties.geological.trim().toLowerCase();
            if (geologicalVal === "palaeontological_site") {
              iconUrl = "https://themissinglist.com/wp-content/uploads/2025/02/fossil_4937565.png";
            }
          }
        }
        if (iconUrl) {
          const customIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [32, 37],
            iconAnchor: [16, 37],
            popupAnchor: [0, -28]
          });
          return L.marker(latlng, { icon: customIcon });
        }
        return L.marker(latlng);
      }
      
      // Create a new GeoJSON layer with a custom pointToLayer callback.
      const newLayer = L.geoJSON(geojsonData, {
        style: { color: "#FF5733", weight: 3 },
        pointToLayer: function(feature, latlng) {
          if (feature.geometry && feature.geometry.type === "Point") {
            return createCustomMarker(feature, latlng);
          }
          return L.marker(latlng);
        },
        onEachFeature: function(feature, layer) {
          let popupContent = "";
          if (feature.properties) {
            Object.keys(feature.properties).forEach(key => {
              if (
                key !== '@id' &&
                feature.properties[key] != null &&
                feature.properties[key].toString().trim() !== ""
              ) {
                popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
              }
            });
            layer.bindPopup(popupContent);
          }
          layer.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            const bounds = layer.getBounds ? layer.getBounds() : null;
            if (bounds && bounds.isValid()) {
              map.fitBounds(bounds);
            }
            const parkNameLower = feature.properties && feature.properties.unit_name ? feature.properties.unit_name.toLowerCase() : "";
            let matchedKey = null;
            for (const key in trailsConfig) {
              if (parkNameLower.includes(key)) {
                matchedKey = key;
                break;
              }
            }
            if (matchedKey) {
              window.currentParkKey = matchedKey;
              const trailsBtn = document.getElementById("trailsToggleButton");
              if (trailsBtn) {
                trailsBtn.style.display = "block";
                trailsBtn.classList.remove("active-toggle");
              }
            } else {
              window.currentParkKey = null;
              const trailsBtn = document.getElementById("trailsToggleButton");
              if (trailsBtn) {
                trailsBtn.style.display = "none";
              }
            }
          });
        }
      });
      parkTrailsLayers[parkKey] = newLayer;
      map.addLayer(newLayer);
      console.log("Added trails layer for park:", parkKey);
    })
    .catch(error => {
      console.error(`Error loading trails for ${parkKey}:`, error);
    });
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