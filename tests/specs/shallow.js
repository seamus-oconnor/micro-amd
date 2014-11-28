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

  it('will load named modules and return empty module', function(done) {
    require(['modules/f'], function(f) {
      expect(f).to.be(undefined);
      done();
    });
  });

  it('will load multiple named and return anon module', function(done) {
    require(['modules/i'], function(i) {
      expect(i).to.be('jk');
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
