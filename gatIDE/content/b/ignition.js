/** After loading the code, runs all the post-load hooks, then switches to the startup view. */

builder.plugins.start(function() {
  builder.loaded = true;
  for (var i = 0; i < builder.postLoadHooks.length; i++) {
    builder.postLoadHooks[i]();
  }

  if (builder.plugins.getGotoPluginsView()) {
    builder.gui.switchView(builder.views.plugins);
    builder.plugins.setGotoPluginsView(false);
  } else {
    builder.gui.switchView(builder.views.startup);
  }

  window.title = "GAT Builder";
  
  var deleteCookies = true;
  sebuilder.prefManager.setBoolPref("extensions.seleniumbuilder3.clearCookies", deleteCookies);
  builder.record.startRecording("www.baidu.com", builder.selenium2, deleteCookies);
});
