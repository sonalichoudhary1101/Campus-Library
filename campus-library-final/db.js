
const mysql = require('mysql2/promise');

// A "pool" is a set of reusable connections to the database.
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',   // <-- CHANGE THIS to your MySQL password
  database: 'gqldemo',
});


module.exports = pool;
