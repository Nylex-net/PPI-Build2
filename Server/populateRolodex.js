const sql = require('mssql');
const ADODB = require('node-adodb');
const fs = require('fs');
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
            query += "INSERT INTO Rolodex (client_company, first_name, last_name, job_title, address1, city, state, zip_code, work_phone, home_phone, cell, fax, email, created, last_edited"+
            ") VALUES ("+
            (element.Company == null || element.Company == 'NULL' || element.Company == ''?'NULL, ':'\''+element.Company.replace(/'/gi, "''")+'\', ')+
            (element.First == null || element.First == 'NULL' || element.First == ''?'\'\', ':'\''+element.First.replace(/'/gi, "''")+'\', ')+
            (element.Last == null || element.Last == 'NULL' || element.Last == ''?'\'\', ':'\''+element.Last.replace(/'/gi, "''")+'\', ')+
            (element.JobTitle == null || element.JobTitle == 'NULL' || element.JobTitle == ''?'NULL, ':'\''+element.JobTitle.replace(/'/gi, "''")+'\', ')+
            (element.Address == null || element.Address == 'NULL' || element.Address == ''?'NULL, ':'\''+element.Address.replace(/'/gi, "''")+'\', ')+
            (element.City == null || element.City == 'NULL' || element.City == ''?'NULL, ':'\''+element.City.replace(/'/gi, "''")+'\', ')+
            (element.State == null || element.State == 'NULL' || element.State == ''?'NULL, ':'\''+element.State.replace(/'/gi, "''")+'\', ')+
            (element.Zip == null || element.Zip == 'NULL' || element.Zip == ''?'NULL, ':'\''+element.Zip.replace(/'/gi, "''")+'\', ')+
            (element.WorkPhone == null || element.WorkPhone == 'NULL' || element.WorkPhone == ''?'NULL, ':'\''+element.WorkPhone.replace(/'/gi, "''")+'\', ')+
            (element.HomePhone == null || element.HomePhone == 'NULL' || element.HomePhone == ''?'NULL, ':'\''+element.HomePhone.replace(/'/gi, "''")+'\', ')+
            (element.CellPhone == null || element.CellPhone == 'NULL' || element.CellPhone == ''?'NULL, ':'\''+element.CellPhone.replace(/'/gi, "''")+'\', ')+
            (element.Fax == null || element.Fax == 'NULL' || element.Fax == ''?'NULL, ':'\''+element.Fax.replace(/'/gi, "''")+'\', ')+
            (element.EMail == null || element.EMail == 'NULL' || element.EMail == ''?'NULL, ':'\''+element.EMail.replace(/'/gi, "''")+'\', ')+
            ((element.DTStamp != null && element.DTStamp != '' && !isNaN(Date.parse(element.DTStamp)) && new Date(element.DTStamp) instanceof Date)? ('\'' + (new Date(element.DTStamp).getMonth() + 1) + "/" + (new Date(element.DTStamp).getDate()) + "/" + (new Date(element.DTStamp).getFullYear()) +'\', '):'GETDATE(), ')+ // (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
            (element.SubmitBy == null || element.SubmitBy == 'NULL' || element.SubmitBy == ''?'\'\'':'\''+element.SubmitBy.replace(/'/gi, "''")+'\'')+
            ");";
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