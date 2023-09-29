sql = require('mssql');
jsonData = require('./config.json');

const config = {
    user: jsonData.mssql.user,
    password: jsonData.mssql.password,
    server: jsonData.mssql.server,
    database: jsonData.mssql.database,
    // domain: jsonData.mssql.domain,
    options : jsonData.mssql.options
};
// const pool = new msnodesqlv8.Pool({
//     connectionString: connectionString
// });
const pool = new sql.ConnectionPool(config);

// connect to your database
sql.connect(config, function (err) {
    
    if (err) {
        console.log(err);
    }
    else {
        console.log("Success!");
        // create Request object
    var request = new sql.Request();
       
    // query to the database and get the records
    request.query('SELECT * from Staff', function (err, recordset) {
        
        if (err) console.log(err)

        // send records as a response
        res.send(recordset);
        
    });
    }
});