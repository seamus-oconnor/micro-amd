describe('Relative', function() {
  it('resolve module dependencies', function(done) {
    require(['modules/nested/x'], function(x) {
      expect(x).to.be('x');
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
