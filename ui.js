// assets/js/ui.js
export function setupUI(updateMapForFilters, populateNamesList) {
  const ageInput = document.getElementById("age");
  const dateSlider = document.getElementById("dateSlider");
  const toggleFilterButton = document.getElementById("toggleFilter");

  ageInput.addEventListener("input", (e) => {
    document.getElementById("ageValue").textContent = e.target.value;
    updateMapForFilters();
  });

  dateSlider.addEventListener("input", (e) => {
    document.getElementById("dateValue").textContent = new Date(parseInt(e.target.value)).toLocaleDateString();
    updateMapForFilters();
  });

  toggleFilterButton.addEventListener("click", () => {
    const panelContent = document.getElementById("filterContent");
    if (panelContent.style.display === "none") {
      panelContent.style.display = "block";
      toggleFilterButton.textContent = "Collapse Filter";
    } else {
      panelContent.style.display = "none";
      toggleFilterButton.textContent = "Expand Filter";
    }
  });

  // Apply and Reset buttons.
  document.getElementById("applyFilters").addEventListener("click", updateMapForFilters);
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("age").value = document.getElementById("age").max;
    document.getElementById("ageValue").textContent = document.getElementById("age").max;
    const globalMaxDate = window.globalMaxDate || 0;
    document.getElementById("dateSlider").value = globalMaxDate;
    document.getElementById("dateValue").textContent = new Date(globalMaxDate).toLocaleDateString();
    document.getElementById("gender").value = "";
    document.getElementById("location").value = "";
    document.getElementById("park").value = "";
    updateMapForFilters();
    populateNamesList();
  });
}
