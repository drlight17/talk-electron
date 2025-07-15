const { ipcRenderer } = require('electron');

// Save original Notification constructor
const OriginalNotification = window.Notification;

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

// Preserve permission status
window.Notification.permission = OriginalNotification.permission;
window.Notification.requestPermission = OriginalNotification.requestPermission;