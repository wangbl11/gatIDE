/*
*  Oracle gat specific
*/
builder.gatprefs = {};
/*
builder.gatprefs.defHomeFolder=builder.loader.ds.get("Home", Components.interfaces.nsIFile);
var _datafile=builder.loader.prefs.getCharPref("gat.runner.datafile");
var sfile="gatscript.json"
if (_datafile)
    sfile=_datafile+".json";

builder.gatprefs.scriptFile=sfile; 
*/
builder.gatprefs.DEFAULT_OPTIONS = {
  encoding: "UTF-8",
  recordOnOpen: "true",
  locatorBuildersOrder: "ui,polygon,idname,link,xpath:link,xpath:img,dom:name,descendant:text,uncle:text,xpath:attributes,xpath:href,css,xpath:idRelative,xpath:position,dom:index",
  tcsScriptLocation:"/signin,/epm/login.jsp,/epmlogin.jsp",
  fileLogger_logTimeStamp:"true",
  enableRecordingLog: "false",
  maxSizePerFile: 500,
  fileLogger_logFileName: "ide.txt",
  dynamicIDPatterns:[/^list_item__.+$/i,/^.*[0-9]+$/,/^.*:[0-9]+:.*$/,/^.*[_-][0-9]+.*$/],
  validIDPatterns:[/^[a-zA-Z_\-]+$/],
  notRecordIds:[/RedirectLink/i]
};

//if (builder && builder.loader && builder.loader.loadNextMainScript) { builder.loader.loadNextMainScript(); }
