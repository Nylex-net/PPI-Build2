const msnodesqlv8 = require('msnodesqlv8');
const ADODB = require('node-adodb')
// const config = require('./config.json');

const connectionString = `server=localhost\\SQLEXPRESS;Database=master;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`;
const query = "SELECT * FROM master.dbo.Staff";

msnodesqlv8.query(connectionString, query, (err, rows) => {
    if(err) {
        console.error(err);
    }
    else {
        console.log(rows);
    }
});