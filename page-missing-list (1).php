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
  /* Main content grid: Filter (1fr), Map (2fr x2), Info (1fr) */
  #content {
    display: grid;
    grid-template-columns: 1fr 2fr 2fr 1fr;
    gap: 10px;
    height: calc(100vh - 120px);
  }
  /* FILTER PANEL STYLING */
  #filter {
    grid-column: 1 / 2;
    background: #f7f7f7;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-family: Arial, sans-serif;
  }
  #filter h3 {
    font-size: 18px;
    margin-bottom: 10px;
    color: #333;
  }
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
  
  /* MAP CONTAINER STYLING */
  #map {
    grid-column: 2 / span 2;
    height: 100%;
    position: relative;
  }
  
  /* INFO PANEL STYLING */
  #info {
    grid-column: 4 / 5;
    background: #fff;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-family: Arial, sans-serif;
    overflow-y: auto;
  }
  
  /* Expanded layout: Hide filter and info panels, map spans full width */
  #content.expanded #filter,
  #content.expanded #info {
    display: none;
  }
  #content.expanded #map {
    grid-column: 1 / -1;
  }
  
  /* Existing Zoom Control Buttons (Leaflet) */
  #terrainToggleButton,
  #satelliteToggleButton,
  #npBoundariesToggleButton,
  #statesToggleButton,
  #heatMapToggleButton {
    position: absolute;
    right: 10px;
    background: rgba(255,255,255,0.9);
    padding: 5px 10px;
    border: 1px solid #ccc;
    cursor: pointer;
    z-index: 1000;
    min-width: 70px;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 13px;
  }
  #terrainToggleButton { top: 10px; }
  #satelliteToggleButton { top: 10px; right: 90px; }
  #npBoundariesToggleButton { top: 50px; }
  #statesToggleButton { top: 90px; }
  #heatMapToggleButton { top: 130px; }
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
      <!-- Updated to "Summary" -->
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
    <div id="terrainToggleButton">Terrain</div>
    <div id="satelliteToggleButton">Satellite</div>
    <div id="npBoundariesToggleButton">NP Boundaries</div>
    <div id="statesToggleButton">States</div>
    <div id="heatMapToggleButton">Heat Map</div>
    <!-- The Expand Map button will be appended by JavaScript into the zoom control -->
  </div>
  
  <!-- Info Panel -->
  <div id="info">
    <!-- Case list and detail view will be injected here by JavaScript -->
  </div>
</div>
<?php
get_footer();
?>
