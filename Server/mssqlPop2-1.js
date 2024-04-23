const sql = require('mssql');
const ADODB = require('node-adodb');
const DATABASE_PATH = "C:\\Users\\henry\\Documents\\SHN_Project_Backup.mdb;";
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
                populateData();
            }
        });
    }
});

function populateData() {
    connection.query("SELECT * FROM Projects WHERE Projectid IS NOT NULL AND Projectid <> '' AND ProjectTitle IS NOT NULL AND ProjectTitle <> ''").then(data => {
        let query = 'DECLARE @value_to_check VARCHAR(7);';
        data.forEach((element) => {
            if(element.Projectid.length > 7) {
                console.log(element.Projectid + ' is too long :(');
            }
            else {
                query += "SET @value_to_check = '"+ element.Projectid +"';IF NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = @value_to_check) BEGIN PRINT @value_to_check;END ";
            }
        });
        pool.query(query, (err, rows) => {
            if(err) {
                console.log(err);
            }
            else {
                rows.recordsets.forEach((bruh)=>{
                    console.log(bruh);
                });
            }
        });
    }).catch((err) => {
        console.error(err);
    });
}