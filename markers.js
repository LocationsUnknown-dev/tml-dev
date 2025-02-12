// assets/js/markers.js
export let heatLayer = null;

export function addMarkers(map, data, buildPopupContent, showDetailView, markerCluster) {
  markerCluster.clearLayers();
  data.forEach(item => {
    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const popupContent = buildPopupContent(item);
      const marker = L.marker([lat, lng]).bindPopup(popupContent);
      marker.on('click', () => {
        showDetailView(item);
      });
      markerCluster.addLayer(marker);
    }
  });
  document.getElementById("caseTotal").textContent = data.length;
}

export function updateHeatLayer(map, data) {
  const heatData = data.map(item => {
    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);
    return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
  }).filter(coord => coord !== null);
  if (heatLayer) {
    heatLayer.setLatLngs(heatData);
  } else {
    heatLayer = L.heatLayer(heatData, { radius: 30, blur: 20, maxZoom: 17 });
    map.addLayer(heatLayer);
  }
}

export function removeHeatLayer(map) {
  if (heatLayer && map.hasLayer(heatLayer)) {
    map.removeLayer(heatLayer);
    heatLayer = null;
  }
}
