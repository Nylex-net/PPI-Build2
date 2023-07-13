const sql = require('mssql');
const msnodesqlv8 = require('msnodesqlv8');
const config = require('./config.json');

// const conn = {
//     driver:config.mssql.driver,
//     database:config.mssql.database,
//     server:config.mssql.server,
//     user:config.mssql.user,
//     password:config.mssql.password,
//     options: {
//         trustedConnection: true,
//         trustServerCertificate: true
//     }
// };

// sql.connect(conn).then(() => {
//     console.log("Connection successful!");
//     const request = new sql.Request();
//     request.query('SELECT * FROM Staff').then((recordset) => {
//         console.log(recordset);
//         sql.close();
//     }).catch((err) => {
//          console.error(err);
//          sql.close();
//     });
// }).catch((err) => {
//     console.error(err);
// });

const connectionString = "server=localhost\\SQLEXPRESS;Database=master;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
const query = "SELECT * FROM master.dbo.Staff";

msnodesqlv8.query(connectionString, query, (err, rows) => {
    if(err) {
        console.error(err);
    }
    else {
        console.log(rows);
    }
});