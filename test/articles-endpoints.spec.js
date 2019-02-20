const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Articles Endpoints', function() {
  let db

  const {
    testUsers,
    testArticles,
    testComments,
  } = helpers.makeArticlesFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`GET /api/articles`, () => {
    context(`Given no articles`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, [])
      })
    })

    context('Given there are articles in the database', () => {
      beforeEach('insert articles', () =>
        helpers.seedArticlesTables(
          db,
          testUsers,
          testArticles,
          testComments,
        )
      )

      it('responds with 200 and all of the articles', () => {
        const expectedArticles = testArticles.map(article =>
          helpers.makeExpectedArticle(
            testUsers,
            article,
            testComments,
          )
        )
        return supertest(app)
          .get('/api/articles')
          .expect(200, expectedArticles)
      })
    })

    context(`Given an XSS attack article`, () => {
      const testUser = helpers.makeUsersArray()[1]
      const {
        maliciousArticle,
        expectedArticle,
      } = helpers.makeMaliciousArticle(testUser)

      beforeEach('insert malicious article', () => {
        return helpers.seedMaliciousArticle(
          db,
          testUser,
          maliciousArticle,
        )
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/articles`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedArticle.title)
            expect(res.body[0].content).to.eql(expectedArticle.content)
          })
      })
    })
  })

  describe(`GET /api/articles/:article_id`, () => {
    context(`Given no articles`, () => {
      beforeEach(() =>
        db.into('blogful_users').insert(testUsers)
      )

      it(`responds with 404`, () => {
        const articleId = 123456
        return supertest(app)
          .get(`/api/articles/${articleId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Article doesn't exist` })
      })
    })

    context('Given there are articles in the database', () => {
      beforeEach('insert articles', () =>
        helpers.seedArticlesTables(
          db,
          testUsers,
          testArticles,
          testComments,
        )
      )

      it('responds with 200 and the specified article', () => {
        const articleId = 2
        const expectedArticle = helpers.makeExpectedArticle(
          testUsers,
          testArticles[articleId - 1],
          testComments,
        )

        return supertest(app)
          .get(`/api/articles/${articleId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedArticle)
      })
    })

    context(`Given an XSS attack article`, () => {
      const testUser = helpers.makeUsersArray()[1]
      const {
        maliciousArticle,
        expectedArticle,
      } = helpers.makeMaliciousArticle(testUser)

      beforeEach('insert malicious article', () => {
        return helpers.seedMaliciousArticle(
          db,
          testUser,
          maliciousArticle,
        )
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/articles/${maliciousArticle.id}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedArticle.title)
            expect(res.body.content).to.eql(expectedArticle.content)
          })
      })
    })
  })

  describe(`GET /api/articles/:article_id/comments`, () => {
    context(`Given no articles`, () => {
      beforeEach(() =>
        db.into('blogful_users').insert(testUsers)
      )

      it(`responds with 404`, () => {
        const articleId = 123456
        return supertest(app)
          .get(`/api/articles/${articleId}/comments`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Article doesn't exist` })
      })
    })

    context('Given there are comments for article in the database', () => {
      beforeEach('insert articles', () =>
        helpers.seedArticlesTables(
          db,
          testUsers,
          testArticles,
          testComments,
        )
      )

      it('responds with 200 and the specified comments', () => {
        const articleId = 1
        const expectedComments = helpers.makeExpectedArticleComments(
          testUsers, articleId, testComments
        )

        return supertest(app)
          .get(`/api/articles/${articleId}/comments`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedComments)
      })
    })
  })
})
