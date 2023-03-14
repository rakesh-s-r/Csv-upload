const { Client }  = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Rocky@1998',
  database: "postgres"
})

client.connect();

module.exports = client;