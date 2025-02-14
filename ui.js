// assets/js/ui.js

// Import trails configuration and data fetching functions.
import { trailsConfig, fetchTrailsData, removeParkTrailsToggleButton } from './trails.js';

// -----------------------------
// Spatial Filtering Helpers
// -----------------------------

/**
 * Check if two Leaflet bounds intersect.
 * @param {L.LatLngBounds} boundsA - The first bounds.
 * @param {L.LatLngBounds} boundsB - The second bounds.
 * @returns {boolean} - True if the bounds intersect.
 */
function boundsIntersect(boundsA, boundsB) {
  return boundsA.intersects(boundsB);
}

/**
 * Given a GeoJSON feature, create a temporary Leaflet layer to determine its bounds.
 * @param {Object} feature - A GeoJSON feature.
 * @returns {L.LatLngBounds} - The calculated bounds of the feature.
 */
function getFeatureBounds(feature) {
  if (!feature.geometry) return L.latLngBounds([]);
  const layer = L.geoJSON(feature);
  return layer.getBounds();
}

/**
 * Derives a park key from a unit name.
 * For example, if unitName contains "yosemite" (case-insensitive), returns "yosemite".
 * Modify this function as needed for your dataset.
 * @param {string} unitName 
 * @returns {string|null} - The park key, or null if none found.
 */
function getParkKeyFromUnitName(unitName) {
  unitName = unitName.toLowerCase();
  if (unitName.includes("yosemite")) return "yosemite";
  if (unitName.includes("yellowstone")) return "yellowstone";
  if (unitName.includes("zion")) return "zion";
    // Add additional conditions for other parks as needed.
  return null;
}

// -----------------------------
// Trails List Global State
// -----------------------------
let currentSortedTrails = [];
let selectedTrailLayer = null;

/**
 * Displays a single trail feature on the map.
 * Removes any previously added single trail layer and removes the general trails overlay.
 * Zooms the map to the bounds of the selected trail.
 * @param {Object} trailFeature - A GeoJSON feature for the trail.
 * @param {string} parkKey - The key for the park (if available).
 */
function showSingleTrail(trailFeature, parkKey) {
  // Remove any existing single trail layer.
  if (selectedTrailLayer && window.map.hasLayer(selectedTrailLayer)) {
    window.map.removeLayer(selectedTrailLayer);
  }
  // Remove general trails overlay if present.
  if (parkKey) {
    removeParkTrailsToggleButton(window.map, parkKey);
  }
  selectedTrailLayer = L.geoJSON(trailFeature, {
    style: { color: "#FF5733", weight: 3 },
    onEachFeature: function(feature, layer) {
      if (feature.properties) {
        let popupContent = "";
        Object.keys(feature.properties).forEach(key => {
          if (key !== '@id' && feature.properties[key] != null && feature.properties[key].toString().trim() !== "") {
            popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
          }
        });
        layer.bindPopup(popupContent);
      }
    }
  });
  window.map.addLayer(selectedTrailLayer);
  // Zoom to the bounds of the selected trail.
  const trailBounds = getFeatureBounds(trailFeature);
  if (trailBounds.isValid()) {
    window.map.fitBounds(trailBounds);
  }
}

// In ui.js (or a dedicated file), add:

function updateGlobalTrailsCounter() {
  const parkKeys = Object.keys(trailsConfig);
  let totalTrailsCount = 0;
  
  // Create an array of promises, one for each park's trails data.
  const promises = parkKeys.map(key => {
    return fetchTrailsData(key)
      .then(data => {
        if (data && data.features) {
          totalTrailsCount += data.features.length;
        }
      })
      .catch(error => {
        console.error(`Error fetching trails for ${key}:`, error);
      });
  });
  
  // Once all fetches are done, update the counter.
  Promise.all(promises).then(() => {
    const counterElem = document.getElementById('trailsTotal');
    if (counterElem) {
      // Format the number with commas (e.g., 1,000)
      counterElem.textContent = totalTrailsCount.toLocaleString();
    }
  });
}

// Call this function on initialization (or whenever appropriate)
updateGlobalTrailsCounter();

/**
 * Updates the trails list in the detail view.
 * Applies sorting and additional filtering based on the sort dropdown and filter checkboxes.
 * @param {Array} trails - Array of matching GeoJSON trail features.
 * @param {string} parkKey - The park key for which trails are being processed.
 */
function updateTrailsList(trails, parkKey) {
  // Get the sort option.
  const sortValue = document.getElementById("trailsSort").value;
  
  // Get selected filter checkboxes.
  const filterCheckboxes = document.querySelectorAll(".trailsFilterCheckbox");
  const selectedFilters = [];
  filterCheckboxes.forEach(cb => {
    if (cb.checked) {
      selectedFilters.push(cb.value);
    }
  });
  
  // Apply additional filtering.
  let filteredTrails = trails;
  if (selectedFilters.length > 0) {
    filteredTrails = trails.filter(feature => {
      return selectedFilters.some(prop => {
        const val = feature.properties[prop];
        return val != null && val.toString().trim() !== "";
      });
    });
  }
  
  // Apply sorting.
  let sortedTrails = [...filteredTrails]; // shallow copy
  if (sortValue === "name-asc") {
    sortedTrails.sort((a, b) => (a.properties.name || "").localeCompare(b.properties.name || ""));
  } else if (sortValue === "name-desc") {
    sortedTrails.sort((a, b) => (b.properties.name || "").localeCompare(a.properties.name || ""));
  } else if (sortValue === "length-asc") {
    sortedTrails.sort((a, b) => parseFloat(a.properties.length || 0) - parseFloat(b.properties.length || 0));
  } else if (sortValue === "length-desc") {
    sortedTrails.sort((a, b) => parseFloat(b.properties.length || 0) - parseFloat(a.properties.length || 0));
  }
  
  // Exclude any trail whose name (or default "Unnamed Trail") includes "unnamed"
  sortedTrails = sortedTrails.filter(feature => {
    let name = feature.properties.name;
    if (!name) {
      name = "Unnamed Trail";
    }
    return !name.toLowerCase().includes("unnamed");
  });
  
  // Update the Trails & POI Mapped counter.
    
  // Build the HTML list.
  const trailsListEl = document.getElementById("trailsDataList");
  trailsListEl.innerHTML = sortedTrails
    .map((feature, index) => {
      let name = feature.properties.name;
      if (!name) {
        name = "Unnamed Trail";
      }
      const length = feature.properties.length ? ` (Length: ${feature.properties.length})` : "";
      const route = feature.properties.route ? ` Route: ${feature.properties.route}` : "";
      const type = feature.properties.type ? ` Type: ${feature.properties.type}` : "";
      const natural = feature.properties.natural ? ` Natural: ${feature.properties.natural}` : "";
      const amenity = feature.properties.amenity ? ` Amenity: ${feature.properties.amenity}` : "";
      const tourism = feature.properties.tourism ? ` Tourism: ${feature.properties.tourism}` : "";
      return `<li data-index="${index}" style="cursor:pointer;">${name}${length}${route}${type}${natural}${amenity}${tourism}</li>`;
    })
    .join("");
  
  // Attach click events to each trail list item.
  document.querySelectorAll("#trailsDataList li").forEach(li => {
    li.addEventListener("click", function() {
      const index = parseInt(this.getAttribute("data-index"), 10);
      showSingleTrail(currentSortedTrails[index], parkKey);
    });
  });
}

// -----------------------------
// UI Setup Functions (Locations & Cases)
// -----------------------------

/**
 * Initialize the UI.
 * Preloads NP boundaries data and sets up info panel toggling.
 * @param {Function} updateMapForFilters - Callback to update the map.
 * @param {Function} populateCaseList - Callback to populate the case list.
 */
export function setupUI(updateMapForFilters, populateCaseList) {
  loadNPBoundariesData().catch(err => console.error("Error preloading NP boundaries:", err));
  setupInfoPanelToggle();
}

function setupInfoPanelToggle() {
  const switchToLocationsBtn = document.getElementById("switchToLocations");
  const switchToCasesBtn = document.getElementById("switchToCases");
  const locationControls = document.getElementById("locationControls");

  // When switching to Locations:
  switchToLocationsBtn.addEventListener("click", async () => {
    document.querySelector("#infoHeader h2").textContent = "Location List";
    switchToLocationsBtn.style.display = "none";
    switchToCasesBtn.style.display = "inline-block";
    locationControls.style.display = "block";
    document.getElementById("infoContent").innerHTML = "";
    await renderLocationList();
  });

  // When switching to Cases:
  switchToCasesBtn.addEventListener("click", () => {
    document.querySelector("#infoHeader h2").textContent = "Case List";
    switchToCasesBtn.style.display = "none";
    switchToLocationsBtn.style.display = "inline-block";
    locationControls.style.display = "none";
    document.getElementById("infoContent").innerHTML = "";
    renderCaseList();
  });

  // Setup event listeners for location search and sorting.
  document.getElementById("locationSearch").addEventListener("input", renderLocationList);
  document.getElementById("locationSort").addEventListener("change", renderLocationList);
}

async function loadNPBoundariesData() {
  try {
    const response = await fetch("https://themissinglist.com/data/US_National_Parks.geojson");
    const data = await response.json();
    if (data && data.features && data.features.length > 0) {
      window.nationalParksData = data;
      return true;
    } else {
      console.error("NP boundaries data is empty.");
      return false;
    }
  } catch (error) {
    console.error("Error loading NP boundaries data:", error);
    return false;
  }
}

async function renderLocationList() {
  const listContainer = document.getElementById("infoContent");

  // Ensure NP boundaries data is loaded.
  if (
    !window.nationalParksData ||
    !window.nationalParksData.features ||
    window.nationalParksData.features.length === 0
  ) {
    listContainer.innerHTML = "<p>Location data is loading. Please wait...</p>";
    const success = await loadNPBoundariesData();
    if (!success) {
      listContainer.innerHTML = "<p>Error loading location data.</p>";
      return;
    }
  }

  // Filter out features that lack valid geometry.
  let locations = window.nationalParksData.features.slice().filter(feature => feature.geometry);

  // Retrieve search and sort values.
  const searchValue = document.getElementById("locationSearch").value.trim().toLowerCase();
  const sortOption = document.getElementById("locationSort").value;

  if (searchValue) {
    locations = locations.filter(feature =>
      feature.properties.unit_name.toLowerCase().includes(searchValue)
    );
  }

  // Sort locations.
  locations.sort((a, b) => {
    const nameA = a.properties.unit_name.toLowerCase();
    const nameB = b.properties.unit_name.toLowerCase();
    if (sortOption === "az") return nameA.localeCompare(nameB);
    if (sortOption === "za") return nameB.localeCompare(nameA);
    if (sortOption === "largest") return (b.properties.area || 0) - (a.properties.area || 0);
    if (sortOption === "smallest") return (a.properties.area || 0) - (b.properties.area || 0);
    return 0;
  });

  // Remove duplicate locations by unit_name.
  const uniqueLocationsMap = {};
  locations.forEach(feature => {
    const name = feature.properties.unit_name;
    if (!uniqueLocationsMap[name]) {
      uniqueLocationsMap[name] = feature;
    }
  });
  const uniqueLocations = Object.values(uniqueLocationsMap).slice(0, 20);

  // Build the list HTML.
  let listHTML = "<ul style='list-style: none; padding: 0; margin: 0;'>";
  uniqueLocations.forEach((feature, idx) => {
    try {
      const parkName = feature.properties.unit_name;
      const tempLayer = L.geoJSON(feature);
      const bounds = tempLayer.getBounds();
      if (bounds && typeof bounds.getWest === "function") {
        const west = bounds.getWest(),
              south = bounds.getSouth(),
              east = bounds.getEast(),
              north = bounds.getNorth();
        if (isFinite(west) && isFinite(south) && isFinite(east) && isFinite(north)) {
          const bboxArray = [west, south, east, north];
          listHTML += `<li style="margin-bottom: 5px;">
                         <a href="#" class="locationLink" data-index="${idx}" data-bounds='${JSON.stringify(bboxArray)}' style="color: #0073aa; text-decoration: none;">
                           ${parkName}
                         </a>
                       </li>`;
        }
      }
    } catch (error) {
      console.error("Error processing feature:", feature, error);
    }
  });
  listHTML += "</ul>";
  listContainer.innerHTML = listHTML;
  document.querySelectorAll(".locationLink").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const npToggle = document.getElementById("npBoundariesToggleButton");
      if (npToggle && npToggle.innerHTML.trim() !== "Remove NP Boundaries") {
        npToggle.click();
      }
      const idx = parseInt(this.getAttribute("data-index"), 10);
      const feature = uniqueLocations[idx];
      const bboxArray = JSON.parse(this.getAttribute("data-bounds"));
      if (bboxArray && bboxArray.length === 4) {
        const [west, south, east, north] = bboxArray;
        const southWest = L.latLng(south, west);
        const northEast = L.latLng(north, east);
        const bounds = L.latLngBounds(southWest, northEast);
        if (window.map) {
          window.map.fitBounds(bounds);
        }
      }
      showLocationDetailView(feature);
    });
  });
}

function showLocationDetailView(locationFeature) {
  const infoContent = document.getElementById("infoContent");
  let html = `
    <button id="backToLocationList">Back to List</button>
    <h3>${locationFeature.properties.unit_name}</h3>
  `;
  if (locationFeature.properties.area) {
    html += `<p>Area: ${locationFeature.properties.area}</p>`;
  }
  if (locationFeature.properties.description) {
    html += `<p>${locationFeature.properties.description}</p>`;
  }
  html += `<div id="trailsList">
             <h4>Trails Data Points</h4>
             <label for="trailsSort">Sort By: </label>
             <select id="trailsSort">
               <option value="name-asc">Name A–Z</option>
               <option value="name-desc">Name Z–A</option>
               <option value="length-asc">Length (Low to High)</option>
               <option value="length-desc">Length (High to Low)</option>
             </select>
             <div id="trailsFilters" style="margin-top: 5px;">
               <label><input type="checkbox" class="trailsFilterCheckbox" value="route"> Route</label>
               <label><input type="checkbox" class="trailsFilterCheckbox" value="type"> Type</label>
               <label><input type="checkbox" class="trailsFilterCheckbox" value="natural"> Natural</label>
               <label><input type="checkbox" class="trailsFilterCheckbox" value="amenity"> Amenity</label>
               <label><input type="checkbox" class="trailsFilterCheckbox" value="tourism"> Tourism</label>
             </div>
             <ul id="trailsDataList"></ul>
           </div>`;
  infoContent.innerHTML = html;
  document.getElementById("backToLocationList").addEventListener("click", () => {
    if (window.map) {
      window.map.setView([39.8283, -98.5795], 4);
    }
    renderLocationList();
  });
  const parkKey = getParkKeyFromUnitName(locationFeature.properties.unit_name);
  if (parkKey && trailsConfig[parkKey]) {
    fetchTrailsData(parkKey)
      .then(geojsonData => {
        const locationLayer = L.geoJSON(locationFeature);
        const locationBounds = locationLayer.getBounds();
        console.log("Location bounds:", locationBounds);
        console.log("Total trails features:", geojsonData.features.length);
        const matchingTrails = geojsonData.features.filter(feature => {
          if (!feature.geometry) {
            console.error("Skipping feature due to missing geometry:", feature);
            return false;
          }
          const featureBounds = getFeatureBounds(feature);
          if (!featureBounds.isValid()) return false;
          return boundsIntersect(featureBounds, locationBounds);
        });
        console.log("Matching trails:", matchingTrails);
        updateTrailsList(matchingTrails, parkKey);
        document.getElementById("trailsSort").addEventListener("change", () => {
          updateTrailsList(matchingTrails, parkKey);
        });
        document.querySelectorAll(".trailsFilterCheckbox").forEach(cb => {
          cb.addEventListener("change", () => {
            updateTrailsList(matchingTrails, parkKey);
          });
        });
      })
      .catch(error => {
        console.error("Error fetching trails data:", error);
        document.getElementById("trailsDataList").innerHTML = "";
      });
  } else {
    document.getElementById("trailsDataList").innerHTML = "";
  }
  if (locationFeature && locationFeature.geometry) {
    const bounds = L.geoJSON(locationFeature).getBounds();
    if (bounds.isValid()) {
      window.map.fitBounds(bounds);
    }
  }
}

function renderCaseList() {
  if (typeof window.populateNamesList === "function") {
    window.populateNamesList();
  } else {
    document.getElementById("infoContent").innerHTML = "<p>Case list content goes here.</p>";
  }
}

export { renderLocationList, renderCaseList };