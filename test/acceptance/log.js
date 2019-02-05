var fs = require('fs')
var should = require('should')
var request = require('supertest')

var config = require(__dirname + '/../../config')
var help = require(__dirname + '/help')
var app = require(__dirname + '/../../dadi/lib/')

var bearerToken
var connectionString = 'http://' + config.get('server.host') + ':' + config.get('server.port')
var logpath = config.get('logging').path + '/' + config.get('logging').filename + '.access.' + config.get('logging').extension

var resetLog = function (done) {
    // empty the log for each test
  fs.writeFileSync(logpath, Buffer.from(''))
  done()
}

describe('logger', function () {
  describe('request', function () {
    beforeEach(resetLog)

    var cleanup = function (done) {
        // try to cleanup these tests directory tree
        // don't catch errors here, since the paths may not exist

      var dirs = config.get('paths')
      try {
        fs.unlinkSync(dirs.collections + '/v1/testdb/collection.test-schema.json')
      } catch (e) {}

      try {
        fs.rmdirSync(dirs.collections + '/v1/testdb')
      } catch (e) {}

      done()
    }

    let cleanupFn

    before(function (done) {
      help.dropDatabase('testdb', function (err) {
        if (err) return done(err)

        app.start(function () {
          help.getBearerTokenWithAccessType('admin', function (err, token) {
            if (err) return done(err)

            bearerToken = token

            let schema = Object.assign({}, require('./../new-schema.json'))

            schema.fields.field1 = Object.assign({}, schema.fields.newField)
            delete schema.fields.newField

            help.writeTempFile(
              'temp-workspace/collections/vtest/testdb/collection.test-schema.json',
              schema,
              callback => {
                cleanupFn = callback

                done()
              }
            )
          })
        })
      })
    })

    after(function (done) {
      cleanup(function () {
        app.stop(() => {
          cleanupFn()

          done()
        })
      })
    })

    it('should log to the access log when collection endpoint is requested', function (done) {
      help.createDoc(bearerToken, function (err, doc) {
        if (err) return done(err)

        var client = request(connectionString)

        client
        .get('/vtest/testdb/test-schema')
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .expect('content-type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)

          res.body['results'].should.exist
          res.body['results'].should.be.Array
          res.body['results'].length.should.be.above(0)

          var logEntry = fs.readFileSync(logpath, {encoding: 'utf8'})
          logEntry.indexOf('/vtest/testdb/test-schema').should.be.above(0)

          done()
        })
      })
    })

    it('should determine the client IP address correctly', function (done) {
      help.createDoc(bearerToken, function (err, doc) {
        if (err) return done(err)

        var client = request(connectionString)

        client
        .get('/vtest/testdb/test-schema')
        .set('Authorization', 'Bearer ' + bearerToken)
        .set('x-forwarded-for', '52.101.34.175')
        .expect(200)
        .expect('content-type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)

          setTimeout(() => {
            var logEntry = fs.readFileSync(logpath, {encoding: 'utf8'})

            logEntry.indexOf('52.101.34.175').should.be.above(0)

            done()
          }, 300)
        })
      })
    })
  })
})
