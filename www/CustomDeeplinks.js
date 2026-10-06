var exec = require('cordova/exec');
var PLUGIN_NAME = 'CustomDeeplinks';

module.exports = {
  onDeepLink: function (url) {
    var event = new CustomEvent('deeplinks', { detail: { url: url } });
    window.dispatchEvent(event);
    
    exec(null, null, PLUGIN_NAME, 'clearPendingDeeplink', []);
  },

  getPendingDeeplink: function (callback) {
    exec(
      function (url) {
        if (typeof callback === 'function') {
          callback(url);
        }
      },
      function (err) {
        console.error('Cannot get pending deeplink:', err);
        if (typeof callback === 'function') {
          callback(null);
        }
      },
      PLUGIN_NAME,
      'getPendingDeeplink',
      []
    );
  }
};
