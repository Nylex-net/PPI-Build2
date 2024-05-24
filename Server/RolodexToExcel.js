const sql = require('mssql');
const xlsx = require('xlsx');
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

function getRolodex() {
    const args = process.argv.slice(2);
    const startYear = (args.length > 0 && !isNaN(args[0])?Number(args[0]):null)
    if(startYear === null) {
        console.log("Please add 4-digit years numbers as args (YYYY).");
        pool.close();
        return null;
    }

    const query ="SELECT * FROM Rolodex WHERE created " + (args.length > 1 && !isNaN(args[1])?"BETWEEN CAST('"+ startYear +"-01-01' AS DATETIME2) AND "+(Number(args[1]) === new Date().getFullYear()?"GETDATE()":"CAST('"+args[1]+"-12-31"+"' AS DATETIME2)")+";":">= CAST('"+ startYear +"-01-01' AS DATETIME2);");

    const request = pool.request();
    request.query(query, (err, rows) => {
        if(err) {
            console.error(err);
        }
        else {
            console.log(rows.recordset);
            pool.close();
        }
    });
}

// connect to your database
pool.connect(err => {
    if(err) {
        console.error(err);
    }
    else {
        console.log("Connected!");
        // create Request object
        // query to the database and get the records
        pool.query('USE PPI;', function (err, recordset) {
                
            if (err) {
                console.log(err);
                pool.close();
                process.exit();
            }
            else {
                getRolodex();
            }
        });
    }
});