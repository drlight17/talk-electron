// function for app startup notifications detection
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

waitForElm('.notification__dot').then((elm) => {
  console.log(JSON.stringify({action: "added"}));
})


let observer = new MutationObserver(mutationRecords => {
  //console.log(mutationRecords)
  let found = false;
  for (const { addedNodes } of mutationRecords) {
    for (const node of addedNodes) {
      //console.log($(node).find('.notification__dot').length)
      if ($(node).find('.notification__dot').length > 0) {
        //found.push(node);
        found = true;
      }
    }
  }

  if (found) {
    console.log(JSON.stringify({action: "added"}));
  }

  found = false;
  for (const { removedNodes } of mutationRecords) {
    for (const node of removedNodes) {
      //console.log($(node).find('.notification__dot').length)
      if ($(node).find('.notification__dot').length > 0) {
        //found.push(node);
        found = true;
      }
    }
  }

  if (found) {
    console.log(JSON.stringify({action: "removed"}));
  }

}); 


observer.observe($('#notifications').get(0), {
  childList: true,
  subtree: true
});

