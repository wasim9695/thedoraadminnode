
var mysql = require('mysql');
let pool = mysql.createPool({
    host: '127.0.0.1',
    port:'3307',
  user: 'root',
  password: '',
  database: 'nexteccom'
});

pool.getConnection(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }

    console.log('Connected to the MySQL server.');
  });
  module.exports = pool;