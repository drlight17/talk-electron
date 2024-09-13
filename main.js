// Modules to control application life and create native browser window

const prompt = require('electron-prompt');

const sharp = require('sharp');

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
const { app, clipboard, BrowserWindow, Menu, Tray, nativeImage, Notification, dialog, session, shell, powerMonitor, nativeTheme } = require('electron')

const fs = require("fs");
const { join } = require('path');
const path = require('node:path');

const Store = require('electron-store');

const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

const gotTheLock = app.requestSingleInstanceLock();

try {
  var i18n = new(require('./translations/i18n'));

  main();

  async function main() {
    // prevent multiple instances, focus on the existed app instead
    if (!gotTheLock) {
      app.exit(0);
    } else {
        app.on('second-instance', (event) => {
        if (win) {
          //if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      })

      try {
        const store = new Store();
        // to check prompted status for dialogs
        let prompted = false
        // to check gui_blocked status
        //let gui_blocked = false
        //let is_notification = false;
        // for storing unread counter
        let unread = false;
        // to store settings menu opened status
        let settings_opened = false;

        let url = "";
        const url_example = 'http://cloud.example.com';

        if (!((app.commandLine.getSwitchValue("server_url") == undefined) || (app.commandLine.getSwitchValue("server_url") == ""))) {
          // overwrite server_url if arg is given
          store.set('server_url',app.commandLine.getSwitchValue("server_url"))
          url = app.commandLine.getSwitchValue("server_url");
        } else if (!((store.get('server_url') == undefined) || (store.get('server_url') == ""))) {
          url = store.get('server_url');
        }


        // set run at startup
        if (store.get('run_at_startup')) {
          app.setLoginItemSettings({
              openAtLogin: true,
              name: app.getName() + " v."+app.getVersion()
          })
        } else {
          app.setLoginItemSettings({
              openAtLogin: false,
              name: app.getName() + " v."+app.getVersion()
          })
        }
        let iconPath = path.join(__dirname,store.get('app_icon_name')||'iconTemplate.png');
        let icon = nativeImage.createFromPath(iconPath); // template with center transparency
        let trayIcon = icon

        if (isMac) {
          var icon_bw = await bw_icon_process(icon);
          // as this icon is for macos tray only resize it here
          icon_bw = icon_bw.resize({width:16});
        }
        //icon = icon_bw

        const icon_notification = nativeImage.createFromPath(path.join(__dirname,store.get('notification_icon_name')||'notification.png'));
        //const icon_red_dot = nativeImage.createFromPath(path.join(__dirname,'red_dot.png'));


        //const icon = './icon.png';



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
                  label: i18n.__('exit'),
                  accelerator: isMac ? 'Cmd+Q' : 'Alt+X',
                  click: () => {
                    store.set('bounds', win.getBounds());
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
                    win.hide()
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
                if (isMac) { /*app.dock.setIcon(icon);*/ app.dock.show();};
              },
            },
            {
              label: i18n.__('hide'),
              click: () => {
                if (isMac) app.dock.hide();
                win.hide()
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
            { type: 'separator' },
            {
              label: i18n.__('exit'),
              click: () => {
                store.set('bounds', win.getBounds());
                app.exit(0);
              },
            }
        ];

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
        }

        function localizeSettings(win) {
          //win.webContents.toggleDevTools();
          win.webContents.executeJavaScript(`get_all_ids();`);
          win.webContents.on('console-message', (event, level, message, line, sourceId) => {
            try {
              if (JSON.parse(message).action == 'return_localize_ids') {
                obj = JSON.parse(JSON.parse(message).localization_ids);
                obj.forEach( id => {
                  let setting_loc= i18n.__(id.replace('_id',''))
                  win.webContents.executeJavaScript(`localize_setting("`+id+`","`+setting_loc+`");`);

                  // localization of allow_domain_id title
                  if (id == 'allow_domain_id') {
                    id = id.replace('_id','_title')
                    let setting_loc= i18n.__(id.replace('_id','_title'))
                    win.webContents.executeJavaScript(`localize_setting("`+id+`","`+setting_loc+`");`);
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

        function setSettings(message,win) {
              try {
                if (JSON.parse(message).action == 'save_settings') {
                  obj = JSON.parse(JSON.parse(message).settings);
                  for (var key in obj){
                    store.set(key, obj[key]);
                  }
                  //win.close();
                  app.relaunch();
                  app.exit(0);
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


        function openSettings() {
          if (!(settings_opened)) {
            let win_settings = new BrowserWindow({
              modal: !isMac,
              icon:icon,
              title:i18n.__('preferences'),
              width: 500,
              height: 300,
              resizable:false,
              parent: win
            })

            win_settings.loadFile('settings.html');
            win_settings.setMenu(null);


            // save app name title
            win_settings.on('page-title-updated', function(e) {
              e.preventDefault()
            });

            win_settings.once('ready-to-show', () => {
              if (isMac) {
                win.show();
                app.dock.show();
              }
              localizeSettings(win_settings);
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

        function openPopup(url) {
          // check for cloud profile link
          let allow_navi = false;
          if (url.includes('/settings/user')) {
            title = i18n.__("user_settings") + " - " + store.get('server_url');
            allow_navi = true;
          } else if (url.includes('/u/'))  {
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

          //block_gui_loading(false);

          // save app name title
          win_popup.on('page-title-updated', function(e) {
            e.preventDefault()
          });

          // add app styling override for cloud
          win_popup.on('ready-to-show', () => {
            win_popup.show();
            win_popup.webContents.insertCSS('#app-content div.admin.access__section, #app-content div.shared.access__section, #app-content .social-button, #header, div.profile__wrapper div.profile__sidebar div.user-actions,#app-content-vue a[href*="/settings/user"] {display:none!important;}');
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
              app.dock.setBadge('');
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
              app.dock.setBadge(unread.toString());
            }
            //is_notification = true;
            if (store.get('show_on_new_message')) {
              win.show();
              if (isMac) app.dock.show();
            }
            if ((!removed)&&(!win.isFocused())) {
              win.flashFrame(true);
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

          // for SSO setting, allowed domains
          if (store.get('allow_domain')) {
            session.defaultSession.allowNTLMCredentialsForDomains(store.get('allow_domain'));
          }

          // Create the browser window.
          win = new BrowserWindow({
            title: app.getName() + " v."+app.getVersion() + " - " + store.get('server_url'),
            center: true,
            show: store.get('start_hidden') ? !JSON.parse(store.get('start_hidden')) : true,
            resizable: true,
            minWidth: 512, // temporary restrict min window width by 512px,
            // see issues https://github.com/nextcloud/spreed/issues/12236
            // https://github.com/nextcloud/spreed/issues/11454
            icon:icon,
            useContentSize: true,
            webPreferences: {
              enableRemoteModule: true,
              backgroundThrottling: false,
              //preload: path.join(__dirname, 'preload.js'),
              nodeIntegration: true,
            }
          });

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

            if (isMac) app.dock.setIcon(icon);
            //if (is_notification) {
            if (unread != 0) {
              createBadge(unread,"taskbar");
              //win.setOverlayIcon(icon_notification, 'Есть непрочитанные уведомления');
              if (isMac) {
                // remove badge prior to set new badge!
                app.dock.setBadge('');
                //console.log(unread)
                app.dock.setBadge(unread.toString());
              }
            } else {
              win.setOverlayIcon(null, '');
              if (isMac) app.dock.setBadge('');
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


                // apply theme to the tray icon - don't apply
                //trayIcon.setTemplateImage(true);
                // set mac dock icon
                if (isMac) {
                  icon_bw = await bw_icon_process(icon);
                  trayIcon = icon_bw.resize({width:16});
                  app.dock.setIcon(icon);
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

          win.loadURL(url);

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
            if (!gui_blocked) {
              block_gui_loading(true);
            }
          });*/

          // check cloud
          win.webContents.on('did-finish-load', function(e) {

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

            /*if (gui_blocked) {
              block_gui_loading(false);
            }*/

          });

          /*win.webContents.on('unresponsive', function(e) {
            if (!gui_blocked) {
              block_gui_loading(true);
              win.setTitle(app.getName() + ' - Приложение не отвечает...');
            }
          })
          win.webContents.on('responsive', function(e) {
            if (gui_blocked) {
              block_gui_loading(false);
              win.reload();
            }
          })*/

          win.webContents.on('console-message', (event, level, message, line, sourceId) => {
            try {
              //console.log(JSON.parse(message))
              // get current nextcloud lang
              /*if (JSON.parse(message).cur_nc_lang !== undefined) {
                //console.log(JSON.parse(message).cur_nc_lang)
                let user_settings_link = i18n.__('user_settings_link',JSON.parse(message).cur_nc_lang)

                win.webContents.executeJavaScript(`localize_setting("`+id+`","`+setting_loc+`");`);
              }*/

              if (JSON.parse(message).action.unread || (JSON.parse(message).action.unread === 0)) {
                //console.log(JSON.parse(message).action.unread)
                unread = JSON.parse(message).action.unread
                removed = JSON.parse(message).action.removed
                UnreadTray(unread,removed);
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
                win.show();
                //win.webContents.executeJavaScript('window.location.replace("/apps/spreed")')
              }
              /*if (JSON.parse(message).action == 'added') {
                addNotificationToTray();
              }
              if (JSON.parse(message).action == 'removed') {
                removeNotificationFromTray();
              }*/
              if (JSON.parse(message).action == 'not_found') {
                win.close();
                appIcon.destroy();
                if (!prompted) {
                  dialog.showErrorBox(i18n.__('error'),i18n.__('message1'));
                  //app.exit(0);
                  setServerUrl (store.get('server_url')||url_example);
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
            }
            // open profile settings
            if (redirectUrl.includes('/settings/user')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              openPopup(redirectUrl);
            }

            // open files process
            if (redirectUrl.includes('/f/')) {
              event.preventDefault();
              // dirty prevent PageLoaders appear
              win.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');

              shell.openExternal(redirectUrl);
              return { action: 'deny' };
            }
          });


          win.webContents.on('devtools-closed', () => {
            mainMenuTemplate[2].submenu[1].label = i18n.__("open_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
          })

          win.webContents.on('devtools-opened', () => {
            mainMenuTemplate[2].submenu[1].label = i18n.__("close_devtools");
            MainMenu = Menu.buildFromTemplate(mainMenuTemplate);
            Menu.setApplicationMenu(MainMenu);
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
            app.dock.setIcon(icon);
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
              if (win.isVisible() && !win.isMinimized()) {
                win.hide()
                //win_loading.hide();
              } else {
                /*if (gui_blocked) {
                  win_loading.show();
                }*/
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
            if (isMac) app.dock.setIcon(icon);
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
                createWindow();
                guiInit();
                prompted = false;
              }

              // if yes
              if (result.response === 0) {
                //console.log('The "Yes" button was pressed (main process)');
                // show input box for allow domains
                prompt({
                  title: i18n.__('title2'),
                  label: i18n.__('message3'),
                  useHtmlLabel: true,
                  buttonLabels: '',
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
                  console.log(err)
                  dialog.showErrorBox(i18n.__('error'), i18n.__("more")+JSON.stringify(err));
                  app.exit(0);
                });
              }
          })
        }


        // set server_url prompt
        function setServerUrl (server_url) {
          prompted = true;
          // show input box for server address
          prompt({
            title: i18n.__('title3'),
            label: i18n.__('message4'),
            buttonLabels: '',
            value: server_url,
            type: 'input',
            inputAttrs: {
              type: 'url',
              required: true
            },
            icon: icon,
            height : 200
          }, win)
          .then((input) => {
            if(input === null) {
              app.exit(0);
            } else {
              let address = input
              store.set('server_url',address)
              url = address+"/apps/spreed"
              setAllowDomains();
              /*createWindow();
              guiInit();
              prompted = false;*/

            }
          })
          .catch((err) => {
            console.log(err)
            dialog.showErrorBox(i18n.__('error'), i18n.__("more")+JSON.stringify(err));
            app.exit(0);
          });
        }

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

          console.log('PID =', process.pid);

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
                console.log('Shutdown/logout is detected! Exiting app!');
                ShutdownHandler.releaseShutdown();
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
        console.log(err)
        dialog.showErrorBox(i18n.__('error'), i18n.__('message5'));
        fs.unlinkSync(app.getPath('userData')+"/config.json")
        app.relaunch();
        app.exit()
      }
    }
  }
}
catch (err) {
  console.log(err);
  app.exit(0);
}


