const sql = require('mssql');
const ADODB = require('node-adodb')
// const Pool = require('generic-pool');
// const config = require('./config.json');
const DATABASE_PATH = "N:\\Database\\New folder\\Rolodex.mdb;";
// const query = "SELECT * FROM master.dbo.Staff";
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
const jsonData = require('./config.json');

const pool = new sql.ConnectionPool({
    user: jsonData.mssqlPROD.user,
    password: jsonData.mssqlPROD.password,
    server: jsonData.mssqlPROD.server,
    database: jsonData.mssqlPROD.database,
    options : jsonData.mssqlPROD.options,
    requestTimeout: 600000
    // pool: {
    //     idleTimeoutMills: 
    // }
});

// connect to your database
pool.connect(err => {
    if(err) {
        console.error(err);
    }
    else {
        console.log("Connected!");
        // create Request object
        // query to the database and get the records
        pool.query('USE PPI;SET XACT_ABORT OFF;', function (err, recordset) {
                
            if (err) {
                console.log(err);
                pool.close();
                process.exit();
            }
            else {
                populateRolodex();
            }
        });
    }
});

function populateRolodex() {
    connection.query('SELECT * FROM Rolodex').then(data => {
        let query = '';
        data.forEach((element) => {
            query += "INSERT INTO Rolodex ("+
            (element.Company == null || element.Company == 'NULL' || element.Company == ''?'client_company, ':'')+
            'first_name, last_name, '+
            
            +") VALUES ("+");";
        });
        pool.query(query, (err, rows) => {
            if(err) {
                console.log(query);
                console.error(err);
            }
        });
    }).catch(err => {
        console.error(err);
    });
}