// try to find Nextcloud scripts (tested on Nextcloud 28)

if (_oc_config.version.localeCompare("28.0.0.0", undefined, { numeric: true, sensitivity: 'base' }) == '-1') {
  console.log(JSON.stringify({action: "not_found"}));
}
