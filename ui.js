// assets/js/ui.js

export function setupUI(updateMapForFilters, populateCaseList) {
  // (Assuming other filter-related UI setup is handled elsewhere)
  setupInfoPanelToggle();
}

function setupInfoPanelToggle() {
  const switchToLocationsBtn = document.getElementById("switchToLocations");
  const switchToCasesBtn = document.getElementById("switchToCases");
  const locationControls = document.getElementById("locationControls");

  // When switching to Locations:
  switchToLocationsBtn.addEventListener("click", () => {
    // Change header text
    document.querySelector("#infoHeader h2").textContent = "Location List";
    // Toggle button visibility
    switchToLocationsBtn.style.display = "none";
    switchToCasesBtn.style.display = "inline-block";
    // Show location-specific controls (search, sort)
    locationControls.style.display = "block";
    // Render the location list into the content area only
    renderLocationList();
  });

  // When switching back to Cases:
  switchToCasesBtn.addEventListener("click", () => {
    document.querySelector("#infoHeader h2").textContent = "Case List";
    switchToCasesBtn.style.display = "none";
    switchToLocationsBtn.style.display = "inline-block";
    locationControls.style.display = "none";
    // Render the case list into the content area only
    renderCaseList();
  });

  // Setup event listeners for location search and sorting
  document.getElementById("locationSearch").addEventListener("input", renderLocationList);
  document.getElementById("locationSort").addEventListener("change", renderLocationList);
}

function renderLocationList() {
  const infoContent = document.getElementById("infoContent");
  // Use the global NP boundaries data (set in boundaries.js)
  if (!window.nationalParksData || !window.nationalParksData.features) {
    infoContent.innerHTML = "<p>No location data available.</p>";
    return;
  }
  let locations = window.nationalParksData.features.slice();

  const searchValue = document.getElementById("locationSearch").value.toLowerCase();
  const sortOption = document.getElementById("locationSort").value;

  // Filter locations based on search input
  if (searchValue) {
    locations = locations.filter(feature =>
      feature.properties.unit_name.toLowerCase().includes(searchValue)
    );
  }

  // Sort locations based on selected option
  locations.sort((a, b) => {
    const nameA = a.properties.unit_name.toLowerCase();
    const nameB = b.properties.unit_name.toLowerCase();
    if (sortOption === "az") {
      return nameA.localeCompare(nameB);
    } else if (sortOption === "za") {
      return nameB.localeCompare(nameA);
    } else if (sortOption === "largest") {
      return (b.properties.area || 0) - (a.properties.area || 0);
    } else if (sortOption === "smallest") {
      return (a.properties.area || 0) - (b.properties.area || 0);
    }
    return 0;
  });

  // Build HTML for the list
  let html = "<ul class='location-list' style='list-style: none; padding: 0; margin: 0;'>";
  locations.forEach(feature => {
    const parkName = feature.properties.unit_name;
    // Create a temporary layer to calculate bounds
    const tempLayer = L.geoJSON(feature);
    const bounds = tempLayer.getBounds();
    html += `<li class="location-item" data-bounds='${JSON.stringify(bounds.toBBoxString())}' style="cursor: pointer; margin-bottom: 5px;">${parkName}</li>`;
  });
  html += "</ul>";
  infoContent.innerHTML = html;

  // Add click events to zoom into the selected location
  document.querySelectorAll(".location-item").forEach(item => {
    item.addEventListener("click", function() {
      const bbox = this.getAttribute("data-bounds").split(",").map(Number);
      const southWest = L.latLng(bbox[1], bbox[0]);
      const northEast = L.latLng(bbox[3], bbox[2]);
      const bounds = L.latLngBounds(southWest, northEast);
      if (window.map) {
        window.map.fitBounds(bounds);
      }
    });
  });
}

function renderCaseList() {
  // Render the case list into the content area.
  // This function assumes that window.populateNamesList is defined in app.js to update only #infoContent.
  if (typeof window.populateNamesList === "function") {
    window.populateNamesList();
  } else {
    document.getElementById("infoContent").innerHTML = "<p>Case list content goes here.</p>";
  }
}

export { renderLocationList, renderCaseList };
