function localize_setting(setting_id,setting_loc) {
  // localize settings.html
  if (setting_id == 'allow_domain_title') {
    // localization of allow_domain_id title
    document.getElementById(setting_id.replace('_title','_id')).title = setting_loc;
  } else {
    document.getElementById(setting_id).innerHTML = setting_loc;
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


function loadSettings(settings,locales) {

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
  //select.value = settings.locale;
  locales.forEach((locale) => {
    //console.log(locale)
    var regionNames = new Intl.DisplayNames([locale], { type: 'language' });
    var opt = document.createElement('option');
    opt.value = locale;
    opt.innerHTML = regionNames.of(locale);
    select.appendChild(opt);
  })

  if (settings.locale !== undefined) {
    document.getElementById('lang').value = settings.locale;
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

  /*if (settings.allow_multiple !== undefined) {
    document.getElementById('allow_multiple').checked = settings.allow_multiple;
  } else {
    document.getElementById('allow_multiple').checked = false;
  }*/
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
  console.log(JSON.stringify({action: "save_settings", settings: JSON.stringify(settings)}));
}
