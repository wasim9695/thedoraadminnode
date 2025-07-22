
var mysql = require('mysql');
let pool = mysql.createPool({
    host: '127.0.0.1',
    port:'3307',
  user: 'root',
  password: '',
  database: 'nexteccoms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Function to get a connection from the pool
const getConnection = async () => {
  return await pool.getConnection();
};

// Export the connection pool and getConnection function
module.exports = {
  getConnection,
};