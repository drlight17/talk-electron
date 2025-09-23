let debounce;

// temp force close navi-menu if user menu is opened 
waitForElm('#user-menu').then((elm) => {

  let observer2 = new MutationObserver(mutations => {
    //let clicked = false;
    mutations.forEach(function(mutation) {
      if (mutation.target.className.includes('header-menu--opened')) {
        var expanded = ($('.app-navigation-toggle-wrapper button').attr( "aria-expanded") === 'true');
        if (expanded) {
            clearTimeout(debounce);
            debounce = setTimeout(function() {
              $('.app-navigation-toggle-wrapper button').click();
              $(elm).children("button:first").click();
            }, 100);
        }
      }
    }); 
  }); 

  observer2.observe(elm, {
    attributes: true, 
    attributeFilter: ['class']
  });
})

//const $toggleButton = $('.app-navigation-toggle-wrapper button');

// blur chat zone when navi menu is opened 

const buttonSelector = '.app-navigation-toggle-wrapper button';
let fullscreen = false;
let observer3 = null;

function isFullscreen() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.mozFullScreenElement || 
              document.msFullscreenElement);
}

function isMaximized() {
    // Get available screen space (excluding taskbar)
    const availWidth = screen.availWidth;
    const availHeight = screen.availHeight;
    
    // Check if window matches available screen size
    const widthMatches = Math.abs(window.outerWidth - availWidth) <= 10;
    const heightMatches = Math.abs(window.outerHeight - availHeight) <= 10;
    
    // Make sure it's not fullscreen (which would match screen size exactly)
    const Fullscreen = isFullscreen();
    
    return (widthMatches && heightMatches) || Fullscreen;
}

// Function to handle the attribute change
function handleAriaExpandedChange(elm) {

  clearTimeout(debounce);
  debounce = setTimeout(function() {
    // check if fullscreen - remove #body-user #header z-index
    //if (!window.screenTop && !window.screenY) {
    if (isMaximized()) {
        //console.log('Browser is maximized or fullscreen.');
        document.getElementById('header').classList.add("fullscreen_fix");
        fullscreen = true;
    } else {
      document.getElementById('header').classList.remove("fullscreen_fix");
      fullscreen = false;
    }


    //if (!fullscreen) {
      if ($(window).width() <= 910)  {
        // redetect elm to observer as it is recreated
        if (!isElementInDOM(elm[0])) {
          //console.log("Button was removed. Start new observer")
          startToggleButtonObserver(buttonSelector);
          return;
        }

        let isExpanded = elm.attr('aria-expanded') === "true";
         //console.log(elm.attr('aria-expanded'));

        if (isExpanded) {
          //console.log("The button is expanded.");
          document.getElementById('app-content-vue').classList.add("blurred");
        } else {
          //console.log("The button is collapsed.");
          document.getElementById('app-content-vue').classList.remove("blurred");
        }
      } else {
        document.getElementById('app-content-vue').classList.remove("blurred");
      }
    //}
  }, 200);
}

function startToggleButtonObserver(buttonSelector) {
  waitForElm(buttonSelector).then((elm) => {
    // Create a MutationObserver to monitor attribute changes
    // turn off previous if exist
    if (observer3) {
      observer3.disconnect();
      observer3 = null;
    }

    observer3 = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
          handleAriaExpandedChange($(elm));
        }
      }
    });

    if ($(elm).length > 0) {
      // Start observing the button for attribute changes

      observer3.observe($(elm)[0], {
        attributes: true, // Monitor attribute changes
      });

      // Initial check in case the attribute is already set
      handleAriaExpandedChange($(elm));
    } else {
      console.error("Target button not found!");
    }

    $(window).resize(function() {
        handleAriaExpandedChange($(elm));
    })

  })
}

startToggleButtonObserver(buttonSelector);



// to close navi menu if modal is appear - deprecated since 0.5.1-alpha bad user experience
/* 
waitForElm('#body-user').then((elm) => {
  //console.log($(elm));
  let observer3 = new MutationObserver(mutations => {
    //let clicked = false;
    mutations.forEach(function(mutation) {
      //console.log($(mutation.target));
      if ((mutation.target.className.includes('modal-in-enter-to')) || (mutation.target.className.includes('modal-in-leave-to'))) {
          clearTimeout(debounce);
          debounce = setTimeout(function() {
            // to not open navi menu when upload file
            if ($('.app-navigation-toggle-wrapper button').attr('aria-expanded') === "true") {
              $('.app-navigation-toggle-wrapper button').click();
            }
          }, 100);
      }
    }); 
  }); 

  observer3.observe(elm, {
    attributes: true,
    //childList: true,
    subtree: true,
    attributeFilter: ['class']
  });
})
*/

// to close navi menu if click the space away from .app-navigation - deprecated since 0.5.1-alpha bad user experience

/*waitForElm('#content-vue > div').then((elm) => {
  var block_navi_hide = false;
  $(window).resize(function() {
    // block if window is not narrow
    if ($(this).width() > 1024) {
        block_navi_hide = true;
    }
    else {
        block_navi_hide = false;
    }
  })

  var object_under_cursor = "";

  
  document.addEventListener('mousemove', function(e) {
    object_under_cursor = $(document.elementFromPoint(e.pageX, e.pageY));
  })
  $(elm).on("focusout", function() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      //console.log('Navi lost focus!');
      if (!block_navi_hide) {
        if ($(object_under_cursor.closest('.app-navigation')).length<1) {
          if ($('.app-navigation-toggle-wrapper button').attr('aria-expanded') === "true") {
                  $('.app-navigation-toggle-wrapper button').click();
          }
        }
      }
    }, 500);
  });
})*/

