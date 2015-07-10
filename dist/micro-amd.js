/*!
* Micro AMD Javascript Library v0.1.0
* https://github.com/seamus-oconnor/micro-amd/
*
* Copyright 2014 - 2015 Pneumatic Web Technologies Corp. and other contributors
* Released under the MIT license
* https://github.com/seamus-oconnor/micro-amd/tree/LICENSE.md
*/


!function(global) {
  "use strict";
  function empty() {}
  function isArray(arr) {
    return "[object Array]" === Object.prototype.toString.call(arr);
  }
  function err(msg) {
    throw new Error(msg);
  }
  function normalizePath(path) {
    var prefix = "http://example.com/";
    return normalizeUrl(prefix + path).substr(prefix.length);
  }
  function normalizeUrl(url) {
    var a = document.createElement("a");
    return a.href = url, a.cloneNode(!1).href;
  }
  function getModule(name) {
    var mod = registry[name];
    return mod || (mod = new Module(name), registry[mod.name] = mod), mod;
  }
  function executingScript() {
    if (document.currentScript) return document.currentScript;
    for (var scripts = document.getElementsByTagName("script"), i = scripts.length - 1; i >= 0; i--) {
      var script = scripts[i];
      if ("interactive" === script.readyState) return script;
    }
  }
  function resolveName(name, parentMod) {
    var scope = "";
    if ("." === name.charAt(0)) parentMod && (scope = parentMod.name + "/../"); else if (name.indexOf("/") > 0) {
      var parts = name.split("/"), prefix = config.paths[parts[0]];
      prefix && (scope = prefix + "/", name = parts.slice(1).join("/"));
    }
    return normalizePath(scope + name);
  }
  function buildUrl(mod) {
    var fqUrl = /https?:\/\//.test(config.baseUrl), baseUrl = fqUrl ? config.baseUrl : location.protocol + "//" + location.host + location.pathname + "-/../" + config.baseUrl;
    return normalizeUrl(baseUrl + mod.name + ".js");
  }
  function loadDependencies(deps, parentMod, fn) {
    function loaded() {
      if (count--, 0 >= count) {
        for (var args = [], i = 0; i < modules.length; i++) args.push(modules[i].obj);
        fn.apply(null, args);
      }
    }
    var count = deps.length, modules = [];
    if (0 === count) loaded(); else for (var i = 0; i < deps.length; i++) {
      var dep = deps[i], name = resolveName(dep, parentMod), mod = getModule(name);
      modules.push(mod), mod.load(loaded);
    }
  }
  function Module(name) {
    this.name = name, this.defined = !1, this.loaded = !1, this.loading = !1;
  }
  function microAmdDefine(name, deps, fn) {
    if ("string" != typeof name && (fn = deps, deps = name, name = null), isArray(deps) || (fn = deps, 
    deps = []), name) getModule(name).setup(deps, fn); else {
      var script = currentlyAddingScript || executingScript();
      if (anonDefine) return void (anonDefine = "error");
      anonDefine = [ fn, deps, script ? script.src : null ];
    }
  }
  function microAmdRequire(deps, fn) {
    deps = deps || [], loadDependencies(deps, null, fn || empty);
  }
  var anonDefine, currentlyAddingScript, registry = {}, head = document.getElementsByTagName("head")[0], logPile = [], config = {
    baseUrl: "./",
    paths: {}
  };
  Module.prototype.load = function(callback) {
    function ready() {
      loadDependencies(self.deps, self, function() {
        if (!self.obj) {
          var obj = self.initFn.apply(null, arguments);
          self.obj = obj;
        }
        callback(self.obj);
      });
    }
    function scriptLoad(e) {
      e = e || window.event;
      var rs = this.readyState;
      if (!(scriptLoaded || rs && "loaded" !== rs && "complete" !== rs)) {
        scriptLoaded = !0, self.loading = !1;
        var url = this.src;
        "error" === anonDefine && err("Multiple anon define()s in " + url);
        var deps = [], fn = empty;
        anonDefine && (url = anonDefine.pop() || url, deps = anonDefine.pop(), fn = anonDefine.pop(), 
        anonDefine = null), self.setup(deps, fn), this.onload = this.onreadystatechange = null, 
        head && this.parentNode && head.removeChild(this), ready();
      }
    }
    var self = this, scriptLoaded = !1;
    if (this.loaded) ready(); else if (this.loading) err("not handled"); else {
      this.loading = !0;
      var s = document.createElement("script");
      s.src = buildUrl(this), s.onload = scriptLoad, s.onreadystatechange = scriptLoad, 
      s.onerror = function() {
        err("Unable to load " + s.src);
      }, currentlyAddingScript = s, head.appendChild(s), currentlyAddingScript = null;
    }
  }, Module.prototype.setup = function(deps, initFn) {
    this.loaded && err("Module " + this.name + " already defined"), this.loaded = !0, 
    this.deps = deps, this.initFn = initFn;
  }, microAmdDefine.amd = !0, microAmdRequire.config = function(cfg) {
    for (var name in cfg) cfg.hasOwnProperty(name) && (config[name] = cfg[name]);
  }, microAmdRequire.destroy = function() {
    delete global.define, delete global.require;
  }, microAmdRequire.logPile = logPile, global.define = microAmdDefine, global.require = microAmdRequire;
}(this);