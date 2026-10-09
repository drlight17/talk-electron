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

async function get_Notifications(data, win_noti_id, position, win_index, x_dismiss_all, y_dismiss_all) {
    try {
        // to remove all bad control characters
        data = data.replace(/[\x00-\x1F\x7F]/g, '');
        data = data.replace(/\n/g, '\\n');
        data = data.replace(/\t/g, '\\t');
        data = data.replace(/\\/g, '\\\\');

        let data_parsed = JSON.parse(data);

        if (data_parsed.tag === undefined) {
            ipcRenderer.send('main', JSON.stringify({'action': {'notification': "demo", 'avatar': "", 'win_noti_id': win_noti_id, 'data_parsed':data_parsed, 'position': position, 'win_index':win_index, 'x_dismiss_all':x_dismiss_all,'y_dismiss_all':y_dismiss_all}}));
            return;
        }

        const response = await apiCall(
            '/ocs/v2.php/apps/notifications/api/v2/notifications/'+data_parsed.tag+'?format=json', 
            'GET'
        )
        const resp = await JSON.parse(response);
        getBase64FromImageUrl(resp.ocs.data.subjectRichParameters.call['icon-url']).then(base64 => {
            ipcRenderer.send('main', JSON.stringify({'action': {'notification': resp.ocs.data, 'avatar': base64, 'win_noti_id': win_noti_id, 'data_parsed':data_parsed, 'position': position, 'win_index':win_index,'x_dismiss_all':x_dismiss_all,'y_dismiss_all':y_dismiss_all}}));
        });
    }
    catch(error) {

        ipcRenderer.send('main', JSON.stringify({'action': {'notification_get_error': error, 'win_noti_id': win_noti_id }}));
    }
}


function checkMessageForWakeUp(response) {

    if (!response?.ocs?.data) {
        return false;
    }

    const chats = Array.isArray(response.ocs.data)
        ? response.ocs.data
        : [];

    for (const chat of chats) {
        if (chat && typeof chat.unreadMessages === 'number' && chat.type < 4 ) {
            if ((chat.lastMessage.message.includes("wake_up_neo_"+chat.lastMessage.token)) && (chat.type == 1)) {
                if (chat.lastReadMessage !== chat.lastMessage.id) {
                    // send IPC response to electron app
                    ipcRenderer.send('main', JSON.stringify({'action': { wake_up_neo: JSON.stringify(chat.lastMessage) }}));
                    // mark as read
                    markMessageForWakeUpRead(chat.lastMessage.token, chat.lastMessage.actorDisplayName);
                }
            }
        }
    }
}

async function markMessageForWakeUpRead(chat_token, chat_displayName) {
    let result = await apiCall(
        `/ocs/v2.php/apps/spreed/api/v1/chat/${chat_token}/read`,
        `POST`
    );
}

// Store the previous total for comparison
let previousTotalUnreadMessagesCounter = null;

// function to replace localStorage based recalc_counters_summary 
async function unreadFetch(removed){
    let totalUnreadMessagesCounter = 0;
    let totalUnreadMessages = [];
    //const modifiedSince = Math.floor(Date.now() / 1000) - unread_int;
    // to force get unread from old conversations
    let modifiedSince = 0;
    try {

        let response = await apiCall(
          `/ocs/v2.php/apps/spreed/api/v4/room?modifiedSince=${modifiedSince}&includeStatus=true`,
          'GET',
          undefined,
          'include',
          undefined,
          3000 // 3 seconds
        );

        let response_json = JSON.parse(response);

        /*if (response_json?.ocs?.meta.statusCode != 200) {
            loading('finished');
        } else {
            loading('not_respond');
        }*/

        checkMessageForWakeUp(response_json);

        let modifiedConversations = response_json?.ocs?.data;

        modifiedConversations.forEach((conversation, index) => {
            if (conversation && typeof conversation.unreadMessages === 'number' && conversation.type < 4) {
                
                totalUnreadMessagesCounter += conversation.unreadMessages;
                
            }
            // last message chat id and token fetch; TODO refactor this way to transfer chat id and token for message_link in main.js
            if ((conversation.unreadMessages != 0) && (typeof conversation.unreadMessages === 'number')) {
                totalUnreadMessages.push(conversation.token);
                ipcRenderer.send('main', JSON.stringify({'action': {'token': conversation.lastMessage.token, 'id':conversation.lastMessage.id}}));
            }
        });

        if (totalUnreadMessagesCounter !== previousTotalUnreadMessagesCounter) {

            previousTotalUnreadMessagesCounter = totalUnreadMessagesCounter;
            ipcRenderer.send('main', JSON.stringify({'action': {'unread': totalUnreadMessagesCounter, 'removed': removed, 'unread_chat_tokens': JSON.stringify(totalUnreadMessages) }}));
        }
    }
    
    catch (err) {
        console.log(err);
    }
}


unreadFetch();



