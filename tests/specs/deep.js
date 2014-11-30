describe('Deep', function() {
  it('resolve module dependencies', function(done) {
    define('l', ['m'], function(m) {
      expect(m).to.be('m');
      return 'l';
    });

    define('m', function() {
      return 'm';
    });

    require(['l'], function(l) {
      expect(l).to.be('l');
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
