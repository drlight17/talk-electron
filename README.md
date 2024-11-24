# talk-electron
Simple electron wrapper app for Nextcloud Talk. Learning some nodejs and electron basics while building simple Nextcloud Talk Desktop app for easy enterprise deployment.

![Screenshot](https://github.com/user-attachments/assets/2eab2590-9782-4c2f-b4f1-2805c7b4d4b9)


Sources are mess but it works =)

Planning to use some things from this project as PRs to the [official Nextcloud Talk Desktop app](https://github.com/nextcloud/talk-desktop).

# Minimum OS requirements
MacOS 10.15 Catalina, Windows 7/2008, Linux with modern kernel version (5.x)

# Works with Nextcloud since v.28.x.x and since Talk v.18.x

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
- `locale` - locale country code of app language (default is en)
- `allow_domain` - comma-separated string with the list of SSO allowed domains, * wildcard supported (use "*" only for all domains, but it maybe insecure)
- `always_on_top` - true\false value means to show app main window on top of every other windows (default is false)
- `auto_login` - true\false value means to try auto login (make sure you have configured allow_domain and SSO in NC)

# For developers
Build depends on the platform since 0.2.9-alpha version as it brings support of the system idle detect function.

For Windows:
```
choco install python312 visualstudio2019community visualstudio2019-workload-nativedesktop visualstudio2019buildtools windows-sdk-10.0
pip install setuptools
```
For Linux:
```
apt install libxss-dev pkg-config
```
Platform independent steps:
```
git clone https://github.com/drlight17/talk-electron
cd ./talk-electron
npm install -g node-gyp
npm install --save-dev electron-rebuild
npx electron-rebuild
```
To build win32 x86 (32bit) app remove **node_modules\sharp\\** after previous common commands, use **package.json.win32-ia32** as package.json and run: 
```
npm install --force --platform=win32 --arch=ia32 sharp
```
To run dev app use:
```
npm start 
```

In dev mode config path includes '-dev'

To build distributive use:
```
npm run dist
```
If there are any module errors try to `npx electron-rebuild` before every `npm start` or `npm run dist`.

For more details see [package.json](package.json)




