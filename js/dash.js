function setUA(window, UA) {
  if(window.navigator.userAgent != UA) {
    var userAgentProp = {get: function() {return UA;}};
    try {
      Object.defineProperty(window.navigator, 'userAgent', userAgentProp);
    } catch(e) {
      window.navigator = Object.create(navigator, {
        userAgent: userAgentProp
      });
    }
  }
}

