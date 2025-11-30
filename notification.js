// Create notification element
let notif = document.createElement('div');
let animation_direction_in = '';
let animation_direction_out = '';
let dismissTimeout;
let total;
let remaining;
let timerDisplay;
let src_body_opacity;
let new_body_opacity;

function showCustomNotification(win_noti_id, data, dismiss, dismiss_all, dismiss_all_title, open, open_title, theme, appIcon, avatar, notification_position, win_main_index, account_string, server_color, notification_type) {

  const container = document.getElementById('notification-container');

  if (theme == 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.add('light-theme');
  }

  if (notification_position.includes('left')) {
    animation_direction_in = "slide-in-left";
    animation_direction_out = "slide-out-left";
  } else {
    animation_direction_in = "slide-in-right";
    animation_direction_out = "slide-out-right";
  }

  try {
    // to remove all bad control characters
    data = data.replace(/[\x00-\x1F\x7F]/g, '');
    data = data.replace(/\n/g, '\\n');
    data = data.replace(/\t/g, '\\t');
    data = data.replace(/\\/g, '\\\\');

    data = JSON.parse(data);

    notif.className = 'notification';
    let ava_html = '';
    if (avatar != '') {
      ava_html = `<img src="${avatar}" alt="Avatar" />`
    }
    notif.title=open_title;

    notif.innerHTML = `
      <span>
        <button title="${dismiss_all_title}" id="dismiss_all">${dismiss_all}</button>
        <button title="${dismiss}" class="close-btn">&times;</button>
      </span>
      <div class="win_index">[ ${win_main_index} ]
        <div class="account_id">${account_string}</div>
      </div>
      <p class="title">${ava_html}&nbsp;&nbsp;<strong>${data.title}</strong></p>
      <p class="data-body">${data.body}</p>
      <div class="timer-container hidden">
        <svg class="circular-timer" viewBox="0 0 40 40">
          <circle class="timer-ring-background" cx="20" cy="20" r="18"></circle>
          <circle class="timer-ring-progress" cx="20" cy="20" r="18"></circle>
        </svg>
        <div class="timer-number" id="timer"></div>
      </div>
      <div id="notification-title"><img src="${appIcon}" alt="App icon" />&nbsp;&nbsp;NC Talk Electron</div>
    `;
    
    if (isTextLongAndHasSpace(notif.querySelector('.data-body'),50)) {
      notif.querySelector('.data-body').classList.add('fade-mask');
    }

    // if notification_type is call set .notification p.title white-space
    if (notification_type == 'call') {
      notif.querySelector('p.title').classList.add('call');
    }
    
    // apply color theme
    if (server_color) {
      notif.classList.add('mix-color');
      notif.style.setProperty('--mix-color', server_color);
    }

    notif.classList.add(animation_direction_in);

    // Dismiss on close-btn click
    notif.querySelector('.close-btn').addEventListener('click', (event) => {
        event.stopPropagation();
        notif.classList.remove(animation_direction_in);
        notif.classList.add(animation_direction_out);
        setTimeout(() => {
          notif.remove();
          self.close();
          console.log(JSON.stringify({'action': {'dismissed': win_noti_id }}));
        }, 300);
    });

    // open message tag link at read-btn
    notif.addEventListener('click', (event) => {
      notif.classList.remove(animation_direction_in);
      notif.classList.add(animation_direction_out);
      setTimeout(() => {
        notif.remove();
        self.close();
        console.log(JSON.stringify({'action': {'dismissed': win_noti_id }}));
      }, 300);
      console.log(JSON.stringify({'action': {'open_message': data.tag }}));
    });

    // Pause timer on hover
    notif.addEventListener('mouseenter', () => {
      clearInterval(dismissTimeout);
    });

    // Restart timer on mouse leave
    notif.addEventListener('mouseleave', () => {
      startDismissTimer(win_noti_id); // Reset countdown
    });

    // Start initial timer
    startDismissTimer(win_noti_id);

    // Add to DOM
    container.appendChild(notif);

  }
  catch(err) {
    console.log(err)
  }
}

function isTextLongAndHasSpace(element, minLength) {
  if (!element || typeof element !== 'object' || element.nodeType !== Node.ELEMENT_NODE) {
    //console.error('Первый аргумент должен быть DOM элементом');
    return false;
  }

  const text = element.textContent || element.innerText || "";
  const isLongEnough = text.length > minLength;
  const hasSpace = /\s/.test(text);

  return isLongEnough && hasSpace;
}

function updateDismissAllButton (counter){
  // if counter > 1 show dismiss all button
  let dismiss_all_button = notif.querySelector('#dismiss_all')
  if (counter > 1) {
    dismiss_all_button.classList.add('visible');
    notif.classList.add('multiple');
    document.body.classList.add('multiple');
  } else {
    dismiss_all_button.classList.remove('visible');
    notif.classList.remove('multiple');
    document.body.classList.remove('multiple');
  }
  // dismiss all notifications action
  dismiss_all_button.addEventListener('click', (event) => {
    event.stopPropagation();
    console.log(JSON.stringify({'action': 'dismissed_all'}));
  })
}

function updateDismissTimeout(timeout,win_noti_id) {

  if ((timeout > 0) && (typeof timeout !== 'undefined')) {
    src_body_opacity = parseFloat(getComputedStyle(document.body).opacity);
    new_body_opacity = src_body_opacity;
    total = timeout * 10;
    remaining = total;
    timerDisplay = notif.querySelector('#timer');

    window.updateTimer = function() {
      if (!timerDisplay) return;
      const progressCircle = notif.querySelector('.timer-ring-progress');
      const circumference = 2 * Math.PI * 18; // 2πr где r=18
      const remainingPercent = remaining / total * 100;
      notif.querySelector('.timer-container').classList.remove('hidden');

      if (remainingPercent > 33) {
        const progress = (remainingPercent - 33) / (100 - 33);
        new_body_opacity = src_body_opacity * (0.7 + 0.3 * progress);
      } else if (remainingPercent > 0) {
        const progress = remainingPercent / 33;
        const expFactor = Math.pow(progress, 2);
        new_body_opacity = src_body_opacity * (0.2 + 0.5 * expFactor);
      } else {
        new_body_opacity = src_body_opacity * 0.1;
      }
      document.body.style.opacity = new_body_opacity.toFixed(2);
      timerDisplay.innerHTML = '&nbsp;' + Math.round(remaining / 10);
      if (progressCircle) {
        progressCircle.style.strokeDasharray = circumference;
        const progress = (remaining / total) * circumference;
        progressCircle.style.strokeDashoffset = circumference - progress;
      }
    };
  }
}

function startDismissTimer(win_noti_id) {

  remaining = total;
  
  if (typeof updateTimer === 'function') {
    updateTimer();
  }
  
  if (timerDisplay) {
    timerDisplay.classList.remove('fade-out');
  }

  clearInterval(dismissTimeout);

  dismissTimeout = setInterval(() => {
    remaining--;

    if (remaining <= 0) {
      clearInterval(dismissTimeout);
      if (timerDisplay && timerDisplay.parentNode) {
        timerDisplay.classList.add('fade-out');
        if (notif && notif.parentNode) {
          notif.classList.remove(animation_direction_in);
          notif.classList.add(animation_direction_out);
          setTimeout(() => {
            if (notif && notif.parentNode) {
              notif.remove();
              self.close();
              console.log(JSON.stringify({'action': {'dismissed': win_noti_id }}));
            }
          }, 300);
        }
      }
    } else {
      if (typeof updateTimer === 'function') {
        updateTimer();
      }
    }
  }, 100);
};

function slideAway(id) {
  console.log(JSON.stringify({'action': {'dismissed': id }}));
  if (notif && notif.parentNode) {
    notif.classList.remove(animation_direction_in);
    notif.classList.add(animation_direction_out);
    setTimeout(() => {
        if (notif && notif.parentNode) {
          notif.remove();
          self.close();
        }
      }, 300);
  }
}