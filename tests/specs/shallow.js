describe('Shallow', function() {
  var emptyFn = function() {};

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
    define('aa', [], function() {
      return 'aa';
    });

    expect(define).withArgs('aa', [], emptyFn).to.throwException();
  });

  it('will load empty file as anon define', function(done) {
    require(['modules/empty'], function(undef) {
      expect(undef).to.be(undefined);
      done();
    });
  });
});
