let currentHostPermissions = null;

browser.permissions.getAll()
.then((all)=>{currentHostPermissions = all.origins})


function saveOptions(e) {
  let field = document.getElementById("urlfield");
  let ctx = document.getElementById("userContextEnabled");
  try{
    let url = new URL(field.value);
    
    let matchPattern = (function(){
      let parts = url.host.split(".");
      while(parts.length > 2){
        parts.shift()
      }
      return "https://*."+parts.join(".")+"/*";
    })()
    let hasHost = currentHostPermissions.includes(matchPattern);
    if(!hasHost){
      browser.permissions.request({origins:[matchPattern]})
      .then(()=>{
        console.log("got permission");
        browser.permissions.remove({origins:currentHostPermissions});
      })
      .catch(()=>{
        console.log("Couldn't get permissions");
        field.style.backgroundColor = "pink";
      })
    }
    browser.storage.local.set({"url":field.value,"userContextEnabled":ctx.checked});
  }catch(e){
    field.style.backgroundColor = "pink";
  }
}

function restoreOptions() {

  let gettingItem = browser.storage.local.get(["url","userContextEnabled"]);
  gettingItem.then((res) => {
    if(res.url){
      document.querySelector("#urlfield").value = res.url
    }
    if(res.userContextEnabled){
      document.querySelector("#userContextEnabled").checked = true;
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById("saveButton").addEventListener("click", saveOptions,false);
