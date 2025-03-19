(function() {
  // Array of marker categories with icon URLs and labels.
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
  { icon: "https://themissinglist.com/wp-content/uploads/2025/02/fossil_4937565.png", label: "Palaeontological Site" },
  { icon: "https://example.com/path/to/other-icon.png", label: "Other" }  // Add a default icon or a placeholder if desired.
];

  /**
   * updateMapStats() iterates over all markers in window.currentTrailsLayer
   * and counts the markers by their legendCategory.
   * It then builds HTML that displays each marker's icon, label, and overall count.
   */
  function updateMapStats() {
    let counts = {};
    legendItems.forEach(item => {
      counts[item.label] = 0;
    });

    if (window.currentTrailsLayer) {
      window.currentTrailsLayer.eachLayer(function(layer) {
        if (layer.legendCategory) {
          let cat = layer.legendCategory;
          if (counts.hasOwnProperty(cat)) {
            counts[cat]++;
          } else {
            counts[cat] = 1;
          }
        }
      });
    }

    let html = "<h3>Map Marker Statistics</h3><ul style='list-style:none; padding:0;'>";
    legendItems.forEach(item => {
      html += `<li style="display:flex; align-items:center; margin-bottom:5px;">
                 <img src="${item.icon}" alt="${item.label}" style="width:28px; height:32px; margin-right:6px; object-fit:contain;">
                 <span style="flex:1;">${item.label}</span>
                 <span>${counts[item.label]}</span>
               </li>`;
    });
    html += "</ul>";

    const mapStatsContent = document.getElementById("mapStatsContent");
    if (mapStatsContent) {
      mapStatsContent.innerHTML = html;
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    const mapStatsTab = document.querySelector('#aboutStatsTabs .tab[data-tab="mapStats"]');
    if (mapStatsTab) {
      mapStatsTab.addEventListener("click", updateMapStats);
    }
  });
})();
