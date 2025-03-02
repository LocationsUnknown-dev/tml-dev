// assets/js/ui.js

// Import trails configuration and data fetching functions.
import { trailsConfig, fetchTrailsData, removeParkTrailsToggleButton, toggleParkTrails } from './trails.js';
window.showLocationDetailView = function(feature) {
  console.warn("showLocationDetailView placeholder invoked.");
};
window.autoNPOverlay = false;
window.autoNFOverlay = false;

// -----------------------------
// Spatial Filtering Helpers
// -----------------------------

// A helper to remove any NP and NF overlays.
function clearOverlays() {
  // Remove NP overlay if present.
  if (window.npBoundariesRef && window.npBoundariesRef.layer && window.map.hasLayer(window.npBoundariesRef.layer)) {
    window.map.removeLayer(window.npBoundariesRef.layer);
    window.npBoundariesRef.layer = null;
    const npBtn = document.getElementById("npBoundariesToggleButton");
    if (npBtn && npBtn.dataset.original) {
      npBtn.innerHTML = npBtn.dataset.original;
    }
  }
  // Remove NF overlay if present.
  if (window.nationalForestRef && window.nationalForestRef.layer && window.map.hasLayer(window.nationalForestRef.layer)) {
    window.map.removeLayer(window.nationalForestRef.layer);
    window.nationalForestRef.layer = null;
    window.autoNFOverlay = false;
    const nfBtn = document.getElementById("nationalForestToggleButton");
    if (nfBtn && nfBtn.dataset.original) {
      nfBtn.innerHTML = nfBtn.dataset.original;
    }
  }
}

// A helper to get a display name for a location feature.
function getLocationName(feature) {
  const props = feature.properties || {};
  return (
    props.unit_name ||
    props.UNIT_NAME ||
    props.FORESTNAME ||
    props.NLCS_NAME ||
    props.name ||
    props.NAME ||
    "Unnamed Location"
  ).trim();
}

// A helper to select a feature in an overlay.
function autoClickOverlayFeature(overlayLayer, locationFeature) {
  if (!overlayLayer) {
    console.warn("Overlay layer is not available yet.");
    return;
  }
  const targetName = getLocationName(locationFeature).toLowerCase().trim();
  let found = false;
  overlayLayer.eachLayer(layer => {
    if (layer.feature) {
      const layerName = getLocationName(layer.feature).toLowerCase().trim();
      console.log("Comparing overlay feature:", layerName, "with target:", targetName);
      // Check if one name contains the other
      if (layerName.indexOf(targetName) !== -1 || targetName.indexOf(layerName) !== -1) {
        console.log("Found matching overlay feature:", layerName, ". Firing click.");
        layer.fire("click");
        found = true;
      }
    }
  });
  if (!found) {
    console.warn("No matching overlay feature found for target:", targetName);
  }
}

/**
 * Check if two Leaflet bounds intersect.
 */
function boundsIntersect(boundsA, boundsB) {
  return boundsA.intersects(boundsB);
}

/**
 * Given a GeoJSON feature, determine its bounds.
 */
function getFeatureBounds(feature) {
  if (!feature.geometry) return L.latLngBounds([]);
  if (feature.geometry.type === 'Point') {
    const coords = feature.geometry.coordinates;
    const latlng = L.latLng(coords[1], coords[0]);
    return L.latLngBounds(latlng, latlng);
  }
  if (feature.geometry.type === 'MultiPoint') {
    const latlngs = feature.geometry.coordinates.map(coord => L.latLng(coord[1], coord[0]));
    return L.latLngBounds(latlngs);
  }
  const layer = L.geoJSON(feature);
  return layer.getBounds();
}

/**
 * Derives a park key from a unit name.
 */
function getParkKeyFromUnitName(unitName) {
  if (!unitName) return null;
  unitName = unitName.toLowerCase();
  
  for (const key in trailsConfig) {
    if (unitName.includes(key)) {
      return key;
    }
  }
  return null;
}

function getForestName(feature) {
  if (!feature.properties) return "Unnamed Forest";
  // Try using FORESTNAME first, then fallback to unit_name or name.
  return (
    feature.properties.FORESTNAME ||
    feature.properties.unit_name ||
    feature.properties.name ||
    "Unnamed Forest"
  ).trim();
}

// -----------------------------
// Trails List Global State
// -----------------------------
let currentSortedTrails = [];
let selectedTrailLayer = null;

function showSingleTrail(trailFeature, parkKey) {
  // Remove any existing single trail layer from the map.
  if (selectedTrailLayer && window.map.hasLayer(selectedTrailLayer)) {
    window.map.removeLayer(selectedTrailLayer);
  }
  // If a park key is provided, remove its trails toggle button.
  if (parkKey) {
    removeParkTrailsToggleButton(window.map, parkKey);
  }
  // Create a new GeoJSON layer with a custom pointToLayer callback.
  selectedTrailLayer = L.geoJSON(trailFeature, {
    style: { color: "#FF5733", weight: 3 },
    pointToLayer: function(feature, latlng) {
      // Check if this feature is a Point.
      if (feature.geometry && feature.geometry.type === "Point") {
        // If the feature has a 'natural' property equal to "peak", use the custom icon.
        if (
          feature.properties &&
          typeof feature.properties.natural === "string" &&
          feature.properties.natural.trim().toLowerCase() === "peak"
        ) {
          const customTrailIcon = L.icon({
            iconUrl: "https://themissinglist.com/wp-content/uploads/2025/02/placeholder_12339367.png",
            iconSize: [32, 37],
            iconAnchor: [16, 37],
            popupAnchor: [0, -28]
          });
          return L.marker(latlng, { icon: customTrailIcon });
        } else {
          // Otherwise, use the default marker.
          return L.marker(latlng);
        }
      }
      // Fallback in case geometry is missing.
      return L.marker(latlng);
    },
    onEachFeature: function(feature, layer) {
      // Build popup content from all properties except '@id'
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
  // Add the single trail layer to the map.
  window.map.addLayer(selectedTrailLayer);
  
  // Zoom the map to the bounds of the trail feature.
  const trailBounds = getFeatureBounds(trailFeature);
  if (trailBounds.isValid()) {
    if (trailBounds.getNorth() === trailBounds.getSouth() && trailBounds.getEast() === trailBounds.getWest()) {
      window.map.setView(trailBounds.getCenter(), 14);
    } else {
      window.map.fitBounds(trailBounds);
    }
  }
  
  // Optionally, open popups on all layers in the single trail layer.
  selectedTrailLayer.eachLayer(function(layer) {
    layer.openPopup();
  });
}

function updateGlobalTrailsCounter() {
  const parkKeys = Object.keys(trailsConfig);
  let totalTrailsCount = 0;
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
  Promise.all(promises).then(() => {
    const counterElem = document.getElementById('trailsTotal');
    if (counterElem) {
      counterElem.textContent = totalTrailsCount.toLocaleString();
    }
  });
}
updateGlobalTrailsCounter();

function updateTrailsList(trails, parkKey) {
  const sortValue = document.getElementById("trailsSort").value;
  const filterCheckboxes = document.querySelectorAll(".trailsFilterCheckbox");
  const selectedFilters = [];
  filterCheckboxes.forEach(cb => {
    if (cb.checked) {
      selectedFilters.push(cb.value);
    }
  });
  let filteredTrails = trails;
  if (selectedFilters.length > 0) {
    filteredTrails = trails.filter(feature => {
      return selectedFilters.some(prop => {
        const val = feature.properties[prop];
        return val != null && val.toString().trim() !== "";
      });
    });
  }
  let sortedTrails = [...filteredTrails];
  if (sortValue === "name-asc") {
    sortedTrails.sort((a, b) => (a.properties.name || "").localeCompare(b.properties.name || ""));
  } else if (sortValue === "name-desc") {
    sortedTrails.sort((a, b) => (b.properties.name || "").localeCompare(a.properties.name || ""));
  } else if (sortValue === "length-asc") {
    sortedTrails.sort((a, b) => parseFloat(a.properties.length || 0) - parseFloat(b.properties.length || 0));
  } else if (sortValue === "length-desc") {
    sortedTrails.sort((a, b) => parseFloat(b.properties.length || 0) - parseFloat(a.properties.length || 0));
  }
  sortedTrails = sortedTrails.filter(feature => {
    let name = feature.properties.name;
    if (!name) {
      name = "Unnamed Trail";
    }
    return !name.toLowerCase().includes("unnamed");
  });
  if (document.getElementById("trailsTotal")) {
    document.getElementById("trailsTotal").textContent = sortedTrails.length;
  }
  currentSortedTrails = sortedTrails;
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
function setupInfoPanelToggle() {
  const switchToLocationsBtn = document.getElementById("switchToLocations");
  const switchToCasesBtn = document.getElementById("switchToCases");
  const locationControls = document.getElementById("locationControls");
  switchToLocationsBtn.addEventListener("click", async () => {
    document.querySelector("#infoHeader h2").textContent = "Location List";
    switchToLocationsBtn.style.display = "none";
    switchToCasesBtn.style.display = "inline-block";
    locationControls.style.display = "block";
    document.getElementById("infoContent").innerHTML = "";
    await renderLocationList();
  });
  switchToCasesBtn.addEventListener("click", () => {
    document.querySelector("#infoHeader h2").textContent = "Case List";
    switchToCasesBtn.style.display = "none";
    switchToLocationsBtn.style.display = "inline-block";
    locationControls.style.display = "none";
    document.getElementById("infoContent").innerHTML = "";
    renderCaseList();
  });
  document.getElementById("locationSearch").addEventListener("input", renderLocationList);
  document.getElementById("locationSort").addEventListener("change", renderLocationList);
}

async function loadLocationBoundariesData() {
  try {
    const npResponse = await fetch("https://themissinglist.com/data/US_National_Parks.geojson");
    const npData = await npResponse.json();
    const nfResponse = await fetch("https://themissinglist.com/data/National_Forest_Boundaries.geojson.gz");
    const nfArrayBuffer = await nfResponse.arrayBuffer();
    const nfDecompressed = window.pako.ungzip(new Uint8Array(nfArrayBuffer), { to: 'string' });
    const nfData = JSON.parse(nfDecompressed);
    const blmResponse = await fetch("https://themissinglist.com/data/BLM_Natl_Wilderness_Areas.geojson.gz");
    const blmArrayBuffer = await blmResponse.arrayBuffer();
    const blmDecompressed = window.pako.ungzip(new Uint8Array(blmArrayBuffer), { to: 'string' });
    const blmData = JSON.parse(blmDecompressed);
    const combinedFeatures = [
      ...(npData.features || []),
      ...(nfData.features || []),
      ...(blmData.features || [])
    ];
    const combinedData = { ...npData, features: combinedFeatures };
    window.locationBoundariesData = combinedData;
    return true;
  } catch (error) {
    console.error("Error loading location boundaries data:", error);
    return false;
  }
}

async function renderLocationList() {
  const listContainer = document.getElementById("infoContent");
  if (
    !window.locationBoundariesData ||
    !window.locationBoundariesData.features ||
    window.locationBoundariesData.features.length === 0
  ) {
    listContainer.innerHTML = "<p>Location data is loading. Please wait...</p>";
    const success = await loadLocationBoundariesData();
    if (!success) {
      listContainer.innerHTML = "<p>Error loading location data.</p>";
      return;
    }
  }
  let locations = window.locationBoundariesData.features.slice().filter(feature => feature.geometry);
  const searchValue = document.getElementById("locationSearch").value.trim().toLowerCase();
  const sortOption = document.getElementById("locationSort").value;
  if (searchValue) {
    locations = locations.filter(feature =>
      getLocationName(feature).toLowerCase().includes(searchValue)
    );
  }
  locations.sort((a, b) => {
    const nameA = getLocationName(a).toLowerCase();
    const nameB = getLocationName(b).toLowerCase();
    if (sortOption === "az") return nameA.localeCompare(nameB);
    if (sortOption === "za") return nameB.localeCompare(nameA);
    if (sortOption === "largest") return (b.properties.area || 0) - (a.properties.area || 0);
    if (sortOption === "smallest") return (a.properties.area || 0) - (b.properties.area || 0);
    return 0;
  });
  const uniqueLocationsMap = {};
  locations.forEach(feature => {
    const locName = getLocationName(feature);
    if (!uniqueLocationsMap[locName]) {
      uniqueLocationsMap[locName] = feature;
    }
  });
  const uniqueLocations = Object.values(uniqueLocationsMap);
  let listHTML = "<ul style='list-style: none; padding: 0; margin: 0;'>";
  uniqueLocations.forEach((feature, idx) => {
    try {
      const displayName = getLocationName(feature);
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
                           ${displayName}
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
      // Pass true to indicate that this came from the list.
      showLocationDetailView(feature, false);
    });
  });
}

function showLocationDetailView(locationFeature, triggeredFromOverlay = false) {
  console.log("showLocationDetailView called with feature:", locationFeature);
  const infoContent = document.getElementById("infoContent");
  if (!infoContent) return;

  // Store default bounds on the location feature (if not already stored)
  if (locationFeature && locationFeature.geometry && !locationFeature.defaultBounds) {
    const tempLayer = L.geoJSON(locationFeature);
    let bounds = tempLayer.getBounds();
    // If the feature is a single point (or very small), pad the bounds so we can zoom out
    if (
      bounds.isValid() &&
      (bounds.getNorth() === bounds.getSouth() || bounds.getEast() === bounds.getWest())
    ) {
      bounds = bounds.pad(0.2); // adjust the padding factor as needed
    }
    locationFeature.defaultBounds = bounds;
  }

  // Determine the location name for auto overlay toggling
  const locationName = getLocationName(locationFeature).toLowerCase();

  if (!triggeredFromOverlay) {
    if (locationName.indexOf("national forest") !== -1) {
      if (
        !window.nationalForestRef ||
        !window.nationalForestRef.layer ||
        !window.map.hasLayer(window.nationalForestRef.layer)
      ) {
        const nfToggle = document.getElementById("nationalForestToggleButton");
        if (nfToggle) {
          nfToggle.click();
          console.log("Automatically turned on National Forest overlay.");
          window.autoNFOverlay = true;
        }
      }
    } else if (locationName.indexOf("blm") !== -1 || (locationFeature.properties.NLCS_NAME && !locationFeature.properties.FORESTNAME)) {
      const blmToggle = document.getElementById("blmToggleButton");
      if (blmToggle) {
        blmToggle.click();
        console.log("Automatically turned on BLM overlay for BLM location.");
      }
    } else if (locationName.indexOf("national park") !== -1) {
      if (
        !window.npBoundariesRef ||
        !window.npBoundariesRef.layer ||
        !window.map.hasLayer(window.npBoundariesRef.layer)
      ) {
        const npToggle = document.getElementById("npBoundariesToggleButton");
        if (npToggle) {
          npToggle.click();
          console.log("Automatically turned on National Park overlay.");
          window.autoNPOverlay = true;
          const npInterval = setInterval(() => {
            if (window.npBoundariesRef && window.npBoundariesRef.layer) {
              console.log("National Parks overlay loaded. Attempting auto-click.");
              autoClickOverlayFeature(window.npBoundariesRef.layer, locationFeature);
              clearInterval(npInterval);
            }
          }, 500);
        }
      }
    }
  }

  // Build the info panel HTML with two buttons:
  // - "Back to List": Resets the map view to the global default
  // - "Back to Location View": Zooms the map back to the default bounds for this location
  let html = `
    <button id="backToLocationList" style="margin-bottom: 10px;">Back to List</button>
    <button id="backToLocationView" style="margin-bottom: 10px;">Back to Location View</button>
    <h3>${getLocationName(locationFeature) || "Unnamed Location"}</h3>
  `;
  if (locationFeature.properties.area) {
    html += `<p>Area: ${locationFeature.properties.area}</p>`;
  }
  if (locationFeature.properties.description) {
    html += `<p>${locationFeature.properties.description}</p>`;
  }
  html += `
  <div id="trailsList">
    <button id="toggleTrailsPOI" style="margin-bottom: 10px;">Trails and POI on</button>
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
  </div>
  `;

  infoContent.innerHTML = html;

  // "Back to List" button functionality
  document.getElementById("backToLocationList").addEventListener("click", () => {
    // Reset map view to the global default
    window.map.setView([39.8283, -98.5795], 4);
    // Remove overlays for National Forest, National Park, and BLM if present
    if (window.nationalForestRef && window.nationalForestRef.layer && window.map.hasLayer(window.nationalForestRef.layer)) {
      window.map.removeLayer(window.nationalForestRef.layer);
      const nfBtn = document.getElementById("nationalForestToggleButton");
      if (nfBtn && nfBtn.dataset.original) {
        nfBtn.innerHTML = nfBtn.dataset.original;
      }
    }
    window.map.eachLayer(layer => {
      if (layer.options && layer.options.nfOverlay) {
        window.map.removeLayer(layer);
      }
    });
    if (window.npBoundariesRef && window.npBoundariesRef.layer && window.map.hasLayer(window.npBoundariesRef.layer)) {
      window.map.removeLayer(window.npBoundariesRef.layer);
      window.npBoundariesRef.layer = null;
      const npBtn = document.getElementById("npBoundariesToggleButton");
      if (npBtn && npBtn.dataset.original) {
        npBtn.innerHTML = npBtn.dataset.original;
      }
    }
    window.map.eachLayer(layer => {
      if (layer.options && layer.options.npOverlay) {
        window.map.removeLayer(layer);
      }
    });
    if (window.blmRef && window.blmRef.layer && window.map.hasLayer(window.blmRef.layer)) {
      window.map.removeLayer(window.blmRef.layer);
      window.blmRef.layer = null;
      const blmBtn = document.getElementById("blmToggleButton");
      if (blmBtn && blmBtn.dataset.original) {
        blmBtn.innerHTML = blmBtn.dataset.original;
      }
    }
    window.map.eachLayer(layer => {
      if (layer.options && layer.options.blmOverlay) {
        window.map.removeLayer(layer);
      }
    });
    const trailsBtn = document.getElementById("trailsToggleButton");
    if (trailsBtn) {
      trailsBtn.style.display = "none";
    }
    window.currentParkKey = null;
    document.getElementById("locationSearch").value = "";
    renderLocationList();
    updateGlobalTrailsCounter();
  });

  // "Back to Location View" button functionality:
  // Remove the selected trail marker and popup, then zoom back to the default bounds for the location.
  document.getElementById("backToLocationView").addEventListener("click", () => {
    // Remove the selected trail marker if it exists
    if (selectedTrailLayer && window.map.hasLayer(selectedTrailLayer)) {
      window.map.removeLayer(selectedTrailLayer);
      selectedTrailLayer = null;
    }
    // Close any open popup on the map
    window.map.closePopup();
    
    // Zoom back to the stored default bounds for the location
    if (locationFeature.defaultBounds && locationFeature.defaultBounds.isValid()) {
      window.map.fitBounds(locationFeature.defaultBounds);
    } else if (locationFeature && locationFeature.geometry) {
      const bounds = L.geoJSON(locationFeature).getBounds();
      window.map.fitBounds(bounds);
    }
  });

  // Setup Trails Data Points toggle
  document.getElementById("toggleTrailsPOI").addEventListener("click", function() {
    const parkKey = getParkKeyFromUnitName(
      locationFeature.properties.unit_name ||
      locationFeature.properties.FORESTNAME ||
      locationFeature.properties.NLCS_NAME
    );
    if (!parkKey) return;
    window.trailsPOIActive = window.trailsPOIActive || {};
    if (window.trailsPOIActive[parkKey]) {
      toggleParkTrails(window.map, parkKey);
      window.trailsPOIActive[parkKey] = false;
      this.textContent = "Trails and POI on";
      console.log(`Trails and POI toggled off for ${parkKey}`);
    } else {
      toggleParkTrails(window.map, parkKey);
      window.trailsPOIActive[parkKey] = true;
      this.textContent = "Trails and POI off";
      console.log(`Trails and POI toggled on for ${parkKey}`);
    }
  });

  // Zoom to the location's bounds (default view) when the detail view is first shown
  if (locationFeature && locationFeature.geometry) {
    const bounds = L.geoJSON(locationFeature).getBounds();
    if (bounds.isValid()) {
      window.map.fitBounds(bounds);
    }
  }

  // Fetch and display trails for the park (if applicable)
  const parkKey = getParkKeyFromUnitName(
    locationFeature.properties.unit_name ||
    locationFeature.properties.FORESTNAME ||
    locationFeature.properties.NLCS_NAME
  );
  if (parkKey && trailsConfig[parkKey]) {
    fetchTrailsData(parkKey)
      .then(geojsonData => {
        const allTrails = geojsonData.features.filter(feature => feature.geometry);
        console.log("Total trails for parkKey:", allTrails.length);
        updateTrailsList(allTrails, parkKey);
        document.getElementById("trailsSort").addEventListener("change", () => {
          updateTrailsList(allTrails, parkKey);
        });
        document.querySelectorAll(".trailsFilterCheckbox").forEach(cb => {
          cb.addEventListener("change", () => {
            updateTrailsList(allTrails, parkKey);
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
}


window.showLocationDetailView = showLocationDetailView;

function renderCaseList() {
  if (typeof window.populateNamesList === "function") {
    window.populateNamesList();
  } else {
    document.getElementById("infoContent").innerHTML = "<p>Case list content goes here.</p>";
  }
}

function setupUI(updateMapForFilters, populateCaseList) {
  loadLocationBoundariesData().catch(err => console.error("Error preloading location boundaries:", err));
  setupInfoPanelToggle();
}

export { setupUI, renderLocationList, renderCaseList, loadLocationBoundariesData, getForestName };