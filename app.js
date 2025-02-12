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
  const popupContent = buildPopupContent(item);
  const infoDiv = document.getElementById("info");
  infoDiv.innerHTML = `<button id="backButton" style="margin-bottom: 10px;">Back to List</button><h3 style="margin-bottom: 15px;">Data Point Details</h3>${popupContent}`;
  document.getElementById("backButton").addEventListener("click", () => {
    populateNamesList();
    map.setView([39.8283, -98.5795], 4);
  });
  const lat = parseFloat(item.latitude);
  const lng = parseFloat(item.longitude);
  if (!isNaN(lat) && !isNaN(lng)) {
    map.setView([lat, lng], 10);
  }
}

function populateNamesList() {
  const infoDiv = document.getElementById("info");
  infoDiv.innerHTML = `
    <h3 style="margin-bottom: 15px;">Case List</h3>
    <div id="namesSearch" style="margin-bottom: 10px;">
      <input type="text" id="nameSearch" placeholder="Search names..." style="width: 100%; padding: 5px; margin-bottom: 5px;" value="${currentNameSearch}" />
      <select id="sortOption" style="width: 100%; padding: 5px;">
        <option value="az" ${currentSortOption === "az" ? "selected" : ""}>A to Z</option>
        <option value="za" ${currentSortOption === "za" ? "selected" : ""}>Z to A</option>
        <option value="recently_added" ${currentSortOption === "recently_added" ? "selected" : ""}>Recently Added</option>
        <option value="recently_updated" ${currentSortOption === "recently_updated" ? "selected" : ""}>Recently Updated</option>
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
  // UPDATED: Use the summary field for filtering.
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
  
  // If a park filter is applied and NP boundaries data is available, zoom to matching feature.
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
}

// Initialize map and extract objects.
const { map, defaultTileLayer, terrainTileLayer, satelliteTileLayer, markerCluster } = initMap();
window.map = map; // Expose globally if needed

// Setup UI events.
setupUI(updateMapForFilters, populateNamesList);

// Function to display front-end error messages.
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

// Load API data with error handling.
async function initializeData() {
  try {
    missingData = await loadDataFromAPI();
    // Sort data by date_missing (oldest first) for playback.
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
initializeData();

// --- Append Expand Map Button to the Zoom Control ---
(function addExpandButtonToZoomControl() {
  // Wait for the zoom control to be added by Leaflet.
  setTimeout(() => {
    const zoomControl = document.querySelector('.leaflet-control-zoom.leaflet-bar');
    if (zoomControl) {
      // Remove any previous instance of the expand button.
      const oldBtn = zoomControl.querySelector('#expandMapButton');
      if (oldBtn) oldBtn.remove();

      // Create the new expand button element.
      const expandButton = document.createElement('a');
      expandButton.id = 'expandMapButton';
      expandButton.href = "#";
      
      // Get the width of an existing zoom button.
      const zoomBtnWidth = zoomControl.firstElementChild ? zoomControl.firstElementChild.offsetWidth : 30;
      expandButton.style.display = 'block';
      expandButton.style.width = zoomBtnWidth + 'px';
      expandButton.style.height = '30px';
      expandButton.style.lineHeight = '30px';
      expandButton.style.textAlign = 'center';
      // Use the provided icon.
      expandButton.style.backgroundImage = 'url("https://icons.veryicon.com/png/o/miscellaneous/gis-map-toolbar/expand-25.png")';
      expandButton.style.backgroundSize = '20px 20px';
      expandButton.style.backgroundRepeat = 'no-repeat';
      expandButton.style.backgroundPosition = 'center';
      // Set a white semi-transparent background and border.
      expandButton.style.backgroundColor = 'rgba(255,255,255,0.8)';
      expandButton.style.border = '1px solid #ccc';
      expandButton.style.cursor = 'pointer';
      
      // Append the expand button as the last child of the zoom control.
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

// Toggle layer and playback event listeners.
document.getElementById("satelliteToggleButton").addEventListener("click", function() {
  satelliteMode = !satelliteMode;
  if (satelliteMode) {
    if (map.hasLayer(defaultTileLayer)) map.removeLayer(defaultTileLayer);
    if (map.hasLayer(terrainTileLayer)) map.removeLayer(terrainTileLayer);
    map.addLayer(satelliteTileLayer);
    this.innerHTML = "Default";
    terrainMode = false;
    document.getElementById("terrainToggleButton").innerHTML = "Terrain";
    statesMode = false;
    document.getElementById("statesToggleButton").innerHTML = "States";
    if (heatMapMode) {
      removeHeatLayer(map);
      heatMapMode = false;
      document.getElementById("heatMapToggleButton").innerHTML = "Heat Map";
      map.addLayer(markerCluster);
    }
  } else {
    if (map.hasLayer(satelliteTileLayer)) map.removeLayer(satelliteTileLayer);
    map.addLayer(defaultTileLayer);
    this.innerHTML = "Satellite";
  }
  setTimeout(() => { map.invalidateSize(); }, 200);
});

document.getElementById("terrainToggleButton").addEventListener("click", function() {
  terrainMode = !terrainMode;
  if (terrainMode) {
    if (map.hasLayer(defaultTileLayer)) map.removeLayer(defaultTileLayer);
    if (map.hasLayer(satelliteTileLayer)) map.removeLayer(satelliteTileLayer);
    map.addLayer(terrainTileLayer);
    this.innerHTML = "Default";
    satelliteMode = false;
    document.getElementById("satelliteToggleButton").innerHTML = "Satellite";
    statesMode = false;
    document.getElementById("statesToggleButton").innerHTML = "States";
    if (heatMapMode) {
      removeHeatLayer(map);
      heatMapMode = false;
      document.getElementById("heatMapToggleButton").innerHTML = "Heat Map";
      map.addLayer(markerCluster);
    }
  } else {
    if (map.hasLayer(terrainTileLayer)) map.removeLayer(terrainTileLayer);
    map.addLayer(defaultTileLayer);
    this.innerHTML = "Terrain";
  }
  setTimeout(() => { map.invalidateSize(); }, 200);
});

document.getElementById("npBoundariesToggleButton").addEventListener("click", function() {
  toggleNPBoundaries(map, npBoundariesRef, this);
});

document.getElementById("statesToggleButton").addEventListener("click", function() {
  toggleStates(map, stateLayerRef, this, missingData, addMarkers, buildPopupContent, showDetailView);
  setTimeout(() => { map.invalidateSize(); }, 200);
});

document.getElementById("heatMapToggleButton").addEventListener("click", function() {
  heatMapMode = !heatMapMode;
  if (heatMapMode) {
    if (map.hasLayer(markerCluster)) map.removeLayer(markerCluster);
    updateHeatLayer(map, missingData);
    this.innerHTML = "Remove Heat Map";
  } else {
    removeHeatLayer(map);
    map.addLayer(markerCluster);
    this.innerHTML = "Heat Map";
  }
  setTimeout(() => { map.invalidateSize(); }, 200);
});

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
