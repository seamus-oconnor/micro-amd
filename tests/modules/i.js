define('j', function() {
  return 'j';
});

define('k', function() {
  return 'k';
});

define(['j', 'k'], function(j, k) {
  return j + k;
});
