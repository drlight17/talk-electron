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
      $('.loading-state').css({'display': 'none'});
      //checkURL();
    } else {
      console.log(JSON.stringify({action: "not_alive"}));
      $('.loading-state').css({'display': 'flex'});
    }
    return result.ok;
  }
  catch(err){
      //console.log(err);
      console.log(JSON.stringify({action: "not_alive"}));
      $('.loading-state').css({'display': 'flex'});
  }
  return 'error';
}

function open_message(link) {
  setTimeout(function() {
    window.location.replace(link)
  }, 1000)
}

function force_online() {

    fetch('/ocs/v2.php/apps/user_status/api/v1/user_status/status?format=json', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'OCS-APIRequest': 'true',
        'requesttoken': OC.requestToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ statusType: 'online' })
    })
    /*.then(response => response.json())
    .then(data => {
      if (data && data.ocs && data.ocs.data) {
        console.log("User: "+JSON.stringify(data.ocs.data.userId))
        console.log("Status: "+JSON.stringify(data.ocs.data.status))
        console.log("Icon: "+JSON.stringify(data.ocs.data.icon))
      }
    })*/
    .catch(error => {
      console.error('Error status set:', error);
    });

    // statuses online -> away -> offline
}

function create_spinner() {
  let div = document.createElement('div');
  let div2 = document.createElement('div');
  div.classList.add("loading-state");
  div2.classList.add("loading");
  $(div).append(div2);
  $('body').append(div);
  let css =`
  <style>
    /*.loading {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        border: 10px solid black;
        border-top-color: white;
        animation: loading 1s linear infinite;
      }
      @keyframes loading {
        to {
          transform: rotate(360deg);
        }
      }*/

      .loading-state {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: none;
          justify-content: center;
          align-items: center;
      }
    </style>
  `;

  $('head').append(css);
}

function checkURL(auto_login/*,login,password*/){

  // check current page is spreed
  //console.log($('form.login-form').length < 1)
  if ($('form.login-form').length < 1) {
    if (!(location.pathname.includes('apps/spreed'))&&(!(location.pathname.includes('/call/')))&&(!location.pathname.includes('login'))) {
      console.log(JSON.stringify({action: "redirect_to_spreed"}));
      //window.location.replace("/apps/spreed")
    }
  } else {

    // to force show app window if not logged in
    // 2s timeout to pass SSO procedure
    if (!(auto_login)) {
      // hide autologin buttons
      if ($("#alternative-logins > a").length > 0) {
        $("#alternative-logins > a").hide();
      }
      setTimeout(function() {
        // check localStorage to drop unread counter
        recalc_counters_summary(true);
        console.log(JSON.stringify({action: "force_show_app_win"}));
      }, 2000);
    } else {
      if ($("#alternative-logins > a").length > 0) {
        $("#alternative-logins > a")[0].click();
      }
      //window.location.href = "/apps/oidc_login/oidc";
    }

    // to try login with saved credentials
    /*if (login && password) {
      console.log("Received login "+login)
      console.log("Received password "+password)
    }*/

  }
}

if (typeof _oc_config === "undefined") {
    console.log(JSON.stringify({action: "not_found"}));
} else {

  if ((parseInt(_oc_config.version.split('.')[0], 10)) < 28) {

    console.log(JSON.stringify({action: "not_found"}));
  } else {

    create_spinner();

    // check current page is spreed
    checkURL();

    // add open user settings menu link instead of default to prevent default behaviour
    if ( !$('#user_settings_link').length ) {

      let li = document.createElement( "li" );
      li.classList.add("menu-entry");
      li.setAttribute('id','user_settings_link');

      let a = document.createElement( "a" );

      a.setAttribute('href','/settings/user');

      a.textContent += user_settings_link_loc;
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
      a.textContent += nc_link_loc;
      let img = document.createElement( "img" );
      img.setAttribute('src','/core/img/favicon-mask.svg');
      $(a).prepend($(img));
      $(li).append($(a));

      $('#firstrunwizard_about').before( $(li) );
      //console.log($('#profile'));
    }

    // hide so user_menu elements (css won't work anymore after NC 29)
    if ((parseInt(_oc_config.version.split('.')[0], 10)) > 29) {
      $('#accessibility_settings').parent().hide();
      $('#settings').parent().hide();
      $('#admin_settings').parent().hide();
      $('#core_apps').parent().hide();
      $('#core_users').parent().hide();
      $('#help').parent().hide();
    }


    // add pinger every 10 seconds to check NC alive
    var interval = setInterval(function () { 
      pingUrl(location.protocol + '//' + location.host/* + location.pathname*/);
      recalc_counters_summary();  }, 10000);
  }
}
