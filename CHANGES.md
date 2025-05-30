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
