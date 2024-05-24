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

    // Grab arguments.
    const args = process.argv.slice(2);

    // Get start year if possible.  Otherwise, close the connection and return null.
    const startYear = (args.length > 0 && !isNaN(args[0])?Number(args[0]):null)
    if(startYear === null) {
        console.log("Please add 4-digit years numbers as args (YYYY).");
        pool.close();
        return null;
    }

    // Build query.
    const query ="SELECT * FROM Rolodex WHERE created " +
                // Test of the user put an end year.
                (args.length > 1 && !isNaN(args[1])?
                    "BETWEEN CAST('"+ startYear +"-01-01' AS DATETIME2) AND "+
                    // Test if the user used the same year as the current year.
                    (Number(args[1]) === new Date().getFullYear()?
                        "GETDATE()":
                        "CAST('"+args[1]+"-12-31"+"' AS DATETIME2)")+";"
                :">= CAST('"+ startYear +"-01-01' AS DATETIME2);");

    // Create request object and query our query.
    const request = pool.request();
    request.query(query, (err, rows) => {
        if(err) {
            console.error(err);
        }
        else {

            // Close the pool.
            pool.close();

            // Data will hold the data for our SQL results.
            const data = [['Client Company', 'Client Abbreviation', 'First Name', 'Last Name',
                'Relationship', 'Job Title', 'Address1', 'Address2', 'City', 'State',
                'Zip Code', 'Work Phone', 'Extension', 'Home Phone', 'Cell Phone',
                'Fax', 'Email', 'Created On'
            ]];

            // Iterate through data, clear null or undefined formatting, and add push to data array.
            rows.recordset.forEach((contact) => {

                // Clear any unknown values.
                for (let [key, value] of Object.entries(contact)) {
                    if(value == null || value == undefined || value == 'null' || value == "NULL" || value == 'undefined') {
                        contact[key] = '';
                    }
                }

                // Push to data array.
                data.push([contact.client_company, contact.client_abbreviation, contact.first_name, contact.last_name,
                    contact.relationship, contact.job_title, contact.address1, contact.address2, contact.city, contact.state,
                    contact.zip_code, contact.work_phone, contact.extension, contact.home_phone, contact.cell,
                    contact.fax, contact.email, contact.created
                ]);
            });

            // Create Workbook and Worksheet;
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.aoa_to_sheet(data);

            // Append the worksheet to the workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, "Rolodex_output");

            // Write the workbook to a file
            xlsx.writeFile(workbook, "Rolodex_2023-2024.xlsx");

            console.log("Excel file created successfully!");
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