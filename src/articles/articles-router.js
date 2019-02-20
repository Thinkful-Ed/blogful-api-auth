const express = require('express')
const ArticlesService = require('./articles-service')
const { requireAuth } = require('../middleware/basic-auth')

const articlesRouter = express.Router()

articlesRouter
  .route('/')
  .get((req, res, next) => {
    ArticlesService.getAllArticles(req.app.get('db'))
      .then(articles => {
        res.json(articles.map(ArticlesService.serializeArticle))
      })
      .catch(next)
  })

articlesRouter
  .route('/:article_id')
  .all(requireAuth)
  .all(checkArticleExists)
  .get((req, res) => {
    res.json(ArticlesService.serializeArticle(res.article))
  })

articlesRouter.route('/:article_id/comments/')
  .all(requireAuth)
  .all(checkArticleExists)
  .get((req, res, next) => {
    ArticlesService.getCommentsForArticle(
      req.app.get('db'),
      req.params.article_id
    )
      .then(comments => {
        res.json(comments.map(ArticlesService.serializeArticleComment))
      })
      .catch(next)
  })

/* async/await syntax for promises */
async function checkArticleExists(req, res, next) {
  try {
    const article = await ArticlesService.getById(
      req.app.get('db'),
      req.params.article_id
    )

    if (!article)
      return res.status(404).json({
        error: `Article doesn't exist`
      })

    res.article = article
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = articlesRouter
