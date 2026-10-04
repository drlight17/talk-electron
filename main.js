 // Modules to control application life and create native browser window

 const prompt = require('custom-electron-prompt');

 const sharp = require('sharp');

 const semver = require('semver');

 // for password save function
 const keytar = require('keytar');

 const ShutdownHandler = require('@paymoapp/electron-shutdown-handler');
 const fetch = require('electron-fetch').default

 const isMac = process.platform === 'darwin'
 const isWindows = process.platform === 'win32'
 const isLinux = process.platform === 'linux'

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

 const DBus = require('dbus-next');

 const {
  HttpsProxyAgent
 } = require('https-proxy-agent');

 const os = require('os');
 const {
  exec
 } = require('child_process');
 const {
  execFile
 } = require('child_process');

 //const SystemIdleTime = require('@paulcbetts/system-idle-time');
 //const SystemIdleTime = require('desktop-idle');
let desktopIdle;
let logging_cached;
if (!isWindows) {
  ({ desktopIdle } = require('node-desktop-idle-v2'));
}


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
 //let ton_wallet = 'UQBz_YJrj5-PCpYIqr7wsdspdSgrzETS02N2t0KSo1njX0FJ';
 let ton_wallet = '2202 2021 5875 7462';

 const packageJsonPath = path.join(app.getAppPath(), 'package.json');
 const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

 const appNameLC = packageJson.name;

 try {

  main();

  async function main() {

    //const store = new Store();

    function writeLog(message, obj) {
      const logFilePath = path.join(app.getPath('userData'), 'app.log');
      const timestamp = new Date().toLocaleString();
      
      let logFileMessage;
      if (typeof message === 'object' && message !== null) {
        logFileMessage = `[${timestamp}] ${JSON.stringify(message, getCircularReplacer(), 2)}\n`;
      } else {
        logFileMessage = `[${timestamp}] ${message}\n`;
      }

      if (obj) {
        console.log(`[${timestamp}]`);
        console.dir(message, {
          depth: null,
          colors: true
        });
      } else {
        console.log(`[${timestamp}] ${message}`);
      }
      
      if (logging_cached) {
        try {
          fs.appendFile(logFilePath, logFileMessage, (err) => {
            if (err) {
              console.error(`[${timestamp}] Error when trying to write log:`, err);
            }
          });
        } catch (err) {
          console.error(`[${timestamp}] Error in logging system:`, err);
        }
      }
    }

    function getCircularReplacer() {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      };
    }

    function validateAndFixProtocol(url) {
      try {
        if (/^https?:\/\//i.test(url)) {
          if (/^https:\/\//i.test(url)) {
            return url;
          }
          if (logging_cached){
            writeLog(`Found insecure protocol 'http://' in URL. Fixing it to 'https://'.`);
          }
          return url.replace(/^http:\/\//i, "https://");
        }

        if (/^[a-zA-Z0-9]+:\/\//i.test(url)) {
          if (logging_cached){
            writeLog(`Found invalid protocol in URL. Replacing with 'https://'.`);
          }
          return url.replace(/^[a-zA-Z0-9]+:\/\//i, "https://");
        }
        if (logging_cached){
          writeLog(`No protocol found in URL. Adding 'https://'.`);
        }
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
      //1s timeout to prevent hangs
      setTimeout(()=>{
        let options = [];

        // check if app is in autostart and run as linux systemd service
        if (process.argv.includes('--systemd')) {
          let executable = `"` + app.getPath('exe') + `"`;
          if (!removed) {
            if (logging_cached){
              writeLog('Application was run as service. Trying to restart systemd service...');
            }
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
      })
    }

    //check if config is not empty
    try {
      if (isLinux) {
        var iconPath = path.resolve(getResourceDirectory(), "icon.png");
        var iconPathDock = null;
        store = new Store();
      } else if (isMac){
        getResourceDirectory();
        store = new Store();
        var iconPathDock = path.join(__dirname, 'icon.png');
        var iconPath = path.join(__dirname, store.get('app_icon_name') || 'iconTemplate.png');
      } else if (isWindows) {
        var iconPath = path.resolve(getResourceDirectory(), "icon.ico");
        var iconPathDock = null;
        store = new Store();
      }
    } catch (err) {
      // show error in console and exit app instead of forced recreation userData folder
      writeLog("Empty or broken config.json file. App will now exit. If this error will appear again try to remove config.json from userData path: "+app.getPath('userData'));
      app.exit(0);
    }

    var i18n = new(require('./translations/i18n'));

    const gotTheLock = app.requestSingleInstanceLock();
    if (!app.isPackaged) {
      writeLog(`${app.getName()} v.${app.getVersion()} is started in dev mode.`);
      writeLog(`Detailed logging is enabled.`);
    } else {
      writeLog(`${app.getName()} v.${app.getVersion()} is started in production mode.`);
      writeLog(`To get more detailed log enable it in the settings menu or manually add "logging": true in ${app.getPath('userData')}/config.json.`);
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


        //  turn off console.log errors in case of app.exit(0) in AppImage
        process.on('uncaughtException', (reason, promise) => {
          /*writeLog(`Uncaught Exception at:`)
          writeLog(promise, true); 
          writeLog(`reason: ${reason}`);*/
        });

        process.on('unhandledRejection', (reason, promise) => {
         /* writeLog(`Unhandled Rejection at:`)
          writeLog(promise, true); 
          writeLog(`reason: ${reason}`);*/
          // Optional: log to file, show dialog, or exit gracefully
          // app.exit(1); // if you want to crash on error
        });


        // to check prompted status for dialogs
        let prompted = false;
        let controller = {};
        let auto_login_error = false
        let cert_error = false;
        let idleTime_non_active = 0;
        // for storing unread counter
        let unread = [];
        let unread_prev = [];
        let unread_tokens = [];
        // for storing unread summary counter
        let unread_sum = 0;
        //Do debounce with 500 ms
        let debounce;
        let loginData = {};
        let message_link = [];
        let notification_message_link = [];
        let notification_message_icon = [];
        let notification_type = [];
        let cachedConversations = [];
        let notificationWindows = {id:{}};
        let checkInactivityInterval = {};
        let src_title = [];
        let dismissed = {};
        let call = {};
        let avatar = {};
        let call_prev = {};
        // to store settings menu opened status
        let settings_opened = false;
        let isLocked_suspend = false;
        let isReleased = false;
        let isLoading = false;
        let isForegroundLoading = false;
        let proxyUrl = false;
        let proxyAgent = false;
        let proxyWsAgent = false;
        let saved_proxy_login = false;
        let saved_proxy_password = false;
        let proxies = undefined;
        let isDialogOpen = false;
        let pass_sso = false;

        // check version in every hour with 3 sec delay for the first time
        setTimeout(() => {
          checkNewVersion(app.getVersion());
          setInterval(() => {
            checkNewVersion(app.getVersion());
          }, 60 * 60 * 1000);
        }, 3000);


        // check if license_key is configured and set default null if not
        if (!store.get('license_key')) {
          store.set('license_key', null);
        }

        // check old config before 1.0.0-RC1 - cleanup userdata and restart app to prevent issues
        if (store.get('saved_login')) {
          dialog.showErrorBox(i18n.__('error'), i18n.__('message21'));
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
        } else if (!((store.get('server_url') == undefined) || (store.get('server_url') == ""))) {
          url = validateAndFixProtocol(store.get('server_url'));
          store.set('server_url', url)
        }

        // check if ignore_cert_err is configured and set default false if not
        if (store.get('ignore_cert_err') === undefined) {
          store.set('ignore_cert_err', false)
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
        if (!app.isPackaged) {
          logging_cached = true;
        } else {
          logging_cached = store.get('logging');
        }

        if (logging_cached) {
          writeLog("Writing app log to file " + path.join(app.getPath('userData'), 'app.log'))
        }
        // check if restart_after_suspend is configured and set default false if not
        if (store.get('restart_after_suspend') === undefined) {
          store.set('restart_after_suspend', false);
        }

        // check if turn_off_pinger is configured and set default false if not
        /*if (store.get('turn_off_pinger') === undefined) {
          store.set('turn_off_pinger', false);
        }*/

        // check if unread_int is configured and set default 5 if not
        if (store.get('unread_int') === undefined) {
          store.set('unread_int', 5);
        }

        // check if turn_off_inet_check is configured and set default false if not
        if (store.get('turn_off_inet_check') === undefined) {
          store.set('turn_off_inet_check', false);
        }

        // check if inet_check_addr is configured and set default google 8.8.8.8 if not
        if (!store.get('inet_check_addr')) {
          store.set('inet_check_addr', '8.8.8.8')
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

        const original_icon = nativeImage.createFromPath(iconPath); // template with transparency for tray
        const original_icon_dock = nativeImage.createFromPath(iconPathDock); // template without transparency for mac dock

        let trayIcon = [];
        trayIcon['original_icon'] = original_icon
        let dockIcon = [];
        dockIcon['original_icon'] = original_icon_dock
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
              if (logging_cached){
                writeLog("Exec path were changed! Force change of systemd service ExecStart.")
              }
              store.set('exec_path', executable)
              exec_changed = true;
            }
          }

          if (isWindows) {
            app.setLoginItemSettings({
              openAtLogin: true,
              name: app.getName()
            })
            if (logging_cached){
              writeLog("Application was set to autostart")
            }
          }

          if (isLinux) {
            if (process.env.APPIMAGE) {
              Path = process.env.APPIMAGE.replace(/\/[^\/]*$/, '/');
              executable = `"` + process.env.APPIMAGE + `"`;
            } else {
              Path = app.getPath('exe').replace(/\/[^\/]*$/, '/');
              executable = `"` + app.getPath('exe') + `"`;
            }
            let shortcut_contents = `[Desktop Entry]
Categories=Network;
Comment=Talk web embedded app
Exec=bash -c 'systemctl --user start ${appNameLC}.service'
Name=NC Talk Electron
StartupWMClass=NC Talk Electron
MimeType=x-scheme-handler/${appNameLC}
Terminal=false
Type=Application
Icon=${appNameLC}
X-GNOME-Autostart-Delay=15`;
            let systemd_contents = `[Unit]
Description=Talk web embedded app
After=graphical-session.target
Requires=graphical-session.target

[Service]
Type=simple
WorkingDirectory=${Path}
ExecStart=${executable} --systemd
Environment="NODE_ENV=production"
KillMode=mixed
TimeoutStopSec=10

[Install]
WantedBy=graphical-session.target`;

            if (!fs.existsSync(`${app.getPath('home')}/.config/autostart/${appNameLC}.desktop`)) {
              fs.writeFileSync(`${app.getPath('home')}/.config/autostart/${appNameLC}.desktop`, shortcut_contents, `utf-8`);
            }
            if ((!fs.existsSync(`${app.getPath('home')}/.config/systemd/user/${appNameLC}.service`)) || exec_changed) {
              // to force create subfolder if it is not exist to prevent errors
              fs.mkdirSync(path.dirname(`${app.getPath('home')}/.config/systemd/user/${appNameLC}.service`), { recursive: true });
              fs.writeFileSync(`${app.getPath('home')}/.config/systemd/user/${appNameLC}.service`, systemd_contents, `utf-8`);
              exec(`systemctl --user daemon-reload`);
              exec(`systemctl --user enable ${appNameLC}.service`);
              if (logging_cached){
                writeLog("Application was set to autostart as user systemd service")
              }
            }
          }
          if (isMac) {
            let plist_contents = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.electron.${appNameLC}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/NC Talk Electron.app/Contents/MacOS/NC Talk Electron</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
`;
            if (!fs.existsSync(app.getPath('home') + `/Library/LaunchAgents/com.electron.${appNameLC}.plist`)) {
              fs.writeFileSync(app.getPath('home') + `/Library/LaunchAgents/com.electron.${appNameLC}.plist`, plist_contents, `utf-8`);
              exec(`launchctl bootstrap enable ${app.getPath('home')}/Library/LaunchAgents/com.electron.${appNameLC}.plist`);
              if (logging_cached){
                writeLog("Application was set to autostart as service")
              }
            }
          }
        } else {
          if (isWindows) {
            app.setLoginItemSettings({
              openAtLogin: false,
              name: app.getName()
            })
            if (logging_cached){
              writeLog("Application was removed from autostart")
            }
          }
          if (isLinux) {
            if (fs.existsSync(`${app.getPath('home')}/.config/autostart/${appNameLC}.desktop`)) {
              fs.unlinkSync(`${app.getPath('home')}/.config/autostart/${appNameLC}.desktop`)
            }
            if (fs.existsSync(`${app.getPath('home')}/.config/systemd/user/${appNameLC}.service`)) {
              exec(`systemctl --user disable ${appNameLC}.service`);
              fs.unlinkSync(`${app.getPath('home')}/.config/systemd/user/${appNameLC}.service`)
              exec(`systemctl --user daemon-reload`);
              if (logging_cached){
                writeLog("Application was removed from autostart")
              }
            }
          }
          if (isMac) {
            if (fs.existsSync(`${app.getPath('home')}/Library/LaunchAgents/com.electron.${appNameLC}.plist`)) {
              fs.unlinkSync(`${app.getPath('home')}/Library/LaunchAgents/com.electron.${appNameLC}.plist`);
              exec(`launchctl bootstrap disable com.electron.${appNameLC}`);
              if (logging_cached){
                writeLog("Application was removed from autostart")
              }
            }
          }
        }

        var win_main = {id:{}};
        var win_dismiss_all = null;
        var win_popup = null;
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
                label: '☑️  ' + i18n.__('mark_all_as_read'),
                visible: false,
                id: `mark_all_as_read`,
                click: () => {
                  for (let [index, account] of Object.entries(loginData.accounts)) {
                    markAsRead(account.username, account.url);
                  }
                },
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
                enabled: (!app.isPackaged) ? true : logging_cached,
                click: () => {
                  if (logging_cached){
                    writeLog(`Opening app.log file in ${app.getPath('userData')}`);
                  }
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
                label: '↩️  ' + i18n.__('restart_app'),
                click: () => {
                  restartApp();
                }
              },
              {
                label: '🚪  ' + i18n.__('exit'),
                accelerator: isMac ? 'Cmd+Q' : 'Alt+X',
                click: () => {
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
              {
                label: '↻  ' + i18n.__('refresh'),
                click: () => {
                  win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.webContents.executeJavaScript(`loading('refresh');`);
                  win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.reload()
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
                  win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
                },
                enabled: isMac ? false : true,
                accelerator: isMac ? 'Cmd+H' : 'Ctrl+H',
              },
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
              win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
            },
            enabled: isMac ? false : true,
          },
          {
            type: 'separator'
          },
          {
            label: '👥  ' + i18n.__('current_account'),
            submenu: []
          },
          {
            label: '☑️  ' + i18n.__('mark_all_as_read'),
            id: `mark_all_as_read`,
            visible: false,
            click: () => {
              for (let [index, account] of Object.entries(loginData.accounts)) {
                markAsRead(account.username, account.url);
              }
            },
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
            enabled: (!app.isPackaged) ? true : logging_cached,
            click: () => {
              if (logging_cached){
                writeLog(`Opening app.log file in ${app.getPath('userData')}`);
              }
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
            label: '↩️  ' + i18n.__('restart_app'),
            click: () => {
              restartApp();
            }
          },
          {
            label: '🚪  ' + i18n.__('exit'),
            click: () => {
              syncBounds();
              store.delete('latestVersion');
              store.delete('releaseUrl');
              if (isMac) {
                exec('launchctl bootout gui/"$(id -u)"/com.electron.' + appNameLC);
              }
              app.exit(0);
            },
          }/*,
          {
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
                label: "show noti windows array",
                click: () => {
                  try {
                    writeLog(Object.entries(notificationWindows.id).length)
                    writeLog(notificationWindows, true)
                  }
                  catch(err) {
                    writeLog(`Error trying to show notificationWindows: ${err}`)
                  }
                }
              },
              {
                label: "markAsRead",
                click: () => {
                  markAsRead(store.get('current_login'), store.get('server_url'))
                }
              }
            ]
          },*/
        ];

        function checkNotiInactivity(win_noti, activity_check_interval) {
          let idleTime;

          if (isWindows) {
            idleTime = powerMonitor.getSystemIdleTime();
          } else {
            idleTime = Math.round(desktopIdle.getIdleTime());
          }

          if ((idleTime < 1) && (!(dismissed[win_noti.id]))) {
            // start counter in case of the last win_noti only
            if (win_noti.id === Math.max(0, ...Object.keys(notificationWindows.id).map(Number)) || (Object.keys(notificationWindows.id).length < 1)) {
              
              win_noti.webContents.executeJavaScript(`updateDismissTimeout(10,${win_noti.id})`);
              dismissed[win_noti.id] = true;
            }
          }
        }

        function checkInactivity(activity_check_interval, account, url, isForeground) {

          let idleTime;

          if (isWindows) {
            idleTime = powerMonitor.getSystemIdleTime();
          } else {
            idleTime = Math.round(desktopIdle.getIdleTime());
          }

          // TODO force participant state to prevent active in unfocused window with all chats
          /*if ((idleTime < 5) && (!win_main.id[`${account}:${url}`].window.isFocused())) {
            for (let [index, conversation] of Object.entries(cachedConversations[`${account}:${url}`])) {
              writeLog(`Forcing inactive participant state in unfocused ${account}:${url} with chat ${conversation.token}`)
              win_main.id[`${account}:${url}`].window.webContents.executeJavaScript(`force_state('${conversation.token}', 0);`);
            }
          }*/

          if (!win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isVisible() || !win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isFocused()) {
            idleTime_non_active += activity_check_interval;
          } else {
            idleTime_non_active = 0;
          }


          if ((idleTime_non_active > 4*60) && (!isLocked_suspend)) {
            if (idleTime <= 4*60) {
              idleTime_non_active = 0;
              // do force_online for account
              win_main.id[`${account}:${url}`].window.webContents.executeJavaScript(`force_online();`);
            }
          }
        }

        // linux lock events listener
        async function listenForScreenLockEvents() {
          const bus = DBus.sessionBus();
          const obj = await bus.getProxyObject('org.freedesktop.ScreenSaver', '/org/freedesktop/ScreenSaver');
          const screenSaver = obj.getInterface('org.freedesktop.ScreenSaver');

          screenSaver.on('ActiveChanged', (isActive) => {
            if (isActive) {
              isLocked_suspend = true;
              if (logging_cached){
                writeLog('The screen is locked');
              }
            } else {
              isLocked_suspend = false;
              if (logging_cached){
                writeLog('The screen is unlocked.');
              }
              if ((store.get('restart_after_suspend')) && (!isReleased)) {
                if (logging_cached){
                  writeLog('Force restart app with 10 seconds delay...');
                }
                setTimeout(()=>{
                  restartApp();
                }, 10000)
              }
            }
          });
        }


        // linux suspend events listener
        async function listenForSuspendEvents() {
          const bus = DBus.systemBus();
          const obj = await bus.getProxyObject('org.freedesktop.login1', '/org/freedesktop/login1');
          const logindManager = obj.getInterface('org.freedesktop.login1.Manager');

          logindManager.on('PrepareForSleep', (isStarting) => {
            if (isStarting) {
              isLocked_suspend = true;
              if (logging_cached){
                writeLog('The system is suspended');
              }
            } else {
              isLocked_suspend = false;
              isReleased = true;
              if (logging_cached){
                writeLog('The system is released.');
              }
              
              if (store.get('restart_after_suspend')) {
                if (logging_cached){
                  writeLog('Force restart app with 10 seconds delay...');
                }
                setTimeout(()=>{
                    restartApp();
                }, 10000)
              }
            }
          });
        }

        async function checkNetwork(urls_to_checks) {
          const doCheckNetwork = async (urls = []) => {
            
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
            if (logging_cached) {
              writeLog (results, true);
            }
            return overallResult;
          }

          let networkStatus = await doCheckNetwork(urls_to_checks);
          return networkStatus;
        }

        function checkMaximize(win,click) {

          try {
            if (win.isMaximized() /*&& !isWindows*/) {
              if (click) {
                win.unmaximize()
              }
            } else {
              if (click) {
                if (isLinux || isMac) {
                  let {
                    bounds,
                    workArea
                  } = screen.getDisplayMatching(store.get('bounds'));

                  workArea.height -= 70; // -70 to prevent height issues
                  workArea.width -= 2;
                  // comment out setBound below to prevent maximization on linux (workaround as maximizable is not supported by linux, mac and win only) ?
                  win.setBounds(workArea);
                  win.focus();
                } else {
                  win.maximize()
                }
              }
            }
          }
          catch(err) {
            writeLog(`checkMaximize error: ${err}`);
          }
        }

        function isInternalLink(url) {
          return url.startsWith('file')
        }

        function isExternalLink(url) {
          return !isInternalLink(url)
        }

        // to switch account
        function switchAccount(username, url) {
          const windowKey = `${username}:${url}`;
          const targetWindow = win_main.id[windowKey];
          if (targetWindow && targetWindow.window) {
            if (!targetWindow.window.isVisible() || targetWindow.window.isMinimized()) {

              // Hide current foreground window
              win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
              win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true;
              targetWindow.isForeground = false;
              
              targetWindow.window.show();

              store.set('current_login', username);
              store.set('server_url', url);
              guiInit(true);
            }
          }
        }

        // ctrl+tab shortcut handle to switch windows
        function showRoundRobinAccount(current_win) {
          if (settings_opened) {
            return;
          }

          if (Object.keys(loginData.accounts).length > 1) {
            let next_index = current_win.index+1
            const keysArray = Object.keys(win_main.id);
            if (next_index > Object.keys(win_main.id).length) {
              next_index = 1;
            }

            const nextObject = keysArray[next_index-1 % Object.keys(win_main.id).length];
            const targetWindow = win_main.id[nextObject];

            // Hide current foreground window
            win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
            win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true;
            targetWindow.isForeground = false;
            
            targetWindow.window.show();

            store.set('current_login', keysArray[next_index-1].split(/:(.+)/)[0]);
            store.set('server_url', keysArray[next_index-1].split(/:(.+)/)[1]);

            markCurrentAccMenu(keysArray[next_index-1].split(/:(.+)/)[0], keysArray[next_index-1].split(/:(.+)/)[1])
            guiInit(true);
          }
        }

        function execAsync(command) {
          return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
              if (error) {
                reject(error);
              } else {
                resolve({ stdout, stderr });
              }
            });
          });
        }

        async function checkInputGroupMembership() {
            try {
              // Run 'groups' command to get current user's groups
              const { stdout } = await execAsync('groups');
              const groupsList = stdout.trim().split(' '); // Groups are usually space-separated

              //console.log('Current user is in groups:', groupsList);

              const isInInputGroup = groupsList.includes('input');
              //console.log(`Is user in 'input' group? ${isInInputGroup}`);
              return isInInputGroup;

            } catch (error) {
              writeLog(`Error checking groups: ${error.message}` );
              // Handle error appropriately, maybe assume not in group
              return false;
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
              modal: true,
              icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
              title: '💰  ' + i18n.__('donate_title'),
              // macOS & Windows 10/11 only
              //vibrancy: 'fullscreen-ui',    // on MacOS
              //backgroundMaterial: 'acrylic', // on Windows 11
              width: width,
              height: height,
              resizable: false,
              minimizable: (isMac) ? false : true,
              maximizable: (isMac) ? false : true,
              fullScreenable: (isMac) ? false : true,
              movable: false,
              x: x,
              y: y,
              skipTaskbar: true, // Optional: don't show in taskbar
              autoHideMenuBar: true,
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
                icon: original_icon.toDataURL(),
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
            return;
          }

          isDialogOpen = true;
          store.set('donation_showed', Math.floor(Date.now() / 1000));

          try {
            const result = await showDonateModal();

            if (result.response === 0) {
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
                    donateClick();
                  } else {
                    if (logging_cached){
                      writeLog(`Call license server api to generate key for ${input} `);
                    }
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

        function hasAutoLoginAndAnotherWithSameUrl(loginData) {
            const autoLoginAccounts = loginData.accounts.filter(account => 
                account.username === 'auto_login'
            );
            
            for (const autoAccount of autoLoginAccounts) {

                const hasAnotherWithSameUrl = loginData.accounts.some(account => 
                    account.username !== 'auto_login' && 
                    account.url === autoAccount.url
                );
                
                if (hasAnotherWithSameUrl) {
                    return autoAccount.url;
                }
            }
            
            return false;
        }

        async function getConfiguredAccounts(fallback, failed_username, failed_url) {
          const savedCreds = await getCredentials();
          if (savedCreds) {
            try {
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
              // check if there is auto_login with the same server_url to prevent issued state with both SSO and non-SSO account for the same server_url

              check_remain_auto_login_url = hasAutoLoginAndAnotherWithSameUrl(loginData);

              if (check_remain_auto_login_url) {
                writeLog(`Found auto_login with another account having the same URL ${check_remain_auto_login_url}. Remove auto_login account for this URL to prevent issued state and restart app.`);
                deleteCredentials('auto_login', check_remain_auto_login_url)
                // get current accouns session to cleanup cookies
                let ses = session.fromPartition(`persist:window-auto_login:${check_remain_auto_login_url}`);

                await ses.clearStorageData();
                await session.defaultSession.clearStorageData()

                if (logging_cached){
                  writeLog("Session cookies are cleared");
                }

                getConfiguredAccounts(true);
                restartApp();

              }
              insertServers(fallback, failed_username, failed_url);
            } catch (e) {
              writeLog("Error during servers get:" + e);
              app.exit(0);
            }
          } else {
            if (fallback) {
              if (logging_cached){
                writeLog("No configured servers and accounts! Run startup master.");
              }

              store.delete('server_url');
              store.delete('current_login');
              restartApp();
            }
          }
        }

        function refreshMarkAsRead (account, url) {


          let mark_as_read = mainMenuTemplate[0].submenu[0]
                ?.submenu?.find(sub => sub.id === `mark_as_read_${account}:${url}`);

          let mark_as_read_tray = appIconMenuTemplate[3].submenu.find(sub => sub.id === `mark_as_read_${account}:${url}`);

          if (unread[`${account}:${url}`] > 0) {
            mark_as_read.visible = true;
            mark_as_read_tray.visible = true;
          } else {
            mark_as_read.visible = false;
            mark_as_read_tray.visible = false;
          }

          // TODO this setContextMenu resets appIconMenu in linux - sad =(
          const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate);
          appIcon.setContextMenu(contextMenu);

          MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
          Menu.setApplicationMenu(MainMenu);

        }

        function refreshMarkAllAsRead () {

          let mark_all_as_read = mainMenuTemplate[0].submenu?.find(sub => sub.id === `mark_all_as_read`);

          let mark_all_as_read_tray = appIconMenuTemplate.find(sub => sub.id === `mark_all_as_read`);


          if (sumUnreadCounters() > 0) {
            mark_all_as_read_tray.visible = true;
            mark_all_as_read.visible = true;
          } else {
            mark_all_as_read_tray.visible = false;
            mark_all_as_read.visible = false;
          }


          // TODO this setContextMenu resets appIconMenu in linux - sad =(
          const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate);
          appIcon.setContextMenu(contextMenu);

          MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
          Menu.setApplicationMenu(MainMenu);
        }

        function markAsRead(account,url) {

          JSON.parse(unread_tokens[`${account}:${url}`]).forEach((chat_token, index) => {
            try {
              win_main.id[`${account}:${url}`].window.webContents.executeJavaScript(`
                try {
                  markAsRead('${chat_token}');
                } catch(err) {
                  console.log(err);
                }
              `);
            } catch(err) {
              writeLog(`Error during send mark as read to chat_token ${chat_token}: ${err}`);
            }
          })

        }

        function markCurrentAccMenu(account,url) {
          try {
            // at first force uncheck all accounts
            mainMenuTemplate[0].submenu[0]
                ?.submenu.forEach(sub => {
              if (sub.id) {
                if (sub.label.includes('✓')) {
                  sub.label = sub.label.replace('✓ ', '');
                }
              }
            });

            let newItem = mainMenuTemplate[0].submenu[0]
                ?.submenu?.find(sub => sub.id === `show-${account}:${url}`);
            if (newItem) {
                if (!newItem.label.includes('✓')) {
                  newItem.label = '✓ '+newItem.label;
                } else {
                  newItem.label = newItem.label.replace('✓ ', '');
                }
            }

            // rebuild main and appicon menus

            // TODO this setContextMenu resets appIconMenu in linux - sad =(
            const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate);
            appIcon.setContextMenu(contextMenu);

            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
          }
          catch(err) {
            writeLog(err)
          }
        }

        function deleteAllAccounts() {
          if (isForegroundLoading) {
            dialog.showErrorBox(
              i18n.__('error'),
              i18n.__('still_loading')
            );
            return;
          }

          if (settings_opened) {
            return;
          }

          const options = {
            type: 'question',
            buttons: [
              i18n.__('yes_button'),
              i18n.__('no_button')
            ],
            defaultId: 1,
            cancelId: 1,
            title: i18n.__('delete_all_accounts'),
            message: i18n.__('delete_all_accounts_confirm')
          };

          dialog.showMessageBox(
            win_main.id[
              `${store.get('current_login')}:${store.get('server_url')}`
            ].window,
            options
          )
            .then((result) => {
              if (result.response !== 0) {
                return;
              }

              (async () => {
                try {
                  const accounts = Object.values(loginData.accounts);

                  for (const account of accounts) {
                    const { username, url } = account;

                    try {
                      deleteCredentials(username, url);

                      const ses = session.fromPartition(
                        `persist:window-${username}:${url}`
                      );

                      await ses.clearStorageData();
                      await session.defaultSession.clearStorageData();

                      if (logging_cached) {
                        writeLog(`Session cookies are cleared: ${username}:${url}`);
                      }

                    } catch (error) {
                      writeLog(
                        `Error clearing cookies for ${username}:${url}: ${error.message}`
                      );
                    }
                  }

                  // Все аккаунты обработаны
                  restartApp();

                } catch (error) {
                  writeLog(`Error deleting all accounts: ${error.message}`);
                }
              })();
            })
            .catch((err) => {
              writeLog(
                'Dialog was closed unexpectedly or error occurred: ' + err
              );
            });
        }

        function deleteAccount(username, url, forced) {
          if (!isForegroundLoading) {
            if (settings_opened) {
              return;
            }
            const options = {
              type: 'question',
              buttons: [i18n.__('yes_button'), i18n.__('no_button')],
              defaultId: 1,
              title: i18n.__('delete_account'),
              message: i18n.__('delete_account_confirm', {
                server_url: url,
                saved_login: username
              }),
            };

            dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, options)
              .then((result) => {
                switch (result.response) {
                  case 0: // Yes
                    // get current accouns session to cleanup cookies
                    (async () => {
                      try {
                        deleteCredentials(username, url)
                        
                        let ses = session.fromPartition(`persist:window-${username}:${url}`);

                        await ses.clearStorageData();
                        await session.defaultSession.clearStorageData()

                        if (logging_cached){
                          writeLog("Session cookies are cleared");
                        }

                        const response = await dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                          type: 'info',
                          message: i18n.__('message29'),
                          detail: i18n.__('message30', {
                            account: `${username}:${url}`
                          })
                        });



                        if (response) {
                          if (!forced) {
                            getConfiguredAccounts(true);
                          } else {
                            store.delete('current_login');
                            store.delete('server_url');
                            
                            restartApp();
                            
                          }
                        }
                      } catch (error) {
                        writeLog(`Error clearing cookies: ${error.message}`);
                      }
                    })();

                    break;
                  case 1: // No
                    if (forced) {
                      restartApp();
                    }
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

        function insertServers(fallback, failed_username, failed_url) {
          try {
            for (let [index, account] of Object.entries(loginData.accounts)) {  
              index++;
              let isForeground = false;

              // if falled back then set the first server_url in config and return
              if (fallback) {
                if (!failed_username) {
                  if (logging_cached){
                    writeLog('Fallback to another configured account ' + account.username + ' and server '+account.url)
                  }

                  store.set('server_url', account.url);
                  store.set('current_login', account.username);
                  restartApp();
                } else {
                  // suggest to delete account, to restart app or to exit
                  const options = {
                    type: 'error',
                    buttons: [i18n.__('restart_app'), i18n.__('delete_account'), i18n.__('exit')],
                    defaultId: 0,
                    cancelId: 2,
                    title: i18n.__('error'),
                    message: i18n.__('message6', {
                      account: `${failed_username}:${failed_url}`
                    }),
                  };

                  dialog.showMessageBox(win_main.id[`${failed_username}:${failed_url}`].window, options)
                  .then((result) => {
                    switch (result.response) {
                      case 0: // Retry
                        restartApp();
                        break;
                      case 1: // delete account
                        if (logging_cached){
                          writeLog(`Forced delete ${failed_username}:${failed_url} account and restart app.`)
                        }
                        deleteAccount(failed_username,failed_url)
                        break;
                      case 2: // exit
                        app.exit(0);
                        break;
                    }
                  })
                }
                break;
              }

              let delete_account = {
                label: '❌  ' + i18n.__('delete_account'),
                click: () => {
                  // try to delete account func
                  deleteAccount(account.username, account.url);
                }
              }

              let mark_as_read = {
                label: '☑️  ' + i18n.__('mark_as_read'),
                id: `mark_as_read_${account.username}:${account.url}`,
                visible: false,
                click: () => {
                  markAsRead(account.username, account.url);
                },
              };

              let label = '';
              if ((account.username) && (account.username !== 'auto_login')) {

                label = `${(Object.keys(loginData.accounts).length <= 1) ? '' : index+'.'} 👤  ${i18n.__('current_login')} ${account.username}`
              } else {
                label = `👤  ${i18n.__('logged_out')}`
              }

              if (!((account.url == store.get('server_url')) && (account.username == store.get('current_login')))) {
                isForeground = true;
              }

              saved_login_submenu = {
                label: isForeground ? label : '✓ '+label,
                sublabel: '🌐  ' + account.url,
                id: `show-${account.username}:${account.url}`,
                type: 'normal',
                //checked: !isForeground,
                //visible: !isForeground,
                accelerator: (Object.keys(loginData.accounts).length <= 1) ? null : `Ctrl+${index}`,
                click: (menuItem, browserWindow, event, isForeground) => {
                  if (!isForegroundLoading) {
                    if (settings_opened) {
                      return;
                    }
                    markCurrentAccMenu(account.username,account.url);

                    switchAccount(account.username, account.url);

                  } else {
                    dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                  }
                  // Prevent the default toggle behavior
                  event.preventDefault();
                }
              }

              appIconMenuTemplate[3].submenu.push(
                saved_login_submenu,
                {
                  label: '🌐  ' + account.url,
                  enabled: false,
                  visible: !isWindows
                },
                mark_as_read,
                delete_account,
                {
                  type: 'separator'
                }
              );

              mainMenuTemplate[0].submenu[0].submenu.push(
                saved_login_submenu,
                {
                  label: '🌐  ' + account.url,
                  enabled: false,
                  visible: isMac,
                },
                mark_as_read,
                delete_account,
                {
                  type: 'separator'
                }
              );
            }

            if (failed_username) {
              return;
            }
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
              accelerator: `Ctrl+N`,
              click: () => {
                if (!isForegroundLoading) {
                  if (settings_opened) {
                    return;
                  }
                  setServerUrl(url_example, true);
                } else {
                  dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                }
              }
            }

            let delete_all_accounts = {
              label: '❌  ' + i18n.__('delete_all_accounts'),
              click: () => {
                if (!isForegroundLoading) {
                  if (Object.keys(loginData).length !== 0) {
                    /*for (let [index, account] of Object.entries(loginData.accounts)) {
                      // try to delete account func
                      deleteAccount(account.username, account.url, false, true);
                    }*/
                    deleteAllAccounts();
                  }
                }
              }
            }

            let separator = {
                  type: 'separator'
            }

            mainMenuTemplate[0].submenu[0].submenu.push(tab_help)
            appIconMenuTemplate[3].submenu.push(tab_help)

            // set maximum possible configured accounts to 9
            if (loginData.accounts.length < 9) {
              mainMenuTemplate[0].submenu[0].submenu.push(add_account)
              appIconMenuTemplate[3].submenu.push(add_account)
              if (loginData.accounts.length > 1) {
                mainMenuTemplate[0].submenu[0].submenu.push(separator)
                appIconMenuTemplate[3].submenu.push(separator)
                mainMenuTemplate[0].submenu[0].submenu.push(delete_all_accounts)
                appIconMenuTemplate[3].submenu.push(delete_all_accounts)
              }
            }
            
            const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate);
            appIcon.setContextMenu(contextMenu);

            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
          } catch (err) {
            writeLog('Failed to insert account to menus: ' + err);
          }
        }

        function applyContextMenu(win) {
          const wakeUpDisabled = new Map();

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
                label: '📙  ' + i18n.__('add_to_dict'),
                accelerator: !isMac ? `CmdOrCtrl+d` : null,
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
                label: '✍️  ' + i18n.__('copy_image'),
                accelerator: !isMac ? `CmdOrCtrl+i` : null,
                click: () => win.webContents.copyImageAt(params.x, params.y),
              },
              {
                label: '🖼️  ' + i18n.__('save_image'),
                accelerator: !isMac ? `CmdOrCtrl+s` : null,
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
                label: '📋🔗  ' + i18n.__('copy_link_address'),
                accelerator: !isMac ? `CmdOrCtrl+l` : null,
                click: () => clipboard.writeText(params.linkURL),
              },
              {
                label: '📋📄  ' + i18n.__('copy_link_text'),
                accelerator: !isMac ? `CmdOrCtrl+t` : null,
                click: () => clipboard.writeText(params.linkText.trim() || params.linkURL),
              },
              {
                type: 'separator'
              },
            ]

            let skipMenuWakeItem = false;

            if (params.linkURL && isExternalLink(params.linkURL)) {
              menuItems.push(...menuLinkItems);

              if (params.linkURL.includes('/call/')) {
                const chat_token = params.linkURL.split('/').pop();

                const disabledUntil = wakeUpDisabled.get(chat_token);
                const disabled = disabledUntil && disabledUntil > Date.now();

                const seconds = disabled
                  ? Math.ceil((disabledUntil - Date.now()) / 1000)
                  : 0;

                // check chat type in cachedConversations; skipMenuWakeItem if this not one to one chat
                for (let [index, conversation] of Object.entries(
                  cachedConversations[
                    `${store.get('current_login')}:${store.get('server_url')}`
                  ]
                )) {
                  if (conversation.token == chat_token) {
                    if (conversation.type == 1) {
                      skipMenuWakeItem = true;
                    }
                  }
                }

                const menuWakeItem = [
                  {
                    id: `wake_up_button_${chat_token}`,

                    label: disabled
                      ? '⏳  ' + i18n.__('wake_up_wait') + ` (${seconds} ${i18n.__('seconds')})`
                      : '👋  ' + i18n.__('wake_up'),

                    enabled: !disabled,

                    click: () => {
                      try {
                        win.webContents.executeJavaScript(`
                          try {
                            wakeUp('${chat_token}');
                          } catch(err) {
                            console.log(err);
                          }
                        `);

                        wakeUpDisabled.set(
                          chat_token,
                          Date.now() + 20 * 1000
                        );

                        setTimeout(() => {
                          wakeUpDisabled.delete(chat_token);
                        }, 20 * 1000);

                      } catch(err) {
                        writeLog(
                          `Error during send wake up to chat_token ${chat_token}: ${err}`
                        );
                      }
                    }
                  },
                  {
                    type: 'separator'
                  }
                ];

                if (skipMenuWakeItem) {
                  menuItems.unshift(...menuWakeItem);
                }

                haveContext = true;
              }
            }

            // Add context actions for clipboard events and text editing
            const menuClipboardItems = [{
                role: 'copy',
                label: '📋  ' + i18n.__('copy'),
                accelerator: !isMac ? `CmdOrCtrl+c`:null,
                enabled: params.selectionText && params.editFlags.canCopy,
              },
              {
                role: 'cut',
                label: '✂  ' + i18n.__('cut'),
                accelerator: !isMac ? `CmdOrCtrl+x`:null,
                enabled: params.selectionText && params.isEditable && params.editFlags.canCut,
                visible: params.isEditable,
              },
              {
                role: 'selectAll',
                label: '✔  ' + i18n.__('select_all'),
                accelerator: !isMac ? `CmdOrCtrl+a` : null,
                enabled: params.editFlags.canSelectAll,
              },
              {
                role: 'paste',
                label: '⤵  ' + i18n.__('paste'),
                accelerator: !isMac ? `CmdOrCtrl+v` : null,
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
            if (logging_cached){
              writeLog("Use of system proxy is not enabled. Force proxy credentials remove from keystore.")
            }
            let creds = await getAllProxyCredentials();

            creds.forEach(async (credential) => {
              deleteProxyCredentials(credential.account);
            });

          }
          win.webContents.executeJavaScript(`loadSettings(` + JSON.stringify(store.store) + `,` + lang_files + `,` + flag + `,` + themes + `,'` + proxyUrl + `','` + saved_proxy_password + `','` + theme + `');`);
          if (!app.isPackaged) {
            win.webContents.executeJavaScript(`disableRunAtStartup();`);
            win.webContents.executeJavaScript(`disableLogging();`);
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
          } else {
            copyright = i18n.__('unregistered') + '\n\n' + copyright
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
            if (logging_cached){
              writeLog('Configured proxy URL: '+proxyUrl)
            }
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

          let auth = null;
          if (proxyInfo === 'DIRECT') {
            return false;
          } else {

            if (saved_proxy_password == null) {
              if (logging_cached){
                writeLog("No saved login or password. Try to use proxy anonymously... ")
              }
              auth = false
            } else {
              auth = `${JSON.parse(saved_proxy_login).server?.[proxyUrl]?.user}:${saved_proxy_password}`
            }
            let host = new URL(proxyUrl).hostname
            let port = new URL(proxyUrl).port

            proxyAgent = new HttpsProxyAgent({
              host: host,
              port: port,
              auth: auth,
            });
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
          win.loadURL(url, {
            userAgent: `NC Talk Electron v. ${app.getVersion()} (${os.hostname()}/${os.platform()} /${os.version()})`,
            extraHeaders: [
              'OCS-APIRequest: true',
              `Accept-Language: ${store.get('locale')}`
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
              });

              res.on('end', () => {
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
                  if (logging_cached){
                    writeLog('Check license using override server '+store.get('license_server_url'))
                  }
                } else {
                  if (logging_cached){
                    writeLog('Check license using default server')
                  }
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
                      detail: err,
                    })
                  }
                }
              }

              const req = require('https').request({
                hostname: !store.get('license_server_url') ? 'license.drlight.fun' : store.get('license_server_url'),
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
                });

                res.on('end', () => {
                  try {
                    if (JSON.parse(body).valid) {
                      if (logging_cached){
                        writeLog('Your app license is valid.')
                      }
                      if (forced) {
                        dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                          type: 'info',
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
                        if (logging_cached){
                          writeLog('Your app license is not activated!')
                        }

                        if (forced) {
                          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                            type: 'error',
                            detail: i18n.__('message18'),
                          })
                        }
                      } else if (JSON.parse(body).expired) {
                        if (logging_cached){
                          writeLog('Your app license is expired!')
                        }

                        if (forced) {
                          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                            type: 'error',
                            detail: i18n.__('message19'),
                          })
                        }
                        store.set('license_key', null)
                      } else {
                        if (logging_cached){
                          writeLog('Your app license is absent or invalid!')
                        }

                        if (forced) {
                          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, {
                            type: 'error',
                            detail: i18n.__('message20'),
                          })
                        }
                        store.set('license_key', null)
                      }

                      store.set('license_key_activated', false)
                      updateMenu(false, false, false);


                      // if app run for the first time and donate message wasn't shown - delay for 3 minutes to show it
                      if (!store.get('donation_showed')) {
                        setTimeout(() => {
                          donateClick();
                        }, 3 * 60 * 1000);
                      } else {
                        if ((Math.floor(Date.now() / 1000) - store.get('donation_showed') > 60 * 60 * 24 * 7)) {
                          if (logging_cached){
                            writeLog('App is not licensed and message showed 7 days ago. Showing...')
                          }
                          // if app run for the first time and no donation message were shown - delay for 3 minutes
                          donateClick();
                        } else {
                          if (logging_cached){
                            writeLog('App is not licensed, but message showed less then 7 days ago. Skipping...' )
                          }
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
            if (logging_cached){
              writeLog('Skip check license api request as no hour passed since last one.')
            }
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
              appIconMenuTemplate[7].submenu[1].label = '🔥  ' + i18n.__('new_version') + ": " + latestVersion;
              appIconMenuTemplate[7].submenu[1].enabled = true;
              appIconMenuTemplate[7].submenu[1].click = () => {
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

                appIconMenuTemplate[7].submenu.splice(2, 2)
              }
            } else {
              if (licensed === false) {
                // add donate_menu_element to main menu
                mainMenuTemplate.splice(4, 0, donate_menu_element)
                // add donate_menu_element to tray menu
                appIconMenuTemplate[7].submenu.splice(2, 0, donate_menu_element.submenu[0])
                appIconMenuTemplate[7].submenu.splice(3, 0, donate_menu_element.submenu[1])
              }
            }

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
            return;
          }

          let remembered = false;
          try {
            const rememberData = JSON.parse(store.get('new_version_remember'));
            remembered = Boolean(rememberData[latestVersion]);
          } catch (err) {
            writeLog(err)
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
            if (!cachedVersion && !cachedUrl) {
              if (logging_cached){
                writeLog("Fetch new version info from github.")
              }
              const response = await fetch(apiUrl);
              const data = await response.json();

              latestVersion = data.tag_name;
              releaseUrl = data.html_url;

              store.set('latestVersion', latestVersion);
              store.set('releaseUrl', releaseUrl);

            } else {
              latestVersion = cachedVersion;
              releaseUrl = cachedUrl;
            }

            const comparison = semver.compare(currentVersion, latestVersion)
            if (comparison === 0) {
              if (logging_cached){
                writeLog("You are using the latest version.");
              }
            } else if (comparison < 0) {
              if (logging_cached){
                writeLog("A new version is available: " + latestVersion);
              }
              openNewVersionDialog(releaseUrl, latestVersion)
            } else {
              if (logging_cached){
                writeLog("You are using a newer version.");
              }
            }

          } catch (error) {
            writeLog('Error fetching the latest release:' + error);
          }
        }

        function sumUnreadCounters() {
          unread_sum = 0;
          if (Object.keys(loginData).length !== 0) {
            for (let [index, account] of Object.entries(loginData.accounts)) {
              unread_sum += parseInt(unread[`${account.username}:${account.url}`]) || 0;
            }
          }
          return unread_sum;
        }

        function localize(win, type) {
          win.webContents.executeJavaScript(`get_all_ids();`);
          ipcMain.on(type, (event, message) => {
            if (win.webContents.id == event.sender.id) {
              try {
                if (JSON.parse(message).action == 'return_localize_ids') {
                  obj = JSON.parse(JSON.parse(message).localization_ids);
                  obj.forEach(id => {
                    let setting_loc = i18n.__(id.replace('_id', ''))
                    win.webContents.executeJavaScript(`localize("` + id + `","` + setting_loc + `");`);

                    // localization of allow_domain_id and unread_int_id title
                    if ((id == 'allow_domain_id') || (id == 'unread_int_id')) {
                      id = id.replace('_id', '_title')
                      let setting_loc = i18n.__(id.replace('_id', '_title'))
                      win.webContents.executeJavaScript(`localize("` + id + `","` + setting_loc + `");`);
                    }
                  });
                }
              } catch (err) {
                writeLog(err);
              }
            }
          });
        }

        // apply unread badge to dock icon on Mac
        function addBadgeMac() {
          app.dock.setIcon(dockIcon[`${store.get('current_login')}:${store.get('server_url')}`]);
          app.dock.setBadge('');
          if (store.get('sum_unread')) {
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
              for (var key in obj) {
                // if saved_proxy_login is changed then call saveCredentials

                if ((key == "saved_proxy_login") && (obj[key])) {

                  saveProxyServer(JSON.parse(obj[key]).server?.[proxyUrl]?.user, JSON.parse(obj[key]).server?.[proxyUrl]?.password);
                } else if (key == "auto_login") {
                  if (obj[key]) {
                    store.set("current_login", "auto_login");
                  }
                } else {
                  store.set(key, obj[key]);
                }
              }

              // close win before restart 
              win.close();
              restartApp();
            }
            if (JSON.parse(message).action == 'restart_app') {
              // close win before restart 
              win.close();
              restartApp();
            }
          } catch (err) {
            writeLog(err);
          }

        }

        function showConfigErrorDialog() {
          const options = {
            type: 'question',
            buttons: [i18n.__('retry'), i18n.__('cleanup'), i18n.__('exit')],
            defaultId: 0,
            title: i18n.__('error'),
            message: i18n.__('message5'),
          };

          dialog.showMessageBox(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, options)
          .then((result) => {
            switch (result.response) {
              case 0: // Retry
                restartApp();
                break;
              case 1: // clean up userData folder and restart
                fs.rmSync(app.getPath('userData'), {
                  recursive: true,
                  force: true
                });
                restartApp();
                break;
              case 2: // exit
                app.exit(0);
                break;
            }
          })
          .catch((err) => {
            writeLog('Dialog was closed unexpectedly or error occurred: ' + err);
          })
        }

        function showAccessErrorDialog(mes) {
          const options = {
            type: 'error',
            buttons: [i18n.__('restart_app'), i18n.__('check_preferences'), i18n.__('exit')],
            defaultId: 0,
            title: i18n.__('error'),
            message: mes,
          };

          dialog.showMessageBox(options)
          .then((result) => {
            switch (result.response) {
              case 0: // Retry
                restartApp();
                break;
              case 1: // check preferences
                openSettings(true, true);
                  promted = false;
                break;
              case 2: // exit
                app.exit(0);
                break;
            }
          })
          .catch((err) => {
            writeLog('Dialog was closed unexpectedly or error occurred: ' + err);
          })
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
                restartApp();
                break;
              case 1: // Exit App
                app.exit(0);
                break;
              case 2: // Open Preferences
                openSettings(true, true);
                if (promted_value) {
                  promted = false;
                }
                break;
              case 3: // delete account and start over
                deleteAccount(store.get('current_login'), store.get('server_url'), true)
                break;
              default:
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
                if (logging_cached){
                  writeLog(`Proxy server ${proxyUrl} is deleted`);
                }
              }
            } catch (e) {
              writeLog("Error during server remove:" + e);
            }
          }
        }

        async function saveCredentials(username, password, server_address) {
          try {
            // dummy window to make dialog on top
            let win_modal_false = new BrowserWindow({
              show: false,
              alwaysOnTop: true
            })


            store.set("current_login", username);
            store.set("server_url", server_address);

            // moved keytar.setPassword after store.set to prevent appImage terminate called after throwing an instance of 'Napi::Error'
            await keytar.setPassword("NC_Talk_Electron_v1", username+":"+server_address , password);
            
            if (username=='auto_login') {
              if (logging_cached){
                writeLog(`✅ Server ${server_address} is set to SSO.`);
              }
              restartApp();
              return 0;
            } else {
              if (logging_cached){
                writeLog("✅ Creds are saved!");
              }
              win_modal_false = win_main.id[`false:${server_address}`].window
            }

            const response = await dialog.showMessageBox(win_modal_false, {
              type: 'info',
              message: i18n.__('message26'),
              detail: i18n.__('message27', {
                account: `${username}:${server_address}`
              })
            });

            if (response) {
              restartApp();
            }

          } catch (error) {
            writeLog('❌ Error during cred save: ' + error);
            store.delete("current_login");
            store.delete("server_url");
          }
        }

        async function saveProxyCredentials(username, password) {
          try {
            await keytar.setPassword(`NC_Talk_Electron/proxy_server/${proxyUrl}}`, username, password);
            if (logging_cached){
              writeLog('✅ Proxy creds are saved!');
            }
          } catch (error) {
            writeLog('❌ Error during proxy cred save: ' + error);
          }
        }

        function setWinBoundsLinux(win) {

          win.setBounds({x: store.get('bounds').x, y: store.get('bounds').y-28, width: store.get('bounds').width, height: store.get('bounds').height})
        }

        function syncBounds() {
          store.set('bounds', win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.getBounds());

          for (let [index, win] of Object.entries(win_main.id)) {

            try {
              if (win.isForeground) {
                if (isLinux) {
                  // fix of y bound offset + 28px during account switch for linux (?)
                  setWinBoundsLinux(win.window);
                } else {
                  win.window.setBounds(store.get('bounds'));
                }
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
                const creds = await keytar.findCredentials(`NC_Talk_Electron_v1`);
                if (creds.length > 0) {
                  if (logging_cached){
                    writeLog(`✅ Successfully fetched ${creds.length} credential(s).`);
                  }
                  return creds; // Return immediately on success
                } else {
                  if (logging_cached){
                    writeLog('❌ No saved creds found after attempt at all.');
                  }
                  // TODO force autologin save and restart to prevent run of setServerUrl
                  if ((store.get('current_login') == 'auto_login') && (store.get('server_url'))) {
                    pass_sso = true;
                    if (logging_cached){
                      writeLog(`Force save auto_login credential for current server_url ${store.get('server_url')} and restart app.`)
                    }
                    saveCredentials('auto_login','auto_login', store.get('server_url'));
                  }
                  return null; // No creds found, not an error per se, return null
                }
              } else {
                const password = await keytar.getPassword("NC_Talk_Electron_v1", username + ":" + server_url);
                if (password) {
                  if (logging_cached){
                    writeLog(`✅ Password found for user '${username}'.`);
                  }
                  return password; // Return immediately on success
                } else {
                  if (logging_cached){
                    writeLog(`❌ No saved ${username} user found after attempt.`);
                  }
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
              if (logging_cached){
                writeLog('✅ Password for proxy '+username+' is found.');
              }
              return password;
            } else {
              if (logging_cached){
                writeLog('❌ No such saved proxy user');
              }
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

            // random timeout to avoid login errors - maybe some more robust solution???
            let randomIncrement = 1;
            let pendingTimeouts = 0; // Track number of pending timeouts
            
            for (let [index, account] of Object.entries(loginData.accounts)) {
              index++;
              // random between 1 and 2 seconds
              randomIncrement += Math.round(Math.random() * (1 - 2) + 2)
              if ((store.get('current_login') != account.username) || (store.get('server_url') != account.url)) {
                pendingTimeouts++; // Increment counter for each timeout we're creating
                setTimeout(() => {
                  if (logging_cached){
                    writeLog(`Start ${account.username}:${account.url} with index ${index} in foreground`)
                  }
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
                    // dirty force refresh to update unread counter in case of sum_unread enabled
                    if (store.get('sum_unread')) {
                      
                      setTimeout(() => {
                        refreshBadge(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, store.get('current_login'), store.get('server_url'))
                        }, 3000); // dirty wait 3 seconds after the last foreground server is started to load
                    }
                  }
                }, 1000+randomIncrement*1000);
              } else {
                // set cur win index!
                win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].index = index
              }
            };

            // If no accounts needed to be started, set loading to false immediately
            if (pendingTimeouts === 0) {
              isForegroundLoading = false; 
            }
          }
          catch (err) {
            // check if SSO were added
            if (!pass_sso) {
              writeLog("Error to create foreground windows: "+err)
              // force remove server_url and restart to force adding new server
              store.delete('server_url');
              store.delete('current_login');
              restartApp();
            } 
          }
        }

        async function getAllProxyCredentials() {
          try {
            const creds = await keytar.findCredentials(`NC_Talk_Electron/proxy_server/${proxyUrl}}`);
            if (creds) {
              if (logging_cached){
                writeLog('✅ Saved proxy creds are found.');
              }
              return creds;
            } else {
              if (logging_cached){
                writeLog('❌ No saved proxy creds');
              }
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
            if (logging_cached){
              writeLog(`🗑️ ${username}:${url} account is removed`);
            }
          } catch (error) {
            writeLog('❌ Error removing creds: ' + error);
          }
        }

        async function deleteProxyCredentials(username) {
          try {
            if (logging_cached){
              writeLog("Proxy login to remove: " + username)
            }
            await keytar.deletePassword(`NC_Talk_Electron/proxy_server/${proxyUrl}}`, username);
            if (logging_cached){
              writeLog('🗑️ Proxy credentials are removed');
            }
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
          let parent = false;
          if (!errored) {
            parent = win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window;
          }
          let width = 520;
          let height = 550;

          const bounds = store.get('bounds');

          const x = Math.round(bounds.x + (bounds.width - width) / 2);
          const y = Math.round(bounds.y + (bounds.height - height) / 2);

          if (!(settings_opened)) {
            let win_settings = new BrowserWindow({
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
              parent: parent,
              webPreferences: {
                enableRemoteModule: true,
                contextIsolation: false,
                nodeIntegration: true
              },
              x: x,
              y: y
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
                // fix bug with empty settings are shown if application can't connect to NC server
                //win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.show();
                app.dock.show();
              }
              localize(win_settings, 'settings');
              win_settings.show();
              settings_opened = true;
              getSettings(win_settings, flag);
              ipcMain.on('settings', (event, message) => {
                if (win_settings.webContents.id == event.sender.id) {
                  if (JSON.parse(message).action === 'save_settings') {
                    setSettings(message, win_settings);
                  }

                  if (JSON.parse(message).action === 'show_message_example') {
                    let data = {
                      title: i18n.__("notification_ex_title"),
                      body: i18n.__("notification_ex_body")
                    };
                    createNotification(data, JSON.parse(message).position, true, win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window, win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].index, `${store.get('current_login')}:${store.get('server_url')}`);
                  }
                  if (JSON.parse(message).action === 'open_config_file') {
                    if (logging_cached){
                      writeLog(`Opening config.json file in ${app.getPath('userData')}`);
                    }
                    openFile(path.join(app.getPath('userData'), 'config.json'));
                  }
                  if (JSON.parse(message).action === 'open_notification_settings') {
                    if (logging_cached){
                      writeLog(`Opening extra notification settings in NC`);
                    }
                    openPopup(store.get('server_url')+'/settings/user/notifications', win_settings);
                  }
                }
              });
            });

            win_settings.on('closed', function(e) {
              ipcMain.removeAllListeners('settings');
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

        async function checkAuth(win, saved_password, server_url, account) {
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


            if (testResponse.statusCode !== 200) {
              if (logging_cached){
                writeLog("Token is not found, invalid, expired or revoked. Switch to another configured server")
              }
              // set the first server_url from config if any
              getConfiguredAccounts(true, account, server_url);
              return false;
            } else {
              return ses;
            }
          } catch (error) {
            writeLog(error);
            if (error.code === 'PROXY_AUTH_FAILED') {
              // global session interception is not applicatable
              // try to Custom Fetch Wrapper (solution 2)
              win.loadURL("about:blank"); // Fallback to a blank page
            }
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

            if (!result || result.statusCode < 200 || result.statusCode >= 400) {
              if (logging_cached){
                writeLog(`Authentication failed: ${result?.statusCode} ${result?.jsonData?.ocs?.meta?.message || ''}`, true);
              }
              return;
            }

            if (!result?.jsonData?.ocs?.data?.id) {
              if (logging_cached){
                writeLog('Authentication succeeded but no user data returned', true);
              }
              return;
            }

            if (logging_cached){
              writeLog(`Authenticated as user: ${result.jsonData.ocs.data.id}`);
            }

          } catch (err) {
            writeLog(`Authentication request failed: ${err.message}`);

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
                ].join('\n'),
              })
            }

            // check page loading 
            monitorLoadingStatus(win, server_address);

            // force cookies clear and app restart to supress "Access forbidden State token does not match" error
            win.webContents.session.webRequest.onCompleted((details) => {

              if (details.url.includes('login/flow/grant') && details.statusCode === 403) {
                if (logging_cached){
                  writeLog(`403 error detected for URL: ${details.url}. Force clear cookies and app restart! Try again.`);
                }
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
                  setServerUrl(server_address, true);
                }
              }
            });
                      
            // add app styling override to prevent some element appear in first account adder
            win.webContents.on('ready-to-show', () => {
              win.webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8'));
            })

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
                }
              }
            })
          })
        }

        function checkExistedSSO(address) {
          if (Object.keys(loginData).length !== 0) {
            for (let [index, account] of Object.entries(loginData.accounts)) {
              if (account.username == 'auto_login') {
                return true;
              }
              if (account.url == address) {
                return true;
              }
            }
            return false;
          } else {
            return false;
          }
        }

        function parseLoginRedirectUrl(url) {
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
                enableRemoteModule: true,
                contextIsolation: false,
                nodeIntegration: true
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

              localize(win_picker, 'picker');

              win_picker.setPosition(Math.floor(store.get('bounds').x + (store.get('bounds').width - win_picker.getBounds().width) / 2), Math.floor(store.get('bounds').y + (store.get('bounds').height - win_picker.getBounds().height) / 2));

              win_picker.show();

              win_picker.webContents.executeJavaScript(`showSources(` + JSON.stringify(sourcesArray) + `,'` + theme + `');`);


              ipcMain.on('picker', (event, message) => {
                if (win_picker.webContents.id == event.sender.id) {
                  try {
                    if (JSON.parse(message).action === 'media_picked') {
                      callback({
                        video: sources.find(media => media.id === JSON.parse(message).media_id)
                      })
                      ipcMain.removeAllListeners('picker');
                      win_picker.destroy();
                    }
                    if (JSON.parse(message).action === 'media_picker_quit') {
                      ipcMain.removeAllListeners('picker');
                      win_picker.close();
                    }
                  } catch (err) {
                    writeLog(err)
                  }
                }
              });
            })

            //win_picker.webContents.openDevTools()
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
                clearInterval(intervalId); // Stop monitoring once the page is loaded
              } else {

                const elapsedTime = Date.now() - startTime;

                // If the timeout is reached, handle the timeout scenario
                if (elapsedTime >= timeout) {
                  if (logging_cached){
                    writeLog(`Timeout: Page ${server_address} failed to load within ${timeout/1000} seconds.`);
                  }
                  clearInterval(intervalId);
                  if (win && !win.isDestroyed()) {
                    dialog.showErrorBox(i18n.__('error'),i18n.__('message1', {
                        server_url: server_address
                      }));
                    win.close();
                    isLoading = false;
                  }
                }
              }
            } else {
              if (logging_cached){
                writeLog("Window is destroyed or invalid. Stopping the monitor.");
              }
              clearInterval(intervalId);
            }
          }, 1000); // Check every 1 second
        }

        function openPopup(url, win) {
          try {
            if (win_popup) {
              // to force close win_popup before open new - prevent multiple popup windows
              win_popup.close();
            }
          } catch (e) {
            writeLog(e)
          }

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
              partition: (store.get('current_login')) ? `persist:window-${store.get('current_login')}:${store.get('server_url')}` : null
            }
          })


          var theUrl = url;

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
              if (!isLinux) {
                appIcon.setToolTip(app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread);
              }
              win.setTitle(src_title[win.id] + " - " +app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread)
            } else {
              if (!isLinux) {
                appIcon.setToolTip(app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL);
              }
              win.setTitle(src_title[win.id] + " - " +app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL)
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
            var badge = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="82" height="82">
              <circle cx="41" cy="41" r="41" fill="${badge_color}" />
              <circle cx="41" cy="41" r="41" fill="none" stroke="${text_color}" stroke-width="5" />
              ${SVGtext}
            </svg>`;

            convertIcon(badge, unread, purpose, win, account, theURL)
        }

        function shakeWindow(win) {
          try{
            const [x, y] = win.getPosition();

            const start = Date.now();
            const amplitude = 70; // max shaking amplitude in px

            // force on top
            win.setAlwaysOnTop(true);
            win.focus({ steal: true });


            //win.setBounds({x: x, y: y, width: width-5, height: height-5})
            // dirty workaround to fix KDE 6+ with pinned main window - won't shake
            win.setPosition(x+5, y+5);

            const timer = setInterval(() => {
                if (Date.now() - start >= 2000 || win.isDestroyed()) {
                    clearInterval(timer);
                    if (!win.isDestroyed()) {
                      if (!store.get('always_on_top')) {
                        win.setAlwaysOnTop(false);
                      }
                      if (isLinux) {
                        // fix of y bound offset + 28px during account switch for linux (?)
                        setWinBoundsLinux(win);
                      } else {
                        win.setPosition(x, y);
                      }
                    }
                    return;
                }

                win.setPosition(
                    x + Math.round((Math.random() - 0.5) * amplitude),
                    y + Math.round((Math.random() - 0.5) * amplitude)
                );

            }, 50);
          }
          catch(err) {
            writeLog(err)
          }
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
            var contrast = 200
          } else {
            var linear = 0 // for black color
            var contrast = 0
          }
          var newImage = await sharp(icon.toPNG()).greyscale().linear(linear, contrast).png({
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

              // resize to fix icon pixelization on windows
              if (isWindows) {
                newImage = await sharp(newImage).resize(32, 32).toBuffer();
              }
              
              if (unread) {
                trayIcon[`${account}:${theURL}`] = nativeImage.createFromBuffer(newImage);
              } else {
                if (isMac) {
                  trayIcon[`${account}:${theURL}`] = (store.get('use_server_icon')) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : icon_bw['original_icon']
                } else {
                  trayIcon[`${account}:${theURL}`] = (store.get('use_server_icon')) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon
                }
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

        function forceCloseNoti(noti_win){
          try {
            delete dismissed[noti_win.id];
            delete notificationWindows.id[noti_win.id]
            noti_win.close();
            
          }
          catch(err) {
            writeLog(`Error while closing errored win_noti: ${err}`)
          }
        }

        function closeDismissAllButton(){
          win_dismiss_all.close();
          win_dismiss_all = null;
          ipcMain.removeAllListeners(`dismiss_all`);

        }

        function showDismissAllButton(theme, position, x_dismiss_all, y_dismiss_all){
          if (win_dismiss_all) {
            closeDismissAllButton()
          }
          setTimeout(()=>{
            win_dismiss_all = new BrowserWindow({
              modal: true,
              // macOS & Windows 10/11 only
              //vibrancy: 'fullscreen-ui',    // on MacOS
              //backgroundMaterial: 'acrylic', // on Windows 11
              //titleBarStyle: 'hidden',
              frame: false,
              show: false, // test in non-macos
              width: 340,
              height: 75,
              resizable: false,
              movable: false,
              transparent: true,
              x: x_dismiss_all,
              y: y_dismiss_all,
              focusable: !isLinux,
              alwaysOnTop: !isLinux, // Optional: keep on top
              hasShadow: false,
              skipTaskbar: true, // Optional: don't show in taskbar
              autoHideMenuBar: true,
              webPreferences: {
                enableRemoteModule: true,
                contextIsolation: false,
                nodeIntegration: true
              }
            })

            win_dismiss_all.loadFile("dismiss_all.html");
            win_dismiss_all.setMenu(null);

            win_dismiss_all.webContents.on('ready-to-show', () => {
              win_dismiss_all.webContents.executeJavaScript(`document.getElementById('dismiss_all').textContent = '${i18n.__('dismiss_all')}';`);
              win_dismiss_all.webContents.executeJavaScript(`document.getElementById('dismiss_all').title = '${i18n.__('dismiss_all_title')}';`);

              if (position.includes('right')) {
                win_dismiss_all.webContents.executeJavaScript(`document.getElementById('dismiss_all-container').classList.add('right');`);
              }

              if (theme == 'dark') {
                win_dismiss_all.webContents.executeJavaScript(`document.body.classList.add('dark-theme');`);
              }

              // to prevent blinking while styling is being applied
              setTimeout(()=>{
                win_dismiss_all.showInactive();
              }, 500);
            })

            ipcMain.on('dismiss_all', (event, message) => {
              // dismiss all button process
              if (JSON.parse(message).action == "dismissed_all") {
                DismissAllNoti();
                closeDismissAllButton();
              }
            })

            win_dismiss_all.on('closed', () => {
              closeDismissAllButton();

            });

            //win_dismiss_all.webContents.toggleDevTools();
          }, 500)
          
        }

        function PosCalc(width, height, position) {
          const {
            workArea
          } = screen.getDisplayMatching(store.get('bounds'));

          let x = 0;
          let y = 0;
          let x_dismiss_all = 0;
          let y_dismiss_all = 0;

          if (position == 'top-left') {
            x = workArea.x;
            y = workArea.y + 15;
            x_dismiss_all = x;
            y_dismiss_all = workArea.y;
          } else if (position == 'top-right') {
            x = workArea.x + workArea.width - width;
            y = workArea.y + 15;
            x_dismiss_all = x;
            y_dismiss_all = workArea.y;
          } else if (position == 'bottom-left') {
            x = workArea.x;
            y = workArea.y + workArea.height - height - 5;
            x_dismiss_all = x;
            y_dismiss_all = y - 15;
          } else if (position == 'bottom-right') {
            x = workArea.x + workArea.width - width;
            y = workArea.y + workArea.height - height - 5;
            x_dismiss_all = x;
            y_dismiss_all = y - 15;
          }


          return { x, y, x_dismiss_all, y_dismiss_all };
        }

        function createNotification(data, position, demo, win, win_index, account_string) {
          // make sure corresponging chat is not opened in app or browser because nitifications won't be sent (NC backend feature); TODO make notification system independant from NC backend (unread polling based?)


          // !!! DO NOT MAKE DEBOUNCE BECAUSE IT CREATES NOTIFICATION LAGS IN MULTIPLE APPS WITH NOTIFICATION DELIVERY ISSUES !!!
          //clearTimeout(debounce);
          //debounce = setTimeout(function() {
            // limit max number by 8 of notifications by forced dismiss the oldest
            let noti_limit = 8;
            let notificationWindowsArr = Object.keys(notificationWindows.id);
            if (notificationWindowsArr.length >= noti_limit) {
              let oldestNoti = Math.min(Infinity, ...Object.keys(notificationWindows.id).map(Number));
              if (logging_cached){
                writeLog(`Limit of ${noti_limit} simultaneous notifications is reached! Force close oldest notification with id ${oldestNoti}`)
              }
              forceCloseNoti(notificationWindows.id[oldestNoti]);
            }

            if (logging_cached){
              writeLog(`🔔 Got notification:`);
              writeLog(data,true)
            }


            if ((store.get("notification_timeout_checkbox") || demo) && (!isLocked_suspend)) {

                const width = 360
                const height = 200

                if (!position) {
                  position = store.get("notification_position")
                } else {
                  // force close all other notification examples
                  DismissAllNoti();
                }


                let { x, y, x_dismiss_all, y_dismiss_all } = PosCalc(width, height, position);

                let win_noti = new BrowserWindow({
                  modal: true,
                  icon: (original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`]) ? original_server_icon[`${store.get('current_login')}:${store.get('server_url')}`] : original_icon,
                  title: data.title,
                  // macOS & Windows 10/11 only
                  //vibrancy: 'fullscreen-ui',    // on MacOS
                  //visualEffectState: 'active', // on MacOS
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
                    enableRemoteModule: true,
                    contextIsolation: false,
                    nodeIntegration: true
                  }
                })

                win_noti.loadFile("notification.html");
                win_noti.setMenu(null);
                if (logging_cached){
                  //writeLog("This notification win id is: "+win_noti.id);
                }

                notificationWindows.id[win_noti.id] = win_noti;

                win_noti.webContents.once('did-finish-load', () => {
                  win_noti.webContents.insertCSS(`
                    * {
                      font-family: 'Arial', sans-serif !important;
                    }
                  `);
                })

                win_noti.webContents.on('ready-to-show', () => {
                  try {
                    win.webContents.executeJavaScript(`
                      try{
                        get_Notifications('${JSON.stringify(data)}', '${win_noti.id.toString()}','${position}', '${win_index}','${x_dismiss_all}','${y_dismiss_all}');
                      }
                      catch(err){
                        ipcRenderer.send('main', JSON.stringify({'action': {'notification_get_error': err, 'win_noti_id': ${win_noti.id.toString()} }}));
                      }
                    `);
                  }
                  catch(err){
                    writeLog(`Error during get_Notifications: ${err}`)

                  }
                });
                  
                win_noti.on('closed', event => {
                  ipcMain.removeAllListeners(`notification`);
                })


                ipcMain.on(`notification-${win_noti.id}`, (event, message) => {
                  // open message from notify process
                  if (JSON.parse(message).action.open_message) {
                    win.webContents.executeJavaScript(`open_message("${notification_message_link[`${account_string}:${data.tag}`]}");`);
                    // force close other call dialogs if answer current call
                    for (const [key, value] of Object.entries(controller)) {
                      value.abort();
                      delete value[key];
                    }
                    if (!win.isVisible() || win.isMinimized() || !win.isFocused() ) {
                      // force hide all other windows for case of foreground win noti click
                      for (let [index, account] of Object.entries(loginData.accounts)) {
                        index++;
                        if (index != win_index) {
                          win_main.id[`${account.username}:${account.url}`].window.hide();
                        } else {
                          win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true
                          win_main.id[`${account.username}:${account.url}`].window.show();
                          win_main.id[`${account.username}:${account.url}`].isForeground = false;

                          store.set('current_login', account.username);
                          store.set('server_url', account.url);

                          markCurrentAccMenu(account.username, account.url)
                        }
                      }
                    }
                  }

                  // dismiss button process
                  if (JSON.parse(message).action.dismissed) {
                    
                    let index = JSON.parse(message).action.dismissed;
                    if (logging_cached){
                      writeLog("Notify window with id "+index+" is dismissed")
                    }

                    if (index !== -1) {
                      delete notificationWindows.id[index]
                    }

                    if (Object.keys(notificationWindows.id).length < 2) {
                      closeDismissAllButton();
                    }

                    delete dismissed[index];

                    clearTimeout(checkInactivityInterval[index]);
                  }

                  // force counter on noti mouse hover leave
                  if (JSON.parse(message).action == "mouse_leave") {
                    win_noti.webContents.executeJavaScript(`updateDismissTimeout(10,${win_noti.id})`);
                    dismissed[win_noti.id] = true;
                  }

                  // notification error process
                  if (JSON.parse(message).action.notification_error) {
                    if (logging_cached){
                      writeLog(`Notify window with id ${win_noti.id} got an error and will be self-closed.`);
                    }
                    forceCloseNoti(win_noti);
                  }
                })

                //win_noti.webContents.openDevTools()

            } else {
              if (logging_cached){
                writeLog(`Got notification ${data.tag} but notifications are turned off by user or system is suspended.`)
              }
            }
        }

        function DismissAllNoti() {
          for (let [ind, noti_win] of Object.entries(notificationWindows.id)) {
            try {
              clearTimeout(checkInactivityInterval[noti_win.id]);
              dismissed[noti_win.id] = false;
              noti_win.webContents.executeJavaScript(`slideAway('` + noti_win.id + `');`);
            } catch (err) {
              writeLog(`Error during DismissAllNoti: ${err}`)
            }
          };
        }

        async function UnreadTray(account,theURL,isForeground,win) {

          if ((unread[`${account}:${theURL}`] == 0) || (unread[`${account}:${theURL}`] == undefined) || (sumUnreadCounters() == 0)) {
            if (isMac) {
              icon_bw[`${account}:${theURL}`] = (store.get('use_server_icon')) ? original_server_icon[`${account}:${theURL}`] : icon_bw['original_icon'];
              trayIcon[`${account}:${theURL}`] = icon_bw[`${account}:${theURL}`];
            } else {
              trayIcon[`${account}:${theURL}`] = (store.get('use_server_icon')) ? original_server_icon[`${account}:${theURL}`] : original_icon;
            }

            win.flashFrame(false);
            win.setOverlayIcon(null, '');

          } else {            
            clearTimeout(debounce);
            if (store.get('show_on_new_message')) {
              if (unread_prev[`${account}:${theURL}`] != unread[`${account}:${theURL}`]) {
                // check if win_main is in not hidden of minimized
                if (!win.isVisible() || win.isMinimized() || !win.isFocused() ) {
                  // force dismiss all notifications when show_on_new_message is true and is fired
                  DismissAllNoti();
                  // bounce 1s to prevent config bounds save loop
                  debounce = setTimeout(function() {
                    // do all multiple win stuff before show
                    win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.hide();
                    win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].isForeground = true

                    win.show();
                    win.isForeground = false;

                    store.set('current_login', account);
                    store.set('server_url', theURL);

                    markCurrentAccMenu(account,theURL)
                    if (isMac) app.dock.show();
                    // open corresponding message
                    setTimeout(function() {
                      win.webContents.executeJavaScript(`open_message("` + message_link[`${account}:${theURL}`] + `");`);
                    }, 1000);
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

          refreshBadge(win, account, theURL);
          refreshMarkAsRead(account, theURL);
          refreshMarkAllAsRead();
        }

        async function createWindow(theURL, account, isForeground, index, add) {

          let blockAuthCall = false;

          session.defaultSession.allowNTLMCredentialsForDomains(store.get('allow_domain'));

          // Create the browser window.
          if (Object.keys(loginData).length !== 0) {

            if (index !== undefined) {
              for (let [account_index, account_logindata] of Object.entries(loginData.accounts)) {
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
          
          let additionalarguments = [];

          if (store.get("notification_sys_checkbox")) {
            additionalarguments.push('--isSysNotiEnabled');
          }

          win_main.id[`${account}:${theURL}`] = {
            window: new BrowserWindow({
              title: app.getName() + " v." + app.getVersion() + " - " + theURL,
              center: true,
              autoHideMenuBar: add,
              show: false,
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
                partition: (account) ? `persist:window-${account}:${theURL}` : null,
                enableRemoteModule: true,
                backgroundThrottling: false,
                preload: !add ? path.join(__dirname, 'preload.js') : null,
                additionalArguments: additionalarguments,
                notifications: {
                  show: store.get("notification_sys_checkbox")
                },
                contextIsolation: false,
                nodeIntegration: true,
              }
            }),
            isForeground: isForeground,
            index: index,
            server_color: undefined,
            server_title: undefined,
            shown_noti: undefined
          }

          // set always on top
          if (store.get('always_on_top')) {
            win_main.id[`${account}:${theURL}`].window.setAlwaysOnTop(true, 'floating', 1);
          }

          if (isLinux && !add) {
            // fix of y bound offset + 28 during account switch for linux (?)
            setWinBoundsLinux(win_main.id[`${account}:${theURL}`].window);
          } else {
            win_main.id[`${account}:${theURL}`].window.setBounds(store.get('bounds'));
          }
          

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
          win_main.id[`${account}:${theURL}`].window.webContents.session.setDisplayMediaRequestHandler(async (request, callback) => {
            showSources(callback, win_main.id[`${account}:${theURL}`].window);
          })


          let authenticated = false;
          let saved_password = undefined;

          let ses = undefined;

          // check if there is system proxy configured

          await getProxyInfo(theURL);
          if (logging_cached){
            if (proxyAgent) {
              if (!proxyAgent.proxy.auth) {
                writeLog("No saved login or password. Trying to use proxy anonymously...")
              } else {
                writeLog(`Found configured proxy with auth -- ${proxyUrl}. Trying to use it...`)
              }
            } else {
              writeLog('No system proxy found! Direct connect.')
            }
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
            if (!auto_login) {
              if (loginData) {
                try {
                    saved_password = await getCredentials(account, theURL);
                    if (saved_password == null) {
                      if (logging_cached){
                        writeLog("Not authenticated!");
                      }
                      if (!blockAuthCall) {
                        blockAuthCall = true;
                        openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                      }
                    } else {
                      authenticated = await checkAuth(win_main.id[`${account}:${theURL}`].window, saved_password, theURL, account);

                      if (authenticated) {
                        if (logging_cached){
                          writeLog("Token is valid. Log in to " + theURL + " with account "+account)
                        }
                        tryLogin(authenticated, win_main.id[`${account}:${theURL}`].window, saved_password, theURL)
                      } else {
                        // fix fallback to another server in case of some accounts can't login (i.e. due to changed password )
                        if (logging_cached){
                          writeLog("Not authenticated!");
                        }
                        if (!blockAuthCall) {
                          blockAuthCall = true;
                          openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                        }
                      }
                    }
                } catch (err) {
                  writeLog(err)
                  // suggest actions instead of forced profile cleanup and restart
                  showConfigErrorDialog();
                }
              } else {
                if (!blockAuthCall) {
                  blockAuthCall = true;
                  openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                }
              }
            } else {
              if (logging_cached){
                writeLog("Autologin is enabled. Log in using SSO.")
              }
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
                // dirty workaround to prevent BUG - context and main menus won't appear after pin/resize main win until change focus/size
                if ((isLinux) && (win_main.id[`${account}:${theURL}`].window.isVisible())) {
                  win_main.id[`${account}:${theURL}`].window.hide();
                  win_main.id[`${account}:${theURL}`].window.show();
                }
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

          // Handle preload debug
          ipcMain.on('talk-debug', (event, ...args) => {
            // to filter other then event sender windows, check window.webContents.id as ids of event.sender are different then sorted win_main.id array
            if (win_main.id[`${account}:${theURL}`].window.webContents.id == event.sender.id) {
              if (logging_cached){
                writeLog(...args, true);
              }
            }
          });

          // Handle preload
          ipcMain.on('preload', (event, message) => {
            // to filter other then event sender windows, check window.webContents.id as ids of event.sender are different then sorted win_main.id array
            if (win_main.id[`${account}:${theURL}`].window.webContents.id == event.sender.id) {
              if (JSON.parse(message).action=='fetchunread') {
                // force unread recalc with 1 second delay
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`setTimeout(()=>{unreadFetch();}, 1000)`);
              }
            }
          });

          // Handle incoming notification requests
          ipcMain.on('show-electron-notification', (event, {
            title,
            data,
            options
          }) => {
            // TODO workaround to block same data.tag notification
            if (win_main.id[`${account}:${theURL}`].shown_noti == data.tag) {
              if (logging_cached){
                writeLog("We have multiple same data.tag notification. Prevent runnig...")
              }
              return 0;
            }
            win_main.id[`${account}:${theURL}`].shown_noti = data.tag;

            // check muted notifications
            if (store.get('notification_muted')) {
              win_main.id[`${account}:${theURL}`].window.webContents.setAudioMuted(true);
              setTimeout(function() {
                win_main.id[`${account}:${theURL}`].window.webContents.setAudioMuted(false);
              }, 6000); // 6s to prevent call sound
            }

            // to filter other then event sender windows, check window.webContents.id as ids of event.sender are different then sorted win_main.id array
            if (win_main.id[`${account}:${theURL}`].window.webContents.id == event.sender.id) {
              createNotification(data, false, false, win_main.id[`${account}:${theURL}`].window, win_main.id[`${account}:${theURL}`].index,`${account}:${theURL}`);
            }
            // force unread recalc with 1 second delay
            win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`setTimeout(()=>{unreadFetch();}, 1000)`);
          });



          // save app name title
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
              win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion() + " - " + account + " - " + theURL+ " - " + i18n.__("unread_messages") + ": " + unread[`${account}:${theURL}`]);
            } else {
              win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL);
            }

          });

          win_main.id[`${account}:${theURL}`].window.on('focus', function() {
            let isFocused = false;
            // check if there are notifications with zero timeout - dismiss them all after 5s
            if (Object.keys(notificationWindows.id).length > 0) {
              setTimeout(() => {
                // if notifications if in focus
                for (let [ind, noti_win] of Object.entries(notificationWindows.id)) {
                  if (noti_win.isFocused()) {
                    isFocused = true;
                  }
                }

                if (!isFocused) {
                  if ((store.get('notification_timeout')) && (store.get('notification_timeout') == 0)) {
                    DismissAllNoti();
                  }
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
            dockIcon[`${account}:${theURL}`] = original_icon_dock
            original_server_icon[`${account}:${theURL}`] = original_icon
            trayIcon[`${account}:${theURL}`] = original_icon

            // load icon from server and replace them
            if (store.get('use_server_icon')) {
              // set icon for current account window
              let icon_url = theURL + "/apps/theming/image/logo";
              const fetchImage = async url => {
                try {
                  const response = await fetch(url);
                  const buffer = await response.arrayBuffer();
                  const nodebuffer = Buffer.from(buffer);
                  // add icon normalization in case of non standard icon size
                  let norm_icon = await normalizeIcon(nodebuffer);

                  // resize to fix icon pixelization on windows
                  if (isWindows) {
                    original_server_icon[`${account}:${theURL}-orig-size`] = nativeImage.createFromBuffer(norm_icon)
                    norm_icon = await sharp(norm_icon).resize(32, 32).toBuffer();
                  }

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
                  } else {
                    trayIcon[`${account}:${theURL}`] = icon;
                  }

                  if (!isForeground) {
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
            if ((!win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.isVisible()) && (isMac)) app.dock.hide();
            // add app styling override
            win_main.id[`${account}:${theURL}`].window.webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8'));
          })

          // fallback if cloud can't be loaded
          // case of proxy auth connection error
          win_main.id[`${account}:${theURL}`].window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {

            writeLog(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
            if (errorDescription.toLowerCase().includes('cert')) {
              cert_error = true;
            }
            if (!validatedURL.includes('unsupported?redirect_url')) {
              dialog.showErrorBox(i18n.__('error'),i18n.__('message1', {
                  server_url: server_address
                }));
              win_main.id[`${account}:${theURL}`].window.close();
            }
          });

          // check cloud
          win_main.id[`${account}:${theURL}`].window.webContents.on('did-finish-load', function(e) {

            // override fonts to Arial to fix any app startup errors
            win_main.id[`${account}:${theURL}`].window.webContents.insertCSS(`
              * {
                font-family: 'Arial', sans-serif !important;
              }
            `);

            // IPC communication initialize 
            win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`const { ipcRenderer } = require('electron');`);
            
            if (!add) {

              if (store.get('unread_int')) {
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`let unread_int = ${store.get('unread_int')};`);
              }

              // check nc and talk status and version
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'nextcloud_check.js')), true)

              // get unread messages count
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'unread_observer.js')), true)

              // get user menu open observe
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'user_menu_observer.js')), true)

              // localize NC user_menu
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`var nc_link_loc = "` + i18n.__("nc_link") + `";`);
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`var switch_acc_loc = "` + i18n.__("switch_accounts") + `";`);

              // TODO change this to api callbacks
              // run pinger
              /*if (!store.get('turn_off_pinger')) {
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`start_pinger();`);
              }*/
              
              // add roundrobin account switch button if there more then one account is configured
             if (Object.keys(loginData.accounts).length > 1) {
                win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`createAccSwitch();`);
              }
              
              win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`var user_settings_link_loc = "` + i18n.__("user_settings_link") + `";`);
            } 

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

          ipcMain.on('main', (event, message) => {
            if (win_main.id[`${account}:${theURL}`].window.webContents.id == event.sender.id) {
              try {
                if (message.includes('Connecting to wss://')) {

                  lastWebSocketConnectMessage = message;
                  waitingForError = true;


                  const urlMatch = message.match(/wss:\/\/[^\s'"]+/);
                  if (urlMatch) {
                    trackedWebSocketUrl = urlMatch[0];
                  }

                } else if (waitingForError && message.includes('Error [object Event]')) {

                  if ((!prompted) && (!(settings_opened))) {
                    const options = {
                      type: 'error',
                      buttons: [i18n.__('save_button'), i18n.__('check_preferences')],
                      defaultId: 1,
                      title: i18n.__('error'),
                      message: i18n.__('message16'),
                    };
                    prompted = true;
                    dialog.showMessageBox(win_main.id[`${account}:${theURL}`].window, options).then((result) => {
                      if (result.response === 1) {
                        openSettings(false, true);
                      }
                    });
                  }

                  waitingForError = false;
                  lastWebSocketConnectMessage = null;
                  trackedWebSocketUrl = null;

                }

                // Handle wake up
                if (JSON.parse(message).action.wake_up_neo) {
                  if (!isLocked_suspend) {
                    if (logging_cached) {
                      writeLog(`👋 ${account}:${theURL}, found wake up message id ${JSON.parse(JSON.parse(message).action.wake_up_neo).id} from ${JSON.parse(JSON.parse(message).action.wake_up_neo).actorDisplayName}`)
                    }

                    markCurrentAccMenu(account,theURL);
                    switchAccount(account,theURL);
                    shakeWindow(win_main.id[`${account}:${theURL}`].window);
                    setTimeout(()=>{
                      win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`open_message("${`${theURL}/call/${JSON.parse(JSON.parse(message).action.wake_up_neo).token}#message_${JSON.parse(JSON.parse(message).action.wake_up_neo).id}`}");`);
                    }, 1000)
                  } else {
                    if (logging_cached) {
                      writeLog(`${account}:${theURL}, ignore wake up message id ${JSON.parse(JSON.parse(message).action.wake_up_neo).id} from ${JSON.parse(JSON.parse(message).action.wake_up_neo).actorDisplayName} because of system is locked/suspend.`)
                    }
                  }
                }

                // get cachedConversations; could be used further to implement injection of wakeUp menu into the NC instead of current Electron contextMenu
                if (JSON.parse(message).action.cachedConversations) {
                  cachedConversations[`${account}:${theURL}`] = JSON.parse(JSON.parse(message).action.cachedConversations);
                }

                if (JSON.parse(message).action.unread || (JSON.parse(message).action.unread === 0)) {
                  if (unread_prev[`${account}:${theURL}`] == unread[`${account}:${theURL}`]) {
                    unread[`${account}:${theURL}`] = JSON.parse(message).action.unread
                    unread_tokens[`${account}:${theURL}`] = JSON.parse(message).action.unread_chat_tokens
                  } else {
                    if (unread[`${account}:${theURL}`] !== false) {
                      unread_prev[`${account}:${theURL}`] = unread[`${account}:${theURL}`];
                    }
                  }

                  UnreadTray(account,theURL,isForeground, win_main.id[`${account}:${theURL}`].window);
                  unread_prev[`${account}:${theURL}`] = unread[`${account}:${theURL}`]

                  // update title with unread on load
                  if (unread[`${account}:${theURL}`] != 0) {
                    win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread[`${account}:${theURL}`]);
                  } else {
                    win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL);
                  }
                }

                if (JSON.parse(message).action.wake_up_response) {
                  let chat_token = JSON.parse(JSON.parse(message).action.wake_up_response).ocs.data.token;
                  let message_id = JSON.parse(JSON.parse(message).action.wake_up_response).ocs.data.id;
                  let chat_displayName = JSON.parse(JSON.parse(message).action.wake_up_response).ocs.data.actorDisplayName;
                  setTimeout(()=>{
                    try {
                      win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript(`
                        try{
                          editWakeUpMessage('${chat_token}', '${chat_displayName}', '${message_id}', '${i18n.__('wake_up_message')}');
                        }
                        catch(err){
                          console.log(err);
                        }
                      `);
                    }
                    catch(err){
                      writeLog(`Error during editWakeUpMessage: ${err}`)

                    }
                  }, 3000);
                }

                //get incoming message id
                if (JSON.parse(message).action.token) {
                  message = JSON.parse(message)
                  message_link[`${account}:${theURL}`] = '/call/' + message.action.token + '#message_' + message.action.id
                }

                // get notification metadata
                if (JSON.parse(message).action.notification) {
                  try{
                    // fetch transmitted info of win_noti from NC server
                    let win_noti = notificationWindows.id[JSON.parse(message).action.win_noti_id]
                    let data = JSON.parse(message).action.data_parsed
                    let position = JSON.parse(message).action.position
                    let win_index = JSON.parse(message).action.win_index
                    let x_dismiss_all = JSON.parse(message).action.x_dismiss_all
                    let y_dismiss_all = JSON.parse(message).action.y_dismiss_all
                    let account_string = `${account}:${theURL}`;
                    let tag = JSON.parse(message).action.notification.notification_id

                    notification_message_link[`${account_string}:${tag}`] = JSON.parse(message).action.notification.link
                    notification_message_icon[`${account_string}:${tag}`] = JSON.parse(message).action.avatar
                    notification_type[`${account_string}:${tag}`] = JSON.parse(message).action.notification.object_type

                    if (notification_type[`${account_string}:${tag}`] == 'call') {
                      notification_message_link[`${account_string}:${tag}`] += '#direct-call';
                    }

                    if (!notification_message_icon[`${account_string}:${tag}`]) {
                      notification_message_icon[`${account_string}:${tag}`] = '';
                    }

                    let server_icon = undefined;
                    if (isMac) {
                      server_icon = (dockIcon[account_string]) ? dockIcon[account_string] : dockIcon['original_icon'];
                    } else if (isWindows){
                      server_icon = (original_server_icon[`${account_string}-orig-size`]) ? original_server_icon[`${account_string}-orig-size`] : original_icon;
                    } else {
                      server_icon = (original_server_icon[`${account_string}`]) ? original_server_icon[`${account_string}`] : original_icon;
                    }

                    // temp server_color set
                    let server_color = undefined;
                    if (store.get('use_server_theme')) {
                      server_color = win_main.id[`${account_string}`].server_color;
                    }


                    // check if win_main is in not hidden, minimized, unfocused or notification_type is call

                    if (!win_main.id[`${account_string}`].window.isVisible() || win_main.id[`${account_string}`].window.isMinimized() || !win_main.id[`${account_string}`].window.isFocused() ||(notification_type[`${account_string}:${tag}`] == 'call')) {
                      // validate all parameters for showCustomNotification to prevent invisible stale noti_wins
                      win_noti.showInactive();
                      win_noti.webContents.executeJavaScript(`showCustomNotification('${win_noti.id}', '${JSON.stringify(data)}', '${i18n.__('dismiss')}', '${i18n.__('open')}', '${i18n.__('open_title')}', '${theme}', '${server_icon.toDataURL()}', '${notification_message_icon[`${account_string}:${tag}`]}', '${position}', '${win_index}', '${account_string}', '${server_color}','${notification_type[`${account_string}:${tag}`]}')`);

                      // cleanup avatar after notification apper
                      notification_message_icon[`${account_string}:${tag}`] = '';
                      notification_type[`${account_string}:${tag}`] = '';

                      win_noti.webContents.executeJavaScript(`updateDismissTimeout(0)`);

                      if (Object.keys(notificationWindows.id).length > 1) {
                        showDismissAllButton(theme, position, parseInt(x_dismiss_all), parseInt(y_dismiss_all));
                      }

                      checkInactivityInterval[win_noti.id] = setInterval(function() {
                        checkNotiInactivity(win_noti, 1);
                      }, 1000);
                      
                    } else {
                      // prevent invisible notifications in case window is not active/focused/visible
                      forceCloseNoti(win_noti);
                    }
                  }
                  catch(err) {
                    writeLog(err)
                  }
                }

                if (JSON.parse(message).action.notification_get_error) {
                  let index = JSON.parse(message).action.win_noti_id
                  if (logging_cached){
                    writeLog(`Notification with win_noti id ${index} got an error. Trying to close win_noti.`);
                  }
                  forceCloseNoti(notificationWindows.id[index])
                }

                if (JSON.parse(message).action == 'not_alive') {
                  win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL + i18n.__('server_no_response'));
                }

                if (JSON.parse(message).action == 'refresh') {
                  win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL + ' - ' + i18n.__('loading'));
                }
                if (JSON.parse(message).action == 'alive') {
                  if ((unread[`${account}:${theURL}`] != 0) && (unread[`${account}:${theURL}`] != undefined)) {
                    win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL + " - " + i18n.__("unread_messages") + ": " + unread[`${account}:${theURL}`]);
                  } else {
                    win_main.id[`${account}:${theURL}`].window.setTitle(src_title[win_main.id[`${account}:${theURL}`].window.id] + " - " + app.getName() + " v." + app.getVersion()+ " - " + account + " - " + theURL);
                  }
                }

                if (JSON.parse(message).action == 'redirect_to_spreed') {
                  // dirty but it works
                  win_main.id[`${account}:${theURL}`].window.webContents.executeJavaScript('window.location.replace("/apps/spreed")')
                }

                if (JSON.parse(message).action == 'switch_account') {
                  if (!isForegroundLoading) {
                    showRoundRobinAccount(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`]);
                  } else {
                    dialog.showErrorBox(i18n.__('error'), i18n.__('still_loading'));
                  }
                }

                // to force show app window if not logged in
                if (JSON.parse(message).action == 'force_show_app_win') {


                  // dirty but it works
                  if (!win_main.id[`${account}:${theURL}`].window.isVisible() || win_main.id[`${account}:${theURL}`].window.isMinimized() /*|| !win_main.isFocused()*/ ) {
                    win_main.id[`${account}:${theURL}`].window.show();
                    if (isMac) app.dock.show();

                  }
                  // if app is not logged in fallback to login in
                  if (!blockAuthCall) {
                    blockAuthCall = true;
                    checkAuth(win_main.id[`${account}:${theURL}`].window, saved_password, store.get('server_url'), store.get('current_login'));
                    openClientAuth(win_main.id[`${account}:${theURL}`].window, theURL);
                  }

                }

                //get NC color_theme
                if (JSON.parse(message).action.color_theme) {
                  win_main.id[`${account}:${theURL}`].server_color = JSON.parse(message).action.color_theme
                }
                // get NC title
                if (JSON.parse(message).action.nc_title) {
                  win_main.id[`${account}:${theURL}`].server_title = JSON.parse(message).action.nc_title
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
                    if (!auto_login_error) {
                      // ask to retry, exit or check settings?
                      const options = {
                        type: 'question',
                        buttons: [i18n.__('retry'), i18n.__('exit'), i18n.__('check_preferences'), i18n.__('delete_account')],
                        defaultId: 0,
                        title: i18n.__('error'),
                        message: i18n.__('message6', {
                          account: `${account}:${theURL}`
                        }),
                        detail: (cert_error) ? i18n.__('cert_error') + "\n" + i18n.__('message9') : i18n.__('message9'),
                      };

                      if (Object.keys(loginData.accounts).length <= 1) {
                        showAutoRetryDialog(win_main.id[`${account}:${theURL}`].window, options, 20 * 1000);
                      } else {
                        dialog.showErrorBox(i18n.__('error'),i18n.__('message6', {
                          account: `${account}:${theURL}`
                        }));
                      }
                      auto_login_error = true;
                    }
                  } else {
                    // destroy if error occured 
                    if (Object.keys(loginData.accounts).length <= 1) {
                      appIcon.destroy();
                    }
                    
                    if (!prompted) {
                      // ask to retry, exit or check settings?
                      const options = {
                        type: 'error',
                        buttons: [i18n.__('retry'), i18n.__('exit'), i18n.__('check_preferences')/*, i18n.__('continue_credentials')*/],
                        defaultId: 0,
                        title: i18n.__('error'),
                        useHtmlLabel: true,
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
                    }
                  }
                }
              } catch (err) {
                // Don't write this errors in log as they are useless with some json parse issues
                //writeLog(err)
                //app.exit(0);
              }
            }
          })

          // prevent navigation to cloud root after logout and following login
          details = win_main.id[`${account}:${theURL}`].window.webContents.on('will-navigate', (event, redirectUrl) => {

            //preventUnsupportedBrowser(win_main);
            url = this.details.getURL();
            if (!redirectUrl.includes(`${theURL}`)) {
              event.preventDefault();
              if (logging_cached){
                writeLog(`${redirectUrl} is external site. Opening in system browser.`)
              }
              shell.openExternal(redirectUrl);
              return {
                action: 'deny'
              };
            }

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
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win_main.id[`${account}:${theURL}`].window.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              shell.openExternal(redirectUrl);
              return {
                action: 'deny'
              };
            }
          });


          win_main.id[`${account}:${theURL}`].window.webContents.on('devtools-closed', () => {
            mainMenuTemplate[2].submenu[1].label = '🔍  ' + i18n.__("open_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
          })

          win_main.id[`${account}:${theURL}`].window.webContents.on('devtools-opened', () => {
            mainMenuTemplate[2].submenu[1].label = '🔍  ' + i18n.__("close_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
          })

          // ************ events block end ******************

          // Open the DevTools.
          //win_main.id[`${account}:${theURL}`].window.webContents.openDevTools()
        }

        function guiInit(sw) {

          try {

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

            // set ToolTip only once for linux
            if ((isLinux) && (!sw)) {
              appIcon.setToolTip(app.getName() + " v." + app.getVersion());
            }

            if (sw) {
              if (!isLinux) {
                if ((unread[`${store.get('current_login')}:${store.get('server_url')}`] != 0) && (unread[`${store.get('current_login')}:${store.get('server_url')}`] != undefined)) {
                  appIcon.setToolTip(app.getName() + " v." + app.getVersion() + " - " + store.get('current_login') + " - " + store.get('server_url') + " - " + i18n.__("unread_messages") + ": " + unread[`${store.get('current_login')}:${store.get('server_url')}`]);
                } else {
                  appIcon.setToolTip(app.getName() + " v." + app.getVersion() + " - " + store.get('server_url'));
                }
              }
            }

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
                }
              } else {
                let address = input
                if (address.startsWith("http://")) {
                  address = address.replace("http://", "https://");
                }
                // moved to openclientauth function
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
        function setAllowDomains(multiple,address) {
          prompted = true;
          // ask for SSO
          dialog.showMessageBox((Object.keys(win_main?.id).length !== 0) ? win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window : null, {
              type: 'question',
              title: i18n.__('title1'),
              message: i18n.__("message2"),
              buttons: [
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
                if (checkExistedSSO(address)) {
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
          //app.commandLine.appendSwitch('enable-transparent-visuals');
          // commented code below fixes unfocused app menus issue while win resize in linux, but causes slow page renders
          /*app.commandLine.appendSwitch('disable-gpu');
          app.disableHardwareAcceleration();*/
        }
        // no-sandbox to fix of app startup hangs in linux and so on but causes errors to open popup windows and devtools
        //app.commandLine.appendSwitch('no-sandbox');
        app.commandLine.appendSwitch('disable-dev-shm-usage', true);

        // check ignore cert err setting
        if (store.get('ignore_cert_err')) {
          app.commandLine.appendSwitch('ignore-certificate-errors');
        }
        

        app.whenReady().then(async (event) => {
        // below commented code don't work on macos...

          writeLog('PID = ' + process.pid);

          let check_result = false;

          if (!store.get('turn_off_inet_check')) {
            if (logging_cached){
              writeLog(`Checking internet by access ${store.get("inet_check_addr")}`);
            }
            check_result = await checkNetwork([`https://${store.get("inet_check_addr")}`])
          } else {
            if (logging_cached){
              writeLog(`Skipping internet check.`);
            }
            check_result = true;
          }
          

          if (check_result) {
            if (!store.get('turn_off_inet_check')) {
              if (logging_cached){
                writeLog('Internet is available.');
              }
            }
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

            // to detect lock screen and suspend (mac and win)
            
            if (!isLinux) {
              powerMonitor.on('lock-screen', () => {
                isLocked_suspend = true;
                if (logging_cached){
                  writeLog('The screen is locked');
                }
              });
              powerMonitor.on('unlock-screen', () => {
                isLocked_suspend = false;
                if (logging_cached){
                  writeLog('The screen is unlocked.');
                }
                if ((store.get('restart_after_suspend')) && (!isReleased)) {
                  if (logging_cached){
                    writeLog('Force restart app with 10 seconds delay...');
                  }
                  setTimeout(()=>{
                    restartApp();
                  }, 10000)
                }
              });
              powerMonitor.on('suspend', () => {
                isLocked_suspend = true;
                if (logging_cached){
                  writeLog('The system is suspended');
                }
              });
              powerMonitor.on('resume', () => {
                isLocked_suspend = false;
                isReleased = true;
                if (logging_cached){
                  writeLog('The system is released.');
                }
                if (store.get('restart_after_suspend')) {
                  if (logging_cached){
                    writeLog('Force restart app with 10 seconds delay...');
                  }
                  setTimeout(()=>{
                    restartApp();
                  }, 10000)
                }
              });
            } else {
              // to detect lock screen and suspend (linux)
              listenForScreenLockEvents().catch(console.error);
              listenForSuspendEvents().catch(console.error);
            }

            

            // start idle  system monitoring
            //check user permission to input group
            if (isLinux) {
              checkInputGroupMembership()
              .then(isMember => {
                if (isMember) {
                  // Proceed with actions requiring input group permissions
                  if (logging_cached){
                    writeLog(`Start linux system input monitoring using xinput.`)
                  }
                  desktopIdle.startMonitoring();
                } else {
                  if (logging_cached){
                    writeLog(`User does not have 'input' group permissions.`);
                  }
                  // Show error message or disable features
                  dialog.showErrorBox(i18n.__('error'), i18n.__('message25'));
                  app.exit(0);
                }
              })
              .catch(error => {
                writeLog(error)
                app.exit(0);
              });
            } else {
              if (!isWindows) {
                if (logging_cached){
                  writeLog(`Start system input monitoring.`)
                }
                desktopIdle.startMonitoring();
              }
            }
            
                            
            // if no server_url or current_login - try to fetch them and start
            if ((url == "") || (!(store.get('current_login')))) {
              if (logging_cached){
                writeLog("No login or server_url is set. Trying to find any already configured accounts in keytar.")
              }
              let savedCreds = await getCredentials();
              if (savedCreds) {
                if (logging_cached){
                  writeLog("Found configured account(s). Set in config and restart app.")
                }
                getConfiguredAccounts(true);
              } else {
                // run first account add master
                if (logging_cached){
                  writeLog("No configured accounts found in keytar. Running first account adder.")
                }
                setServerUrl(url_example);
              }
            } else {

              if (!store.get('turn_off_inet_check')) {
                if (logging_cached){
                  writeLog(`Checking ${store.get('server_url')}...`);
                }
                check_result = await checkNetwork([store.get('server_url')])
              } else {
                if (logging_cached){
                  writeLog(`Skipping NC server check.`);
                }
                check_result = true;
              }
              
              
              if (check_result) {
                if (!store.get('turn_off_inet_check')) {
                  if (logging_cached){
                    writeLog(`${store.get('server_url')} is available. Continue app loading...`);
                  }
                }

                // check configured sso login with server_url to prevent run of setServerUrl 
                if (store.get('auto_login')) {
                  if (logging_cached){
                    writeLog("Found old auto_login parameter. Change SSO setting to support 1.0 version of NC Talk Electron and restart app.")
                  }
                  store.set('current_login', 'auto_login');
                  store.delete('auto_login');
                  // save autologin as account for server
                  saveCredentials('auto_login','auto_login', url);
                  restartApp();
                }

                url += "/apps/spreed";

                createWindow(store.get('server_url'), store.get('current_login'),false);

                //try to start another configured servers if any
                startForeground();

                // handle Windows shutdown/logout to prevent crush
                if (isWindows) {
                  app.on('before-quit', e => {
                    e.preventDefault();
                  })
                  ShutdownHandler.setWindowHandle(win_main.id[`${store.get('current_login')}:${store.get('server_url')}`].window.getNativeWindowHandle());
                  ShutdownHandler.blockShutdown('');
                  ShutdownHandler.on('shutdown', () => {
                    writeLog('Windows shutdown/logout is detected! Exiting app!');
                    ShutdownHandler.releaseShutdown();
                    store.delete('latestVersion');
                    store.delete('releaseUrl');
                    app.exit(0);
                  })
                }
                guiInit();
              } else {
                if (logging_cached){
                  writeLog(`${store.get('server_url')} is unreachable.`)
                }
                showAccessErrorDialog(i18n.__('message1', {
                  server_url: store.get('server_url')
                }));
              }

            }
          } else {
            if (logging_cached){
              writeLog(`Internet (${store.get("inet_check_addr")}) is unreachable.`)
            }
            showAccessErrorDialog(i18n.__('message22', {
                  inet_check_addr: store.get('inet_check_addr')
                }));
          }
        })

         // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        // !!!! *****  DON NOT REMOVE THIS BLOCK OTHERWISE SOME PROMT LOGIC WILL BE BROKEN  ***** !!!!
        app.on('window-all-closed', function() {

          // 08.06.2024 due to bug in case of new config recreation
          //if (!isMac) app.quit()
        })
        // !!!! ********************************************************************************* !!!!

        app.on('quit', function() {
          if (!isWindows) {
            desktopIdle.stopMonitoring();
          }

          writeLog(app.getName() + " v."+app.getVersion() + ' is exited')

        })

        process.on('SIGTERM', () => {
          /*if (logging_cached){
            writeLog(app.getName() + " v."+app.getVersion() + ' is exited')
          }*/
          app.exit(0);
        })
        process.on('SIGINT', () => {
          /*if (logging_cached){
            writeLog(app.getName() + " v."+app.getVersion() + ' is exited')
          }*/
          app.exit(0);
        })

        // for macos trayIcon dynamic change based on theme
        if (isMac) {
          nativeTheme.on('updated', () => {
            if (logging_cached){
              writeLog(`OS theme is changed to ${nativeTheme.shouldUseDarkColors ? 'dark' : 'light'}. Restart app.`)
            }
            restartApp();
          })
        }

        app.on('login', (event, webContents, request, authInfo, callback) => {
          callback(proxyAgent.proxy.auth.split(':')[0], proxyAgent.proxy.auth.split(':')[1]); //supply credentials to server
        });

        /******************** startup app block *********************/


      } catch (err) {
        dialog.showErrorBox(i18n.__('error'), i18n.__('message12'));
        writeLog(err)
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