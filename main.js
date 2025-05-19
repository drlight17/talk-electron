 // Modules to control application life and create native browser window

const prompt = require('electron-prompt');

const sharp = require('sharp');

// for password save function
const keytar = require('keytar');

const ShutdownHandler = require('@paymoapp/electron-shutdown-handler').default;
const fetch = require('electron-fetch').default

const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'



/*if ((isMac) || (isLinux)) {
  var { app, clipboard, BrowserWindow, Menu, Tray, nativeImage, Notification, dialog, session, shell, powerMonitor, nativeTheme } = require('electron')
}
if (isWindows) {
  var { app, clipboard, Menu, Tray, nativeImage, Notification, dialog, session, shell, powerMonitor, nativeTheme } = require('electron')
  var { BrowserWindow } = require('electron-acrylic-window') // return BrowserWindows to electron in case of not using electron-acrylic-window
}*/
const { app, clipboard, BrowserWindow, Menu, Tray, nativeImage, Notification, dialog, session, shell, powerMonitor, nativeTheme, desktopCapturer } = require('electron')
const os = require('os');
const { exec } = require('child_process');
const { execFile } = require('child_process');

//const SystemIdleTime = require('@paulcbetts/system-idle-time');
const SystemIdleTime = require('desktop-idle');


const fs = require("fs");
const { join } = require('path');
const path = require('node:path');


const Store = require('electron-store');

const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

const packageJsonPath = path.join(app.getAppPath(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const appNameLC = packageJson.name;


// if dev mode then use different userData folder
/*if (!app.isPackaged) {
    console.log('App is in dev mode');
    let current_app_dir = app.getPath('userData')
    app.setPath ('userData', current_app_dir+"-dev");
} else {
    console.log('App is in production mode');
}*/

try {

  main();

  async function main() {

    //const store = new Store();

    function writeLog(message) {

      const logFilePath = path.join(app.getPath('userData'), 'app.log');
      const timestamp = new Date().toLocaleString();
      const logMessage = `[${timestamp}] ${message}\n`;
      console.log( `[${timestamp}] ${message}`);
      if (store.get('logging')) {
        fs.appendFile(logFilePath, logMessage, (err) => {
          if (err) {
            console.error(`[${timestamp}] 'Error when tring to write log:'`, err);
          }
        });
      }
    }
    async function openLog(filePath) {

      try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          await dialog.showMessageBox({
            type: 'error',
            message: 'File not found',
            detail: `The file ${filePath} does not exist.`
          });
          return;
        }

        // Try to open the file
        const error = await shell.openPath(filePath);
        if (error) {
          await dialog.showMessageBox({
            type: 'error',
            message: `Failed to open file ${filePath}`,
            detail: `No application is associated with this file type. Error: ${error}`
          });
        }
      } catch (err) {
        writeLog('Unexpected error:', err);
        await dialog.showMessageBox({
          type: 'error',
          message: 'Unexpected error',
          detail: err.message
        });
      }
    }

    function getResourceDirectory () {
      //return process.env.NODE_ENV === "development"
      if (!app.isPackaged) {

        let current_app_dir = app.getPath('userData')
        // don't delete if already not empty userData folder from prod app
        if (fs.readdirSync(current_app_dir).length === 0) {
          fs.rmSync(current_app_dir, { recursive: true, force: true });
        }
        app.setPath ('userData', current_app_dir+"-dev");

        return path.join(process.cwd())
      } else {
        return path.join(process.resourcesPath, "app.asar.unpacked");
      }
    };

    if (!isMac) {
      var iconPath = path.resolve(getResourceDirectory(), "icon.png");
      store = new Store();
    } else {
      getResourceDirectory();
      store = new Store();
      var iconPath = path.join(__dirname,store.get('app_icon_name')||'iconTemplate.png');


    }

    var i18n = new(require('./translations/i18n'));

    const gotTheLock = app.requestSingleInstanceLock();

    if (!app.isPackaged) {
      writeLog(app.getName() + " v."+app.getVersion() + ' is started in dev mode');
    } else {
      writeLog(app.getName() + " v."+app.getVersion() + ' is started in production mode');
    }

    // TODO check allow_multiple in newer version
    let allow_multiple = false/*store.get('allow_multiple') ? JSON.parse(store.get('allow_multiple')) : false;*/
    // prevent multiple instances, focus on the existed app instead
    if (!gotTheLock) {
      if (!allow_multiple) {
        app.exit(0);
      }
    } else {
      if (!allow_multiple) {
        app.on('second-instance', (event) => {
          if (win) {
            //if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
            if (isMac) app.dock.show();
          }
        })
      }

      try {

        
        /*process.stdout.on('error', (err) => {
          if (err.code === 'EPIPE') {
          } else {
            writeLog(err);
          }
        });*/

        //  turn off console.log errors in case of app.exit(0) in AppImage
        process.on('uncaughtException', (error) => {
          //writeLog(error)
        });

        // to check prompted status for dialogs
        let prompted = false
        let auto_login_error = false
        let idleTime_non_active = 0;
        // to check gui_blocked status
        //let gui_blocked = false
        //let is_notification = false;
        // for storing unread counter
        let unread = false;
        let unread_prev = false;
        let call = false;
        let call_prev = false;
        // to store settings menu opened status
        let settings_opened = false;

        setTimeout(() => { setInterval(function() {checkNewVersion(app.getVersion())},60*60*1000);}, 3000); // check version in every hour with 3 sec delay for the first time

        let url = "";
        const url_example = 'https://cloud.example.com';

        if (!((app.commandLine.getSwitchValue("server_url") == undefined) || (app.commandLine.getSwitchValue("server_url") == ""))) {
          // overwrite server_url if arg is given
          if (app.commandLine.getSwitchValue("server_url").startsWith("http://")) {
              url = app.commandLine.getSwitchValue("server_url").replace("http://", "https://");
          }
          store.set('server_url',url)
          //url = app.commandLine.getSwitchValue("server_url");
        } else if (!((store.get('server_url') == undefined) || (store.get('server_url') == ""))) {
          url = store.get('server_url');
        }

        // save current app exec path in config file
        if (!store.get('exec_path')) {
          store.set('exec_path',app.getPath('exe'));
        }

        // check if logging is configured and set default false if not
        if (store.get('logging') === undefined) {
          store.set('logging', false);
        }

        let icon = nativeImage.createFromPath(iconPath); // template with center transparency
        let trayIcon = icon
        let dockIcon = icon

        if (isMac) {
          var icon_bw = await bw_icon_process(icon);
          // as this icon is for macos tray only resize it here
          icon_bw = icon_bw.resize({width:16});
        }
        //icon = icon_bw

        //const icon_notification = nativeImage.createFromPath(path.join(__dirname,store.get('notification_icon_name')||'notification.png'));
        //const icon_red_dot = nativeImage.createFromPath(path.join(__dirname,'red_dot.png'));


        //const icon = './icon.png';
        // set run at startup
        if (store.get('run_at_startup')) {

          let executable = appNameLC;
          let Path = '';
          let exec_changed = false;

          if (isLinux) {
            if (process.env.APPIMAGE) {
              executable = process.env.APPIMAGE;
            } else {
              executable = app.getPath('exe');
            }

            if (executable != store.get('exec_path')) {
              writeLog("Exec path were changed! Force change of systemd service ExecStart.")
              store.set('exec_path', executable)
              exec_changed = true;
            }
          }

          if (isWindows) {
            app.setLoginItemSettings({
                openAtLogin: true,
                //name: app.getName() + " v."+app.getVersion() // to fix version in registry autorun
                name: app.getName()
            })
            writeLog("Application was set to autostart")
          }

          if (isLinux) {
            if (process.env.APPIMAGE) {
              Path = process.env.APPIMAGE.replace(/\/[^\/]*$/, '/');
              executable = `"`+process.env.APPIMAGE+`"`;
            } else {
              Path = app.getPath('exe').replace(/\/[^\/]*$/, '/');
              executable = `"`+app.getPath('exe')+`"`;
            }
            /*const isKDE = process.env.KDE_SESSION_VERSION !== undefined;
            if (isKDE) {
              executable = `sleep 15 && ` + executable;
            }*/
            let shortcut_contents = `[Desktop Entry]
Categories=Network;
Comment=Talk web embedded app
Exec=bash -c 'systemctl --user start `+appNameLC+`.service'
Name=NC Talk Electron
StartupWMClass=NC Talk Electron
Terminal=false
Type=Application
Icon=`+appNameLC+`
X-GNOME-Autostart-Delay=15`;
          let systemd_contents = `[Unit]
Description=Talk web embedded app
After=graphical-session.target
Requires=graphical-session.target

[Service]
Type=simple
Restart=on-failure
RestartSec=5s
WorkingDirectory=`+Path+`
ExecStart=bash -c '`+executable+` --systemd'
Environment="NODE_ENV=production"

[Install]
WantedBy=graphical-session.target`;

            if (!fs.existsSync(app.getPath('home')+"/.config/autostart/"+appNameLC+".desktop")) {
              //fs.unlinkSync(app.getPath('home')+"/.config/autostart/"+appNameLC+".desktop")
              fs.writeFileSync(app.getPath('home')+"/.config/autostart/"+appNameLC+".desktop",shortcut_contents, 'utf-8');
            }
            if ((!fs.existsSync(app.getPath('home')+"/.config/systemd/user/"+appNameLC+".service")) || exec_changed) {
              fs.writeFileSync(app.getPath('home')+"/.config/systemd/user/"+appNameLC+".service",systemd_contents, 'utf-8');
              exec(`systemctl --user daemon-reload`);
              exec(`systemctl --user enable `+appNameLC+`.service`);
              writeLog("Application was set to autostart as user systemd service")
            }
          }
          if (isMac) {
            let plist_contents =`
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.electron.`+appNameLC+`</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/NC Talk Electron.app/Contents/MacOS/NC Talk Electron</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
`;
            if (!fs.existsSync(app.getPath('home')+"/Library/LaunchAgents/com.electron."+appNameLC+".plist")) {
              fs.writeFileSync(app.getPath('home')+"/Library/LaunchAgents/com.electron."+appNameLC+".plist",plist_contents, 'utf-8');
              exec('launchctl bootstrap enable '+app.getPath('home')+'/Library/LaunchAgents/com.electron.'+appNameLC+'.plist');
              writeLog("Application was set to autostart as service")
            }
          }
        } else {
          if (isWindows) {
            app.setLoginItemSettings({
                openAtLogin: false,
                //name: app.getName() + " v."+app.getVersion()  // to fix version in registry autorun
                name: app.getName()
            })
            writeLog("Application was removed from autostart")
          }
          if (isLinux) {
            if (fs.existsSync(app.getPath('home')+"/.config/autostart/"+appNameLC+".desktop")) {
              fs.unlinkSync(app.getPath('home')+"/.config/autostart/"+appNameLC+".desktop")
            }
            if (fs.existsSync(app.getPath('home')+"/.config/systemd/user/"+appNameLC+".service")) {
              exec(`systemctl --user disable `+appNameLC+`.service`);
              fs.unlinkSync(app.getPath('home')+"/.config/systemd/user/"+appNameLC+".service")
              exec(`systemctl --user daemon-reload`);
              writeLog("Application was removed from autostart")
            }
          }
          if (isMac) {
            if (fs.existsSync(app.getPath('home')+"/Library/LaunchAgents/com.electron."+appNameLC+".plist")) {
              fs.unlinkSync(app.getPath('home')+"/Library/LaunchAgents/com.electron."+appNameLC+".plist");
              exec('launchctl bootstrap disable com.electron.'+appNameLC);
              writeLog("Application was removed from autostart")
            }
          }
        }

        var win = null;
        //var win_loading = null;
        var appIcon = null;
        var MainMenu = null;

        let mainMenuTemplate = [
            {
              label: i18n.__('file'),
              submenu: [
                {
                  label: i18n.__('open_nc'),
                  click: () => {
                    shell.openExternal(store.get('server_url'));
                  },
                },
                {
                  label: i18n.__('preferences'),
                  click: () => {
                    openSettings();
                  },
                },
                { type: 'separator' },
                {
                  label: (store.get('saved_login')) ? i18n.__('logged_in')+' '+store.get('saved_login') : i18n.__('logged_out'),
                  enabled: (store.get('saved_login'))  ? true : false,
                  submenu: [
                    {
                      label: i18n.__('logout'),
                      click: () => {
                        deleteCredentials(store.get('saved_login'))
                        store.delete('saved_login');
                        session.defaultSession.clearStorageData([], (data) => {});
                        restartApp();
                      },
                    }
                  ]
                },
                { type: 'separator' },
                {
                  label: i18n.__('exit'),
                  accelerator: isMac ? 'Cmd+Q' : 'Alt+X',
                  click: () => {
                    store.set('bounds', win.getBounds());
                    store.delete('latestVersion');
                    store.delete('releaseUrl');
                    if (isMac) {
                      exec('launchctl bootout gui/"$(id -u)"/com.electron.'+appNameLC);
                    }
                    app.exit(0);
                  },
                }
              ]
            },
            {
              label : i18n.__('view'),
              submenu : [
                //{ label : "Обновить", role : "reload" },
                { label: i18n.__('refresh'),
                  click: () => {
                    /*if (!gui_blocked) {
                      block_gui_loading(true);*/
                      win.reload()
                    //}
                  },
                  accelerator: isMac ? 'Cmd+R' : 'Ctrl+R'
                },
                { type: 'separator' },
                { label: i18n.__('hide'),
                  click: () => {
                    if (isMac) app.dock.hide();
                    /*if (!isMac)*/ win.hide();
                  },
                  accelerator: isMac ? 'Cmd+H' : 'Ctrl+H',
                  role : "hide"
                },
                { label: i18n.__('fullscreen'),
                  accelerator: isMac ? 'Cmd+M' : 'Ctrl+M',
                  click: () => {
                    checkMaximize(true);
                    if (isMac) { /*app.dock.setIcon(icon); */app.dock.show();};
                  },
                },
              ]
            },
            {
              label : "?",
              submenu : [

                { label : i18n.__('help'),
                  accelerator: 'F1',
                  click: () => {
                    openPopup('https://docs.nextcloud.com/server/latest/user_manual/ru/talk');
                    //app.exit(0);
                  }
                },
                { label: i18n.__('open_devtools'),
                  accelerator: 'F12',
                  click: () => {
                    win.webContents.toggleDevTools();
                  }
                },
                { type: 'separator' },
                { label : i18n.__('about'),
                  // for linux compatibility
                  click: () => {
                    app.showAboutPanel();
                  }
                }
              ]
            }
        ];

        let appIconMenuTemplate = [

            {
              label: i18n.__('show'),
              click: () => {
                /*if (gui_blocked) {
                  win_loading.show();
                }*/
                win.show()

                if (isMac) { //app.dock.setIcon(dockIcon); 
                  app.dock.show(); addBadgeMac();
                };
              },
            },
            {
              label: i18n.__('hide'),
              click: () => {
                if (isMac) app.dock.hide();
                /*if (!isMac)*/ win.hide();
                //win_loading.hide();
              },
              role : "hide"
            },
            { type: 'separator' },
            {
              label: i18n.__('open_nc'),
              click: () => {
                shell.openExternal(store.get('server_url'));
              },
            },
            {
              label: i18n.__('preferences'),
              click: () => {
                openSettings();
              },
            },
            // set logging to file
            {
              label: i18n.__('logging'),
              submenu: [
                {
                  label: i18n.__('logging_sw'),
                  type: 'checkbox',
                  checked: store.get('logging'),
                  click: (option) => {
                      store.set('logging', option.checked);
                      restartApp();
                  }
                },
                {
                  label: i18n.__('logging_open'),
                  //type: 'checkbox',
                  enabled: store.get('logging'),
                  click: () => {
                    writeLog('Opening log file...');
                    openLog(path.join(app.getPath('userData'), 'app.log'));
                  }
                },
              ]
            },
            {
              label : i18n.__('about'),
              // for linux compatibility
              click: () => {
                app.showAboutPanel();
              }
            },
            { type: 'separator' },
            {
              label: (store.get('saved_login')) ? i18n.__('logged_in')+' '+store.get('saved_login') : i18n.__('logged_out'),
              enabled: (store.get('saved_login'))  ? true : false,
              submenu: [
                {
                  label: i18n.__('logout'),
                  click: () => {
                    deleteCredentials(store.get('saved_login'))
                    store.delete('saved_login');
                    session.defaultSession.clearStorageData([], (data) => {});
                    restartApp();
                  },
                }
              ]
            },
            { type: 'separator' },
            {
              label: i18n.__('exit'),
              click: () => {
                store.set('bounds', win.getBounds());
                store.delete('latestVersion');
                store.delete('releaseUrl');
                if (isMac) {
                  exec('launchctl bootout gui/"$(id -u)"/com.electron.'+appNameLC);
                }
                app.exit(0);
              },
            }
        ];

        /*function checkInactivity() {
            const idleTime = SystemIdleTime.getIdleTime();
            console.log('Idle time is:'+idleTime+' s');
            //const idleTime = Date.now() - lastActivityTime;
            if (idleTime > 4 * 60 ) {
              console.log("User is not active for 4 minutes...");
            } else {
              //simulateActivity();
              if (!win.isVisible() || !win.isFocused()) {
                console.log("User is active for the last 4 minutes so reloading window to simulate activity...");
                win.reload();
              }
            }
        }*/

          function checkInactivity(activity_check_interval) {
            let idleTime = SystemIdleTime.getIdleTime();

            if (!win.isVisible() || !win.isFocused()) {
              idleTime_non_active = idleTime_non_active + activity_check_interval;
            } else {
              idleTime_non_active = 0;
            }

            //console.log('Current idle time is:'+idleTime+' s');
            //console.log('Current hidden or unfocused time is:'+idleTime_non_active+' s');

            if (idleTime_non_active > 4 * 60) {
              if (idleTime <= 4 * 60) {
                writeLog("Window is hidden or unfocused for more than 4 minutes, but user was active - reloading the page...");
                idleTime_non_active = 0;
                win.reload();
              }
            }
        }

        function checkMaximize(click) {
          if (win.isMaximized()) {
            if (click) {
              mainMenuTemplate[1].submenu[3].label = i18n.__("fullscreen");
              win.unmaximize()
            } else {
              mainMenuTemplate[1].submenu[3].label = i18n.__("restore");
            }
          } else {
            if (click) {
              mainMenuTemplate[1].submenu[3].label = i18n.__("restore");
              win.maximize()
            } else {
              mainMenuTemplate[1].submenu[3].label = i18n.__("fullscreen");
            }
          }

          MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
          Menu.setApplicationMenu(MainMenu);
          checkNewVersion(app.getVersion());
        }

        function isInternalLink(url) {
          return url.startsWith('file')
        }

        function isExternalLink(url) {
          return !isInternalLink(url)
        }

        function applyContextMenu(win) {
          win.webContents.on('context-menu', (event, params) => {
            const menuItems = []
            let haveContext = false;

            // Add context actions for misspelling words and typos
            const menuMisspellingItems = [
              ...params.dictionarySuggestions.map(suggestion => ({
                label: suggestion,
                click: () => win.webContents.replaceMisspelling(suggestion),
              })),
              { type: 'separator' },
              {
                //label: 'Add to dictionary',
                label: i18n.__('add_to_dict'),
                click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
              },
              { type: 'separator' },
            ]
            if (params.misspelledWord) {
              menuItems.push(...menuMisspellingItems)
              haveContext = true;
            }

            // Add context actions for handling images
            const menuImageItems = [
              {
                //label: 'Copy image',
                label: i18n.__('copy_image'),
                click: () => win.webContents.copyImageAt(params.x, params.y),
              },
              {
                //label: 'Save image',
                label: i18n.__('save_image'),
                click: () => win.webContents.downloadURL(params.srcURL),
              },
              { type: 'separator' },
            ]
            if (params.hasImageContents) {
              menuItems.push(...menuImageItems)
              haveContext = true;
            }

            // Add context actions for handling links
            const menuLinkItems = [
              {
                //label: 'Copy link address',
                label: i18n.__('copy_link_address'),
                click: () => clipboard.writeText(params.linkURL),
              },
              {
                //label: 'Copy link text',
                label: i18n.__('copy_link_text'),
                click: () => clipboard.writeText(params.linkText.trim() || params.linkURL),
              },
              { type: 'separator' },
            ]
            if (params.linkURL && isExternalLink(params.linkURL)) {
              menuItems.push(...menuLinkItems)
              haveContext = true;
            }

            // Add context actions for clipboard events and text editing
            const menuClipboardItems = [
              {
                role: 'copy',
                label: i18n.__('copy'),
                enabled: params.selectionText && params.editFlags.canCopy,
              },
              {
                role: 'cut',
                label: i18n.__('cut'),
                enabled: params.selectionText && params.isEditable && params.editFlags.canCut,
                visible: params.isEditable,
              },
              {
                role: 'selectAll',
                label: i18n.__('select_all'),
                enabled: params.editFlags.canSelectAll,
              },
              {
                role: 'paste',
                label: i18n.__('paste'),
                enabled: params.isEditable && params.editFlags.canPaste,
                visible: params.isEditable,
              },
              { type: 'separator' },
            ]
            if (params.isEditable || params.selectionText.length) {
              menuItems.push(...menuClipboardItems)
              haveContext = true;
            }

            // TODO Remove or hide from production DevTools toggle before final release
            //menuItems.push({ role: 'toggleDevTools' })

            if (haveContext) {
              Menu.buildFromTemplate(menuItems).popup()
            }
          })
        }
        function getSettings(win) {
              var lang_files = JSON.stringify(i18n.___("get_locales"));
              win.webContents.executeJavaScript(`loadSettings(`+JSON.stringify(store.store)+`,`+lang_files+`);`);
              if (!app.isPackaged) {
                win.webContents.executeJavaScript(`disableRunAtStartup();`);
                //win.webContents.toggleDevTools();
              }
        }

        function addNewVersionLink(releaseUrl,latestVersion) {

          const separator = { type: 'separator' };

          const menu = Menu.getApplicationMenu();
          const newVersionLabel = i18n.__('new_version')+latestVersion;

          const newVersionMenuItem = {
              label: newVersionLabel,
              click: () => {
                  shell.openExternal(releaseUrl);
              }
          };

          const menuItems = menu.items.map(item => item);
          const exists = menuItems.some(item => item.label === newVersionLabel);

          if (!exists) {

            menuItems.push(separator);
            menuItems.push(newVersionMenuItem);


            const updatedMenu = Menu.buildFromTemplate(menuItems);
            Menu.setApplicationMenu(updatedMenu);
          }
        }

        async function checkNewVersion(currentVersion) {
            const cachedVersion = store.get('latestVersion');
            const cachedUrl = store.get('releaseUrl');

            const apiUrl = `https://api.github.com/repos/drlight17/talk-electron/releases/latest`;

            try {
                let latestVersion;
                let releaseUrl;
                //writeLog("Checking new version.")
                if (!cachedVersion && !cachedUrl) {
                  writeLog("Fetch new version info from github.")
                  const response = await fetch(apiUrl);
                  const data = await response.json();

                  latestVersion = data.tag_name;
                  releaseUrl = data.html_url;

                  store.set('latestVersion', latestVersion);
                  store.set('releaseUrl', releaseUrl);

                  //writeLog(`Running version: ${currentVersion}`);
                  //writeLog(`Latest version: ${latestVersion}`);


                } else {
                  //console.log("Using version info from cache.")
                  latestVersion = cachedVersion;
                  releaseUrl = cachedUrl;
                }

                const comparison = compareVersions(currentVersion, latestVersion);
                if (comparison === 0) {
                    //writeLog("You are using the latest version.");
                } else if (comparison < 0) {
                    writeLog("A new version is available: " + latestVersion);

                    addNewVersionLink(releaseUrl,latestVersion);
                } else {
                    writeLog("You are using a newer version.");
                }

            } catch (error) {
                console.error('Error fetching the latest release:', error);
            }
        }
        function compareVersions(version1, version2) {

            const cleanVersion1 = version1.replace(/^v/, '');
            const cleanVersion2 = version2.replace(/^v/, '');


            const parts1 = cleanVersion1.split('.');
            const parts2 = cleanVersion2.split('.');


            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const part1 = parts1[i] || '0';
                const part2 = parts2[i] || '0';


                const comparison = part1.localeCompare(part2, undefined, { numeric: true });

                if (comparison !== 0) {
                    return comparison;
                }
            }
            return 0;
        }

        function localize(win) {
          //win.webContents.toggleDevTools();
          win.webContents.executeJavaScript(`get_all_ids();`);
          win.webContents.on('console-message', (event, level, message, line, sourceId) => {
            try {
              if (JSON.parse(message).action == 'return_localize_ids') {
                obj = JSON.parse(JSON.parse(message).localization_ids);
                obj.forEach( id => {
                  let setting_loc= i18n.__(id.replace('_id',''))
                  win.webContents.executeJavaScript(`localize("`+id+`","`+setting_loc+`");`);

                  // localization of allow_domain_id title
                  if (id == 'allow_domain_id') {
                    id = id.replace('_id','_title')
                    let setting_loc= i18n.__(id.replace('_id','_title'))
                    win.webContents.executeJavaScript(`localize("`+id+`","`+setting_loc+`");`);
                  }
                });
              }
            }
            catch (err) {
              //console.log(err);
              //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
            }
          });
        }

        // dirty function to apply unread badge to dock icon on Mac with 1s timeout
        function addBadgeMac () {
          //console.log(app.dock.getBadge());
          //setTimeout (function() {
            // force dockIcon!
            app.dock.setIcon(dockIcon);
            if (unread!=0) {
              app.dock.setBadge('');
              app.dock.setBadge(unread.toString());
            } else {
              app.dock.setBadge('');
            }
          //}, 1000);
        }

        async function setSettings(message,win) {
              try {
                if (JSON.parse(message).action == 'save_settings') {
                  obj = JSON.parse(JSON.parse(message).settings);
                  //let block_relaunch = false;
                  for (var key in obj){
                    // if saved_login is changed then call saveCredentials
                    /*if ((key == "saved_login") && (obj[key] != "")) {
                      let saved_password = await getCredentials(obj[key]);
                      if (!(saved_password)) {
                        writeLog("Call save credentials")
                        block_relaunch = true;
                        savePassword(obj[key],win);
                      }
                    } else {*/
                      store.set(key, obj[key]);
                    //}
                    
                  }
                  //if (!block_relaunch) {
                    //win.close();
                    restartApp();
                  //}
                }
              }
              catch (err) {
                //console.log(err);
                //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
              }

        }

        /*function switchSpinner(state) {

          if (state) {
            // prevent memory leaking
            if (win_loading) {
              win_loading.destroy();
            }
            win_loading = new BrowserWindow({
              //modal: !isMac,
              frame : false,
              movable: false,
              focusable: false,
              icon:icon,
              minWidth: 512, // temporary restrict min window width by 512px,
              title: app.getName() + " - " + store.get('server_url') + " - Загрузка...",
              resizable:false,
              parent: win,
              opacity: 0.6, // return in case of not using electron-acrylic-window
              //vibrancy: 'fullscreen-ui',    // on MacOS
              //backgroundMaterial: 'acrylic', // on Windows 11
              transparent: true, // on linux, also see css
              show: false
            })

            win_loading.loadFile('loading.html');

            // TODO change y position for linux
            //win_loading.setEnabled(false);
            //win_loading.setOpacity(0.8)
            //win.hide();
            //if (!store.get('start_hidden')) {
            if (isLinux) {
              if ((!initialized)) {
                // linux first run +29px fix (check non-KDE...)
                win_loading.setBounds({x: store.get('bounds').x, y: store.get('bounds').y, width: store.get('bounds').width, height:store.get('bounds').height + 29} );
              } else {
                win_loading.setBounds({x: store.get('bounds').x, y: store.get('bounds').y - 29, width: store.get('bounds').width, height:store.get('bounds').height + 29} );
              }
            } else {
              win_loading.setBounds(store.get('bounds'));
            }

            if (win.isVisible()) {
              if (isLinux) {
                win.setResizable(false)
              }
              win_loading.show();
            }
          } else {
            win_loading.hide();
            if (win.isVisible()) {
              win.setResizable(true)
              win.focus();
            }
          }
          // show devtools
          //win_loading.webContents.openDevTools()
        }*/

        async function saveCredentials(username, password) {
            try {
                await keytar.setPassword("NC_Talk_Electron", username, password);
                writeLog('✅ Creds are saved!');
            } catch (error) {
                writeLog('❌ Error during cred save: ', error);
            }
        }

        async function getCredentials(username) {
            try {
                const password = await keytar.getPassword("NC_Talk_Electron", username);
                if (password) {
                    //writeLog('✅ Password for '+username+' is found: '+password);
                    return password;
                } else {
                    writeLog('❌ No such saved user');
                    return null;
                }
            } catch (error) {
                writeLog('❌ Error fetching creds: ', error);
                return null;
            }
        }

        async function deleteCredentials(username) {
            try {
                await keytar.deletePassword("NC_Talk_Electron", username);
                writeLog('🗑️ Credentials are removed');
            } catch (error) {
                writeLog('❌ Error removing creds: ', error);
            }
        }


        async function restartApp(removed) {
          let options = [];

          // check if app is in autostart and run as linux systemd service
          if (process.argv.includes('--systemd')) {
            let executable = `"`+app.getPath('exe')+`"`;
            if (!removed) {
              writeLog('Application was run as service. Trying to restart systemd service...');
              exec(`systemctl --user restart `+appNameLC+`.service`);
              return;
            }
          }

          if (app.isPackaged && process.env.APPIMAGE) {
            options.args = process.argv;
            //options.args.unshift({ windowsHide: false });
            execFile(process.execPath, options.args);
            app.exit(0);
            return;
          }

          app.relaunch();
          app.exit(0);
        }

        function parseCookieString(rawCookie, baseUrl) {
          const [raw] = rawCookie.split(';');
          const [name, value] = raw.split('=');

          const url = new URL(baseUrl);
          const domain = url.hostname;
          const pathStart = rawCookie.includes('Path=') ?
            rawCookie.split('Path=')[1].split(',')[0].split(';')[0] :
            '/';

          return {
            url: baseUrl,
            name: name.trim(),
            value: value.trim(),
            domain,
            path: pathStart,
            secure: true,
            httpOnly: rawCookie.toLowerCase().includes('httponly'),
            expirationDate: null
          };
        }

        function openSettings() {
          if (!(settings_opened)) {
            let win_settings = new BrowserWindow({
              modal: !isMac,
              icon:icon,
              title:i18n.__('preferences'),
              width: 500,
              height: 400,
              resizable:false,
              parent: win
            })

            win_settings.loadFile('settings.html');
            win_settings.setMenu(null);

            // override fonts to Arial to fix any app startup errors
            win_settings.webContents.on('did-finish-load', () => {
              win_settings.webContents.insertCSS(`
                * {
                  font-family: 'Arial', sans-serif !important;
                }
              `);
            });

            // save app name title
            win_settings.on('page-title-updated', function(e) {
              e.preventDefault()
            });

            win_settings.once('ready-to-show', () => {
              if (isMac) {
                win.show();
                app.dock.show();
              }
              localize(win_settings);
              win_settings.show();
              settings_opened = true;
              getSettings(win_settings);
              win_settings.webContents.on('console-message', (event, level, message, line, sourceId) => {
                setSettings(message,win_settings);
              });
            });

            win_settings.on('closed', function(e) {
              settings_opened = false;
            });


            //win_settings.webContents.openDevTools()
          }
        }
        async function checkAuth(win,saved_password) {
          ses = win.webContents.session;

          try {
            const testResponse = await fetch(`${store.get('server_url')}/ocs/v1.php/cloud/user`, {
              headers: {
                'Authorization': `Bearer ${saved_password}`,
                'OCS-APIRequest': 'true'
              }
            });

            if (testResponse.status !== 200) {
              deleteCredentials(store.get('saved_login'))
              store.delete('saved_login');
              session.defaultSession.clearStorageData([], (data) => {});
              writeLog("Token is not found, invalid, expired or revoked")
              return false;
            } else {
              return ses;
            }
          } catch (error) {
            writeLog(error);
            return false;
          }
        }

        async function tryLogin(ses,win,saved_password) {
          let response = undefined
          try {
            response = await fetch(`${store.get('server_url')}/login`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${saved_password}`
              },
              redirect: 'manual'
            });
          }
          catch (err) {
            writeLog(err)
          }

          const cookiesHeader = response.headers.raw()['set-cookie'];

          if (cookiesHeader && cookiesHeader.length > 0) {
            for (const rawCookie of cookiesHeader) {
              const cookie = parseCookieString(rawCookie, store.get('server_url'));
              cookie.name = cookie.name.replace(/^__(Secure|Host)-/, '');
              try {
                await ses.cookies.set(cookie);
              }
              catch(err){
                writeLog(err)
                // try to fix http to https
                if (store.get('server_url').startsWith("http://")) {
                  writeLog('Found insecure http in saved server url. Fixing it and restart app.')
                  store.set('server_url',store.get('server_url').replace("http://", "https://"));
                  restartApp();
                }
              }
            }
          }

          win.loadURL(store.get('server_url'))
        }
        async function openClientAuth(win) {
          // force unread counter recalc
          win.webContents.executeJavaScript(`
            setTimeout(function() {
              // check localStorage to drop unread counter
              localStorage.clear();
              recalc_counters_summary ();
            }, 2000);
          `);

          // force logged out
          mainMenuTemplate[0].submenu[3].label = i18n.__('logged_out')
          mainMenuTemplate[0].submenu[3].enabled = false;
          MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
          Menu.setApplicationMenu(MainMenu);

          appIconMenuTemplate[7].label = i18n.__('logged_out')
          appIconMenuTemplate[7].enabled = false
          const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate)
          try {
            appIcon.setContextMenu(contextMenu)
          }
          catch(err) {
            //writeLog(err)
          }
          

          return new Promise((resolve) => {

            win.loadURL(`${store.get('server_url')}/index.php/login/flow`, {
              userAgent: `${os.hostname()} (NC Talk Electron v. ${app.getVersion()})`,
              extraHeaders: [
                'OCS-APIRequest: true',
                `Accept-Language: ${app.getPreferredSystemLanguages().join(',')}`,
              ].join('\n'),
            })

            /*win.webContents.on('did-start-loading', () => {
              win.setTitle(`${i18n.__('login_auth')} [Loading...]`)
              win.setProgressBar(2, { mode: 'indeterminate' })
            })

            win.webContents.on('did-stop-loading', () => {
              win.setTitle(i18n.__('login_auth'))
              win.setProgressBar(-1)
            })*/

            win.webContents.on('will-redirect', (event, url) => {
                if (url.startsWith('nc://')) {
                  // Stop redirect to nc:// app protocol
                  event.preventDefault()
                  try {
                    let credentials = parseLoginRedirectUrl(url)
                    resolve(credentials)
                    //writeLog(JSON.stringify(credentials))
                    store.set("saved_login",credentials.user)
                    saveCredentials(credentials.user,credentials.password)
                  } catch {
                    resolve(new Error('Unexpected server error'))
                  } finally {
                    // Anyway close the window
                    //tryLogin(ses,win)
                    //win.close()
                    //win.reload();
                    restartApp();
                  }
                }
              })
          })
        }


        function parseLoginRedirectUrl(url) {
          // nc://login/server:URL&user:USER&password:PASSWORD
          const re = /^nc:\/\/login\/server:(.*)&user:(.*)&password:(.*)$/
          const parsed = url.match(re)
          if (parsed.length < 4) {
            throw new Error('Error on parsing login redirect URL')
          }
          return {
            server: parsed[1],
            user: decodeURIComponent(parsed[2].replaceAll('+', ' ')),
            password: decodeURIComponent(parsed[3].replaceAll('+', ' ')),
          }
        }

        /*function showSources1() {
          desktopCapturer.getSources({ types:['window', 'screen'] }).then(async sources => {
            for (let source of sources) {
              writeLog("Id: " + source.id);
              writeLog("Name: " + source.name);
              writeLog("Thumbnail: " + source?.thumbnail
                  ?.resize({ height: 160 })
                  .toDataURL())
              //addSource(source);
            }
          });
        }*/

        function showSources(callback) {
          desktopCapturer.getSources({ types:['window', 'screen'] }).then(async sources => {

            let sourcesArray = sources.map(source => ({
              name: source.name,
              id: source.id,
              thumbnail: source?.thumbnail?.resize({ height: 160 }).toDataURL()
            }));

            //writeLog(JSON.stringify(sourcesArray));

            /*for (let [key, value] of Object.entries(Object.entries(sources))) {
              console.log(`${key} = ${value}`);
            }*/

            //writeLog(JSON.stringify(selectOptions));

            // custom media source picker

            let win_picker = new BrowserWindow({
                width: 600,
                minWidth: 300,
                height: 350,
                minHeight: 200,
                resizable:true,
                modal: !isMac,
                icon:icon,
                title:i18n.__('title5'),
                parent: win,
                webPreferences: {
                    //devTools: true,
                    //sandbox: false,
                    contextIsolation: true
                }
            });


            win_picker.loadFile('media_picker.html');
            win_picker.setMenu(null);

            // override fonts to Arial to fix any app startup errors
            win_picker.webContents.on('did-finish-load', () => {
              win_picker.webContents.insertCSS(`
                * {
                  font-family: 'Arial', sans-serif !important;
                }
              `);
            });

            // save app name title
            win_picker.on('page-title-updated', function(e) {
              e.preventDefault()
            });

            win_picker.on('close', function(e) {
              return callback(null);
            });

            win_picker.on('ready-to-show', () => {

              localize(win_picker);

              win_picker.setPosition(Math.floor(store.get('bounds').x + (store.get('bounds').width - win_picker.getBounds().width)/2),Math.floor(store.get('bounds').y + (store.get('bounds').height - win_picker.getBounds().height)/2));

              win_picker.show();

              win_picker.webContents.executeJavaScript(`showSources(`+JSON.stringify(sourcesArray)+`);`);

              win_picker.webContents.on('console-message', (event, level, message, line, sourceId) => {
                try {
                  if (JSON.parse(message).action === 'media_picked' ) {
                    callback({ video: sources.find(media => media.id === JSON.parse(message).media_id) })
                    win_picker.destroy();
                  }
                  if (JSON.parse(message).action === 'media_picker_quit' ) {
                    win_picker.close();
                  }
                }
                catch (err) {
                  //console.log(err)
                  //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
                  //app.exit(0);
                }
              });
            })

            //win_picker.webContents.openDevTools()

            // simple prompt media source picker
            /*prompt({
              title: i18n.__('title5'),
              label: i18n.__('message8'),
              useHtmlLabel: true,
              //value: server_url,
              type: 'select',
              buttonLabels: {
                ok: i18n.__('save_button'),
                cancel: i18n.__('cancel_button')
              },
              selectOptions: selectOptions,
              icon: icon,
              height : 200
            }, win)
            .then((select) => {
              if(select !== null) {
                //writeLog (JSON.stringify(sources.find(media => media.id === input)))
                callback({ video: sources.find(media => media.id === select) })
              } else {
                return callback(null);
              }
            })
            .catch((err) => {
              writeLog(err)
              dialog.showErrorBox(i18n.__('error'), i18n.__("more")+JSON.stringify(err));
            });*/
          })
        }


        function openPopup(url) {
          // check for cloud profile link
          let allow_navi = false;
          if (url.includes('/settings/user')) {
            title = i18n.__("user_settings") + " - " + store.get('server_url');
            allow_navi = true;
          } else if (url.includes('/u/'))  {
            allow_navi = true;
            title =  i18n.__("profile") + " - " + store.get('server_url')
          } else {
            title =  i18n.__("help") + " - " + store.get('server_url')
          }


          let win_popup = new BrowserWindow({
            modal: !isMac,
            icon:icon,
            title:title,
            parent: win
          })

          var theUrl = url;

          win_popup.loadURL(theUrl);
          win_popup.setMenu(null);

          // override fonts to Arial to fix any app startup errors
          win_popup.webContents.on('did-finish-load', () => {
            win_popup.webContents.insertCSS(`
              * {
                font-family: 'Arial', sans-serif !important;
              }
            `);
          });

          //block_gui_loading(false);

          // save app name title
          win_popup.on('page-title-updated', function(e) {
            e.preventDefault()
          });

          // add app styling override for cloud
          win_popup.on('ready-to-show', () => {
            win_popup.show();
            if (url.includes('/u/')) {
              win_popup.webContents.insertCSS('#app-content div.admin.access__section, #app-content div.shared.access__section, #app-content .social-button, #header, #app-content-vue div.profile__sidebar a.user-actions__primary {display:none!important;}');
              win_popup.webContents.insertCSS('.profile__header__container {justify-items:end}');
            } else {
              win_popup.webContents.insertCSS('#app-content div.admin.access__section, #app-content div.shared.access__section, #app-content .social-button, #header, div.profile__wrapper div.profile__sidebar div.user-actions,#app-content-vue a[href*="/settings/user"] {display:none!important;}');
            }
            win_popup.webContents.insertCSS('#content-vue { margin-top: 0px!important; height: 100% !important;}');
          })

          win_popup.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
          })


          // prevent navigation away from help pages
          win_popup.webContents.on('will-navigate', (event,redirectUrl) => {

            if (!(allow_navi)) {
              // check for nextcloud help urls
              if (!(redirectUrl.includes('docs.nextcloud.com')))  {
                event.preventDefault();
              }
            }
          });
          //win_popup.webContents.openDevTools()
        }
        // function to create badge img buffer 16x16
        async function createBadge (unread,purpose) {
          //unread = 13
          // commented for telegram style non-notificationable unread messages
          /*if (purpose == "tray") {
            var badge_color = "grey"
            var text_color = "wheat"
          }*/

          if ((purpose == "taskbar")||(purpose == "tray")) {
            if (isMac) {
              if (theme == 'dark') {
                var badge_color = "white"
                var text_color = "black"
              } else {
                var badge_color = "black"
                var text_color = "white"
              }
            } else {
              var badge_color = "red"
              var text_color = "white"
            }

            var font_size = "65"
          }

          if (unread >= 100) {
            unread = '∞'
            font_size = "90"
          }
            // colored text
            let font_family = !isLinux ? "system-ui, -apple-system, 'Segoe UI', Roboto, Oxygen-Sans, Cantarell, Ubuntu, 'Helvetica Neue', 'Noto Sans', 'Liberation Sans', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'" : "Noto Sans"
            var SVGtext = `<text style="fill: `+text_color+`; stroke: `+text_color+`; /*stroke-width:3*/" font-family="`+font_family+`" font-size="`+font_size+`" text-anchor="middle" x="40" y="65" >`+unread+`</text>`
            // transparent text
            //var SVGtext = `<mask id="clip"><rect width="100%" height="100%" fill="`+text_color+`"/><text font-size="`+font_size+`" font-weight="bold" text-anchor="middle" x="40" y="65">`+unread+`</text></mask>`


          // for colored text
          var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82"><circle cx="41" cy="41" r="40.5" fill="`+badge_color+`" />`+SVGtext+`</svg>`;

          // for transparent text
          //var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82"><circle  cx="41" cy="41" r="40.5" fill="`+text_color+`" /><circle mask="url(#clip)" stroke-width="2" style="stroke:`+badge_color+`;" cx="41" cy="41" r="40.5" fill="`+badge_color+`" />`+SVGtext+`</svg>`

          //var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82"><circle mask="url(#clip)" stroke-width="2" style="stroke:`+text_color+`;" cx="41" cy="41" r="40.5" fill="`+badge_color+`" />`+SVGtext+`</svg>`


          convertIcon(badge,unread,purpose)
        }

        // convert icon to B&W
        async function bw_icon_process(icon) {
          if (theme == 'dark') {
            var linear = 3 // for white color
          } else {
            var linear = 0 // for black color
          }
          var newImage = await sharp(icon.toPNG()).greyscale().linear(linear, 0).png({colors:2}).toBuffer();

          return nativeImage.createFromBuffer(newImage);
        }

        async function convertIcon (badge,unread,purpose) {
          if (purpose == "tray") {

            //let newImage = await sharp(Buffer.from(badge)).toBuffer();
            // process icon for macos to black and white colors
            if (isMac) {
              icon = await bw_icon_process(icon)
            } 
            
            // var newImage = await sharp(Buffer.from(badge)).toBuffer();


            var newImage = await sharp(icon.toPNG()).toBuffer();
            newImage = await sharp(newImage).resize(120, 120).toBuffer();
            newImage = await sharp(newImage).composite([{ input: Buffer.from(badge), top: 45, left: 45, blend: 'over'}]).toBuffer();


            trayIcon = nativeImage.createFromBuffer(newImage);

            // set linux taskbar image same as tray
            if (isLinux) {
              win.setIcon(trayIcon)
            }

            if (isMac) {
              trayIcon = trayIcon.resize({width:16});
            }

            appIcon.setImage(trayIcon);
            // apply theme to the tray icon - don't apply
            //trayIcon.setTemplateImage(true);
            // tray icon title
            appIcon.setToolTip(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + " - " + i18n.__("unread_messages") + ": " + unread);
            win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + " - " + i18n.__("unread_messages") + ": " + unread)
            return;
          }

          if (purpose == "taskbar") {
            //  windows the icon to display on the bottom right corner of the taskbar icon
            let newImage = await sharp(Buffer.from(badge)).toBuffer();
            win.setOverlayIcon(nativeImage.createFromBuffer(newImage), i18n.__('unread_messages') + ": " + unread);

            return;
          }
        }

        /*function addNotificationToTray () {
          console.log("Found unread notification!");
          let trayIcon = icon_notification.resize({width:16});
          // apply theme to the tray icon
          trayIcon.setTemplateImage(true);
          // set mac dock icon
          if (isMac) {
            //app.dock.setIcon(icon_notification);
            app.dock.setBadge(' ');
          }
          appIcon.setImage(trayIcon);
          is_notification = true;
          if (store.get('show_on_notify')) {
            win.show();
            if (isMac) app.dock.show();
          }
          win.flashFrame(true);
          win.setOverlayIcon(icon_notification, 'Есть непрочитанные уведомления');
          appIcon.setToolTip(app.getName()+" - Есть непрочитанные уведомления");

        }*/

        async function UnreadTray (unread,removed) {
          //console.log("Found " + unread +" messages!");
          // create icon with unread counter
          if (unread === 0) {
            // apply theme to the tray icon - don't apply
            //trayIcon.setTemplateImage(true);
            // set mac dock icon
            if (isMac) {
              //app.dock.setIcon(icon);
              addBadgeMac();
              icon_bw = await bw_icon_process(icon);
              trayIcon = icon_bw.resize({width:16});
            } else {
              trayIcon = icon/*.resize({width:16});*/

            }
            appIcon.setImage(trayIcon);
            //is_notification = false;
            win.flashFrame(false);
            win.setOverlayIcon(null, '');
            // tray icon badge
            appIcon.setToolTip(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url'));
          } else {
            createBadge(unread,"tray");
            //let trayIcon = icon_notification.resize({width:16});
            createBadge(unread,"taskbar");
            // set mac dock icon
            if (isMac) {
              //app.dock.setIcon(icon_notification);
              addBadgeMac();
            }
            //is_notification = true;
            if (store.get('show_on_new_message')) {
              if (unread_prev != unread) {
                // check if win is in not hidden of minimized
                if (!win.isVisible() || win.isMinimized() /*|| !win.isFocused()*/) {
                  win.show();
                  if (isMac) app.dock.show();
                }
              }
            }
            if ((!removed)&&(!win.isFocused())) {
              if (unread_prev != unread) {
                win.flashFrame(true);
              }
            }
          }
        }

        /*function removeNotificationFromTray () {
          console.log("Removed notification.");
          let trayIcon = icon.resize({width:16});
          // apply theme to the tray icon
          trayIcon.setTemplateImage(true);
          // set mac dock icon
          if (isMac) {
            //app.dock.setIcon(icon);
            app.dock.setBadge('');
          }
          appIcon.setImage(trayIcon);
          is_notification = false;
          win.flashFrame(false);
          win.setOverlayIcon(null, '');

          appIcon.setToolTip(app.getName()+" "+app.getVersion());

        }*/


        /*function checkWinWidth(win) {
          let  size = win.getSize();
          if ((size[0] < 512) && (store.get('bounds').width >= 512)) {
            console.log("Narrow window, reload page to prevent user input block!");
            return true;
          } else {
            return false;
          }
        }*/

        /*function block_gui_loading(state) {
          if (state) {
            gui_blocked = true
            //win.setProgressBar(2, { mode: 'indeterminate' })
            win.setEnabled(false);
            //win.setOpacity(0.8)
            win.setTitle(app.getName()  + " - " + store.get('server_url') + ' - Загрузка...');
            switchSpinner(true)
          } else {
            gui_blocked = false
            //win.setProgressBar(-1)
            win.setEnabled(true);
            //win.setOpacity(1);
            switchSpinner(false)
            //console.log(unread)
            if (unread != 0) {
              // set linux taskbar image same as tray
              if (isLinux) {
                win.setIcon(icon)
              }
              win.setTitle(app.getName() + " - " + store.get('server_url') + " - Непрочитанных сообщений: " + unread);
            } else {
              // set linux taskbar image same as tray
              if (isLinux) {
                win.setIcon(icon)
              }
              win.setTitle(app.getName() + " - " + store.get('server_url'));
            }
            //if(appIcon === null) {
            //  appIcon.setToolTip(app.getName() + " - " + store.get('server_url'));
            //}
          }
        }*/

        async function createWindow () {
          let blockAuthCall = false;

          // for SSO setting, allowed domains. set * as default to allow any
          if (!store.get('allow_domain')) {
            store.set('allow_domain','*')
          }
          session.defaultSession.allowNTLMCredentialsForDomains(store.get('allow_domain'));
          
          // try to unlock credentials or set not logged in file menu
          /*let auth_test = getCredentials('test');
          if (!auth_test){
            writeLog('Not unlocked wallet')
          }*/

          // Create the browser window.
          win = new BrowserWindow({
            title: app.getName() + " v."+app.getVersion() + " - " + store.get('server_url'),
            center: true,
            show: store.get('start_hidden') ? !JSON.parse(store.get('start_hidden')) : true,
            resizable: true,
            minimizable: (isMac) ? false : true,
            minWidth: 512, // temporary restrict min window width by 512px,
            // see issues https://github.com/nextcloud/spreed/issues/12236
            // https://github.com/nextcloud/spreed/issues/11454
            //icon:icon,
            useContentSize: true,
            webPreferences: {
              enableRemoteModule: true,
              backgroundThrottling: false,
              //preload: path.join(__dirname, 'preload.js'),
              contextIsolation: true,
              nodeIntegration: true,
            }
          });
        
          // async get saved password if any        
          /*if (store.get('saved_login')) {
            saved_password = await getCredentials(store.get('saved_login'));
          }*/

          // set always on top
          if (store.get('always_on_top') ) {
            win.setAlwaysOnTop(true, 'floating', 1);
          }

          win.setBounds(store.get('bounds'));

          // hanlde open external links in system browser
          win.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
          });

          //customize about
          app.setAboutPanelOptions({
            applicationName: app.getName(),
            applicationVersion: "v."+app.getVersion(),
            authors: ["drlight17"],
            version: app.getVersion(),
            copyright: "Lisense AGPLv3 ©2024",
            iconPath: iconPath,
            website: "https://github.com/drlight17/talk-electron"
          });

          // to set app.name instead of electron.app.Electron in Windows notifications
          if (!(isMac))
          {
              app.setAppUserModelId(app.name);
          }

          win.on("maximize", function () {
            checkMaximize();
          })

          win.on("unmaximize", function () {
            checkMaximize();
          })

          // as linux don't respect  win.setEnabled(false) for minimize operations
          /*win.on("minimize", function () {
            if ((isLinux) && (gui_blocked)) {
              win_loading.hide();
            }
          })

          win.on("restore", function () {
            if ((isLinux) && (gui_blocked)) {
              win_loading.show();
            }
          })*/

          //Do debounce with 500 ms
          let debounce;

          win.on("resize", function () {
            clearTimeout(debounce);
            debounce = setTimeout(function() {
              // force page refresh to prevent user input text block in narrow (< 512px) window - deprecated and commented.
              /*if (checkWinWidth(win)) {
                win.reload();
              }*/
              store.set('bounds', win.getBounds());
              // check 0.2.4-alpha BUG pinned/maximized window
              //win.focus();
            }, 200);
          })
          // for linux compatibility change "moved" to "move"
          win.on("move", function () {
            clearTimeout(debounce);
            debounce = setTimeout(function() {
              /*if (checkWinWidth(win)) {
                win.reload();
              }*/
              //console.log(win.getBounds().y)
              store.set('bounds', win.getBounds());
              // check 0.2.4-alpha BUG pinned/maximized window
              //win.focus();
            }, 200);
          })

          // Prevent window from closing and quitting app
          // Instead make close simply hide main window
          // Clicking on tray icon will bring back main window
          win.on('close', event => {
              event.preventDefault();
              store.set('bounds', win.getBounds());
              if (isMac) app.dock.hide();
              win.hide();
          })
          win.on('hide', event => {
            store.set('bounds', win.getBounds());
          })


          // save app name title
          win.on('page-title-updated', function(e) {
            e.preventDefault()
          });

          win.on('show', function () {
            win.setBounds(store.get('bounds'));

            //if (isMac) app.dock.setIcon(dockIcon);
            //if (is_notification) {
            if (unread != 0) {
              createBadge(unread,"taskbar");
              //win.setOverlayIcon(icon_notification, 'Есть непрочитанные уведомления');
              if (isMac) {
                addBadgeMac();
              }
            } else {
              win.setOverlayIcon(null, '');
              if (isMac) addBadgeMac();
            }
          })

          // some things when window is ready

          win.on('ready-to-show', () => {

            // load icon from server
            if (store.get('use_server_icon')) {
              //console.log("Let's get server icon")
              let icon_url = store.get('server_url')+"/apps/theming/image/logo";
              const fetchImage = async url => {
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                const nodebuffer = Buffer.from(buffer);
                icon = nativeImage.createFromBuffer(nodebuffer)
                dockIcon = icon


                // apply theme to the tray icon - don't apply
                //trayIcon.setTemplateImage(true);
                // set mac dock icon
                if (isMac) {
                  icon_bw = await bw_icon_process(icon);
                  trayIcon = icon_bw.resize({width:16});
                  //app.dock.setIcon(dockIcon);
                  addBadgeMac();
                } else {
                  trayIcon = icon/*.resize({width:16});*/
                }
                appIcon.setImage(trayIcon);

                win.setIcon(icon);
              }
              fetchImage(icon_url);
            }
            // hide dock if win is hidden
            if ((!win.isVisible()) && (isMac)) app.dock.hide();
            // add app styling override
            win.webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8'));

          })

          //block_gui_loading(true);
          // TODO: implement html screen source picker
          //showSources();
          //getDesktopSources();
          session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
            showSources(callback);
          })
          
          let authenticated = false;
          let saved_password = undefined;
          let ses = undefined;

          if (!store.get('auto_login')) {
            if (store.get('saved_login')) {
              saved_password = await getCredentials(store.get('saved_login'))
              authenticated = await checkAuth(win,saved_password);

              if (authenticated){
                writeLog("Token is valid. Logging in")
                tryLogin(authenticated,win,saved_password)
              } else {
                //writeLog("Not authenticated!");
                if (!blockAuthCall) {
                  blockAuthCall = true;
                  openClientAuth(win);
                }
                
              }
            } else {
              if (!blockAuthCall) {
                blockAuthCall = true;
                openClientAuth(win);
              }
            }
          } else {
            writeLog("Autologin is enabled. Loggin in using SSO.")
            win.loadURL(url)
          }

          

          let activity_check_interval = 5;

          setInterval(function () { checkInactivity(activity_check_interval) }, activity_check_interval*1000);

          preventUnsupportedBrowser(win);

          // apply context menus
          // BUG since 19.x Talk version double call ready-to-show
          applyContextMenu(win)

          // no need since we have nextcloud_check observer script below
          /*win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            win.close();
            appIcon.destroy();
            dialog.showErrorBox('Ошибка','Nextcloud или Talk необходимых версий не найдены!');
            setServerUrl (store.get('server_url')||url_example);
          })*/

          /*win.webContents.on('did-start-loading', () => {
            win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + " - " + i18n.__("loading"));
            appIcon.setToolTip(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + " - " + i18n.__("loading"));
            win.setProgressBar(2, { mode: 'indeterminate' })
          });

          win.webContents.on('did-stop-loading', () => {
            win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url'));
            appIcon.setToolTip(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url'));
             win.setProgressBar(-1)
          });*/



          // check cloud
          win.webContents.on('did-finish-load', function(e) {

            // override fonts to Arial to fix any app startup errors
            win.webContents.insertCSS(`
              * {
                font-family: 'Arial', sans-serif !important;
              }
            `);

            /*if (!store.get('start_hidden')) {
              win.show()
            }*/
            preventUnsupportedBrowser(win);
            // get notification dot status on webContents change
            //win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'notification_observer.js')), true)

            // get unread messages count
            win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'unread_observer.js')), true)

            // get user menu open observe
            win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'user_menu_observer.js')), true)

            // localize NC user_menu
            win.webContents.executeJavaScript(`var nc_link_loc = "`+i18n.__("nc_link")+`";`);
            win.webContents.executeJavaScript(`var user_settings_link_loc = "`+i18n.__("user_settings_link")+`";`);

            // check nc and talk status and version and run pinger
            win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'nextcloud_check.js')),true)


            // try autologin in case of SSO enabled
            if (!auto_login_error) {
              if (store.get('auto_login')) {
                win.webContents.executeJavaScript(`
                  checkURL(true);
                `);
              } else {
                // check auth
                if (!authenticated){
                  win.show();
                }
              }
            }

            //try autologin in case there is a saved credential
            // get saved credential if any
            /*if (store.get('saved_login')) {
              if (saved_password) {
                writeLog("Let's try to login with found "+store.get('saved_login')+" credentials");
                win.webContents.executeJavaScript(`
                  checkURL(false,'`+store.get('saved_login')+`','`+saved_password+`');
                `);
              }
            }*/


          });

          win.webContents.on('console-message', (event, level, message, line, sourceId) => {

            try {
              //console.log(JSON.parse(message))
              // get current nextcloud lang
              /*if (JSON.parse(message).cur_nc_lang !== undefined) {
                //console.log(JSON.parse(message).cur_nc_lang)
                let user_settings_link = i18n.__('user_settings_link',JSON.parse(message).cur_nc_lang)

                win.webContents.executeJavaScript(`localize("`+id+`","`+setting_loc+`");`);
              }*/

              if (JSON.parse(message).action.unread || (JSON.parse(message).action.unread === 0)) {
                //console.log(JSON.parse(message).action.unread)

                if (unread_prev == unread) {
                  unread = JSON.parse(message).action.unread
                } else {
                  if (unread!==false){
                    unread_prev = unread;
                  }
                  //unread = JSON.parse(message).action.unread
                }
                
                removed = JSON.parse(message).action.removed
                UnreadTray(unread,removed);
                unread_prev = unread
                // update title with unread on load
                if (unread != 0) {
                  // set linux taskbar image same as tray
                  if (isLinux) {
                    win.setIcon(trayIcon)
                  }
                  win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + " - " + i18n.__("unread_messages") + ": " + unread);
                } else {
                  // set linux taskbar image same as tray
                  if (isLinux) {
                    win.setIcon(trayIcon)
                  }
                  win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url'));
                }
                //block_gui_loading(false);
              }

              // incoming call process
              if (JSON.parse(message).action.call) {
                
                call = JSON.parse(message).action.call
                //writeLog(call.lastMessage.systemMessage)
                
                //let controller = new AbortController();

                // check call status
                if (call.lastMessage.systemMessage == 'call_started') {
                //if (call.hasCall) {
                  if (call_prev.token == call.token) {
                    return;
                  } else {
                    if (call!==false){
                      call_prev = call;
                    }
                  }
                } else {
                  //writeLog('Missed call')
                  call_prev = false;
                  //controller.abort();
                }

                dialog.showMessageBox(win, {
                    //'type': 'warning',
                    'title': i18n.__('call_title'),
                    'message': i18n.__("call_message")+call.displayName,
                    'defaultId':1,
                    'buttons': [
                        i18n.__('cancel_button'),
                        i18n.__('answer_button')
                    ]/*,
                    'icon': icon,*/
                    //'signal': controller.signal
                })
                .then((result) => {
                  // if no
                  /*if (result.response !== 0) {
                    call_prev = false;
                  }*/
                  // if no
                  /*if (result.response === 0) {
                    return;
                  }*/
                  // if yes
                  if (result.response === 1) win.loadURL(store.get('server_url')+'/call/'+call.token+'#direct-call')
                });
                win.show();
              }

              if (JSON.parse(message).action == 'not_alive') {
                /*if (!gui_blocked) {
                  block_gui_loading(true);*/
                  win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + i18n.__('server_no_response'));
                //}
              }
              if (JSON.parse(message).action == 'alive') {
                /*if (gui_blocked) {
                  block_gui_loading(false);
                  //win.reload();
                }*/
                if (unread != 0) {
                  // set linux taskbar image same as tray
                  if (isLinux) {
                    win.setIcon(trayIcon)
                  }
                  win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + " - " + i18n.__("unread_messages") + ": " + unread);
                } else {
                  // set linux taskbar image same as tray
                  if (isLinux) {
                    win.setIcon(trayIcon)
                  }
                  win.setTitle(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url'));
                }
              }

              if (JSON.parse(message).action == 'redirect_to_spreed') {
                // dirty but it works
                win.webContents.executeJavaScript('window.location.replace("/apps/spreed")')
              }
              // to force show app window if not logged in
              if (JSON.parse(message).action == 'force_show_app_win') {


                // dirty but it works
                if (!win.isVisible()) { 
                  win.show();
                  if (isMac) app.dock.show();

                }
                // if app is not logged in fallback to login in
                //win.webContents.executeJavaScript('window.location.replace("/apps/spreed")')
                if (!blockAuthCall) {
                  blockAuthCall = true;
                  checkAuth(win,saved_password);
                  openClientAuth(win);
                }
                

                //win.webContents.executeJavaScript('window.location.replace("/apps/spreed")')
              }
              /*if (JSON.parse(message).action == 'added') {
                addNotificationToTray();
              }
              if (JSON.parse(message).action == 'removed') {
                removeNotificationFromTray();
              }*/
              if (JSON.parse(message).action == 'not_found') {
                if (store.get('auto_login')) {
                  if (!auto_login_error) {
                    dialog.showErrorBox(i18n.__('error'),i18n.__('message6'));
                    win.webContents.executeJavaScript('window.location.replace("'+store.get('server_url')+'")')
                    auto_login_error = true;
                  } else {

                  }
                } else {
                  win.close();
                  appIcon.destroy();
                  if (!prompted) {
                    dialog.showErrorBox(i18n.__('error'),i18n.__('message1'));
                    //app.exit(0);
                    setServerUrl (store.get('server_url')||url_example);
                  }
                }

              }
            }
            catch (err) {
              //console.log(err)
              //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
              //app.exit(0);
            }
          })


          // prevent navigation to cloud root after logout and following login
          details = win.webContents.on('will-navigate', (event,redirectUrl) => {
            url = this.details.getURL();
            //console.log("\nCurrent URL: " + url)
            //console.log("Redirect URL: " + redirectUrl + "\n")
            /*if (!gui_blocked) {
              block_gui_loading(true);
            }*/

            //event.preventDefault();

            // open profile process
            if (redirectUrl.includes('/u/')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win.webContents.insertCSS('#profile span.loading-icon { display:none;}');
              win.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              openPopup(redirectUrl);
              return { action: 'deny' };
            }
            // open settings process
            if (redirectUrl.includes('/settings/user')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              openPopup(redirectUrl);
              return { action: 'deny' };
            }

            // open files, contacts and others process
            if (redirectUrl.includes('/f/')||redirectUrl.includes('calendar')||redirectUrl.includes('contacts')) {
            // open files process
            //if (redirectUrl.includes('/f/')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              shell.openExternal(redirectUrl);
              return { action: 'deny' };
            }
            // open others process
            /* if (!redirectUrl.includes('/spreed/')&&!redirectUrl.includes('/call/')&&!redirectUrl.includes('/login')&&!redirectUrl.includes('logout')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              shell.openExternal(redirectUrl);
              return { action: 'deny' };
            }*/
          });


          win.webContents.on('devtools-closed', () => {
            mainMenuTemplate[2].submenu[1].label = i18n.__("open_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
            checkNewVersion(app.getVersion());
          })

          win.webContents.on('devtools-opened', () => {
            checkNewVersion(app.getVersion());
            mainMenuTemplate[2].submenu[1].label = i18n.__("close_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
            checkNewVersion(app.getVersion());
          })

          // Open the DevTools.
          //win.webContents.openDevTools()
        }

        function preventUnsupportedBrowser(win) {
          win.webContents
            .executeJavaScript('localStorage.setItem("nextcloud_vol_Y29yZQ==_unsupported-browser-ignore",true);', true)
            .then(localStorage => {
              //console.log(localStorage);
            });
        }

        function guiInit() {

          /*var locale = 'en';
          if ((store.get('locale') == undefined) || (store.get('locale') == "")) {
              locale = navigator.language.slice(0,2).toLowerCase() || navigator.userLanguage.slice(0,2).toLowerCase();
              store.set('locale',locale)
              //localStorage.setItem('locale',this.settings.locale);
          } else {
              locale = store.get('locale');
          }*/

          // localize gui
          //loadLocaleMessages(locale);

          // process logo icon for Mac
          trayIcon = icon/*.resize({width:16});*/
          // apply theme to the tray icon - don't apply
          //trayIcon.setTemplateImage(true);
          // set mac dock icon
          if (isMac) {
            app.dock.setIcon(dockIcon);
            appIcon = new Tray(icon_bw)
          } else {
            appIcon = new Tray(trayIcon)
          }

          checkMaximize();

          const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate)
          appIcon.setToolTip(app.getName() + " v."+app.getVersion() + " - " + store.get('server_url') + " - " + i18n.__("loading"));
          appIcon.setContextMenu(contextMenu)


          appIcon.on('click', (event) => {
            if (!isMac) {
              //if (win.isVisible() && !win.isMinimized()) {
              if (win.isVisible() && win.isFocused()) {
                win.hide()
              } else {
                win.show()
              }
            } else {
              appIcon.popUpContextMenu();
            }
          })
          appIcon.on('context', (event) => {
            appIcon.popUpContextMenu(); // TODO KDE linux doesnt support this =((
          })


          app.on('activate', function () {
            if (isMac) {
              //app.dock.setIcon(dockIcon);
              addBadgeMac();
            }
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            //if (win.getAllWindows().length === 0) createWindow()

          })
        }



        // set allow domain prompt
        function setAllowDomains () {
          prompted = true;
          // ask for SSO
          dialog.showMessageBox(win, {
              'type': 'question',
              'title': i18n.__('title1'),
              'message': i18n.__("message2"),
              'buttons': [
                  i18n.__('save_button'),
                  i18n.__('cancel_button')
              ]
          })
          .then((result) => {
              // if no
              if (result.response !== 0) {
                store.set('auto_login',false)
                createWindow();
                guiInit();
                prompted = false;
              }

              // if yes
              if (result.response === 0) {
                //console.log('The "Yes" button was pressed (main process)');
                // show input box for allow domains
                store.set('auto_login',true)
                prompt({
                  title: i18n.__('title2'),
                  label: i18n.__('message3'),
                  useHtmlLabel: true,
                  buttonLabels: {
                    ok: i18n.__('yes_button'),
                    cancel: i18n.__('no_button')
                  },
                  value: store.get('allow_domain')||'*, *.domain.com, domain.com',
                  type: 'input',
                  inputAttrs: {
                    type: 'text'
                  },
                  icon: icon,
                  height : 200,
                  minWidth: 400,
                  resizable: true
                }, win)
                .then((input) => {
                  if(input === null) {
                    //app.exit(0);
                    // try without allowed_domains
                    createWindow();
                    guiInit();
                    prompted = false;

                  } else {
                    //let address = input[0]
                    store.set('allow_domain',input)
                    createWindow();
                    guiInit();
                    prompted = false;
                    //}
                  }
                })
                .catch((err) => {
                  writeLog(err)
                  dialog.showErrorBox(i18n.__('error'), i18n.__("more")+JSON.stringify(err));
                  store.delete('latestVersion');
                  store.delete('releaseUrl');
                  app.exit(0);
                });
              }
          })
        }


        function openNotificationsSettings() {
            exec('open x-apple.systempreferences:com.apple.preference.notifications', (error) => {
                if (error) {
                    console.error('Error while opeing notification settings:', error);
                } else {
                    console.log('Notification settings are opened for macOS.');
                }
            });
        }

        // set server_url prompt
        function setServerUrl (server_url) {
          prompted = true;
          // show input box for server address
          prompt({
            title: i18n.__('title3'),
            label: i18n.__('message4'),
            value: server_url,
            type: 'input',
            buttonLabels: {
              ok: i18n.__('save_button'),
              cancel: i18n.__('cancel_button')
            },
            inputAttrs: {
              type: 'url',
              required: true
            },
            icon: icon,
            height : 200
          }, win)
          .then((input) => {
            if(input === null) {
              store.delete('latestVersion');
              store.delete('releaseUrl');
              app.exit(0);
            } else {
              let address = input
              if (address.startsWith("http://")) {
                  address = address.replace("http://", "https://");
              }
              store.set('server_url',address)
              url = address+"/apps/spreed"
              setAllowDomains();
              /*createWindow();
              guiInit();
              prompted = false;*/

            }
          })
          .catch((err) => {
            writeLog(err)
            dialog.showErrorBox(i18n.__('error'), i18n.__("more")+JSON.stringify(err));
            store.delete('latestVersion');
            store.delete('releaseUrl');
            app.exit(0);
          });
        }

        // save password prompt
        /*async function savePassword (login,win) {
          //prompted = true;
          // show input box for server address
          prompt({
            title: i18n.__('title4'),
            label: i18n.__('message7')+'<br><strong>'+login+':</strong>',
            useHtmlLabel: true,
            buttonLabels: {
              ok: i18n.__('save_button'),
              cancel: i18n.__('cancel_button')
            },
            type: 'input',
            inputAttrs: {
              type: 'password',
              required: true
            },
            height : 200
          }, win)
          .then((input) => {
            if(input === null) {
            } else {
              //saveCredentials(login,input);
              //store.set("saved_login", login);
            }
          })
          .catch((err) => {
            writeLog(err)
            dialog.showErrorBox(i18n.__('error'), i18n.__("more")+JSON.stringify(err));
          });
        }*/

        /******************** startup app block *********************/

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.

        // TODO To enable transparency on Linux (in KDE dont work?)
        if (isLinux) {
          app.commandLine.appendSwitch('enable-transparent-visuals');
          app.commandLine.appendSwitch('disable-gpu');
          app.disableHardwareAcceleration();
        }

        app.whenReady().then((event) => {
        //app.on('ready', async () => {
          writeLog('PID = '+process.pid);

          /*process.on('SIGTERM', () => {
            app.exit(0);
          })
          process.on('SIGINT', () => {
            app.exit(0);
          })*/

          if (url == "") {
            setServerUrl(url_example);
          } else {
            url += "/apps/spreed";
            createWindow();

            // handle Windows shutdown/logout to prevent crush
            if (isWindows) {
              app.on('before-quit', e => {
                  e.preventDefault();
              })
              ShutdownHandler.setWindowHandle(win.getNativeWindowHandle());
              ShutdownHandler.blockShutdown('');
              ShutdownHandler.on('shutdown', () => {
                writeLog('Shutdown/logout is detected! Exiting app!');
                ShutdownHandler.releaseShutdown();
                store.delete('latestVersion');
                store.delete('releaseUrl');
                app.exit(0);
              })
            }
            guiInit();

          }
        })

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        app.on('window-all-closed', function () {

          // 08.06.2024 due to bug in case of new config recreation
          //if (!isMac) app.quit()
        })

        /******************** startup app block *********************/


      }
      catch (err) {
        writeLog(err)
        dialog.showErrorBox(i18n.__('error'), i18n.__('message5'));
        fs.unlinkSync(app.getPath('userData')+"/config.json")
        restartApp();
      }
    }
  }
}
catch (err) {
  writeLog(err);
  store.delete('latestVersion');
  store.delete('releaseUrl');
  app.exit(0);
}


