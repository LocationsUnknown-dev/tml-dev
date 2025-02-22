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

/* Main content grid: Filter (1fr), Map (2fr + 2fr), Case List (1fr) */
#content {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 1fr;
  gap: 10px;
  height: calc(100vh - 120px);
}

/* Common panel styling for Filter and Case List */
.panel {
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
  grid-column: 2 / 4; /* Occupies columns 2 and 3 */
  position: relative;
  min-height: 100%; /* Ensure the container has a height for Leaflet */
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

/* Form element styling in the Filter panel */
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
</style>

<div id="content">
  <!-- Filter Panel -->
  <div id="filter" class="panel">
    <button id="toggleFilter" style="margin-bottom: 10px;">Collapse Filter</button>
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
      <p id="caseCount">Cases Selected: <span id="caseTotal">0</span></p>
    </div>
  </div>
  
  <!-- Map Container -->
  <div id="map">
    <div id="terrainToggleButton" style="position:absolute; top:10px; right:10px; background: rgba(255,255,255,0.95); border: 1px solid #ccc; padding: 5px 10px; z-index:1000;">Terrain</div>
    <div id="satelliteToggleButton" style="position:absolute; top:10px; right:90px; background: rgba(255,255,255,0.95); border: 1px solid #ccc; padding: 5px 10px; z-index:1000;">Satellite</div>
    <div id="npBoundariesToggleButton" style="position:absolute; top:50px; right:10px; background: rgba(255,255,255,0.95); border: 1px solid #ccc; padding: 5px 10px; z-index:1000;">NP Boundaries</div>
    <div id="statesToggleButton" style="position:absolute; top:90px; right:10px; background: rgba(255,255,255,0.95); border: 1px solid #ccc; padding: 5px 10px; z-index:1000;">States</div>
    <div id="heatMapToggleButton" style="position:absolute; top:130px; right:10px; background: rgba(255,255,255,0.95); border: 1px solid #ccc; padding: 5px 10px; z-index:1000;">Heat Map</div>
    <!-- The Expand Map button will be appended by JavaScript into the zoom control -->
  </div>
  
  <!-- Case List Panel (styled to match Filter) -->
  <div id="info" class="panel">
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

<?php get_footer(); ?>
