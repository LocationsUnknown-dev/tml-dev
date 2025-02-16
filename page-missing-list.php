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

/* Expandable Layers Toggle Container */
#layersToggleContainer {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  background-color: rgba(255,255,255,0.95);
  border: 1px solid #ccc;
  border-radius: 4px;
  z-index: 1000;
  overflow: hidden;
  transition: width 0.3s ease, height 0.3s ease;
}

/* Expand on hover */
#layersToggleContainer:hover {
  width: 200px; /* Adjust width as needed */
  height: auto;
}

/* The fixed header button */
#layersToggleButton {
  width: 100%;
  height: 40px;
  cursor: pointer;
  text-align: center;
  line-height: 40px;
  font-weight: bold;
  background: #f7f7f7;
  border-bottom: 1px solid #ddd;
}

/* Hidden content initially */
#layersToggleContent {
  display: none;
  padding: 5px;
}

/* Show content on hover */
#layersToggleContainer:hover #layersToggleContent {
  display: block;
}

/* Style individual toggle buttons */
#layersToggleContent button {
  display: block;
  width: 100%;
  margin: 3px 0;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  background: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 3px;
  text-align: left;
}

#layersToggleContent button:hover {
  background: #e7e7e7;
}

</style>

<div id="content">
  <!-- Filter Panel -->
  <div id="filter">
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
      <p id="caseCount">Cases Mapped: <span id="caseTotal">0</span></p>
      <p id="locationCount">Locations Mapped: <span id="locationsTotal">0</span></p>
      <p id="trailsCount">Trails &amp; POI Mapped: <span id="trailsTotal">0</span></p>
    </div>
  </div>
  
  <!-- Map Container -->
  <div id="map">
  <!-- Expandable Layers Toggle Container -->
  <div id="layersToggleContainer">
    <div id="layersToggleButton">Layers</div>
    <div id="layersToggleContent">
      <button id="terrainToggleButton">Terrain</button>
      <button id="satelliteToggleButton">Satellite</button>
      <button id="npBoundariesToggleButton">NP Boundaries</button>
      <button id="statesToggleButton">States</button>
      <button id="heatMapToggleButton">Heat Map</button>
    </div>
  </div>
  <!-- The rest of your map markup remains unchanged -->
</div>
  
  <!-- Case List Panel (styled to match Filter) -->
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

<?php get_footer(); ?>
