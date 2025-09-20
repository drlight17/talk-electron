0.6.1
- [x] BUG(macos): fix strange behaviour of any win_ with traffic lights buttons - leave only close button as 
- [x] BUG(macos): if close win while any other win_ is opened then win_ won't be accessible anymore (only app restart) - leave only close button, prevent use of main (modal mode for macos?)

0.6.0
- [x] NEW: global proxy detect with url and port fetch
- [x] BUG: delayed donateClick at first runeven with started licensing flow
- [x] NEW: app theme force to NC
- [x] BUG(macos): don't intercept focus on notification appear
- [x] BUG: notification with long no-spaces string force css ellipsis (check multiple long lines also!!)
- [x] NEW: donate messagebox using browserWindow with IPC
- [x] BUG: fullscreen button logic interferes with blurred logic of app and avatar icon menu
- [x] NEW: show license info in about panel
- [x] NEW: show donation button also in tray menu
- [x] BUG: add custom ca cert for license server requests (in config.json set 'custom_ca_cert', place cert to app root folder)
- [x] BUG: ocs api requests to theme and lang require password
- [x] NEW: license_server_url variable to override default license server (no gui for now)
- [x] handle connection errors in case of proxy connection
- [x] NEW (gui): store proxy login and password in keytar using settings.html
- [x] electron loadURL and electron-fetch proxy credentials provide
- [x] handle proxy with no auth aprovided (settings also)
- [x] get wss connection errors in console and show error messagebox once
- [x] BUG: multiple connection error can appear
- [x] BUG: proxy websocket connectivity fix
- [x] NEW: dismiss all button for notification with 0s timeout if there more then 1 notification
- [x] NEW: styling of dismiss all button and multiple notifications
- [x] NEW: detect if mainWindow is focused after notification with 0s timeout appeared - auto dismiss all notifications (with 5s delay)
- [x] NEW: add button "Need mobile client?" with ios and android app links in window menu
- [x] BUG(macos): "Need mobile client" is not shown
- [x] NEW: some GUI icons
- [x] NEW: donate $ button in window menu
- [x] NEW: ability to cancel license key request (delete key_licence from store) in warn dialog (prompt)
- [x] BUG: forced checkLicense messageboxes localization
- [x] NEW: donate dialog of non activated app every 7 days
- [x] NEW: cache license check once in hour
- [x] BUG: app browser locale sync with app locale
- [x] NEW: notification sound setting
- [x] NEW: organize settings menu (appearance, connection, notifications,behaviour)
- [x] NEW: fadeout effect at notification during timer
- [x] NEW: change notification appearance to telegram like
- [x] BUG: adopt to NC 31.x.x
- [x] NEW: settings window appearance decor
- [x] BUG: double notification on call'
- [x] BUG: autologin handle in case of proxy connection refuse
- [x] BUG: force close call in dialog if call has changed status from 'call_started' to 'call_ended' or 'call_missed'
- [x] NEW: turn off notifications checkbox
- [x] BUG: place all browserWindow instances (settings,notifications, picker) on the same display as app main window
- [x] BUG: some call dialog and related window behaviour and animations
- [x] BUG: isLoading block for logout and settings
- [x] NEW: auto retry with timeout in case of connection error
- [x] BUG: navi-menu blurred background content fix for \[ 910; 1024 \] px width
- [x] BUG: cleanup avatar in notifications after use
- [x] BUG: multiple "update available" windows

0.5.1-alpha
- [x] NEW: error message instead of whitescreen in main win in case of connection error
- [x] BUG: main window shows (got focused) after notification dismiss if main window is visible -- workaround: show notification only if main window is hidden, minimized or unfocused
- [x] BUG: validate server_url to protect against unhandled exceptions
- [x] NEW: loading screen for main and settings browserWindows
- [x] BUG: fallback notification avatar in case of no icon fetched (not a message)
- [x] BUG: fix notification layout for long messages and titles
- [x] BUG: deal with chats menu autohide when click on chat context menu (...) and **in new NC version** when click on chats show with no mouse movement
- [x] NEW: blur chat zone in narrow window when navi menu is opened (#app-content-vue {filter: blur(10px); pointer-events: none})
- [x] BUG(macos): x64 dist build is not working on the Apple Silicon CPU (xcode errors) - use ` "build": {
    "npmRebuild": false,` in package.json

0.5.0-alpha

- [x] BUG: [no win show on notification click](https://stackoverflow.com/questions/59898127/electron-notifications-dont-bring-app-up-to-front-again-on-click-on-the-notific)
- [x] NEW: [self-hosted unread notifications supresses notifications from NC](https://community.openhab.org/t/self-hosted-notifications-with-nextcloud-talk/144090); test in Win and Macos
- [x] don't hide notification while cursor hover
- [x] add avatar to notifications
- [x] NEW: add dark theme to all html templates based on current NC theme
- [x] NEW: theme setting
- [x] BUG: ask for further actions (retry, exit, check settings and checkbox to remember decision) if server couldn't be reached instead of run "enter server url" again
- [x] NEW: get caller avatar and place it as icon in call dialog (npm puppeteer module used to process avatar image)
- [x] NEW: remake "update available" to appear in other then main menu place
- [x] BUG: fix center vertical align of "write message" box

0.4.1-alpha

- [x] NEW: save and process credentials for different server_urls to prevent token loose in case of change server_url
- [x] NEW: open corresponding chat when show_on_new_message if true (use localStorage unreadMessages !=0 -> cachedConversations -> lastMessage -> **id** and **token** to form link
- [x] BUG(macos): make "hide" menu button unavailable in main
- [x] BUG: sso login form appears if there was page reload due to user activity and  there were network issues (cloud wasn't reachable)
- [x] NEW: force online status through OCS API instead of page reload every 4 minutes
- [x] BUG(macos): app shows NC login page after sleep/long lock (check ribbons - force restart app on unlock mac?)
- [x] NEW: if there is no way to SSO login ask user instead of just redirect to server_url (retry, exit, open config) - find "message6"
- [x] NEW: move logging to preferences

0.4.0-alpha

- [x] NEW: authentication via NC flow v2 with access token (keytar node module to save access token)
- [x] BUG: force logged out to main menu and tray menu if no credentials
- [x] BUG: force http to https rewrite in saved server_url
- [x] NEW: AppImage restart app with forced EPIPE error prevention (updated ribbons-electron fix for talk-electron)
- [x] NEW: logging function
- [x] NEW: implement screenshare object picking html menu
- [x] BUG: call dialog with the name of someone you call appears in case of calling this someone
- [x] BUG: wrong call join appear in case of refresh after call without chat change
- [x] BUG: hide logout button in NC and add logout button in file and taskbar menu (it deletes saved token and restart app)
- [x] BUG: sometimes unread counter don't show anything if logged in using token in hidden or if logged out present old unread values (need to clear localStorage on every logout flow)
- [x] BUG: force openClientAuth in case of revoked token and refreshed app (ctrl+R or activity triggered)
- [x] BUG: check new version with period in running app
- [x] BUG: show left panel button doesn't work after Talk upgrade 20.1.6
- [x] BUG: user menu is broken after Talk upgrade 20.1.6
- [x] BUG (macos): fix sharp module error (package version sould be. "^0.32" )
- [x] BUG (linux): new kde (5.27.x) startup wrong line parse

0.3.0-alpha

- [x] BUG: show\_on\_new_message in hidden to taskbar window state
- [x] NEW: incoming call hook with dialog to answer
- [x] BUG: appIcon click closes unfocused win
- [x] BUG: screenshare cause DOM error in console and not working
- [x] BUG: (macos) new run\_at\_startup function
- [x] BUG: iconPath fix for about menu

0.2.9-alpha

- [x] NEW: system-idle-time for away status prevent in hidden and unfocused app
- [x] BUG: clear localstorage cachedConversations if logged out to clear unread counter
- [x] BUG: remove seguibli.ttf (Segoe UI Black Italic (TrueType)) font requrement from app (force sans-serif font ?)
- [x] GUI: check new version (show in about menu)
- [x] cache new version in store
- [x] BUG: (macos) turn off minimize window button to prevent unpredictable behaviour
- [x] BUG: (macos) white server icon on restore and unread
- [x] (macos) no unread counter badge in dock - check OS permissions for badge and notifications
- [x] BUG: waiting for 2nd unread console message to update unread in app places

0.2.8-alpha

- [x] BUG: do not hide search
- [x] do not hide #contactsmenu
- [x] BUG: in popup window check already opened window before open it again (show_on_new_message func)
- [x] BUG: profile browserWindow - show tel and other info
- [x] BUG: slow down alive check (to 10s?)
- [x] BUG: unread counter drops when dialog icons with counter is not visible in gui
- [x] add dev separate conf folder
- [x] BUG: remove version from autorun (Mac/Win)

0.2.7-alpha

- [x] SSO NC openid call from app observer instead of server side js script (with option to try auto login)
- [x] BUG (linux): try to create autostart + check if there is autostart created
- [x] add new auto_login setting in README
- [x] BUG: settings css GUI fix
- [x] IMPROVE: close navi menu when narrow width window (<= 1024 px) and focus is lost
- [x] BUG: (linux) openAtLogin as creation/deletion of talk-electron.desktop file with the following content in ~/.config/autostart:

0.2.6-alpha

- [x] show NC version in about, window title and tray title
- [x] localization support 
- [x] close navi menu when narrow width window (< 512 px) and focus is lost
- [x] GUI: show app window if not logged in at startup    
- [x] BUG: close navi menu when upload file

0.2.5-alpha

- [x] BUG: broken context menu (right-click double click) with Nexctloud 29
- [x] BUG: no white unread counter in tray, only empty red badge (linux)
- [x] add badged app icon to taskbar (linux, test on VM at work)
- [x] BUG: memory leak due to multiple loading windows
- [x] BUG: force open Talk after logout and login fix
- [x] add server address to app windows title and tray title
- [x] BUG: delayed page refresh after reload loader disappear (macos only?)
- [x] error hadle if no connection with NC or Talk (pinger) - add spinner
- [x] always on the top option
- [x] BUG: fix light/dark nextcloud style "Open Nextcloud" link in user menu
- [x] BUG: fix macos theme taskbar icon (make sure to [turn off macos taskbar transparency](https://discussions.apple.com/thread/254896301?answerId=259117195022#259117195022) to proper usage)
- [x] show number of notifications on icon
- [x] BUG: double reload after login only apperas in case of non-cookie session login (SSO for example)
- [x] BUG: if show_on_new_message is true - show on every new message
- [x] electron promts for server and allow domains input
- [x] replace notification process by the number of unread messages
- [x] BUG: no notifications in hidden app after dismissed notifications

0.2.4-alpha

- [x] BUG: close navi menu when create new conference or settings clicked (maybe add auto close navi on every non navi click or action?)
- [x] BUG: on pinned/maximized main window hide (not close) it opens again (windows)
- [x] ia32 win version

0.2.3-alpha

- [x] BUG: process no spreed app found (404) in nextcloud_check.js
- [x] add access to user settings of NC from the app user-menu
- [x] BUG: make all new windows only one instance (single)
- [x] BUG: change devtools toggle label on devtools close

0.2.2-alpha

- [x] BUG: close navi menu when user-menu clicked
- [x] BUG: fix iconPath in linux and windows
- [x] toggle devtools on F12 and in main menu
- [x] process maximize and unmaximize main window

0.2.1-alpha

- [x] BUG: user input blocks (mouse, keyboard) in case of narrow width window (< 512 px) after resize. 
and in case of opened conversations list menu with narrow width window (< 512 px). Prevent resize to less then 512px because of [12236](https://github.com/nextcloud/spreed/issues/12236) and others.
- [x] BUG: prevent running multiple app instances

0.2.0-alpha

- [x] add NTLM/kerberos SSO support
- [x] BUG: NC link add multiple times in user-menu
- [x] help link change to Talk
- [x] go to Nextcloud link/button in GUI menus
- [x] save maximized and pinned main window bounds and size
- [x] open new links in default system browser instead of electron app (files for example)
- [x] app prevents OS logout and crashes with error in this case:(use electron-shutdown-handler but [no ia32 support for now](https://github.com/paymoapp/electron-shutdown-handler/issues/8))

0.1.1-alpha

- [x] Help (F1) open htps://docs.nextcloud.com/server/latest/user_manual/ru in new modal
- [x] [auto start option](https://www.electronjs.org/docs/latest/api/app#appsetloginitemsettingssettings-macos-windows)
- [x] settings menu
- [x] initial context menu for some text and link operations
- [x] dialog to fix server_url if url error appears
- [x] check NC version on start (logged in and logged out)
- [x] save win bounds
- [x] config.json for installer or config launch parametres?
- [x] add talk app icon
- [x] ability to get app icon from cloud server
- [x] set server_url dialog if not set
- [x] check loaded cloud or throw error
- [x] respect existed config.json
- [x] pre-process logo icon for Mac client
- [x] prevent NC loading stripe on profile link click
- [x] unsupported browser localstorage addition on logout to prevent message appear when login
- [x] add profile and help titles to openPopup windows
- [x] no taskbar icon in mac compiled app
- [x] remove other gui elements that lead out from /apps/spreed
- [x] force /apps/spreed path after logout and following login (or remove logout from user menu)
- [x] config file to read some options from (like server url and so on)
- [x] make notification symbol on app icon smaller
- [x] add notification symbol to trayIcon if notification happened (~~check notify icon in NC BrowserWindow~~ on some event)
- [x] about for linux
- [x] browser notification process (calling, new messages)
- [x] override help->about with app version and name
