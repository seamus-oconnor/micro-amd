/*!
* Micro AMD Javascript Library v0.0.6
* https://github.com/seamus-oconnor/micro-amd/
*
* Copyright 2014 - 2014 Pneumatic Web Technologies Corp. and other contributors
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
  function normalizeUrl(url) {
    var a = document.createElement("a");
    return a.href = url, a.cloneNode(!1).href;
  }
  function getModule(name, options) {
    var mod = registry[name];
    return mod || (mod = new Module(name, options), registry[mod.name] = mod), mod;
  }
  function moduleName(url) {
    return normalizeUrl(url).substr(baseUrl.length).replace(/\.js$/, "");
  }
  function executingScript() {
    if (document.currentScript) return document.currentScript;
    for (var scripts = document.getElementsByTagName("script"), i = scripts.length - 1; i >= 0; i--) {
      var script = scripts[i];
      if ("interactive" === script.readyState) return script;
    }
  }
  function resolveName(name, parentName) {
    var scope = "";
    if ("." === name.charAt(0)) scope = parentName + "/../"; else if (name.indexOf("/") > 0) {
      var parts = name.split("/"), prefix = config.paths[parts[0]];
      prefix && (scope = prefix);
    }
    return moduleName(baseUrl + scope + name);
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
    deps = []), name) getModule(name).setup(deps, fn); else {
      var script = currentlyAddingScript || executingScript();
      if (anonDefine) return void (anonDefine = "error");
      anonDefine = [ fn, deps, script ? moduleName(script.src) : null ];
    }
  }
  function microAmdRequire(deps, fn) {
    deps = deps || [], loadDependencies(deps, ".", fn);
  }
  var anonDefine, currentlyAddingScript, registry = {}, head = document.getElementsByTagName("head")[0], logPile = [], config = {
    baseUrl: "./",
    paths: {}
  }, baseUrl = normalizeUrl(location.protocol + "//" + location.host + location.pathname + "-/../");
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
    function scriptLoad(e) {
      e = e || window.event;
      var rs = this.readyState;
      if (!(scriptLoaded || rs && "loaded" !== rs && "complete" !== rs)) {
        scriptLoaded = !0, self.loading = !1, "error" === anonDefine && err("Multiple anon define()s in " + e.srcElement.src);
        var name = moduleName(this.src), deps = [], fn = empty;
        anonDefine && (name = anonDefine.pop() || name, deps = anonDefine.pop(), fn = anonDefine.pop(), 
        anonDefine = null), getModule(name).setup(deps, fn), this.onload = this.onreadystatechange = null, 
        head && this.parentNode && head.removeChild(this), ready();
      }
    }
    var self = this, scriptLoaded = !1;
    if (this.loaded) ready(); else if (this.loading) err("not handled"); else {
      this.loading = !0;
      var s = document.createElement("script");
      s.src = buildUrl(this, parentMod), s.onload = scriptLoad, s.onreadystatechange = scriptLoad, 
      s.onerror = function() {
        err("Unable to load " + s.src);
      }, currentlyAddingScript = s, head.appendChild(s), currentlyAddingScript = null, 
      this.node = s;
    }
  }, Module.prototype.setup = function(deps, initFn) {
    this.loaded && err("Module " + this.name + " already defined"), this.loaded = !0, 
    this.deps = deps, this.initFn = initFn;
  }, microAmdDefine.amd = !0, microAmdRequire.config = function(cfg) {
    for (var name in cfg) cfg.hasOwnProperty(name) && (config[name] = cfg[name]);
  }, microAmdRequire.reset = function() {
    registry = {};
  }, microAmdRequire.destroy = function() {
    delete global.define, delete global.require;
  }, microAmdRequire.logPile = logPile, global.define = microAmdDefine, global.require = microAmdRequire;
}(this);