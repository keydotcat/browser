function onDomChange(callback) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  if (MutationObserver) {
    var obs = new MutationObserver(function(mutations, observer) {
      callback(mutations);
    });
    obs.observe(document.getElementsByTagName('body')[0], { childList: true, subtree: true });
  } else if (window.addEventListener) {
    obj.addEventListener('DOMNodeInserted', callback, false);
    obj.addEventListener('DOMNodeRemoved', callback, false);
  }
}

function onDomReady(callback) {
  // in case the document is already rendered
  if (document.readyState != 'loading') callback();
  // modern browsers
  else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
  // IE <= 8
  else
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState == 'complete') callback();
    });
}

function onWatch(callback) {
  onDomReady(callback);
  onDomChange(callback);
}

export default onWatch;
