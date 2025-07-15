function showCustomNotification(data, dismiss, open, open_title, timeout, theme, appIcon, avatar, close_after) {

  const container = document.getElementById('notification-container');
  if (theme == 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.add('light-theme');
  }

  container.title = open_title;
  try {
    // to remove all bad control characters
    data = data.replace(/[\x00-\x1F\x7F]/g, '');
    data = data.replace(/\n/g, '\\n');
    data = data.replace(/\t/g, '\\t');
    data = data.replace(/\\/g, '\\\\');

    data = JSON.parse(data);

    // Create notification element
    const notif = document.createElement('div');
    notif.className = 'notification';
    let ava_html = '';
    if (avatar) {
      ava_html = `<img src="${avatar}" alt="Avatar" />`
    }
    notif.innerHTML = `
      <button title="${dismiss}" class="close-btn">&times;</button>
      <p class="title">${ava_html}&nbsp;&nbsp;<strong>${data.title}</strong></p>
      <p>${data.body}</p>
      <button title="${open_title}" class="read-btn">${open}</button>
      <div class="timer-number" id="timer"></div>
      <div id="notification-title"><img src="${appIcon}" alt="App icon" />&nbsp;&nbsp;NC Talk Electron</div>
    `;

    // Dismiss on close-btn click
    notif.querySelector('.close-btn').addEventListener('click', (event) => {
    //container.addEventListener('click', () => {
        notif.classList.add('slide-out');
        setTimeout(() => {
          notif.remove();
          self.close();
        }, 300);
    });

    // open message tag link at read-btn
    notif.querySelector('.read-btn').addEventListener('click', (event) => {
    //container.addEventListener('click', (event) => {
      event.stopPropagation(); // prevent parent container click
      notif.classList.add('slide-out');
      setTimeout(() => {
        notif.remove();
        self.close();
      }, 300);
      // open message tag link
      console.log(JSON.stringify({'action': {'open_message': data.tag }}));
    });

    // Auto-dismiss after timeout

    if ((timeout > 0) && (typeof timeout !== 'undefined')) {
      let dismissTimeout;
      let total = timeout; // total seconds
      let remaining = total;

      const timerDisplay = notif.querySelector('#timer');

      const updateTimer = () => {
        if (timerDisplay) {
          timerDisplay.innerHTML = close_after + '&nbsp;' + remaining;
        }
      };

      const startDismissTimer = () => {
        remaining = total;
        updateTimer();
        timerDisplay.classList.remove('fade-out'); // reset fade

        clearInterval(dismissTimeout); // Clear any previous interval

        dismissTimeout = setInterval(() => {
          remaining--;

          if (remaining <= 0) {
            clearInterval(dismissTimeout);
            if (container.contains(notif)) {
              // Start fade-out animation
              timerDisplay.classList.add('fade-out');

              // Wait for animation to finish before removing
              setTimeout(() => {
                notif.classList.add('slide-out'); // Optional: slide-out animation
                setTimeout(() => {
                  notif.remove();
                  self.close();
                }, 300);
              }, 200); // match fade-out duration
            }
          } else {
            updateTimer();
          }
        }, 1000);
      };

      // Start initial timer
      startDismissTimer();

      // Pause timer on hover
      notif.addEventListener('mouseenter', () => {
        clearInterval(dismissTimeout);
      });

      // Restart timer on mouse leave
      notif.addEventListener('mouseleave', () => {
        startDismissTimer(); // Reset countdown
      });
    }


    // Add to DOM
    container.appendChild(notif);
  }
  catch(err) {
    console.log(err)
  }

}