/* global console:false */

(function(global) {
  "use strict";

  var registry = {};
  var head = document.getElementsByTagName('head')[0];
  var logPile = [];
  var currentlyAddingScript;
  var config = {
    baseUrl: './',
    paths: {}
  };

  function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  function logError(message, level) {
    level = level || 'log';
    if(console && console.log) {
      console[level](message);
    } else {
      logPile.push(message, level);
    }
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

  function executingScript() {
    if(document.currentScript) { return document.currentScript; }

    var scripts = document.getElementsByTagName('script');

    for(var i = scripts.length - 1; i >= 0; i--) {
      var script = scripts[i];
      if(script.readyState === 'interactive') {
        return script;
      }
    }

    throw Error('Unable to find currently executing script');
  }

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

    var anchor = document.createElement('a');
    anchor.href = location.href + scope + name;
    return anchor.href.substr(location.href.length);
  }

  function buildUrl(mod, parentMod) {
    var name = resolveName(mod.name, parentMod.name);
    // console.log('resovedName:', name);

    return (config.baseUrl + '/' + name + '.js').replace(/\/{2,}/, '/');
  }

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
      loadDependencies(self.deps, self.name, function() {
        if(!self.obj) {
          var obj = self.initFn.apply(null, arguments);
          self.obj = obj;
        }
        callback(self.obj);
      });
    }

    function scriptLoad() {
      /*jshint validthis:true*/

      var rs = this.readyState;
      // liftJS.log.push('script.load called. Ready state: ' + rs);
      if(!scriptLoaded && (!rs || rs === 'loaded' || rs === 'complete')) {
        scriptLoaded = true;
        self.loaded = true;

        // liftJS.log.push('script.load actually loaded');

        // Handle memory leak in IE
        this.onload = this.onreadystatechange = null;
        if(head && this.parentNode) {
          // liftJS.log.push('script.load removing script tag');
          head.removeChild(this);
        }

        ready();
      }
    }

    if(this.loaded) {
      ready();
    } else if(this.loading) {
      throw new Error('not handled');
    } else {
      this.loading = true;
      var s = document.createElement('script');
      s.src = buildUrl(this, parentMod);
      s.onload = scriptLoad;
      s.onreadystatechange = scriptLoad;
      s.onerror = function() {
        logError('Unable to load ' + s.src);
      };

      // For older IE
      currentlyAddingScript = s;
      head.appendChild(s);
      currentlyAddingScript = null;

      this.node = s;
    }
  };

  Module.prototype.setup = function(deps, initFn) {
    this.loaded = true;
    this.deps = deps;
    this.initFn = initFn;
  };

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

    if(!name) {
      var script = currentlyAddingScript || executingScript();
      name = script.src.substr(location.href.length);
      name = name.replace(/\.js$/, '');
    }

    // console.log('define(' + name + ')', deps);

    var mod = getModule(name);
    if(mod.loaded) {
      throw Error('Module ' + name + ' defined twice');
    }
    mod.setup(deps, fn);
  }

  function microAmdRequire(deps, fn) {
    deps = deps || [];

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

  microAmdRequire.logPile = logPile;

  global.define = microAmdDefine;
  global.require = microAmdRequire;
})(this);
