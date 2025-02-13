// assets/js/ui.js

// Import trails configuration and data fetching functions.
import { trailsConfig, fetchTrailsData } from './trails.js';

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
  // Add additional conditions for other parks as needed.
  return null;
}

/**
 * Updates the trails list in the detail view based on the provided trails array
 * and the current sort selection.
 * @param {Array} trails - Array of GeoJSON features representing trails.
 */
function updateTrailsList(trails) {
  const sortValue = document.getElementById("trailsSort").value;
  let sortedTrails = [...trails]; // shallow copy
  if (sortValue === "name-asc") {
    sortedTrails.sort((a, b) => (a.properties.name || "").localeCompare(b.properties.name || ""));
  } else if (sortValue === "name-desc") {
    sortedTrails.sort((a, b) => (b.properties.name || "").localeCompare(a.properties.name || ""));
  } else if (sortValue === "length-asc") {
    sortedTrails.sort((a, b) => parseFloat(a.properties.length || 0) - parseFloat(b.properties.length || 0));
  } else if (sortValue === "length-desc") {
    sortedTrails.sort((a, b) => parseFloat(b.properties.length || 0) - parseFloat(a.properties.length || 0));
  }
  const trailsListEl = document.getElementById("trailsDataList");
  trailsListEl.innerHTML = sortedTrails
    .map(feature => {
      const name = feature.properties.name || "Unnamed Trail";
      // Optionally show additional details (e.g., length).
      const length = feature.properties.length ? ` (Length: ${feature.properties.length})` : "";
      return `<li>${name}${length}</li>`;
    })
    .join("");
}

// -----------------------------
// UI Setup Functions
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

  // Attach click events to location links.
  document.querySelectorAll(".locationLink").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      // Toggle NP Boundaries if not active.
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

/**
 * Displays the detailed view for a selected location,
 * including a list of trails data points with filtering options.
 * @param {Object} locationFeature - The selected location's GeoJSON feature.
 */
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
  // Trails Data Points section with a sort dropdown.
  html += `<div id="trailsList">
             <h4>Trails Data Points</h4>
             <label for="trailsSort">Sort By: </label>
             <select id="trailsSort">
               <option value="name-asc">Name A–Z</option>
               <option value="name-desc">Name Z–A</option>
               <option value="length-asc">Length (Low to High)</option>
               <option value="length-desc">Length (High to Low)</option>
             </select>
             <ul id="trailsDataList"></ul>
           </div>`;
  infoContent.innerHTML = html;

  document.getElementById("backToLocationList").addEventListener("click", () => {
    if (window.map) {
      window.map.setView([39.8283, -98.5795], 4);
    }
    renderLocationList();
  });

  // Derive the park key from the location's unit name.
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
        // Store the matching trails in a variable for re-sorting.
        let currentMatchingTrails = matchingTrails;
        // Initially update the trails list.
        updateTrailsList(currentMatchingTrails);
        // Add event listener to the trailsSort dropdown.
        document.getElementById("trailsSort").addEventListener("change", () => {
          updateTrailsList(currentMatchingTrails);
        });
      })
      .catch(error => {
        console.error("Error fetching trails data:", error);
        document.getElementById("trailsDataList").innerHTML = "";
      });
  } else {
    document.getElementById("trailsDataList").innerHTML = "";
  }

  // Optionally, zoom to the location's bounds.
  if (locationFeature && locationFeature.geometry) {
    const bounds = L.geoJSON(locationFeature).getBounds();
    if (bounds.isValid()) {
      window.map.fitBounds(bounds);
    }
  }
}

/**
 * Renders the case list into the info panel.
 */
function renderCaseList() {
  if (typeof window.populateNamesList === "function") {
    window.populateNamesList();
  } else {
    document.getElementById("infoContent").innerHTML = "<p>Case list content goes here.</p>";
  }
}

export { renderLocationList, renderCaseList };
