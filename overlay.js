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
