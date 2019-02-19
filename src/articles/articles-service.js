const xss = require('xss')

const ArticlesService = {
  getAllArticles(db) {
    return db
      .from('blogful_articles AS art')
      .select(
        'art.id',
        'art.title',
        'art.date_created',
        'art.style',
        'art.content',
        db.raw(
          `count(DISTINCT comm) AS number_of_comments`
        ),
        db.raw(
          `json_strip_nulls(
            json_build_object(
              'id', usr.id,
              'user_name', usr.user_name,
              'full_name', usr.full_name,
              'nickname', usr.nickname,
              'date_created', usr.date_created,
              'date_modified', usr.date_modified
            )
          ) AS "author"`
        ),
      )
      .leftJoin(
        'blogful_comments AS comm',
        'art.id',
        'comm.article_id',
      )
      .leftJoin(
        'blogful_users AS usr',
        'art.author_id',
        'usr.id',
      )
      .groupBy('art.id', 'usr.id')
  },

  getById(db, id) {
    return ArticlesService.getAllArticles(db)
      .where('art.id', id)
      .first()
  },

  getCommentsForArticle(db, article_id) {
    return db
      .from('blogful_comments AS comm')
      .select(
        'comm.id',
        'comm.text',
        'comm.date_created',
        db.raw(
          `row_to_json(
            (SELECT tmp FROM (
              SELECT
                usr.id,
                usr.user_name,
                usr.full_name,
                usr.nickname,
                usr.date_created,
                usr.date_modified
            ) tmp)
          ) AS "user"`
        )
      )
      .where('comm.article_id', article_id)
      .leftJoin(
        'blogful_users AS usr',
        'comm.user_id',
        'usr.id',
      )
      .groupBy('comm.id', 'usr.id')
  },

  serializeArticle(article) {
    return {
      id: article.id,
      style: article.style,
      title: xss(article.title),
      content: xss(article.content),
      date_created: article.date_created,
      author: article.author || {},
      number_of_comments: Number(article.number_of_comments) || 0,
    }
  },

  serializeArticleComment(comment) {
    return {
      id: comment.id,
      article_id: comment.article_id,
      text: xss(comment.text),
      user: comment.user || {},
      date_created: comment.date_created,
    }
  },
}

module.exports = ArticlesService
