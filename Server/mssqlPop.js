const msnodesqlv8 = require('msnodesqlv8');
const ADODB = require('node-adodb')
// const config = require('./config.json');
const DATABASE_PATH = "C:\\Users\\administrator\\Documents\\PPI\\Database\\SHN_Project_Backup.mdb;";
const connectionString = `server=localhost\\SQLEXPRESS;Database=master;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`;
// const query = "SELECT * FROM master.dbo.Staff";
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);

// Populates Staff.
connection.query('SELECT ID, Active, First, Last, Email, PM FROM Contacts').then(data => {
    data.forEach((element) => {
        var query = "INSERT INTO master.dbo.Staff VALUES ("+element.ID+", "+((element.Active == 'Yes')?1:0)+", '"+element.First.replace(/'/gi, "''")+"', '"+element.Last.replace(/'/gi, "''")+"', '"+element.Email+"', "+(element.PM==-1?1:0)+")";
        msnodesqlv8.query(connectionString, query, (err, rows) => {
            if(err) {
                console.log("Error for entry ID: " + element.ID)
                console.error(err);
            }
            // else {
            //     console.log(rows);
            // }
        });
    });
}).catch(err => {
    console.error(err);
});

// Populates Keywords.
connection.query('SELECT ID, Keyword, Group1 FROM Keywords').then(data => {
    data.forEach((element) => {
        var query = "INSERT INTO master.dbo.Keywords VALUES ("+element.ID+", '" +element.Keyword.replace(/'/gi, "''")+"', "+((element.Group1 == null || element.Group1 == '')?'NULL':"'"+element.Group1.replace(/'/gi, "''")+"'")+")";
        msnodesqlv8.query(connectionString, query, (err, rows) => {
            if(err) {
                console.log("Error for entry ID: " + element.ID)
                console.error(err);
            }
            // else {
            //     console.log(rows);
            // }
        });
    });
}).catch(err => {
    console.error(err);
});

// Populates Profile Codes.
connection.query('SELECT id, Code, CodeDescription, Active FROM ProfileCodes').then(data => {
    data.forEach((element) => {
        var query = "INSERT INTO master.dbo.ProfileCodes VALUES ("+element.id+", '"+element.Code+"', '" +element.CodeDescription.replace(/'/gi, "''")+"', "+((element.Active == -1)?1:0)+")";
        msnodesqlv8.query(connectionString, query, (err, rows) => {
            if(err) {
                console.log("Error for ID: " + element.id)
                console.error(err);
            }
            // else {
            //     console.log(rows);
            // }
        });
    });
}).catch(err => {
    console.error(err);
});