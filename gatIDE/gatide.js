console.log(window.name);
document.body.style.border = "5px solid green";
//builder.record.recordStep
recorder=new builder.selenium2.Recorder(window,builder.record.recordStep,null);
console.log('finish create recorder');