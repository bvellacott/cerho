'use strict';

window.define = (function initialiseDefine() {
  var assetRoot = window.ASSET_ROOT || ''
  var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
  
  function require(url) { return window.define.modules[url].exports; }

  function getScriptFrom(evt) {
    //Using currentTarget instead of target for Firefox 2.0's sake. Not
    //all old browsers will be supported, but this one was easy enough
    //to support and still makes sense.
    return evt.currentTarget || evt.srcElement;
  }

  function removeListener(script, func, name, ieName) {
    //Favor detachEvent because of IE9
    //issue, see attachEvent/addEventListener comment elsewhere
    //in this file.
    if (script.detachEvent && !isOpera) {
      //Probably IE. If not it will throw an error, which will be
      //useful to know.
      if (ieName) {
        script.detachEvent(ieName, func);
      }
    } else {
      script.removeEventListener(name, func, false);
    }
  }

  function removeListeners(script, onScriptLoad, onScriptError) {
    //Remove the listeners once here.
    removeListener(script, onScriptLoad, 'load', 'onreadystatechange');
    removeListener(script, onScriptError, 'error');
  }

  function onModuleLoaded(module) {
    module.callback.apply(module, module.depUrls.map(function (url) {
      if (url === 'module') {
        return module;
      } else if (url === 'exports') {
        return module.exports
      } else if (url === 'require') {
        return require
      }
      return define.modules[url].exports;
    }).concat(module));

    module.status = 'loaded';
    for (var url in define.modules) {
      var listModule = define.modules[url];
      var dependencies = listModule.dependencies;
      if (listModule.status === 'loading' && dependencies[module.url]) {
        dependencies[module.url] = false;
        validateModule(listModule);
      }
    }
  }

  function validateModule(module) {
    var dependencies = module.dependencies;
    var loaded = true;
    for (var url in dependencies) {
      const dependency = define.modules[url];
      const hasNotLoaded = 
        url !== 'exports' &&
        url !== 'module' && 
        url !== 'require' && (
          !dependency || 
          dependency.status !== 'loaded'
        );
      dependencies[url] = hasNotLoaded;
      if (dependencies[url]) {
        loaded = false;
      }
    }
    if (loaded) {
      onModuleLoaded(module);
    }
  }

  return function define(url, depUrls, callback, options = {}) {
    if (!url) {
      throw new Error('You must provide a url when defining a module');
    }

    var module = define.modules[url] || {};
    if (module && module.status && module.status !== 'fetching') {
      throw new Error(`The module '${url}' has been defined already`);
    }

    module.url = url;
    module.depUrls = depUrls;
    module.dependencies = depUrls && depUrls.reduce(function(deps, url) {
      deps[url] = true;
      return deps;
    }, {});
    module.callback = callback;
    module.exports = {};
    module.status = 'loading';

    define.modules[url] = module;

    validateModule(module);

    function onScriptLoad(evt) {
      var script = getScriptFrom(evt);
      removeListeners(script, onScriptLoad, onScriptError);
    }

    function onScriptError(evt) {
      var script = getScriptFrom(evt);
      removeListeners(script, onScriptLoad, onScriptError);
      throw new Error('Failed to load: ' + script.src + '\n\n' + evt); // better ways of rendering evt?
    }

    var target = document.head;

    depUrls.forEach(function (url) {
      if (define.modules[url] || url === 'module' || url === 'exports' || url === 'require') {
        return;
      }

      module = { 
        url,
        status: 'fetching',
      };
      define.modules[url] = module;

      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.async = true;
      let params = [];
      for(var key in (options.params || {})) {
        params.push(key + '=' + options.params[key])
      }
      const paramsString = params.length ? '&' + params.join('&') : ''
      script.src = assetRoot + url + '?priorIds=' + window.define.priorIds.join(',') + paramsString;

      //Set up load listener. Test attachEvent first because IE9 has
      //a subtle issue in its addEventListener and script onload firings
      //that do not match the behavior of all other browsers with
      //addEventListener support, which fire the onload event for a
      //script right after the script execution. See:
      //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
      //UNFORTUNATELY Opera implements attachEvent but does not follow the script
      //script execution mode.
      if (script.attachEvent &&
      //Check if script.attachEvent is artificially added by custom script or
      //natively supported by browser
      //read https://github.com/requirejs/requirejs/issues/187
      //if we can NOT find [native code] then it must NOT natively supported.
      //in IE8, script.attachEvent does not have toString()
      //Note the test for "[native code" with no closing brace, see:
      //https://github.com/requirejs/requirejs/issues/273
      !(script.attachEvent.toString && script.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
        //Probably IE. IE (at least 6-8) do not fire
        //script onload right after executing the script, so
        //we cannot tie the anonymous define call to a name.
        //However, IE reports the script as being in 'interactive'
        //readyState at the time of the define call.
        useInteractive = true;

        script.attachEvent('onreadystatechange', onScriptLoad);
        //It would be great to add an error handler here to catch
        //404s in IE9+. However, onreadystatechange will fire before
        //the error handler, so that does not help. If addEventListener
        //is used, then IE will fire error before load, but we cannot
        //use that pathway given the connect.microsoft.com issue
        //mentioned above about not doing the 'script execute,
        //then fire the script load event listener before execute
        //next script' that other browsers do.
        //Best hope: IE10 fixes the issues,
        //and then destroys all installs of IE 6-9.
        //script.attachEvent('onerror', context.onScriptError);
      } else {
          script.addEventListener('load', onScriptLoad, false);
          script.addEventListener('error', onScriptError, false);
        }

      target.append(script);
    });
  };
})();

window.requireAsync = (function initialiseRequire() {
  let anonymousModuleCount = 0;
  return function requireAsync(depUrls, callback, options) {
    const name = '__anonymous__' + anonymousModuleCount++
    window.define(name, depUrls, function() {
      callback.apply(this, arguments);
      delete define.modules[name];
    }, options);
  };
})();

window.define.modules = {};
window.define.priorIds = [];
