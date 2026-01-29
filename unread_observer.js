// function for app startup unread detection and fetch

function getItemsByPartialKey(partialKey) {
    const matchingItems = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key.includes(partialKey)) {
            const value = localStorage.getItem(key);
            matchingItems.push({ key, value });
        }
    }

    return matchingItems;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function() {
      resolve(reader.result); // This is the base64 string
    };
    reader.onerror = function(error) {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
}

async function getBase64FromImageUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // Base64 string
      reader.onerror = error => reject(error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching or converting image:", error);
  }
}

async function get_Notifications(data, win_noti_id, position, win_index) {
    let data_parsed = JSON.parse(data);
    if (data_parsed.tag === undefined) {
        console.log(JSON.stringify({'action': {'notification': "demo", 'avatar': "", 'win_noti_id': win_noti_id, 'data_parsed':data_parsed, 'position': position, 'win_index':win_index}}));
        return;
    }
    try {
        const response = await fetch('/ocs/v2.php/apps/notifications/api/v2/notifications/'+data_parsed.tag+'?format=json', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'OCS-APIRequest': 'true',
            'requesttoken': OC.requestToken,
            'Content-Type': 'application/json'
          }/*,
          body: JSON.stringify({ statusType: 'online' })*/
        })
        const resp = await response.json();
        getBase64FromImageUrl(resp.ocs.data.subjectRichParameters.call['icon-url']).then(base64 => {
            //console.log(resp.ocs.data)
            console.log(JSON.stringify({'action': {'notification': resp.ocs.data, 'avatar': base64, 'win_noti_id': win_noti_id, 'data_parsed':data_parsed, 'position': position, 'win_index':win_index}}));
        });
    }
    catch(error) {
        console.error("Error getting notification by tag "+data_parsed.tag+": ", error);
    }
}

/*async function get_avatar(conversation) {

    const response = await fetch('/ocs/v2.php/apps/spreed/api/v1/room/'+conversation.lastMessage.token+'/avatar?format=json', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'OCS-APIRequest': 'true',
        'requesttoken': OC.requestToken,
        'Content-Type': 'application/json'
      }
    })

    const blob = await response.blob();

    blobToBase64(blob)
      .then(base64String => {
        console.log(JSON.stringify({'action': {'call': conversation, 'avatar': base64String}}));
      })
      .catch(err => {
        console.error("Conversion failed:", err);
      });
}*/

// Store the previous total for comparison
let previousTotalUnreadMessages = null; // Используем null как начальное значение

async function recalc_counters_summary (removed) {
    let totalUnreadMessages = 0;
    try {
        let found_key = getItemsByPartialKey('_cachedConversations')[0].key
        const cachedConversationsStr = localStorage.getItem(found_key);
        if (!cachedConversationsStr) {
            //console.warn('Ключ "_cachedConversations" не найден в localStorage.');
            console.log(JSON.stringify({'action': {'unread': 0, 'removed': removed}}));
            return found_key;
        }

        let cachedConversations;
        try {
            cachedConversations = JSON.parse(cachedConversationsStr);
        } catch (parseError) {
            //console.error('Не удалось распарсить "_cachedConversations" как JSON:', parseError);
            console.log(JSON.stringify({'action': {'unread': 0, 'removed': removed}}));
            return found_key;
        }

        if (!Array.isArray(cachedConversations)) {
            //console.warn('Ожидается, что "_cachedConversations" будет массивом.');
            console.log(JSON.stringify({'action': {'unread': 0, 'removed': removed}}));
            return found_key;
        }
        
        cachedConversations.forEach((conversation, index) => {

            if (conversation && typeof conversation.unreadMessages === 'number') {
                totalUnreadMessages += conversation.unreadMessages;
            } else {
                //console.warn(`Чат под индексом ${index} не содержит поля "unreadMessages" или оно не является числом.`);
            }

            // incoming call hook
            /*if ((conversation) && (conversation.hasCall) && (conversation.participantFlags != 7)) {
                //console.log(conversation)
                console.log(JSON.stringify({'action': {'call': conversation}}));
            }*/

            // statuses are: call_ended, call_missed, call_started
            // participantFlags == 7 means you're the caller, participantFlags == 0 - someone calls you
            let onehourago = new Date(Date.now() - (60 * 60 * 1000));
            let lastMessagetimestamp = new Date(conversation.lastMessage.timestamp*1000);

            /*if ((conversation) && ((conversation.lastMessage.systemMessage.includes('call_started'))||(conversation.lastMessage.systemMessage.includes('call_missed')) || (conversation.lastMessage.systemMessage.includes('call_ended'))) && (conversation.participantFlags != 7)) {

                //console.log(conversation.name + " is calling!")
                if (lastMessagetimestamp > onehourago) {
                    get_avatar(conversation);
                }
            }*/

            // last message chat id and token fetch
            if ((conversation.unreadMessages != 0) && (typeof conversation.unreadMessages === 'number')) {
                console.log(JSON.stringify({'action': {'token': conversation.lastMessage.token, 'id':conversation.lastMessage.id}}));
            }
        });

        //console.log(`Общее количество непрочитанных сообщений: ${totalUnreadMessages}`);
        
        if (totalUnreadMessages !== previousTotalUnreadMessages) {
            console.log(JSON.stringify({'action': {'unread': totalUnreadMessages, 'removed': removed}}));
            previousTotalUnreadMessages = totalUnreadMessages;
        }
        
        if (removed) {
            localStorage.removeItem(found_key);
        }
        
        return found_key;

    } catch (error) {
        console.log(JSON.stringify({'action': {'unread': 0, 'removed': removed}}));
        //console.error('Произошла ошибка при обработке "_cachedConversations":', error);
        //return found_key;
    }
}

const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
    const event = new Event('localStorageChange');
    event.key = key;
    event.newValue = value;
    event.oldValue = localStorage.getItem(key);

    originalSetItem.apply(this, arguments);

    window.dispatchEvent(event);
};

localStorage.removeItem = function(key) {
    const event = new Event('localStorageChange');
    event.key = key;
    event.oldValue = localStorage.getItem(key);

    originalRemoveItem.apply(this, arguments);

    window.dispatchEvent(event);
};

let found_key = recalc_counters_summary ();

window.addEventListener('localStorageChange', (event) => {
    if (event.key === found_key) { // замените 'yourKey' на ключ, который хотите отслеживать
      //console.log(`Значение ключа "${event.key}" изменено с ${event.oldValue} на ${event.newValue}`);
      recalc_counters_summary ();
    }
});
