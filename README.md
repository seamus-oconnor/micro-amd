Micro AMD Loader is a very small (1.4kb minified & gzipped) AMD loader. It is not as feature-full as [RequireJS](https://github.com/jrburke/requirejs) but it loads AMD formated modules in the same manner.

Example:
--------

Load a "foo.js" in the same directory as this executing script.
```javascript
require(['foo'], function(foo) {
  alert(foo);
});
```

Configure a different baseUrl to resolve all module names against.
```javascript
require.config({
  baseUrl: 'js/'
});
// Loads js/foo.js
require(['foo'], function(foo) {
  alert(foo);
});
```

Configure a different path to load modules from.
```javascript
require.config({
  paths: {
    lib: 'js/modules'
  }
});
// Loads js/modules/foo.js
require(['lib/foo'], function(foo) {
  alert(foo);
});
```
