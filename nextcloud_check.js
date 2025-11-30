// try to find Nextcloud scripts and do observing (tested on Nextcloud since 28)

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        /*const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });*/

        /*observer.observe(document.querySelector('#notifications'), {
            childList: true,
            subtree: true
        });*/
    });
}

function isElementInDOM(element) {
  return document.body.contains(element);
}

function loading(state) {
  const loadingState = document.querySelector('.loading-state');
  const loading = document.querySelector('.loading');
  
  if (!loadingState || !loading) {
    console.error('Loading elements not found');
    return;
  }

  // Store the previous state to compare
  if (!loading.previousActionState) {
    loading.previousActionState = null;
  }

  let action = null;
  let shouldOutput = false;

  if (state == 'finished') {
    action = "alive";
    if (loading.previousActionState !== action) {
      shouldOutput = true;
      loading.previousActionState = action;
    }
    loadingState.style.visibility = 'hidden';
    loadingState.style.opacity = '0';
    loading.style.visibility = 'hidden';
    loading.style.opacity = '0';
  } else if (state == 'not_respond') {
    action = "not_alive";
    if (loading.previousActionState !== action) {
      shouldOutput = true;
      loading.previousActionState = action;
    }
    loadingState.style.visibility = 'visible';
    loadingState.style.opacity = '1';
    loading.style.visibility = 'visible';
    loading.style.opacity = '1';
  } else if (state == 'refresh') {
    action = "refresh";
    if (loading.previousActionState !== action) {
      shouldOutput = true;
      loading.previousActionState = action;
    }
    loadingState.style.visibility = 'visible';
    loadingState.style.opacity = '1';
    loading.style.visibility = 'visible';
    loading.style.opacity = '1';
  }

  // Only log if the action has changed
  if (shouldOutput) {
    console.log(JSON.stringify({action: action}));
  }
}

let call_dialog = false;

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
      if (!call_dialog) {
        loading('finished');
      }
      //checkURL();
    } else {
      loading('not_respond');
    }
    return result.ok;
  }
  catch(err){
      //console.log(err);
      loading('not_respond');
  }
  return 'error';
}

function open_message(link) {
  window.location.replace(link)
}

function blur_on_call_dialog(flag) {
  call_dialog = flag;
  const loadingElement = document.querySelector('.loading');
  if (loadingElement) {
    loadingElement.style.visibility = 'hidden';
    loadingElement.style.opacity = '0';
  }
  
  const loadingState = document.querySelector('.loading-state');
  const callDialog = document.querySelector('.call_dialog');
  
  if (call_dialog) {
    if (loadingState) {
      loadingState.style.visibility = 'visible';
      loadingState.style.opacity = '1';
    }
    if (callDialog) {
      callDialog.style.visibility = 'visible';
      callDialog.style.opacity = '1';
    }
  } else {
    if (loadingState) {
      loadingState.style.visibility = 'hidden';
      loadingState.style.opacity = '0';
    }
    if (callDialog) {
      callDialog.style.visibility = 'hidden';
      callDialog.style.opacity = '0';
    }
  }
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

async function check_user() {
  const response = await fetch('/ocs/v2.php/cloud/user?format=json', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'OCS-APIRequest': 'true',
      'requesttoken': OC.requestToken,
      'Content-Type': 'application/json'
    }
  })
  try {
    const data = await response.json();
    /*.catch(error => {
      console.error('Error userid get:', error);
      return false;
    });*/

    if (data && data.ocs) {
      return data.ocs
    } else {
      return false;
    }
  }
  catch(err) {
    console.error('Error userid get:', err);
    return false;
  }

}

async function recheck_lang(locale) {
  let current_user = await check_user();
  if (typeof current_user.data === 'object') {
    if (current_user.data.language == locale) {
      console.log(JSON.stringify({action: "language_changed"}));
    } else {
      console.log(JSON.stringify({action: "language_locked"}));
    }
  }
}

async function force_lang(locale,saved_password) {
  if (location.pathname.includes('apps/spreed')) {
    let current_user = await check_user();
    if (typeof current_user.data === 'object') {
      if (current_user.data.language != locale) {
        const credentials = btoa(`${current_user.data.id}:${saved_password}`);
        const formData = new URLSearchParams();
        formData.append('key', 'language');
        formData.append('value', locale);
        fetch(`/ocs/v2.php/cloud/users/${current_user.data.id}?format=json`, {
          method: 'PUT',
          credentials: (saved_password !== 'undefined') ? 'omit' : 'include', // important for Basic auth!!!
          //credentials: 'include',
          headers: {
            'OCS-APIRequest': 'true',
            'Authorization': `Basic ${credentials}`,
          },
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          //console.log(data)
          if (data && data.ocs && data.ocs.meta) {
            if (data.ocs.meta.statuscode == 200) {
              // recheck if language is changed
              recheck_lang(locale);
            } else if (data.ocs.meta.statuscode == 403) {
              // TODO password is required
              console.error('Password is required');
            }
          }
        })
        .catch(error => {
          console.error('Error language set:', error);
        });
      } else {
        console.log('Current language is the same as app language.')
      }
    } else {
      console.error('Current user is not found...');
    }
  }
}

async function force_theme(theme,saved_password) {
  if (location.pathname.includes('apps/spreed')) {
    if (theme == "auto") {
      theme = "default"
    }  
    let current_user = await check_user();
    if (typeof current_user.data === 'object') {
      if (document.body.getAttribute('data-themes') != theme) {
        const credentials = btoa(`${current_user.data.id}:${saved_password}`);
        fetch(`/ocs/v2.php/apps/theming/api/v1/theme/${theme}/enable?format=json`, {
          method: 'PUT',
          credentials: (saved_password !== 'undefined') ? 'omit' : 'include', // important for Basic auth!!!
          //credentials: 'include',
          headers: {
            'OCS-APIRequest': 'true',
            //'requesttoken': OC.requestToken,
            'Authorization': `Basic ${credentials}`,
          }
        })
        .then(response => response.json())
        .then(data => {
          //console.log(data)
          if (data && data.ocs && data.ocs.meta) {
            if (data.ocs.meta.statuscode == 200) {
              console.log(JSON.stringify({action: "theme_changed"}));
              //recheck_setting('theme',theme);
            } else if (data.ocs.meta.statuscode == 403) {
              // TODO password is required
              console.error('Password is required');
            }
          }
        })
        .catch(error => {
          console.error('Error theme set:', error);
        });
      } else {
        console.log('Current theme is the same as app theme.')
      }
    } else {
      console.error('Current user is not found...');
    }
  }
}

function create_spinner() {
  let div = document.createElement('div');
  let div2 = document.createElement('div');
  let div3 = document.createElement('div');
  
  div.classList.add("loading-state");
  div2.classList.add("loading");
  div3.classList.add("call_dialog");

  let img = document.createElement("div");
  img.innerHTML = `<span data-v-06a1deb8="" aria-hidden="true" role="img" class="material-design-icon phone-icon"><svg fill="currentColor" width="150" height="150" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle background -->
  <circle cx="12" cy="12" r="12" fill="currentColor" opacity="0.15"/>
  
  <!-- Phone icon, scaled down a bit -->
  <g transform="translate(2,2) scale(0.83)">
    <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
  </g>
</svg>
</span>`;

  // Append elements using vanilla JavaScript
  div3.appendChild(img);
  div.appendChild(div3);
  div.appendChild(div2);
  document.body.appendChild(div);

  // Create and append CSS styles
  let style = document.createElement('style');
  style.textContent = `
    @keyframes calling {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(0.7);
      }
      100% {
        transform: scale(1);
      }
    }
    @keyframes rotate {
      to {
        transform: rotate(360deg);
      }
    }
    
    .call_dialog {
      visibility: hidden; 
      opacity: 0;
      transition: 0.2s ease-in-out;
      animation: calling 1s linear infinite;
    }
    
    .call_dialog img {
      height: 100px;
    }
    
    .loading {
      visibility: hidden; 
      opacity: 0;
      display: flex;
      position: absolute;
      align-items: center;
      justify-content: center;
      align-items: center;
      transition: 0.2s ease-in-out;
    }

    .loading:after {
        border: 2px solid rgba(150,150,150,.5);
        border-top-color: #646464;z-index: 2;
        content: "";
        height: 32px;
        width: 32px;
        margin: -17px 0 0 -17px;
        position: absolute;
        top: 50%;
        left: 50%;
        border-radius: 100%;
        -webkit-animation: rotate .8s infinite linear;
        animation: rotate .8s infinite linear;
        -webkit-transform-origin: center;
        -ms-transform-origin: center;
        transform-origin: center;
    }
    
    .loading-state {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      transition: 0.2s ease-in-out;
      z-index: 9999;
      display: flex;
      visibility: hidden; 
      opacity: 0;
      justify-content: center;
      align-items: center;
    }
  `;

  document.head.appendChild(style);
}

function checkURL(auto_login/*,login,password*/){
  // check current page is spreed
  const loginForms = document.querySelectorAll('form.login-form');
  
  if (loginForms.length < 1) {
    if (!(location.pathname.includes('apps/spreed')) && (!(location.pathname.includes('/call/'))) && (!location.pathname.includes('login'))) {
      // show loading
      loading('refresh');
      console.log(JSON.stringify({action: "redirect_to_spreed"}));
      //window.location.replace("/apps/spreed")
    }
  } else {
    // to force show app window if not logged in
    // 2s timeout to pass SSO procedure
    if (!(auto_login)) {
      // hide autologin buttons
      const alternativeLogins = document.querySelectorAll("#alternative-logins > a");
      if (alternativeLogins.length > 0) {
        alternativeLogins.forEach(element => {
          element.style.display = 'none';
        });
      }
      
      setTimeout(function() {
        // check localStorage to drop unread counter
        recalc_counters_summary(true);
        console.log(JSON.stringify({action: "force_show_app_win"}));
      }, 2000);
    } else {
      // show loading
      loading('refresh');
      const alternativeLogins = document.querySelectorAll("#alternative-logins > a");
      if (alternativeLogins.length > 0) {
        alternativeLogins[0].click();
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

try {
  create_spinner();
}
catch (err) {

}

// test set 500ms timeout for _oc_config fetch
setTimeout (()=>{
  if (typeof _oc_config === "undefined") {
      //document.getElementsByTagName("BODY")[0].style.display = "none";
      loading('refresh')
      console.log(JSON.stringify({action: "not_found"}));
  } else {

    if ((parseInt(_oc_config.version.split('.')[0], 10)) < 28) {
      //document.getElementsByTagName("BODY")[0].style.display = "none";
      loading('refresh')
      console.log(JSON.stringify({action: "not_found"}));
    } else {

      // check current page is spreed

      checkURL();

      // fetch theme_color
      console.log(JSON.stringify({action: {color_theme: document.querySelector(`head > meta[name="theme-color"]`).content}}));

      // add open user settings menu link instead of default to prevent default behaviour
      if (!document.getElementById('user_settings_link')) {
        let li = document.createElement("li");
        li.classList.add("menu-entry");
        li.setAttribute('id', 'user_settings_link');

        let a = document.createElement("a");
        a.setAttribute('href', '/settings/user');
        a.textContent += user_settings_link_loc;
        
        let img = document.createElement("img");
        img.setAttribute('src', '/apps/settings/img/admin.svg');
        
        a.insertBefore(img, a.firstChild);
        li.appendChild(a);

        const firstrunwizardAbout = document.getElementById('firstrunwizard_about');
        if (firstrunwizardAbout) {
          firstrunwizardAbout.parentNode.insertBefore(li, firstrunwizardAbout);
        }
      }
      
      // add open NC in default browser menu link 
      if (!document.getElementById('nc_link')) {
        let li = document.createElement("li");
        li.classList.add("menu-entry");
        li.setAttribute('id', 'nc_link');

        let a = document.createElement("a");
        a.setAttribute('href', '/');
        a.setAttribute('target', '_blank');
        a.textContent += nc_link_loc;
        
        let img = document.createElement("img");
        img.setAttribute('src', '/core/img/favicon-mask.svg');
        
        a.insertBefore(img, a.firstChild);
        li.appendChild(a);

        const firstrunwizardAbout = document.getElementById('firstrunwizard_about');
        if (firstrunwizardAbout) {
          firstrunwizardAbout.parentNode.insertBefore(li, firstrunwizardAbout);
        }
      }

      // hide so user_menu elements (css won't work anymore after NC 29)
      if ((parseInt(_oc_config.version.split('.')[0], 10)) > 29) {
        const accessibilitySettings = document.getElementById('accessibility_settings');
        if (accessibilitySettings && accessibilitySettings.parentNode) {
          accessibilitySettings.parentNode.style.display = 'none';
        }
        
        const settings = document.getElementById('settings');
        if (settings && settings.parentNode) {
          settings.parentNode.style.display = 'none';
        }
        
        const adminSettings = document.getElementById('admin_settings');
        if (adminSettings && adminSettings.parentNode) {
          adminSettings.parentNode.style.display = 'none';
        }
        
        const coreApps = document.getElementById('core_apps');
        if (coreApps && coreApps.parentNode) {
          coreApps.parentNode.style.display = 'none';
        }
        
        const coreUsers = document.getElementById('core_users');
        if (coreUsers && coreUsers.parentNode) {
          coreUsers.parentNode.style.display = 'none';
        }
        
        const help = document.getElementById('help');
        if (help && help.parentNode) {
          help.parentNode.style.display = 'none';
        }
        
        console.log(JSON.stringify({action: "css_fix"}));
      }

      /*if ((parseInt(_oc_config.version.split('.')[0], 10)) > 30) {
        const avatarStatus = document.querySelector('span.avatardiv__user-status');
        avatarStatus.classList.add("fixed");
      }*/

      console.log(JSON.stringify({action: "try_apply_theme_and_lang"}));

      // add pinger every 5 seconds to check NC alive
      var interval = setInterval(function () {
        pingUrl(location.protocol + '//' + location.host);
        // TODO in further version we shouldn't recalc_counters_summary here as this function should be updated to use API requests
        recalc_counters_summary();  
      }, 5000);
    }
  }

}, 500)