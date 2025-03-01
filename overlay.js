export function initNationalForestOverlay(map, nfRef, button) {
  console.log("Initializing National Forest overlay...");

  const NF_GEOJSON_URL = "https://themissinglist.com/data/National_Forest_Boundaries.geojson.gz";
  const NF_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRkfJOclHLLJbOjY0uvT1FRP2fyDcLBl-fqQnFywjDMb8UgKxLN9bSnlG_VjBrwi8ns63G0pv_kU3f/pub?output=csv";

  fetch(NF_CSV_URL)
    .then(response => response.text())
    .then(csvText => {
      let csvData;
      if (typeof Papa !== "undefined") {
        csvData = Papa.parse(csvText, { header: true }).data;
      } else {
        csvData = csvText
          .split("\n")
          .slice(1)
          .filter(line => line.trim() !== "")
          .map(line => {
            const cols = line.split(",");
            return {
              OBJECTID: cols[0],
              ADMINFORESTID: cols[1],
              REGION: cols[2],
              FORESTNUMBER: cols[3],
              FORESTORGCODE: cols[4],
              feature_properties: cols[5],
              FORESTNAME: cols[6],
              GIS_ACRES: cols[7],
              SHAPELEN: cols[8],
              SHAPEAREA: cols[9]
            };
          });
      }
      console.log("NF CSV data loaded:", csvData);
      const nfLookup = {};
      csvData.forEach(row => {
        if (row.feature_properties) {
          const key = row.feature_properties.trim().toLowerCase();
          nfLookup[key] = row;
        }
      });
      return nfLookup;
    })
    .then(nfLookup => {
      return fetch(NF_GEOJSON_URL)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const decompressed = window.pako.ungzip(
            new Uint8Array(arrayBuffer),
            { to: "string" }
          );
          const geojsonData = JSON.parse(decompressed);
          console.log("NF GeoJSON loaded:", geojsonData);
          return { geojsonData, nfLookup };
        });
    })
    .then(({ geojsonData, nfLookup }) => {
      const nfLayer = L.geoJSON(geojsonData, {
        nfOverlay: true,
        style: function(feature) {
          return { color: "blue", weight: 2, fillOpacity: 0.1 };
        },
        onEachFeature: function(feature, layer) {
          const forestName =
            (feature.properties.FORESTNAME ||
              feature.properties.unit_name ||
              feature.properties.name ||
              "Unknown Forest").trim();
          const simplified = forestName.toLowerCase().replace(/[^a-z]/g, "");
          const lookupData = nfLookup[simplified];
          const displayName = lookupData ? lookupData.FORESTNAME : forestName;
          const uniqueId = lookupData ? lookupData.ADMINFORESTID : null;
          layer.bindPopup("<strong>" + displayName + "</strong>");
          layer.on("click", function(e) {
            L.DomEvent.stopPropagation(e);
            layer.openPopup();
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds);
            }
            feature.properties.standardId = uniqueId;
            feature.properties.simpleId = simplified;
            if (typeof window.showLocationDetailView === "function") {
              window.showLocationDetailView(feature, true);
              console.log("showLocationDetailView called for NF feature:", displayName);
            }
            if (uniqueId) {
              window.currentParkKey = simplified;
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
          layer.on("add", function() {
            const el = layer.getElement && layer.getElement();
            if (el) {
              el.style.pointerEvents = "auto";
            }
          });
        }
      });
      nfRef.layer = nfLayer;
      if (button) {
        button.innerHTML = button.dataset.original || "<span>National Forest</span>";
      }
      console.log("NF overlay initialized; layer is loaded but not added to the map.");
    })
    .catch(error =>
      console.error("Error initializing National Forest overlay:", error)
    );
}

export function toggleNationalForestOverlay(map, nfRef, button) {
  if (nfRef.layer && map.hasLayer(nfRef.layer)) {
    map.removeLayer(nfRef.layer);
    if (button) {
      button.innerHTML = button.dataset.original || "<span>National Forest</span>";
    }
    console.log("NF overlay removed from map.");
  } else if (nfRef.layer) {
    map.addLayer(nfRef.layer);
    if (button) {
      button.innerHTML = "Remove Natl. Forest";
    }
    console.log("NF overlay added to map.");
  } else {
    console.warn("NF overlay not loaded yet.");
  }
}
export function toggleBLMWLDNOverlay(map, blmRef, button) {
  if (!button) {
    console.error("BLM WLDN toggle button not found.");
    return;
  }
  
  // Initialize the button's original markup if not already set.
  if (!button.dataset.original) {
    button.dataset.original = button.innerHTML;
  }
  
  if (blmRef.layer && map.hasLayer(blmRef.layer)) {
    console.log("Removing BLM WLDN overlay layer");
    map.removeLayer(blmRef.layer);
    button.innerHTML = button.dataset.original;
    blmRef.layer = null;
  } else {
    if (blmRef.layer) {
      console.log("Re-adding BLM WLDN overlay layer");
      map.addLayer(blmRef.layer);
      button.innerHTML = "Remove BLM WLDN Area";
    } else {
      console.log("Fetching BLM WLDN Overlay GeoJSON");
      fetch("https://themissinglist.com/data/BLM_Natl_Wilderness_Areas.geojson.gz")
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          // Decompress the gzipped data using pako
          const decompressed = window.pako.ungzip(new Uint8Array(arrayBuffer), { to: "string" });
          const geojsonData = JSON.parse(decompressed);
          // Create a GeoJSON layer with a style and interaction similar to the NP overlay.
          const layer = L.geoJSON(geojsonData, {
            // Tag this layer as a BLM overlay (optional)
            blmOverlay: true,
            // Use a style similar to the NP overlay but with a distinct color (orange in this case)
            style: feature => ({ color: "#FF8C00", weight: 2, fillOpacity: 0.1 }),
            onEachFeature: function(feature, layer) {
              const displayName = (feature.properties && feature.properties.NLCS_NAME) 
                                  ? feature.properties.NLCS_NAME 
                                  : "BLM WLDN Area";
              layer.bindPopup("<strong>" + displayName + "</strong>");
              layer.on("click", function(e) {
                L.DomEvent.stopPropagation(e);
                const bounds = layer.getBounds();
                if (bounds && bounds.isValid()) {
                  map.fitBounds(bounds);
                }
                if (typeof window.showLocationDetailView === "function") {
                  window.showLocationDetailView(feature, true);
                }
                // Optionally set a current key for additional integration (e.g. trails)
                window.currentParkKey = "blm_wldn";
              });
            }
          });
          map.addLayer(layer);
          blmRef.layer = layer;
          button.innerHTML = "Remove BLM WLDN Area";
          console.log("BLM WLDN overlay layer added");
        })
        .catch(error => {
          console.error("Error loading BLM WLDN overlay GeoJSON:", error);
        });
    }
  }
}
