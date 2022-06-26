require('dotenv').config();
const mysql = require('mysql2')


module.exports = mysql.createConnection({
    host: 'localhost',  //process.env.DB_HOST
    database: 'test',   //process.env.DB_NAME
    user: 'root',       //process.env.DB_USER
    password: ''        //process.env.DB_PASS
});
