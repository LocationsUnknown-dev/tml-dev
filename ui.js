// assets/js/ui.js

export function setupUI(updateMapForFilters, populateCaseList) {
  setupInfoPanelToggle();
}

function setupInfoPanelToggle() {
  const switchToLocationsBtn = document.getElementById("switchToLocations");
  const switchToCasesBtn = document.getElementById("switchToCases");
  const locationControls = document.getElementById("locationControls");

  // When switching to Locations:
  switchToLocationsBtn.addEventListener("click", () => {
    document.querySelector("#infoHeader h2").textContent = "Location List";
    switchToLocationsBtn.style.display = "none";
    switchToCasesBtn.style.display = "inline-block";
    locationControls.style.display = "block";
    // Clear the content area before rendering.
    document.getElementById("infoContent").innerHTML = "";
    renderLocationList();
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

function loadLocationDataFallback() {
  // If nationalParksData is not loaded or appears empty, fetch it.
  fetch("https://themissinglist.com/data/US_National_Parks.geojson")
    .then(response => response.json())
    .then(geojsonData => {
      if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
        window.nationalParksData = geojsonData;
        renderLocationList();
      } else {
        document.getElementById("infoContent").innerHTML = "<p>Error: Received empty location data.</p>";
        console.error("Empty location data received:", geojsonData);
      }
    })
    .catch(error => {
      document.getElementById("infoContent").innerHTML = "<p>Error loading location data.</p>";
      console.error("Error in fallback loading of NP boundaries data:", error);
    });
}

function renderLocationList() {
  const infoContent = document.getElementById("infoContent");
  // Check if NP boundaries (location) data is available and has features.
  if (!window.nationalParksData || !window.nationalParksData.features || window.nationalParksData.features.length === 0) {
    infoContent.innerHTML = "<p>Location data is loading. Please wait...</p>";
    // Call fallback loader in case data wasn't preloaded.
    loadLocationDataFallback();
    return;
  }
  let locations = window.nationalParksData.features.slice();

  const searchValue = document.getElementById("locationSearch").value.toLowerCase();
  const sortOption = document.getElementById("locationSort").value;

  // Filter locations by search input.
  if (searchValue) {
    locations = locations.filter(feature =>
      feature.properties.unit_name.toLowerCase().includes(searchValue)
    );
  }

  // Sort locations based on the selected option.
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

  // Build the HTML list.
  let html = "<ul class='location-list' style='list-style: none; padding: 0; margin: 0;'>";
  locations.forEach(feature => {
    const parkName = feature.properties.unit_name;
    // Create a temporary Leaflet layer to calculate bounds.
    const tempLayer = L.geoJSON(feature);
    const bounds = tempLayer.getBounds();
    html += `<li class="location-item" data-bounds='${JSON.stringify(bounds.toBBoxString())}' style="cursor: pointer; margin-bottom: 5px;">${parkName}</li>`;
  });
  html += "</ul>";
  infoContent.innerHTML = html;

  // Add click event listeners to zoom into the selected location.
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
  // This assumes window.populateNamesList (from app.js) is defined to update only #infoContent.
  if (typeof window.populateNamesList === "function") {
    window.populateNamesList();
  } else {
    document.getElementById("infoContent").innerHTML = "<p>Case list content goes here.</p>";
  }
}

export { renderLocationList, renderCaseList };
