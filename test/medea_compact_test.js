var assert = require('assert');
var Medea = require('../');

var directory = __dirname + '/tmp/medea_test';
var db;
var setup = function (done) {
  require('rimraf')(directory, function () {
    db = new Medea({ maxFileSize: 100 });
    db.open(directory, done);
  });
}
var shutdown = function (done) {
  db.close(done);
}

describe('Medea#compact', function() {

  describe('Multiple time overwriting same key', function () {
    before(setup);

    for(var i = 0; i < 50; i++) {
      it('successfully overwriting same key', function (done) {
        var buffer1 = new Buffer(50),
          buffer2 = new Buffer(50),
          buffer3 = new Buffer(50);

        buffer1.fill(1);
        buffer2.fill(2);
        buffer3.fill(3);

        db.put('foo1', buffer1, function (err) {
          if (err) return done(err);
          db.put('foo1', buffer2, function (err) {
            if (err) return done(err);
            db.put('foo1', buffer3, function (err) {
              if (err) return done(err);
              db.compact(function (err) {
                if (err) return done(err)
                db.compact(function (err) {
                  if (err) return done(err)

                  db.get('foo1', function (err, value) {
                    assert.deepEqual(value, buffer3);
                    done();
                  })
                });
              });
            });
          });
        });
      });
    }

    after(shutdown);
  });

  describe('Multiple time overwriting same key', function () {
    before(setup);

    for(var i = 0; i < 50; i++) {
      it('successfully writing different key', function (done) {
        var buffer1 = new Buffer(50),
          buffer2 = new Buffer(50),
          buffer3 = new Buffer(50);

        buffer1.fill(1);
        buffer2.fill(2);
        buffer3.fill(3);

        db.put('foo1', buffer1, function (err) {
          if (err) return done(err);
          db.put('foo2', buffer2, function (err) {
            if (err) return done(err);
            db.put('foo3', buffer3, function (err) {
              if (err) return done(err);
              db.compact(function (err) {
                if (err) return done(err)
                db.compact(function (err) {
                  if (err) return done(err)
                  db.get('foo1', function (err, value) {
                    assert.deepEqual(value, buffer1);
                    db.get('foo2', function (err, value) {
                      assert.deepEqual(value, buffer2);
                      db.get('foo3', function (err, value) {
                        assert.deepEqual(value, buffer3);

                        done()
                      });
                    });
                  })
                });
              });
            });
          });
        });
      });
    }

    after(shutdown);
  });

  describe('Write large amount of data', function () {
    before(setup);
    var max = 20;

    before(function (done) {
      var put = function(index) {
        if (index === max) {
          return done();
        }

        var buffer = new Buffer(50);

        buffer.fill(index);

        db.put(buffer, buffer, function(err) {
          if (err) return done(err);
          put(++index);
        });
      }

      put(0);
    });

    it('successfully compacts', function (done) {
      db.compact(function (err) {
        if (err) return done(err);
        db.compact(function (err) {
          if (err) return done(err);
          done()
        });
      });
    });

    it('successfully saves data', function (done) {
      var get = function (index) {
        if (index === max) {
          return done();
        }
        var buffer = new Buffer(50);
        buffer.fill(index);

        db.get(buffer, function (err, value) {
          if (err) return done(err);
          assert.deepEqual(value, buffer);
          get(++index);
        });
      }
      get(0);
    });

    after(shutdown);
  })
});
