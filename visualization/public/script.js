let map;
let markers = [];

function updateWeatherVisualization(condition) {
  clearWeatherVisualization();
  fetchUSWeatherData(condition).then(locationsData => {
    visualizeWeatherCondition(locationsData, condition);
  }).catch(error => {
    console.error('Failed to fetch weather data:', error);
  });
}

function fetchUSWeatherData(condition) {
  const citiesPromise = fetch('cities.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch city data');
      }
      return response.json();
    });

  return citiesPromise.then(cities => {
    const apiKey = '4fa861018291fcdd7cfbb2d37a4ae6cc';
    const promises = cities.map(city => {
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`;
      return fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch weather data');
          }
          return response.json();
        })
        .then(data => ({ name: city.name, data: data }));
    });

    return Promise.all(promises);
  });
}

function visualizeWeatherCondition(locationsData, condition) {
  locationsData.forEach(locationData => {
    let color;
    const data = locationData.data;
    const name = locationData.name;
    let value;

    if (condition === 'temperature') {
      const tempCelsius = data.main.temp.toFixed(1); 
      const tempFahrenheit = celsiusToFahrenheit(tempCelsius);
      value = { celsius: tempCelsius, fahrenheit: tempFahrenheit };
    } else if (condition === 'precipitation') {
      value = (data.rain && data.rain['1h']) ? data.rain['1h'].toFixed(1) : 0; 
    } else if (condition === 'wind') {
      value = data.wind.speed.toFixed(1); 
    } else {
      console.error('Invalid condition');
      return;
    }

    color = getColorByValue(condition, value);

    const circleMarker = L.circleMarker([data.coord.lat, data.coord.lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      radius: 10
    }).addTo(map);

    circleMarker.bindPopup(`<b>${name}: ${condition}: ${value.celsius}°C / ${value.fahrenheit}°F</b>`).openPopup();
    markers.push(circleMarker);
  });
}

function clearWeatherVisualization() {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
}

function getColorByValue(condition, value) {
  if (condition === 'temperature') {
    if (value.celsius < 0) return '#0000ff'; // Blue
    else if (value.celsius < 10) return '#00ffff'; // Cyan
    else if (value.celsius < 20) return '#00ff00'; // Green
    else if (value.celsius < 30) return '#ffff00'; // Yellow
    else return '#ff0000'; // Red

  } else if (condition === 'precipitation') {
    if (value === 0) return '#ffffff'; // White
    else if (value < 5) return '#add8e6'; // Skyblue
    else return '#0000ff'; // Blue

  } else if (condition === 'wind') {
    if (value < 2) return '#00ff00'; // Green
    else if (value < 5) return '#ffff00'; // Yellow
    else if (value < 10) return '#ffa500'; // Orange
    else return '#ff0000'; // Red
  }
}

function celsiusToFahrenheit(celsius) {
  return ((celsius * 9/5) + 32).toFixed(1); 
}

document.addEventListener("DOMContentLoaded", function() {
  if (!map) { 
    map = L.map('map', {
      center: [37.0902, -95.7129],
      zoom: 4
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  }

  const conditions = document.querySelectorAll(".condition");
  conditions.forEach(condition => {
    condition.addEventListener("click", function() {
      conditions.forEach(c => c.classList.remove("active"));
      this.classList.add("active");
      updateWeatherVisualization(this.id);
    });
  });

  updateWeatherVisualization('temperature');
});
