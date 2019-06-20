const config = require('./src/config');

module.exports = {
  "migrationDirectory": "migrations",
  "driver": "pg",
  "connectionString": process.env.NODE_ENV === 'test' ? config.TEST_DB_URL : config.DB_URL,
};

