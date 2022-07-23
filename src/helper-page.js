'use strict';
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    browser.runtime.sendMessage({doButtonAction:true})
  }
}
