// assets/js/map.js
export function initMap() {
  const map = L.map('map').setView([39.8283, -98.5795], 4);

  const defaultTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const terrainTileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
  });

  const satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
  });

  // Initialize the marker cluster.
  const markerCluster = L.markerClusterGroup();
  map.addLayer(markerCluster);

  // Add a clickable scale control (toggles metric/imperial).
  let scaleControl = L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);
  scaleControl.getContainer().style.cursor = "pointer";
  scaleControl.getContainer().addEventListener("click", function() {
    const currentMetric = scaleControl.options.metric;
    map.removeControl(scaleControl);
    if (currentMetric) {
      scaleControl = L.control.scale({ position: 'bottomleft', metric: false, imperial: true }).addTo(map);
    } else {
      scaleControl = L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);
    }
    scaleControl.getContainer().style.cursor = "pointer";
  });

  return { map, defaultTileLayer, terrainTileLayer, satelliteTileLayer, markerCluster };
}