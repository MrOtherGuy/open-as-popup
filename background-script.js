'use strict';
const newWindow = new (function(){
  let _windowId = null;
  let _tabId = null;
  
  this.window = () => _windowId;
  this.tab = () => _tabId;
  
  this.set = (win) => {
    _windowId = win.id;
    _tabId = win.tabs[0].id;
  }
  
  this.reset = () => {
    _windowId = null;
    _tabId = null;
  }
  
  return this
})();

function handleMessage(request, sender, sendResponse) {
  
  request.tab && sendResponse({ match: newWindow.tab() === sender.tab.id });
}
browser.runtime.onMessage.addListener(handleMessage);


function defineBrowserAction(context){
  let properties = {
    type: "panel",
    height: 600,
    width: 600
  };
  if(context){
    properties.cookieStoreId = context.cookieStoreId;
  }
  browser.browserAction.onClicked.addListener(async (tab) => {
    
    if(newWindow.tab()){
      browser.windows.update(newWindow.window(),{focused:true})
      return
    }
    
    let url = null;
    try{
      let res = await browser.storage.local.get("url");
      if(res.url){
        url = res.url
      }
    }catch(e){
      // nothing
      return
    }
    properties.url = url;
    let win = await browser.windows.create(properties);
    newWindow.set(win)
   
  })
}


async function setupIdentity(){
  let cid = null;
  let option = await browser.storage.local.get(["userContextEnabled"]);
  if(!option.userContextEnabled){
    return null
  }
  try{
    cid = await browser.contextualIdentities.get("myext-container");
  }catch(e){
    // myext-container doesn't exist
    try{
      cid = await browser.contextualIdentities.create({
        name: "myext-container",
        color: "purple",
        icon: "fence"
      })
    }catch(e){
      // contextualIdentities is not supported
    }
  }
  return cid
}

const contentScriptStore = new (function(){
  let _script = null;
  
  this.clear = (permissions) => {
    if(permissions.origins.length && _script){
      _script.unregister();
      _script = null;
    }
  }
  
  this.store = (script) => {
    _script && _script.unregister();
    _script = null;
    try{
      browser.contentScripts.register(script)
      .then(handle => {_script = handle})
    }catch(e){
      console.log("couldn't register script: "+e)
    }
  }
  this.newFromHosts = (permissions) => {
    if(permissions.origins.length){
      this.store({
        "matches":permissions.origins,
        "js":[{file: "pageScript.js"}],
        "runAt": "document_end"
      })
    }
  }
})();


browser.permissions.onAdded.addListener(contentScriptStore.newFromHosts);
//browser.permissions.onRemoved.addListener(contentScriptStore.clear);


browser.permissions.getAll()
.then(contentScriptStore.newFromHosts)

browser.windows.onRemoved.addListener(id=>(newWindow.window() === id && newWindow.reset()))

setupIdentity()
.then(defineBrowserAction)
