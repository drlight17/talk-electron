
/*if (!(document.querySelector('head > script[src*="/dist/core-login.js')) && (!(document.querySelector('head > script[src*="/custom_apps/spreed')))) {
  console.log(JSON.stringify({action: "not_found"}));
} else {
  let url = "/apps/theming/image/logo?useSvg=1";
  const fetchImage = async url => {
    const response = await fetch(url)
    const blob = await response.blob()
    //const text = await blob.text()
    console.log(URL.createObjectURL(blob));
    //console.log(JSON.stringify({'icon': Buffer.from(blob)}));
  }
  fetchImage(url);
}
*/
// try to find Nextcloud scripts (tested on Nextcloud 28)

if (_oc_config.version.localeCompare("28.0.0.0", undefined, { numeric: true, sensitivity: 'base' }) == '-1') {
  console.log(JSON.stringify({action: "not_found"}));
}
