// assets/js/api.js
export const API_URL = "https://themissinglist.com/wp-json/hiddengs/v1/locations/";

export async function loadDataFromAPI() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading API data:", error);
    throw error;
  }
}
