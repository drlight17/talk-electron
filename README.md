# NC Talk Electron
Electron wrapper app for Nextcloud Talk. Learning some nodejs and electron basics while building Nextcloud Talk Desktop app for easy enterprise deployment.

![Screenshot](https://github.com/user-attachments/assets/3fd6a5b6-2f92-45a3-a5e8-50c3e7e85fa1)

Sources are mess but it works =)

Check my app if you are unsatisfied by [official Nextcloud Talk Desktop app](https://github.com/nextcloud/talk-desktop).

# Minimum OS requirements
MacOS 10.15 Catalina, Windows 7/2008, Linux with modern kernel version (5.x) - all x64 compatible only, no more 32-bit support (since 0.5.1-alpha)

## Works correctly with Nextcloud since v.28.x.x till v.31.x.x and since Talk v.18.x till v.21.x.x

# 📦 Download

| Platform   | Type | Download link                               |
|-------------|--------------|---------------------------------------------------|
| 🖥 Windows x64   | `.msi`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/NC.Talk.Electron.0.6.3.msi)   |
| 🐧 Debian/Ubuntu Linux x64    | `.deb`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/talk-electron_0.6.3_amd64.deb)     |
| 🐧 RHEL/Fedora Linux x64    | `.rpm`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/talk-electron-0.6.3.x86_64.rpm)    |
| 🐧 Linux AppImage x64   | `.AppImage`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/NC.Talk.Electron-0.6.3.AppImage)     |
| 🌐 Linux Archive x64      | `.tar.gz`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/talk-electron-0.6.3.tar.gz)      |
| 🌐 Windows Archive x64      | `.zip`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/NC.Talk.Electron-0.6.3-win.zip)       |
| 🍎 macOS DMG x64   | `.dmg`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/NC.Talk.Electron-0.6.3.dmg)     |
| 🍎 macOS DMG arm64   | `.dmg`       | [Download](https://github.com/drlight17/talk-electron/releases/latest/download/NC.Talk.Electron-0.6.3-arm64.dmg)     |


---
## 📂 How to install?
1. Choose your platform distrib.
2. Click download.
3. Follow installation.

# ⚙️ Supported settings
All app settings are saved in the local user folder in file config.json:
- MacOS: `~/Library/Application Support/NC Talk Electron`
- Windows 7 and newer: `%AppData%\NC Talk Electron`
- Linux `~/.config/NC Talk Electron`

Supported setting arguments (see example.config.json):
- `server_url` - Nextcloud Server URL with installed Talk application (it is also supported as app CLI argument, use it as <br />`--server_url=http:\\nextcloud.address.com` )
- `start_hidden` - boolean true\false value means to hide app in tray on startup (default is false)
- `app_icon_name` - default application icon path name to use in GUI (dock, taskbar and so on, default is icon.png)
- `show_on_notify` - true\false value means to show app main window on every notification (default is false) (*deprecated since v.0.2.5-alpha, check* `show_on_new_message` *instead boolean*)
- `show_on_new_message` - true\false value means to show app main window on every new message received (default is false)
- `use_server_icon` - boolean true\false value means to use Nextcloud Server logo icon in GUI (dock, taskbar and so on, default is false
- `run_at_startup` - boolean true\false value means to start on system user logon (default is false)
- `locale` - locale country code of app language (default is en)
- `allow_domain` - comma-separated string with the list of SSO allowed domains, * wildcard supported (use "*" only for all domains, but it maybe insecure)
- `always_on_top` - true\false value means to show app main window on top of every other windows (default is false)
- `auto_login` - true\false value means to try auto login (make sure you have configured allow_domain and SSO in NC)
- `logging` - boolean true\false value means to save application logs to the file app.log in local user folder (nearby config.json)
- `theme` - application theme (dark, light, auto; default is auto)
- `notification_timeout` - time period of notification show (in seconds, 0 - means to wait of user action) (*deprecated since v.0.6.0, check* `notification_timeout_checkbox` *instead boolean*)
- `notification_timeout_checkbox` - true\false value means to allow notifications in app (default is true)
- `notification_sys_checkbox` - true\false value means to use system based notification instead of app internal (default is false)
- `notification_position` - bottom-right\bottom-left\top-right\top-left value means the position of app internal nitifications (default is bottom-right)
- `notification_muted` - true\false value means to mute all sounds from notifications and calls in app (default is false)

# 🔨 For developers
Build depends on the platform since 0.2.9-alpha version as it brings support of the system idle detect function.

For Windows:
```
choco install python312 visualstudio2019community visualstudio2019-workload-nativedesktop visualstudio2019buildtools windows-sdk-10.0
pip install setuptools
git clone https://github.com/drlight17/talk-electron
cd ./talk-electron
cp ./package.json.windows ./package.json
```
For Linux:
```
apt install libxss-dev pkg-config
git clone https://github.com/drlight17/talk-electron
cd ./talk-electron
cp ./package.json.linux ./package.json
```
For Macos:
```
git clone https://github.com/drlight17/talk-electron
cd ./talk-electron
cp ./package.json.windows ./package.json
```
Platform independent steps:
```
npm install -g node-gyp
npm install --save-dev electron-rebuild
npx electron-rebuild
```
OR run `prepare.sh`

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

Also check [package.json.linux](package.json.linux) and [package.json.windows](package.json.windows). Pay attention: [package.json.windows](package.json.windows) should be used for macos development and build.

# 💰 Support
This application is absolutely free. But any attention motivates me to support the application. You can send a donation of $1 or more to a TON wallet:
```
UQBz_YJrj5-PCpYIqr7wsdspdSgrzETS02N2t0KSo1njX0FJ
```
and/or [![GitHub stars](https://img.shields.io/github/stars/drlight17/talk-electron.svg?style=social&label=Star&logo=github)](https://github.com/drlight17/talk-electron) this repository. 

As a reward for this, you can request a license using [current version](https://github.com/drlight17/talk-electron/releases/latest) of the app by providing your email, from which you will send confirmation of your attention (screenshot or something you consider important).

In any case, the application's functionality is not limited in any way. Having a license will simply remove the periodic reminder (1 per week) and the button with this form from the main menu.


