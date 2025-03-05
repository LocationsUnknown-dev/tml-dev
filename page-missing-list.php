<?php
/**
 * Template Name: Missing List Map
 */
get_header();
?>

<style>
html, body {
  height: 100%;
  margin: 0;
}

/* Main content grid: Filter (1fr), Map (2fr x2), Case List (1fr) */
#content {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 1fr;
  gap: 10px;
  height: calc(100vh - 120px);
}

/* Panel styling applied to both the Filter and the Case List panels */
#filter, #info {
  background: #f7f7f7;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-family: Arial, sans-serif;
}

/* Specific layout for the Filter panel */
#filter {
  grid-column: 1 / 2;
}

/* Specific layout for the Map container */
#map {
  grid-column: 2 / 4;
  position: relative;
  min-height: 100%;
}

/* Specific layout for the Case List panel */
#info {
  grid-column: 4 / 5;
  overflow-y: auto;
}

/* Heading styling for panels */
#filter h3,
#info h2 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

/* Filter panel form element styling */
#filter label {
  font-size: 14px;
  color: #555;
  display: block;
  margin-bottom: 5px;
}

#filter input[type="range"],
#filter input[type="text"],
#filter select {
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-sizing: border-box;
  font-size: 14px;
}

#filter button {
  background: #0073aa;
  color: #fff;
  border: none;
  padding: 8px 12px;
  margin-top: 5px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
}

#filter button:hover {
  background: #005177;
}

/* Apply similar styling to inputs, selects, and buttons within the Case List panel */
#info input[type="text"],
#info select,
#info button {
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-sizing: border-box;
  font-size: 14px;
}

/* New container for the two toggle buttons (Legend & About) */
#filterToggleButtons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* Layers Toggle Container remains unchanged */
#layersToggleContainer {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 60px;
  height: 60px;
  background-color: rgba(255,255,255,0.95);
  border: 1px solid #ccc;
  border-radius: 4px;
  z-index: 1000;
  overflow: hidden;
  transition: width 0.3s ease, height 0.3s ease;
}

#layersToggleContainer:hover {
  width: 240px;
  height: auto;
}

#layersToggleButton {
  width: 100%;
  height: 60px;
  cursor: pointer;
  background: #f7f7f7;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

#layersToggleButton img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

#layersToggleContent {
  display: none;
  padding: 5px;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

#layersToggleContainer:hover #layersToggleContent {
  display: flex;
}

#layersToggleContent button {
  width: 80px;
  height: 80px;
  background: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

#layersToggleContent button img {
  max-width: 60px;
  max-height: 60px;
  object-fit: contain;
}

#layersToggleContent button span {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

#layersToggleContent button:hover {
  background: #e7e7e7;
}

.active-toggle {
  outline: 2px solid blue;
}

/* Legend styling */
#legendContent {
  display: none;
  background: #fff;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

#legendContent h3 {
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#legendContent h3 button {
  font-size: 12px;
  padding: 4px 8px;
  background: #0073aa;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

#legendList {
  list-style: none;
  padding: 0;
  margin: 0;
}

#legendList li {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

#legendList li img {
  width: 28px;
  height: 32px;
  margin-right: 6px;
  object-fit: contain;
}

#legendList li span {
  font-size: 13px;
  color: #555;
}

#legendList li.inactive {
  opacity: 0.5;
}

/* --- New CSS for the About & Statistics overlay --- */
#aboutStatsOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.95);
  display: none; /* Hidden by default */
  z-index: 900; /* Lower than layers toggle */
}

#aboutStatsBox {
  position: relative;
  width: 80%;
  max-width: 600px;
  margin: 50px auto;
  background: #fff;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

#aboutStatsTabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}

#aboutStatsTabs .tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  background: #f7f7f7;
  border: 1px solid #ddd;
  border-bottom: none;
}

#aboutStatsTabs .tab.active {
  background: #fff;
  font-weight: bold;
}

.tabContent {
  display: none;
}

.tabContent.active {
  display: block;
}

#closeAboutStats {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #ccc;
  border: none;
  padding: 5px 8px;
  cursor: pointer;
  border-radius: 3px;
}
</style>

<div id="content">
  <!-- Filter Panel -->
  <div id="filter">
    <!-- Toggle Buttons Container: Legend and About -->
    <div id="filterToggleButtons">
      <button id="toggleLegend">Expand Map Legend</button>
      <button id="toggleAbout">About</button>
    </div>
    
    <!-- Original Filter Content -->
    <div id="filterContent">
      <h3>Filter Missing Persons</h3>
      <label for="age">Age (max): <span id="ageValue">--</span></label>
      <input type="range" id="age" min="0" max="100" value="100" step="1" />
      <label for="dateSlider">Date Missing (max): <span id="dateValue">--</span></label>
      <input type="range" id="dateSlider" min="0" max="0" value="0" step="1" />
      <div id="playControls" style="margin-bottom: 10px;">
        <button id="playButton">Play</button>
        <button id="pauseButton">Pause</button>
        <button id="stopButton">Stop</button>
      </div>
      <label for="gender">Gender:</label>
      <select id="gender">
        <option value="">Any</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      <label for="summary">Summary:</label>
      <input type="text" id="summary" placeholder="Enter summary text" />
      <label for="park">Park/Forest:</label>
      <input type="text" id="park" placeholder="e.g. Glacier National Park" />
      <button id="applyFilters">Apply Filters</button>
      <button id="resetFilters" style="margin-top:5px;">Reset Filters</button>
      <p id="caseCount">Cases Mapped: <span id="caseTotal">0</span></p>
      <p id="locationCount">Locations Mapped: <span id="locationsTotal">0</span></p>
      <p id="trailsCount">Trails &amp; POI Mapped: <span id="trailsTotal">0</span></p>
    </div>
    
    <!-- Legend Content -->
    <div id="legendContent">
      <h3>
        <span>Map Legend</span>
        <button id="toggleAllLegend">Toggle All On/Off</button>
      </h3>
      <ul id="legendList"></ul>
    </div>
  </div>
  
  <!-- Map Container -->
  <div id="map">
    <!-- Expandable Layers Toggle Container -->
    <div id="layersToggleContainer">
      <div id="layersToggleButton">
        <img src="http://themissinglist.com/wp-content/uploads/2025/02/map-1.png" alt="Layers">
      </div>
      <div id="layersToggleContent">
        <button id="terrainToggleButton">
          <img src="http://themissinglist.com/wp-content/uploads/2025/02/topographic.png" alt="Terrain Icon">
          <span>Terrain</span>
        </button>
        <button id="satelliteToggleButton">Satellite</button>
        <button id="npBoundariesToggleButton">
          <img src="http://themissinglist.com/wp-content/uploads/2025/02/arches.png" alt="NP Boundaries Icon">
          <span>Natl. Parks</span>
        <button id="nationalForestToggleButton" data-original='<img src="http://themissinglist.com/wp-content/uploads/2025/02/forest.png" alt="National Forest Icon"><span>Natl. Forest</span>'>
          <img src="http://themissinglist.com/wp-content/uploads/2025/02/forest.png" alt="National Forest Icon">
          <span>Natl. Forest</span>
        </button>
        <button id="statesToggleButton">
          <img src="http://themissinglist.com/wp-content/uploads/2025/02/map.png" alt="States Icon">
          <span>States</span>
        </button>
        <button id="heatMapToggleButton">
          <img src="http://themissinglist.com/wp-content/uploads/2025/02/heat-map.png" alt="Heat Map Icon">
          <span>Heat Map</span>
        </button>
        <button id="allTrailsToggleButton">
          <img src="http://themissinglist.com/wp-content/uploads/2025/02/map-2.png" alt="All Trails Icon">
          <span>All Trails</span>
        </button>
        <button id="trailsToggleButton" style="display:none;">
          <img src="http://themissinglist.com/wp-content/uploads/2025/02/mountaineer.png" alt="Trails Icon">
          <span>Trails</span>
        </button>
        <button id="blmToggleButton">
          <img src="https://themissinglist.com/wp-content/uploads/2025/03/location_11788771.png" alt="BLM WLDN Area Icon">
          <span>BLM WLDN Area</span>
        </button>
      </div>
    </div>
    
    <!-- New About & Statistics Overlay -->
    <div id="aboutStatsOverlay">
      <div id="aboutStatsBox">
        <button id="closeAboutStats">X</button>
        <div id="aboutStatsTabs">
          <button class="tab active" data-tab="aboutMap">About the map</button>
          <button class="tab" data-tab="mapStats">Map Stats</button>
          <button class="tab" data-tab="locationsStats">Locations Stats</button>
          <button class="tab" data-tab="caseStats">Case Stats</button>
        </div>
        <div id="aboutStatsContent">
          <div class="tabContent active" id="aboutMapContent">
            <p>This map provides information about missing persons, including locations, case details, and various overlays such as national parks and forests. It combines dynamic filtering, playback controls, and interactive map layers to help users explore the data.</p>
          </div>
          <div class="tabContent" id="mapStatsContent">
            <p>Map Stats: This section will display statistics about the map usage, total markers, active overlays, and more.</p>
          </div>
          <div class="tabContent" id="locationsStatsContent">
            <p>Locations Stats: This section will provide statistics about the unique locations mapped, including count and distribution.</p>
          </div>
          <div class="tabContent" id="caseStatsContent">
            <p>Case Stats: This section will show statistics about the cases, such as total cases, demographic breakdowns, and trends over time.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Case List Panel -->
  <div id="info">
    <div id="infoHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h2>Case List</h2>
      <div>
        <button id="switchToLocations" style="display: inline-block;">Switch to Locations</button>
        <button id="switchToCases" style="display: none;">Switch to Cases</button>
      </div>
    </div>
    <div id="locationControls" style="display: none; margin-bottom: 10px;">
      <input type="text" id="locationSearch" placeholder="Search locations" />
      <select id="locationSort">
        <option value="az">A to Z</option>
        <option value="za">Z to A</option>
        <option value="largest">Largest to Smallest</option>
        <option value="smallest">Smallest to Largest</option>
      </select>
    </div>
    <div id="infoContent">
      <!-- List content is injected here -->
    </div>
  </div>
</div>

<div id="attribution" style="text-align: center; padding: 10px 0; font-size: 12px;">
  <a href="https://www.flaticon.com/free-icons/terrain" title="terrain icons">
    Terrain icons created by Darius Dan - Flaticon
  </a>
</div>
<div id="attribution" style="text-align: center; padding: 10px 0; font-size: 12px;">
  <a href="https://www.flaticon.com/free-icons/surveillance" title="surveillance icons">
    Surveillance icons created by Eucalyp - Flaticon
  </a>
</div>

<script>
// --- Legend Toggle and Interactive Filtering ---

// Toggle between Filter and Legend views
document.getElementById('toggleLegend').addEventListener('click', function() {
  const legendDiv = document.getElementById('legendContent');
  const filterDiv = document.getElementById('filterContent');
  if (legendDiv.style.display === 'none' || legendDiv.style.display === '') {
    legendDiv.style.display = 'block';
    filterDiv.style.display = 'none';
    this.textContent = 'Collapse Map Legend';
  } else {
    legendDiv.style.display = 'none';
    filterDiv.style.display = 'block';
    this.textContent = 'Expand Map Legend';
  }
});

// --- About & Statistics Overlay Toggle & Tabs ---

// Toggle About overlay when About button is clicked
document.getElementById('toggleAbout').addEventListener('click', function() {
  const overlay = document.getElementById('aboutStatsOverlay');
  overlay.style.display = (overlay.style.display === 'none' || overlay.style.display === '') ? 'block' : 'none';
});

// Close button inside overlay
document.getElementById('closeAboutStats').addEventListener('click', function() {
  document.getElementById('aboutStatsOverlay').style.display = 'none';
});

// Tab switching logic for About & Stats overlay
var tabs = document.querySelectorAll('#aboutStatsTabs .tab');
tabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    tabs.forEach(function(t) { t.classList.remove('active'); });
    this.classList.add('active');
    var contents = document.querySelectorAll('.tabContent');
    contents.forEach(function(content) {
      content.classList.remove('active');
    });
    var tabId = this.getAttribute('data-tab');
    document.getElementById(tabId + 'Content').classList.add('active');
  });
});

// --- Legend Building and Marker Filtering (existing code) ---

const legendItems = [
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/placeholder_12339367.png", label: "Peak" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/location_8085844.png", label: "Spring" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/arches_18666823.png", label: "Arch" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/stone_10163153.png", label: "Rock" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/nature_13992531.png", label: "Cliff" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/canyon_10981901.png", label: "Gorge" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/cave_11420912.png", label: "Cave Entrance" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/pin_3251129.png", label: "Tree" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/parking_652271.png", label: "Parking" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/bath_11539443.png", label: "Toilets" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/water_9849745.png", label: "Drinking Water" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/location-pin_9425746.png", label: "Restaurant" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/home_5385604.png", label: "Shelter" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/search_3883726.png", label: "Information" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/fire_16775003.png", label: "Camp Site" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/statue_13447259.png", label: "Museum" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/picnic-table_17479031.png", label: "Picnic Table" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/waterfall_2881906.png", label: "Waterfall" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/obelisk_1395095.png", label: "Ruins" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/vase_1862599.png", label: "Archaeological Site" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/tools_13286009.png", label: "Mine/Mine Shaft" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/shipwreck_3605350.png", label: "Wreck" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/tourism_3307738.png", label: "Memorial" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/geology_6347983.png", label: "Boundary Stone" },
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/fossil_4937565.png", label: "Palaeontological Site" }
];

const activeLegendCategories = {};
legendItems.forEach(item => {
  activeLegendCategories[item.label] = true;
});

const legendList = document.getElementById('legendList');
legendItems.forEach(item => {
  const li = document.createElement('li');
  li.innerHTML = `<img src="${item.icon}" alt="${item.label}"><span>${item.label}</span>`;
  legendList.appendChild(li);
});

legendList.querySelectorAll("li").forEach(li => {
  li.addEventListener("click", function() {
    const label = li.querySelector("span").textContent;
    activeLegendCategories[label] = !activeLegendCategories[label];
    li.classList.toggle("inactive");
    updateMarkersVisibility();
  });
});

document.getElementById("toggleAllLegend").addEventListener("click", function(e) {
  e.stopPropagation();
  let allActive = true;
  for (const key in activeLegendCategories) {
    if (!activeLegendCategories[key]) { allActive = false; break; }
  }
  const newState = !allActive;
  for (const key in activeLegendCategories) {
    activeLegendCategories[key] = newState;
  }
  legendList.querySelectorAll("li").forEach(li => {
    const label = li.querySelector("span").textContent;
    if (activeLegendCategories[label]) { li.classList.remove("inactive"); }
    else { li.classList.add("inactive"); }
  });
  updateMarkersVisibility();
});

function updateLegendVisibility() {
  if (!window.currentTrailsLayer) {
    document.querySelectorAll('#legendList li').forEach(function(li) { li.style.display = ''; });
    return;
  }
  let presentCategories = {};
  window.currentTrailsLayer.eachLayer(function(marker) {
    if (marker.legendCategory) { presentCategories[marker.legendCategory] = true; }
  });
  document.querySelectorAll('#legendList li').forEach(function(li) {
    const label = li.querySelector('span').textContent;
    li.style.display = presentCategories[label] ? '' : 'none';
  });
}

function updateMarkersVisibility() {
  if (!window.currentTrailsLayer) return;
  window.currentTrailsLayer.eachLayer(function(marker) {
    if (marker.legendCategory) {
      if (activeLegendCategories[marker.legendCategory]) {
        if (marker.getElement()) marker.getElement().style.display = "";
      } else {
        if (marker.getElement()) marker.getElement().style.display = "none";
      }
    }
  });
  updateLegendVisibility();
}
</script>

<?php get_footer(); ?>
