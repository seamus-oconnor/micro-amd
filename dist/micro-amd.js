/*!
* Micro AMD Javascript Library v0.2.4
* https://github.com/seamus-oconnor/micro-amd/
*
* Copyright 2014 - 2014 Pneumatic Web Technologies Corp. and other contributors
* Released under the MIT license
* https://github.com/seamus-oconnor/micro-amd/tree/LICENSE.md
*/


!function(global) {
  "use strict";
  function isArray(arr) {
    return "[object Array]" === Object.prototype.toString.call(arr);
  }
  function err(msg) {
    throw new Error(msg);
  }
  function qualifyURL(url) {
    var a = document.createElement("a");
    a.href = url, "http" !== a.href.substr(0, 4) && (a.href = location.href + url);
    var bloo = a.cloneNode(!1).href.substr(location.href.length);
    return bloo;
  }
  function getModule(name, options) {
    var mod = registry[name];
    return mod || (mod = new Module(name, options), registry[mod.name] = mod), mod;
  }
  function executingScript() {
    if (document.currentScript) return document.currentScript;
    for (var scripts = document.getElementsByTagName("script"), i = scripts.length - 1; i >= 0; i--) {
      var script = scripts[i];
      if ("interactive" === script.readyState) return script;
    }
    err("Unable to find currently executing script");
  }
  function resolveName(name, parentName) {
    var scope = "";
    if ("." === name.charAt(0)) scope = parentName + "/../"; else if (name.indexOf("/") > 0) {
      var parts = name.split("/"), prefix = config.paths[parts[0]];
      prefix && (scope = prefix);
    }
    return qualifyURL(scope + name);
  }
  function buildUrl(mod, parentMod) {
    var name = resolveName(mod.name, parentMod.name);
    return (config.baseUrl + "/" + name + ".js").replace(/\/{2,}/, "/");
  }
  function loadDependencies(deps, parent, fn) {
    function loaded() {
      if (count--, 0 >= count) {
        for (var args = [], i = 0; i < modules.length; i++) args.push(modules[i].obj);
        fn.apply(null, args);
      }
    }
    var count = deps.length, modules = [];
    if (0 === count) loaded(); else for (var i = 0; i < deps.length; i++) {
      var dep = deps[i], name = resolveName(dep, parent), mod = getModule(name);
      modules.push(mod), mod.load(loaded, parent);
    }
  }
  function Module(name) {
    this.name = name, this.defined = !1, this.loaded = !1, this.loading = !1;
  }
  function microAmdDefine(name, deps, fn) {
    if ("string" != typeof name && (fn = deps, deps = name, name = null), isArray(deps) || (fn = deps, 
    deps = []), !name) {
      var script = executingScript();
      name = qualifyURL(script.src), name = name.replace(/\.js$/, "");
    }
    var mod = getModule(name);
    mod.loaded && err("Module " + name + " defined twice"), mod.setup(deps, fn);
  }
  function microAmdRequire(deps, fn) {
    deps = deps || [], loadDependencies(deps, ".", fn);
  }
  var registry = {}, head = document.getElementsByTagName("head")[0], logPile = [], config = {
    baseUrl: "./",
    paths: {}
  };
  Module.prototype.load = function(callback, parentMod) {
    function ready() {
      loadDependencies(self.deps, self.name, function() {
        if (!self.obj) {
          var obj = self.initFn.apply(null, arguments);
          self.obj = obj;
        }
        callback(self.obj);
      });
    }
    function scriptLoad() {
      var rs = this.readyState;
      scriptLoaded || rs && "loaded" !== rs && "complete" !== rs || (scriptLoaded = !0, 
      self.loaded = !0, this.onload = this.onreadystatechange = null, head && this.parentNode && head.removeChild(this), 
      ready());
    }
    var self = this, scriptLoaded = !1;
    if (this.loaded) ready(); else if (this.loading) err("not handled"); else {
      this.loading = !0;
      var s = document.createElement("script");
      s.src = buildUrl(this, parentMod), s.onload = scriptLoad, s.onreadystatechange = scriptLoad, 
      s.onerror = function() {
        err("Unable to load " + s.src);
      }, head.appendChild(s), this.node = s;
    }
  }, Module.prototype.setup = function(deps, initFn) {
    this.loaded = !0, this.deps = deps, this.initFn = initFn;
  }, microAmdDefine.amd = !0, microAmdRequire.config = function(cfg) {
    for (var name in cfg) cfg.hasOwnProperty(name) && (config[name] = cfg[name]);
  }, microAmdRequire.reset = function() {
    registry = {};
  }, microAmdRequire.destroy = function() {
    delete global.define, delete global.require;
  }, microAmdRequire.logPile = logPile, global.define = microAmdDefine, global.require = microAmdRequire;
}(this);