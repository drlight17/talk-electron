const { ipcRenderer } = require('electron');

// Save original Notification constructor
const OriginalNotification = window.Notification;


// prevent unsupportedBrowser
try {
    localStorage.setItem("nextcloud_vol_Y29yZQ==_unsupported-browser-ignore", true);
    console.log('Nextcloud unsupported browser ignore set');
} catch (error) {
    console.error('Failed to set localStorage:', error);
}


//window.addEventListener('DOMContentLoaded', () => {

  const isSysNotiEnabled = process.argv.find(arg => arg.startsWith('--isSysNotiEnabled'));

  if (!isSysNotiEnabled) {
    // Override Notification
    window.Notification = function(title, data, options) {
      // Send to main process
      ipcRenderer.send('show-electron-notification', {
        title,
        data,
        options
      });

      // Return dummy notification object
      return {
        onclick: null,
        onshow: null,
        onclose: null,
        onerror: null
      };
    };
  }
//}


// Preserve permission status
window.Notification.permission = OriginalNotification.permission;
window.Notification.requestPermission = OriginalNotification.requestPermission;
