
function localize(id,loc) {

  // localize settings.html
  if (id == 'allow_domain_title') {
    // localization of allow_domain_id title
    document.getElementById(id.replace('_title','_id')).title = loc;
  } else {
    document.getElementById(id).innerHTML = loc;
  }
}

function get_all_ids () {
  var objs = [];
  document.querySelectorAll('label[id], button[id]').forEach( obj => {
    if(obj.id)
     objs.push(obj.id);
  });
  console.log(JSON.stringify({action: "return_localize_ids", localization_ids: JSON.stringify(objs)}));
}

// Define default settings for each section
const defaultSettings = {
  server_url: '',
  allow_domain: '*',
  auto_login: false,
  locale: 'en',
  theme: 'auto',
  use_server_icon: false,
  use_server_theme: false,
  saved_proxy_login: false,
  show_on_new_message: false,
  sum_unread: false,
  notification_muted: false,
  notification_timeout_checkbox: false,
  notification_sys_checkbox: false,
  notification_position: 'bottom-right',
  always_on_top: false,
  start_hidden: false,
  logging: false,
  run_at_startup: false
};

function hasSettingsChanged(settings) {
  // Check each section for changes from defaults
  const changedSections = [];
  
  // Connection section
  const connectionChanged = settings.allow_domain !== defaultSettings.allow_domain ||
                           settings.auto_login !== defaultSettings.auto_login;
  if (connectionChanged) changedSections.push('connection');
  
  // Appearance section  
  const appearanceChanged = settings.locale !== defaultSettings.locale ||
                           settings.theme !== defaultSettings.theme ||
                           settings.use_server_icon !== defaultSettings.use_server_icon ||
                           settings.use_server_theme !== defaultSettings.use_server_theme;
  if (appearanceChanged) changedSections.push('appearance');
  
  // Notifications section
  const notificationsChanged = settings.notification_muted !== defaultSettings.notification_muted ||
                             settings.notification_timeout_checkbox !== defaultSettings.notification_timeout_checkbox ||
                             settings.notification_sys_checkbox !== defaultSettings.notification_sys_checkbox ||
                             settings.notification_position !== defaultSettings.notification_position;
  if (notificationsChanged) changedSections.push('notifications');
  
  // Behaviour section
  const behaviourChanged = settings.show_on_new_message !== defaultSettings.show_on_new_message ||
                          settings.always_on_top !== defaultSettings.always_on_top ||
                          settings.start_hidden !== defaultSettings.start_hidden ||
                          settings.run_at_startup !== defaultSettings.run_at_startup || 
                          settings.sum_unread !== defaultSettings.sum_unread;
  if (behaviourChanged) changedSections.push('behaviour');
  
  // Debug section
  const debugChanged = settings.logging !== defaultSettings.logging;
  if (debugChanged) changedSections.push('debug');
  
  // Also check proxy settings
  if (settings.saved_proxy_login) {
    try {
      const proxyData = JSON.parse(settings.saved_proxy_login);
      if (proxyData.server && Object.keys(proxyData.server).length > 0) {
        if (!changedSections.includes('connection')) {
          changedSections.push('connection');
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return changedSections;
}

function openChangedSections(changedSections) {
  changedSections.forEach(section => {
    const container = document.querySelector('.rounded-container-alt.' + section);
    const title = document.getElementById(section);
    if (container && title) {
      container.classList.remove('collapsed');
      title.classList.remove('collapsed');
    }
  });
}

function resetToDefaults() {
  // Get current server URL to preserve it
  const currentServerUrl = document.getElementById('server_url').value;
  
  // Reset all settings to defaults except server_url
  document.getElementById('allow_domain').value = defaultSettings.allow_domain;
  document.getElementById('auto_login').checked = defaultSettings.auto_login;
  document.getElementById('lang').value = defaultSettings.locale;
  document.getElementById('theme').value = defaultSettings.theme;
  document.getElementById('use_server_icon').checked = defaultSettings.use_server_icon;
  document.getElementById('use_server_theme').checked = defaultSettings.use_server_theme;
  
  // Reset proxy settings
  document.getElementById('saved_proxy_login_off').checked = true;
  document.getElementById('saved_proxy_login').checked = false;
  document.getElementById('saved_proxy_login_creds').classList.add('hidden');
  
  // Reset notification settings
  document.getElementById('notification_muted').checked = defaultSettings.notification_muted;
  document.getElementById('notification_timeout_checkbox').checked = defaultSettings.notification_timeout_checkbox;
  document.getElementById('notification_sys_checkbox').checked = defaultSettings.notification_sys_checkbox;
  
  // Reset notification position
  document.getElementById('bottom-right').checked = true;
  document.getElementById('notification_position').classList.add('hidden');
  document.getElementById('notification_sys_checkbox_div').classList.add('hidden');
  
  // Reset behaviour settings
  document.getElementById('show_on_new_message').checked = defaultSettings.show_on_new_message;
  document.getElementById('always_on_top').checked = defaultSettings.always_on_top;
  document.getElementById('sum_unread').checked = defaultSettings.sum_unread;
  document.getElementById('start_hidden').checked = defaultSettings.start_hidden;
  document.getElementById('run_at_startup').checked = defaultSettings.run_at_startup;
  
  // Reset debug settings
  document.getElementById('logging').checked = defaultSettings.logging;
  
  // Reset saved proxy login data
  let loginProxyData = { server: {} };
  settings['saved_proxy_login'] = JSON.stringify(loginProxyData);
  
  // Update notification visibility
  updateNotificationVisibility();
  
  // Close all sections first
  document.querySelectorAll('.rounded-container-alt').forEach(container => {
    container.classList.add('collapsed');
  });
  document.querySelectorAll('.container-title-alt').forEach(title => {
    title.classList.add('collapsed');
  });
  
  // Check which sections should be open after reset (should be none except possibly connection if proxy was set)
  const currentSettings = {
    server_url: currentServerUrl,
    allow_domain: defaultSettings.allow_domain,
    auto_login: defaultSettings.auto_login,
    locale: defaultSettings.locale,
    theme: defaultSettings.theme,
    use_server_icon: defaultSettings.use_server_icon,
    use_server_theme: defaultSettings.use_server_theme,
    saved_proxy_login: JSON.stringify(loginProxyData),
    show_on_new_message: defaultSettings.show_on_new_message,
    sum_unread: defaultSettings.sum_unread,
    notification_muted: defaultSettings.notification_muted,
    notification_timeout_checkbox: defaultSettings.notification_timeout_checkbox,
    notification_sys_checkbox: defaultSettings.notification_sys_checkbox,
    notification_position: defaultSettings.notification_position,
    always_on_top: defaultSettings.always_on_top,
    start_hidden: defaultSettings.start_hidden,
    logging: defaultSettings.logging,
    run_at_startup: defaultSettings.run_at_startup
  };
  
  // Only open sections that still have changes (should be minimal after reset)
  const changedSections = hasSettingsChanged(currentSettings);
  if (changedSections.length > 0) {
    openChangedSections(changedSections);
  }
  
  // Show confirmation message
  alert('Настройки успешно сброшены к значениям по умолчанию (адрес сервера сохранён).');
}

function loadSettings(settings,locales,flag,themes,proxyUrl,proxy_password,theme) {
  if (theme == 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.add('light-theme');
  }
  if (settings.server_url !== undefined) {
    document.getElementById('server_url').value = settings.server_url;
  } else {
    document.getElementById('server_url').value = '';
  }

  if (settings.allow_domain !== undefined) {
    document.getElementById('allow_domain').value = settings.allow_domain;
  } else {
    document.getElementById('allow_domain').value = defaultSettings.allow_domain;
  }

  if (settings.current_login !== undefined) {
    //try {
      if (settings.current_login == "auto_login") {
        document.getElementById('auto_login').checked = true
        document.getElementById('current_login_p_id').classList.add('hidden');
      } else {
        document.getElementById('auto_login').checked = false
        document.getElementById('auto_login_p_id').classList.add('hidden');
      }
      document.getElementById('current_login').value = settings.current_login;
    //}
    //catch(err) {
    //}
  } else {
    document.getElementById('auto_login').checked = defaultSettings.auto_login;
    document.getElementById('current_login_p_id').classList.add('hidden');
  }

  var select = document.getElementById('lang');
  locales.forEach((locale) => {
    var regionNames = new Intl.DisplayNames([locale], { type: 'language' });
    var opt = document.createElement('option');
    opt.value = locale;
    opt.innerHTML = regionNames.of(locale);
    select.appendChild(opt);
  })

  if (settings.locale !== undefined) {
    document.getElementById('lang').value = settings.locale;
  } else {
    document.getElementById('lang').value = defaultSettings.locale;
  }

  select = document.getElementById('theme');
  themes.forEach((theme) => {
    const key = Object.keys(theme)[0];
    const value = theme[key];
    opt = document.createElement('option');
    opt.value = key;
    opt.text = value;
    select.appendChild(opt);
  })

  if (settings.theme !== undefined) {
    document.getElementById('theme').value = settings.theme;
  } else {
    document.getElementById('theme').value = defaultSettings.theme;
  }

  if (settings.run_at_startup !== undefined) {
    document.getElementById('run_at_startup').checked = settings.run_at_startup;
  } else {
    document.getElementById('run_at_startup').checked = defaultSettings.run_at_startup;
  }

  //console.log(settings.saved_proxy_login)
  if ((proxyUrl) && (proxyUrl != 'false')) {
    document.getElementById('saved_proxy_url').value = proxyUrl
  } else {
    document.getElementById('saved_proxy_login_off').checked = true;
    document.querySelectorAll(`input[name="saved_proxy_login"]`).forEach(radio => {
        radio.disabled = true;
    });
  }
  if ((proxy_password) && (proxy_password != 'null') && (proxy_password != 'false')) {
    document.getElementById('saved_proxy_login').checked = true;
    document.getElementById('saved_proxy_login_password').value = proxy_password;
    document.getElementById('saved_proxy_login_username').value = JSON.parse(settings.saved_proxy_login).server?.[proxyUrl]?.user;
  } else {
    document.getElementById('saved_proxy_login_off').checked = true;
  }
  
  if (document.getElementById('saved_proxy_login').checked) {
    document.getElementById('saved_proxy_login_creds').classList.remove('hidden')
  } else {
    document.getElementById('saved_proxy_login_creds').classList.add('hidden')
  }

  if (settings.use_server_icon !== undefined) {
    document.getElementById('use_server_icon').checked = settings.use_server_icon;
  } else {
    document.getElementById('use_server_icon').checked = defaultSettings.use_server_icon;
  }

  if (settings.use_server_theme !== undefined) {
    document.getElementById('use_server_theme').checked = settings.use_server_theme;
  } else {
    document.getElementById('use_server_theme').checked = defaultSettings.use_server_theme;
  }

  if (settings.show_on_new_message !== undefined) {
    document.getElementById('show_on_new_message').checked = settings.show_on_new_message;
  } else {
    document.getElementById('show_on_new_message').checked = defaultSettings.show_on_new_message;
  }

  if (settings.sum_unread !== undefined) {
    document.getElementById('sum_unread').checked = settings.sum_unread;
  } else {
    document.getElementById('sum_unread').checked = defaultSettings.sum_unread;
  }

  /*var select = document.getElementById('notification_timeout');
  locales.forEach((locale) => {
    var regionNames = new Intl.DisplayNames([locale], { type: 'language' });
    var opt = document.createElement('option');
    opt.value = locale;
    opt.innerHTML = regionNames.of(locale);
    select.appendChild(opt);
  })*/

  /*console.log('Notifications: ' + settings.notification_timeout_checkbox);
  console.log('System notifications: ' + settings.notification_sys_checkbox);*/
  
  if (settings.notification_muted !== undefined) {
    document.getElementById('notification_muted').checked = settings.notification_muted;
  } else {
    document.getElementById('notification_muted').checked = defaultSettings.notification_muted;
  }

  if (settings.notification_timeout_checkbox !== undefined) {
    document.getElementById('notification_timeout_checkbox').checked = settings.notification_timeout_checkbox;
  } else {
    document.getElementById('notification_timeout_checkbox').checked = defaultSettings.notification_timeout_checkbox;
  }

  if (settings.notification_sys_checkbox !== undefined) {
    document.getElementById('notification_sys_checkbox').checked = settings.notification_sys_checkbox;
  } else {
    document.getElementById('notification_sys_checkbox').checked = defaultSettings.notification_sys_checkbox;
  }

  updateNotificationVisibility();

  function updateNotificationVisibility() {
    const timeoutChecked = document.getElementById('notification_timeout_checkbox').checked;
    const sysChecked = document.getElementById('notification_sys_checkbox').checked;
    
    if (timeoutChecked) {
      document.getElementById('notification_sys_checkbox_div').classList.remove('hidden');
    } else {
      document.getElementById('notification_sys_checkbox_div').classList.add('hidden');
    }
    
    if (timeoutChecked && !sysChecked) {
      document.getElementById('notification_position').classList.remove('hidden');
    } else {
      document.getElementById('notification_position').classList.add('hidden');
    }
  }

  document.getElementById('notification_timeout_checkbox').addEventListener('change', updateNotificationVisibility);
  document.getElementById('notification_sys_checkbox').addEventListener('change', updateNotificationVisibility);

  if (settings.notification_position !== undefined) {
    document.querySelectorAll(`input[name="notification_position"]`).forEach(radio => {
      if (radio.value == settings.notification_position) {
        radio.checked = true;
      }
    });
    document.getElementById('notification_position').value = settings.notification_position;
  } else {
    // Set default position if not defined
    document.getElementById('bottom-right').checked = true;
  }

  if (settings.always_on_top !== undefined) {
    document.getElementById('always_on_top').checked = settings.always_on_top;
  } else {
    document.getElementById('always_on_top').checked = defaultSettings.always_on_top;
  }

  if (settings.start_hidden !== undefined) {
    document.getElementById('start_hidden').checked = settings.start_hidden;
  } else {
    document.getElementById('start_hidden').checked = defaultSettings.start_hidden;
  }

  if (settings.logging !== undefined) {
    document.getElementById('logging').checked = settings.logging;
  } else {
    document.getElementById('logging').checked = defaultSettings.logging;
  }

  // Check for changed settings and open relevant sections
  const changedSections = hasSettingsChanged(settings);
  if (changedSections.length > 0) {
    openChangedSections(changedSections);
  }

  cancel_button_action(flag);

  //document.getElementById("saved_proxy_login").addEventListener("click", function () {
  document.querySelectorAll(`input[name="saved_proxy_login"]`).forEach(radio => {
    radio.addEventListener('change', function() {
      //if (document.getElementById('saved_proxy_login').checked) {
      if (this.id == "saved_proxy_login") {
        document.getElementById('saved_proxy_login_creds').classList.remove('hidden')
      } else {
        document.getElementById('saved_proxy_login_creds').classList.add('hidden')
      }
    })
  });

  /*if (settings.allow_multiple !== undefined) {
    document.getElementById('allow_multiple').checked = settings.allow_multiple;
  } else {
    document.getElementById('allow_multiple').checked = false;
  }*/
}

function setIcon(appIcon) {
  //console.log(document.querySelector('#app_icon img'));
  document.querySelector('#app_icon img').src = appIcon;
}

function disableRunAtStartup() {
  document.getElementById('run_at_startup').setAttribute("disabled","disabled");
}

function cancel_button_action(flag) {
  if (flag) {
    //document.getElementById('cancel_button_id').disabled = true;
    document.getElementById("cancel_button_id").addEventListener("click", function () {
      //console.log("Retry clicked");
      console.log(JSON.stringify({action: "restart_app"}));
      self.close();
    });
  } else {
    document.getElementById("cancel_button_id").addEventListener("click", function () {
      //console.log("Retry clicked");
      self.close();
    });
  }
}

function saveSettings() {
  var formEl = document.forms.settings_form;
  var formData = new FormData(formEl);
  var settings = {};
    // Loop through FormData entries
  for (let [key, value] of formData.entries()) {
    if ((key == "saved_proxy_login_username") || (key == "saved_proxy_login_password")) continue;
    if ((value == "true") || (value == "false")) {
      settings[key] = value == "true" ? true : false;
    }
    // For all other fields, store the value as is
    else {
        settings[key] = value;
    }
  }
  // add locale workaround
  settings['locale'] = document.getElementById('lang').value;

  // add notification_timeout workaround
  //settings['notification_timeout'] = document.getElementById('notification_timeout').value;

  // add notification_position workaround
  //settings['notification_position'] = document.getElementById('notification_position').value;

  // add theme workaround
  settings['theme'] = document.getElementById('theme').value;

  // add proxy workaround
  //JSON.parse(settings.saved_proxy_login).server?.[proxyUrl]?.user;
  //console.log(document.getElementById('saved_proxy_login').checked)
  let loginProxyData = { server: {} };
  if (document.getElementById('saved_proxy_login').checked) {
    //document.getElementById('saved_proxy_url').checked
    loginProxyData.server[document.getElementById('saved_proxy_url').value] = {
      user: document.getElementById('saved_proxy_login_username').value,
      password: document.getElementById('saved_proxy_login_password').value
    };
  }
  settings['saved_proxy_login'] = JSON.stringify(loginProxyData);
  //console.log(JSON.stringify(settings))
  console.log(JSON.stringify({action: "save_settings", settings: JSON.stringify(settings)}));
}

function openConfigFile() {
  console.log(JSON.stringify({action: "open_config_file"}));
}

function openNotificationSettingsNC() {
  console.log(JSON.stringify({action: "open_nofification_settings"}));
}

function toggleContainer(selector) {
    const container = document.querySelector('.rounded-container-alt.'+selector);
    const title = document.getElementById(selector);
    
    container.classList.toggle('collapsed');
    title.classList.toggle('collapsed');
}

function showMessageExample(pos) {
  clearTimeout(debounce);
  debounce = setTimeout(function() {
    if (position != pos.id) {
      console.log(JSON.stringify({action: "show_message_example", position: pos.id}));
      position = pos.id;
    }
  }, 1000);
}

let position = '';
let debounce;
