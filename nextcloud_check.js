// try to find Nextcloud scripts and do observing (tested on Nextcloud since 28)

async function pingUrl(url){

  try{
    var result = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      method: "GET",
      mode: "no-cors",
      cache: "no-cache",
      referrerPolicy: "no-referrer"
    });

    //console.log(`result.type: ${result.type}`);
    //console.log(`result.ok: ${result.ok}`);
    if (result.ok) {
      console.log(JSON.stringify({action: "alive"}));
      //checkURL();
    } else {
      console.log(JSON.stringify({action: "not_alive"}));
    }
    return result.ok;
  }
  catch(err){
      //console.log(err);
      console.log(JSON.stringify({action: "not_alive"}));
  }
  return 'error';
}


function checkURL(){
  // check current page is spreed
  //console.log($('form.login-form').length < 1)
  if ($('form.login-form').length < 1) {
    if (!(location.pathname.includes('apps/spreed'))&&(!(location.pathname.includes('/call/')))&&(!location.pathname.includes('login'))) {
      console.log(JSON.stringify({action: "redirect_to_spreed"}));
      //window.location.replace("/apps/spreed")
    }
  }
}

if (typeof _oc_config === "undefined") {
  console.log(JSON.stringify({action: "not_found"}));
} else {
  if (_oc_config.version.localeCompare("28.0.0.0", undefined, { numeric: true, sensitivity: 'base' }) == '-1') {
    console.log(JSON.stringify({action: "not_found"}));
  } else {
    // check current page is spreed
    checkURL();

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
      img.setAttribute('src','/core/img/favicon-mask.svg');
      $(a).prepend($(img));
      $(li).append($(a));

      $('#firstrunwizard_about').before( $(li) );
      //console.log($('#profile'));
    }
    // add pinger every 5 seconds to check NC alive
    var interval = setInterval(function () { pingUrl(location.protocol + '//' + location.host/* + location.pathname*/) }, 5000);
  }
}