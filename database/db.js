require('dotenv').config();
const mysql = require('mysql2')

module.exports = handle_connection()

function handle_connection() {
    console.log('Connecting to database...')

    // Default all to prod
    var host_name = process.env.PROD_DB_HOST;
    var db_name = process.env.PROD_DB_NAME;
    var u = process.env.PROD_DB_USER;
    var pw = process.env.PROD_DB_PASS;

    // Change to test env if need
    if (process.env.ENV_TYPE === 'test') {
        var host_name = process.env.TEST_DB_HOST;
        var db_name = process.env.TEST_DB_NAME;
        var u = process.env.TEST_DB_USER;
        var pw = process.env.TEST_DB_PASS;
    }

    return mysql.createConnection({
        host: host_name,
        database: db_name,
        user: u,
        password: pw
    });
}
