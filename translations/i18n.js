const path = require("path");
const electron = require('electron');
const fs = require('fs');

let Store = undefined;

if (process.versions.electron != "22.3.27") {
    Store = require('electron-store').default;
} else {
    Store = require('electron-store');
}


const { dialog } = require('electron');

let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app;

module.exports = i18n;

const store = new Store();

// get all locales list
const dirCont = fs.readdirSync(__dirname);
var lang_files = dirCont.filter((elm) => elm.match(/.*\.(json?)/ig));
var lang_files_processed = [];
lang_files.forEach((locale) => {
    lang_files_processed.push(locale.replace('.json', ''));
});

let debounce;

function getPreReadyLocale() {
  // Priority: Intl (most reliable) > env vars > fallback
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch (e) {
    // Fallback for very old environments (unlikely in Electron)
    return process.env.LC_ALL ||
           process.env.LC_MESSAGES ||
           process.env.LANG ||
           'en-US';
  }
}

function i18n() {
    
    // check if no saved locale
    try {
        if ((store.get('locale') == undefined) || (store.get('locale') == "")) {
            // Attempt to use the country code if the file exists
            // app.getLocaleCountryCode() can be null, so we use app.getLocale()
            // and split by '-' or '_' to get the country code
            let systemLocale = app.getLocale() || getPreReadyLocale() ; // e.g., 'en-US', 'ru-RU'
            let localeParts = systemLocale.split(/[-_]/);
            let countryCode = localeParts[0]?.toLowerCase(); // Take the first part (usually the language)

            if (countryCode && fs.existsSync(path.join(__dirname, countryCode + '.json'))) {
                loadedLanguageTag = countryCode;
            } else {
                // Check if there is a full locale code (e.g. 'en-US')
                if (fs.existsSync(path.join(__dirname, systemLocale.toLowerCase() + '.json'))) {
                     loadedLanguageTag = systemLocale.toLowerCase();
                } else {
                     // Default to English
                     loadedLanguageTag = 'en';
                }
            }

            loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, loadedLanguageTag + '.json'), 'utf8'));
            store.set('locale', loadedLanguageTag);
        } else {
            loadedLanguageTag = store.get('locale');
            loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, loadedLanguageTag + '.json'), 'utf8'));
        }
        
    } catch (err) {
        console.error('Error loading language file:', err);
        dialog.showErrorBox('Error', 'Lang file processing fail! Check for existence of translations dir with lang json files and their consistency!');
        try {
            fs.unlinkSync(app.getPath('userData') + "/config.json");
            dialog.showErrorBox('Warn', 'Config file is cleared. Try app launch again.');
        } catch (unlinkErr) {
            console.error('Could not clear config file:', unlinkErr);
        }
        // app.relaunch();
        app.exit(1); // Use exit code 1 for error
    }
    /*finally {
        clearTimeout(debounce);
        debounce = setTimeout(()=>{
            console.log('Used locale:', loadedLanguageTag);
        }, 100);
    }*/
}

/**
 * Translates a phrase and replaces placeholders.
 * @param {string} phrase - The phrase key in the localization file.
 * @param {Object} [variables] - An object with variables for replacement, e.g., {name: "John", count: 5}.
 * @returns {string} The translated and formatted string.
 */
i18n.prototype.__ = function(phrase, variables) {
    let translation = loadedLanguage[phrase];
    if (translation === undefined) {
        // You can add logging for missing keys for debugging
        // console.warn(`Missing translation key: "${phrase}"`);
        translation = phrase;
    }

    // If variables are passed, replace placeholders
    if (variables && typeof variables === 'object') {
        // Regular expression to find placeholders of the form {key}
        // We use non-greedy matching (.*?) in case there are special characters in the key
        translation = translation.replace(/\{([^}]+)\}/g, (match, key) => {
            // key is the content inside the brackets, e.g. "name" or "user_count"
            if (variables.hasOwnProperty(key)) {
                return String(variables[key]); // Convert the value to a string, just in case
            } else {
                // If the variable is not found, you can leave the placeholder or replace it with something else
                console.warn(`Missing variable for placeholder "${key}" in translation for key "${phrase}"`);
                return match; // Leave the original placeholder {key}
                // return `[Missing: ${key}]`; // Alternative: show that the variable is missing
            }
        });
    }

    return translation;
};

/**
 * Returns a list of available locales.
 * @param {string} phrase - The special key 'get_locales'.
 * @returns {Array|undefined} An array of available locales or undefined.
 */
i18n.prototype.___ = function(phrase) {
    if (phrase === "get_locales") {
        return lang_files_processed;
    }
    return undefined; // Explicitly return undefined for other phrases
};

// Initialize the i18n object when the module is loaded
// This ensures that loadedLanguage is loaded before the first use of __()
new i18n();