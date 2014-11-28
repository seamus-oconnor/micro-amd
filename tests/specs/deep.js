describe('Deep', function() {
  beforeEach(function() {
    require.reset();
  });

  it('resolve module dependencies', function(done) {
    define('a', ['b'], function(b) {
      expect(b).to.be('b');
      return 'a';
    });

    define('b', function() {
      return 'b';
    });

    require(['a'], function(a) {
      expect(a).to.be('a');
      done();
    });
  });

  it('resolve unkown module dependencies', function(done) {
    require(['modules/c-needs-d-and-e'], function(c) {
      expect(c).to.be('c');
      done();
    });
  });
});
