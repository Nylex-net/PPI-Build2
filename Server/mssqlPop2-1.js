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

// Function to establish a new connection
function establishConnection() {
    try {
        pool.connect();
        console.log('Connection established.');
    } catch (err) {
      console.error('Error establishing connection:', err);
      process.exit();
    }
}

// // connect to your database
// pool.connect(err => {
//     if(err) {
//         console.error(err);
//     }
//     else {
//         console.log("Connected!");
//         // create Request object
//         // query to the database and get the records
//         const request = pool.request();
//         request.query('USE PPI;SET XACT_ABORT OFF;', function (err, recordset) {
                
//             if (err) {
//                 console.log(err);
//                 pool.close();
//                 process.exit();
//             }
//             else {
//                 populateData();
//             }
//         });
//     }
// });

function getMissing() {
    connection.query("SELECT * FROM Projects WHERE Projectid IS NOT NULL AND Projectid <> '' AND ProjectTitle IS NOT NULL AND ProjectTitle <> ''").then(data => {
        let query = 'USE PPI;';
        const skibidi = new Map();
        data.forEach((element) => {
            if(element.Projectid.length > 7) {
                console.log(element.Projectid + ' is too long :(');
            }
            else {
                query += "SELECT '"+element.Projectid+"' AS value_to_check WHERE NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = '"+element.Projectid+"');";
                if(skibidi.has(element.Projectid)) {
                    skibidi.get(element.Projectid).push(element);
                }
                else {
                    skibidi.set(element.Projectid, [element]);
                }
            }
        });
        const request = pool.request();
        request.query(query, (err, rows) => {
            if(err) {
                throw err;
            }
            else {
                // console.log(rows);
                const missedProjects = new Array();
                rows.recordsets.forEach((bruh)=>{
                    if(bruh.length > 0 && bruh[0].value_to_check.length >= 6 && !missedProjects.includes(bruh[0].value_to_check.trim())) {
                        missedProjects.push(bruh[0].value_to_check.trim());
                    }
                });
                const filteredMap = new Map();
                missedProjects.forEach(project => {
                    if(skibidi.has(project)) {
                        
                    }
                });
            }
        });
        
    }).catch((err) => {
        console.error(err.message);
    });
}

function addMissing(missed) {
    let query = "";
    missed.forEach(project => {
        query += "SELECT * FROM Projects WHERE Projectid = '" + project + "'; ";
    });
    // query = query.substring(0,query.length - 4) + ' ORDER BY Projectid;';
    // console.log(query);
    connection.query(query).then(data => {
        console.log(data);
    }).catch((err) => {
        console.error(err)
    });
}

pool.connect().then(()=>{
    getMissing();
});
