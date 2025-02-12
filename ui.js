// assets/js/ui.js

export function setupUI(updateMapForFilters, populateCaseList) {
  // Preload NP boundaries data on startup so it's ready when switching views.
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
    // Clear the content area before rendering.
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
  // (These controls are defined in your template under #locationControls)
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
  // Only update the list area (infoContent); the search/sort controls remain intact.
  const listContainer = document.getElementById("infoContent");

  // Ensure NP boundaries data is loaded.
  if (!window.nationalParksData || !window.nationalParksData.features || window.nationalParksData.features.length === 0) {
    listContainer.innerHTML = "<p>Location data is loading. Please wait...</p>";
    const success = await loadNPBoundariesData();
    if (!success) {
      listContainer.innerHTML = "<p>Error loading location data.</p>";
      return;
    }
  }

  let locations = window.nationalParksData.features.slice();

  // Retrieve search and sort values from existing controls.
  const searchValue = document.getElementById("locationSearch").value.trim().toLowerCase();
  const sortOption = document.getElementById("locationSort").value;

  // Filter locations based on search input.
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

  // Build the list HTML matching the case list styling.
  let listHTML = "<ul style='list-style: none; padding: 0; margin: 0;'>";
  uniqueLocations.forEach(feature => {
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
          // Each list item is an anchor styled like the case list items.
          listHTML += `<li style="margin-bottom: 5px;"><a href="#" class="locationLink" data-bounds='${JSON.stringify(bboxArray)}' style="color: #0073aa; text-decoration: none;">${parkName}</a></li>`;
        } else {
          console.warn("Invalid bounds values for feature:", feature);
        }
      } else {
        console.warn("Invalid bounds for feature:", feature);
      }
    } catch (error) {
      console.error("Error processing feature:", feature, error);
    }
  });
  listHTML += "</ul>";
  listContainer.innerHTML = listHTML;

  // Attach click events to each location link.
  document.querySelectorAll(".locationLink").forEach(link => {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      // Toggle NP Boundaries if not active.
      const npToggle = document.getElementById("npBoundariesToggleButton");
      if (npToggle && npToggle.innerHTML.trim() !== "Remove NP Boundaries") {
        npToggle.click();
      }
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
    });
  });
}

function renderCaseList() {
  // Render the case list into the content area.
  if (typeof window.populateNamesList === "function") {
    window.populateNamesList();
  } else {
    document.getElementById("infoContent").innerHTML = "<p>Case list content goes here.</p>";
  }
}

export { renderLocationList, renderCaseList };
