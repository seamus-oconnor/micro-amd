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

  function normalizePath(path) {
    var prefix = 'http://example.com/';
    return normalizeUrl(prefix + path).substr(prefix.length);
  }

  function normalizeUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.cloneNode(false).href;
  }

  function getModule(name) {
    var mod = registry[name];
    if(!mod) {
      // haven't come across this module before;
      mod = new Module(name);
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
  }

  function resolveName(name, parentMod) {
    // console.log('resolveName(' + name + ', ' + parentName + ')');
    var scope = ''; // normal and abs url cases;

    if(name.charAt(0) === '.') { // relative url
      // use parentMod's name as the scope for this module's name
      if(parentMod) {
        scope = parentMod.name + '/../';
      }
    } else if(name.indexOf('/') > 0) {
      var parts = name.split('/');
      var prefix = config.paths[parts[0]];
      if(prefix) {
        scope = prefix + '/';
        name = parts.slice(1).join('/');
      }
    }

    return normalizePath(scope + name);
  }

  function buildUrl(mod) {
    // console.log('buildUrl', mod, parentMod);

    // Construct the baseUrl without any trailing filename. E.g /foo/bar.html =
    // /foo/ and /foo/ = /foo/
    var fqUrl = /https?:\/\//.test(config.baseUrl);
    var baseUrl = fqUrl ? config.baseUrl : location.protocol + '//' + location.host + location.pathname + '-/../' + config.baseUrl;

    return normalizeUrl(baseUrl + mod.name + '.js');
  }


  /****************************** SETUP *****************************/

  var registry = {};
  var anonDefine;
  var head = document.getElementsByTagName('head')[0];
  var logPile = [];
  var currentlyAddingScript;
  var config = {
    baseUrl: './',
    paths: {}
  };


  /*************************** DEPENDENCIES **************************/

  function loadDependencies(deps, parentMod, fn) {
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
        var name = resolveName(dep, parentMod);
        var mod = getModule(name);
        modules.push(mod);
        mod.load(loaded);
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

  Module.prototype.load = function(callback) {
    var self = this;
    var scriptLoaded = false;

    function ready() {
      // console.log('module ready. ' + self.deps.length + ' deps');
      loadDependencies(self.deps, self, function() {
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
        var url = this.src;

        if(anonDefine === 'error') {
          err('Multiple anon define()s in ' + url);
        }

        var deps = [];
        var fn = empty;

        if(anonDefine) {
          url = anonDefine.pop() || url;
          deps = anonDefine.pop();
          fn = anonDefine.pop();

          anonDefine = null; // remove held reference to anon define
        } // else - must be resolved already.

        self.setup(deps, fn);

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
      s.src = buildUrl(this);
      s.onload = scriptLoad;
      s.onreadystatechange = scriptLoad;
      s.onerror = function() {
        err('Unable to load ' + s.src);
      };

      currentlyAddingScript = s;
      head.appendChild(s);
      currentlyAddingScript = null;
    }
  };

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
      var script = currentlyAddingScript || executingScript();

      if(anonDefine) {
        // Already have a reference for an anon define? Then set to 'error'
        anonDefine = 'error';
        return;
      }

      anonDefine = [fn, deps, script ? script.src : null];
    }

    // console.log('define(' + name + ')', deps);
  }

  microAmdDefine.amd = true;

  /*************************** require() **************************/

  function microAmdRequire(deps, fn) {
    deps = deps || [];
    // console.log('require(' + deps.join(', ') + ')');

    loadDependencies(deps, null, fn || empty);
  }

  microAmdRequire.config = function microAmdConfig(cfg) {
    for(var name in cfg) {
      if(cfg.hasOwnProperty(name)) {
        config[name] = cfg[name];
      }
    }
  };

  microAmdRequire.destroy = function microAmdDestroy() {
    delete global.define;
    delete global.require;
  };

  microAmdRequire.logPile = logPile;

  global.define = microAmdDefine;
  global.require = microAmdRequire;
})(this);
