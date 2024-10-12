0.2.8-alpha (last single profile release)

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
