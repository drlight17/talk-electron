function loadSettings(settings) {
  //let settings_json = JSON.stringify(settings);

  if (settings.server_url !== undefined) {
    document.getElementById('server_url').value = settings.server_url;
  } else {
    document.getElementById('server_url').value = '`+url_example+`';
  }

  if (settings.allow_domain !== undefined) {
    document.getElementById('allow_domain').value = settings.allow_domain;
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

  if (settings.show_on_notify !== undefined) {
    document.getElementById('show_on_notify').checked = settings.show_on_notify;
  } else {
    document.getElementById('show_on_notify').checked = false;
  }

  if (settings.start_hidden !== undefined) {
    document.getElementById('start_hidden').checked = settings.start_hidden;
  } else {
    document.getElementById('start_hidden').checked = false;
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
  console.log(JSON.stringify({action: "save_settings", settings: JSON.stringify(settings)}));
}
