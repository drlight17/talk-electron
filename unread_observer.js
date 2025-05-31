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

function recalc_counters_summary (removed) {

    let totalUnreadMessages = 0;
    try {
        let found_key = getItemsByPartialKey('_cachedConversations')[0].key
        const cachedConversationsStr = localStorage.getItem(found_key);
        if (!cachedConversationsStr) {
            //console.warn('Ключ "_cachedConversations" не найден в localStorage.');
            return;
        }

        let cachedConversations;
        try {
            cachedConversations = JSON.parse(cachedConversationsStr);
        } catch (parseError) {
            //console.error('Не удалось распарсить "_cachedConversations" как JSON:', parseError);
            return;
        }

        if (!Array.isArray(cachedConversations)) {
            //console.warn('Ожидается, что "_cachedConversations" будет массивом.');
            return;
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

            if ((conversation) && (conversation.lastMessage.systemMessage == 'call_started') && (conversation.participantFlags != 7)) {
                //console.log(conversation.name + " is calling!")
                console.log(JSON.stringify({'action': {'call': conversation}}));
            }

            // last message chat id and token fetch
            if ((conversation.unreadMessages != 0) && (typeof conversation.unreadMessages === 'number')) {
                console.log(JSON.stringify({'action': {'token': conversation.lastMessage.token, 'id':conversation.lastMessage.id}}));
            }

        });

        //console.log(`Общее количество непрочитанных сообщений: ${totalUnreadMessages}`);
        if (removed) {
            localStorage.removeItem(found_key);
        }
        console.log(JSON.stringify({'action': {'unread': totalUnreadMessages, 'removed': removed}}));
        return found_key;

    } catch (error) {
        console.log(JSON.stringify({'action': {'unread': 0, 'removed': removed}}));
        //console.error('Произошла ошибка при обработке "_cachedConversations":', error);
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
