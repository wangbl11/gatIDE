browser.runtime.onMessage.addListener(notify);

function xhrRequest (step){
	 var url="http://127.0.0.1:5000/sendTeststep";
	 var xmlhttp = new XMLHttpRequest();
	 xmlhttp.onreadystatechange = function() {
         console.log(xmlhttp.readyState);
         console.log('fail with status: '+xmlhttp.status);

     };
	 xmlhttp.open("POST", url, true);
     xmlhttp.setRequestHeader('content-type', 'application/json');
     var newjson=JSON.stringify({"step":step});
     xmlhttp.send(newjson);
}

function initScript(){
}
function saveStep(step) {

}
function notify(message) {
  console.log(message.step);
	xhrRequest(message.step);
}
