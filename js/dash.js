var currentLat;
var currentLon;
var currentCity;
var currentState;

function init() {
  navigator.geolocation.getCurrentPosition(updatePosition, null, {enableHighAccuracy: true, maximumAge: 0});
}

function updatePosition(position) {
  console.log(position);

  currentLat = position.coords.latitude;
  currentLon = position.coords.longitude;

  // $("#latDisplay").html(currentLat);
  // $("#lonDisplay").html(currentLon);
  
  //Update the current city name
  callAPI("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + currentLat + "," + currentLon, updateCity);
  
  //Update the current weather
  callAPI("http://forecast.weather.gov/MapClick.php?lat=" + currentLat + "&lon=" + currentLon + "&FcstType=json", updateWeather);
}

function updateCity(locationData) {
  $.each(locationData.results[0].address_components, function(i, component) {
    if(component.types[0] == "locality") {
      currentCity = component.long_name;
    }
    else if(component.types[0] == "administrative_area_level_1") {
      currentState = component.short_name;
    }
  });

  $("#cityDisplay").html(currentCity);
  $("#stateDisplay").html(currentState);
}

function updateWeather(weatherData) {
  console.log(weatherData);
  $("#weatherDegrees").html(weatherData.currentobservation.Temp);
  $("#weatherText").html(weatherData.data.weather[0]);
}

function callAPI(url, callback) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.onreadystatechange = function() {
    if(request.readyState == 4 && request.status == 200) {
      var data = JSON.parse(request.responseText);
      callback(data);
    }
  }
  request.send();
}
