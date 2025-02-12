// assets/js/ui.js

export function setupUI(updateMapForFilters, populateNamesList) {
  // Existing filter setup.
  const ageInput = document.getElementById("age");
  const dateSlider = document.getElementById("dateSlider");
  const toggleFilterButton = document.getElementById("toggleFilter");

  ageInput.addEventListener("input", (e) => {
    document.getElementById("ageValue").textContent = e.target.value;
    updateMapForFilters();
  });

  dateSlider.addEventListener("input", (e) => {
    document.getElementById("dateValue").textContent = new Date(parseInt(e.target.value)).toLocaleDateString();
    updateMapForFilters();
  });

  toggleFilterButton.addEventListener("click", () => {
    const panelContent = document.getElementById("filterContent");
    if (panelContent.style.display === "none") {
      panelContent.style.display = "block";
      toggleFilterButton.textContent = "Collapse Filter";
    } else {
      panelContent.style.display = "none";
      toggleFilterButton.textContent = "Expand Filter";
    }
  });

  // Apply and Reset buttons.
  document.getElementById("applyFilters").addEventListener("click", updateMapForFilters);
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("age").value = document.getElementById("age").max;
    document.getElementById("ageValue").textContent = document.getElementById("age").max;
    const globalMaxDate = window.globalMaxDate || 0;
    document.getElementById("dateSlider").value = globalMaxDate;
    document.getElementById("dateValue").textContent = new Date(globalMaxDate).toLocaleDateString();
    document.getElementById("gender").value = "";
    document.getElementById("location").value = "";
    document.getElementById("park").value = "";
    updateMapForFilters();
    populateNamesList();
  });

  setupInfoPanelToggle();
}

function setupInfoPanelToggle() {
  const infoHeader = document.getElementById("infoHeader");
  const switchToLocationsBtn = document.getElementById("switchToLocations");
  const switchToCasesBtn = document.getElementById("switchToCases");
  const locationControls = document.getElementById("locationControls");
  const infoContent = document.getElementById("infoContent");

  // Initially, we are in Case List view.
  switchToLocationsBtn.addEventListener("click", () => {
    // Switch to Location List view.
    infoHeader.querySelector("h2").textContent = "Location List";
    switchToLocationsBtn.style.display = "none";
    switchToCasesBtn.style.display = "inline-block";
    locationControls.style.display = "block";
    renderLocationList();
  });

  switchToCasesBtn.addEventListener("click", () => {
    // Switch back to Case List view.
    infoHeader.querySelector("h2").textContent = "Case List";
    switchToCasesBtn.style.display = "none";
    switchToLocationsBtn.style.display = "inline-block";
    locationControls.style.display = "none";
    renderCaseList();
  });

  // Setup search and sorting event listeners for the location list.
  const locationSearch = document.getElementById("locationSearch");
  const locationSort = document.getElementById("locationSort");

  locationSearch.addEventListener("input", renderLocationList);
  locationSort.addEventListener("change", renderLocationList);
}

function renderLocationList() {
  const infoContent = document.getElementById("infoContent");
  const searchValue = document.getElementById("locationSearch").value.toLowerCase();
  const sortOption = document.getElementById("locationSort").value;
  // Assume NP boundaries data is stored in window.nationalParksData.
  if (!window.nationalParksData || !window.nationalParksData.features) {
    infoContent.innerHTML = "<p>No location data available.</p>";
    return;
  }
  let locations = window.nationalParksData.features.slice();

  // Filter by search input.
  if (searchValue) {
    locations = locations.filter(feature =>
      feature.properties && feature.properties.unit_name && feature.properties.unit_name.toLowerCase().includes(searchValue)
    );
  }

  // Sort based on the selected option.
  locations.sort((a, b) => {
    const nameA = a.properties.unit_name.toLowerCase();
    const nameB = b.properties.unit_name.toLowerCase();
    if (sortOption === "az") {
      return nameA.localeCompare(nameB);
    } else if (sortOption === "za") {
      return nameB.localeCompare(nameA);
    } else if (sortOption === "largest") {
      // Assuming each feature has a numeric "area" property.
      return (b.properties.area || 0) - (a.properties.area || 0);
    } else if (sortOption === "smallest") {
      return (a.properties.area || 0) - (b.properties.area || 0);
    }
    return 0;
  });

  // Build the HTML list.
  let html = "<ul class='location-list'>";
  locations.forEach(feature => {
    const parkName = feature.properties.unit_name;
    // Create a temporary Leaflet layer to calculate bounds.
    const tempLayer = L.geoJSON(feature);
    const bounds = tempLayer.getBounds();
    html += `<li class="location-item" data-bounds='${JSON.stringify(bounds.toBBoxString())}'>${parkName}</li>`;
  });
  html += "</ul>";
  infoContent.innerHTML = html;

  // Add click events to zoom into the selected location.
  const listItems = document.querySelectorAll(".location-item");
  listItems.forEach(item => {
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
  // Placeholder: Replace with your existing case list rendering logic.
  const infoContent = document.getElementById("infoContent");
  infoContent.innerHTML = "<p>Case list content goes here.</p>";
}

export { renderLocationList, renderCaseList };
