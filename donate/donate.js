document.addEventListener('DOMContentLoaded', () => {

    window.electronAPI.receive('load-donate-data', (data) => {
        document.getElementById('modal-title').innerHTML = data.title;
        document.title = data.win_title;
        document.getElementById('modal-detail').textContent = data.detail;
        document.querySelector('#app_icon img').src = data.icon;

        if (data.theme == 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.add('light-theme');
        }
        
        const buttonsContainer = document.getElementById('modal-buttons');
        buttonsContainer.innerHTML = '';
        
        data.buttons.forEach((buttonData, index) => {
            const button = document.createElement('button');
            button.innerHTML = buttonData.text;
            button.setAttribute('data-index', index);
            button.addEventListener('click', () => {
                window.electronAPI.send('donate-modal-response', index);
            });
            buttonsContainer.appendChild(button);
        });
    });
});