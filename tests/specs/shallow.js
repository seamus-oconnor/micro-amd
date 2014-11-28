describe('Shallow', function() {
  var emptyFn = function() {};

  beforeEach(function() {
    require.reset();
  });

  it('will load already defined module', function(done) {
    define('a', function() {
      return 'a';
    });

    require(['a'], function(a) {
      expect(a).to.be('a');
      done();
    });
  });

  it('will fetch unknown module', function(done) {
    require(['modules/a'], function(a) {
      expect(a).to.be('a');
      done();
    });
  });

  it('will throw if defined twice', function() {
    define('a', [], function() {
      return 'a';
    });

    expect(define).withArgs('a', [], emptyFn).to.throwException();
  });
});
