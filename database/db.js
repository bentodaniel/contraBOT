const mysql = require('mysql2')

module.exports = handle_connection()

function handle_connection() {
    console.log('Connecting to database...')

    return mysql.createConnection({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    });
}
