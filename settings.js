function localize(id,loc,theme) {
  if (theme == 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.add('light-theme');
  }
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


function loadSettings(settings,locales,flag,themes) {

  if (settings.server_url !== undefined) {
    document.getElementById('server_url').value = settings.server_url;
  } else {
    document.getElementById('server_url').value = '`+url_example+`';
  }

  if (settings.allow_domain !== undefined) {
    document.getElementById('allow_domain').value = settings.allow_domain;
  }

  if (settings.auto_login !== undefined) {
    document.getElementById('auto_login').checked = settings.auto_login;
  } else {
    document.getElementById('auto_login').checked = false;
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
  }

  if (settings.run_at_startup !== undefined) {
    document.getElementById('run_at_startup').checked = settings.run_at_startup;
  } else {
    document.getElementById('run_at_startup').checked = false;
  }

  if (settings.use_server_icon !== undefined) {
    document.getElementById('use_server_icon').checked = settings.use_server_icon;
  } else {
    document.getElementById('use_server_icon').checked = false;
  }

  if (settings.show_on_new_message !== undefined) {
    document.getElementById('show_on_new_message').checked = settings.show_on_new_message;
  } else {
    document.getElementById('show_on_new_message').checked = false;
  }

  /*var select = document.getElementById('notification_timeout');
  locales.forEach((locale) => {
    var regionNames = new Intl.DisplayNames([locale], { type: 'language' });
    var opt = document.createElement('option');
    opt.value = locale;
    opt.innerHTML = regionNames.of(locale);
    select.appendChild(opt);
  })*/

  if (settings.notification_timeout !== undefined) {
    document.getElementById('notification_timeout').value = settings.notification_timeout;
  }


  if (settings.always_on_top !== undefined) {
    document.getElementById('always_on_top').checked = settings.always_on_top;
  } else {
    document.getElementById('always_on_top').checked = false;
  }

  if (settings.start_hidden !== undefined) {
    document.getElementById('start_hidden').checked = settings.start_hidden;
  } else {
    document.getElementById('start_hidden').checked = false;
  }

  if (settings.logging !== undefined) {
    document.getElementById('logging').checked = settings.logging;
  } else {
    document.getElementById('logging').checked = false;
  }

  cancel_button_action(flag);

  /*if (settings.allow_multiple !== undefined) {
    document.getElementById('allow_multiple').checked = settings.allow_multiple;
  } else {
    document.getElementById('allow_multiple').checked = false;
  }*/
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
  settings['notification_timeout'] = document.getElementById('notification_timeout').value;

  // add theme workaround
  settings['theme'] = document.getElementById('theme').value;

  console.log(JSON.stringify({action: "save_settings", settings: JSON.stringify(settings)}));
}
