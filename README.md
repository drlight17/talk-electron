# talk-electron
Simple electron wrapper app for Nextcloud Talk. Learning some nodejs and electron basics while building simple Nextcloud Talk Desktop app for easy enterprise deployment.

Sources are mess but it works =)

Planning to use some things from this project as PRs to the [official Nextcloud Talk Desktop app](https://github.com/nextcloud/talk-desktop).

# Minimum OS requirements
MacOS 10.15 Catalina, Windows 7/2008, Linux with modern kernel version (5.x)

# Tested on Nexcloud v.28.x.x and Talk v.18.x

# Supported settings
All app settings are saved in the local user folder in file config.json:
- MacOS: `~/Library/Application Support/NC Talk Electron`
- Windows 7 and newer: `%AppData%\NC Talk Electron`
- Linux `~/.config/NC Talk Electron`

Supported setting arguments (see example.config.json):
- `server_url` - Nextcloud Server URL with installed Talk application (it is also supported as app CLI argument, use it as <br />`--server_url=http:\\nextcloud.address.com` )
- `app_icon_name` - default application icon path name to use in GUI (dock, taskbar and so on, default is icon.png)
- `notification_icon_name` - notification icon path name to use in app (default is notification.png)
- `start_hidden` - boolean true\false value means to hide app in tray on startup (default is false)
- `show_on_notify` - true\false value means to show app main window on every notification (default is false) (*deprecated since v.0.2.5-alpha, check* `show_on_new_message` *instead boolean*)
- `show_on_new_message` - true\false value means to show app main window on every new message received (default is false)
- `use_server_icon` - boolean true\false value means to use Nextcloud Server logo icon in GUI (dock, taskbar and so on, default is false
- `run_at_startup` - boolean true\false value means to start on system user logon (default is false)
- `allow_domain` - comma-separated string with the list of SSO allowed domains, * wildcard supported (use "*" only for all domains, but it maybe insecure)

# For developers
It as simple as 1,2,3:
```
git clone https://github.com/drlight17/talk-electron
cd ./talk-electron
npm install
```
To run dev app use:
```
npm start 
```
To build distributive use:
```
npm run dist
```
For more details see [package.json](package.json)




