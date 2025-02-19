// assets/js/ui.js

// Import trails configuration and data fetching functions.
import { trailsConfig, fetchTrailsData, removeParkTrailsToggleButton } from './trails.js';
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
    props.name ||
    props.NAME ||
    "Unnamed Location"
  ).trim();
}

// A helper to select a feature in an overlay.
function selectOverlayFeature(overlayLayer, locationFeature) {
  if (!overlayLayer) return;
  const targetName = getLocationName(locationFeature).toLowerCase();
  overlayLayer.eachLayer(function(layer) {
    if (layer.feature && getLocationName(layer.feature).toLowerCase() === targetName) {
      layer.openPopup();
    }
  });
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
  unitName = unitName.toLowerCase();
  if (unitName.includes("yosemite")) return "yosemite";
  if (unitName.includes("yellowstone")) return "yellowstone";
  if (unitName.includes("zion")) return "zion";
  if (unitName.includes("denali")) return "denail";
  if (unitName.includes("gates")) return "gates";
  if (unitName.includes("kobuk")) return "kobuk";
  if (unitName.includes("grand canyon")) return "grand canyon";
  if (unitName.includes("canyonlands")) return "canyonlands";
  return null;
}

// -----------------------------
// Trails List Global State
// -----------------------------
let currentSortedTrails = [];
let selectedTrailLayer = null;

function showSingleTrail(trailFeature, parkKey) {
  if (selectedTrailLayer && window.map.hasLayer(selectedTrailLayer)) {
    window.map.removeLayer(selectedTrailLayer);
  }
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
  
  const trailBounds = getFeatureBounds(trailFeature);
  if (trailBounds.isValid()) {
    if (trailBounds.getNorth() === trailBounds.getSouth() && trailBounds.getEast() === trailBounds.getWest()) {
      window.map.setView(trailBounds.getCenter(), 14);
    } else {
      window.map.fitBounds(trailBounds);
    }
  }
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
    const combinedFeatures = [
      ...(npData.features || []),
      ...(nfData.features || [])
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
      showLocationDetailView(feature);
    });
  });
}

function showLocationDetailView(locationFeature) {
  const infoContent = document.getElementById("infoContent");
  clearOverlays();
  let html = `
    <button id="backToLocationList" style="margin-bottom: 10px;">Back to List</button>
    <h3>${getLocationName(locationFeature)}</h3>
  `;
  if (locationFeature.properties.area) {
    html += `<p>Area: ${locationFeature.properties.area}</p>`;
  }
  if (locationFeature.properties.description) {
    html += `<p>${locationFeature.properties.description}</p>`;
  }
  html += `
    <div id="trailsList">
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
  
  // Auto-add the appropriate overlay.
  if (locationFeature.properties.FORESTNAME) {
    const nfToggle = document.getElementById("nationalForestToggleButton");
    nfToggle.click();
    window.autoNFOverlay = true;
    setTimeout(() => {
      selectOverlayFeature(window.nationalForestRef.layer, locationFeature);
    }, 500);
  } else {
    const npToggle = document.getElementById("npBoundariesToggleButton");
    npToggle.click();
    window.autoNPOverlay = true;
    setTimeout(() => {
      selectOverlayFeature(window.npBoundariesRef.layer, locationFeature);
    }, 500);
  }
  
  if (locationFeature && locationFeature.geometry) {
    const bounds = L.geoJSON(locationFeature).getBounds();
    if (bounds.isValid()) {
      window.map.fitBounds(bounds);
    }
  }
  
  document.getElementById("backToLocationList").addEventListener("click", () => {
  // Reset map view.
  window.map.setView([39.8283, -98.5795], 4);
  
  // Remove the NF overlay from our global reference, if present.
  if (window.nationalForestRef && window.nationalForestRef.layer && window.map.hasLayer(window.nationalForestRef.layer)) {
    window.map.removeLayer(window.nationalForestRef.layer);
    window.nationalForestRef.layer = null;
    const nfBtn = document.getElementById("nationalForestToggleButton");
    if (nfBtn && nfBtn.dataset.original) {
      nfBtn.innerHTML = nfBtn.dataset.original;
    }
  }
  
  // Additionally, iterate over all layers on the map and remove any layer that is tagged as an NF overlay.
  window.map.eachLayer(layer => {
    if (layer.options && layer.options.nfOverlay) {
      window.map.removeLayer(layer);
    }
  });
  
  // Also remove the NP overlay in the same way.
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
  
  // Clear any search input and re-render the location list.
  document.getElementById("locationSearch").value = "";
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

export { setupUI, renderLocationList, renderCaseList };

