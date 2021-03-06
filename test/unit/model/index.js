var should = require('should')
var sinon = require('sinon')
var model = require(__dirname + '/../../../dadi/lib/model')
var apiHelp = require(__dirname + '/../../../dadi/lib/help')
var connection = require(__dirname + '/../../../dadi/lib/model/connection')
var help = require(__dirname + '/../help')
var acceptanceHelper = require(__dirname + '/../../acceptance/help')
var config = require(__dirname + '/../../../config')

describe('Model', function () {
  beforeEach((done) => {
    help.clearCollection('testModelName', function () {
      help.clearCollection('testModelNameVersions', function () {
        done()
      })
    })
  })

  it('should export a function', function (done) {
    model.should.be.Function
    done()
  })

  it('should export a constructor', function (done) {
    model.Model.should.be.Function
    done()
  })

  it('should export function that creates an instance of Model when passed schema', function (done) {
    model(
      'testModelName',
      help.getModelSchema(),
      null,
      { database: 'testdb' }
    ).should.be.an.instanceOf(model.Model)

    done()
  })

  it('should export function that gets instance of Model when not passed schema', function (done) {
    model('testModelName').should.be.an.instanceOf(model.Model)

    done()
  })

  it('should only create one instance of Model for a specific name', function (done) {
    model(
      'testModelName',
      help.getModelSchema(),
      null,
      { database: 'testdb' }
    ).should.eql(
      model('testModelName')
    )

    done()
  })

  describe('initialization options', function () {
    it('should take model name and schema as arguments', function (done) {
      model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      ).name.should.equal('testModelName')

      done()
    })

    it('should accept model settings as fourth argument', function (done) {
      const mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          cache: true,
          count: 25
        }
      )

      should.exist(mod.settings)

      mod.settings.cache.should.be.true
      mod.settings.count.should.equal(25)

      done()
    })

    it('should attach history collection by default if not specified and `storeRevisions` is not false', function (done) {
      var mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )

      should.exist(mod.settings)
      should.exist(mod.history)
      mod.history.name.should.equal('testModelNameVersions')

      done()
    })

    it('should attach history collection if specified (using legacy `revisionCollection` property)', function (done) {
      var mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          revisionCollection: 'modelHistory'
        }
      )
      mod.history.name.should.equal('modelHistory')

      done()
    })

    it('should attach history collection if specified', function (done) {
      var mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          versioningCollection: 'modelHistory'
        }
      )
      mod.history.name.should.equal('modelHistory')

      done()
    })

    it('should attach history collection if `storeRevisions` is true', function (done) {
      var mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          storeRevisions: true
        }
      )
      should.exist(mod.history)
      mod.history.name.should.equal('testModelNameVersions')

      done()
    })

    it('should attach specified history collection if `storeRevisions` is true', function (done) {
      const mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          storeRevisions: true,
          revisionCollection: 'modelHistory'
        }
      )
      should.exist(mod.history)
      mod.history.name.should.equal('modelHistory')

      done()
    })

    it('should attach history collection if `enableVersioning` is true', function (done) {
      var mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          enableVersioning: true
        }
      )
      should.exist(mod.history)
      mod.history.name.should.equal('testModelNameVersions')

      done()
    })

    it('should attach specified history collection if `enableVersioning` is true', function (done) {
      const mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          enableVersioning: true,
          versioningCollection: 'modelHistory'
        }
      )
      should.exist(mod.history)
      mod.history.name.should.equal('modelHistory')

      done()
    })

    it('should accept collection indexing settings', function (done) {
      const mod1 = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          index: {
            enabled: true,
            keys: { orderDate: 1 }
          }
        }
      )

      setTimeout(function () {
        should.exist(mod1.settings)
        should.exist(mod1.settings.index)

        JSON.stringify(
          mod1.settings.index[0].keys
        ).should.eql(
          JSON.stringify({ orderDate: 1 })
        )

        done()
      }, 300)
    })

    it('should accept collection indexing settings for v1.14.0 and above', function (done) {
      const mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        {
          index: [
            { keys: { orderDate: 1 } }
          ]
        }
      )

      should.exist(mod.settings)

      JSON.stringify(
        mod.settings.index[0].keys
      ).should.equal(
        JSON.stringify({ orderDate: 1 })
      )

      done()
    })

    it('should accept collection displayName setting', function (done) {
      const mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb', displayName: 'TEST MODEL' }
      )

      should.exist(mod.settings)
      mod.settings.displayName.should.equal('TEST MODEL')

      done()
    })

    it('should attach `type` definition to model', function (done) {
      const val = 'test type'

      help.testModelProperty('type', val)

      done()
    })

    it('should attach `label` definition to model', function (done) {
      const val = 'test label'

      help.testModelProperty('label', val)

      done()
    })

    it('should attach `comments` definition to model', function (done) {
      const val = 'test comments'

      help.testModelProperty('comments', val)

      done()
    })

    it('should attach `validation` definition to model', function (done) {
      const val = '{ regex: { pattern: { /w+/ } } }'

      help.testModelProperty('validation', val)

      done()
    })

    it('should attach `required` definition to model', function (done) {
      const val = true

      help.testModelProperty('required', val)

      done()
    })

    it('should attach `message` definition to model', function (done) {
      const val = 'test message'

      help.testModelProperty('message', val)

      done()
    })
  })

  describe('`count` method', function () {
    it('should accept a query, an options object and a callback and return a metadata object', function (done) {
      model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      ).count({}, {}, (err, response) => {
        response.metadata.page.should.be.Number
        response.metadata.offset.should.be.Number
        response.metadata.totalCount.should.be.Number
        response.metadata.totalPages.should.be.Number

        done()
      })
    })

    it('should accept a query and an options object as named arguments and return a Promise with a metadata object', () => {
      return model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      ).count().then(response => {
        response.metadata.page.should.be.Number
        response.metadata.offset.should.be.Number
        response.metadata.totalCount.should.be.Number
        response.metadata.totalPages.should.be.Number
      })
    })
  })

  describe('`stats` method', function () {
    it('should accept an options object', () => {
      return model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      ).getStats({})
    })

    it('should return an object', () => {
      return model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      ).getStats({}).then(stats => {
        stats.should.exist
      })
    })

    it('should return an error when db is disconnected', () => {
      let mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )
      let connectedDb = mod.connection.db
      mod.connection.db = null
      return mod.getStats().catch(err => {
        mod.connection.db = connectedDb
        err.should.exist
        err.message.should.eql('DB_DISCONNECTED')
      })
    })
  })

  describe('`find` method', function () {
    describe('legacy syntax', () => {
      it('should accept query object and callback', done => {
        model(
          'testModelName',
          help.getModelSchema(),
          null,
          { database: 'testdb' }
        ).find({}, (err, response) => {
          response.results.should.be.Array

          done()
        })
      })

      it('should accept query object, options object and callback', done => {
        model(
          'testModelName',
          help.getModelSchema(),
          null,
          { database: 'testdb' }
        ).find({}, {}, (err, response) => {
          response.results.should.be.Array

          done()
        })
      })

      it('should pass error to callback when query uses `$where` operator', function (done) {
        model('testModelName').find({
          $where: 'this.fieldName === "foo"'
        }, err => {
          should.exist(err)

          done()
        })
      })
    })

    it('should accept named parameters', () => {
      model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      ).find({
        query: {}
      }).then(response => {
        response.results.should.be.Array
      })
    })

    it('should reject with error when query uses `$where` operator', done => {
      model('testModelName').find({
        query: {
          $where: 'this.fieldName === "foo"'
        }
      }).catch(error => {
        should.exist(error)

        done()
      })
    })
  })

  describe('`get` method', function () {
    describe('legacy syntax', () => {
      it('should accept query object and callback', done => {
        model(
          'testModelName',
          help.getModelSchema(),
          null,
          { database: 'testdb' }
        ).get({}, (err, response) => {
          response.results.should.be.Array

          done()
        })
      })

      it('should accept query object, options object and callback', done => {
        model(
          'testModelName',
          help.getModelSchema(),
          null,
          { database: 'testdb' }
        ).get({}, {}, (err, response) => {
          response.results.should.be.Array

          done()
        })
      })

      it('should pass error to callback when query uses `$where` operator', function (done) {
        model('testModelName').get({
          $where: 'this.fieldName === "foo"'
        }, err => {
          should.exist(err)

          done()
        })
      })
    })

    it('should accept named parameters', () => {
      model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      ).get({
        query: {}
      }).then(response => {
        response.results.should.be.Array
      })
    })

    it('should reject with error when query uses `$where` operator', done => {
      model('testModelName').get({
        query: {
          $where: 'this.fieldName === "foo"'
        }
      }).catch(error => {
        should.exist(error)

        done()
      })
    })
  })

  describe('`getIndexes` method', function () {
    beforeEach((done) => {
      acceptanceHelper.dropDatabase('testdb', err => {
        done()
      })
    })

    it('should return indexes', function (done) {
      var mod = model('testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          index: {
            enabled: true,
            keys: {
              fieldName: 1
            },
            options: {
              unique: false
            }
          }
        }
      )

      help.whenModelsConnect([mod]).then(() => {
        mod.create({fieldName: 'ABCDEF'}, function (err, result) {
          if (err) return done(err)

          setTimeout(function () {
            // mod.connection.db = null

            mod.getIndexes(indexes => {
              var result = indexes.some(index => { return index.name.indexOf('fieldName') > -1 })
              result.should.eql(true)
              done()
            })
          }, 1000)
        })
      })
    })
  })

  describe('`createIndex` method', function () {
    it('should create index if indexing settings are supplied', function (done) {
      var mod = model('testModelName',
        help.getModelSchema(),
        null,
        {
          database: 'testdb',
          index: {
            enabled: true,
            keys: {
              fieldName: 1
            },
            options: {
              unique: false,
              background: true,
              dropDups: false,
              w: 1
            }
          }
        }
      )

      mod.create({fieldName: 'ABCDEF'}, function (err, result) {
        if (err) return done(err)

        setTimeout(function () {
          mod.getIndexes(indexes => {
            var result = indexes.some(index => { return index.name.indexOf('fieldName') > -1 })
            result.should.eql(true)
            done()
          })
        }, 1000)
      })
    })

    it.skip('should support compound indexes', function (done) {
      help.cleanUpDB(() => {
        var fields = help.getModelSchema()
        var schema = {}
        schema.fields = fields

        schema.fields.field2 = Object.assign({}, schema.fields.fieldName, {
          type: 'Number',
          required: false
        })

        var mod = model('testModelName',
          schema.fields,
          null,
          {
            index: {
              enabled: true,
              keys: {
                fieldName: 1,
                field2: 1
              },
              options: {
                unique: false,
                background: true,
                dropDups: false,
                w: 1
              }
            }
          }
        )

        mod.create({fieldName: 'ABCDEF', field2: 2}, function (err, result) {
          if (err) return done(err)

          setTimeout(function () {
            // Peform a query, with explain to show we hit the query
            mod.getIndexes(indexes => {
              // var explanationString = JSON.stringify(explanation.results[0])
              // explanationString.indexOf('fieldName_1_field2_1').should.be.above(-1)
              console.log(indexes)
              done()
            })
          }, 1000)
        })
      })
    })

    it('should support unique indexes', function (done) {
      help.cleanUpDB(() => {
        var fields = help.getModelSchema()
        var schema = {}
        schema.fields = fields

        schema.fields.field3 = Object.assign({}, schema.fields.fieldName, {
          type: 'String',
          required: false
        })

        var mod = model('testModelName',
          schema.fields,
          null,
          {
            index: {
              enabled: true,
              keys: {
                field3: 1
              },
              options: {
                unique: true
              }
            }
          }
        )

        setTimeout(function () {
          mod.create({field3: 'ABCDEF'}, function (err, result) {
            if (err) return done(err)

            mod.create({field3: 'ABCDEF'}, function (err, result) {
              should.exist(err)
              err.message.toLowerCase().indexOf('duplicate').should.be.above(-1)
              done()
            })
          })
        }, 1000)
      })
    })

    it('should support multiple indexes', function (done) {
      help.cleanUpDB(() => {
        var fields = help.getModelSchema()
        var schema = {}
        schema.fields = fields

        schema.fields.field3 = Object.assign({}, schema.fields.fieldName, {
          type: 'String',
          required: false
        })

        var mod = model('testModelName',
          schema.fields,
          null,
          {
            index: [
              {
                keys: {
                  fieldName: 1
                },
                options: {
                  unique: true
                }
              },
              {
                keys: {
                  field3: 1
                },
                options: {
                  unique: true
                }
              }
            ]
          }
        )

        setTimeout(function () {
          mod.create({fieldName: 'ABCDEF'}, function (err, result) {
            mod.create({fieldName: 'ABCDEF'}, function (err, result) {
              should.exist(err)
              err.message.toLowerCase().indexOf('duplicate').should.be.above(-1)

              mod.create({field3: '1234'}, function (err, result) {
                mod.create({field3: '1234'}, function (err, result) {
                  should.exist(err)
                  err.message.toLowerCase().indexOf('duplicate').should.be.above(-1)
                  done()
                })
              })
            })
          })
        }, 1000)
      })
    })
  })

  describe('`create` method', function () {
    beforeEach((done) => {
      acceptanceHelper.dropDatabase('testdb', err => {
        done()
      })
    })

    describe('legacy syntax', () => {
      it('should accept Object and callback', function (done) {
        let mod = model(
          'testModelName',
          help.getModelSchema(),
          null,
          { database: 'testdb' }
        )

        mod.create({fieldName: 'foo'}, done)
      })

      it('should accept Array and callback', function (done) {
        let mod = model(
          'testModelName',
          help.getModelSchema(),
          null,
          { database: 'testdb' }
        )

        mod.create([{fieldName: 'foo'}, {fieldName: 'bar'}], done)
      })

      it('should save model to database', function (done) {
        let mod = model(
          'testModelName',
          help.getModelSchema(),
          null,
          { database: 'testdb' }
        )

        mod.create({fieldName: 'foo'}, err => {
          if (err) return done(err)

          mod.find({fieldName: 'foo'}, (err, doc) => {
            if (err) return done(err)

            should.exist(doc['results'])
            doc['results'][0].fieldName.should.equal('foo')

            done()
          })
        })
      })

      it('should pass error to callback if validation fails', function (done) {
        let schema = help.getModelSchema()
        let mod = model(
          'testModelName',
          Object.assign({}, schema, {
            fieldName: Object.assign({}, schema.fieldName, {
              validation: { maxLength: 5 }
            })
          }),
          null,
          { database: 'testdb' }
        )

        mod.create({fieldName: '123456'}, err => {
          should.exist(err)

          done()
        })
      })
    })

    it('should accept Object', () => {
      let mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )

      return mod.create({
        documents: { fieldName: 'foo' }
      })
    })

    it('should accept Array', () => {
      let mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )

      return mod.create({
        documents: [
          { fieldName: 'foo' }, { fieldName: 'bar' }
        ]
      })
    })

    it('should save model to database', () => {
      let mod = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )

      return mod.create({
        documents: { fieldName: 'foo' }
      }).then(documents => {
        return mod.find({
          query: { fieldName: 'foo'}
        })
      }).then(({metadata, results}) => {
        should.exist(metadata)
        should.exist(results)

        results[0].fieldName.should.equal('foo')
      })
    })

    it('should reject with error if validation fails', done => {
      let schema = help.getModelSchema()
      let mod = model(
        'testModelName',
        Object.assign({}, schema, {
          fieldName: Object.assign({}, schema.fieldName, {
            validation: { maxLength: 5 }
          })
        }),
        null,
        { database: 'testdb' }
      )

      mod.create({
        documents: { fieldName: '123456' }
      }).catch(err => {
        should.exist(err)

        done()
      })
    })
  })

  describe('`update` method', function () {
    beforeEach(done => {
      acceptanceHelper.dropDatabase('testdb', err => {
        let mod = model(
          'testModelName',
          help.getModelSchemaWithMultipleFields(),
          null,
          { database: 'testdb' }
        )

        // Create model to be updated by tests.
        mod.create({
          documents: {
            field1: 'foo', field2: 'bar'
          }
        }).then(result => {
          should.exist(result && result.results)
          result.results[0].field1.should.equal('foo')

          done()
        }).catch(done)
      })
    })

    describe('legacy syntax', () => {
      it('should accept query, update object, and callback', done => {
        let mod = model('testModelName')

        mod.update({field1: 'foo'}, {field1: 'bar'}, done)
      })

      it('should update an existing document', done => {
        let mod = model('testModelName')
        let updateDoc = {field1: 'bar'}

        mod.update({field1: 'foo'}, updateDoc, (err, result) => {
          if (err) return done(err)

          result.results.should.exist
          result.results[0].field1.should.equal('bar')

          // make sure document was updated
          mod.find({field1: 'bar'}, (err, result) => {
            if (err) return done(err)

            should.exist(result['results'] && result['results'][0])
            result['results'][0].field1.should.equal('bar')

            done()
          })
        })
      })

      it('should create new history revision when updating an existing document and `storeRevisions` is true', done => {
        let mod = model(
          'testModelName',
          help.getModelSchemaWithMultipleFields(),
          null,
          {
            database: 'testdb',
            storeRevisions: true
          }
        )
        let updateDoc = {field1: 'bar'}

        mod.update({field1: 'foo'}, updateDoc, (err, result) => {
          if (err) return done(err)

          result.results.should.exist
          result.results[0].field1.should.equal('bar')

          // make sure document was updated
          mod.find({field1: 'bar'}, (err, result) => {
            if (err) return done(err)

            should.exist(result['results'] && result['results'][0])
            result['results'][0].field1.should.equal('bar')

            mod.getVersions({
              documentId: result.results[0]._id
            }).then(({results}) => {
              results.length.should.equal(1)

              done()
            })
          })
        })
      })

      it('should pass error to callback if schema validation fails', done => {
        let schema = help.getModelSchema()
        let mod = model(
          'testModelName',
          Object.assign({}, schema, {
            fieldName: Object.assign({}, schema.fieldName, {
              validation: {maxLength: 5}
            })
          }),
          null,
          {database: 'testdb'}
        )

        mod.update({fieldName: 'foo'}, {fieldName: '123456'}, err => {
          should.exist(err)

          done()
        })
      })

      it('should pass error to callback when query uses `$where` operator', done => {
        model('testModelName').update(
          {$where: 'this.fieldName === "foo"'},
          {fieldName: 'bar'},
          err => {
            should.exist(err)

            done()
          }
        )
      })
    })

    it('should accept query and update object', () => {
      let mod = model('testModelName')

      return mod.update({
        query: {field1: 'foo'},
        update: {field1: 'bar'}
      })
    })

    it('should update an existing document', () => {
      let mod = model('testModelName')
      let updateDoc = {field1: 'bar'}

      return mod.update({
        query: {field1: 'foo'},
        update: updateDoc
      }).then(result => {
        result.results.should.exist
        result.results[0].field1.should.equal('bar')

        return mod.find({
          query: {field1: 'bar'}
        })
      }).then(({metadata, results}) => {
        should.exist(results && results[0])
        results[0].field1.should.equal('bar')
      })
    })

    it('should create new history revision when updating an existing document and `storeRevisions` is true', () => {
      let mod = model(
        'testModelName',
        help.getModelSchemaWithMultipleFields(),
        null,
        {
          database: 'testdb',
          storeRevisions: true
        }
      )
      let updateDoc = {field1: 'bar'}

      return mod.update({
        query: {field1: 'foo'},
        update: updateDoc
      }).then(({results}) => {
        results.should.exist
        results[0].field1.should.equal('bar')

        return mod.find({
          query: {field1: 'bar'}
        })
      }).then(({results}) => {
        should.exist(results && results[0])
        results[0].field1.should.equal('bar')

        return mod.getVersions({
          documentId: results[0]._id
        })
      }).then(({results}) => {
        results.length.should.equal(1)
      })
    })

    it('should reject with error if schema validation fails', done => {
      let schema = help.getModelSchema()
      let mod = model(
        'testModelName',
        Object.assign({}, schema, {
          fieldName: Object.assign({}, schema.fieldName, {
            validation: {maxLength: 5}
          })
        }),
        null,
        {database: 'testdb'}
      )

      mod.update({
        query: {fieldName: 'foo'},
        update: {fieldName: '123456'}
      }).catch(error => {
        should.exist(error)

        done()
      })
    })

    it('should reject with error when query uses `$where` operator', done => {
      model('testModelName').update({
        query: {$where: 'this.fieldName === "foo"'},
        update: {fieldName: 'bar'}
      }).catch(err => {
        should.exist(err)

        done()
      })
    })
  })

  describe('`delete` method', function () {
    beforeEach(help.cleanUpDB)

    describe('legacy syntax', () => {
      it('should accept a query object and callback', done => {
        let schema = help.getModelSchema()
        let mod = model(
          'testModelName',
          schema,
          null,
          { database: 'testdb' }
        )

        mod.delete({fieldName: 'foo'}, done)
      })

      it('should delete a single document', done => {
        let schema = help.getModelSchema()
        let mod = model(
          'testModelName',
          schema,
          null,
          { database: 'testdb' }
        )

        mod.create({fieldName: 'foo'}, (err, result) => {
          if (err) return done(err)

          result.results[0].fieldName.should.equal('foo')

          mod.delete({fieldName: 'foo'}, (err, result) => {
            if (err) return done(err)

            result.deletedCount.should.equal(1)

            mod.find({}, (err, result) => {
              if (err) return done(err)

              result['results'].length.should.equal(0)

              done()
            })
          })
        })
      })

      it('should delete multiple documents', done => {
        let schema = help.getModelSchema()
        let mod = model(
          'testModelName',
          schema,
          null,
          { database: 'testdb' }
        )

        mod.create(
          [
            {fieldName: 'foo'},
            {fieldName: 'bar'},
            {fieldName: 'baz'}
          ],
          (err, result) => {
            if (err) return done(err)

            result.results[0].fieldName.should.equal('foo')
            result.results[1].fieldName.should.equal('bar')
            result.results[2].fieldName.should.equal('baz')

            mod.delete({
              fieldName: {
                $in: ['foo', 'bar', 'baz']
              }
            }, (err, result) => {
              if (err) return done(err)

              result.deletedCount.should.equal(3)

              mod.find({}, (err, result) => {
                if (err) return done(err)

                result['results'].length.should.equal(0)

                done()
              })
            })
          }
        )
      })

      it('should pass error to callback when query uses `$where` operator', done => {
        model('testModelName').delete({
          $where: 'this.fieldName === "foo"'
        }, err => {
          should.exist(err)
          done()
        })
      })
    })

    it('should accept a query object', () => {
      let schema = help.getModelSchema()
      let mod = model(
        'testModelName',
        schema,
        null,
        { database: 'testdb' }
      )

      return mod.delete({
        query: { fieldName: 'foo' }
      })
    })

    it('should delete a single document', () => {
      let schema = help.getModelSchema()
      let mod = model(
        'testModelName',
        schema,
        null,
        { database: 'testdb' }
      )

      return mod.create({
        documents: { fieldName: 'foo' }
      }).then(({metadata, results}) => {
        results[0].fieldName.should.equal('foo')

        return mod.delete({
          query: { fieldName: 'foo' }
        })
      }).then(result => {
        result.deletedCount.should.equal(1)

        return mod.find({})
      }).then(({metadata, results}) => {
        results.length.should.equal(0)
      })
    })

    it('should delete multiple documents', () => {
      let schema = help.getModelSchema()
      let mod = model(
        'testModelName',
        schema,
        null,
        { database: 'testdb' }
      )

      return mod.create({
        documents: [
          { fieldName: 'foo' },
          { fieldName: 'bar' },
          { fieldName: 'baz' }
        ]
      }).then(({results}) => {
        results[0].fieldName.should.equal('foo')
        results[1].fieldName.should.equal('bar')
        results[2].fieldName.should.equal('baz')

        return mod.delete({
          query: {
            fieldName: {
              $in: ['foo', 'bar', 'baz']
            }
          }
        })
      }).then(result => {
        result.deletedCount.should.equal(3)

        return mod.find({})
      }).then(({metadata, results}) => {
        results.length.should.equal(0)
      })
    })

    it('should pass error to callback when query uses `$where` operator', () => {
      return model('testModelName').delete({
        query: {
          $where: 'this.fieldName === "foo"'
        }
      }).catch(error => {
        should.exist(error)
      })
    })
  })

  describe('validateQuery', function () {
    it('should be attached to Model', function (done) {
      var mod = model('testModelName', help.getModelSchema(), null, { database: 'testdb' })
      mod.validateQuery.should.be.Function
      done()
    })

    describe('query', function () {
      it('should not allow the use of `$where` in queries', function (done) {
        var mod = model('testModelName', help.getModelSchema(), null, { database: 'testdb' })
        mod.validateQuery({$where: 'throw new Error("Insertion Attack!")'}).success.should.be.false
        done()
      })

      it('should allow querying with key values', function (done) {
        var mod = model('testModelName', help.getModelSchema(), null, { database: 'testdb' })
        mod.validateQuery({fieldName: 'foo'}).success.should.be.true
        done()
      })

      it('should allow querying with key values too', function (done) {
        var schema = help.getModelSchema()
        schema = Object.assign({}, schema, {
          fieldMixed: {
            type: 'Mixed',
            label: 'Mixed Field',
            required: false,
            display: { index: true, edit: true }
          }
        }
        )

        var mod = model('schemaTest', schema, null, { database: 'testdb' })
        mod.validateQuery({'fieldMixed.innerProperty': 'foo'}).success.should.be.true
        done()
      })
    })
  })

  describe('`_mergeQueryAndAclFields` method', () => {
    it('should use the fields provided by the query if ACL does not specify any', () => {
      let testModel = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )

      let queryFields = {
        field1: 1,
        field2: 1
      }

      testModel._mergeQueryAndAclFields(queryFields).should.eql(
        queryFields
      )
    })

    it('should use the fields provided by the ACL filter if the query does not specify any', () => {
      let testModel = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )

      let aclFields = {
        field1: 1,
        field2: 1
      }

      testModel._mergeQueryAndAclFields(null, aclFields).should.eql(
        aclFields
      )
    })

    it('should merge the fields from the query and the ACL filter so that the ACL restrictions are respected', () => {
      let testModel = model(
        'testModelName',
        help.getModelSchema(),
        null,
        { database: 'testdb' }
      )

      testModel._mergeQueryAndAclFields(
        { one: 1 },
        { one: 1, two: 1 }
      ).should.eql(
        { one: 1 }
      )

      testModel._mergeQueryAndAclFields(
        { one: 0 },
        { one: 1, two: 1 }
      ).should.eql(
        { two: 1 }
      )

      testModel._mergeQueryAndAclFields(
        { one: 0 },
        { two: 0 }
      ).should.eql(
        { one: 0, two: 0 }
      )

      testModel._mergeQueryAndAclFields(
        { one: 1, two: 1 },
        { four: 0 }
      ).should.eql(
        { one: 1, two: 1 }
      )

      should.throws(
        () => testModel._mergeQueryAndAclFields(
          { one: 1 },
          { two: 1 }
        ),
        Error
      )
    })
  })
})
