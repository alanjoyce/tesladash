var currentLat;
var currentLon;
var currentCity;
var currentState;
var currentTemp;
var currentWeather;
var currentPhotoID;
var currentPlaceDescription;
var photoCSS;

var PHOTO_TAGS = "nature,city,landscape,beautiful,scenic,sky";
var DATA_REFRESH_DELAY = 120 * 1000;
var PAGE_REFRESH_DELAY = 14400 * 1000;
var IMAGE_LOAD_DELAY = 10 * 1000;

function init() {
  getPosition();
  setInterval(getPosition, DATA_REFRESH_DELAY);
  setTimeout(function(){window.location.reload();}, PAGE_REFRESH_DELAY);
}

function getPosition() {
  navigator.geolocation.getCurrentPosition(updatePosition, null, {enableHighAccuracy: true, maximumAge: 0});
}

function updatePosition(position) {
  console.log(position);

  currentLat = position.coords.latitude;
  currentLon = position.coords.longitude;

  // $("#latDisplay").html(currentLat);
  // $("#lonDisplay").html(currentLon);
  
  //Update the current picture
  callAPI("https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + FLICKR_KEY + "&lat=" + currentLat + "&lon=" + currentLon + "&content_type=1&media=photos&accuracy=11&tags=" + PHOTO_TAGS + "&sort=date-posted-desc&per_page=1&format=json&nojsoncallback=1", updatePicture);
  
  //Update the current city name (timed roughly with photo load)
  setTimeout(function(){callAPI("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + currentLat + "," + currentLon, updateCity);}, IMAGE_LOAD_DELAY);
  
  //Update the current weather (timed roughly with photo load)
  setTimeout(function(){callAPI("http://forecast.weather.gov/MapClick.php?lat=" + currentLat + "&lon=" + currentLon + "&FcstType=json&callback=?", updateWeather);}, IMAGE_LOAD_DELAY);

  //Make the status display visible
  setTimeout(function(){$("#statusDisplay").css('display', "block");}, IMAGE_LOAD_DELAY);
}

function updateCity(locationData) {
  var city;
  var state;

  $.each(locationData.results[0].address_components, function(i, component) {
    if(component.types[0] == "locality") {
      city = component.long_name;
    }
    else if(component.types[0] == "administrative_area_level_1") {
      state = component.short_name;
    }
  });
  
  if(city && city != currentCity) {
    $("#cityDisplay").html(city);
    currentCity = city;

    if(state && state != currentState) {
      $("#stateDisplay").html(state);
      currentState = state;
    }

    //Update the current place description
    callAPI("https://en.wikipedia.org/w/api.php?format=json&callback=?&action=query&prop=extracts&titles=" + currentCity + ", " + currentState + "&redirects=true", updatePlaceDescription);
  }
}

function updateWeather(weatherData) {
  console.log(weatherData);
  var temp = weatherData.currentobservation.Temp;
  var weather = weatherData.data.weather[0];

  if(temp && temp != currentTemp) {
    $("#weatherDegrees").html(weatherData.currentobservation.Temp);
    currentTemp = temp;
  }
  if(weather && weather != currentWeather) {
    $("#weatherText").html(weatherData.data.weather[0]);
    currentWeather = weather;
  }
}

function updatePicture(pictureData) {
  console.log(pictureData);
  if(pictureData.photos.total > 0) {
    var photoID = pictureData.photos.photo[0].id;
    if(photoID && photoID != currentPhotoID) {
      callAPI("https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=" + FLICKR_KEY + "&photo_id=" + photoID + "&format=json&nojsoncallback=1", updateBackgroundImage);
      setTimeout(function(){callAPI("https://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=" + FLICKR_KEY + "&user_id=" + pictureData.photos.photo[0].owner + "&format=json&nojsoncallback=1", updatePhotoOwner);}, IMAGE_LOAD_DELAY);
      currentPhotoID = photoID;
    }
  }
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
    photoCSS = "url(" + photoURL + ") no-repeat center fixed";
    
    //Fade to the new image
    $("#backgroundImageSwap").css('opacity', 1.0);
    $("#backgroundImageSwap").css('display', "block");
    $("#backgroundImage").css('background', photoCSS);
    setTimeout(function(){$("#backgroundImageSwap").fadeOut(1000, function(){$("#backgroundImageSwap").css('background', photoCSS);});}, IMAGE_LOAD_DELAY);
  }
}

function updatePhotoOwner(ownerData) {
  console.log(ownerData);
  var ownerUsername = ownerData.person.username._content;
  if(ownerUsername) {
    $("#photoOwnerName").html(ownerUsername);
  }
}

function updatePlaceDescription(descriptionData) {
  console.log(descriptionData);
  var description;
  for(var key in descriptionData.query.pages) {
    description = descriptionData.query.pages[key].extract;
  }
  
  //Stop the description at the end of the first paragraph
  description = description.substring(0, description.indexOf("</p>") + 3);
  
  if(description && description != currentPlaceDescription) {
    $("#placeDescription").html(description);
    currentPlaceDescription = description;
  }
}

function callAPI(url, callback) {
  $.getJSON(url, callback);
}
