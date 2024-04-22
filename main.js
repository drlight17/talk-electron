// Modules to control application life and create native browser window
const { app, clipboard, BrowserWindow, Menu, Tray, nativeImage, Notification, dialog } = require('electron')
const prompt = require('electron-prompt')
//const { Resvg } = require('@resvg/resvg-js')
const fetch = require('electron-fetch').default

const isMac = process.platform === 'darwin'

const fs = require("fs");
const { join } = require('path');
const path = require('node:path');

const Store = require('electron-store');
try { 
  const store = new Store();

  let is_notification = false;

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
        name: app.getName()
    })
  } else {
    app.setLoginItemSettings({
        openAtLogin: false,
        name: app.getName()
    })
  }

  let icon = nativeImage.createFromPath(path.join(__dirname,store.get('app_icon_name')||'iconTemplate.png')); // template with center transparency
  const icon_notification = nativeImage.createFromPath(path.join(__dirname,store.get('notification_icon_name')||'notification.png'));
  //const icon_red_dot = nativeImage.createFromPath(path.join(__dirname,'red_dot.png'));


  //const icon = './icon.png';

  var win = null;
  var appIcon = null;


  let mainMenuTemplate = [
      {
        label: 'Файл',
        submenu: [
          {
            label: 'Настройки',
            click: () => {
              openSettings();
            },
          },
          { type: 'separator' },
          {
            label: 'Выйти',
            accelerator: isMac ? 'Cmd+Q' : 'Alt+X',
            click: () => {
              app.exit(0);
            },
          }
        ]
      },
      {
        label : "Вид",
        submenu : [
          { label : "Обновить", role : "reload" },
          { type: 'separator' },
          { label: 'Свернуть',
            click: () => {
              if (isMac) app.dock.hide();
              win.hide()
            },
            accelerator: isMac ? 'Cmd+H' : 'Ctrl+H',
            role : "hide"
          },
          { label: 'Развернуть',
            accelerator: isMac ? 'Cmd+M' : 'Ctrl+M',
            click: () => {
              win.maximize();
              if (isMac) { /*app.dock.setIcon(icon); */app.dock.show();};
            },
          },
        ]
      },
      {
        label : "?",
        submenu : [

          { label : "Помощь",
            accelerator: 'F1',
            click: () => {
              openPopup('https://docs.nextcloud.com/server/latest/user_manual/ru');
              //app.exit(0);
            }
          },
          { type: 'separator' },
          { label : "О программе",
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
        label: 'Показать',
        click: () => {
          win.show()
          if (isMac) { /*app.dock.setIcon(icon);*/ app.dock.show();};
        },
      },
      {
        label: 'Свернуть',
        click: () => {
          if (isMac) app.dock.hide();
          win.hide()
        },
      },
      { type: 'separator' },
      {
        label: 'Настройки',
        click: () => {
          openSettings();
        },
      },
      { type: 'separator' },
      {
        label: 'Выйти',
        click: () => {
          app.exit(0);
        },
      }
  ];

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
          label: 'Добавить в словарь',
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
          label: 'Скопировать картинку',
          click: () => win.webContents.copyImageAt(params.x, params.y),
        },
        {
          //label: 'Save image',
          label: 'Сохранить картинку',
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
          label: 'Скопировать адрес ссылки',
          click: () => clipboard.writeText(params.linkURL),
        },
        {
          //label: 'Copy link text',
          label: 'Скопировать текст ссылки',
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
          label: 'Скопировать',
          enabled: params.selectionText && params.editFlags.canCopy,
        },
        {
          role: 'cut',
          label: 'Вырезать',
          enabled: params.selectionText && params.isEditable && params.editFlags.canCut,
          visible: params.isEditable,
        },
        {
          role: 'selectAll',
          label: 'Выбрать всё',
          enabled: params.editFlags.canSelectAll,
        },
        {
          role: 'paste',
          label: 'Вставить',
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
        //console.log(code);
        win.webContents.executeJavaScript(`loadSettings(`+JSON.stringify(store.store)+`);`);
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

  function openSettings() {
    let win = new BrowserWindow({
      modal: true,
      icon:icon,
      title:'Настройки',
      width: 500,
      height: 300,
      resizable:false
    })

    win.loadFile('settings.html');
    win.setMenu(null);

    // save app name title
    win.on('page-title-updated', function(e) {
      e.preventDefault()
    });
    win.on('ready-to-show', () => {
      getSettings(win);
      win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        setSettings(message,win);
      });
    });


    //win.webContents.openDevTools()
  }

  function openPopup(url) {
    // check for cloud profile link
    if (url.includes('/u/'))  {
      title = "Профиль"
    } else {
      title = "Помощь"
    }


    let win = new BrowserWindow({
      modal: true,
      icon:icon,
      title:title
    })

    var theUrl = url;

    win.loadURL(theUrl);
    win.setMenu(null);

    // save app name title
    win.on('page-title-updated', function(e) {
      e.preventDefault()
    });

    // add app styling override for cloud
    win.on('ready-to-show', () => {
      win.webContents.insertCSS('#header, div.profile__wrapper div.profile__sidebar div.user-actions,#app-content-vue a[href*="/settings/user"] {display:none!important;}');
      win.webContents.insertCSS('#content-vue { margin-top: 0px!important; height: 100% !important;}');
    })

    // prevent navigation away from help pages
    win.webContents.on('will-navigate', (event,redirectUrl) => {
      // check for nextcloud help urls
      if (!(redirectUrl.includes('docs.nextcloud.com')))  {
        event.preventDefault();
      }

    });
  }

  /*async function convertIcon (icon) {
    const svg = await fs.promises.readFile(join(__dirname, 'notifications.svg'))
    const opts = {
      //background: 'rgba(255, 255, 255, 1)',
      fitTo: {
        mode: 'width',
        value: 256,
      },
    }
    const resvg = new Resvg(svg,opts)
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    console.log(pngBuffer)
    console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
    console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)
    appIcon.setImage(nativeImage.createFromBuffer(icon));
    win.setIcon(nativeImage.createFromBuffer(icon));
  }*/

  function addNotificationToTray () {
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

  }

  function removeNotificationFromTray () {
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

  }

  async function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
      title: app.getName(),
      center: true,
      show: store.get('start_hidden') ? !JSON.parse(store.get('start_hidden')) : true,
      resizable: true,
      icon:icon,
      useContentSize: true,
      webPreferences: {
        enableRemoteModule: true,
        backgroundThrottling: false,
        //preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
      }
    });

    win.setBounds(store.get('bounds'));

    //customize about
    app.setAboutPanelOptions({
      applicationName: app.getName(),
      applicationVersion: "v."+app.getVersion(),
      authors: ["drlight17"],
      version: app.getVersion(),
      copyright: "Lisense AGPLv3 ©2024",
      iconPath: icon
    });

    // to set app.name instead of electron.app.Electron in Windows notifications
    if (!(isMac))
    {
        app.setAppUserModelId(app.name);
    }
    // some things when window is ready
    win.on('ready-to-show', () => {
      // apply context menus
      applyContextMenu(win);

      // load icon from server
      if (store.get('use_server_icon')) {
        //console.log("Let's get server icon")
        let icon_url = store.get('server_url')+"/apps/theming/image/logo";
        const fetchImage = async url => {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          const nodebuffer = Buffer.from(buffer);
          icon = nativeImage.createFromBuffer(nodebuffer)
          let trayIcon = icon.resize({width:16});
          // apply theme to the tray icon
          trayIcon.setTemplateImage(true);
          // set mac dock icon
          if (isMac) app.dock.setIcon(icon);
          appIcon.setImage(trayIcon);
          win.setIcon(icon);
        }
        fetchImage(icon_url);
      }
      // hide dock if win is hidden
      if ((!win.isVisible()) && (isMac)) app.dock.hide();
      // add app styling override
      win.webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8'));
      // Prevent window from closing and quitting app
      // Instead make close simply hide main window
      // Clicking on tray icon will bring back main window
      win.on('close', event => {
          event.preventDefault();
          store.set('bounds', win.getBounds());
          if (isMac) app.dock.hide();
          win.hide();
      })

      // get notification dot status dirty with 1s timeout, TODO place to detect on webContents change
      win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'notification_observer.js')), true)
      win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        try {
          //console.log(JSON.parse(message))
          if (JSON.parse(message).action == 'added') {
            addNotificationToTray(/*JSON.parse(message).icon*/);
          }
          if (JSON.parse(message).action == 'removed') {
            removeNotificationFromTray(/*JSON.parse(message).icon*/);
          }
        }
        catch (err) {
          //console.log(err);
          //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
          //app.exit(0);
        }
        //console.log('renderer console.%s: %s', ['debug', 'info', 'warn', 'error'][level + 1], message);
      });

    })

    win.loadURL(url);

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      win.close();
      appIcon.destroy();
      dialog.showErrorBox('Ошибка','Nextcloud или Talk необходимых версий не найдены!');
      setServerUrl (store.get('server_url')||url_example);
    })

    // check cloud
    win.webContents.on('did-finish-load', function(e) {
      
      win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'nextcloud_check.js')), true)

      win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        try {
          if (JSON.parse(message).action == 'not_found') {
            win.close();
            appIcon.destroy();
            dialog.showErrorBox('Ошибка','Nextcloud или Talk необходимых версий не найдены!');
            //app.exit(0);
            setServerUrl (store.get('server_url')||url_example);
          }

        }
        catch (err) {
          //console.log(err)
          //dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
          //app.exit(0);
        }
      })
    });

    preventUnsupportedBrowser(win);

    // save app name title
    win.on('page-title-updated', function(e) {
      e.preventDefault()
    });

    win.on('show', function () {
      if (isMac) app.dock.setIcon(icon);
      
      if (is_notification) {
        win.setOverlayIcon(icon_notification, 'Есть непрочитанные уведомления');
        if (isMac) {
          // remove badge prior to set new badge!
          app.dock.setBadge('');
          app.dock.setBadge(' ');
        }
      } else {
        win.setOverlayIcon(null, '');
        if (isMac) app.dock.setBadge('');
      }
    })

    // prevent navigation to cloud root after logout and following login
    details = win.webContents.on('will-navigate', (event,redirectUrl) => {
      url = this.details.getURL();


      if (!(redirectUrl.includes('apps/spreed'))) {
        if (redirectUrl.includes('logout')) {
          preventUnsupportedBrowser(win);
          // dirty but it works
          details.executeJavaScript('window.location.replace("'+url+'")')
        }
      }
      // open profile process
      if (redirectUrl.includes('/u/')) {
        event.preventDefault();
        // dirty prevent PageLoaders appear
        win.webContents.insertCSS('#profile span.loading-icon { display:none;}');
        win.webContents.insertCSS('#side-menu-loader-bar { width:0!important;}');
        openPopup(redirectUrl);
      }

    });


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
    // process logo icon for Mac
    let trayIcon = icon.resize({width:16});
    // apply theme to the tray icon
    trayIcon.setTemplateImage(true);
    // set mac dock icon
    if (isMac) app.dock.setIcon(icon);

    let menu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(menu);

    appIcon = new Tray(trayIcon)
    const contextMenu = Menu.buildFromTemplate(appIconMenuTemplate)
    appIcon.setToolTip(app.getName()+" "+app.getVersion());
    appIcon.setContextMenu(contextMenu)


    appIcon.on('click', (event) => {
      if (!isMac) {
        if (win.isVisible() && !win.isMinimized()) {
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
      if (isMac) app.dock.setIcon(icon);
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      //if (win.getAllWindows().length === 0) createWindow()

    })
  }

  // set server_url prompt
  function setServerUrl (server_url) {
    // show input box for server address
    prompt({
      title: 'Запрос адреса сервера Nextcloud',
      label: 'Введите адрес сервера Nextcloud:',
      buttonLabels: '',
      value: server_url,
      inputAttrs: {
        type: 'url'
      },
      type: 'input',
      icon: icon,
      height : 200
    })
    .then((address) => {
      if(address === null) {
        app.exit(0);
      } else {
        store.set('server_url',address)
        url = address+"/apps/spreed"
        createWindow();
        /*if (!win.isVisible()) {
          createWindow();
        } */
        //if (!gui_initiated) {
        guiInit();
        //}
      }
    })
    .catch((err) => {
      //console.log(err)
      dialog.showErrorBox('Ошибка', "Подробнее: "+JSON.stringify(err));
      app.exit(0);
    });
  }

  /******************** startup app block *********************/

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    if (url == "") {
      setServerUrl(url_example);
    } else {
      url += "/apps/spreed";
      createWindow();
      guiInit();
    }
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', function () {
    if (!isMac) app.quit()
  })

  /******************** startup app block *********************/


}
catch (err) {
  dialog.showErrorBox('Ошибка', 'Файл config.json поврежден! Он будет пересоздан!');
  //fs.promises.copyFile(path.join(__dirname, 'config.json')
  fs.unlinkSync(app.getPath('userData')+"/config.json")
  app.relaunch();
  app.exit()
}
