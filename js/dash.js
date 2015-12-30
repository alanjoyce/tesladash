var currentPos;
var currentCity;
var currentState;

function init() {
  navigator.geolocation.getCurrentPosition(updatePosition, null, {enableHighAccuracy: true, maximumAge: 0});
}

function updatePosition(position) {
  currentPos = position;

  console.log(currentPos);

  var lat = currentPos.coords.latitude;
  var lon = currentPos.coords.longitude;

  $("#latDisplay").html(lat);
  $("#lonDisplay").html(lon);

  callAPI("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lon, updateCity);
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
