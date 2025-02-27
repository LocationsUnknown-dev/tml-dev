export let heatLayer = null;

// A helper to create a custom divIcon for peaks.
function createPeakDivIcon() {
  return L.divIcon({
    // Using an HTML image tag instead of an iconUrl property
    html: '<img src="https://themissinglist.com/wp-content/uploads/2025/02/placeholder_12339367.png" style="width:32px;height:37px;" />',
    className: "", // Remove any extra classes to avoid CSS interference
    iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -28]
  });
}

export function addMarkers(map, data, buildPopupContent, showDetailView, markerCluster) {
  console.log("Data received in addMarkers:", data);
  
  if (!data || data.length === 0) {
    console.warn("No data received in addMarkers. Markers will not be added.");
    return;
  }
  
  // Normalize data: if an item lacks 'properties' but has 'tags', assign properties = tags.
  data = data.map(item => {
    if (!item.properties && item.tags) {
      item.properties = item.tags;
    }
    return item;
  });
  
  markerCluster.clearLayers();
  
  data.forEach(item => {
    console.log("Processing item:", item);
    
    let lat, lng;
    if (item.geometry && Array.isArray(item.geometry.coordinates)) {
      // GeoJSON stores coordinates as [lng, lat]
      lat = parseFloat(item.geometry.coordinates[1]);
      lng = parseFloat(item.geometry.coordinates[0]);
    } else {
      lat = parseFloat(item.latitude) || parseFloat(item.lat);
      lng = parseFloat(item.longitude) || parseFloat(item.lon);
    }
    
    console.log("Extracted coordinates:", { lat, lng });
    
    if (isNaN(lat) || isNaN(lng)) {
      console.warn("Skipping item due to invalid coordinates:", item);
      return;
    }
    
    const popupContent = buildPopupContent(item);
    let markerOptions = {};
    
    // Instead of using L.icon, we use L.divIcon for peaks
    if (
      item.properties &&
      typeof item.properties.natural === "string" &&
      item.properties.natural.trim().toLowerCase() === "peak"
    ) {
      markerOptions.icon = createPeakDivIcon();
      console.log("Using custom divIcon for peak item:", item);
    }
    
    const marker = L.marker([lat, lng], markerOptions).bindPopup(popupContent);
    marker.on("click", () => {
      showDetailView(item);
    });
    markerCluster.addLayer(marker);
  });
  
  console.log("Total markers processed:", data.length);
  const counterElem = document.getElementById("caseTotal");
  if (counterElem) {
    counterElem.textContent = data.length;
  }
}

export function updateHeatLayer(map, data) {
  const heatData = data.map(item => {
    let lat, lng;
    if (item.geometry && Array.isArray(item.geometry.coordinates)) {
      lat = parseFloat(item.geometry.coordinates[1]);
      lng = parseFloat(item.geometry.coordinates[0]);
    } else {
      lat = parseFloat(item.latitude) || parseFloat(item.lat);
      lng = parseFloat(item.longitude) || parseFloat(item.lon);
    }
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
