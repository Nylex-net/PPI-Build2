const sql = require('mssql');
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

const newvision = new sql.ConnectionPool({
    user: jsonData.oldSQL.user,
    password: jsonData.oldSQL.password,
    server: jsonData.oldSQL.server,
    database: jsonData.oldSQL.database,
    options : jsonData.oldSQL.options,
    requestTimeout: 600000
    // pool: {
    //     idleTimeoutMills: 
    // }
});

// connect to your database
newvision.connect(err => {
    if(err) {
        console.error(err);
    }
    else {
        console.log("Connected!");
        // create Request object
        // query to the database and get the records
        pool.query('USE SHN_Projects;SET XACT_ABORT OFF;', function (err, recordset) {
                
            if (err) {
                console.log(err);
                pool.close();
                process.exit();
            }
            else {
                const results = getClosed();
            }
        });
    }
});

function getClosed() {
    const request = pool.request();
    request("SELECT Projectid FROM Projects WHERE Projectid <> '' AND Projectid IS NOT NULL AND Closed_by_PM = 1");
}