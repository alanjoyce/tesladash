var currentLat;
var currentLon;
var currentHeading;
var currentTime;
var prevLat;
var prevLon;
var prevTime;

var currentCity;
var currentState;
var currentTemp;
var currentWeather;
var currentPhotoID;
var currentPlaceDescription;
var photoCSS;

var PHOTO_TAGS = "nature,city,landscape,beautiful,scenic,sky";
var DATA_REFRESH_DELAY = 60 * 1000;
var PAGE_REFRESH_DELAY = 14400 * 1000;
var IMAGE_LOAD_DELAY = 5 * 1000;

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
  currentHeading = position.coords.heading;
  currentTime = new Date().getTime();

  if(currentLat == prevLat && currentLon == prevLon) {
    return;
  }
  
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

  //Check for traffic incidents upcoming on the route
  if(prevLat != null && prevLon != null) {
    var latDiff = currentLat - prevLat;
    var lonDiff = currentLon - prevLon;
    var predictedLat = currentLat + (10 * latDiff);
    var predictedLon = currentLon + (10 * lonDiff);
    var minLat = Math.min(currentLat, predictedLat);
    var maxLat = Math.max(currentLat, predictedLat);
    var minLon = Math.min(currentLon, predictedLon);
    var maxLon = Math.max(currentLon, predictedLon);
    minLat = minLat - 0.005;
    maxLat = maxLat + 0.005;
    minLon = minLon - 0.005;
    maxLon = maxLon + 0.005;
    setTimeout(function(){callAPI("traffic.php?left=" + minLon + "&right=" + maxLon + "&bottom=" + minLat + "&top=" + maxLat, updateTraffic);}, IMAGE_LOAD_DELAY);
  }

  prevLat = currentLat;
  prevLon = currentLon;
  prevTime = currentTime;
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
  //console.log(weatherData);
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

function updateTraffic(trafficData) {
  console.log(trafficData);
  var noneHTML = "<span class='none'>none</span>";

  var alertsHTML = "";
  if(trafficData.alerts) {
    for(var i = 0; i < trafficData.alerts.length; i++) {
      var alert = trafficData.alerts[i];
      if(alert.type == "CHAT_CHAT") {
        continue;
      }
      alertsHTML += "<li>" + alert.type;
      if(alert.subtype) {
        alertsHTML += " / " + alert.subtype;
      }
      if(alert.street) {
        alertsHTML += "<br />" + alert.street;
      }
      alertsHTML += "</li>";
    }
  }
  else {
    alertsHTML = noneHTML;
  }
  if(alertsHTML == "") {
    alertsHTML = noneHTML;
  }
  $("#alertsHTML").html(alertsHTML);

  var jamsHTML = "";
  if(trafficData.jams) {
    for(var i = 0; i < trafficData.jams.length; i++) {
      var jam = trafficData.jams[i];
      if(jam.severity < 2 || !jam.street) {
        continue;
      }
      jamsHTML += "<li>" + jam.street;
      if(jam.endNode) {
        jamsHTML += " " + jam.endNode;
      }
      if(jam.blockDescription && jam.blockDescription.substring(0,4) != "http") {
        jamsHTML += "<br />" + jam.blockDescription;
      }
      else {
        jamsHTML += "<br />" + Math.round(jam.speed) + " mph";
      }
      jamsHTML += "</li>";
    }
  }
  else {
    jamsHTML = noneHTML;
  }
  if(jamsHTML == "") {
    jamsHTML = noneHTML;
  }
  $("#trafficJams").html(jamsHTML);
}

function updatePicture(pictureData) {
  //console.log(pictureData);
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
  //console.log(imageData);
  var photoURL;
  for(var i in imageData.sizes.size) {
    var size = imageData.sizes.size[i];
    photoURL = size.source;
    if(size.width > 1160 && size.height > 1240) {
      break;
    }
  }
  if(photoURL) {
    photoCSS = "url(" + photoURL + ")";
    
    //Fade to the new image
    $("#backgroundImageSwap").css('opacity', 1.0);
    $("#backgroundImageSwap").css('display', "block");
    $("#backgroundImage").css('background-image', photoCSS);
    setTimeout(function(){$("#backgroundImageSwap").fadeOut(1000, function(){$("#backgroundImageSwap").css('background-image', photoCSS);});}, IMAGE_LOAD_DELAY);
  }
}

function updatePhotoOwner(ownerData) {
  //console.log(ownerData);
  var ownerUsername = ownerData.person.username._content;
  if(ownerUsername) {
    $("#photoOwnerName").html(ownerUsername);
  }
}

function updatePlaceDescription(descriptionData) {
  //console.log(descriptionData);
  var description;
  for(var key in descriptionData.query.pages) {
    description = descriptionData.query.pages[key].extract;
  }
  
  //Stop the description at the end of the first paragraph
  description = description.substring(0, description.indexOf("</p>") + 3);

  //Try to remove pronunciation guides
  description = description.replace(/\s?\(\<span\>.*\<\/span\>\)\s?/g, "");
  
  if(description && description != currentPlaceDescription) {
    $("#placeDescription").html(description);
    currentPlaceDescription = description;
  }
}

function callAPI(url, callback) {
  console.log("Calling " + url);
  $.getJSON(url, callback);
}

