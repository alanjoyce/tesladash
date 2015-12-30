var currentPosition;

function init() {
  navigator.geolocation.getCurrentPosition(updatePosition);
}

function updatePosition(position) {
  currentPosition = position;
}
