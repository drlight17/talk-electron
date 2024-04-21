# talk-electron
Simple electron wrapper app for Nextcloud Talk. Learning some nodejs and electron basics while building simple Nextcloud Talk Desktop app for easy enterprise deployment.

Sources are mess but it works =)

Planning to use some things from this project as PRs to the [official Nextcloud Talk Desktop app](https://github.com/nextcloud/talk-desktop).

# Minimum OS requirements
MacOS 10.15 Catalina, Windows 7/2008, Linux with modern kernel version (5.x)

# Supported settings
All app settings are saved in the local user folder in file config.json:
- MacOS: `~/Library/Application Support/NC Talk Electron`
- Windows 7 and newer: `%AppData%\NC Talk Electron`
- Linux `~/.config/NC Talk Electron`

Supported setting arguments (see example.config.json):
- `server_url` - Nextcloud Server URL with installed Talk application (it is also supported as app CLI argument, use it as `--server_url=http:\\nextcloud.address.com`)
- `app_icon_name` - default application icon path name to use in GUI (dock, taskbar and so on, default is icon.png)
- `notification_icon_name` - notification icon path name to use in app (default is notification.png)
- `start_hidden` - boolean true\false value means to hide app in tray on startup (default is false)
- `show_on_notify` -  boolean true\false value means to show app main window on every notification (default is false)
- `use_server_icon` - boolean true\false value means to use Nextcloud Server logo icon in GUI (dock, taskbar and so on, default is false

