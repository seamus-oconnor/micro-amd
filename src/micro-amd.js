(function(global) {
  'use strict';

  /*************************** UTILS **************************/

  function empty() {}

  function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  function err(msg) {
    throw new Error(msg);
  }

  function normalizeUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.cloneNode(false).href;
  }

  function getModule(name, options) {
    var mod = registry[name];
    if(!mod) {
      // haven't come across this module before;
      mod = new Module(name, options);
      registry[mod.name] = mod;
    }
    return mod;
  }

  function moduleName(url) {
    return normalizeUrl(url).substr(baseUrl.length);
  }

  // Doesn't look like executingScript is needed anymore. Keeping for future
  // reference as requirejs implements this.

  // function executingScript() {
  // if(document.currentScript) { return document.currentScript; }

  //   var scripts = document.getElementsByTagName('script');

  //   for(var i = scripts.length - 1; i >= 0; i--) {
  //     var script = scripts[i];
  //     if(script.readyState === 'interactive') {
  //       return script;
  //     }
  //   }
  // }

  function resolveName(name, parentName) {
    // console.log('resolveName(' + name + ', ' + parentName + ')');
    var scope = ''; // normal and abs url cases;

    if(name.charAt(0) === '.') { // relative url
      // use parentMod to resolve URL;
      scope = parentName + '/../';
    } else if(name.indexOf('/') > 0) {
      var parts = name.split('/');
      var prefix = config.paths[parts[0]];
      if(prefix) {
        scope = prefix;
      }
    }

    return moduleName(baseUrl + scope + name);
  }

  function buildUrl(mod, parentMod) {
    // console.log('buildUrl', mod, parentMod);
    var name = resolveName(mod.name, parentMod.name);
    // console.log('resolvedName: ' + name);

    return (config.baseUrl + '/' + name + '.js').replace(/\/{2,}/, '/');
  }


  /****************************** SETUP *****************************/

  var registry = {};
  var anonQueue = [];
  var head = document.getElementsByTagName('head')[0];
  var logPile = [];
  // var currentlyAddingScript;
  var config = {
    baseUrl: './',
    paths: {}
  };
  // Construct the baseUrl without any trailing filename. E.g /foo/bar.html =
  // /foo/ and /foo/ = /foo/
  var baseUrl = normalizeUrl(location.protocol + '//' + location.host + location.pathname + '-/../');
  // console.log('baseUrl:', baseUrl);


  /*************************** DEPENDENCIES **************************/

  function loadDependencies(deps, parent, fn) {
    var count = deps.length;
    var modules = [];

    function loaded() {
      count--;

      if(count <= 0) {
        var args = [];
        for(var i = 0; i < modules.length; i++) {
          args.push(modules[i].obj);
        }
        fn.apply(null, args);
      }
    }

    if(count === 0) {
      loaded();
    } else {
      for(var i = 0; i < deps.length; i++) {
        var dep = deps[i];
        var name = resolveName(dep, parent);
        var mod = getModule(name);
        modules.push(mod);
        mod.load(loaded, parent);
      }
    }
  }


  /*************************** MODULE **************************/

  function Module(name) {
    this.name = name;
    this.defined = false;
    this.loaded = false;
    this.loading = false;
  }

  Module.prototype.load = function(callback, parentMod) {
    var self = this;
    var scriptLoaded = false;

    function ready() {
      // console.log('module ready. ' + self.deps.length + ' deps');
      loadDependencies(self.deps, self.name, function() {
        if(!self.obj) {
          var obj = self.initFn.apply(null, arguments);
          self.obj = obj;
        }
        callback(self.obj);
      });
    }

    function scriptLoad(e) {
      /*jshint validthis:true*/

      e = e || window.event;

      var rs = this.readyState;
      if(!scriptLoaded && (!rs || rs === 'loaded' || rs === 'complete')) {
        scriptLoaded = true;
        self.loading = false;

        if(anonQueue.length > 1) {
          err('Multiple anon define()s in ' + e.srcElement.src);
        }
        var def = anonQueue.length === 1 ? anonQueue.pop() : [null, empty, [] , null];
        anonQueue = []; // empty anonQueue

        var name = def.pop();
        var deps = def.pop();
        var fn = def.pop();
        // var script = this /*def.pop()*/ || e.currentTarget || e.srcElement;

        name = moduleName(this.src).replace(/\.js$/, '');

        getModule(name).setup(deps, fn);

        // Handle memory leak in IE
        this.onload = this.onreadystatechange = null;

        if(head && this.parentNode) {
          head.removeChild(this);
        }

        ready();
      }
    }

    if(this.loaded) {
      ready();
    } else if(this.loading) {
      err('not handled');
    } else {
      this.loading = true;
      var s = document.createElement('script');
      s.src = buildUrl(this, parentMod);
      s.onload = scriptLoad;
      s.onreadystatechange = scriptLoad;
      s.onerror = function() {
        err('Unable to load ' + s.src);
      };

      // currentlyAddingScript = s;
      head.appendChild(s);
      // currentlyAddingScript = null;

      this.node = s;
    }
  };

  /**/

  Module.prototype.setup = function(deps, initFn) {
    // console.log('Module.setup()');
    if(this.loaded) {
      err('Module ' + this.name + ' already defined');
    }

    this.loaded = true;
    this.deps = deps;
    this.initFn = initFn;
  };

  /*************************** define() **************************/

  // define(function() {});
  // define(['foo'], function() {});
  // define('foo', ['bar'], function() {});
  function microAmdDefine(name, deps, fn) {
    if(typeof name !== 'string') {
      fn = deps;
      deps = name;
      name = null;
    }

    if(!isArray(deps)) {
      fn = deps;
      deps = [];
    }

    if(name) {
      getModule(name).setup(deps, fn);
    } else {
      // queue all define() calls until the script's onload is fired.
      anonQueue.push([/*currentlyAddingScript || executingScript(), */fn, deps, name]);
    }

    // console.log('define(' + name + ')', deps);
  }

  microAmdDefine.amd = true;

  /*************************** require() **************************/

  function microAmdRequire(deps, fn) {
    deps = deps || [];
    // console.log('require(' + deps.join(', ') + ')');

    loadDependencies(deps, '.', fn);
  }

  microAmdRequire.config = function microAmdConfig(cfg) {
    for(var name in cfg) {
      if(cfg.hasOwnProperty(name)) {
        config[name] = cfg[name];
      }
    }
  };

  microAmdRequire.reset = function microAmdReset() {
    registry = {};
  };

  microAmdRequire.destroy = function microAmdDestroy() {
    delete global.define;
    delete global.require;
  };

  microAmdRequire.logPile = logPile;

  global.define = microAmdDefine;
  global.require = microAmdRequire;
})(this);
