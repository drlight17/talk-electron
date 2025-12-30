 // Modules to control application life and create native browser window

 const prompt = require('custom-electron-prompt');

 const sharp = require('sharp');
 const puppeteer = require('puppeteer');

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
 const {
  app,
  net,
  clipboard,
  screen,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  ipcMain,
  Notification,
  dialog,
  session,
  shell,
  powerMonitor,
  nativeTheme,
  desktopCapturer
 } = require('electron')
 //const WebSocket = require('ws');
 const {
  HttpsProxyAgent
 } = require('https-proxy-agent');
 //const { SocksProxyAgent } = require('socks-proxy-agent');
 const os = require('os');
 const {
  exec
 } = require('child_process');
 const {
  execFile
 } = require('child_process');

 //const SystemIdleTime = require('@paulcbetts/system-idle-time');
 //const SystemIdleTime = require('desktop-idle');


 const fs = require("fs");
 const {
  join
 } = require('path');
 const path = require('node:path');

let Store = undefined;

if (process.versions.electron != "22.3.27") {
  Store = require('electron-store').default;
} else {
  Store = require('electron-store');
}

 const system_theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

 let theme = system_theme;
 let ton_wallet = 'UQBz_YJrj5-PCpYIqr7wsdspdSgrzETS02N2t0KSo1njX0FJ';

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

    function writeLog(message, obj) {

      const logFilePath = path.join(app.getPath('userData'), 'app.log');
      const timestamp = new Date().toLocaleString();
      const logMessage = `[${timestamp}] ${message}\n`;
      if (obj) {
        console.log(`[${timestamp}]`);
        console.dir(message, {
          depth: null,
          colors: true
        });
      } else {
        console.log(`[${timestamp}] ${message}`);
      }
      try {
        if (store.get('logging')) {
          fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
              console.error(`[${timestamp}] 'Error when tring to write log:'`, err);
            }
          });
        }
      } catch (err) {
        //console.log( `[${timestamp}] `+err);
      }
    }

    function validateAndFixProtocol(url) {
      try {
        if (/^https?:\/\//i.test(url)) {
          if (/^https:\/\//i.test(url)) {
            return url;
          }
          writeLog(`Found insecure protocol 'http://' in URL. Fixing it to 'https://'.`);
          return url.replace(/^http:\/\//i, "https://");
        }

        if (/^[a-zA-Z0-9]+:\/\//i.test(url)) {
          writeLog(`Found invalid protocol in URL. Replacing with 'https://'.`);
          return url.replace(/^[a-zA-Z0-9]+:\/\//i, "https://");
        }

        writeLog(`No protocol found in URL. Adding 'https://'.`);
        return "https://" + url;
      } catch (error) {
        writeLog(`Error validating and fixing protocol for URL: ${url}. Error: ${error.message}`);
        return null;
      }
    }

    async function openFile(filePath) {

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

    function getResourceDirectory() {
      //return process.env.NODE_ENV === "development"
      if (!app.isPackaged) {

        let current_app_dir = app.getPath('userData')
        // don't delete if already not empty userData folder from prod app
        if (fs.readdirSync(current_app_dir).length === 0) {
          fs.rmSync(current_app_dir, {
            recursive: true,
            force: true
          });
        }
        app.setPath('userData', current_app_dir + "-dev");

        return path.join(process.cwd())
      } else {
        return path.join(process.resourcesPath, "app.asar.unpacked");
      }
      ƒƒ
    };

    async function restartApp(removed) {
      let options = [];

      // check if app is in autostart and run as linux systemd service
      if (process.argv.includes('--systemd')) {
        let executable = `"` + app.getPath('exe') + `"`;
        if (!removed) {
          writeLog('Application was run as service. Trying to restart systemd service...');
          exec(`systemctl --user restart ` + appNameLC + `.service`);
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

    //check if config is not empty
    try {
      if (!isMac) {
        var iconPath = path.resolve(getResourceDirectory(), "icon.png");
        store = new Store();
      } else {
        getResourceDirectory();
        store = new Store();
        var iconPath = path.join(__dirname, store.get('app_icon_name') || 'iconTemplate.png');
      }
    } catch (err) {
      writeLog("Empty config.json file. Recreating user app home folder.")
      //dialog.showErrorBox(i18n.__('error'), i18n.__('message5'));
      //fs.unlinkSync(app.getPath('userData')+"/config.json")
      fs.rmSync(app.getPath('userData'), {
        recursive: true,
        force: true
      });
      restartApp();
    }

    var i18n = new(require('./translations/i18n'));

    const gotTheLock = app.requestSingleInstanceLock();

    if (!app.isPackaged) {
      writeLog(app.getName() + " v." + app.getVersion() + ' is started in dev mode');
    } else {
      writeLog(app.getName() + " v." + app.getVersion() + ' is started in production mode');
    }

    // check allow_multiple in newer version
    let allow_multiple = false /*store.get('allow_multiple') ? JSON.parse(store.get('allow_multiple')) : false;*/
    // prevent multiple instances, focus on the existed app instead
    if (!gotTheLock) {
      if (!allow_multiple) {
        app.exit(0);
      }
    } else {
      if (!allow_multiple) {
        app.on('second-instance', (event) => {
          if (win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window) {
            //if (win_main.isMinimized()) win_main.restore();
            win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.show();
            win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.focus();
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
        let prompted = false;
        let controller = {};
        let auto_login_error = false
        let idleTime_non_active = 0;
        let delayedIdleTime = {};
        // to check gui_blocked status
        //let gui_blocked = false
        //let is_notification = false;
        // for storing unread counter
        let unread = [];
        let unread_prev = [];
        // for storing unread summary counter
        let unread_sum = 0;
        //Do debounce with 500 ms
        let debounce;
        let loginData = {};
        let win_main_index = 0;
        let message_link = [];
        let notification_message_link = [];
        let notification_message_icon = [];
        let notification_type = [];
        let notificationWindowsIds = [];
        let notificationWindows = [];
        let checkInactivityInterval = {};
        let delayedIdleTimeInterval = {};
        let src_title = [];
        let dismissed = {};
        let call = {};
        let avatar = {};
        let call_prev = {};
        // to store settings menu opened status
        let settings_opened = false;
        let isLocked_suspend = false;
        let isLoading = false;
        let isForegroundLoading = false;
        let proxyUrl = false;
        let proxyAgent = false;
        let proxyWsAgent = false;
        let saved_proxy_login = false;
        let saved_proxy_password = false;
        let proxies = undefined;
        let isDialogOpen = false;

        // check version in every hour with 3 sec delay for the first time
        setTimeout(() => {
          checkNewVersion(app.getVersion());
          setInterval(() => {
            checkNewVersion(app.getVersion());
          }, 60 * 60 * 1000);
          //}, 10* 1000);
        }, 3000);


        // check if license_key is configured and set default null if not
        if (!store.get('license_key')) {
          store.set('license_key', null);
        }

        // check old config before 1.0.0-RC1 - cleanup userdata and restart app to prevent issues
        if (store.get('saved_login')) {
          dialog.showErrorBox(i18n.__('error'), i18n.__('message21'));
          //fs.unlinkSync(app.getPath('userData')+"/config.json")
          /*fs.rmSync(app.getPath('userData'), {
            recursive: true,
            force: true
          });*/
          store.delete('saved_login');
          store.delete('server_url');
          store.delete('auto_login');

          restartApp();
        }

        let url = "";
        const url_example = 'https://cloud.example.com';

        if (!((app.commandLine.getSwitchValue("server_url") == undefined) || (app.commandLine.getSwitchValue("server_url") == ""))) {
          // validate server_url
          url = validateAndFixProtocol(app.commandLine.getSwitchValue("server_url"))
          store.set('server_url', url)
          //url = app.commandLine.getSwitchValue("server_url");
        } else if (!((store.get('server_url') == undefined) || (store.get('server_url') == ""))) {
          url = validateAndFixProtocol(store.get('server_url'));
          store.set('server_url', url)
        }

        // save current app exec path in config file
        if (!store.get('exec_path')) {
          store.set('exec_path', app.getPath('exe'));
        }
        // for SSO setting, allowed domains. set * as default to allow any
        if (!store.get('allow_domain')) {
          store.set('allow_domain', '*')
        }
        // check if logging is configured and set default false if not
        if (store.get('logging') === undefined) {
          store.set('logging', false);
        }
        if (store.get('logging')) {
          writeLog("Writing app log to file " + path.join(app.getPath('userData'), 'app.log'))
        }

        // check if notification_timeout_checkbox is configured and set default true if not
        if (store.get('notification_timeout_checkbox') == undefined) {
          store.set('notification_timeout_checkbox', true);
        }

        // check if notification_muted is configured and set default false if not
        if (!store.get('notification_muted')) {
          store.set('notification_muted', false);
        }

        // check if notification_sys_checkbox is configured and set default false if not
        if (!store.get('notification_sys_checkbox')) {
          store.set('notification_sys_checkbox', false);
        }

        // check if notification_position is configured and set default bottom-right if not
        if (!store.get('notification_position')) {
          if (isMac) {
            store.set('notification_position', 'top-right');
          } else {
            store.set('notification_position', 'bottom-right');
          }
        }

        // check if use of server theme color is configured and set default true if not
        if (store.get('use_server_theme') === undefined) {
          store.set('use_server_theme', true);
        }

        // check if sum_unread is configured and set default true if not
        if (store.get('sum_unread') === undefined) {
          store.set('sum_unread', true);
        }

        // check if saved_proxy_login is configured and set default false if not
        if (!store.get('saved_proxy_login')) {
          store.set('saved_proxy_login', false);
        }

        const original_icon = nativeImage.createFromPath(iconPath); // template with center transparency
        let trayIcon = [];
        trayIcon['original_icon'] = original_icon
        let dockIcon = [];
        dockIcon['original_icon'] = original_icon
        let original_server_icon = [];
        //let original_icon = icon
        let icon_bw = [];

        if (isMac) {
          icon_bw['original_icon'] = await bw_icon_process(original_icon);
          // as this icon is for macos tray only resize it here
          icon_bw['original_icon'] = icon_bw['original_icon'].resize({
            width: 16
          });
        }

        // check if theme is configured and set default auto value if not
        if (!store.get('theme')) {
          store.set('theme', 'auto');
        }

        if (store.get('theme') != 'auto') {
          theme = store.get('theme')
        }

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
              executable = `"` + process.env.APPIMAGE + `"`;
            } else {
              Path = app.getPath('exe').replace(/\/[^\/]*$/, '/');
              executable = `"` + app.getPath('exe') + `"`;
            }
            /*const isKDE = process.env.KDE_SESSION_VERSION !== undefined;
            if (isKDE) {
              executable = `sleep 15 && ` + executable;
            }*/
            let shortcut_contents = `[Desktop Entry]
Categories=Network;
Comment=Talk web embedded app
Exec=bash -c 'systemctl --user start ` + appNameLC + `.service'
Name=NC Talk Electron
StartupWMClass=NC Talk Electron
Terminal=false
Type=Application
Icon=` + appNameLC + `
X-GNOME-Autostart-Delay=15`;
            let systemd_contents = `[Unit]
Description=Talk web embedded app
After=graphical-session.target
Requires=graphical-session.target

[Service]
Type=simple
Restart=on-failure
RestartSec=5s
WorkingDirectory=` + Path + `
ExecStart=bash -c '` + executable + ` --systemd'
Environment="NODE_ENV=production"

[Install]
WantedBy=graphical-session.target`;

            if (!fs.existsSync(app.getPath('home') + "/.config/autostart/" + appNameLC + ".desktop")) {
              //fs.unlinkSync(app.getPath('home')+"/.config/autostart/"+appNameLC+".desktop")
              fs.writeFileSync(app.getPath('home') + "/.config/autostart/" + appNameLC + ".desktop", shortcut_contents, 'utf-8');
            }
            if ((!fs.existsSync(app.getPath('home') + "/.config/systemd/user/" + appNameLC + ".service")) || exec_changed) {
              fs.writeFileSync(app.getPath('home') + "/.config/systemd/user/" + appNameLC + ".service", systemd_contents, 'utf-8');
              exec(`systemctl --user daemon-reload`);
              exec(`systemctl --user enable ` + appNameLC + `.service`);
              writeLog("Application was set to autostart as user systemd service")
            }
          }
          if (isMac) {
            let plist_contents = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.electron.` + appNameLC + `</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/NC Talk Electron.app/Contents/MacOS/NC Talk Electron</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
`;
            if (!fs.existsSync(app.getPath('home') + "/Library/LaunchAgents/com.electron." + appNameLC + ".plist")) {
              fs.writeFileSync(app.getPath('home') + "/Library/LaunchAgents/com.electron." + appNameLC + ".plist", plist_contents, 'utf-8');
              exec('launchctl bootstrap enable ' + app.getPath('home') + '/Library/LaunchAgents/com.electron.' + appNameLC + '.plist');
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
            if (fs.existsSync(app.getPath('home') + "/.config/autostart/" + appNameLC + ".desktop")) {
              fs.unlinkSync(app.getPath('home') + "/.config/autostart/" + appNameLC + ".desktop")
            }
            if (fs.existsSync(app.getPath('home') + "/.config/systemd/user/" + appNameLC + ".service")) {
              exec(`systemctl --user disable ` + appNameLC + `.service`);
              fs.unlinkSync(app.getPath('home') + "/.config/systemd/user/" + appNameLC + ".service")
              exec(`systemctl --user daemon-reload`);
              writeLog("Application was removed from autostart")
            }
          }
          if (isMac) {
            if (fs.existsSync(app.getPath('home') + "/Library/LaunchAgents/com.electron." + appNameLC + ".plist")) {
              fs.unlinkSync(app.getPath('home') + "/Library/LaunchAgents/com.electron." + appNameLC + ".plist");
              exec('launchctl bootstrap disable com.electron.' + appNameLC);
              writeLog("Application was removed from autostart")
            }
          }
        }

        var win_main = {id:{}};
        var win_popup = null;
        let saved_password = undefined;
        //var win_noti = null;
        //var win_loading = null;
        var appIcon = null;
        var MainMenu = null;

        let donate_menu_element = {
          id: 'donate_menu_element',
          label: '💰',
          submenu: [{
              label: '💰  ' + i18n.__('donate_title'),
              click: () => {
                if (!store.get('license_key')) {
                  donateClick();
                } else {
                  dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                      type: 'info',
                      message: i18n.__('donate_already_requested', {
                        license_key: store.get('license_key')
                      }),
                      detail: i18n.__('donate_already_requested_detail'),
                      buttons: [i18n.__('save_button'), i18n.__('donate_cancel_request')],
                      defaultId: 0,
                      cancelId: 0
                    })
                    .then((result) => {
                      // if cancel license request
                      if (result.response != 0) {
                        dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                            type: 'question',
                            detail: i18n.__('donate_cancel_request_sure'),
                            buttons: [i18n.__('no_button'), i18n.__('yes_button')],
                            defaultId: 0,
                          })
                          .then((result) => {
                            if (result.response == 1) {
                              dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                                type: 'info',
                                detail: i18n.__('donate_cancel_request_canceled', {
                                  license_key: store.get('license_key')
                                })

                              })
                              store.set('license_key', null)
                              store.set('license_key_activated', false)
                            }
                          })
                      }
                    });
                }
              }
            },
            {
              label: '📨  ' + i18n.__('donate_send_confirmation'),
              click: () => {
                if (store.get('license_key')) {
                  shell.openExternal('mailto:root@drlight.fun?body=' + i18n.__('donate_send_confirmation_body', {
                    license_key: store.get('license_key')
                  }) + '&subject=' + i18n.__('donate_send_confirmation_subject', {
                    license_key: store.get('license_key')
                  }));
                } else {
                  dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                    type: 'error',
                    //message: i18n.__('donate_send_confirmation_error'),
                    detail: i18n.__('donate_send_confirmation_error')
                  });
                }
              }
            }
          ]
        };
        let mainMenuTemplate = [{
            label: '⋮ ' + i18n.__('file'),
            submenu: [
              {
                label: '👥  ' + i18n.__('current_account'),
                submenu: []
              },
              {
                label: '⚙️  ' + i18n.__('preferences'),
                click: () => {
                  if (!isLoading) {
                    openSettings();
                  } else {
                    dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                  }
                },
              },
              // set logging to file
              {
                label: '📄  ' + i18n.__('logging_open'),
                //type: 'checkbox',
                enabled: store.get('logging'),
                click: () => {
                  writeLog(`Opening app.log file in ${app.getPath('userData')}`);
                  openFile(path.join(app.getPath('userData'), 'app.log'));
                }
              },
              {
                type: 'separator'
              },
              {
                label: '🌐  ' + i18n.__('nc_link'),
                click: () => {
                  shell.openExternal(store.get('server_url'));
                },
              },
              {
                label: '🚪  ' + i18n.__('exit'),
                accelerator: isMac ? 'Cmd+Q' : 'Alt+X',
                click: () => {
                  //store.set('bounds', win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.getBounds());
                  syncBounds()
                  store.delete('latestVersion');
                  store.delete('releaseUrl');
                  if (isMac) {
                    exec('launchctl bootout gui/"$(id -u)"/com.electron.' + appNameLC);
                  }
                  app.exit(0);
                },
              }
            ]
          },
          {
            label: '👁 ' + i18n.__('view'),
            submenu: [
              //{ label : "Обновить", role : "reload" },
              {
                label: '↻  ' + i18n.__('refresh'),
                click: () => {
                  /*if (!gui_blocked) {
                    block_gui_loading(true);*/
                  win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.webContents.executeJavaScript(`loading('refresh');`);
                  win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.reload()
                  //}
                },
                accelerator: isMac ? 'Cmd+R' : 'Ctrl+R'
              },
              {
                type: 'separator'
              },
              {
                label: '⚊  ' + i18n.__('hide'),
                click: () => {
                  if (isMac) app.dock.hide();
                  /*if (!isMac)*/
                  win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
                },
                enabled: isMac ? false : true,
                accelerator: isMac ? 'Cmd+H' : 'Ctrl+H',
                //role : "hide"
              },
              /*{
                label: '⛶  ' + i18n.__('fullscreen'),
                accelerator: isMac ? 'Cmd+M' : 'Ctrl+M',
                click: () => {
                  checkMaximize(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window,true);
                  if (isMac) {
                    app.dock.show();
                  };
                },
              },*/
            ]
          },
          {
            label: '?',
            submenu: [

              {
                label: '❔  ' + i18n.__('help'),
                accelerator: 'F1',
                click: () => {
                  openPopup('https://docs.nextcloud.com/server/latest/user_manual/ru/talk', win_main[`${store.get('current_login')}:${store.get('server_url')}:false`]);
                  //app.exit(0);
                }
              },
              {
                label: '🔍  ' + i18n.__('open_devtools'),
                accelerator: 'F12',
                click: () => {
                  win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.webContents.toggleDevTools();
                }
              },
              {
                type: 'separator'
              },
              {
                label: 'ⓘ  ' + i18n.__('about'),
                // for linux compatibility
                submenu: [{
                    label: 'ⓘ  ' + i18n.__('show'),
                    click: () => {
                      updateAbout();
                      app.showAboutPanel();
                    },
                  },
                  {
                    label: '✗  ' + i18n.__('new_version_no'),
                    enabled: false
                  },
                ]
              },
            ]
          },
          {
            label: '       '
          },
          donate_menu_element,
          {
            label: ' | '
          },
          {
            label: '📱  ' + i18n.__('need_mobile'),
            ...(isMac ? {
              submenu: [{
                label: 'ⓘ  ' + i18n.__("more"),
                click: () => {
                  needMobileClick()
                }
              }]
            } : {}),
            click: () => {
              needMobileClick()
            }
          }
        ];

        let appIconMenuTemplate = [{
            label: '⿻  ' + i18n.__('show'),
            click: () => {
              /*if (gui_blocked) {
                win_loading.show();
              }*/
              if (!isLoading) {
                win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.show();
                if (isMac) {
                  app.dock.show();
                  addBadgeMac();
                };
              } else {
                dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
              }

            },
          },
          {
            label: '⚊  ' + i18n.__('hide'),
            click: () => {
              if (isMac) app.dock.hide();
              /*if (!isMac)*/
              win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
              //win_loading.hide();
            },
            enabled: isMac ? false : true,
            //role : "hide"
          },
          {
            type: 'separator'
          },
          // TODO this doesn't look and doesn't update properly, disabled for now
          /*{
            label: '👥  ' + i18n.__('current_account'),
            submenu: []
          },*/
          {
            label: '⚙️  ' + i18n.__('preferences'),
            click: () => {
              if (!isLoading) {
                openSettings();
              } else {
                dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
              }
            },
          },
          // set logging to file
          {
            label: '📄  ' + i18n.__('logging_open'),
            //type: 'checkbox',
            enabled: store.get('logging'),
            click: () => {
              writeLog(`Opening app.log file in ${app.getPath('userData')}`);
              openFile(path.join(app.getPath('userData'), 'app.log'));
            }
          },
          {
            label: 'ℹ️  ' + i18n.__('about'),
            // for linux compatibility
            submenu: [{
                label: 'ℹ️  ' + i18n.__('show'),
                click: () => {
                  updateAbout()
                  app.showAboutPanel();
                },
              },
              {
                label: '✗  ' + i18n.__('new_version_no'),
                enabled: false
              },
              donate_menu_element.submenu[0],
              donate_menu_element.submenu[1]
            ]
          },
          {
            type: 'separator'
          },
          {
            label: '🌐  ' + i18n.__('nc_link'),
            click: () => {
              shell.openExternal(store.get('server_url'));
            },
          },
          {
            label: '🚪  ' + i18n.__('exit'),
            click: () => {
              //store.set('bounds', win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.getBounds());
              syncBounds();
              store.delete('latestVersion');
              store.delete('releaseUrl');
              if (isMac) {
                exec('launchctl bootout gui/"$(id -u)"/com.electron.' + appNameLC);
              }
              app.exit(0);
            },
          },
          /*{
            type: 'separator'
          },
          {
            label: "DEBUG_ZONE",
            enabled: false
          },
          {
            label: "COMMANDS",
            submenu: [
              {
                label: "DismissAllNotiForced",
                click: () => {
                  DismissAllNoti();
                  writeLog("Forced dismiss all notifications")
                }
              },
              {
                label: "checkNetwork",
                click: () => {
                  checkNetwork();
                }
                
              }
            ]
          },*/
        ];

        function delayedNotiActivityCheck() {
          return powerMonitor.getSystemIdleTime();
        }

        function checkNotiInactivity(win_noti, activity_check_interval) {
          let idleTime = powerMonitor.getSystemIdleTime();

          //writeLog(`delayedIdleTime: ${delayedIdleTime[win_noti.id]}`)
          if (isLinux) {
            idleTime = delayedIdleTime[win_noti.id];
          }

          //writeLog(`Current idle time for notification ID ${win_noti.id } with interval ${activity_check_interval}s is: ${idleTime}s`);

          if ((idleTime < 1) && (!(dismissed[win_noti.id]))) {
            // start counter in case of the last win_noti only
            if (win_noti.id === Math.max(...notificationWindowsIds)) {
              win_noti.webContents.executeJavaScript(`updateDismissTimeout(10,${win_noti.id})`);
              dismissed[win_noti.id] = true;
            }
          }
          //writeLog(`Current idle time for app with interval ${activity_check_interval}s is: ${idleTime}s`);
        }

        function checkInactivity(activity_check_interval, account, url, isForeground) {
          let idleTime = powerMonitor.getSystemIdleTime();

          if (!win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isVisible() || !win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isFocused()) {
            idleTime_non_active += activity_check_interval;
          } else {
            idleTime_non_active = 0;
          }
          //writeLog(`Current hidden or unfocused time is: ${idleTime_non_active} s`);

          if ((idleTime_non_active > 4*60) && (!isLocked_suspend)) {
            if (idleTime <= 4*60) {
              idleTime_non_active = 0;
              //writeLog(`Window ${account}:${url} is hidden or unfocused for more than 4 minutes, but user was active - forcing online status`);
              // do force_online for account
              win_main.id[`${account}:${url}`].window.webContents.executeJavaScript(`force_online();`);
            }
          }
        }

        async function checkNetwork(urls_to_checks) {
          const doCheckNetwork = async (urls = []) => {
            /*const defaultUrls = [
              'https://www.google.com',  // Removed trailing spaces
              'https://1.1.1.1',        // Cloudflare DNS
              'https://www.cloudflare.com'  // Removed trailing spaces
            ];*/
            
            // Combine default URLs with preconfigured ones
            const allUrls = [...new Set([/*...defaultUrls,*/ ...urls])]; // Remove duplicates
            const results = {};
            let overallResult = true;

            // Function to create a timeout promise
            const timeoutPromise = (ms) => {
              return new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), ms);
              });
            };

            // Function to ping a single URL with timeout
            const pingUrl = async (url) => {
              const startTime = Date.now();
              
              try {
                // Race the fetch request against a timeout promise
                const response = await Promise.race([
                  fetch(url, { method: 'HEAD', mode: 'no-cors' }),
                  timeoutPromise(5000) // 5 seconds timeout
                ]);
                
                const responseTime = Date.now() - startTime;
                // Note: with 'no-cors', we can't check response status, so we'll consider it successful if no exception occurred
                return { url, status: 'reachable', responseTime };
              } catch (error) {
                const responseTime = Date.now() - startTime;
                // Check if the error is a timeout
                if (error.message === 'Request timeout') {
                  return { url, status: 'timeout', responseTime, error: error.message };
                }
                return { url, status: 'unreachable', responseTime, error: error.message };
              }
            };

            // Execute all ping checks concurrently
            const pingPromises = allUrls.map(url => pingUrl(url));
            const pingResults = await Promise.allSettled(pingPromises);

            // Process results
            pingResults.forEach((result, index) => {

              if (result.status === 'fulfilled') {
                if (result.value.status !== 'reachable') {
                  overallResult = false;
                }
                results[allUrls[index]] = result.value;
              } else {
                results[allUrls[index]] = { 
                  url: allUrls[index], 
                  status: 'error', 
                  error: result.reason.message 
                };
                overallResult = false;
              }
            });
            //writeLog (results, true);
            //writeLog (overallResult);
            return overallResult;
          }

          let networkStatus = await doCheckNetwork(urls_to_checks);
          return networkStatus;
        }

        function checkMaximize(win,click) {
          try {
            if (win.isMaximized()) {
              if (click) {
                //mainMenuTemplate[1].submenu[3].label = '⛶  ' + i18n.__("fullscreen");
                win.unmaximize()
              }/* else {
                mainMenuTemplate[1].submenu[3].label = '⿻  ' + i18n.__("restore");
              }*/
            } else {
              if (click) {
                //mainMenuTemplate[1].submenu[3].label = '⿻  ' + i18n.__("restore");
                if (isLinux || isMac) {
                  let {
                    bounds,
                    workArea
                  } = screen.getDisplayMatching(store.get('bounds'));

                  workArea.height -= 70; // -70 to prevent height issues
                  workArea.width -= 2;
                  // comment out setBound below to prevent maximization on linux (workaround as maximizable is not supported by linux, mac and win only) ?
                  win.setBounds(workArea);
                } else {
                  win.maximize()
                }
              }/* else {
                mainMenuTemplate[1].submenu[3].label = '⛶  ' + i18n.__("fullscreen");
              }*/
            }
            //MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            //Menu.setApplicationMenu(MainMenu);
            //checkNewVersion(app.getVersion());
          }
          catch(err) {
            writeLog(err);
          }
        }

        function isInternalLink(url) {
          return url.startsWith('file')
        }

        function isExternalLink(url) {
          return !isInternalLink(url)
        }

        // ctrl+tab shortcut handle to switch windows
        function showRoundRobinAccount(current_win) {
          //writeLog(Object.keys(loginData.accounts).length)

          if (Object.keys(loginData.accounts).length > 1) {
            //try {
              let next_index = current_win.index+1
              const keysArray = Object.keys(win_main.id);
              if (next_index > Object.keys(win_main.id).length) {
                next_index = 1;
              }

              MainMenu.getMenuItemById(`show-${keysArray[current_win.index-1]}`).checked = false;


              const nextObject = keysArray[next_index-1 % Object.keys(win_main.id).length];
              const targetWindow = win_main.id[nextObject];

              // Hide current foreground window
              //if (!targetWindow.window.isDestroyed()) {
                win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
                win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true;
                targetWindow.isForeground = false;
                
                targetWindow.window.show();

                store.set('current_login', keysArray[next_index-1].split(/:(.+)/)[0]);
                store.set('server_url', keysArray[next_index-1].split(/:(.+)/)[1]);

                MainMenu.getMenuItemById(`show-${keysArray[next_index-1]}`).checked = true;
                guiInit(true);
              //}

            //}
            //catch(err) {
            //  writeLog(`Error during showRoundRobinAccount: ${err}`)
            //}
          }
        }

        function showDonateModal() {
          return new Promise((resolve) => {
            let width = 500;
            let height = 550;

            const bounds = store.get('bounds');

            const x = Math.round(bounds.x + (bounds.width - width) / 2);
            const y = Math.round(bounds.y + (bounds.height - height) / 2);

            const win_donate = new BrowserWindow({
              //modal: isMac,
              modal: true,
              icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
              title: '💰  ' + i18n.__('donate_title'),
              // macOS & Windows 10/11 only
              //vibrancy: 'fullscreen-ui',    // on MacOS
              //backgroundMaterial: 'acrylic', // on Windows 11
              //titleBarStyle: 'hidden',
              //frame: false,
              width: width,
              height: height,
              resizable: false,
              minimizable: (isMac) ? false : true,
              maximizable: (isMac) ? false : true,
              fullScreenable: (isMac) ? false : true,
              movable: false,
              //transparent: true,
              x: x,
              y: y,
              //alwaysOnTop: !isLinux, // Optional: keep on top
              //focusable: !isLinux,
              //hasShadow: false,
              skipTaskbar: true, // Optional: don't show in taskbar
              autoHideMenuBar: true,
              /*webPreferences: {
                  //devTools: true,
                  //sandbox: false,
                  contextIsolation: true
              },*/
              parent: win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, './donate/donate-preload.js')
              }
            });

            win_donate.loadFile('./donate/donate.html');

            win_donate.webContents.once('did-finish-load', () => {
              win_donate.webContents.send('load-donate-data', {
                title: '💰  ' + i18n.__('donate_title'),
                win_title: app.getName() + " v." + app.getVersion(),
                detail: i18n.__('donate_message'),
                theme: theme,
                //icon: original_icon.toDataURL(),
                icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`].toDataURL() : original_icon.toDataURL(),
                buttons: [{
                    text: '🔐  ' + i18n.__('donate_request_license')
                  },
                  {
                    text: '🔓  ' + i18n.__('donate_open_license')
                  },
                  {
                    text: '👛  ' + i18n.__('donate_copy_ton_wallet')
                  },
                  {
                    text: '⭐  ' + i18n.__('donate_star_github')
                  },
                  {
                    text: i18n.__('cancel_button')
                  }
                ]
              });
            });

            const onResponse = (event, responseIndex) => {
              ipcMain.removeListener('donate-modal-response', onResponse);
              win_donate.close();
              resolve({
                response: responseIndex,
                window: win_donate
              });
            };

            ipcMain.once('donate-modal-response', onResponse);

            win_donate.on('closed', () => {
              ipcMain.removeListener('donate-modal-response', onResponse);
              resolve({
                response: 4
              });
            });
            //win_donate.webContents.toggleDevTools();
          });
        }

        async function donateClick() {
          if (isDialogOpen || prompted) {
            //writeLog('Dialog is already open. Skipping duplicate.');
            return;
          }

          isDialogOpen = true;
          store.set('donation_showed', Math.floor(Date.now() / 1000));

          try {
            const result = await showDonateModal();

            if (result.response === 0) {
              // if request license
              // return;
              prompted = true;
              // show input box for server address
              prompt({
                  title: '🔐  ' + i18n.__('donate_request_license'),
                  label: '📧  ' + i18n.__('donate_request_enter_email'),
                  //value: server_url,
                  customStylesheet: (theme == 'dark') ? theme : null,
                  type: 'input',
                  buttonLabels: {
                    ok: i18n.__('save_button'),
                    cancel: i18n.__('cancel_button')
                  },
                  inputAttrs: {
                    type: 'email',
                    required: true
                  },
                  icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
                  height: 350
                }, (!isMac) ? win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window : null)
                .then((input) => {
                  prompted = false;
                  if (input === null) {
                    //store.set('license_key', null);
                    donateClick();
                  } else {
                    writeLog(`Call license server api to generate key for ${input} `);
                    reqLicense(input);
                  }
                })
                .catch((err) => {
                  writeLog(err);
                });
            } else if (result.response === 1) {
              // if open license
              let clip_value = clipboard.readText();
              let pattern = '^([0-9A-F]{4}-){3}[0-9A-F]{4}$';
              let regex = new RegExp(pattern);
              let isValid = regex.test(clip_value);
              prompted = true;
              prompt({
                  title: '🔑  ' + i18n.__('donate_open_message'),
                  label: '🔑  ' + i18n.__('donate_open_message'),
                  value: (isValid) ? clip_value : null,
                  customStylesheet: (theme == 'dark') ? theme : null,
                  type: 'input',
                  buttonLabels: {
                    ok: i18n.__('save_button'),
                    cancel: i18n.__('cancel_button')
                  },
                  ...(isMac ? {
                    button: {
                      label: i18n.__('paste'),
                      click: () => {
                        document.querySelectorAll("#data")[0].value = document.querySelectorAll("button")[0].getAttribute("data");
                      },
                      attrs: {
                        data: clipboard.readText()
                      }
                    }
                  } : {}),
                  inputAttrs: {
                    type: 'text',
                    required: true,
                    pattern: pattern,
                    placeholder: 'XXXX-XXXX-XXXX-XXXX'
                  },
                  icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
                  height: 250
                }, (!isMac) ? win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window : null)
                .then((input) => {
                  prompted = false;
                  if (input === null) {
                    //store.set('license_key', null);
                    donateClick();
                  } else {
                    store.set('license_key', input);
                    checkLicense(input, true);
                  }
                });
            } else if (result.response === 2) {
              clipboard.writeText(ton_wallet);
              prompted = true;
              dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                  type: 'info',
                  //message: i18n.__('donate_copy_ton_wallet_copied'),
                  detail: i18n.__('donate_copy_ton_wallet_copied')
                })
                .then((result) => {
                  prompted = false;
                });
            } else if (result.response === 3) {
              shell.openExternal('https://github.com/drlight17/talk-electron');
            }
          } catch (err) {
            writeLog('Dialog was closed unexpectedly or error occurred: ' + err);
          } finally {
            isDialogOpen = false;
          }

        }

        function needMobileClick() {
          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
              'type': 'question',
              'title': '📱  ' + i18n.__('need_mobile'),
              'message': i18n.__("need_mobile_prompt"),
              'defaultId': 0,
              'buttons': [
                i18n.__('yes_button'),
                i18n.__('no_button')
              ]
            })
            .then((result) => {
              // if yes
              if (result.response !== 1) {
                shell.openExternal('https://nextcloud.com/install/#talk-mobile')
              }
            });

        }

        function sortObjectsByIdx(obj) {
          const sortedEntries = Object.entries(obj.id)
            .sort((a, b) => a[1].index - b[1].index); // Сортируем по значению index
          
          const sortedObj = {};
          for (const [key, value] of sortedEntries) {
            sortedObj[key] = value;
          }
          
          win_main = {id:sortedObj};
        }

        async function getConfiguredAccounts(fallback) {
          const savedCreds = await getCredentials();
          //writeLog(savedCreds,true)
          if (savedCreds) {
            try {
              //loginData = JSON.parse(savedServers);
              //loginData = Object.fromEntries(savedCreds.map(item => [account: item.account, item.password]));
              loginData = {
                accounts: savedCreds.map(item => {
                  const [, username, url] = item.account.match(/^([^:]+):(.+)$/);
                  return {
                    username: username || '',
                    url: url,
                    password: item.password
                  };
                })
              };
              //writeLog(loginData.accounts,true)
              insertServers(fallback);
            } catch (e) {
              writeLog("Error during servers get:" + e);
              app.exit(0);
              // try to cleanup deprecated saved credentials
              /*savedCreds.forEach((savedCred)=> {
                deleteCredentials(savedCred.account, "")
              })

              
              session.defaultSession.clearStorageData([], (data) => {});

              store.delete('server_url');
              store.delete('current_login');
              restartApp();*/
            }
          } else {
            if (fallback) {
              writeLog("No configured servers and accounts! Run startup master.");

              store.delete('server_url');
              store.delete('current_login');
              restartApp();

            }
          }
        }

        function insertServers(fallback) {
          try {
            // First, filter and get only foreground accounts with their correct index
            /*const foregroundAccounts = loginData.accounts.filter((account, index) => {
              return !(account.url == store.get('server_url') && account.username == store.get('current_login'));
            });*/
            
            //let foregroundIndex = 0; // Counter for foreground accounts only

            //loginData.accounts.forEach((account, index) => {
            for (let [index, account] of Object.entries(loginData.accounts)) {  
              // change index to 1-based
              //index += 1;
              index++;
              let isForeground = false;

              // if falled back then set the first server_url in config and return
              if (fallback) {
                writeLog('Fallback to another configured account ' + account.username + ' and server '+account.url)
                store.set('server_url', account.url);
                store.set('current_login', account.username);
                restartApp();
                break;
              }

              let delete_account = {
                label: '❌  ' + i18n.__('delete_account'),
                click: () => {
                  if (!isForegroundLoading) {
                    const options = {
                      type: 'question',
                      buttons: [i18n.__('yes_button'), i18n.__('no_button')],
                      defaultId: 0,
                      title: i18n.__('delete_account'),
                      message: i18n.__('delete_account_confirm', {
                        server_url: account.url,
                        saved_login: account.username
                      }),
                    };

                    dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, options)
                      .then((result) => {
                        switch (result.response) {
                          case 0: // Yes
                            deleteCredentials(account.username, account.url)
                            session.defaultSession.clearStorageData([], (data) => {});
                            //removeServerFromLoginData(url);
                            getConfiguredAccounts(true);
                            
                            break;
                          case 1: // No
                            break;
                        }
                      })
                      .catch((err) => {
                        writeLog('Dialog was closed unexpectedly or error occurred: ' + err);
                      })
                  } else {
                    dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                  }
                }
              }

              let label = '';
              if ((account.username) && (account.username !== 'auto_login')) {
                label = '👤  ' + i18n.__('current_login') + ' ' + account.username
              } else {
                label = '👤  ' + i18n.__('logged_out')
              }

              if (!((account.url == store.get('server_url')) && (account.username == store.get('current_login')))) {
                //label = "*** "+label+" ***"
                isForeground = true;
              }

              // Calculate accelerator only for foreground accounts
              /*let accelerator = 'CmdOrCtrl+0'; // Default for non-foreground
              if (isForeground) {
                accelerator = `CmdOrCtrl+${foregroundIndex + 1}`;
                foregroundIndex++; // Increment only for foreground accounts
              }*/

              saved_login_submenu = {
                label: label,
                sublabel: '🌐  ' + account.url,
                id: `show-${account.username}:${account.url}`,
                type: 'checkbox',
                checked: !isForeground,
                //visible: !isForeground,
                accelerator: (Object.keys(loginData.accounts).length <= 1) ? null : `Ctrl+${index}`,
                click: (menuItem, browserWindow, event, isForeground) => {
                  if (!isForegroundLoading) {
                    // First, uncheck all other checkboxes in the same submenu
                    const submenu = menuItem.menu.items;
                    submenu.forEach(item => {
                      if (item.type === 'checkbox' && item.id !== menuItem.id) {
                        item.checked = false;
                      }
                    });
                    // Set the current item to checked (this overrides the default toggle)
                    menuItem.checked = true;

                    const windowKey = `${account.username}:${account.url}`;
                    const targetWindow = win_main.id[windowKey];
                    if (targetWindow && targetWindow.window) {
                      if (!targetWindow.window.isVisible() || targetWindow.window.isMinimized()) {
                        /*writeLog(windowKey);
                        writeLog(MainMenu.getMenuItemById(`show-${windowKey}`),true)*/


                        // Hide current foreground window
                        //writeLog('before hide:'+`${currentLogin}:${currentServer}`);
                        //writeLog(store.get('bounds'), true);
                        win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
                        win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true;
                        targetWindow.isForeground = false;
                        
                        targetWindow.window.show();

                        store.set('current_login', account.username);
                        store.set('server_url', account.url);
                        guiInit(true);
                      }
                    }
                  } else {
                    setTimeout(() => {
                      menuItem.checked = false;
                    }, 0);
                    dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                  }
                  // Prevent the default toggle behavior
                  event.preventDefault();
                }
              }

              // TODO this doesn't look and doesn't update properly, disabled for now
              /*appIconMenuTemplate[4].submenu.push(
                saved_login_submenu,
                {
                  label: '🌐  ' + account.url,
                  enabled: false,
                },
                {
                  type: 'separator'
                }
              );*/

              mainMenuTemplate[0].submenu[0].submenu.push(
                saved_login_submenu,
                {
                  label: '🌐  ' + account.url,
                  enabled: false,
                  visible: isMac,
                },
                delete_account,
                {
                  type: 'separator'
                }
              );
            }//);

            let tab_help = {
              label: '🔄 '+i18n.__('switch_accounts'),
              accelerator: `Ctrl+Tab`,
              enabled: true,
              visible: (Object.keys(loginData.accounts).length <= 1) ? false : true, 
              click: () => {
                if (!isForegroundLoading) {
                  showRoundRobinAccount(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`]);
                } else {
                  dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                }
              }
            }

            let add_account = {
              label: '+  ' + i18n.__('add_account'),
              click: () => {
                if (!isForegroundLoading) {
                  setServerUrl(url_example, true);
                } else {
                  dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                }
              }
            }
            // TODO this doesn't look and doesn't update properly, disabled for now
            //appIconMenuTemplate[4].submenu.push(add_account)

            mainMenuTemplate[0].submenu[0].submenu.push(tab_help)

            // set maximum possible configured accounts to 9
            if (loginData.accounts.length < 9) {
              mainMenuTemplate[0].submenu[0].submenu.push(add_account)
            }
            
            // TODO this doesn't look and doesn't update properly, disabled for now
            //const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate);
            //appIcon.setContextMenu(contextMenu);

            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
          } catch (err) {
            writeLog('Failed to insert account to menus: ' + err);
          }
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
              {
                type: 'separator'
              },
              {
                //label: 'Add to dictionary',
                label: '📙  ' + i18n.__('add_to_dict'),
                click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
              },
              {
                type: 'separator'
              },
            ]
            if (params.misspelledWord) {
              menuItems.push(...menuMisspellingItems)
              haveContext = true;
            }

            // Add context actions for handling images
            const menuImageItems = [{
                //label: 'Copy image',
                label: '✍️  ' + i18n.__('copy_image'),
                click: () => win.webContents.copyImageAt(params.x, params.y),
              },
              {
                //label: 'Save image',
                label: '🖼️  ' + i18n.__('save_image'),
                click: () => win.webContents.downloadURL(params.srcURL),
              },
              {
                type: 'separator'
              },
            ]
            if (params.hasImageContents) {
              menuItems.push(...menuImageItems)
              haveContext = true;
            }

            // Add context actions for handling links
            const menuLinkItems = [{
                //label: 'Copy link address',
                label: '📋🔗  ' + i18n.__('copy_link_address'),
                click: () => clipboard.writeText(params.linkURL),
              },
              {
                //label: 'Copy link text',
                label: '📋📄  ' + i18n.__('copy_link_text'),
                click: () => clipboard.writeText(params.linkText.trim() || params.linkURL),
              },
              {
                type: 'separator'
              },
            ]
            if (params.linkURL && isExternalLink(params.linkURL)) {
              menuItems.push(...menuLinkItems)
              haveContext = true;
            }

            // Add context actions for clipboard events and text editing
            const menuClipboardItems = [{
                role: 'copy',
                label: '📋  ' + i18n.__('copy'),
                enabled: params.selectionText && params.editFlags.canCopy,
              },
              {
                role: 'cut',
                label: '✂  ' + i18n.__('cut'),
                enabled: params.selectionText && params.isEditable && params.editFlags.canCut,
                visible: params.isEditable,
              },
              {
                role: 'selectAll',
                label: '✔  ' + i18n.__('select_all'),
                enabled: params.editFlags.canSelectAll,
              },
              {
                role: 'paste',
                label: '⤵  ' + i18n.__('paste'),
                enabled: params.isEditable && params.editFlags.canPaste,
                visible: params.isEditable,
              },
              {
                type: 'separator'
              },
            ]
            if (params.isEditable || params.selectionText.length) {
              menuItems.push(...menuClipboardItems)
              haveContext = true;
            }

            // Remove or hide from production DevTools toggle before final release
            //menuItems.push({ role: 'toggleDevTools' })

            if (haveContext) {
              Menu.buildFromTemplate(menuItems).popup()
            }
          })
        }
        async function getSettings(win, flag) {
          var lang_files = JSON.stringify(i18n.___("get_locales"));
          var themes = JSON.stringify([{
            "auto": i18n.__("auto")
          }, {
            "dark": i18n.__("dark")
          }, {
            "light": i18n.__("light")
          }]);
          if (!saved_proxy_login) {
            //writeLog("Use of system proxy is not enabled. Force proxy credentials remove from keystore.")
            let creds = await getAllProxyCredentials();
            //writeLog(creds,true);

            creds.forEach(async (credential) => {
              deleteProxyCredentials(credential.account);
            });

          }
          win.webContents.executeJavaScript(`loadSettings(` + JSON.stringify(store.store) + `,` + lang_files + `,` + flag + `,` + themes + `,'` + proxyUrl + `','` + saved_proxy_password + `','` + theme + `');`);
          if (!app.isPackaged) {
            win.webContents.executeJavaScript(`disableRunAtStartup();`);
            //win.webContents.toggleDevTools();
          }
          if (Object.keys(loginData.accounts).length <= 1) {
            win.webContents.executeJavaScript(`disableSumUnread();`);
          }
        }

        async function updateAbout() {
          //customize about
          let copyright = "Lisense AGPLv3 ©2024" + " - " + new Date().getFullYear();
          if (store.get('license_key')) {
            copyright = i18n.__('donate_key') + ' ' + store.get('license_key') + '\n\n' + copyright
          }
          app.setAboutPanelOptions({
            applicationName: app.getName(),
            applicationVersion: "v." + app.getVersion(),
            authors: ["drlight17"],
            version: app.getVersion(),
            copyright: copyright,
            iconPath: iconPath,
            website: "https://github.com/drlight17/talk-electron"
          });
        }

        async function getProxyInfo(url) {

          proxyInfo = await session.defaultSession.resolveProxy(url);

          if (proxyInfo.split(' ')[1]) {
            proxyUrl = 'https://' + proxyInfo.split(' ')[1];
            //writeLog('Configured proxy URL: '+proxyUrl)
          } else {
            return false;
          }

          if (store.get('saved_proxy_login')) {
            saved_proxy_login = store.get('saved_proxy_login')
          }
          try {
            saved_proxy_password = await getProxyCredentials(JSON.parse(saved_proxy_login).server?.[proxyUrl]?.user)
          } catch (err) {
            writeLog(err)
            return false;
          }

          /*if (!saved_proxy_password) {
            //saveProxyServer(proxyUrl)
            // use settings to store proxy login and password instead of dialog
            return false;
          }*/
          let auth = null;
          if (proxyInfo === 'DIRECT') {
            return false;
          } else {

            if (saved_proxy_password == null) {
              //writeLog("No saved login or password. Try to use proxy anonymously... ")
              auth = false
            } else {
              auth = `${JSON.parse(saved_proxy_login).server?.[proxyUrl]?.user}:${saved_proxy_password}`
            }
            let host = new URL(proxyUrl).hostname
            let port = new URL(proxyUrl).port

            proxyAgent = new HttpsProxyAgent({
              host: host,
              port: port,
              //auth: `${proxies[0].username}:${proxies[0].password}`,
              auth: auth,
            });
            //writeLog(proxyAgent,true)

            /*proxyWsAgent = new SocksProxyAgent(
              `socks5://${auth}@${host}:1080`
            );*/
          }
        }

        async function jsonRequest(options) {
          isLoading = true;
          const {
            url,
            method = 'GET',
            headers = {},
            data = null
          } = options;

          return new Promise((resolve, reject) => {
            const request = net.request({
              url,
              method,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
              }
            });

            const timeoutId = setTimeout(() => {
              request.abort();
              reject(new Error('Request timeout after 10 seconds'));
              isLoading = false;
            }, 10000);

            const cleanup = () => {
              clearTimeout(timeoutId);
              isLoading = false;
            };

            request.on('response', (response) => {
              let rawData = '';

              response.on('data', (chunk) => {
                rawData += chunk;
              });

              response.on('end', () => {
                cleanup();

                let jsonData = null;
                if (rawData) {
                  try {
                    jsonData = JSON.parse(rawData);
                  } catch (err) {
                    return reject(new Error(`Invalid JSON response: ${err.message}`));
                  }
                }

                resolve({
                  statusCode: response.statusCode,
                  statusMessage: response.statusMessage,
                  headers: response.headers,
                  jsonData
                });
              });

              response.on('error', (err) => {
                cleanup();
                reject(new Error(`Response error: ${err.message}`));
              });
            });

            request.on('error', (err) => {
              cleanup();
              reject(new Error(`Request failed: ${err.message}`));
            });

            // login (proxy)
            request.on('login', (authInfo, callback) => {
              if (proxyAgent?.proxy?.auth) {
                const [username, password] = proxyAgent.proxy.auth.split(':');
                callback(username, password);
              } else {
                callback();
              }
            });

            if (data !== null) {
              const body = JSON.stringify(data);
              request.write(body);
            }

            request.end();
          });
        }

        async function loadURLWithProxy(win, url, proxyAgent) {
          //writeLog("Trying to load "+url+" using proxy.")
          win.loadURL(url, {
            userAgent: `NC Talk Electron v. ${app.getVersion()} (${os.hostname()}/${os.platform()} /${os.version()})`,
            extraHeaders: [
              'OCS-APIRequest: true',
              `Accept-Language: ${store.get('locale')}`
              //`Accept-Language: ${app.getPreferredSystemLanguages().join(',')}`
            ].join('\n'),
            agent: proxyAgent
          });
        }

        async function reqLicense(email) {
          return new Promise(resolve => {
            const data = JSON.stringify({
              "action": "create",
              "license_data": {
                "user": email,
                "product": "NC Talk Electron"
              }
            });
            const req = require('https').request({
              hostname: 'license.drlight.fun',
              //port: 443,
              path: '/api',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'User-Agent': `NC Talk Electron v. ${app.getVersion()} (${os.hostname()}/${os.platform()} /${os.version()})`,
                'Accept-Language': store.get('locale')
              }
            }, res => {
              let body = '';
              res.on('data', chunk => {
                body += chunk;
                //writeLog(body)
              });

              res.on('end', () => {
                //writeLog(JSON.parse(body),true)
                try {
                  if (JSON.parse(body).created) {
                    store.set('license_key', JSON.parse(body).key)
                    dialog.showMessageBox({
                      type: 'info',
                      message: i18n.__('donate_request_license_sent'),
                      detail: body
                    });
                  }
                  store.set('license_key_activated', false)
                } catch (err) {
                  writeLog(err);
                }
              });
            });

            req.on('error', (err) => writeLog(err));
            // login (proxy)
            req.on('login', (authInfo, callback) => {
              if (proxyAgent?.proxy?.auth) {
                const [username, password] = proxyAgent.proxy.auth.split(':');
                callback(username, password);
              } else {
                callback();
              }
            });
            req.write(data);
            req.end();
          });
        }

        async function checkLicense(key, forced) {
          // if forced is true - force check despite of current time
          // if license_key_checked more then hour ago - request to license server

          if ((!store.get('license_key_checked')) || (Math.floor(Date.now() / 1000) - store.get('license_key_checked') > 60 * 60) || (forced)) {

            return new Promise((resolve, reject) => {
              if (forced) {
                if (store.get('license_server_url')) {
                  store.set('license_server_url', store.get('license_server_url').replace(/^https?:\/\//i, ''))
                  //writeLog('Check license using override server '+store.get('license_server_url'))
                } else {
                  //writeLog('Check license using default server')
                }
              }
              const data = JSON.stringify({
                key: key,
                action: 'validate'
              });
              let caCertPath = false;
              let caCertArr = false;

              // add custom ca cert for license requests
              if (store.get('custom_ca_cert')) {
                caCertPath = path.join(__dirname, '/', store.get('custom_ca_cert'));
                try {
                  caCertArr = [fs.readFileSync(caCertPath)]
                } catch (err) {
                  writeLog(err)
                  if (forced) {
                    dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                      type: 'error',
                      //message: i18n.__('donate_already_requested',{license_key:store.get('license_key')}),
                      detail: err,
                    })
                  }
                }
              }

              const req = require('https').request({
                //rejectUnauthorized: false, // not secure
                hostname: !store.get('license_server_url') ? 'license.drlight.fun' : store.get('license_server_url'),
                //port: 443,
                path: '/api',
                method: 'POST',
                ca: caCertArr || null,
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': data.length,
                  'User-Agent': `NC Talk Electron v. ${app.getVersion()} (${os.hostname()}/${os.platform()} /${os.version()})`,
                  'Accept-Language': store.get('locale')
                }
              }, res => {

                let body = '';
                res.on('data', chunk => {
                  body += chunk;
                  //writeLog(body)
                });

                res.on('end', () => {
                  //writeLog(JSON.parse(body),true)
                  try {
                    //resolve("Hello!");

                    if (JSON.parse(body).valid) {
                      writeLog('Your app license is valid.')
                      if (forced) {
                        dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                          type: 'info',
                          //message: i18n.__('donate_already_requested',{license_key:store.get('license_key')}),
                          detail: i18n.__('message17'),
                        })
                      }
                      updateMenu(false, false, true);
                      // show thank you for support once
                      if (!store.get('license_key_activated')) {
                        dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                          type: 'info',
                          message: i18n.__('donate_thanks_title'),
                          detail: i18n.__('donate_thanks')
                        });
                        store.set('license_key_activated', true)
                      }
                    } else {

                      if (JSON.parse(body).not_activated) {
                        writeLog('Your app license is not activated!')
                        if (forced) {
                          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                            type: 'error',
                            //message: i18n.__('donate_already_requested',{license_key:store.get('license_key')}),
                            detail: i18n.__('message18'),
                          })
                        }
                      } else if (JSON.parse(body).expired) {
                        writeLog('Your app license is expired!')
                        if (forced) {
                          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                            type: 'error',
                            //message: i18n.__('donate_already_requested',{license_key:store.get('license_key')}),
                            detail: i18n.__('message19'),
                          })
                        }
                        store.set('license_key', null)
                      } else {
                        writeLog('Your app license is absent or invalid!')
                        if (forced) {
                          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                            type: 'error',
                            //message: i18n.__('donate_already_requested',{license_key:store.get('license_key')}),
                            detail: i18n.__('message20'),
                          })
                        }
                        store.set('license_key', null)
                      }

                      store.set('license_key_activated', false)
                      updateMenu(false, false, false);

                      //updateAbout();

                      // if app run for the first time and donate message wasn't shown - delay for 3 minutes to show it
                      if (!store.get('donation_showed')) {
                        setTimeout(() => {
                          donateClick();
                        }, 3 * 60 * 1000);
                      } else {
                        if ((Math.floor(Date.now() / 1000) - store.get('donation_showed') > 60 * 60 * 24 * 7)) {
                          writeLog('App is not licensed and message showed 7 days ago. Showing...')
                          // if app run for the first time and no donation message were shown - delay for 3 minutes
                          donateClick();
                        } else {
                          //writeLog('App is not licensed, but message showed less then 7 days ago. Skipping...' )
                        }
                      }
                    }
                    store.set('license_key_checked', Math.floor(Date.now() / 1000))
                  } catch (err) {
                    writeLog(err);
                    updateMenu(false, false, false);
                  }
                });
              });

              req.on('error', (err) => {
                writeLog(err)
                updateMenu(false, false, false);
              });
              // login (proxy)
              req.on('login', (authInfo, callback) => {
                if (proxyAgent?.proxy?.auth) {
                  const [username, password] = proxyAgent.proxy.auth.split(':');
                  callback(username, password);
                } else {
                  callback();
                }
              });
              req.write(data);
              req.end();
            });
          } else {
            //writeLog('Skip check license api request as no hour passed since last one.')
            if (store.get('license_key_activated') && store.get('license_key')) {
              updateMenu(false, false, true);
            } else {
              updateMenu(false, false, false);
            }
          }
        }

        function updateMenu(releaseUrl, latestVersion, licensed) {
          try {

            if ((releaseUrl) && (latestVersion) && (!licensed)) {
              appIconMenuTemplate[5].submenu[1].label = '🔥  ' + i18n.__('new_version') + ": " + latestVersion;
              appIconMenuTemplate[5].submenu[1].enabled = true;
              appIconMenuTemplate[5].submenu[1].click = () => {
                shell.openExternal(releaseUrl);
              };
              mainMenuTemplate[2].submenu[3].submenu[1].label = '🔥  ' + i18n.__('new_version') + ": " + latestVersion;
              mainMenuTemplate[2].submenu[3].submenu[1].enabled = true;
              mainMenuTemplate[2].submenu[3].submenu[1].click = () => {
                shell.openExternal(releaseUrl);
              };
            }
            // update donate_menu_element in main and tray menu depend on the license status
            if (mainMenuTemplate[4].id == 'donate_menu_element') {
              if (licensed === true) {
                // remove donate_menu_element from main menu
                mainMenuTemplate.splice(4, 1);
                // remove donate_menu_element from tray menu
                appIconMenuTemplate[5].submenu.splice(2, 2)
              }
            } else {
              if (licensed === false) {
                // add donate_menu_element to main menu
                mainMenuTemplate.splice(4, 0, donate_menu_element)
                // add donate_menu_element to tray menu
                appIconMenuTemplate[5].submenu.splice(2, 0, donate_menu_element.submenu[0])
                appIconMenuTemplate[5].submenu.splice(3, 0, donate_menu_element.submenu[1])
              }
            }


            /*appIconMenuTemplate[5].submenu.splice(1,0, donate_menu_element[0])
            appIconMenuTemplate[5].submenu.splice(2,0, donate_menu_element[1])*/

            const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate);
            appIcon.setContextMenu(contextMenu);
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
          } catch (err) {
            writeLog('Failed to update menu: ' + err);
          }
        };

        function openNewVersionDialog(releaseUrl, latestVersion) {

          if (isDialogOpen) {
            //writeLog('Dialog is already open. Skipping duplicate.');
            return;
          }

          let remembered = false;
          try {
            const rememberData = JSON.parse(store.get('new_version_remember'));
            remembered = Boolean(rememberData[latestVersion]);
          } catch (err) {
            //writeLog(err)
          }

          updateMenu(releaseUrl, latestVersion);

          if (remembered) {
            return;
          }

          isDialogOpen = true;
          let readChanges = false;

          const options = {
            type: 'info',
            buttons: [i18n.__('yes_button'), i18n.__('no_button'), i18n.__('new_version_details')],
            defaultId: 0,
            //title: i18n.__('new_version') + ": " + latestVersion,
            message: i18n.__('new_version') + ": " + latestVersion,
            detail: i18n.__('new_version_ask'),
            checkboxLabel: i18n.__('new_version_remember'),
            checkboxChecked: false,
          };

          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, options)
            .then((result) => {
              const decisionData = {};

              switch (result.response) {
                case 0: // Yes
                  decisionData[latestVersion] = result.checkboxChecked;
                  store.set('new_version_remember', JSON.stringify(decisionData));
                  shell.openExternal(releaseUrl);
                  break;

                case 1: // No
                  decisionData[latestVersion] = result.checkboxChecked;
                  store.set('new_version_remember', JSON.stringify(decisionData));
                  break;

                case 2: // show changelog
                  shell.openExternal('https://raw.githubusercontent.com/drlight17/talk-electron/main/CHANGES.md');
                  readChanges = true;

                  break;
              }
            })
            .catch((err) => {
              writeLog('Dialog was closed unexpectedly or error occurred: ' + err);
            })
            .finally(() => {
              isDialogOpen = false;
              if (readChanges) {
                openNewVersionDialog(releaseUrl, latestVersion);
              }
            });
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
              openNewVersionDialog(releaseUrl, latestVersion)
            } else {
              writeLog("You are using a newer version.");
            }

          } catch (error) {
            writeLog('Error fetching the latest release:' + error);
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


            const comparison = part1.localeCompare(part2, undefined, {
              numeric: true
            });

            if (comparison !== 0) {
              return comparison;
            }
          }
          return 0;
        }

        function sumUnreadCounters() {
          unread_sum = 0;
          if (Object.keys(loginData).length !== 0) {
            for (let [index, account] of Object.entries(loginData.accounts)) {
              unread_sum += parseInt(unread[`${account.username}:${account.url}`]) || 0;
            }
          }
          //writeLog(`Total unread messages: ${unread_sum}`);
          return unread_sum;
        }

        function localize(win) {
          //win.webContents.toggleDevTools();
          win.webContents.executeJavaScript(`get_all_ids();`);
          win.webContents.on('console-message', (event, level, message, line, sourceId) => {
            try {
              if (JSON.parse(message).action == 'return_localize_ids') {
                obj = JSON.parse(JSON.parse(message).localization_ids);
                obj.forEach(id => {
                  let setting_loc = i18n.__(id.replace('_id', ''))
                  win.webContents.executeJavaScript(`localize("` + id + `","` + setting_loc + `");`);

                  // localization of allow_domain_id title
                  if (id == 'allow_domain_id') {
                    id = id.replace('_id', '_title')
                    let setting_loc = i18n.__(id.replace('_id', '_title'))
                    win.webContents.executeJavaScript(`localize("` + id + `","` + setting_loc + `");`);
                  }
                });
              }
            } catch (err) {
              writeLog(err);
              //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
            }
          });
        }

        // apply unread badge to dock icon on Mac
        function addBadgeMac() {
          app.dock.setIcon(dockIcon[`${store.get('current_login')}:${store.get('server_url')}`]);
          app.dock.setBadge('');
          if (store.get('sum_unread')) {
            //writeLog(`Before set mac dockicon badge sum_unread value: ${sumUnreadCounters()}`)
            if (sumUnreadCounters() != 0) {
              app.dock.setBadge(sumUnreadCounters().toString());
            } else {
              app.dock.setBadge('');
            }
          } else {
            if ((unread[`${store.get('current_login')}:${store.get('server_url')}`] != 0) && (unread[`${store.get('current_login')}:${store.get('server_url')}`] != undefined)) {
              app.dock.setBadge(unread[`${store.get('current_login')}:${store.get('server_url')}`].toString());
            } else {
              app.dock.setBadge('');
            }
          }
        }

        async function setSettings(message, win) {
          try {
            if (JSON.parse(message).action == 'save_settings') {
              obj = JSON.parse(JSON.parse(message).settings);
              //let block_relaunch = false;
              for (var key in obj) {
                // if saved_proxy_login is changed then call saveCredentials

                if ((key == "saved_proxy_login") && (obj[key])) {

                  saveProxyServer(JSON.parse(obj[key]).server?.[proxyUrl]?.user, JSON.parse(obj[key]).server?.[proxyUrl]?.password);
                  //let saved_password = await getCredentials(obj[key]);
                  /*if (!(saved_password)) {
                    writeLog("Call save credentials")
                    block_relaunch = true;
                    savePassword(obj[key],win);
                  }*/
                } else if (key == "auto_login") {
                  if (obj[key]) {
                    store.set("current_login", "auto_login");
                  }/* else {
                    // remove auto_login from keytar and 
                    deleteCredentials("auto_login", store.get("server_url"))
                    store.delete("current_login");
                  }*/
                  /*loginData.server[store.get("server_url")] = {
                    user: obj[key] ? "auto_login" : JSON.parse(store.get('current_login')).server[store.get("server_url")].user
                  };

                  store.set("current_login", JSON.stringify(loginData));*/

                } else {

                  store.set(key, obj[key]);
                }

              }
              restartApp();
            }
            if (JSON.parse(message).action == 'restart_app') {
              restartApp();
            }
          } catch (err) {
            writeLog(err);
            //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
          }

        }

        function showAutoRetryDialog(win, options, autoRetryTimeout = 10000, promted_value) {
          return new Promise((resolve) => {
            let dialogResult = null;
            let isResolved = false;
            let timeoutId = null;

            const closeWithResult = (result) => {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeoutId);
                resolve(result);
              }
            };

            const dialogPromise = dialog.showMessageBox(win, options);

            timeoutId = setTimeout(() => {
              if (!isResolved) {
                //writeLog(`Auto-retry triggered after ${autoRetryTimeout/1000}s`);
                closeWithResult({
                  response: 0,
                  checkboxChecked: false
                }); // 0 = Retry
              }
            }, autoRetryTimeout);

            dialogPromise.then((result) => {
              closeWithResult(result);
            }).catch((error) => {
              writeLog('Dialog error:' + error);
              closeWithResult({
                response: 0,
                checkboxChecked: false
              }); // Default to retry on error
            });
          }).then((result) => {
            switch (result.response) {
              case 0: // Retry
                //writeLog('User clicked Retry or auto-retry triggered');
                restartApp();
                break;
              case 1: // Exit App
                //writeLog('User clicked Exit App');
                app.exit(0);
                break;
              case 2: // Open Preferences
                //writeLog('User clicked Open Preferences');
                openSettings(true, true);
                if (promted_value) {
                  promted = false;
                }
                break;
              /*case 3: // continue authorization (to manually enter credentials)
                setServerUrl(store.get('server_url'), true)
                //restartApp();
                break;*/
              default:
                //writeLog('Default action (auto-retry)');
                restartApp();
                break;
            }

            return result;
          });
        }

        function removeProxyServerFromLoginData(proxyUrl) {
          const savedProxyLogin = store.get("saved_proxy_login");
          if (savedProxyLogin) {
            try {
              const proxyLoginData = JSON.parse(savedProxyLogin);
              if (proxyLoginData.server && proxyLoginData.server[proxyUrl]) {
                delete proxyLoginData.server[proxyUrl];
                store.set("saved_proxy_login", JSON.stringify(proxyLoginData));
                writeLog(`Proxy server ${proxyUrl} is deleted`);
              }
            } catch (e) {
              writeLog("Error during server remove:" + e);
            }
          }
        }

        async function saveCredentials(username, password, server_address) {
          try {
            if (username=='auto_login') {
              writeLog('✅ Server '+server_address+' is set to SSO.');
            } else {
              writeLog('✅ Creds are saved!');
            }
            store.set("current_login", username);
            store.set("server_url", server_address);
            // moved keytar.setPassword after store.set to prevent appImage terminate called after throwing an instance of 'Napi::Error'
            // TODO need test?
            await keytar.setPassword("NC_Talk_Electron_v1", username+":"+server_address , password);
          } catch (error) {
            writeLog('❌ Error during cred save: ' + error);
            store.delete("current_login");
            store.delete("server_url");
          }
        }

        async function saveProxyCredentials(username, password) {
          try {
            //await keytar.setPassword("NC_Talk_Electron/"+store.get("server_url"), username, password);
            await keytar.setPassword(`NC_Talk_Electron/proxy_server/${proxyUrl}}`, username, password);
            writeLog('✅ Proxy creds are saved!');
          } catch (error) {
            writeLog('❌ Error during proxy cred save: ' + error);
          }
        }

        function syncBounds() {
          store.set('bounds', win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.getBounds());

          for (let [index, win] of Object.entries(win_main.id)) {

            try {
              if (win.isForeground) {

                // fix of y bound offset + 28px during account switch for linux (?)
                let height = store.get('bounds').height;
                if (isLinux) {
                  const {
                    bounds,
                    workArea
                  } = screen.getDisplayMatching(store.get('bounds'));

                  if (parseInt(workArea.height) - parseInt(height) - 28 <= 0) {
                    height -= 2;
                  }
                  win.window.setBounds({x: store.get('bounds').x, y: store.get('bounds').y-28, width: store.get('bounds').width, height: height})
                } else {
                  win.window.setBounds(store.get('bounds'));
                }
                //writeLog(`Synced ${index} to current window height ${height}`)
                
              }
            }
            catch(err) {
              writeLog(err)
            }
            
          }
        }

        async function getCredentials(username, server_url, maxRetries = 3, retryDelayMs = 1000) {
          const isGetAll = (!username || !server_url); // Determine operation type early
          let attempts = 0;

          while (attempts <= maxRetries) {
            try {
              let result;

              if (isGetAll) {
                //writeLog(`Attempt ${attempts + 1}/${maxRetries + 1}: Fetching all credentials.`);
                const creds = await keytar.findCredentials(`NC_Talk_Electron_v1`);
                if (creds.length > 0) {
                  //writeLog(`✅ Successfully fetched ${creds.length} credential(s).`);
                  return creds; // Return immediately on success
                } else {
                  writeLog('❌ No saved creds found after attempt at all.');
                  return null; // No creds found, not an error per se, return null
                }
              } else {
                //writeLog(`Attempt ${attempts + 1}/${maxRetries + 1}: Fetching credential for user '${username}' and server '${server_url}'.`);
                const password = await keytar.getPassword("NC_Talk_Electron_v1", username + ":" + server_url);
                if (password) {
                  //writeLog(`✅ Password found for user '${username}'.`);
                  return password; // Return immediately on success
                } else {
                  writeLog(`❌ No saved ${username} user found after attempt.`);
                  return null; // No password found, not an error per se, return null
                }
              }
            } catch (error) {
              attempts++;
              writeLog(`❌ Error fetching credentials on attempt ${attempts}/${maxRetries + 1}: ${error.message}`);

              if (attempts <= maxRetries) {
                writeLog(`Retrying in ${retryDelayMs} ms...`);
                // Introduce a delay before the next attempt
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
              } else {
                // Maximum retries reached
                writeLog(`❌ Failed to fetch credentials after ${maxRetries + 1} attempts. Giving up.`);
                // Optionally, you could throw the last error here if the caller needs to know
                // throw error;
                return null; // Or return null to indicate failure after retries
              }
            }
          }
          // This line should theoretically not be reached due to the while loop condition and returns inside the loop,
          // but included for completeness if logic changes unexpectedly.
          writeLog("❌ Unexpected end of getCredentials function.");
          return null;
        }

        async function getProxyCredentials(username) {
          try {
            const password = await keytar.getPassword(`NC_Talk_Electron/proxy_server/${proxyUrl}}`, username);
            if (password) {
              //writeLog('✅ Password for proxy '+username+' is found: '+password);
              return password;
            } else {
              writeLog('❌ No such saved proxy user');
              removeProxyServerFromLoginData(proxyUrl);
              return null;
            }
          } catch (error) {
            writeLog('❌ Error fetching proxy creds: ' + error);
            return null;
          }
        }

        async function startForeground() {
          try {
            isForegroundLoading = true;
            // get configured servers at app startup
            await getConfiguredAccounts();

            //writeLog(loginData.accounts,true)
            // TODO random timeout to avoid login errors - maybe some more robust solution???
            let randomIncrement = 1;
            let pendingTimeouts = 0; // Track number of pending timeouts
            
            //if (loginData.length > 0) {
            //loginData.accounts.forEach((account, index) => {
            for (let [index, account] of Object.entries(loginData.accounts)) { 
              // change index to 1-based
              //index += 1;
              index++;
              // random between 1 and 2 seconds
              randomIncrement += Math.round(Math.random() * (1 - 2) + 2)
              if ((store.get('current_login') != account.username) || (store.get('server_url') != account.url)) {
                pendingTimeouts++; // Increment counter for each timeout we're creating
                setTimeout(() => {
                  writeLog(`Start ${account.username}:${account.url} with index ${index} in foreground`)
                  //createForegroundWindow(account.url,account.username)
                  createWindow(account.url,account.username,true,index)
                  let activity_check_interval = 5;

                  setInterval(function() {
                    checkInactivity(activity_check_interval, account, theURL, true)
                  }, activity_check_interval * 1000);

                  pendingTimeouts--; // Decrement counter when timeout executes
                  
                  // Check if this was the last timeout to execute
                  if (pendingTimeouts === 0) {
                    isForegroundLoading = false;
                    // force sort win_main.id by index value
                    sortObjectsByIdx(win_main);
                    // TODO dirty force refresh to update unread counter in case of sum_unread enabled
                    if (store.get('sum_unread')) {
                      
                      setTimeout(() => {
                        refreshBadge(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, store.get('current_login'), store.get('server_url'))
                        }, 3000); // dirty wait 3 seconds after the last foreground server is started to load
                    }
                  }
                }, 1000+randomIncrement*1000);
              } else {
                // set cur win index!
                //writeLog(`Set index ${index} for current main_win ${store.get('current_login')}:${store.get('server_url')}`)
                win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].index = index
              }
            };
            
            // If no accounts needed to be started, set loading to false immediately
            if (pendingTimeouts === 0) {
              isForegroundLoading = false; 
            }
          }
          catch (err) {
            writeLog("Error to create foreground windows: "+err)
            // force remove server_url and restart to force adding new server
            store.delete('server_url');
            store.delete('current_login');
            restartApp();
          }
        }

        async function getAllProxyCredentials() {
          try {
            const creds = await keytar.findCredentials(`NC_Talk_Electron/proxy_server/${proxyUrl}}`);
            if (creds) {
              //writeLog('✅ Password for proxy '+username+' is found: '+password);
              return creds;
            } else {
              writeLog('❌ No saved proxy creds');
              //removeProxyServerFromLoginData(proxyUrl);
              return null;
            }
          } catch (error) {
            writeLog('❌ Error fetching proxy creds: ' + error);
            return null;
          }
        }

        async function deleteCredentials(username, url) {
          try {
            await keytar.deletePassword("NC_Talk_Electron_v1", username + ":" + url);
            writeLog(`🗑️ ${username}:${url} account is removed`);
          } catch (error) {
            writeLog('❌ Error removing creds: ' + error);
          }
        }

        async function deleteProxyCredentials(username) {
          try {
            writeLog("Proxy login to remove: " + username)
            //await keytar.deletePassword("NC_Talk_Electron/"+store.get("server_url"), username);
            await keytar.deletePassword(`NC_Talk_Electron/proxy_server/${proxyUrl}}`, username);
            writeLog('🗑️ Proxy credentials are removed');
          } catch (error) {
            writeLog('❌ Error removing proxy creds: ' + error);
          }
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

        function openSettings(flag, errored) {
          /*let modal = isMac;
          if (errored) {
            modal = true;
          }*/
          let width = 500;
          let height = 550;

          const bounds = store.get('bounds');

          const x = Math.round(bounds.x + (bounds.width - width) / 2);
          const y = Math.round(bounds.y + (bounds.height - height) / 2);
          /*const x = workArea.x + workArea.width - width;
          let y = 0

          if (isMac) {
            y = workArea.y;
          } else {
            y = workArea.y + workArea.height - height;
          }*/

          if (!(settings_opened)) {
            let win_settings = new BrowserWindow({
              //modal: modal,
              autoHideMenuBar: true,
              skipTaskbar: true,
              modal: true,
              icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
              title: '⚙️  ' + i18n.__('preferences'),
              width: width,
              height: height,
              resizable: false,
              minimizable: (isMac) ? false : true,
              maximizable: (isMac) ? false : true,
              fullScreenable: (isMac) ? false : true,
              parent: win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window,
              x: x,
              y: y
              //useContentSize: true
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
              win_settings.webContents.executeJavaScript(`setIcon('${original_icon.toDataURL()}')`);
            });


            // save app name title
            win_settings.on('page-title-updated', function(e) {
              e.preventDefault()
            });

            win_settings.once('ready-to-show', () => {
              if (isMac) {
                win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.show();
                app.dock.show();
              }
              localize(win_settings);
              win_settings.show();
              settings_opened = true;
              getSettings(win_settings, flag);
              win_settings.webContents.on('console-message', (event, level, message, line, sourceId) => {
                if (JSON.parse(message).action === 'save_settings') {
                  setSettings(message, win_settings);
                }
                if (JSON.parse(message).action === 'show_message_example') {
                  let data = {
                    title: i18n.__("notification_ex_title"),
                    body: i18n.__("notification_ex_body")
                    /*,
                                      tag: 86953*/
                  };
                  createNotification(data, JSON.parse(message).position, true, win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].index, `${store.get('current_login')}:${store.get('server_url')}`);
                }
                if (JSON.parse(message).action === 'open_config_file') {
                  writeLog(`Opening config.json file in ${app.getPath('userData')}`);
                  openFile(path.join(app.getPath('userData'), 'config.json'));
                }
                if (JSON.parse(message).action === 'open_nofification_settings') {
                  writeLog(`Opening extra notification settings in NC`);
                  //win_settings.close();
                  openPopup(store.get('server_url')+'/settings/user/notifications', win_settings/*win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window*/);
                }
              });
            });

            win_settings.on('closed', function(e) {
              settings_opened = false;
              if (flag) {
                restartApp();
              }
              // to make sure all notification examples are closed
              DismissAllNoti();
            });


            //win_settings.webContents.openDevTools()
          }
        }

        async function checkAuth(win, saved_password, server_url) {
          ses = win.webContents.session;
          try {

            const testResponse = await jsonRequest({
              url: `${server_url}/ocs/v1.php/cloud/user`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${saved_password}`,
                'OCS-APIRequest': 'true',
                'Accept-Language': `${store.get('locale')}`
              }
            });

            /*statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            headers: response.headers,
             jsonData*/

            //writeLog(testResponse.statusCode,true);
            //return 0;
            //writeLog(testResponse.status)

            if (testResponse.statusCode !== 200) {
              writeLog("Token is not found, invalid, expired or revoked. Switch to another configured server")
              // set the first server_url from config if any
              getConfiguredAccounts(true);
              return false;
            } else {
              return ses;
            }
          } catch (error) {
            writeLog(error);
            if (error.code === 'PROXY_AUTH_FAILED') {
              // ...
              // global session interception is not applicatable
              // try to Custom Fetch Wrapper (solution 2)
              win.loadURL("about:blank"); // Fallback to a blank page
            }
            /*win.webContents.executeJavaScript(`
              // Create a styled error container
              const errorContainer = document.createElement('div');
              errorContainer.style.position = 'fixed';
              errorContainer.style.top = '0';
              errorContainer.style.left = '0';
              errorContainer.style.height = '100%';
              errorContainer.style.backgroundColor = 'rgba(0,0,0, 0.8);';
              errorContainer.style.color = 'white';
              errorContainer.style.display = 'flex';
              errorContainer.style.justifyContent = 'center';
              errorContainer.style.alignItems = 'center';
              errorContainer.style.zIndex = '9999';
              errorContainer.style.fontSize = '20px';
              errorContainer.style.textAlign = 'center';
              errorContainer.style.padding = '20px';
              errorContainer.textContent = '${i18n.__('error')}: ${error.message}';

              document.body.appendChild(errorContainer);
            `);*/
            return false;
          }
        }

        async function tryLogin(ses, win, saved_password, server_url) {
          const serverUrl = server_url;
          const apiUrl = `${serverUrl}/ocs/v1.php/cloud/user`;

          let result = null;

          try {
            result = await jsonRequest({
              url: apiUrl,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${saved_password}`,
                'OCS-APIRequest': 'true',
                'Accept': 'application/json',
                'Accept-Language': `${store.get('locale')}`
              }
            });

            //writeLog(`User info response status: ${result.statusCode}`);

            if (!result || result.statusCode < 200 || result.statusCode >= 400) {
              writeLog(`Authentication failed: ${result?.statusCode} ${result?.jsonData?.ocs?.meta?.message || ''}`, true);
              return;
            }

            if (!result?.jsonData?.ocs?.data?.id) {
              writeLog('Authentication succeeded but no user data returned', true);
              return;
            }


            writeLog(`Authenticated as user: ${result.jsonData.ocs.data.id}`);

          } catch (err) {
            writeLog(`Authentication request failed: ${err.message}`);

            // Покажем, если пришёл HTML вместо JSON
            if (err.message.includes('Received HTML instead of JSON') || err.message.includes('Unexpected token \'<\'')) {
              writeLog('⚠️  Received HTML page — likely proxy login, SSL warning, or Nextcloud login form', true);
            }
            return;
          }


          const cookiesHeader = result.headers['set-cookie'];

          if (Array.isArray(cookiesHeader)) {
            for (const rawCookie of cookiesHeader) {
              const cookie = parseCookieString(rawCookie, serverUrl);
              if (!cookie) continue;

              cookie.name = cookie.name.replace(/^__(Secure|Host)-/, '');

              try {
                await ses.cookies.set(cookie);
                //writeLog(`✅ Cookie set: ${cookie.name} = ${cookie.value}`);
              } catch (err) {
                writeLog(`❌ Failed to set cookie "${cookie.name}": ${err.message}`);
              }
            }
          } else if (cookiesHeader && typeof cookiesHeader === 'string') {
            const cookie = parseCookieString(cookiesHeader, serverUrl);
            if (cookie) {
              cookie.name = cookie.name.replace(/^__(Secure|Host)-/, '');
              try {
                await ses.cookies.set(cookie);
                //writeLog(`✅ Cookie set: ${cookie.name} = ${cookie.value}`);
              } catch (err) {
                writeLog(`❌ Failed to set cookie: ${err.message}`);
              }
            }
          }

          if (proxyUrl) {
            loadURLWithProxy(win, serverUrl, proxyAgent);
          } else {
            win.loadURL(serverUrl);
          }
        }

        async function openClientAuth(win, server_address) {
          // force unread counter recalc
          win.webContents.executeJavaScript(`
          setTimeout(function() {
            // check localStorage to drop unread counter
            localStorage.clear();
            recalc_counters_summary ();
          }, 2000);
        `);
          // force logged out
          //mainMenuTemplate[0].submenu[3].label = '👤  ' + i18n.__('logged_out')
          //mainMenuTemplate[0].submenu[3].enabled = false;
          //MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
          //Menu.setApplicationMenu(MainMenu);

          //appIconMenuTemplate[8].label = '👤  ' + i18n.__('logged_out')
          //appIconMenuTemplate[8].enabled = false
          //const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate)
          try {
            appIcon.setContextMenu(contextMenu)
          } catch (err) {
            //writeLog(err)
          }


          return new Promise((resolve) => {
            if (proxyUrl) {
              loadURLWithProxy(win, `${server_address}/index.php/login/flow`, proxyAgent);
            } else {
              win.loadURL(`${server_address}/index.php/login/flow`, {
                userAgent: `NC Talk Electron v. ${app.getVersion()} (${os.hostname()}/${os.platform()} /${os.version()})`,
                extraHeaders: [
                  'OCS-APIRequest: true',
                  `Accept-Language: ${store.get('locale')}`,
                  //`Accept-Language: ${app.getPreferredSystemLanguages().join(',')}`,
                ].join('\n'),
              })
              //loadURLWithProxy(`${store.get('server_url')}/index.php/login/flow`, false);
            }



            // check page loading 
            monitorLoadingStatus(win, server_address);

            // force cookies clear and app restart to supress "Access forbidden State token does not match" error
            win.webContents.session.webRequest.onCompleted((details) => {

              if (details.url.includes('login/flow/grant') && details.statusCode === 403) {
                //writeLog(`403 error detected for URL: ${details.url}. Force clear cookies and app restart! Try again.`);
                dialog.showErrorBox(i18n.__('error'), i18n.__('message11'));

                session.defaultSession.clearStorageData({
                  storages: ['cookies']
                })
                // check already configured account
                if (Object.keys(loginData).length == 0) {
                  restartApp();
                } else {
                  win.close();
                  // use already got server_address instead of url_example
                  //setServerUrl(url_example, true);
                  setServerUrl(server_address, true);
                  /*if (!isForegroundLoading) {
                    
                  } else {
                    dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                  }*/
                }
              }
            });

            win.webContents.on('will-redirect', (event, url) => {

              if (url.startsWith('nc://')) {
                // Stop redirect to nc:// app protocol
                event.preventDefault()


                try {

                  let credentials = parseLoginRedirectUrl(url);
                  resolve(credentials);

                  if (!server_address) {
                    writeLog("server_address is not set");
                    return;
                  }
                  
                  saveCredentials(credentials.user, credentials.password, server_address);
                } catch {
                  resolve(new Error('Unexpected server error'))
                } finally {
                  restartApp();
                }
              }
            })
          })
        }

        function checkExistedSSO() {
          //loginData.accounts.forEach((account, index) => {
          if (Object.keys(loginData).length !== 0) {
            for (let [index, account] of Object.entries(loginData.accounts)) {
              if (account.username == 'auto_login') {
                return true;
              }
            }
            return false;
          } else {
            return false;
          }
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

        function showSources(callback, win) {
          desktopCapturer.getSources({
            types: ['window', 'screen']
          }).then(async sources => {

            let sourcesArray = sources.map(source => ({
              name: source.name,
              id: source.id,
              thumbnail: source?.thumbnail?.resize({
                height: 160
              }).toDataURL()
            }));

            //writeLog(JSON.stringify(sourcesArray));

            /*for (let [key, value] of Object.entries(Object.entries(sources))) {
              console.log(`${key} = ${value}`);
            }*/

            //writeLog(JSON.stringify(selectOptions));
            let width = 500;
            let height = 600;

            const bounds = store.get('bounds');

            const x = Math.round(bounds.x + (bounds.width - width) / 2);
            const y = Math.round(bounds.y + (bounds.height - height) / 2);

            // custom media source picker

            let win_picker = new BrowserWindow({
              width: width,
              minWidth: 300,
              height: height,
              minHeight: 200,
              resizable: true,
              minimizable: (isMac) ? false : true,
              maximizable: (isMac) ? false : true,
              fullScreenable: (isMac) ? false : true,
              modal: true,
              icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
              title: '🔴 🎥  ' + i18n.__('title5'),
              parent: win,
              x: x,
              y: y,
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

              win_picker.setPosition(Math.floor(store.get('bounds').x + (store.get('bounds').width - win_picker.getBounds().width) / 2), Math.floor(store.get('bounds').y + (store.get('bounds').height - win_picker.getBounds().height) / 2));

              win_picker.show();

              win_picker.webContents.executeJavaScript(`showSources(` + JSON.stringify(sourcesArray) + `,'` + theme + `');`);

              win_picker.webContents.on('console-message', (event, level, message, line, sourceId) => {
                try {
                  if (JSON.parse(message).action === 'media_picked') {
                    callback({
                      video: sources.find(media => media.id === JSON.parse(message).media_id)
                    })
                    win_picker.destroy();
                  }
                  if (JSON.parse(message).action === 'media_picker_quit') {
                    win_picker.close();
                  }
                } catch (err) {
                  wrireLog(err)
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
              icon: trayIcon[`${store.get('current_login')}:${store.get('server_url')}`],
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
              dialog.showErrorBox(i18n.__('error'), i18n.__("more")+":"+JSON.stringify(err));
            });*/
          })
        }

        function checkAppArmorStatus() {
          return new Promise((resolve) => {
            const child = spawn('aa-status', ['--enabled']);
            child.on('close', (code) => {
              resolve(code === 0); // 0 means enabled
            });
          });
        }

        // monitor loading with 10 sec timeout
        function monitorLoadingStatus(win, server_address, timeout = 10000) {
          const startTime = Date.now();

          // Start monitoring the loading status every second
          const intervalId = setInterval(() => {
            if (win && !win.isDestroyed()) {
              isLoading = win.webContents.isLoading();

              if (!isLoading) {
                //writeLog("Page has finished loading.");
                clearInterval(intervalId); // Stop monitoring once the page is loaded
              } else {

                const elapsedTime = Date.now() - startTime;

                //writeLog(`Page is still loading... Elapsed time: ${elapsedTime} ms`);

                // If the timeout is reached, handle the timeout scenario
                if (elapsedTime >= timeout) {
                  writeLog(`Timeout: Page ${server_address} failed to load within ${timeout/1000} seconds.`);
                  clearInterval(intervalId);
                  if (win && !win.isDestroyed()) {
                    // Optionally reload the page or show an error message
                    /*dialog.showErrorBox(
                      "Error",
                      "The page failed to load. Please check your internet connection or try again later."
                    );*/
                    dialog.showErrorBox(i18n.__('error'),i18n.__('message1', {
                        server_url: server_address
                      }));
                    win.close();
                    isLoading = false;

                    //win.loadURL("about:blank"); // Fallback to a blank page
                  }
                }
              }
            } else {
              writeLog("Window is destroyed or invalid. Stopping the monitor.");
              clearInterval(intervalId);
            }
          }, 1000); // Check every 1 second
        }

        function openPopup(url, win) {
          try {
            if (win_popup) {
              //return;
              // to force close win_popup before open new - prevent multiple popup windows
              win_popup.close();
            }
          } catch (e) {
            writeLog(e)
          }


          // disallow main win to be closed for macos
          /*if (isMac) {
             win.setClosable(false);
          }*/
          // check for cloud profile link
          let allow_navi = false;
          if (url.includes('/settings/')) {
            title = '⚙️  ' + i18n.__("user_settings") + " - " + store.get('server_url');
            allow_navi = true;
          } else if (url.includes('/u/')) {
            allow_navi = true;
            title = i18n.__("profile") + " - " + store.get('server_url')
          } else {
            title = '?  ' + i18n.__("help") + " - " + store.get('server_url')
          }


          let bounds = undefined;

          // fix of y bound offset + 28px during account switch for linux (?)

          let height = store.get('bounds').height;
          if (isLinux) {

            //bounds = screen.getDisplayMatching(store.get('bounds')).bounds;
            let workArea = screen.getDisplayMatching(store.get('bounds')).workArea;

            if (parseInt(workArea.height) - parseInt(height) - 28 <= 0) {
              height -= 2;
            }
            bounds = {x: store.get('bounds').x, y: store.get('bounds').y-28, width: store.get('bounds').width, height: height}
          } else {
            bounds = store.get('bounds');
          }
          win_popup = new BrowserWindow({
            modal: !isMac,
            icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
            title: title,
            parent: !isMac ? win : null,
            minimizable: (isMac) ? false : true,
            maximizable: (isMac) ? false : true,
            fullScreenable: (isMac) ? false : true,
            width: bounds.width,
            height: bounds.height,
            x: bounds.x,
            y: bounds.y,
            webPreferences: {
              partition: `persist:window-${store.get('current_login')}:${store.get('server_url')}`
            }
          })


          var theUrl = url;

          // show loading


          //win_popup.loadFile('loading.html');

          /*win_popup.webContents.executeJavaScript(`
                  const title = document.getElementById('loading-state-title');
                  title.textContent = '${i18n.__("loading")}';
                `);*/

          setTimeout(() => {
            win_popup.loadURL(theUrl);
          }, 500);

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

          // allow main win to be closed for macos
          /*if (isMac) {
             win_popup.on('closed', function() {
                win.setClosable(true);
             });
          }*/

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

          win_popup.webContents.setWindowOpenHandler(({
            url
          }) => {
            shell.openExternal(url);
            return {
              action: 'deny'
            };
          })


          // prevent navigation away from help pages
          win_popup.webContents.on('will-navigate', (event, redirectUrl) => {

            if (!(allow_navi)) {
              // check for nextcloud help urls
              if (!(redirectUrl.includes('docs.nextcloud.com'))) {
                event.preventDefault();
              }
            }
          });
          //win_popup.webContents.openDevTools()
        }

        function refreshBadge(win, account, theURL) {
          createBadge(unread[`${account}:${theURL}`], "tray", win, account, theURL);
          createBadge(unread[`${account}:${theURL}`], "taskbar", win, account, theURL);
          if (isMac) {
            addBadgeMac();
          }

        }

        // function to create badge img buffer 16x16
        async function createBadge(unread, purpose, win, account, theURL) {
            if ((purpose == "taskbar") || (purpose == "tray")) {
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

              var font_size = "60"
            }

            // tray icon title

            if (unread) {
              appIcon.setToolTip(app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread);
              win.setTitle(src_title[win.id] + " - " +app.getName() + " v." + app.getVersion() + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread)
            } else {
              appIcon.setToolTip(app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL);
              win.setTitle(src_title[win.id] + " - " +app.getName() + " v." + app.getVersion() + " - " + theURL)
            }

            if (store.get('sum_unread')) {
              unread = sumUnreadCounters();
            }

            if (unread >= 100) {
              unread = '∞'
              font_size = "90"
            }
            // colored text
            let font_family = !isLinux ? "system-ui, -apple-system, 'Segoe UI', Roboto, Oxygen-Sans, Cantarell, Ubuntu, 'Helvetica Neue', 'Noto Sans', 'Liberation Sans', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'" : "Noto Sans"
            var SVGtext = `<text style="fill: ` + text_color + `; stroke: ` + text_color + `; /*stroke-width:3*/" font-family="` + font_family + `" font-size="` + font_size + `" text-anchor="middle" x="41" y="63" >` + unread + `</text>`
            // transparent text
            //var SVGtext = `<mask id="clip"><rect width="100%" height="100%" fill="`+text_color+`"/><text font-size="`+font_size+`" font-weight="bold" text-anchor="middle" x="40" y="65">`+unread+`</text></mask>`


            // for colored text
            //var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82"><circle cx="41" cy="41" r="40.5" fill="` + badge_color + `" />` + SVGtext + `</svg>`;
            var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82">
              <circle cx="41" cy="41" r="41" fill="${badge_color}" />
              <circle cx="41" cy="41" r="41" fill="none" stroke="${text_color}" stroke-width="5" />
              ${SVGtext}
            </svg>`;

            // for transparent text
            //var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82"><circle  cx="41" cy="41" r="40.5" fill="`+text_color+`" /><circle mask="url(#clip)" stroke-width="2" style="stroke:`+badge_color+`;" cx="41" cy="41" r="40.5" fill="`+badge_color+`" />`+SVGtext+`</svg>`

            //var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82"><circle mask="url(#clip)" stroke-width="2" style="stroke:`+text_color+`;" cx="41" cy="41" r="40.5" fill="`+badge_color+`" />`+SVGtext+`</svg>`

            convertIcon(badge, unread, purpose, win, account, theURL)
        }

        async function normalizeIcon(wideIcon, size = 128) {
          try {
            // If wideIcon is a Buffer or file path, process it
            let image = sharp(wideIcon);
            
            // Get original dimensions
            const metadata = await image.metadata();
            const { width, height } = metadata;
            
            // Calculate the square size (use the larger dimension to maintain quality)
            const maxSize = Math.max(width, height);
            const targetSize = Math.max(maxSize, size);
            
            // Resize to fit within square bounds while maintaining aspect ratio
            image = image.resize(targetSize, targetSize, {
              fit: 'contain',
              position: 'center',
              background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            });
            
            // Extract the resized image buffer
            const resizedBuffer = await image.toBuffer();
            
            // Create a true square by extending/cropping as needed
            const squareImage = sharp(resizedBuffer);
            const finalBuffer = await squareImage
              .resize(size, size, {
                fit: 'cover', // or 'contain' depending on your preference
                position: 'center'
              })
              .toBuffer();
            
            return finalBuffer;
          } catch (error) {
            writeLog(`Error creating square icon: ${error}`);
            throw error;
          }
        }

        // convert icon to B&W
        async function bw_icon_process(icon) {

          if (theme == 'dark') {
            var linear = 3 // for white color
          } else {
            var linear = 0 // for black color
          }
          var newImage = await sharp(icon.toPNG()).greyscale().linear(linear, 0).png({
            colors: 2
          }).toBuffer();

          return nativeImage.createFromBuffer(newImage);
        }

        // Utility function to convert base64 image to buffer
        function base64ToBuffer(base64String) {
          const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
          return Buffer.from(base64Data, 'base64');
        }

        async function convertIcon(badge, unread, purpose, win, account, theURL) {
          try {
            // check current win foreground status
            //writeLog(`This ${purpose} icon of ${account}:${theURL} will get ${unread} of unread counter`, true)
            if (purpose == "tray") {

              if (!store.get('use_server_icon')) {
                if (isMac) {
                  trayIcon[`${account}:${theURL}`] = icon_bw['original_icon'];
                } else {
                  trayIcon[`${account}:${theURL}`] = trayIcon['original_icon'];
                }
              }

              let newImage = await sharp(trayIcon[`${account}:${theURL}`].toPNG()).toBuffer();
              newImage = await sharp(newImage).resize(120, 120).toBuffer();
              newImage = await sharp(newImage).composite([{
                input: Buffer.from(badge),
                top: 35,
                left: 35,
                blend: 'over'
              }]).toBuffer();

              if (unread) {
                trayIcon[`${account}:${theURL}`] = nativeImage.createFromBuffer(newImage);
              }

              if ((store.get('current_login') == account) && (store.get('server_url') == theURL)) {
                if (isMac) {
                  appIcon.setImage(trayIcon[`${store.get('current_login')}:${store.get('server_url')}`].resize({width: 16}));
                } else {
                  appIcon.setImage(trayIcon[`${store.get('current_login')}:${store.get('server_url')}`]);
                }
              } else {
                refreshBadge(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, store.get('current_login'), store.get('server_url'));
              }

              // set linux taskbar image same as tray
              /*if (isLinux) {
                win.setIcon(trayIcon[account_string])
              }*/

              return;
            }

            if (purpose == "taskbar") {
              //  windows the icon to display on the bottom right corner of the taskbar icon
              if (unread) {
                let newImage = await sharp(Buffer.from(badge)).toBuffer();
                win.setOverlayIcon(nativeImage.createFromBuffer(newImage), i18n.__('unread_messages') + ": " + unread);
              } else {
                win.setOverlayIcon(null, '');
              }

              return;
            }
          }
          catch (err) {
            writeLog(`Error during convertIcon: ${err}`)
          }
        }

        function createNotification(data, position, demo, win, win_index, account_string) {
          if (store.get("notification_timeout_checkbox") || demo) {

            const width = 360
            const height = 200
            // Get the display that contains the main window
            //const { bounds, workArea } = screen.getPrimaryDisplay();
            const {
              bounds,
              workArea
            } = screen.getDisplayMatching(store.get('bounds'));
            let x = 0;
            let y = 0;

            if (!position) {
              position = store.get("notification_position")
            } else {
              // force close all other notification examples
              DismissAllNoti();
            }

            if (position == 'top-left') {
              x = workArea.x;
              y = workArea.y + 5;
            } else if (position == 'top-right') {
              x = workArea.x + workArea.width - width;
              y = workArea.y + 5;
            } else if (position == 'bottom-left') {
              x = workArea.x;
              y = workArea.y + workArea.height - height - 5;
            } else if (position == 'bottom-right') {
              x = workArea.x + workArea.width - width;
              y = workArea.y + workArea.height - height - 5;
            }

            /*if (!isMac) {
              y = workArea.y;
            } else {
              y = workArea.y + workArea.height - height;
            }*/

            let win_noti = new BrowserWindow({
              //modal: isMac,
              modal: true,
              icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
              title: data.title,
              // macOS & Windows 10/11 only
              //vibrancy: 'fullscreen-ui',    // on MacOS
              //backgroundMaterial: 'acrylic', // on Windows 11
              //titleBarStyle: 'hidden',
              frame: false,
              show: false, // test in non-macos
              width: width,
              height: height,
              resizable: false,
              movable: false,
              transparent: true,
              x: x,
              y: y,
              alwaysOnTop: !isLinux, // Optional: keep on top
              focusable: !isLinux,
              hasShadow: false,
              skipTaskbar: true, // Optional: don't show in taskbar
              autoHideMenuBar: true,
              webPreferences: {
                //devTools: true,
                //sandbox: false,
                contextIsolation: true
              }
            })

            //win_noti.setAlwaysOnTop(true, 'floating');
            //win_noti.setVisibleOnAllWorkspaces(true);

            win_noti.loadFile("notification.html");
            win_noti.setMenu(null);

            //writeLog("This notification win id is: "+win_noti.id);
            notificationWindowsIds.push(win_noti.id.toString());
            notificationWindows.push(win_noti);

            win_noti.on('ready-to-show', () => {
              win_noti.showInactive();
              //win_noti.blur();
            })

            win_noti.webContents.on('did-finish-load', () => {
              win_noti.webContents.insertCSS(`
                * {
                  font-family: 'Arial', sans-serif !important;
                }
              `);

              win.webContents.executeJavaScript(`get_Notifications(${data.tag});`);
              //setTimeout(() => {
                if (notification_type[account_string] == 'call') {
                  notification_message_link[account_string] += '#direct-call';
                }
                if (!notification_message_icon[account_string]) {
                  notification_message_icon[account_string] = '';
                }
                let server_icon = undefined;
                if (isMac) {
                  server_icon = (dockIcon[account_string]) ? dockIcon[account_string] : dockIcon['original_icon'];
                } else {
                  server_icon = (original_server_icon[account_string]) ? original_server_icon[account_string] : original_icon;
                }

                // temp server_color set
                let server_color = undefined;
                if (store.get('use_server_theme')) {
                  server_color = win_main.id[account_string].server_color;
                }

                // check if win_main is in not hidden, minimized, unfocused or notification_type is call
                if (!win.isVisible() || win.isMinimized() || !win.isFocused() ||(notification_type[account_string] == 'call')) {
                  win_noti.webContents.executeJavaScript(`showCustomNotification('${win_noti.id}', '${JSON.stringify(data)}', '${i18n.__('dismiss')}', '${i18n.__('dismiss_all')}', '${i18n.__('dismiss_all_title')}', '${i18n.__('open')}', '${i18n.__('open_title')}', '${theme}', '${server_icon.toDataURL()}', '${notification_message_icon[account_string]}', '${position}', '${win_index}', '${account_string}', '${server_color}','${notification_type[account_string]}')`);

                  win_noti.webContents.executeJavaScript(`updateDismissTimeout(0)`);
                  win_noti.webContents.executeJavaScript(`updateDismissAllButton ('${notificationWindows.length}')`);

                  checkInactivityInterval[win_noti.id] = setInterval(function() {
                    checkNotiInactivity(win_noti, 1);
                  }, 1000);
                  
                  // to avoid false activity in linux after 5 seconds of showed notification
                  if (isLinux) {
                    delayedIdleTime[win_noti.id] = 5;
                    setTimeout(()=>{
                      delayedIdleTimeInterval[win_noti.id] = setInterval(function() {
                        delayedIdleTime[win_noti.id] = delayedNotiActivityCheck();
                      }, 1000);
                    }, 6000)
                  }
                  
                  // cleanup avatar after notification apper
                  notification_message_icon[account_string] = '';
                  notification_type[account_string] = '';
                }
              //}, 1000);


            })

            win_noti.webContents.on('console-message', (event, level, message, line, sourceId) => {
              // open message from notify process
              if (JSON.parse(message).action.open_message) {
                //writeLog("Notify #"+JSON.parse(message).action.open_message+" is clicked")
                //setTimeout(function() {
                  win.webContents.executeJavaScript(`open_message("${notification_message_link[account_string]}");`);
                  // force close other call dialogs if answer current call
                  for (const [key, value] of Object.entries(controller)) {
                    //writeLog(`Force close call from: ${call[key].displayName}`)
                    value.abort();
                    delete value[key];
                  }
                  if (!win.isVisible() || win.isMinimized() /*|| !win.isFocused()*/ ) {
                    // force hide all other windows for case of foreground win noti click
                    //loginData.accounts.forEach((account, index) => {
                    for (let [index, account] of Object.entries(loginData.accounts)) {
                      //index += 1;
                      index++;
                      //writeLog(`Compare acc index ${index} with sender noti win index ${win_index}`)
                      if (index != win_index) {
                        win_main.id[`${account.username}:${account.url}`].window.hide();
                      } else {

                        MainMenu.getMenuItemById(`show-${store.get('current_login')}:${store.get('server_url')}`).checked = false;
                        win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true
                        win_main.id[`${account.username}:${account.url}`].window.show();
                        win_main.id[`${account.username}:${account.url}`].isForeground = false;

                        store.set('current_login', account.username);
                        store.set('server_url', account.url);

                        MainMenu.getMenuItemById(`show-${account.username}:${account.url}`).checked = true;
                      }
                    }
                  }
                //}, 1000);
              }

              // dismiss button process
              if (JSON.parse(message).action.dismissed) {

                //writeLog("Notify window with id "+JSON.parse(message).action.dismissed+" is dismissed")
                let index = notificationWindowsIds.indexOf(JSON.parse(message).action.dismissed)

                if (index !== -1) {
                  notificationWindowsIds.splice(index, 1)
                  notificationWindows.splice(index, 1)
                }
                dismissed[win_noti.id] = false;
                clearTimeout(checkInactivityInterval[win_noti.id]);
                clearTimeout(delayedIdleTimeInterval[win_noti.id]);
                delayedIdleTime[win_noti.id] = 5;

                // to remove all dismissed_all buttons in case of there is only one notification remain
                notificationWindows.forEach((noti_win) => {
                  try {
                    noti_win.webContents.executeJavaScript(`updateDismissAllButton ('` + notificationWindows.length + `')`);
                  } catch (err) {
                    //writeLog(err)
                  }
                });
              }

              // force counter on noti mouse hover leave
              if (JSON.parse(message).action == "mouse_leave") {
                clearTimeout(delayedIdleTimeInterval[win_noti.id]);
                delayedIdleTime[win_noti.id] = 5;
                win_noti.webContents.executeJavaScript(`updateDismissTimeout(10,${win_noti.id})`);
                dismissed[win_noti.id] = true;
              }

              // dismiss all button process
              if (JSON.parse(message).action == "dismissed_all") {
                DismissAllNoti();
                
              }
            })

            //win_noti.webContents.openDevTools()
          } else {
            writeLog(`Got notification ${data.tag} but notifications are turned off by user.`)
          }
        }

        function DismissAllNoti() {
          notificationWindows.forEach((noti_win) => {
            try {
              noti_win.webContents.executeJavaScript(`slideAway('` + noti_win.id + `');`);
              clearTimeout(checkInactivityInterval[win_noti.id]);
              clearTimeout(delayedIdleTimeInterval[win_noti.id]);
              dismissed[noti_win.id] = false;
              delayedIdleTime[win_noti.id] = 5;
            } catch (err) {
              //writeLog(err)
            }
          });

          notificationWindows.length = 0
          notificationWindowsIds = [];

          //writeLog("All notify windows are dismissed")
        }

        async function UnreadTray(account,theURL,isForeground,win) {

          /*if (!store.get('sum_unread')) {
            writeLog("Found " + unread[`${account}:${theURL}`] +" messages at "+theURL+" account "+account);
          } else {
            writeLog("Summary of unread is " + sumUnreadCounters() +" messages");
          }*/

          if ((unread[`${account}:${theURL}`] == 0) || (unread[`${account}:${theURL}`] == undefined) || (sumUnreadCounters() == 0)) {
            //writeLog(isForeground);
            if (isMac) {
              icon_bw[`${account}:${theURL}`] = (store.get('use_server_icon')) ? original_server_icon[`${account}:${theURL}`] : icon_bw['original_icon'];
              trayIcon[`${account}:${theURL}`] = icon_bw[`${account}:${theURL}`];
            } else {
              trayIcon[`${account}:${theURL}`] = (store.get('use_server_icon')) ? original_server_icon[`${account}:${theURL}`] : original_icon;
            }

            win.flashFrame(false);
            win.setOverlayIcon(null, '');
            // tray icon badge
            //appIcon.setToolTip(app.getName() + " v." + app.getVersion() + " - " + store.get('server_url'));
          } else {
            //is_notification = true;
            
            clearTimeout(debounce);
            if (store.get('show_on_new_message')) {
              if (unread_prev[`${account}:${theURL}`] != unread[`${account}:${theURL}`]) {
                // check if win_main is in not hidden of minimized
                if (!win.isVisible() || win.isMinimized() /*|| !win.isFocused()*/ ) {
                  // force dismiss all notifications when show_on_new_message is true and is fired
                  DismissAllNoti();
                  //dismissed[win_noti.id] = false;
                  // bounce 1s to prevent config bounds save loop
                  debounce = setTimeout(function() {
                    // do all multiple win stuff before show
                    win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
                    MainMenu.getMenuItemById(`show-${store.get('current_login')}:${store.get('server_url')}`).checked = false;
                    win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true

                    win.show();
                    win.isForeground = false;

                    store.set('current_login', account);
                    store.set('server_url', theURL);

                    MainMenu.getMenuItemById(`show-${account}:${theURL}`).checked = true;
                  
                    if (isMac) app.dock.show();
                    // open corresponding message
                    //writeLog(message_link)
                    setTimeout(function() {
                      //writeLog(message_link[`${account}:${theURL}`])
                      win.webContents.executeJavaScript(`open_message("` + message_link[`${account}:${theURL}`] + `");`);
                    }, 3000);
                  }, 1000);
                }
              }
            }
            if (/*(!removed) && */(!win.isFocused())) {
              if (unread_prev[`${account}:${theURL}`] != unread[`${account}:${theURL}`]) {
                win.flashFrame(true);
              }
            }
          }
          refreshBadge(win, account, theURL)
        }

        async function createWindow(theURL, account, isForeground, index, add) {

          //let win_foreground = null;
          let blockAuthCall = false;

          session.defaultSession.allowNTLMCredentialsForDomains(store.get('allow_domain'));

          // Create the browser window.
          if (Object.keys(loginData).length !== 0) {

            if (index !== undefined) {
              //loginData.accounts.forEach((account_logindata, account_index) => {
              for (let [account_index, account_logindata] of Object.entries(loginData.accounts)) {
                // change index to 1-based
                //account_index += 1
                account_index++;
                if ((account_logindata.url == theURL) && (account_logindata.username == account)) {
                  index = account_index;
                }
              }
            } else {
              index = false;
            }
          } else {
            index = false;
          }
          

          win_main.id[`${account}:${theURL}`] = {
            window: new BrowserWindow({
              title: app.getName() + " v." + app.getVersion() + " - " + theURL,
              center: true,
              autoHideMenuBar: add,
              //skipTaskbar: isForeground,
              //show: store.get('start_hidden') ? !JSON.parse(store.get('start_hidden')) : true,
              show: false,
              //modal: isForeground,
              //parent: (isForeground) ? win_main[`${store.get('current_login')}:${store.get('server_url')}:false`] : null,
              resizable: !add,
              movable: !add,
              minimizable: (isMac || add) ? false : true,
              maximizable: (isWindows) ? false : true, // cause glitched fullscreen in Windows, so disable maximizable for now
              fullScreenable: false, // to prevent issues, in macos mainly
              minWidth: 512, // temporary restrict min window width by 512px,
              // see issues https://github.com/nextcloud/spreed/issues/12236
              // https://github.com/nextcloud/spreed/issues/11454
              icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
              useContentSize: true,
              webPreferences: {
                partition: `persist:window-${account}:${theURL}`,
                enableRemoteModule: true,
                backgroundThrottling: false,
                //preload: !isForeground ? path.join(__dirname, 'preload.js'): null,
                preload: !add ? path.join(__dirname, 'preload.js') : null,
                additionalArguments: (store.get("notification_sys_checkbox")) ? ['--isSysNotiEnabled'] : null,
                notifications: {
                  show: store.get("notification_sys_checkbox")
                },
                /*contextIsolation: true, // for media_picker
                nodeIntegration: false, // for media_picker
                webSecurity: true,*/
                contextIsolation: false,
                nodeIntegration: true,
              }
            }),
            isForeground: isForeground,
            index: index,
            server_color: undefined
          }

          // set always on top
          if (store.get('always_on_top')) {
            win_main.id[`${account}:${theURL}`].window.setAlwaysOnTop(true, 'floating', 1);
          }

          win_main.id[`${account}:${theURL}`].window.setBounds(store.get('bounds'));

          // hanlde open external links in system browser
          win_main.id[`${account}:${theURL}`].window.webContents.setWindowOpenHandler(({
            url
          }) => {
            shell.openExternal(url);
            return {
              action: 'deny'
            };
          });


          // implement html screen source picker

          //session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
          win_main.id[`${account}:${theURL}`].window.webContents.session.setDisplayMediaRequestHandler(async (request, callback) => {
            showSources(callback, win_main.id[`${account}:${theURL}`].window);
          })


          let authenticated = false;

          let ses = undefined;

          // check if there is system proxy configured

          await getProxyInfo(theURL);

          if (proxyAgent) {
            if (!proxyAgent.proxy.auth) {
              writeLog("No saved login or password. Trying to use proxy anonymously...")
            } else {
              writeLog(`Found configured proxy with auth -- ${proxyUrl}. Trying to use it...`)
            }
            //writeLog(`Found configured proxy: ${JSON.stringify(proxyAgent)}`)
          } else {
            writeLog('No system proxy found! Direct connect.')
          }

          // *********** show loading ***********
          isLoading = true;

          // ************ auto_login process check **************
          let auto_login = false;
          try {
            if (account == 'auto_login') {
              auto_login = true;
            }
          } catch (err) {

          }

          if (!account) {
            if (!blockAuthCall) {
              blockAuthCall = true;
              openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
            }
          } else {
            // get saved in keytar creds
            //let savedCreds = await getCredentials();

            if (!auto_login) {
              if (loginData) {
                try {
                    saved_password = await getCredentials(account, theURL);
                    //writeLog(saved_password,true)
                    if (saved_password == null) {
                      writeLog("Not authenticated!");
                      if (!blockAuthCall) {
                        blockAuthCall = true;
                        openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                      }
                    } else {
                      authenticated = await checkAuth(win_main.id[`${account}:${theURL}`].window, saved_password, theURL);

                      if (authenticated) {
                        writeLog("Token is valid. Log in to " + theURL + " with account "+account)
                        tryLogin(authenticated, win_main.id[`${account}:${theURL}`].window, saved_password, theURL)
                      } else {
                        writeLog("Not authenticated!");
                        if (!blockAuthCall) {
                          blockAuthCall = true;
                          openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                        }
                      }
                    }
                } catch (err) {
                  writeLog(err)
                  dialog.showErrorBox(i18n.__('error'), i18n.__('message5'));
                  fs.rmSync(app.getPath('userData'), {
                    recursive: true,
                    force: true
                  });
                  restartApp();
                }
              } else {
                if (!blockAuthCall) {
                  blockAuthCall = true;
                  openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                }
              }
            } else {
              writeLog("Autologin is enabled. Log in using SSO.")
              if (proxyUrl) {
                loadURLWithProxy(win_main.id[`${account}:${theURL}`].window, theURL, proxyAgent)
              } else {
                win_main.id[`${account}:${theURL}`].window.loadURL(theURL)
              }
              //autologin handle in case of proxy connection refuse
              blockAuthCall = true;
            }
          }

          // ************ auto_login process check end **************

          // *********** hide loading ***********
          isLoading = false;

          let activity_check_interval = 5;

          setInterval(function() {
            checkInactivity(activity_check_interval, account, theURL, false)
          }, activity_check_interval * 1000);

          // apply context menus
          // BUG since 19.x Talk version double call ready-to-show
          applyContextMenu(win_main.id[`${account}:${theURL}`].window)

          let lastWebSocketConnectMessage = null;
          let waitingForError = false;
          let trackedWebSocketUrl = null;


          // ************ events block start ******************
          // skip syncBounds and checkMaximize in case of add account
          if (!add) {
            win_main.id[`${account}:${theURL}`].window.on("maximize", event => {
              event.preventDefault();
              checkMaximize(win_main.id[`${account}:${theURL}`].window,true);
              return;
            })

            win_main.id[`${account}:${theURL}`].window.on("unmaximize", event => {
              event.preventDefault();
              checkMaximize(win_main.id[`${account}:${theURL}`].window,true);
              return;
            })

          
          
            win_main.id[`${account}:${theURL}`].window.on("resize", event => {
              clearTimeout(debounce);
              debounce = setTimeout(function() {
                syncBounds();
              }, 200);
            })

            // for linux compatibility change "moved" to "move"
            win_main.id[`${account}:${theURL}`].window.on("move", event => {
              clearTimeout(debounce);
              debounce = setTimeout(function() {
                syncBounds();
              }, 200);
            })
          }


          // Prevent window from closing and quitting app
          // Instead make close simply hide main window
          // Clicking on tray icon will bring back main window
          win_main.id[`${account}:${theURL}`].window.on('close', event => {
            // force show current win in case of started add account sequence
            if (add) {
              if (Object.keys(loginData).length !== 0) {
                win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.show();
                win_main.id[`${account}:${theURL}`].window.destroy();
                // additional cleanup of win_main object from the reference to 
                delete win_main.id[`${account}:${theURL}`];
                return;
              } else {
                app.exit(0);
              }
            }
            event.preventDefault();
            if (isMac) app.dock.hide();
            win_main.id[`${account}:${theURL}`].window.hide();
          })

          win_main.id[`${account}:${theURL}`].window.on('hide', event => {
            syncBounds();
          })


          // Handle incoming notification requests
          ipcMain.on('show-electron-notification', (event, {
            title,
            data,
            options
          }) => { 
            // check muted notifications
            if (store.get('notification_muted')) {
              win_main.id[`${account}:${theURL}`].window.webContents.setAudioMuted(true);
              setTimeout(function() {
                win_main.id[`${account}:${theURL}`].window.webContents.setAudioMuted(false);
              }, 6000); // 6s to prevent call sound
            }

            // debounce 1s to avoid double call notification
            //clearTimeout(debounce);
            //debounce = setTimeout(function() {
              // to filter other then event sender windows, check window.webContents.id as ids of event.sender are different then sorted win_main.id array
              //writeLog(win_main.id[`${account}:${theURL}`].window.webContents.id)
              //writeLog(event.sender.id)
              if (win_main.id[`${account}:${theURL}`].window.webContents.id == event.sender.id) {
                createNotification(data, false, false, win_main.id[`${account}:${theURL}`].window, win_main.id[`${account}:${theURL}`].index,`${account}:${theURL}`);
              }
            //}, 1000);
          });



          // save app name title
          //win_main[`${account}:${theURL}:${isForeground}`].on('page-title-updated', function(e,title) {
          win_main.id[`${account}:${theURL}`].window.webContents.on('page-title-updated', function(e,title) {
            // save first part from NC src title 

            const dashIndex = title.indexOf(' - ');

            let index = win_main.id[`${account}:${theURL}`].index
            if (!index) {index = i18n.__('add_account')}
            let prefix = "";
            // don't show [] at all if there is only one account or no accounts
            if (Object.keys(loginData.accounts).length > 1) {
              prefix = "[ " + index + " ] ";
            }
            
            if (dashIndex === -1) {
              // If " - " is not found, return the whole string
              src_title[win_main.id[`${account}:${theURL}`].window.id] = prefix + title;
            } else {
              src_title[win_main.id[`${account}:${theURL}`].window.id] = prefix + title.substring(0, dashIndex);
            }

            e.preventDefault();

            if ((unread[`${account}:${theURL}`] != 0) && (unread[`${account}:${theURL}`] != undefined)) {
              win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread[`${account}:${theURL}`]);
            } else {
              win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL);
            }

          });

          win_main.id[`${account}:${theURL}`].window.on('focus', function() {
            let isFocused = false;
            // check if there are notifications with zero timeout - dismiss them all after 5s
            if (notificationWindows.length > 0) {
              //writeLog("Check notification focus");
              setTimeout(() => {
                // if notifications if in focus
                notificationWindows.forEach((noti_win) => {
                  if (noti_win.isFocused()) {
                    isFocused = true;
                  }
                  //writeLog("notification focused: "+isFocused);
                })

                if (!isFocused) {
                  if ((store.get('notification_timeout')) && (store.get('notification_timeout') == 0)) {
                    DismissAllNoti();
                  } else {
                    //writeLog("Won't autodismiss because there is already timer in notification.")
                  }
                } else {
                  //writeLog("Won't autodismiss because of focused notification.")
                }
              }, 5000)
            }
          })

          win_main.id[`${account}:${theURL}`].window.on('show', function() {

            // force hide current win in case of started add account sequence
            if (add) {
              win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide(); 
            }

            refreshBadge(win_main.id[`${account}:${theURL}`].window, account, theURL)

            if ((unread[`${account}:${theURL}`] == 0) && (unread[`${account}:${theURL}`] === undefined)) {
              win_main.id[`${account}:${theURL}`].window.setOverlayIcon(null, '');
            }
          })

          // some things when window is ready

          win_main.id[`${account}:${theURL}`].window.on('ready-to-show', () => {

            if (!isForeground) {
              if (!store.get('start_hidden')) {
                win_main.id[`${account}:${theURL}`].window.show();
              }
            }

            // initial individual win icons set before check use_server_icon
            dockIcon[`${account}:${theURL}`] = original_icon
            original_server_icon[`${account}:${theURL}`] = original_icon
            trayIcon[`${account}:${theURL}`] = original_icon

            // load icon from server and replace them
            if (store.get('use_server_icon')) {
              // set icon for current account window
              //writeLog(`Lets get ${account}:${theURL} server icon`)
              let icon_url = theURL + "/apps/theming/image/logo";
              const fetchImage = async url => {
                try {
                  const response = await fetch(url);
                  //const response = await jsonRequest(url);
                  const buffer = await response.arrayBuffer();
                  const nodebuffer = Buffer.from(buffer);
                  // add icon normalization in case of non standard icon size
                  let norm_icon = await normalizeIcon(nodebuffer);
                  let icon = nativeImage.createFromBuffer(norm_icon)
                  dockIcon[`${account}:${theURL}`] = icon
                  original_server_icon[`${account}:${theURL}`] = icon;

                  win_main.id[`${account}:${theURL}`].window.setIcon(icon);

                  if (isMac) {
                    icon_bw[`${account}:${theURL}`] = await bw_icon_process(icon);
                    icon_bw[`${account}:${theURL}`] = icon_bw[`${account}:${theURL}`].resize({
                      width: 16
                    });
                    original_server_icon[`${account}:${theURL}`] = icon_bw[`${account}:${theURL}`];
                    trayIcon[`${account}:${theURL}`] = icon_bw[`${account}:${theURL}`]
                    
                    addBadgeMac();
                  } else if (isLinux) {
                    trayIcon[`${account}:${theURL}`] = icon
                  } else if (isWindows){
                    // small 16x16 trayIcon looks better in windows tray
                    trayIcon[`${account}:${theURL}`] = icon.resize({width:16});
                  }

                  if (!isForeground) {
                  //if ((store.get('current_login') == account) && (store.get('server_url') == theURL)) {
                    appIcon.setImage(trayIcon[`${account}:${theURL}`]);
                  }
                }
                catch(err) {
                  writeLog(`Error during use_server_icon fetchImage ${err}`)
                }
              }
              fetchImage(icon_url);
            }

            // hide dock if cur win_main is hidden
            //if ((!win_main.id[`${account}:${theURL}`].window.isVisible()) && (isMac)) app.dock.hide();
            if ((!win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isVisible()) && (isMac)) app.dock.hide();
            // add app styling override
            win_main.id[`${account}:${theURL}`].window.webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8'));

          })

          // fallback if cloud can't be loaded
          // case of proxy auth connection error
          win_main.id[`${account}:${theURL}`].window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {

            writeLog(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
            if (!validatedURL.includes('unsupported?redirect_url')) {
              dialog.showErrorBox(i18n.__('error'),i18n.__('message1', {
                  server_url: server_address
                }));
              win_main.id[`${account}:${theURL}`].window.close();
              //win_main.id[`${account}:${theURL}`].window.loadURL("about:blank"); // Fallback to a blank page
            }
            //win_main.close();
            //appIcon.destroy();
          });

          // check cloud
          win_main.id[`${account}:${theURL}`].window.webContents.on('did-finish-load', function(e) {

            // override fonts to Arial to fix any app startup errors
            win_main.id[`${account}:${theURL}`].window.webContents.insertCSS(`
              * {
                font-family: 'Arial', sans-serif !important;
              }
            `);

            //preventUnsupportedBrowser(win_main);
            // get notification dot status on webContents change
            //win_main.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'notification_observer.js')), true)

            // check nc and talk status and version and run pinger
            if (!add) {
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'nextcloud_check.js')), true)

              // get unread messages count
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'unread_observer.js')), true)

              // get user menu open observe
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'user_menu_observer.js')), true)

              // localize NC user_menu
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`var nc_link_loc = "` + i18n.__("nc_link") + `";`);
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`var user_settings_link_loc = "` + i18n.__("user_settings_link") + `";`);
            } 


            /*setTimeout(() => {
              // set current app language
              win_main.webContents.executeJavaScript(`force_lang('`+store.get('locale')+`','`+saved_password+`');`);
              // set current app theme
              win_main.webContents.executeJavaScript(`force_theme('`+store.get('theme')+`','`+saved_password+`');`);
            }, 1000);*/

            // try autologin in case of SSO enabled
            if (!auto_login_error) {
              // auto_login check
              if (auto_login) {
                //if (store.get('auto_login')) {
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`
                  checkURL(true);
                `);
              } else {
                // check auth
                if (!authenticated) {
                  win_main.id[`${account}:${theURL}`].window.show();
                }
              }
            }
          });

          // proxy callback for remote NC server
          /*win_main.id[`${account}:${theURL}`].window.webContents.on('login', (event, webContents, request, callback) => {
            preventUnsupportedBrowser(win_main);
            writeLog("Remote NC server proxy callback");
            callback(proxyAgent.proxy.auth.split(':')[0], proxyAgent.proxy.auth.split(':')[1]); //supply credentials to remote server
          })*/

          win_main.id[`${account}:${theURL}`].window.webContents.on('console-message', (event, level, message, line, sourceId) => {

            try {
              if (message.includes('Connecting to wss://')) {

                //writeLog('WebSocket connecting...');
                lastWebSocketConnectMessage = message;
                waitingForError = true;


                const urlMatch = message.match(/wss:\/\/[^\s'"]+/);
                if (urlMatch) {
                  trackedWebSocketUrl = urlMatch[0];
                }

              } else if (waitingForError && message.includes('Error [object Event]')) {

                /*writeLog('🎯 WebSocket connection failed!');
                writeLog('URL:'+ trackedWebSocketUrl);
                writeLog('Connect message:'+ lastWebSocketConnectMessage);
                writeLog('Error message:'+ message);*/
                if ((!prompted) && (!(settings_opened))) {
                  const options = {
                    type: 'error',
                    buttons: [i18n.__('save_button'), i18n.__('check_preferences')],
                    defaultId: 1,
                    title: i18n.__('error'),
                    //icon:icon,
                    message: i18n.__('message16'),
                    //detail: i18n.__('message16'),
                  };
                  prompted = true;
                  dialog.showMessageBox(win_main.id[`${account}:${theURL}`].window, options).then((result) => {
                    if (result.response === 1) {
                      openSettings(false, true);
                      // don't show until app restart
                      //prompted = false;
                    }
                  });
                }

                waitingForError = false;
                lastWebSocketConnectMessage = null;
                trackedWebSocketUrl = null;

              }

              if (JSON.parse(message).action.unread || (JSON.parse(message).action.unread === 0)) {
                /*writeLog(JSON.parse(message).action.unread)

                if (unread[`${account}:${theURL}:${isForeground}`] == JSON.parse(message).action.unread) {
                  return;
                }*/

                if (unread_prev[`${account}:${theURL}`] == unread[`${account}:${theURL}`]) {
                  unread[`${account}:${theURL}`] = JSON.parse(message).action.unread
                } else {
                  if (unread[`${account}:${theURL}`] !== false) {
                    unread_prev[`${account}:${theURL}`] = unread[`${account}:${theURL}`];
                  }
                }

                //removed = JSON.parse(message).action.removed
                //UnreadTray(unread[`${account}:${theURL}:${isForeground}`], removed, win_main[`${account}:${theURL}:${isForeground}`]);
                UnreadTray(account,theURL,isForeground, win_main.id[`${account}:${theURL}`].window);
                unread_prev[`${account}:${theURL}`] = unread[`${account}:${theURL}`]

                // update title with unread on load
                if (unread[`${account}:${theURL}`] != 0) {
                  // set linux taskbar image same as tray
                  /*if (isLinux) {
                    win_main.id[`${account}:${theURL}`].window.setIcon(trayIcon[`${account}:${theURL}`])
                  }*/
                  win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread[`${account}:${theURL}`]);
                } else {
                  // set linux taskbar image same as tray
                  /*if (isLinux) {
                    win_main.id[`${account}:${theURL}`].window.setIcon(trayIcon[`${account}:${theURL}`])
                  }*/
                  win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL);
                }
              }

              //get incoming message id
              if (JSON.parse(message).action.token) {
                message = JSON.parse(message)
                message_link[`${account}:${theURL}`] = '/call/' + message.action.token + '#message_' + message.action.id
              }

              // get notification metadata
              if (JSON.parse(message).action.notification) {
                notification_message_link[`${account}:${theURL}`] = JSON.parse(message).action.notification.link
                notification_message_icon[`${account}:${theURL}`] = JSON.parse(message).action.avatar
                notification_type[`${account}:${theURL}`] = JSON.parse(message).action.notification.object_type
              }

              // incoming call process
              // TODO temporary disable this incoming call process to respect notification instead

              /*if (JSON.parse(message).action.call) {
                let token = JSON.parse(message).action.call.token

                call[token] = JSON.parse(message).action.call
                avatar[token] = JSON.parse(message).action.avatar

                // check call status
                //writeLog(call.lastMessage.systemMessage)
                // 5 sec delay
                setTimeout(function() {
                  if (call[token].lastMessage.systemMessage.includes('call_started')) {
                    //writeLog('Started call: '+ call[token].displayName)
                    try {
                      //writeLog('Prev token:' + call_prev[token].token)
                    } catch (err) {
                      //writeLog(err)
                    }



                    if (call_prev[token]) {
                      if (call_prev[token].token == token) {
                        //writeLog('Prev call = current')
                        return;
                      }
                    }
                    //writeLog(controller,true)
                    if (!controller[token]) {
                      controller[token] = new AbortController();
                    }

                    // convert avatar to round shape. used puppeteer to support svg format
                    const avatar_process = async avatar => {
                      let crop = 200; // set crop pixels, bigger value means more crop
                      const browser = await puppeteer.launch();
                      const page = await browser.newPage();
                      // Wrap SVG in a scaling HTML container
                      const htmlContent = `
                        <!DOCTYPE html>
                        <html style="width: ${crop}px; height: ${crop}px; background: transparent;">
                          <body style="margin:0; padding:0; background: transparent; display: flex; align-items: center; justify-content: center; height: 100%;">
                            <div id="svg-wrapper" style="width: 100%; height: 100%; overflow: hidden;">
                              <img src="${avatar}" style="width: 100%; height: auto; display: block;" />
                            </div>
                          </body>
                        </html>
                      `;
                      const dataUri = 'data:text/html,' + encodeURIComponent(htmlContent);

                      // Enable transparency
                      await page.goto(dataUri, {
                        waitUntil: 'networkidle0',
                        timeout: 30000,
                      });

                      await page.setViewport({
                        width: crop,
                        height: crop
                      });

                      // Take screenshot as buffer
                      const pngBuffer = await page.screenshot({
                        type: 'png'
                      });

                      await browser.close();

                      const outputBuffer = await sharp(pngBuffer)
                        .resize(crop, crop) // resize
                        .composite([{
                          input: Buffer.from(
                            `<svg><circle cx="100" cy="100" r="100" fill="white"/></svg>`
                          ),
                          blend: 'dest-in'
                        }])
                        .png() // Ensure output is PNG for transparency
                        .toBuffer();

                      avatar = nativeImage.createFromBuffer(outputBuffer);

                      //writeLog(controller[token].signal,true)
                      // if modal - win_main, then there will be priority around all call windows, otherwise - no
                      if (!isMac) win_main.id[`${account}:${theURL}`].window.setEnabled(false);
                      win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`blur_on_call_dialog(true)`)

                      dialog.showMessageBox(
                          (isMac) ? win_main.id[`${account}:${theURL}`].window : false,
                          {
                            //'type': 'warning',
                            'title': '📞  ' + i18n.__('call_title') + ' ' + call[token].displayName,
                            'message': i18n.__("call_message") + call[token].displayName,
                            'defaultId': 1,
                            'buttons': [
                              '❌  ' + i18n.__('cancel_button'),
                              '📞  ' + i18n.__('answer_button')
                            ],
                            'icon': avatar,
                            'signal': controller[token].signal
                          })
                        .then((result) => {
                          // if yes
                          if (result.response === 1) {
                            if (proxyUrl) {
                              loadURLWithProxy(win_main.id[`${account}:${theURL}`].window, theURL + '/call/' + token + '#direct-call', proxyAgent)
                            } else {
                              win_main.id[`${account}:${theURL}`].window.loadURL(theURL + '/call/' + token + '#direct-call')
                            }
                            // force close other call dialogs if answer current call
                            for (const [key, value] of Object.entries(controller)) {
                              //writeLog(`Force close call from: ${call[key].displayName}`)
                              value.abort();
                              delete value[key];
                            }
                          } else {

                            if (controller) {
                              controller[token].abort();
                              delete controller[token];
                              for (const [key, value] of Object.entries(controller)) {
                                //writeLog(call[key].displayName)
                                if (key) return;
                              }
                            }

                          }

                          if (!isMac) win_main.id[`${account}:${theURL}`].window.setEnabled(true);
                          win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`blur_on_call_dialog(false)`)
                        });
                      call_prev[token] = call[token];

                    }
                    avatar_process(avatar[token]);
                    // do all the multiple related stuff
                    win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
                    MainMenu.getMenuItemById(`show-${store.get('current_login')}:${store.get('server_url')}`).checked = false;
                    win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true

                    win_main.id[`${account}:${theURL}`].isForeground = false;
                    win_main.id[`${account}:${theURL}`].window.show();

                    store.set('current_login', account);
                    store.set('server_url', theURL);

                    MainMenu.getMenuItemById(`show-${account}:${theURL}`).checked = true;
                    guiInit();
                    
                  } else {
                    //writeLog('Prev call: '+call_prev[token].token)
                    if (call[token].lastMessage.systemMessage.includes('call_missed')) {
                      //writeLog('Missed call: '+ call[token].displayName)
                      if (controller) {
                        controller[token].abort();
                        delete controller[token];
                        delete call_prev[token];
                        for (const [key, value] of Object.entries(controller)) {
                          //writeLog(call[key].displayName)
                          if (key) return;
                        }
                      }
                      if (!isMac) win_main.id[`${account}:${theURL}`].window.setEnabled(true);
                      win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`blur_on_call_dialog(false)`)
                    }

                    if (call[token].lastMessage.systemMessage.includes('call_ended')) {
                      //writeLog('Ended call: '+call[token].displayName)
                      if (controller) {
                        controller[token].abort();
                        delete controller[token];
                        delete call_prev[token];
                        for (const [key, value] of Object.entries(controller)) {
                          //writeLog(call[key].displayName)
                          if (key) return;
                        }
                      }
                      if (!isMac) win_main.id[`${account}:${theURL}`].window.setEnabled(true);
                      win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`blur_on_call_dialog(false)`)
                    }
                  }
                }, 3000)
              }*/

              if (JSON.parse(message).action == 'not_alive') {
                /*if (!gui_blocked) {
                  block_gui_loading(true);*/
                win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL + i18n.__('server_no_response'));
                //}
              }

              if (JSON.parse(message).action == 'refresh') {
                /*if (!gui_blocked) {
                  block_gui_loading(true);*/
                win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL + ' - ' + i18n.__('loading'));
                //}
              }
              if (JSON.parse(message).action == 'alive') {
                if ((unread[`${account}:${theURL}`] != 0) && (unread[`${account}:${theURL}`] != undefined)) {
                  win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread[`${account}:${theURL}`]);
                } else {
                  // set linux taskbar image same as tray
                  /*if (isLinux) {
                    win_main.id[`${account}:${theURL}`].window.setIcon(trayIcon[`${account}:${theURL}`])
                  }*/
                  win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + theURL);
                }
              }

              if (JSON.parse(message).action == 'redirect_to_spreed') {
                // dirty but it works
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript('window.location.replace("/apps/spreed")')
              }
              // to force show app window if not logged in
              if (JSON.parse(message).action == 'force_show_app_win') {


                // dirty but it works
                if (!win_main.id[`${account}:${theURL}`].window.isVisible() || win_main.id[`${account}:${theURL}`].window.isMinimized() /*|| !win_main.isFocused()*/ ) {
                  win_main.id[`${account}:${theURL}`].window.show();
                  if (isMac) app.dock.show();

                }
                // if app is not logged in fallback to login in
                //win_main.webContents.executeJavaScript('window.location.replace("/apps/spreed")')
                if (!blockAuthCall) {
                  blockAuthCall = true;
                  checkAuth(win_main.id[`${account}:${theURL}`].window, saved_password, store.get('server_url'));
                  openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                }

              }

              //get NC color_theme
              if (JSON.parse(message).action.color_theme) {
                win_main.id[`${account}:${theURL}`].server_color = JSON.parse(message).action.color_theme
                //writeLog(`Current color theme for ${account}:${theURL} is ${win_main.id[`${account}:${theURL}`].server_color}`)
              }
              // css fix after NC 29
              if (JSON.parse(message).action == 'css_fix') {
                win_main.id[`${account}:${theURL}`].window.webContents.insertCSS('.rich-contenteditable__input { padding-top:0.5vh!important;}');
              }

              // check if language is changed - reload
              if (JSON.parse(message).action == 'language_changed') {
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`loading('refresh');`);
                win_main.id[`${account}:${theURL}`].window.reload();
              }

              // check if theme is changed - reload
              if (JSON.parse(message).action == 'theme_changed') {
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`loading('refresh');`);
                win_main.id[`${account}:${theURL}`].window.reload();
              }

              // apply theme and lang
              if (JSON.parse(message).action == 'try_apply_theme_and_lang') {
                // set current app language
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`force_lang('` + store.get('locale') + `','` + saved_password + `');`);
                // set current app theme
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`force_theme('` + store.get('theme') + `','` + saved_password + `');`);
              }

              if (JSON.parse(message).action == 'not_found') {
                // auto_login check
                if (auto_login) {
                  //if (store.get('auto_login')) {
                  if (!auto_login_error) {
                    // ask to retry, exit or check settings?
                    const options = {
                      type: 'question',
                      buttons: [i18n.__('retry'), i18n.__('exit'), i18n.__('check_preferences')/*, i18n.__('continue_credentials')*/],
                      defaultId: 0,
                      title: i18n.__('error'),
                      //icon:icon,
                      message: i18n.__('message6', {
                        account: `${account}:${theURL}`
                      }),
                      detail: i18n.__('message9'),
                    };

                    if (Object.keys(loginData.accounts).length <= 1) {
                      showAutoRetryDialog(win_main.id[`${account}:${theURL}`].window, options, 20 * 1000);
                    } else {
                      dialog.showErrorBox(i18n.__('error'),i18n.__('message6', {
                        account: `${account}:${theURL}`
                      }));
                    }
                    //dialog.showErrorBox(i18n.__('error'),i18n.__('message6'));
                    auto_login_error = true;
                  }
                } else {
                  //win_main.destroy();
                  // destroy if error occured 
                  if (Object.keys(loginData.accounts).length <= 1) {
                    appIcon.destroy();
                  }
                  
                  if (!prompted) {
                    //dialog.showErrorBox(i18n.__('error'),i18n.__('message1'));
                    // ask to retry, exit or check settings?
                    const options = {
                      type: 'error',
                      buttons: [i18n.__('retry'), i18n.__('exit'), i18n.__('check_preferences')/*, i18n.__('continue_credentials')*/],
                      defaultId: 0,
                      title: i18n.__('error'),
                      useHtmlLabel: true,
                      //icon:icon,
                      message: i18n.__('message1', {
                        server_url: theURL
                      }),
                      detail: i18n.__('message9'),
                    };
                    prompted = true;
                    if (Object.keys(loginData.accounts).length <= 1) {
                      showAutoRetryDialog(win_main.id[`${account}:${theURL}`].window, options, 20 * 1000, prompted);
                    } else {
                      dialog.showErrorBox(i18n.__('error'),i18n.__('message6', {
                        account: `${account}:${theURL}`
                      }));
                    }
                    //app.exit(0);
                    //setServerUrl (theURL||url_example);
                  }
                }
              }
            } catch (err) {
              // Don't write this errors in log as they are useless with some json parse issues
              //writeLog(err)
              //app.exit(0);
            }
          })


          // prevent navigation to cloud root after logout and following login
          details = win_main.id[`${account}:${theURL}`].window.webContents.on('will-navigate', (event, redirectUrl) => {

            //preventUnsupportedBrowser(win_main);
            url = this.details.getURL();
            //console.log("\nCurrent URL: " + url)
            //console.log("Redirect URL: " + redirectUrl + "\n")
            if (!redirectUrl.includes(`${theURL}`)) {
              event.preventDefault();
              //writeLog("This is external site. Opening in system browser...")
              shell.openExternal(redirectUrl);
              return {
                action: 'deny'
              };
            }
            /*if (!gui_blocked) {
              block_gui_loading(true);
            }*/

            // open profile process
            if (redirectUrl.includes('/u/')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win_main.id[`${account}:${theURL}`].window.webContents.insertCSS('#profile span.loading-icon { display:none;}');
              win_main.id[`${account}:${theURL}`].window.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              openPopup(redirectUrl, win_main.id[`${account}:${theURL}`].window);
              return {
                action: 'deny'
              };
            }
            // open settings process
            if (redirectUrl.includes('/settings/')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win_main.id[`${account}:${theURL}`].window.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              openPopup(redirectUrl, win_main.id[`${account}:${theURL}`].window);
              return {
                action: 'deny'
              };
            }

            // open files, contacts and others process
            if (redirectUrl.includes('/f/') || redirectUrl.includes('calendar') || redirectUrl.includes('contacts')) {
              // open files process
              //if (redirectUrl.includes('/f/')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win_main.id[`${account}:${theURL}`].window.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              shell.openExternal(redirectUrl);
              return {
                action: 'deny'
              };
            }
            // open others process
            /* if (!redirectUrl.includes('/spreed/')&&!redirectUrl.includes('/call/')&&!redirectUrl.includes('/login')&&!redirectUrl.includes('logout')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win_main.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              shell.openExternal(redirectUrl);
              return { action: 'deny' };
            }*/
          });


          win_main.id[`${account}:${theURL}`].window.webContents.on('devtools-closed', () => {
            mainMenuTemplate[2].submenu[1].label = '🔍  ' + i18n.__("open_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
            //checkNewVersion(app.getVersion());
          })

          win_main.id[`${account}:${theURL}`].window.webContents.on('devtools-opened', () => {
            //checkNewVersion(app.getVersion());
            mainMenuTemplate[2].submenu[1].label = '🔍  ' + i18n.__("close_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
            //checkNewVersion(app.getVersion());
          })

          // ************ events block end ******************

          // Open the DevTools.
          //win_main.id[`${account}:${theURL}`].window.webContents.openDevTools()
        }

        function guiInit(sw) {

          try {
            // check locale set and apply current browser locale if it is not set
            /*writeLog(`Current system locale is: ${navigator.language.slice(0, 2).toLowerCase() || navigator.userLanguage.slice(0, 2).toLowerCase()}`)
            if ((store.get('locale') == undefined) || (store.get('locale') == "")) {
              store.set('locale', navigator.language.slice(0, 2).toLowerCase() || navigator.userLanguage.slice(0, 2).toLowerCase())
              //localStorage.setItem('locale',this.settings.locale);
            }*/

            // process logo icon for Mac
            if (isMac) {
              trayIcon[`${store.get('current_login')}:${store.get('server_url')}`] = (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] && store.get('use_server_icon')) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : icon_bw['original_icon'];

              dockIcon[`${store.get('current_login')}:${store.get('server_url')}`] = (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? dockIcon[`${store.get('current_login')}:${store.get('server_url')}`] : dockIcon['original_icon'];

              app.dock.setIcon(dockIcon[`${store.get('current_login')}:${store.get('server_url')}`]);
            } else {
              trayIcon[`${store.get('current_login')}:${store.get('server_url')}`] = (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon;
            }

            if (!sw) {
              appIcon = new Tray(trayIcon[`${store.get('current_login')}:${store.get('server_url')}`]);
            }

            appIcon.setImage(trayIcon[`${store.get('current_login')}:${store.get('server_url')}`]);

            checkMaximize(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window,false);

            const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate)

            if (sw) {
              if ((unread[`${store.get('current_login')}:${store.get('server_url')}`] != 0) && (unread[`${store.get('current_login')}:${store.get('server_url')}`] != undefined)) {
                appIcon.setToolTip(app.getName() + " v." + app.getVersion() + " - " + store.get('current_login') + " - " + store.get('server_url') + " - " + i18n.__("unread_messages") + ": " + unread[`${store.get('current_login')}:${store.get('server_url')}`]);
              } else {
                appIcon.setToolTip(app.getName() + " v." + app.getVersion() + " - " + store.get('server_url'));
              }
            }
            
            appIcon.setContextMenu(contextMenu)

            if (!sw) {
              appIcon.on('click', (event) => {
                if (!isMac) {
                  //if (win_main.isVisible() && !win_main.isMinimized()) {
                  if (win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isVisible() && win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isFocused()) {
                    win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide()
                  } else {
                    if (!isLoading) {
                      win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.show()
                    } else {
                      dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                    }
                  }
                } else {
                  appIcon.popUpContextMenu();
                }
              })
              appIcon.on('context', (event) => {
                appIcon.popUpContextMenu(); // KDE linux doesnt support this =((
              })


              app.on('activate', function() {
                if (isMac) {
                  addBadgeMac();
                }
              })
            }
          }
          catch(err) {
            writeLog(`Error during guiInit: ${err}`)
          }
        }

        function saveProxyServer(login, password) {

          saveProxyCredentials(login, password)

          let proxyLoginData = {
            server: {}
          };
          let savedProxyLogin = false;

          try {
            savedProxyLogin = JSON.parse(store.get("saved_proxy_login"));
          } catch (err) {
            writeLog(err)
          }

          if (savedProxyLogin) {
            try {
              proxyLoginData = savedProxyLogin;
              if (!proxyLoginData.server) {
                proxyLoginData.server = {};
              }
            } catch (e) {
              writeLog("Error parsing saved_proxy_login, create new structure");
              proxyLoginData = {
                server: {}
              };
            }
          }

          proxyLoginData.server[proxyUrl] = {
            user: login
          };

          store.set("saved_proxy_login", JSON.stringify(proxyLoginData));

        }

        // set server_url prompt
        function setServerUrl(server_url, multiple) {
          prompted = true;

          let width = 300;
          let height = 200;

          const bounds = store.get('bounds');
          let x = null;
          let y = null;
          if (bounds) {
            x = Math.round(bounds.x + (bounds.width - width) / 2);
            y = Math.round(bounds.y + (bounds.height - height) / 2);
          }
          
          // show input box for server address
          prompt({
              title: i18n.__('title3'),
              label: i18n.__('message4'),
              value: server_url,
              customStylesheet: (theme == 'dark') ? theme : null,
              type: 'input',
              x: x,
              y: y,
              buttonLabels: {
                ok: i18n.__('save_button'),
                cancel: i18n.__('cancel_button')
              },
              inputAttrs: {
                type: 'url',
                required: true
              },
              icon: original_icon,
              width: width,
              height: height
            }, (Object.keys(win_main.id).length !== 0) ? win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window : null)
            .then((input) => {
              prompted = false;
              if (input === null) {
                if (!multiple) {
                  store.delete('latestVersion');
                  store.delete('releaseUrl');
                  app.exit(0);
                } else {
                  //restartApp();
                }

              } else {
                let address = input
                if (address.startsWith("http://")) {
                  address = address.replace("http://", "https://");
                }
                // moved to openclientauth function
                //store.set('server_url', address)
                url = address + "/apps/spreed"
                setAllowDomains(multiple,address);
              }
            })
            .catch((err) => {
              writeLog(err)
              dialog.showErrorBox(i18n.__('error'), i18n.__("more") + ":" + JSON.stringify(err));
              store.delete('latestVersion');
              store.delete('releaseUrl');
              app.exit(0);
            });
        }

        // set allow domain prompt
        function setAllowDomains(multiple,address, ) {
          prompted = true;
          // ask for SSO
          dialog.showMessageBox((Object.keys(win_main.id).length !== 0) ? win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window : null, {
              'type': 'question',
              'title': i18n.__('title1'),
              'message': i18n.__("message2"),
              'buttons': [
                i18n.__('yes_button'),
                i18n.__('no_button')
              ]
            })
            .then((result) => {
              prompted = false;
              // if no
              if (result.response !== 0) {
                createWindow(address, false, true, false, true);
              }

              // if yes
              if (result.response === 0) {
                if (checkExistedSSO()) {
                  dialog.showErrorBox(i18n.__('error'), i18n.__('message10'));
                  return;
                }

                let width = 300;
                let height = 200;

                const bounds = store.get('bounds');
                let x = null;
                let y = null;
                if (bounds) {
                  x = Math.round(bounds.x + (bounds.width - width) / 2);
                  y = Math.round(bounds.y + (bounds.height - height) / 2);
                }

                prompt({
                    title: i18n.__('title2'),
                    label: i18n.__('message3'),
                    useHtmlLabel: true,
                    customStylesheet: (theme == 'dark') ? theme : null,
                    buttonLabels: {
                      ok: i18n.__('save_button'),
                      cancel: i18n.__('cancel_button')
                    },
                    value: store.get('allow_domain') || '*, *.domain.com, domain.com',
                    type: 'input',
                    inputAttrs: {
                      type: 'text'
                    },
                    icon: original_icon,
                    x: x,
                    y: y,
                    height: height,
                    minWidth: width,
                    resizable: true
                  }, (Object.keys(win_main.id).length !== 0) ? win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window : null)
                  .then((input) => {
                    prompted = false;

                    store.set("current_login", "auto_login");
                    if (input !== null) {
                      store.set('allow_domain', input)
                    }
                    // save autologin as account for server
                    saveCredentials('auto_login','auto_login', address);


                    restartApp();
                  })
                  .catch((err) => {
                    writeLog(err)
                    dialog.showErrorBox(i18n.__('error'), i18n.__("more") + ":" + JSON.stringify(err));
                    store.delete('latestVersion');
                    store.delete('releaseUrl');
                    app.exit(0);
                  });
              }
            })
        }

        /******************** startup app block *********************/

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.

        // To enable transparency on Linux (in KDE dont work?)
        if (isLinux) {
          app.commandLine.appendSwitch('enable-transparent-visuals');
          // to fix bad performance
          /*app.commandLine.appendSwitch('disable-gpu');
          app.disableHardwareAcceleration();*/
        }

        app.whenReady().then(async (event) => {
        // below commented code don't work on macos...
        //app.on('ready', async () => {
          writeLog('PID = ' + process.pid);

          writeLog('Checking internet...');

          let check_result = await checkNetwork(['https://8.8.8.8'])

          if (check_result) {
            writeLog('Internet is available.');
            /*process.on('SIGTERM', () => {
              app.exit(0);
            })
            process.on('SIGINT', () => {
              app.exit(0);
            })*/

             // check license at app startup and in every hour
            setTimeout(() => {
              checkLicense(store.get('license_key'));
              setInterval(() => {
                checkLicense(store.get('license_key'));
              }, 60 * 60 * 1000);
            }, 1 * 1000);

            // to set app.name instead of electron.app.Electron in Windows notifications
            if (!isMac) app.setAppUserModelId(app.name);

            // to detect lock screen and suspend (mac)
            if (isMac) {
              powerMonitor.on('lock-screen', () => {
                isLocked_suspend = true;
                //writeLog('The screen is locked');
              });
              powerMonitor.on('unlock-screen', () => {
                isLocked_suspend = false;
                writeLog('The screen of Mac is unlocked. Force restart app with 2 seconds delay...');
                setTimeout(()=>{
                  restartApp();
                }, 2000)
              });
              powerMonitor.on('suspend', () => {
                isLocked_suspend = true;
                //writeLog('The system is suspended');
              });
              powerMonitor.on('resume', () => {
                isLocked_suspend = false;
                writeLog('The Mac system is resumed. Force restart app with 2 seconds delay...');
                setTimeout(()=>{
                  restartApp();
                }, 2000)
              });
            }

            if (url == "") {
              setServerUrl(url_example);
            } else {
              writeLog(`Checking ${store.get('server_url')}...`);
              check_result = await checkNetwork([store.get('server_url')])
              if (check_result) {
                writeLog(`${store.get('server_url')} is available. Continue app loading...`);
                url += "/apps/spreed";
                createWindow(store.get('server_url'), store.get('current_login'),false);

                //try to start another configured servers
                startForeground();

                // handle Windows shutdown/logout to prevent crush
                if (isWindows) {
                  app.on('before-quit', e => {
                    e.preventDefault();
                  })
                  ShutdownHandler.setWindowHandle(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.getNativeWindowHandle());
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
              } else {
                writeLog(`${store.get('server_url')} is unreachable. Exit app.`)
                dialog.showErrorBox(i18n.__('error'), i18n.__('message1', {
                  server_url: store.get('server_url')
                }));
                app.exit(0);
              }
            }
          } else {
            writeLog(`Internet (8.8.8.8) is unreachable. Exit app.`)
            dialog.showErrorBox(i18n.__('error'), i18n.__('message22'));
            app.exit(0);
          }
        })

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        app.on('window-all-closed', function() {

          // 08.06.2024 due to bug in case of new config recreation
          //if (!isMac) app.quit()
        })

        app.on('login', (event, webContents, request, authInfo, callback) => {
          //let fullProxy = `${authInfo.host}:${authInfo.port}`; //concat proxy for lookup
          //writeLog(fullProxy)
          callback(proxyAgent.proxy.auth.split(':')[0], proxyAgent.proxy.auth.split(':')[1]); //supply credentials to server
        });

        /******************** startup app block *********************/


      } catch (err) {
        dialog.showErrorBox(i18n.__('error'), i18n.__('message12'));
        writeLog(err)
        //dialog.showErrorBox(i18n.__('error'), i18n.__('message5'));
        //fs.unlinkSync(app.getPath('userData')+"/config.json")
        /*fs.rmSync(app.getPath('userData'), {
          recursive: true,
          force: true
        });
        restartApp();*/
        app.exit(0);
      }
    }
  }
 } catch (err) {
  writeLog(err);
  store.delete('latestVersion');
  store.delete('releaseUrl');
  app.exit(0);
 }