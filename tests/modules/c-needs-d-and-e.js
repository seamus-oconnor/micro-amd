define(['./d', './e'], function(d, e) {
  expect(e).to.be('e');
  expect(d).to.be('d');
  return 'c';
});
