// try to find Nextcloud scripts (tested on Nextcloud 28)

if (typeof _oc_config === "undefined") {
  console.log(JSON.stringify({action: "not_found"}));
} else {
  if (_oc_config.version.localeCompare("28.0.0.0", undefined, { numeric: true, sensitivity: 'base' }) == '-1') {
    console.log(JSON.stringify({action: "not_found"}));
  } else {
    // add open user settings menu link instead of default to prevent default behaviour
    if ( !$('#user_settings_link').length ) {
      let li = document.createElement( "li" );
      li.classList.add("menu-entry");
      li.setAttribute('id','user_settings_link');

      let a = document.createElement( "a" );

      a.setAttribute('href','/settings/user');
      a.textContent += "Настройки пользователя";
      let img = document.createElement( "img" );
      img.setAttribute('src','/apps/settings/img/admin.svg');
      $(a).prepend($(img));
      $(li).append($(a));

      $('#firstrunwizard_about').before( $(li) );
      //console.log($('#profile'));
    }
    // add open NC in default browser menu link 
    if ( !$('#nc_link').length ) {
      let li = document.createElement( "li" );
      li.classList.add("menu-entry");
      li.setAttribute('id','nc_link');

      let a = document.createElement( "a" );

      a.setAttribute('href','/');
      a.setAttribute('target','_blank');
      a.textContent += "Открыть Nextcloud";
      let img = document.createElement( "img" );
      img.setAttribute('src','/core/img/logo/logo.svg');
      $(a).prepend($(img));
      $(li).append($(a));

      $('#firstrunwizard_about').before( $(li) );
      //console.log($('#profile'));
    }
  }
}