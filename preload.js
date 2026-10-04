const { ipcRenderer } = require('electron');

function debug(...args) {
    ipcRenderer.send('talk-debug', ...args);
}

// Save original Notification constructor
const OriginalNotification = window.Notification;


// prevent unsupportedBrowser
try {
    localStorage.setItem("nextcloud_vol_Y29yZQ==_unsupported-browser-ignore", true);
    console.log('Nextcloud unsupported browser ignore set');
} catch (error) {
    console.log('Failed to set localStorage:', error);
}


  const isSysNotiEnabled = process.argv.find(arg => arg.startsWith('--isSysNotiEnabled'));

  if (!isSysNotiEnabled) {
    // Override Notification
    window.Notification = function(title, data, options) {
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


// Preserve permission status
window.Notification.permission = OriginalNotification.permission;
window.Notification.requestPermission = OriginalNotification.requestPermission;

// hook polling messages action read and room
function hookReadRoomXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;



    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._hookedUrl = String(url);

        return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(body) {
        const url = this._hookedUrl || '';
        if (url.includes('room?modifiedSince=') || url.includes('/read')) {
            ipcRenderer.send('preload', JSON.stringify({'action': 'fetchunread'}));
        }

        return originalSend.call(this, body);
    };
}

hookReadRoomXHR();