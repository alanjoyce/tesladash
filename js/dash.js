var currentLat;
var currentLon;
var currentCity;
var currentState;

var PHOTO_TAGS = "nature,city,landscape,beautiful,scenic,sky";

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

  //Update the current picture
  callAPI("https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + FLICKR_KEY + "&lat=" + currentLat + "&lon=" + currentLon + "&content_type=1&media=photos&accuracy=11&tags=" + PHOTO_TAGS + "&sort=date-posted-desc&per_page=1&format=json&nojsoncallback=1", updatePicture);
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

function updatePicture(pictureData) {
  console.log(pictureData);
  var photoID = pictureData.photos.photo[0].id;
  callAPI("https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=" + FLICKR_KEY + "&photo_id=" + photoID + "&format=json&nojsoncallback=1", updateBackgroundImage);
}

function updateBackgroundImage(imageData) {
  console.log(imageData);
  var photoURL;
  for(var i in imageData.sizes.size) {
    var size = imageData.sizes.size[i];
    photoURL = size.source;
    if(size.width > 1160 && size.height > 1240) {
      break;
    }
  }
  if(photoURL) {
    $("#backgroundImage").css('background-image', "url(" + photoURL + ")");
  }
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
