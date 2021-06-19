'use strict';

function myAnchor(el,c){
  if(!c){
    return null
  }
  return el instanceof HTMLAnchorElement ? el : myAnchor(el.parentNode,c--)
}

function tryOpenATab(ref){

  browser.runtime.sendMessage({tab: "I want it"})
  .then(response => {
    if(response.match){
      window.open(ref,undefined,"noreferrer,noopener");
    }else{
      document.location.assign(ref)
    }
  })  
}

document.addEventListener("click",ev => {
  
  let anchor = myAnchor(ev.target,7);
  if(anchor){
    try{
      let url = new URL(anchor.href);
      if(url.host != document.location.host){
        ev.preventDefault();
        tryOpenATab(anchor.href);
      }
    }catch(e){
      false
    }
  }
})