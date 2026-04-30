require('dotenv').config({ path: '.env' })

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
}
