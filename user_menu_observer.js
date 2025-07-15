function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        /*observer.observe($('#notifications').get(0), {
            childList: true,
            subtree: true
        });*/
    });
}

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

const $toggleButton = $('.app-navigation-toggle-wrapper button');

// Function to handle the attribute change
function handleAriaExpandedChange() {
  clearTimeout(debounce);
  debounce = setTimeout(function() {
    if ($(window).width() < 1024) {
      let isExpanded = $toggleButton.attr('aria-expanded') === "true";
      
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
  }, 200);
}

// blur chat zone when navi menu is opened 
// Create a MutationObserver to monitor attribute changes
const observer3 = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
      handleAriaExpandedChange();
    }
  }
});

// Start observing the button for attribute changes
if ($toggleButton.length > 0) {
  observer3.observe($toggleButton[0], {
    attributes: true, // Monitor attribute changes
  });

  // Initial check in case the attribute is already set
  handleAriaExpandedChange();
} else {
  console.error("Target button not found!");
}

$(window).resize(function() {
    handleAriaExpandedChange();
})



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

