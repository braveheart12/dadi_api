const should = require('should')
const fs = require('fs')
const moment = require('moment')
const path = require('path')
const request = require('supertest')
const sinon = require('sinon')
const config = require(__dirname + '/../../../config')
const help = require(__dirname + '/../help')
const app = require(__dirname + '/../../../dadi/lib/')

// variables scoped for use throughout tests
let bearerToken
const configBackup = config.get()
const connectionString = 'http://' + config.get('server.host') + ':' + config.get('server.port')

describe('DateTime Field', function () {
  before(() => {
    config.set('paths.collections', 'test/acceptance/temp-workspace/collections')
  })

  beforeEach(done => {
    app.start(() => {
      help.dropDatabase('library', null, err => {
        if (err) return done(err)

        help.getBearerToken((err, token) => {
          if (err) return done(err)

          bearerToken = token

          done()
        })
      })
    })
  })

  afterEach(done => {
    app.stop(done)
  })

  after(() => {
    config.set('paths.collections', configBackup.paths.collections)
  })

  it('should not attempt to process a null/undefined value', done => {
    const person = { name: 'Ernest Hemingway' }

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/person')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(person)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      const personId = res.body.results[0]._id
      const book = { title: 'For Whom The Bell Tolls', author: personId }

      client
      .post('/v1/library/book')
      .set('Authorization', 'Bearer ' + bearerToken)
      .send(book)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        const bookId = res.body.results[0]._id
        const event = { type: 'borrow', book: bookId, datetime: null }

        client
        .post('/v1/library/event')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(event)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          client
          .get('/v1/library/event?compose=true')
          .set('Authorization', 'Bearer ' + bearerToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err)

            should.not.exist(res.body.results[0].datetime)
            done()
          })
        })
      })
    })
  })

  it('should format a DateTime field as ISO when no format is specified', done => {
    const person = { name: 'Ernest Hemingway' }

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/person')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(person)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      const personId = res.body.results[0]._id
      const book = { title: 'For Whom The Bell Tolls', author: personId }

      client
      .post('/v1/library/book')
      .set('Authorization', 'Bearer ' + bearerToken)
      .send(book)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        const bookId = res.body.results[0]._id
        const date = new Date()
        const event = { type: 'borrow', book: bookId, datetime: date }

        client
        .post('/v1/library/event')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(event)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          client
          .get('/v1/library/event?compose=true')
          .set('Authorization', 'Bearer ' + bearerToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err)

            res.body.results[0].datetime.should.eql(moment(date).toISOString())
            done()
          })
        })
      })
    })
  })

  it('should format a DateTime field as ISO when `iso` format is specified', done => {
    const person = { name: 'Ernest Hemingway' }

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/person')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(person)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      const personId = res.body.results[0]._id

      const book = { title: 'For Whom The Bell Tolls', author: personId }

      client
      .post('/v1/library/book')
      .set('Authorization', 'Bearer ' + bearerToken)
      .send(book)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        const bookId = res.body.results[0]._id

        const date = new Date()
        const event = { type: 'borrow', book: bookId, datetime: date }

        client
        .post('/v1/library/event_iso_date')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(event)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          client
          .get('/v1/library/event_iso_date?compose=true')
          .set('Authorization', 'Bearer ' + bearerToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err)

            const d1 = res.body.results[0].datetime
            const d2 = moment(date).toISOString()

            d1.substring(0, d1.lastIndexOf(':')).should.eql(d2.substring(0, d2.lastIndexOf(':')))
            done()
          })
        })
      })
    })
  })

  it('should format a DateTime field when format is specified', done => {
    const person = { name: 'Ernest Hemingway' }

    config.set('query.useVersionFilter', true)
    const client = request(connectionString)

    client
    .post('/v1/library/person')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(person)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)
      const personId = res.body.results[0]._id
      const book = { title: 'For Whom The Bell Tolls', author: personId }

      client
      .post('/v1/library/book')
      .set('Authorization', 'Bearer ' + bearerToken)
      .send(book)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)
        const bookId = res.body.results[0]._id
        const date = moment('2016-11-02', 'YYYY-MM-DD').format('YYYY-MM-DD')
        const event = { type: 'borrow', book: bookId, datetime: date }

        client
        .post('/v1/library/event_format_date')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(event)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          client
          .get('/v1/library/event_format_date?compose=true')
          .set('Authorization', 'Bearer ' + bearerToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err)
            res.body.results[0].datetime.should.eql(
              moment('2016-11-02', 'YYYY-MM-DD').format('YYYY-MM-DD')
            )
            done()
          })
        })
      })
    })
  })

  it('should format a DateTime field as unix when `unix` format is specified', done => {
    const person = { name: 'Ernest Hemingway' }

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/person')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(person)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      const personId = res.body.results[0]._id

      const book = { title: 'For Whom The Bell Tolls', author: personId }

      client
      .post('/v1/library/book')
      .set('Authorization', 'Bearer ' + bearerToken)
      .send(book)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        const bookId = res.body.results[0]._id

        const date = new Date()
        const event = { type: 'borrow', book: bookId, datetime: date }

        client
        .post('/v1/library/event_unix_date')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(event)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          client
          .get('/v1/library/event_unix_date?compose=true')
          .set('Authorization', 'Bearer ' + bearerToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err)

            res.body.results[0].datetime.should.eql(moment(date).format('x'))
            done()
          })
        })
      })
    })
  })

  it('should keep a DateTime field as unix when `unix` format is specified', done => {
    const person = { name: 'Ernest Hemingway' }

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/person')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(person)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      const personId = res.body.results[0]._id

      const book = { title: 'For Whom The Bell Tolls', author: personId }

      client
      .post('/v1/library/book')
      .set('Authorization', 'Bearer ' + bearerToken)
      .send(book)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        const bookId = res.body.results[0]._id

        const date = moment(new Date()).valueOf()
        const event = { type: 'borrow', book: bookId, datetime: date }

        client
        .post('/v1/library/event_unix_date')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(event)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          client
          .get('/v1/library/event_unix_date?compose=true')
          .set('Authorization', 'Bearer ' + bearerToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err)

            should.exist(res.body.results)
            res.body.results.length.should.eql(1)
            res.body.results[0].datetime.should.eql(date)

            done()
          })
        })
      })
    })
  })

  it('should replace `$now` with the current timestamp in DateTime queries', done => {
    const currentDate = Date.now()
    const documents = [
      {
        type: 'one',
        datetime: 588985200000
      },
      {
        type: 'two',
        datetime: currentDate + 10000
      },
      {
        type: 'three',
        datetime: currentDate + 20000
      }
    ]

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/event_iso_date')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(documents)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      client
      .get('/v1/library/event_iso_date?filter={"datetime":{"$gte":"$now"}}')
      .set('Authorization', 'Bearer ' + bearerToken)
      .expect(200)
      .end((err, res) => {
        res.body.results.length.should.equal(2)
        res.body.results[0].type.should.equal('two')
        res.body.results[1].type.should.equal('three')

        done()
      })
    })
  })

  it('should allow query filters with Unix timestamps', done => {
    const baseDate = 588985200000
    const documents = [
      {
        type: 'one',
        datetime: baseDate - 3600000
      },
      {
        type: 'two',
        datetime: baseDate
      },
      {
        type: 'three',
        datetime: baseDate + 3600000
      }
    ]

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/event')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(documents)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      client
      .get(`/v1/library/event?filter={"datetime":{"$gte":${baseDate}}}`)
      .set('Authorization', 'Bearer ' + bearerToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        res.body.results.length.should.equal(2)
        res.body.results[0].type.should.equal('two')
        res.body.results[1].type.should.equal('three')

        done()
      })
    })
  })

  it('should allow query filters with ISO strings', done => {
    const documents = [
      {
        type: 'one',
        datetime: 588985200000
      },
      {
        type: 'two',
        datetime: 588988800000
      },
      {
        type: 'three',
        datetime: 588992400000
      }
    ]

    config.set('query.useVersionFilter', true)

    const client = request(connectionString)

    client
    .post('/v1/library/event')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(documents)
    .expect(200)
    .end((err, res) => {
      if (err) return done(err)

      client
      .get(`/v1/library/event?filter={"datetime":{"$lt":"1988-08-31T00:00:00.000Z"}}`)
      .set('Authorization', 'Bearer ' + bearerToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        res.body.results.length.should.equal(1)
        res.body.results[0].type.should.equal('one')

        client
        .get(`/v1/library/event?filter={"datetime":{"$gt":"1988-07-30T23:00:00.000Z"}}`)
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          res.body.results.length.should.equal(3)
          res.body.results[0].type.should.equal('one')
          res.body.results[1].type.should.equal('two')
          res.body.results[2].type.should.equal('three')

          client
          .get(`/v1/library/event?filter={"datetime":{"$gt":"1988-08-30T23:30:00.000Z","$lt":"1988-08-31T00:30:00.000Z"}}`)
          .set('Authorization', 'Bearer ' + bearerToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err)

            res.body.results.length.should.equal(1)
            res.body.results[0].type.should.equal('two')

            done()
          })
        })
      })
    })
  })

  it('should return an error when the value supplied is not valid', done => {
    const client = request(connectionString)

    config.set('query.useVersionFilter', true)

    const event = { type: 'borrow', datetime: {} }

    client
    .post('/v1/library/event')
    .set('Authorization', 'Bearer ' + bearerToken)
    .send(event)
    .end((err, res) => {
      if (err) return done(err)

      res.statusCode.should.eql(400)
      res.body.success.should.eql(false)
      res.body.errors[0].field.should.eql('datetime')
      res.body.errors[0].code.should.eql('ERROR_VALUE_INVALID')

      done()
    })
  })
})
