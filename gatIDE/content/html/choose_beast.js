function onError(error) {
  console.log(`Error: ${error}`);
}
function onScript(error){
	console.log('finish');
}
browser.tabs.executeScript({file: "/content/html/loader.js"})
.then(onScript)
.catch(onError);