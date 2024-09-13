const path = require("path")
const electron = require('electron')
const fs = require('fs');
const Store = require('electron-store');
const { dialog } = require('electron')
let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app

module.exports = i18n;

const store = new Store();

// get all locales list
const dirCont = fs.readdirSync( __dirname );
var lang_files = dirCont.filter( ( elm ) => elm.match(/.*\.(json?)/ig));
var lang_files_processed = [];
lang_files.forEach((locale) => {
    lang_files_processed.push(locale.replace('.json',''))
})

function i18n() {
    // check if no saved locale
    try {
        if ((store.get('locale')  == undefined) || (store.get('locale') == "")) {
            if(fs.existsSync(path.join(__dirname, app.getLocaleCountryCode().toLowerCase() + '.json'))) {
                loadedLanguageTag = app.getLocaleCountryCode().toLowerCase();
            }
            else {
                loadedLanguageTag = 'en'
            }

            loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, loadedLanguageTag + '.json' ), 'utf8'))
            store.set('locale',loadedLanguageTag);
        } else {
            loadedLanguageTag = store.get('locale');
            loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, loadedLanguageTag + '.json'), 'utf8'));
        }
    }
    catch (err) {
        console.log(err);
        dialog.showErrorBox('Error', 'Lang file processing fail! Check for existense of translations dir with lang json files and their consistense!');
        try {
            fs.unlinkSync(app.getPath('userData')+"/config.json");
            dialog.showErrorBox('Warn','Config file is cleared. Try app launch again.');
        }
        catch {

        }
        //app.relaunch();
        app.exit(0);
    }

}

i18n.prototype.__ = function(phrase) {
    let translation = loadedLanguage[phrase]
    if(translation === undefined) {
         translation = phrase
    }
    return translation
}

i18n.prototype.___ = function(phrase) {
    if (phrase == "get_locales") {
        return lang_files_processed
    }
}
