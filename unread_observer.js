// function for app startup unread detection and fetch

function process_value(value) {
  return parseInt(value.replace(/^[ '"]+|[ '"]+$|( ){2,}/g,'$1'));
}


function recalc_counters_summary (removed) {
  let summary = 0;
  $('.counter-bubble__counter').each(function(i, obj) {
    summary += parseInt(obj.innerText); 
  });
  console.log(JSON.stringify({'action': {'unread': summary, 'removed': removed}}));
}

recalc_counters_summary ();

let found = 0;

let observer4 = new MutationObserver(mutationRecords => {
  //console.log(mutationRecords)

  for (const mutation of mutationRecords) {
    if (mutation.target.parentElement.className.includes("bubble")) {
      recalc_counters_summary ();
    }
    
  };

  for (const { addedNodes } of mutationRecords) {
    for (const node of addedNodes) {
      //console.log($(node)[0].innerText)
      if ($(node).find('.counter-bubble__counter').length > 0) {
        recalc_counters_summary ();
        //console.log("New unread messages")
      }
    }
  }

  for (const { removedNodes } of mutationRecords) {
    for (const node of removedNodes) {
      //console.log($(node)[0].innerText)
      if ($(node).find('.counter-bubble__counter').length > 0) {
        recalc_counters_summary (true);
        //console.log("Clear unread messages")
      }
    }
  }
}); 


observer4.observe($('.app-navigation__list').get(0), {
  characterData: true, attributes: false, childList: true, subtree: true
});

