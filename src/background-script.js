'use strict';
const newWindow = new (function(){
  let _windowId = null;
  let _tabId = null;
  
  this.window = () => _windowId;
  this.tab = () => _tabId;
  
  this.set = (win) => {
    _windowId = win.id;
    _tabId = win.tabs[0].id;
    return true
  };
  this.forget = async function(){
    let infos = await browser.sessions.getRecentlyClosed({maxResults: 2});
    for(let item of infos){
      if(item.tab && item.tab.url === browser.runtime.getURL("helper-page.html")){
        browser.sessions.forgetClosedTab(item.tab.windowId,item.tab.sessionId)
      }else if (item.window){
        browser.sessions.forgetClosedWindow(item.window.sessionId)
      }
    }
  };
  this.reset = () => {
    this.forget()
    .then(()=>{
      _windowId = null;
      _tabId = null;
    })
  }
  return this
})();

function handleMessage(request, sender, sendResponse) {
  
  if(request.tab){
    sendResponse({ match: newWindow.tab() === sender.tab.id });
  }else if(request.doButtonAction){
    onButtonClicked()
    .then(windowWasOpened => {
      if(windowWasOpened){
        browser.tabs.remove(sender.tab.id)
        .then(newWindow.forget)
        browser.windows.update(sender.tab.windowId,{state:"minimized"});
      }
    });
  }else if(request.forget){
    let win = newWindow.window();
    if(win){
      browser.windows.remove(win)
    }
  }
  
}
browser.runtime.onMessage.addListener(handleMessage);

async function onButtonClicked(){
  
  let properties = {
    type: "panel",
    height: 600,
    width: 600
  };
  
  if(newWindow.tab()){
    browser.windows.update(newWindow.window(),{focused:true})
    return
  }
  let context = await setupIdentity();
  if(context){
    properties.cookieStoreId = context.cookieStoreId;
  }
  try{
    let res = await browser.storage.local.get("url");
    if(res.url){
      properties.url = res.url
    }else{
      browser.runtime.openOptionsPage();
      return
    }
  }catch(e){
    // nothing
    return
  }
  
  let win = await browser.windows.create(properties);
  return newWindow.set(win)
 
}

browser.browserAction.onClicked.addListener( onButtonClicked )


async function setupIdentity(){
  let cid = null;
  let option = await browser.storage.local.get(["userContextEnabled"]);
  if(!option.userContextEnabled){
    return null
  }

  try{
    // throws if contextualIdentities is not available
    let ids = await browser.contextualIdentities.query({name:"OAP"});
    // if there is no identity names OAP, then create one
    if(ids.length === 0){
      cid = await browser.contextualIdentities.create({
        name: "OAP",
        color: "purple",
        icon: "fence"
      })
    }else{
      cid = ids[0]
    }
    
  }catch(e){
    // contextualIdentities is not supported
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

browser.permissions.getAll()
.then(contentScriptStore.newFromHosts)

browser.windows.onRemoved.addListener(id=>(newWindow.window() === id && newWindow.reset()))

