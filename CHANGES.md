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
