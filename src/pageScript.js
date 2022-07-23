'use strict';

function myAnchor(el,c){
  if(!c){
    return null
  }
  return el instanceof HTMLAnchorElement ? el : myAnchor(el.parentNode,c--)
}
let processingClick = false;
function tryOpenATab(ref){
  browser.runtime.sendMessage({tab: "I want it"})
  .then(response => {
    
    if(response.match){
      window.open(ref,undefined,"noreferrer,noopener");
    }else{
      processingClick = true;
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
      }else{
        processingClick = true;
      }
    }catch(e){
      false
    }
  }
})

window.addEventListener("beforeunload",()=>(!processingClick&&window.close()),{once:true})