// assets/js/app.js

import { loadDataFromAPI } from './api.js';
import { initMap } from './map.js';
import { addMarkers, updateHeatLayer, removeHeatLayer } from './markers.js';
import { setupUI } from './ui.js';
import { toggleNPBoundaries, toggleStates } from './boundaries.js';

let missingData = [];
window.globalMaxDate = 0;

// Global variables to store filter settings for the case list.
let currentNameSearch = "";
let currentSortOption = "az";

// State variables.
let terrainMode = false;
let satelliteMode = false;
let statesMode = false;
let heatMapMode = false;
let playInterval = null;
let playIndex = 0;

const npBoundariesRef = { layer: null, nationalParksData: null };
const stateLayerRef = { layer: null };

const displayLabels = {
  "profile_picture": "Profile Picture",
  "name": "Name",
  "date_missing": "Date Missing",
  "status": "Status",
  "age": "Age",
  "gender": "Gender",
  "last_seen": "Last Seen",
  "case_link": "Case Link",
  "summary": "Summary",
  "park": "Park/Forest"
};

export function buildPopupContent(item) {
  return `
<div class="detail-card" style="max-width: 400px; margin: 0 auto; font-family: Arial, sans-serif; background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <div class="detail-header" style="text-align: center; margin-bottom: 15px;">
    <img src="${item.profile_picture}" alt="Profile Picture" style="width: 100px; height: auto; border-radius: 50%; border: 2px solid #ccc;">
  </div>
  <dl style="margin: 0;">
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Name:</dt>
    <dd style="margin: 0 0 10px;">${item.name}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Date Missing:</dt>
    <dd style="margin: 0 0 10px;">${item.date_missing}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Status:</dt>
    <dd style="margin: 0 0 10px;">${item.status || "N/A"}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Age:</dt>
    <dd style="margin: 0 0 10px;">${item.age}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Gender:</dt>
    <dd style="margin: 0 0 10px;">${item.gender}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Last Seen:</dt>
    <dd style="margin: 0 0 10px; white-space: normal;">${item.last_seen}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Summary:</dt>
    <dd style="margin: 0 0 10px;">${item.summary}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Park/Forest:</dt>
    <dd style="margin: 0 0 10px;">${item.park}</dd>
    <dt style="font-weight: bold; color: #333; margin-bottom: 5px;">Case Link:</dt>
    <dd style="margin: 0 0 10px;"><a href="${item.case_link}" target="_blank" style="color: #0073aa; text-decoration: none;">More Info</a></dd>
  </dl>
</div>
`;
}

function showDetailView(item) {
  // Build the detailed popup content using your helper function.
  const popupContent = buildPopupContent(item);
  // Update only the infoContent section so that the header remains intact.
  const infoContentDiv = document.getElementById("infoContent");
  infoContentDiv.innerHTML = `
    <button id="backButton" style="margin-bottom: 10px;">Back to List</button>
    <h3 style="margin-bottom: 15px;">Data Point Details</h3>
    ${popupContent}
  `;
  // Attach event listener to the Back button.
  document.getElementById("backButton").addEventListener("click", () => {
    // Reset the map view to the default center and zoom level.
    map.setView([39.8283, -98.5795], 4);
    // Re-render the default Case List.
    if (typeof renderCaseList === "function") {
      renderCaseList();
    } else if (typeof window.populateNamesList === "function") {
      window.populateNamesList();
    }
  });
  // Zoom in on the selected data point.
  const lat = parseFloat(item.latitude);
  const lng = parseFloat(item.longitude);
  if (!isNaN(lat) && !isNaN(lng)) {
    map.setView([lat, lng], 10);
  }
}

// Updated populateNamesList now only updates the infoContent area.
function populateNamesList() {
  const infoContent = document.getElementById("infoContent");
  infoContent.innerHTML = `
    <div id="namesSearch" style="margin-bottom: 10px;">
      <input type="text" id="nameSearch" placeholder="Search names..." style="width: 100%; padding: 5px; margin-bottom: 5px;" value="" />
      <select id="sortOption" style="width: 100%; padding: 5px;">
        <option value="az">A to Z</option>
        <option value="za">Z to A</option>
        <option value="recently_added">Recently Added</option>
        <option value="recently_updated">Recently Updated</option>
      </select>
    </div>
    <div id="namesList"></div>
  `;
  document.getElementById("nameSearch").addEventListener("input", function() {
    currentNameSearch = this.value;
    updateNamesList();
  });
  document.getElementById("sortOption").addEventListener("change", function() {
    currentSortOption = this.value;
    updateNamesList();
  });
  updateNamesList();
}

function updateNamesList() {
  const searchValue = document.getElementById("nameSearch").value.trim().toLowerCase();
  const sortOption = document.getElementById("sortOption").value;
  let filtered = missingData.filter(item => item.name && item.name.toLowerCase().includes(searchValue));
  if (sortOption === "az") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === "za") {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortOption === "recently_added" || sortOption === "recently_updated") {
    filtered.sort((a, b) => Date.parse(b.date_missing) - Date.parse(a.date_missing));
  }
  filtered = filtered.slice(0, 20);
  let listHTML = "<ul style='list-style: none; padding: 0; margin: 0;'>";
  filtered.forEach(item => {
    listHTML += `<li style="margin-bottom: 5px;"><a href="#" class="nameLink" data-lat="${item.latitude}" data-lng="${item.longitude}" data-index="${missingData.indexOf(item)}" style="color: #0073aa; text-decoration: none;">${item.name}</a></li>`;
  });
  listHTML += "</ul>";
  document.getElementById("namesList").innerHTML = listHTML;
  document.querySelectorAll(".nameLink").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const idx = link.getAttribute("data-index");
      const item = missingData[idx];
      const lat = parseFloat(link.getAttribute("data-lat"));
      const lng = parseFloat(link.getAttribute("data-lng"));
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 10);
      }
      showDetailView(item);
    });
  });
}

function filterData() {
  const ageSliderValue = parseFloat(document.getElementById("age").value);
  const dateSliderValue = parseInt(document.getElementById("dateSlider").value);
  const genderFilter = document.getElementById("gender").value;
  const summaryFilter = document.getElementById("summary").value.trim().toLowerCase();
  const parkFilter = document.getElementById("park").value.trim().toLowerCase();
  return missingData.filter(item => {
    let valid = true;
    let numericAge = parseFloat(item.age);
    if (isNaN(numericAge)) numericAge = 0;
    valid = valid && (numericAge <= ageSliderValue);
    let numericDate = Date.parse(item.date_missing);
    if (isNaN(numericDate)) numericDate = 0;
    valid = valid && (numericDate <= dateSliderValue);
    if (genderFilter) {
      valid = valid && (item.gender.toLowerCase() === genderFilter.toLowerCase());
    }
    if (summaryFilter) {
      valid = valid && (item.summary && item.summary.toLowerCase().includes(summaryFilter));
    }
    if (parkFilter) {
      valid = valid && (item.park && item.park.toLowerCase().includes(parkFilter));
    }
    return valid;
  });
}

function updateMapForFilters() {
  const filtered = filterData();
  
  if (heatMapMode) {
    updateHeatLayer(map, filtered);
  } else {
    addMarkers(map, filtered, buildPopupContent, showDetailView, markerCluster);
  }
  
  document.getElementById("caseTotal").textContent = filtered.length;
  
  const parkFilterValue = document.getElementById("park").value.trim().toLowerCase();
  if (parkFilterValue && npBoundariesRef.nationalParksData && npBoundariesRef.nationalParksData.features) {
    const matchingFeature = npBoundariesRef.nationalParksData.features.find(feature =>
      feature.properties.unit_name &&
      feature.properties.unit_name.toLowerCase().includes(parkFilterValue)
    );
    if (matchingFeature) {
      const tempLayer = L.geoJSON(matchingFeature);
      map.fitBounds(tempLayer.getBounds());
    }
  }
  
  // Count only unique locations by their unit_name.
  if (window.nationalParksData && window.nationalParksData.features) {
    const uniqueLocations = {};
    window.nationalParksData.features.forEach(feature => {
      if (feature.properties && feature.properties.unit_name) {
        uniqueLocations[feature.properties.unit_name] = true;
      }
    });
    const uniqueCount = Object.keys(uniqueLocations).length;
    document.getElementById("locationsTotal").textContent = uniqueCount;
  } else {
    document.getElementById("locationsTotal").textContent = 0;
  }
}

// ----------------------------------------------------------------------
// Map Initialization and Global Setup
// ----------------------------------------------------------------------
const { map, defaultTileLayer, terrainTileLayer, satelliteTileLayer, markerCluster } = initMap();
window.map = map; // Expose globally
window.populateNamesList = populateNamesList;

// Preload NP Boundaries (for Location List)
async function loadNPBoundariesData() {
  try {
    const response = await fetch("https://themissinglist.com/data/US_National_Parks.geojson");
    const data = await response.json();
    window.nationalParksData = data;
  } catch (error) {
    console.error("Error loading NP boundaries data:", error);
  }
}

// ----------------------------------------------------------------------
// UI and Data Initialization
// ----------------------------------------------------------------------
setupUI(updateMapForFilters, populateNamesList);
async function initializeData() {
  try {
    // Preload NP boundaries data
    await loadNPBoundariesData();
    missingData = await loadDataFromAPI();
    missingData.sort((a, b) => Date.parse(a.date_missing) - Date.parse(b.date_missing));
    let minDate = Infinity;
    let maxDate = -Infinity;
    missingData.forEach(item => {
      let d = Date.parse(item.date_missing) || 0;
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });
    window.globalMaxDate = maxDate;
    const dateSlider = document.getElementById("dateSlider");
    dateSlider.min = minDate;
    dateSlider.max = maxDate;
    dateSlider.value = maxDate;
    document.getElementById("dateValue").textContent = new Date(maxDate).toLocaleDateString();
    updateMapForFilters();
    populateNamesList();
  } catch (error) {
    console.error("Error loading data:", error);
    displayError("There was an error loading the map data. Please refresh the page and try again.");
  }
}

function displayError(message) {
  const existingError = document.getElementById("apiError");
  if (existingError) {
    existingError.remove();
  }
  const errorDiv = document.createElement("div");
  errorDiv.id = "apiError";
  errorDiv.style.backgroundColor = "#fdd";
  errorDiv.style.border = "1px solid #f00";
  errorDiv.style.padding = "10px";
  errorDiv.style.margin = "10px";
  errorDiv.style.textAlign = "center";
  errorDiv.textContent = message;
  const retryButton = document.createElement("button");
  retryButton.textContent = "Retry";
  retryButton.style.marginLeft = "10px";
  retryButton.addEventListener("click", () => {
    errorDiv.remove();
    initializeData();
  });
  errorDiv.appendChild(retryButton);
  const content = document.getElementById("content");
  if (content) {
    content.parentNode.insertBefore(errorDiv, content);
  } else {
    document.body.prepend(errorDiv);
  }
}

initializeData();

// ----------------------------------------------------------------------
// Filtering Event Listeners
// ----------------------------------------------------------------------
document.getElementById("age").addEventListener("input", function () {
  // Update the displayed Age value
  document.getElementById("ageValue").textContent = this.value;
  updateMapForFilters();
});

document.getElementById("dateSlider").addEventListener("input", function () {
  // Convert the slider value (timestamp) into a readable date and update the display
  const currentDate = parseInt(this.value);
  document.getElementById("dateValue").textContent = new Date(currentDate).toLocaleDateString();
  updateMapForFilters();
});

document.getElementById("gender").addEventListener("change", updateMapForFilters);
document.getElementById("summary").addEventListener("input", updateMapForFilters);
document.getElementById("park").addEventListener("input", updateMapForFilters);

document.getElementById("applyFilters").addEventListener("click", updateMapForFilters);

document.getElementById("resetFilters").addEventListener("click", function () {
  // Reset the filter inputs to their default values
  const ageInput = document.getElementById("age");
  ageInput.value = ageInput.max;
  document.getElementById("ageValue").textContent = ageInput.max;
  
  const dateSlider = document.getElementById("dateSlider");
  dateSlider.value = dateSlider.max;
  document.getElementById("dateValue").textContent = new Date(parseInt(dateSlider.max)).toLocaleDateString();
  
  document.getElementById("gender").value = "";
  document.getElementById("summary").value = "";
  document.getElementById("park").value = "";
  
  updateMapForFilters();
});

// ----------------------------------------------------------------------
// Additional Map Controls
// ----------------------------------------------------------------------
(function addExpandButtonToZoomControl() {
  setTimeout(() => {
    const zoomControl = document.querySelector('.leaflet-control-zoom.leaflet-bar');
    if (zoomControl) {
      const oldBtn = zoomControl.querySelector('#expandMapButton');
      if (oldBtn) oldBtn.remove();
      const expandButton = document.createElement('a');
      expandButton.id = 'expandMapButton';
      expandButton.href = "#";
      const zoomBtnWidth = zoomControl.firstElementChild ? zoomControl.firstElementChild.offsetWidth : 30;
      expandButton.style.display = 'block';
      expandButton.style.width = zoomBtnWidth + 'px';
      expandButton.style.height = '30px';
      expandButton.style.lineHeight = '30px';
      expandButton.style.textAlign = 'center';
      expandButton.style.backgroundImage = 'url("https://icons.veryicon.com/png/o/miscellaneous/gis-map-toolbar/expand-25.png")';
      expandButton.style.backgroundSize = '20px 20px';
      expandButton.style.backgroundRepeat = 'no-repeat';
      expandButton.style.backgroundPosition = 'center';
      expandButton.style.backgroundColor = 'rgba(255,255,255,0.8)';
      expandButton.style.border = '1px solid #ccc';
      expandButton.style.cursor = 'pointer';
      zoomControl.appendChild(expandButton);
      let mapExpanded = false;
      expandButton.addEventListener('click', function(e) {
        e.preventDefault();
        const contentContainer = document.getElementById("content");
        if (!mapExpanded) {
          contentContainer.classList.add("expanded");
          expandButton.style.transform = "rotate(180deg)";
          mapExpanded = true;
        } else {
          contentContainer.classList.remove("expanded");
          expandButton.style.transform = "rotate(0deg)";
          mapExpanded = false;
        }
        setTimeout(() => { map.invalidateSize(); }, 200);
      });
    }
  }, 500);
})();

// --------------------------
// Updated Satellite Toggle Code with Data Attribute Check
// --------------------------
try {
  // Get toggle button elements for all overlays and base layers
  const satelliteToggleButton = document.getElementById("satelliteToggleButton");
  const terrainToggleButton = document.getElementById("terrainToggleButton");
  const statesToggleButton = document.getElementById("statesToggleButton");
  const heatMapToggleButton = document.getElementById("heatMapToggleButton");
  const npBoundariesToggleButton = document.getElementById("npBoundariesToggleButton");
  const nationalForestToggleButton = document.getElementById("nationalForestToggleButton");

  if (
    !satelliteToggleButton ||
    !terrainToggleButton ||
    !statesToggleButton ||
    !heatMapToggleButton ||
    !npBoundariesToggleButton ||
    !nationalForestToggleButton
  ) {
    throw new Error("One or more toggle buttons not found in the DOM.");
  }

  // --- Store original markup for each button ---
  if (!satelliteToggleButton.dataset.original) {
    satelliteToggleButton.dataset.original = `
      <img src="http://themissinglist.com/wp-content/uploads/2025/02/signal-satellite.png" alt="Satellite Icon">
      <span>Satellite</span>
    `;
    satelliteToggleButton.innerHTML = satelliteToggleButton.dataset.original;
  }
  if (!terrainToggleButton.dataset.original) {
    terrainToggleButton.dataset.original = terrainToggleButton.innerHTML;
  }
  if (!statesToggleButton.dataset.original) {
    statesToggleButton.dataset.original = statesToggleButton.innerHTML;
  }
  if (!heatMapToggleButton.dataset.original) {
    heatMapToggleButton.dataset.original = `
      <img src="http://themissinglist.com/wp-content/uploads/2025/02/heat-map.png" alt="Heat Map Icon">
      <span>Heat Map</span>
    `;
    heatMapToggleButton.innerHTML = heatMapToggleButton.dataset.original;
  }
  if (!npBoundariesToggleButton.dataset.original) {
    // Assuming NP Boundaries button markup is already in your HTML.
    npBoundariesToggleButton.dataset.original = npBoundariesToggleButton.innerHTML;
  }
  // Update the National Forest toggle markup to use the new icon.
  if (!nationalForestToggleButton.dataset.original) {
    nationalForestToggleButton.dataset.original = `
      <img src="http://themissinglist.com/wp-content/uploads/2025/02/forest.png" alt="National Forest Icon">
      <span>Natl. Forest</span>
    `;
    nationalForestToggleButton.innerHTML = nationalForestToggleButton.dataset.original;
  }

  // --------------------------
  // Satellite Toggle Event Listener
  // --------------------------
  satelliteToggleButton.addEventListener("click", function() {
    satelliteMode = !satelliteMode;
    if (satelliteMode) {
      // Remove default and terrain layers.
      if (map.hasLayer(defaultTileLayer)) map.removeLayer(defaultTileLayer);
      if (map.hasLayer(terrainTileLayer)) map.removeLayer(terrainTileLayer);
      map.addLayer(satelliteTileLayer);
      satelliteToggleButton.innerHTML = satelliteToggleButton.dataset.original;
      // Reset other base layers and overlays.
      terrainMode = false;
      terrainToggleButton.innerHTML = terrainToggleButton.dataset.original;
      statesMode = false;
      statesToggleButton.innerHTML = statesToggleButton.dataset.original;
      if (heatMapMode) {
        removeHeatLayer(map);
        heatMapMode = false;
        heatMapToggleButton.innerHTML = heatMapToggleButton.dataset.original;
        map.addLayer(markerCluster);
      }
      if (window.npBoundariesRef && npBoundariesRef.layer && map.hasLayer(npBoundariesRef.layer)) {
        map.removeLayer(npBoundariesRef.layer);
        npBoundariesToggleButton.innerHTML = npBoundariesToggleButton.dataset.original;
        npBoundariesRef.layer = null;
      }
      if (window.nationalForestRef && nationalForestRef.layer && map.hasLayer(nationalForestRef.layer)) {
        map.removeLayer(nationalForestRef.layer);
        nationalForestToggleButton.innerHTML = nationalForestToggleButton.dataset.original;
        nationalForestRef.layer = null;
      }
    } else {
      if (map.hasLayer(satelliteTileButton)) map.removeLayer(satelliteTileLayer);
      map.addLayer(defaultTileLayer);
      satelliteToggleButton.innerHTML = satelliteToggleButton.dataset.original;
    }
    setTimeout(() => { map.invalidateSize(); }, 200);
  });

  // --------------------------
  // Terrain Toggle Event Listener
  // --------------------------
  terrainToggleButton.addEventListener("click", function() {
    terrainMode = !terrainMode;
    if (terrainMode) {
      if (map.hasLayer(defaultTileLayer)) map.removeLayer(defaultTileLayer);
      if (map.hasLayer(satelliteTileLayer)) map.removeLayer(satelliteTileLayer);
      map.addLayer(terrainTileLayer);
      terrainToggleButton.innerHTML = terrainToggleButton.dataset.original;
      if (satelliteToggleButton && satelliteToggleButton.dataset.original) {
        satelliteToggleButton.innerHTML = satelliteToggleButton.dataset.original;
      }
      statesMode = false;
      if (statesToggleButton && statesToggleButton.dataset.original) {
        statesToggleButton.innerHTML = statesToggleButton.dataset.original;
      }
      if (heatMapMode) {
        removeHeatLayer(map);
        heatMapMode = false;
        heatMapToggleButton.innerHTML = heatMapToggleButton.dataset.original;
        map.addLayer(markerCluster);
      }
      if (window.npBoundariesRef && npBoundariesRef.layer && map.hasLayer(npBoundariesRef.layer)) {
        map.removeLayer(npBoundariesRef.layer);
        npBoundariesToggleButton.innerHTML = npBoundariesToggleButton.dataset.original;
        npBoundariesRef.layer = null;
      }
      if (window.nationalForestRef && nationalForestRef.layer && map.hasLayer(nationalForestRef.layer)) {
        map.removeLayer(nationalForestRef.layer);
        nationalForestToggleButton.innerHTML = nationalForestToggleButton.dataset.original;
        nationalForestRef.layer = null;
      }
    } else {
      if (map.hasLayer(terrainTileLayer)) map.removeLayer(terrainTileLayer);
      map.addLayer(defaultTileLayer);
      terrainToggleButton.innerHTML = terrainToggleButton.dataset.original;
      if (satelliteToggleButton && satelliteToggleButton.dataset.original) {
        satelliteToggleButton.innerHTML = satelliteToggleButton.dataset.original;
      }
    }
    setTimeout(() => { map.invalidateSize(); }, 200);
  });

  // --------------------------
  // Heat Map Toggle Event Listener
  // --------------------------
  heatMapToggleButton.addEventListener("click", function() {
    heatMapMode = !heatMapMode;
    const span = heatMapToggleButton.querySelector("span");
    if (heatMapMode) {
      if (map.hasLayer(markerCluster)) map.removeLayer(markerCluster);
      updateHeatLayer(map, missingData);
      if (span) {
        span.textContent = "Remove Heat Map";
      }
    } else {
      removeHeatLayer(map);
      map.addLayer(markerCluster);
      heatMapToggleButton.innerHTML = heatMapToggleButton.dataset.original;
    }
    setTimeout(() => { map.invalidateSize(); }, 200);
  });

  // --------------------------
  // National Forest Toggle Event Listener
  // --------------------------
  if (typeof nationalForestRef === "undefined") {
    window.nationalForestRef = { layer: null };
  }
  nationalForestToggleButton.addEventListener("click", function() {
    toggleNationalForestBoundaries(map, nationalForestRef, this);
    setTimeout(() => { map.invalidateSize(); }, 200);
  });

} catch (e) {
  console.error("Error setting up toggles:", e);
}

// --------------------------
// NP Boundaries Toggle Event Listener
// --------------------------
if (typeof npBoundariesRef === "undefined") {
  window.npBoundariesRef = { layer: null };
}
document.getElementById("npBoundariesToggleButton").addEventListener("click", function() {
  toggleNPBoundaries(map, npBoundariesRef, this);
  setTimeout(() => { map.invalidateSize(); }, 200);
});

// --------------------------
// States Toggle Event Listener
// --------------------------
if (typeof stateLayerRef === "undefined") {
  window.stateLayerRef = { layer: null };
}
document.getElementById("statesToggleButton").addEventListener("click", function() {
  toggleStates(map, stateLayerRef, this, missingData, addMarkers, buildPopupContent, showDetailView);
  setTimeout(() => { map.invalidateSize(); }, 200);
});

// --------------------------
// Function to toggle National Forest Boundaries overlay
// --------------------------
function toggleNationalForestBoundaries(map, nfRef, button) {
  if (nfRef.layer && map.hasLayer(nfRef.layer)) {
    map.removeLayer(nfRef.layer);
    button.innerHTML = button.dataset.original;
    nfRef.layer = null;
  } else {
    if (nfRef.layer) {
      map.addLayer(nfRef.layer);
      // Instead of replacing the full markup, update only the label text.
      const span = button.querySelector("span");
      if (span) {
        span.textContent = "Remove Natl. Forest";
      }
    } else {
      fetch("https://themissinglist.com/data/National_Forest_Boundaries.geojson.gz")
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const decompressed = window.pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
          const geojsonData = JSON.parse(decompressed);
          const layer = L.geoJSON(geojsonData, {
            style: feature => ({ color: "blue", weight: 2, fillOpacity: 0.1 }),
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
                  }
                });
              }
            }
          });
          map.addLayer(layer);
          nfRef.layer = layer;
          window.nationalForestData = geojsonData;
          // Update only the label text while keeping the icon intact.
          const span = button.querySelector("span");
          if (span) {
            span.textContent = "Remove Natl. Forest";
          }
        })
        .catch(error => console.error("Error loading National Forest Boundaries GeoJSON:", error));
    }
  }
}

// ----------------------------------------------------------------------
// Playback controls.
document.getElementById("playButton").addEventListener("click", function() {
  if (playInterval) return;
  playIndex = 0;
  playInterval = setInterval(() => {
    if (playIndex < missingData.length) {
      const currentDate = Date.parse(missingData[playIndex].date_missing);
      document.getElementById("dateSlider").value = currentDate;
      document.getElementById("dateValue").textContent = new Date(currentDate).toLocaleDateString();
      updateMapForFilters();
      showDetailView(missingData[playIndex]);
      playIndex++;
    } else {
      document.getElementById("dateSlider").value = document.getElementById("dateSlider").max;
      document.getElementById("dateValue").textContent = new Date(document.getElementById("dateSlider").max).toLocaleDateString();
      updateMapForFilters();
      clearInterval(playInterval);
      playInterval = null;
      playIndex = 0;
      populateNamesList();
    }
  }, 1000);
});

document.getElementById("pauseButton").addEventListener("click", function() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
    populateNamesList();
  }
});

document.getElementById("stopButton").addEventListener("click", function() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
  playIndex = 0;
  document.getElementById("dateSlider").value = document.getElementById("dateSlider").max;
  document.getElementById("dateValue").textContent = new Date(document.getElementById("dateSlider").max).toLocaleDateString();
  updateMapForFilters();
  populateNamesList();
});

// Refresh API data every 5 minutes.
setInterval(initializeData, 300000);
console.log("App initialized.");