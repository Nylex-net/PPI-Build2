const sql = require('mssql');
const jsonData = require('./config.json');
const fs = require('fs');

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
                prevailingWage();
            }
        });
    }
});

function prevailingWage() {
    const request = pool.request();
    request.query('SELECT Projects.project_id, Projects.SHNOffice_ID, Projects.closed, BillingGroups.group_number, BillingGroups.closed FROM Projects LEFT JOIN BillingGroups ON Projects.ID = BillingGroups.project_ID WHERE Projects.prevailing_wage = 1 ORDER BY Projects.SHNOffice_ID, Projects.project_id, BillingGroups.group_number;', (err, gyatt)=> {
        if(err) {
            console.error(err);
        }
        else { // gyatt is our query results.
            // console.log(gyatt.recordset);
            const rizzler = new Map(); // rizzler is where we'll store our results in the form of a map object to associate billing groups with projects.
            const office = new Map();
            gyatt.recordset.forEach((record) => {
                if(!rizzler.has(record.project_id + (record.closed[0]?'*':''))) {
                    rizzler.set((record.project_id + (record.closed[0]?'*':'')), (record.group_number == null?'NULL':record.group_number + (record.closed[1] == null || record.closed[1] == false?'':'*')));
                    office.set((record.project_id + (record.closed[0]?'*':'')), record.SHNOffice_ID);
                }
                else if(record.group_number != null && record.group_number != '') {
                    rizzler.set((record.project_id + (record.closed[0]?'*':'')), rizzler.get(record.project_id + (record.closed[0]?'*':'')) +',' + record.group_number + (record.closed[1] == null || record.closed[1] == false?'':'*'));
                }
            });
            let query = '';
            rizzler.forEach((value, key) => {
                query += 'INSERT INTO PrevailingWage (project_id, BillGrp, office) VALUES (\''+
                key + '\', ' + (value == 'NULL'?'NULL':"'"+value+"'") + ', ' + office.get(key)
                +');';
                // console.log(`Key is ${key} and value is ${value}`);
            });
            // console.log(query);
            request.query(query, (err)=> {
                if(err) {
                    console.error(err);
                }
            });
        }
    });
}

function logError(errMsg) {
    const logFileName = '/logs/rolodex/error.log';
    const logMessage = `${new Date().toISOString()} - ${errorMsg}\n`;

    // Append error message to the log file
    fs.appendFile(logFileName, logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}