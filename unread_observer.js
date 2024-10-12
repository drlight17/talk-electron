// function for app startup unread detection and fetch

function getItemsByPartialKey(partialKey) {
    const matchingItems = [];

    // Проходим по всем ключам в localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i); // Получаем ключ по индексу

        // Проверяем, содержит ли ключ искомую часть
        if (key.includes(partialKey)) {
            const value = localStorage.getItem(key); // Получаем значение ключа
            matchingItems.push({ key, value }); // Сохраняем ключ и значение в массив
        }
    }

    return matchingItems; // Возвращаем массив найденных элементов
}

function recalc_counters_summary (removed) {
    let totalUnreadMessages = 0;
    try {
        // Шаг 1: Извлечение данных из localStorage
        let found_key = getItemsByPartialKey('_cachedConversations')[0].key
        const cachedConversationsStr = localStorage.getItem(found_key);
        if (!cachedConversationsStr) {
            //console.warn('Ключ "_cachedConversations" не найден в localStorage.');
            return;
        }


        // Шаг 2: Парсинг JSON
        let cachedConversations;
        try {
            cachedConversations = JSON.parse(cachedConversationsStr);
        } catch (parseError) {
            //console.error('Не удалось распарсить "_cachedConversations" как JSON:', parseError);
            return;
        }

        // Шаг 3: Проверка структуры данных
        if (!Array.isArray(cachedConversations)) {
            //console.warn('Ожидается, что "_cachedConversations" будет массивом.');
            return;
        }

        // Шаг 4: Итерация по чатам и суммирование unreadMessages
        

        cachedConversations.forEach((conversation, index) => {
            // Предполагается, что каждая беседа имеет поле unreadMessages
            // Возможно, структура данных отличается, поэтому нужно проверить
            if (conversation && typeof conversation.unreadMessages === 'number') {
                totalUnreadMessages += conversation.unreadMessages;
            } else {
                //console.warn(`Чат под индексом ${index} не содержит поля "unreadMessages" или оно не является числом.`);
            }
        });

        // Шаг 5: Вывод результата
        //console.log(`Общее количество непрочитанных сообщений: ${totalUnreadMessages}`);
        console.log(JSON.stringify({'action': {'unread': totalUnreadMessages, 'removed': removed}}));
        return found_key;

    } catch (error) {
        //console.error('Произошла ошибка при обработке "_cachedConversations":', error);
    }
}

// Сохраняем оригинальные методы localStorage
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

// Обертка для localStorage.setItem
localStorage.setItem = function(key, value) {
    const event = new Event('localStorageChange');
    event.key = key;
    event.newValue = value;
    event.oldValue = localStorage.getItem(key);

    // Вызов оригинального метода
    originalSetItem.apply(this, arguments);

    // Генерация события для отслеживания изменений
    window.dispatchEvent(event);
};

// Обертка для localStorage.removeItem
localStorage.removeItem = function(key) {
    const event = new Event('localStorageChange');
    event.key = key;
    event.oldValue = localStorage.getItem(key);

    // Вызов оригинального метода
    originalRemoveItem.apply(this, arguments);

    // Генерация события для отслеживания изменений
    window.dispatchEvent(event);
};

let found_key = recalc_counters_summary ();

window.addEventListener('localStorageChange', (event) => {
    if (event.key === found_key) { // замените 'yourKey' на ключ, который хотите отслеживать
      //console.log(`Значение ключа "${event.key}" изменено с ${event.oldValue} на ${event.newValue}`);
      recalc_counters_summary ();
    }
});
