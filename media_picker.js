const { ipcRenderer } = require('electron');

function localize(id,loc) {
  // localize media_picker.html
    document.getElementById(id).innerHTML = loc;
}

function get_all_ids () {
  var objs = [];
  document.querySelectorAll('label[id], button[id], h2[id]').forEach( obj => {
    if(obj.id)
     objs.push(obj.id);
  });
  ipcRenderer.send('picker', JSON.stringify({action: "return_localize_ids", localization_ids: JSON.stringify(objs)}));
}

function showSources(sources,theme) {

  if (theme == 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.add('light-theme');
  }

  const container = document.getElementById('sources-container');

  for (let source of sources) {

    const isScreen = /screen/i.test(source.id);
    var sourceType = isScreen ? 'screen' : 'window';
    
    const div = document.createElement('div');
    div.className = `source ${sourceType}`;
    div.dataset.id = source.id;
    div.dataset.name = source.name;
    div.dataset.type = sourceType;

    const img = document.createElement('img');
    img.src = source.thumbnail;
    img.alt = source.name;
    img.title = source.name;

    const label = document.createElement('div');
    label.className = 'type-label';
    sourceType = isScreen ? '◼' : '☰';
    label.textContent = sourceType + ' ' + source.name;

    div.addEventListener('click', () => {
      document.querySelectorAll('.source').forEach(el => {
        el.classList.remove('selected');
      });
      div.classList.add('selected');

      document.getElementById('share_button_id').removeAttribute("disabled");

    });

    div.appendChild(img);
    div.appendChild(label);
    container.appendChild(div);
  };
}

function sendPickedMedia() {
  document.querySelectorAll('.selected').forEach(el => {
    ipcRenderer.send('picker', JSON.stringify({action: "media_picked", media_id: el.dataset.id }));
  })
}

function quitMediaPicker() {
  ipcRenderer.send('picker', JSON.stringify({action: "media_picker_quit"}));
}
