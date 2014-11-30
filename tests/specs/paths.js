describe('Paths', function() {
  it('should resolve using a path alias', function(done) {
    require.config({
      paths: {
        m: 'modules'
      }
    });

    require(['m/a'], function(a) {
      expect(a).to.be('a');
      done();
    });
  });

  it('should resolve using relative path', function(done) {
    require.config({
      paths: {
        m: './modules'
      }
    });

    require(['m/a'], function(a) {
      expect(a).to.be('a');
      done();
    });
  });

  it('should work with trailing slash', function(done) {
    require.config({
      paths: {
        m: './modules/'
      }
    });

    require(['m/a'], function(a) {
      expect(a).to.be('a');
      done();
    });
  });

  it('should work with nested path', function(done) {
    require.config({
      paths: {
        n: './modules/nested'
      }
    });

    require(['n/z'], function(z) {
      expect(z).to.be('z');
      done();
    });
  });
});
