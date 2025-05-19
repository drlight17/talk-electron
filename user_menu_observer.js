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
          //if (!clicked) {
            //clicked = true;
            // to prevent multiple clicking
            clearTimeout(debounce);
            debounce = setTimeout(function() {
              $('.app-navigation-toggle-wrapper button').click();
              $(elm).children("button:first").click();
            }, 100);
          //}
        }
      }
    }); 
  }); 

  observer2.observe(elm, {
    attributes: true, 
    attributeFilter: ['class']
  });
})

waitForElm('#body-user').then((elm) => {
  //console.log($(elm));
  let observer3 = new MutationObserver(mutations => {
    //let clicked = false;
    mutations.forEach(function(mutation) {
      //console.log($(mutation.target));
      if ((mutation.target.className.includes('modal-in-enter-to')) || (mutation.target.className.includes('modal-in-leave-to'))) {
        //if (!clicked) {
          //clicked = true;
          // to prevent multiple clicking
          clearTimeout(debounce);
          debounce = setTimeout(function() {
            // to not open navi menu when upload file
            if ($('.app-navigation-toggle-wrapper button').attr('aria-expanded') === "true") {
              $('.app-navigation-toggle-wrapper button').click();
            }
          }, 300);
        //}
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



waitForElm('#content-vue > div').then((elm) => {
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
})

