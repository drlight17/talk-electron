// preload-donate.js
const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {

    send: (channel, data) => {

        let validChannels = ['donate-modal-response'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    receive: (channel, func) => {
        let validChannels = ['load-donate-data'];
        if (validChannels.includes(channel)) {
            ipcRenderer.once(channel, (event, ...args) => func(...args));
        }
    }
});