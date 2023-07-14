// Get MS Access driver at https://www.microsoft.com/en-us/download/details.aspx?id=54920
// Also make sure file extenstion is '.mdb'.
'use strict';
// const ADODB = require('node-adodb');
const msnodesqlv8 = require('msnodesqlv8');
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const nodemailer = require('nodemailer');
const winPermissionsManager = require('win-permissions-js');
const { exec } = require('child_process');
const https = require('https');
const DATABASE_PATH = "C:\\Users\\administrator\\Documents\\PPI\\Database\\SHN_Project_Backup.mdb;";
const jsonData = require('./config.json');

// Certificate configuration.
const options = {
    key: fs.readFileSync('C:\\xampp\\apache\\conf\\ssl.key\\key.pem'),
    cert: fs.readFileSync('C:\\xampp\\apache\\conf\\ssl.crt\\cert.pem')
};

// Zoho configuration
const CODE = jsonData.ZohoAPI.code; // Create code from self client in Zoho API console.
const CLIENT_ID = jsonData.ZohoAPI.client_id;
const CLIENT_SECRET = jsonData.ZohoAPI.client_secret;
const REFRESH_TOKEN = jsonData.ZohoAPI.refresh_token; // Replace with refresh token if available. Otherwise, set to null in config.json file.
const SCOPE = jsonData.ZohoAPI.scope;
const ORG_ID = jsonData.ZohoAPI.org_id;
let ZOHO = {};
oauthgrant(CODE, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, SCOPE).then((data)=> {
    ZOHO = data;
    if(data.hasOwnProperty("refresh_token")) {
        console.log("refresh_token: " + data.refresh_token);
    }
});

/**
 * Setting Access Rights on a Folder. This function is intended for
 * Windows Use only.
 * @param folderPath
 * @param rights
 * @param domain
 * @param name
 * @param accessString
 * @param isUser
 * @param propagate
 * @returns {Promise<void>} 
 */

// Directory for production environment.
// process.chdir("P:\\");

// Directory for testing environment.
process.chdir("U:\\Eureka\\Nylex\\test\\Mock_Drive");
const PATH = "U:/Eureka/Nylex/test/Mock_Drive";

// create application/json parser
var jsonParser = bodyParser.json();

// String to connect to MSSQL.
const connectionString = `server=localhost\\SQLEXPRESS;Database=master;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`;

// Change source directory accordingly.
app.use(cors());

// Gets all Employees.
app.get('/', (req, res) => {
    const query = 'SELECT * FROM Staff WHERE Active = 1 ORDER BY last'
    msnodesqlv8.query(connectionString, query, (err, rows) => {
        if(err) {
            console.log("Error for entry ID: " + element.ID);
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(rows));
        }
    });
    // const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // connection.query('SELECT ID, Last, First, PM FROM Contacts WHERE Active = \'Yes\' ORDER BY Last')
    // .then(data => {
    //     // Display formatted JSON data
    //     res.send(JSON.stringify(data));
    //     // callback(res);
    // })
    // .catch(error => {
    //     console.error('Error occured while accessing database.');
    //     createTicket(error, "Cannot GET employees.");
    //     res.send(JSON.stringify(error));
    //     // return callback(new Error("An error has occurred"));
    // })
});

// Gets all keywords.
app.get('/1', (req, res) => {
    // const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // connection.query('SELECT ID, Keyword FROM Keywords ORDER BY Keyword')
    // .then(data => {
    //     // Display formatted JSON data
    //     res.send(JSON.stringify(data,null,1));
    // })
    // .catch(error => {
    //     console.error('Error occured while accessing database.');
    //     createTicket(error, "Cannot GET keywords.");
    //     res.send(JSON.stringify(error));
    //     // return callback(new Error("An error has occurred"));
    // })
    const query = 'SELECT * FROM Keywords ORDER BY Keyword'
    msnodesqlv8.query(connectionString, query, (err, rows) => {
        if(err) {
            console.log("Error for entry ID: " + element.ID);
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(rows));
        }
    });
});

// Get all Profile codes.
app.get('/2', (req, res) => {
    const query = 'SELECT * FROM ProfileCodes ORDER BY Code'
    msnodesqlv8.query(connectionString, query, (err, rows) => {
        if(err) {
            console.log("Error for entry ID: " + element.ID);
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(rows));
        }
    });
    // const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // connection.query('SELECT Code, CodeDescription FROM ProfileCodes ORDER BY Code')
    // .then(data => {
    //     // Display formatted JSON data
    //     res.send(JSON.stringify(data,null,1));
    // })
    // .catch(error => {
    //     console.error('Error occured while accessing database.');
    //     createTicket(error, "Cannot GET profile codes.");
    //     res.send(JSON.stringify(error));
    // })
});

/**
 * Posts the users' selections to the database.
 */

app.post('/result', jsonParser, (req, res) => {
    // Get current year.
    const dateYear = new Date().getFullYear();

    // Begin building directory and project number for the new project.
    let projnum = '';
    // Id stores an integer representing the project's office.
    if(req.body.Id == 1) { // If Arcata was selected.
        projnum = "0";
    }
    else if(req.body.Id == 9) { // idk.
        projnum = "9";
    }
    else {
        projnum = req.body.Id;
    }
    
    // Start directory with getting the office.
    let dir = '.';
    dir += getDir(projnum);
    if(!fs.existsSync(dir)) {
        fs.mkdir((dir), err => {
            if(err){
                throw err;
            }
        });
    }
    // Get current year.
    dir += '/' + dateYear.toString();

    let counter = 0;

    // if doesn't exist, make the directory.
    if(!fs.existsSync(dir)) {
        fs.mkdir((dir), err => {
            if(err){
                throw err;
                }
        });
    }
    else { // Determine the next project number by iterating through directory names and finding the highest project number.
        let dirFiles = fs.readdirSync(dir);
        let ifExist = false;
        if(dirFiles.length != 0) {
            dirFiles.forEach(file => {
                if(file[0].localeCompare(projnum[0].toString()) == 0 && file.length >= 6 && !isNaN(file[3]+file[4]+file[5]) && Number(file[3]+file[4]+file[5]) >= counter) {
                    counter = Number(file[3]+file[4]+file[5]);
                    ifExist = true;
                    // console.log('I counted to ' + counter); // For texting purposes.
                }
            });
            if(ifExist) {
                counter++;
            }
        }
    }
    
    // Append 0s at beginning if counter.
    if(counter < 10) {
        counter = '00' + counter.toString();
    }
    else if(counter < 100) {
        counter = '0' + counter.toString();
    }
    else {
        counter = counter.toString();
    }

    // append last 2 digits of the year and the value of coutner.
    projnum += dateYear.toString().slice(-2) + counter;

    // Append ID and project title to be apart of the new project directory.
    if(req.body.Id == 1) {
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
        projnum += 'A'
    }
    else{
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
    }
    // Format retainer.
    let retainMe = (req.body.RetainerPaid == 'None') ? req.body.Retainer:'$'+req.body.RetainerPaid;
    // Begin building SQL query.
    let query;
    // let latLongNaN = false;
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // Get maximum database ID.
    connection.query('SELECT TOP 1 MAX(Id) AS Id FROM Projects')
    .then(bigNum => {
        // Check if we can insert latitude and longitude.  If not, don't bother.
        if(isNaN(req.body.Latitude) || isNaN(req.body.Longitude)) {
            query = 'INSERT INTO Projects (Id, Projectid, ProjectTitle, ProjectMgr, QA_QCPerson, TeamMembers, StartDate, CloseDate, ProjectLoation, ' +
            'ProjectKeywords, SHNOffice, ServiceArea, ToatlContract, RetainerPaid, ProfileCode, ContractType, InvoiceFormat, '+
            'PREVAILING_WAGE, SpecialBillingInstructins, SEEALSO, AutoCAD_Project, GIS_Project, Project_Specifications, ClientCompany1, OfficeMailingLists1, '+
            'ClientAbbrev1, ClientContactFirstName1, ClientContactLastName1, Title1, Address1_1, Address2_1, City1, State1, Zip1, PhoneW1, PhoneH1, Cell1, Fax1, Email1, '+
            'BinderSize, BinderLocation, DescriptionService, DTStamp'+
            ') VALUES (' + Number(bigNum[0].Id + 1) + ', \''+ projnum + '\', \''+ req.body.ProjectTitle + '\', \'' + req.body.ProjectMgr + '\', \'' + req.body.QA_QCPerson + '\', \''+ req.body.TeamMembers +'\', \''+
            req.body.StartDate + '\', \''+ req.body.CloseDate +'\' , \''+ req.body.ProjectLocation +'\', \''+ req.body.ProjectKeywords +'\', '+
            '\'' + req.body.SHNOffice + '\', \''+ req.body.ServiceArea + '\', \''+ req.body.TotalContract +'\', \''+ retainMe + '\', \'' + req.body.ProfileCode +'\', \''+
            req.body.ContractType +'\', \''+ req.body.InvoiceFormat + '\', \'' + req.body.PREVAILING_WAGE + '\', \''+ req.body.SpecialBillingInstructins + '\', \'' + 
            req.body.SEEALSO +'\', '+ req.body.AutoCAD_Project + ', '+ req.body.GIS_Project + ', \'' + req.body.Project_Specifications + '\', \'' +
            req.body.ClientCompany1 + '\', \'' + req.body.OfficeMailingLists1 + '\', \'' + req.body.ClientAbbrev1 + '\', \'' + req.body.ClientContactFirstName1 + '\', \'' + req.body.ClientContactLastName1 + '\', \'' +
            req.body.Title1 + '\', \'' + req.body.Address1_1 + '\', \'' + req.body.Address2_1 + '\', \'' + req.body.City1 + '\', \'' + req.body.State1 + '\', \'' + req.body.Zip1 + '\', \'' +
            req.body.PhoneW1 + '\', \'' + req.body.PhoneH1 + '\', \'' + req.body.Cell1 + '\', \'' + req.body.Fax1 + '\', \'' + req.body.Email1 + '\', \'' + req.body.BinderSize + '\', \'' + req.body.BinderLocation + '\', \'' +
            req.body.DescriptionService + '\', \''+ req.body.CreatedOn +'\'' +
            ')';
            // latLongNaN = true;
        }
        else {
            query = 'INSERT INTO Projects (Id, Projectid, ProjectTitle, ProjectMgr, QA_QCPerson, TeamMembers, StartDate, CloseDate, ProjectLoation, ' +
            'Lattitude, Longitude, ProjectKeywords, SHNOffice, ServiceArea, ToatlContract, RetainerPaid, ProfileCode, ContractType, InvoiceFormat, '+
            'PREVAILING_WAGE, SpecialBillingInstructins, SEEALSO, AutoCAD_Project, GIS_Project, Project_Specifications, ClientCompany1, OfficeMailingLists1, '+
            'ClientAbbrev1, ClientContactFirstName1, ClientContactLastName1, Title1, Address1_1, Address2_1, City1, State1, Zip1, PhoneW1, PhoneH1, Cell1, Fax1, Email1, '+
            'BinderSize, BinderLocation, DescriptionService, DTStamp'+
            ') VALUES (' + Number(bigNum[0].Id + 1) + ', \''+ projnum + '\', \''+ req.body.ProjectTitle + '\', \'' + req.body.ProjectMgr + '\', \'' + req.body.QA_QCPerson + '\', \''+ req.body.TeamMembers +'\', \''+
            req.body.StartDate + '\', \''+ req.body.CloseDate +'\' , \''+ req.body.ProjectLocation +'\', '+ req.body.Latitude +', '+ req.body.Longitude +', \''+ req.body.ProjectKeywords +'\', '+
            '\'' + req.body.SHNOffice + '\', \''+ req.body.ServiceArea + '\', \''+ req.body.TotalContract +'\', \''+ retainMe + '\', \'' + req.body.ProfileCode +'\', \''+
            req.body.ContractType +'\', \''+ req.body.InvoiceFormat + '\', \'' + req.body.PREVAILING_WAGE + '\', \''+ req.body.SpecialBillingInstructins + '\', \'' + 
            req.body.SEEALSO +'\', '+ req.body.AutoCAD_Project + ', '+ req.body.GIS_Project + ', \'' + req.body.Project_Specifications + '\', \'' +
            req.body.ClientCompany1 + '\', \'' + req.body.OfficeMailingLists1 + '\', \'' + req.body.ClientAbbrev1 + '\', \'' + req.body.ClientContactFirstName1 + '\', \'' + req.body.ClientContactLastName1 + '\', \'' +
            req.body.Title1 + '\', \'' + req.body.Address1_1 + '\', \'' + req.body.Address2_1 + '\', \'' + req.body.City1 + '\', \'' + req.body.State1 + '\', \'' + req.body.Zip1 + '\', \'' +
            req.body.PhoneW1 + '\', \'' + req.body.PhoneH1 + '\', \'' + req.body.Cell1 + '\', \'' + req.body.Fax1 + '\', \'' + req.body.Email1 + '\', \'' + req.body.BinderSize + '\', \'' + req.body.BinderLocation + '\', \'' +
            req.body.DescriptionService + '\', \''+ req.body.CreatedOn +'\'' +
            ')';
        }
        // Execute query.
        connection.execute(query)
        .then(data => { // On success, create and build the new project directory.
            
    
            // if(latLongNaN) {
            //     connection.execute('INSERT INTO Project_Coordinates (ID, PID, Lat, [Long]) VALUES (\''+ Number(projnum) +'\',\'' + projnum + '\', \''+ req.body.Latitude +'\', \''+ req.body.Longitude +'\')');
            // }
    
            if(!fs.existsSync(dir)) {
                fs.mkdir((dir), err => {
                    if(err){
                        throw err;
                    }
                });
            }
            // If Arcata Project, store project number in removeA and remove the A.
            let removeA = projnum;
            if(projnum.length > 6 && projnum[6] == 'A') {
                removeA = projnum.substring(0,6);
            }
            // Begin creating PDF document.
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(dir + '/'+ removeA +'.pdf'));
            (async function(){
                // table 
                const table = {
                  title: (req.body.Projectid != null && req.body.Projectid != undefined)?req.body.Projectid:req.body.PromoId,
                  subtitle: "Project Initiation",
                  headers: ["Name", "User Input", "Client", "Info"],
                  rows: [
                    [ "Project", removeA, "Client Company", removeEscapeQuote(req.body.ClientCompany1)],
                    [ "Title", req.body.ProjectTitle, "Client Abbreviation", (req.body.ClientAbbrev1 == null || req.body.ClientAbbrev1 == undefined || req.body.ClientAbbrev1 == '')?"none":removeEscapeQuote(req.body.ClientAbbrev1)],
                    ["Project Manager", req.body.ProjectMgrName, "Client First Name", removeEscapeQuote(req.body.ClientContactFirstName1)],
                    ["QAQC Person", req.body.QA_QCPersonName, "Client Last Name", removeEscapeQuote(req.body.ClientContactLastName1)],
                    ["Team Members", req.body.TeamMemberNames, "Relationship", req.body.ClientRelation],
                    ["Start Date", formatDate(req.body.StartDate), "Job Title", removeEscapeQuote(req.body.Title1)],
                    ["Close Date", formatDate(req.body.CloseDate), "Address", removeEscapeQuote(req.body.Address1_1)],
                    ["Location", removeEscapeQuote(req.body.ProjectLocation), "2nd Address", removeEscapeQuote(req.body.Address2_1)],
                    ["Latitude", removeEscapeQuote(req.body.Latitude),"City", removeEscapeQuote(req.body.City1)],
                    ["Longitude", removeEscapeQuote(req.body.Longitude), "State", req.body.State1],
                    ["Keywords", req.body.ProjectKeywords, "Zip", req.body.Zip1],
                    ["SHN Office", req.body.SHNOffice, "Work Phone", removeEscapeQuote(req.body.PhoneW1)],
                    ["Service Area", req.body.ServiceArea, "Home Phone", removeEscapeQuote(req.body.PhoneH1)],
                    ["Total Contract", req.body.TotalContract, "Cell Phone", removeEscapeQuote(req.body.Cell1)],
                    ["Service Agreement", req.body.ServiceAgreement, "Fax", removeEscapeQuote(req.body.Fax1)],
                    ["If yes, why?", req.body.Explanation, "Email", removeEscapeQuote(req.body.Email1)],
                    ["Retainer", removeEscapeQuote(retainMe), "Binder Size", req.body.BinderSize],
                    ["Profile Code", req.body.ProfileCode, "Binder Location", req.body.BinderLocation],
                    ["Contract Type", req.body.contactTypeName,'',''],
                    ["Invoice Format", req.body.InvoiceFormat,'',''],
                    ["Client Contract/PO#", req.body.ClientContractPONumber,'',''],
                    ["Outside Markup", (req.body.OutsideMarkup == undefined)?0:req.body.OutsideMarkup,'',''],
                    ["Prevailing Wage", removeEscapeQuote(req.body.PREVAILING_WAGE)],
                    ["Billing Instructions", removeEscapeQuote(req.body.SpecialBillingInstructins),'',''],
                    ["See Also", req.body.SEEALSO],
                    ["AutoCAD", (req.body.AutoCAD_Project == -1)?'Yes':'No','',''],
                    ["GIS Job", (req.body.GIS_Project == -1)?'Yes':'No','',''],
                    ["Project Specifications", (req.body.Project_Specifications == -1)?'Yes':'No','Created on',new Date().toString()],
                    ["Description of Services", removeEscapeQuote(req.body.DescriptionService),'Created By',removeEscapeQuote(req.body.CreatedBy)]
                  ]
                };

                await doc.table(table, {
                    columnsSize: [ 120, 130, 100, 130],
                    padding: 2,
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        (indexColumn == 0 || indexColumn == 2)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
                        const {x, y, width, height} = rectCell;
                        if(indexColumn === 1 && indexRow != table.rows.length - 1) {
                            doc
                            .lineWidth(1)
                            .moveTo(x + width, y)
                            .lineTo(x + width, y + height)
                            .stroke();
                        }
                        if((indexRow === 7 || indexRow === 16 || indexRow === 24) && indexColumn === 0) {
                            doc
                            .lineWidth(2)
                            .moveTo(x, y)
                            .lineTo(x + 250, y)
                            .stroke();
                        }

                        doc.fontSize(10).fillColor('#000000');
                    }
                });
                // await doc.table(descTable, {
                //     columnsSize: [ 100, 390]
                // });
                // done!
                doc.end();

                // Create the directories for Project.
                createDirectories(dir, true);

                // Start of array of who to notify of this creation.
                const admins = jsonData.email.admins;

                let officeAdmins = [];
                // Get cooresponding admin office group to notify of this project creation.
                if(projnum.length > 6) {
                    officeAdmins = getAdmin(projnum[0], projnum[6]);
                }
                else {
                    officeAdmins = getAdmin(projnum[0], 'Z');
                }
                // push results into admins array.
                for(let admin of officeAdmins) {
                    admins.push(admin);
                }
                // Get individual Project manager to notify.
                connection.query('SELECT Email FROM Contacts WHERE ID = '+ req.body.ProjectMgr +' AND Email IS NOT NULL').then(emails => {
                    Object.entries(emails).forEach(email => {
                        if(!admins.includes(email[1].Email + '@shn-engr.com' || email[1].Email != undefined)) {
                            admins.push(email[1].Email + '@shn-engr.com');
                        }
                    });
                    // Finally, send out email notice.
                    // emailPersonel(removeA +'.pdf', dir + '/'+ removeA +'.pdf', 'Project with ID ' + projnum + ' has been initialized!<br>See PDF for more.', admins, 'Project with ID ' + projnum + ' initialized.');
                }).catch(awNo => {
                    console.log('Could not send email.  The following error occurred instead:\n' + awNo);
                    createTicket(awNo, "Project initiation email could not be sent:");
                });
              })();
            // If all is successful, send project number to user.
            res.send(JSON.parse('{"Status":"'+ projnum + '"}'));
        });
    })
    .catch(err => { // If something fails, print error and attempt to send error back to user.
        console.error(err);
        try{
            res.send(JSON.stringify(err));
            createTicket(err, "Error in initiating a project:");
        }
        catch(OhNo) {
            console.log("Could not send back error response for project " + projnum);
        }
    });
    
});

/**
 * API to post and create new Promo Initialization.
 * Follows similar process as the Project Initialization.
 */

app.post('/promo', jsonParser, (req, res) => {
    // Get current year.
    const dateYear = new Date().getFullYear();
    // Begin creating new promo number.
    let projnum;
    if(req.body.Id == 1) {
        projnum = "0";
    }
    else {
        projnum = req.body.Id;
    }
    // Connect to database.
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);

    // Begin creating directory.
    let dir = '.';
    dir += getDir(projnum); // Get office.

    // Append year.
    dir += "/" + dateYear;
    // If directory doesn't exist, create it.
    if(!fs.existsSync(dir)) {
        fs.mkdir((dir), err => {
            if(err){
                throw err;
            }
        });
    }

    // Go to Promos directory.
    dir += '/Promos';
    let counter = 1;

    // If Promos directory doesn't exist, make one.
    if(!fs.existsSync(dir)) {
        fs.mkdir((dir), err => {
            if(err){
                throw err;
                }
        });
    }
    else { // Else, we determine the next promo number by reading promo numbers in directory names.
        let dirFiles = fs.readdirSync(dir);
        if(dirFiles.length != 0) {
            dirFiles.forEach(file => {
                if(file[0].localeCompare(projnum[0].toString()) == 0 && !isNaN(file[7]+file[8]+file[9]) && Number(file[7]+file[8]+file[9]) > counter) {
                    counter = Number(file[7]+file[8]+file[9]);
                    // console.log('I counted to ' + counter); // For texting purposes.
                }
            });
            counter++;
        }
    }
    
    // Append 0s if needed.
    if(counter < 10) {
        counter = '00' + counter.toString();
    }
    else if(counter < 100) {
        counter = '0' + counter.toString();
    }
    else {
        counter = counter.toString();
    }

    // Create the final promo number.
    projnum += dateYear.toString().slice(-2) + "000." + counter;

    // Create directory name for new promo.
    if(req.body.Id == 1) {
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
        projnum += 'A';
    }
    else {
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
    }

    // let latLongNaN = false;
    let query; // Begin making SQL query.

    connection.query('SELECT TOP 1 MAX(Id) AS Id FROM Projects') // Get highest ID in database.
    .then(bigNum => {
        // If we can insert latitude and longitude as numbers, do so.  Otherwise, don't bother.
        if(isNaN(req.body.Latitude) || isNaN(req.body.Longitude)) {
            query = 'INSERT INTO Projects (Id, PromoId, ProjectTitle, AlternateTitle, ProjectMgr, QA_QCPerson, TeamMembers, StartDate, CloseDate, ProjectLoation, ' +
            'ProjectKeywords, SHNOffice, ServiceArea, ProfileCode, ClientCompany1, OfficeMailingLists1, '+
            'ClientAbbrev1, ClientContactFirstName1, ClientContactLastName1, Title1, Address1_1, Address2_1, City1, State1, Zip1, PhoneW1, PhoneH1, Cell1, Fax1, Email1, '+
            'BinderSize, DescriptionService, DTStamp'+
            ') VALUES (' + Number(bigNum[0].Id + 1) + ', \''+ projnum + '\', \''+ req.body.ProjectTitle + '\', \'' + req.body.AlternateTitle + '\', \'' + req.body.ProjectMgr + '\', \'' + req.body.QA_QCPerson + '\', \''+ req.body.TeamMembers +'\', \''+
            req.body.StartDate + '\', \''+ req.body.CloseDate +'\' , \''+ req.body.ProjectLocation +'\', \''+ req.body.ProjectKeywords +'\', '+
            '\'' + req.body.SHNOffice + '\', \''+ req.body.ServiceArea + '\', \'' + req.body.ProfileCode +'\', \''+
            req.body.ClientCompany1 + '\', \'' + req.body.OfficeMailingLists1 + '\', \'' + req.body.ClientAbbrev1 + '\', \'' + req.body.ClientContactFirstName1 + '\', \'' + req.body.ClientContactLastName1 + '\', \'' +
            req.body.Title1 + '\', \'' + req.body.Address1_1 + '\', \'' + req.body.Address2_1 + '\', \'' + req.body.City1 + '\', \'' + req.body.State1 + '\', \'' + req.body.Zip1 + '\', \'' +
            req.body.PhoneW1 + '\', \'' + req.body.PhoneH1 + '\', \'' + req.body.Cell1 + '\', \'' + req.body.Fax1 + '\', \'' + req.body.Email1 + '\', \'' + req.body.BinderSize + '\', \'' +
            req.body.DescriptionService + '\', \''+ req.body.CreatedOn+'\'' +
            ')';
            // latLongNaN = true;
        }
        else {
            query = 'INSERT INTO Projects (Id, PromoId, ProjectTitle, AlternateTitle, ProjectMgr, QA_QCPerson, TeamMembers, StartDate, CloseDate, ProjectLoation, ' +
            'Lattitude, Longitude, ProjectKeywords, SHNOffice, ServiceArea, ProfileCode, ClientCompany1, OfficeMailingLists1, '+
            'ClientAbbrev1, ClientContactFirstName1, ClientContactLastName1, Title1, Address1_1, Address2_1, City1, State1, Zip1, PhoneW1, PhoneH1, Cell1, Fax1, Email1, '+
            'BinderSize, DescriptionService, DTStamp'+
            ') VALUES (' + Number(bigNum[0].Id + 1) + ', \''+ projnum + '\', \''+ req.body.ProjectTitle + '\', \'' + req.body.AlternateTitle + '\', \'' + req.body.ProjectMgr + '\', \'' + req.body.QA_QCPerson + '\', \''+ req.body.TeamMembers +'\', \''+
            req.body.StartDate + '\', \''+ req.body.CloseDate +'\' , \''+ req.body.ProjectLocation +'\', '+ req.body.Latitude +', '+ req.body.Longitude +', \''+ req.body.ProjectKeywords +'\', '+
            '\'' + req.body.SHNOffice + '\', \''+ req.body.ServiceArea + '\', \'' + req.body.ProfileCode +'\', \''+
            req.body.ClientCompany1 + '\', \'' + req.body.OfficeMailingLists1 + '\', \'' + req.body.ClientAbbrev1 + '\', \'' + req.body.ClientContactFirstName1 + '\', \'' + req.body.ClientContactLastName1 + '\', \'' +
            req.body.Title1 + '\', \'' + req.body.Address1_1 + '\', \'' + req.body.Address2_1 + '\', \'' + req.body.City1 + '\', \'' + req.body.State1 + '\', \'' + req.body.Zip1 + '\', \'' +
            req.body.PhoneW1 + '\', \'' + req.body.PhoneH1 + '\', \'' + req.body.Cell1 + '\', \'' + req.body.Fax1 + '\', \'' + req.body.Email1 + '\', \'' + req.body.BinderSize + '\', \'' +
            req.body.DescriptionService + '\', \''+ req.body.CreatedOn +'\'' +
            ')';
        }
        connection.execute(query) // Execute query.
        .then(data => {
    
            // if(latLongNaN) {
            //     connection.execute('INSERT INTO Project_Coordinates (ID, PID, Lat, [Long]) VALUES (\''+ Number(projnum) +'\', \'' + projnum + '\', \''+ req.body.Latitude +'\', \''+ req.body.Longitude +'\')');
            // }

            // Create directory of new promo folder.
            if(!fs.existsSync(dir)) {
                fs.mkdir((dir), err => {
                    if(err){
                        throw err;
                    }
                });
            }

            // Remove A from Promo number if it's an Arcata office.
            let removeA = projnum;
            if(projnum.length > 10 && projnum[10] == 'A') {
                removeA = projnum.substring(0,10);
            }
    
            // Start creation of PDF document.
            const doc = new PDFDocument();
            const myPath = dir + '/'+ removeA +'.pdf';
            doc.pipe(fs.createWriteStream(myPath));
    
            // Content of PDF.
            (async function(){
                // table 
                const table = {
                  title: (req.body.Projectid != null && req.body.Projectid != undefined)?req.body.Projectid:req.body.PromoId,
                  subtitle: "Promo Initiation",
                  headers: ["Name", "User Input", "Client", "Info"],
                  rows: [
                    [ "Promo", removeA, "Client Company", removeEscapeQuote(req.body.ClientCompany1)],
                    [ "Title", req.body.ProjectTitle, "Client Abbreviation", (req.body.ClientAbbrev1 == null || req.body.ClientAbbrev1 == undefined || req.body.ClientAbbrev1 == '')?"none":removeEscapeQuote(req.body.ClientAbbrev1)],
                    ["Project Manager", req.body.ProjectMgrName, "Client First Name", removeEscapeQuote(req.body.ClientContactFirstName1)],
                    ["Type of Promo", removeEscapeQuote(req.body.AlternateTitle), "Client Last Name", removeEscapeQuote(req.body.ClientContactLastName1)],
                    ["QAQC Person", req.body.QA_QCPersonName, "Relationship", req.body.ClientRelation],
                    ["Team Members", req.body.TeamMemberNames, "Job Title", removeEscapeQuote(req.body.Title1)],
                    ["Start Date", formatDate(req.body.StartDate), "Address", removeEscapeQuote(req.body.Address1_1)],
                    ["Close Date", formatDate(req.body.CloseDate), "2nd Address", removeEscapeQuote(req.body.Address2_1)],
                    ["Location", removeEscapeQuote(req.body.ProjectLocation),"City", removeEscapeQuote(req.body.City1)],
                    ["Latitude", removeEscapeQuote(req.body.Latitude), "State", req.body.State1],
                    ["Longitude", removeEscapeQuote(req.body.Longitude), "Zip", req.body.Zip1],
                    ["Keywords", req.body.ProjectKeywords, "Work Phone", removeEscapeQuote(req.body.PhoneW1)],
                    ["SHN Office", req.body.SHNOffice, "Home Phone", removeEscapeQuote(req.body.PhoneH1)],
                    ["Service Area", req.body.ServiceArea, "Cell Phone", removeEscapeQuote(req.body.Cell1)],
                    ["Profile Code", req.body.ProfileCode, "Fax", removeEscapeQuote(req.body.Fax1)],
                    ["-", '-', "Email", removeEscapeQuote(req.body.Email1)],
                    ["-", '-', "Binder Size", req.body.BinderSize],
                    ['-','-','Created On',new Date().toString()],
                    ["Description of Services", removeEscapeQuote(req.body.DescriptionService),'Created By',removeEscapeQuote(req.body.CreatedBy)]
                  ]
                };
                // A4 595.28 x 841.89 (portrait) (about width sizes)
                // width
                // await doc.table(table, { 
                //   width: 400
                // });
                // or columnsSize
                await doc.table(table, {
                    columnsSize: [ 120, 130, 100, 130],
                    padding: 2,
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        (indexColumn == 0 || indexColumn == 2)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
                        const {x, y, width, height} = rectCell;
                        if(indexColumn === 1 && indexRow != table.rows.length - 1) {
                            doc
                            .lineWidth(1)
                            .moveTo(x + width, y)
                            .lineTo(x + width, y + height)
                            .stroke();
                        }
                        if((indexRow === 7) && indexColumn === 0) {
                            doc
                            .lineWidth(2)
                            .moveTo(x, y)
                            .lineTo(x + 250, y)
                            .stroke();
                        }

                        doc.fontSize(10).fillColor('#000000');
                    }
                });
                // done!
                doc.end();

                // Create directories for Promo folder.
                createDirectories(dir, true);

                // Array to store contacts of who to notify of this creation.
                const admins = jsonData.email.admins;

                // Get cooresponding admin office.
                let officeAdmins = [];
                if(projnum.length > 10) {
                    officeAdmins = getAdmin(projnum[0], projnum[10]);
                }
                else {
                    officeAdmins = getAdmin(projnum[0], 'Z');
                }
                // push admin office into admins array.
                for(let admin of officeAdmins) {
                    admins.push(admin);
                }
                // Query the Project manager's email.
                connection.query('SELECT Email FROM Contacts WHERE ID = '+ req.body.ProjectMgr + ' AND Email IS NOT NULL').then(emails => {
                    // console.log(emails);
                    Object.entries(emails).forEach(email => { // Include their email in the admins array.
                        if(!admins.includes(email[1].Email + '@shn-engr.com' || email[1].Email != undefined)) {
                            admins.push(email[1].Email + '@shn-engr.com');
                        }
                    });
                    // Finally, send the email.
                    // emailPersonel(removeA +'.pdf', myPath, 'Promo with ID ' + projnum + ' has been initialized!<br>See PDF for more.', admins, 'Promo with ID ' + projnum + ' initialized.');
                }).catch(awNo => { // If email query fails, print error.
                    createTicket(awNo, "Could not send Promo Initiation email:");
                    console.log('Could not send email.  The following error occurred instead:\n' + awNo);
                });
              })();
              // If all is successful, send back the Promo number.
            res.send(JSON.parse('{"Status":"'+ projnum +'"}'));
        });
    })
    .catch(error => { // If any errors happen, print and send error.
        console.error(error);
        try{
            createTicket(error, "Promo Initiation failed:");
            res.send(JSON.stringify(error));
        }
        catch(AwMan) {
            console.log("Could not send error response for Promo " + projnum);
        }
    });
});

/**
 * Gets IDs of the keywords by keyword names.
 * It assumes keywords wil be sent in a string format, where the keywords are separated with " || ".
 * Older project don't always conform to this separation.
 */

app.post('/keyName', jsonParser, (req, res) => {
    // Connect to database.
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // Split keywords into array.
    let keyArray = req.body.keyText.split(' || ');
    let keyQuery = '';
    for(let word of keyArray) { // Build query.
        keyQuery += 'Keyword = \'' + word + '\' OR ';
    }
    keyQuery = keyQuery.substring(0, keyQuery.length - 4); // remove the final appended " OR ".
    connection.query('SELECT ID FROM Keywords WHERE ' + keyQuery).then(keyIDs => {
        // Send back query results.
        res.send(JSON.parse(JSON.stringify(keyIDs)));
    }).catch(err => {
        // If an error happens. send back an error.
        createTicket(err, "Could not retrieve Keyword IDs:");
        res.send(JSON.parse(JSON.stringify(err)));
    });
})

/**
 * API to convert a promo to a project.
 * To be real with ya, SHN doesn't seem to care enough about this functionality.
 */

app.post('/ProjPromo', jsonParser, (req, res) => {
    // let myResponse = 'Null response';
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    let projnum = '';
    if(req.body.PromoId[0] == 1) {
        projnum = "0";
    }
    else {
        projnum = req.body.PromoId[0];
    }
    
    let dir = '.';
    dir += getDir(req.body.PromoId[0]); // Gets the cooresponding Office 
    // if(!fs.existsSync(dir)) {
    //     fs.mkdir((dir), err => {
    //         if(err){
    //             throw err;
    //         }
    //     });
    // }

    dir += '/' + '20' + req.body.PromoId[1] + req.body.PromoId[2];

    let counter = 0;

    if(!fs.existsSync(dir)) {
        fs.mkdir((dir), err => {
            if(err){
                throw err;
                }
        });
    }
    else {
        let dirFiles = fs.readdirSync(dir);
        if(dirFiles.length != 0) {
            dirFiles.forEach(file => {
                if(file[0].localeCompare(projnum[0].toString()) == 0 && file.length >= 6 && !isNaN(file[3]+file[4]+file[5]) && Number(file[3]+file[4]+file[5]) >= counter) {
                    counter = Number(file[3]+file[4]+file[5]);
                    // console.log('I counted to ' + counter); // For texting purposes.
                }
            });
            counter++;
        }
    }
    
    if(counter < 10) {
        counter = '00' + counter.toString();
    }
    else if(counter < 100) {
        counter = '0' + counter.toString();
    }
    else {
        counter = counter.toString();
    }

    projnum += req.body.PromoId[1] + req.body.PromoId[2] + counter;
    if(req.body.PromoId.length > 10 && req.body.PromoId[10].localeCompare('A') == 0) {
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
        projnum += 'A';
    }
    else{
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
    }

    // chosenJson.ProjectMgrName = mgrName;
    // chosenJson.QA_QCPersonName = qaqcname;
    // chosenJson.TeamMemberNames = teamString(memNames);
    // chosenJson.retainer = retainer;
    // chosenJson.contactTypeName = contactTypeName;
    // chosenJson.ClientContractPONumber = format(contractPONum);
    // chosenJson.OutsideMarkup = outsideMarkup;
    let retainMe = (req.body.RetainerPaid == 'None') ? req.body.Retainer:'$'+req.body.RetainerPaid;
    let updateQuery = '';
    if(isNaN(req.body.Latitude) || isNaN(req.body.Longitude)) {
        updateQuery = 'UPDATE Projects SET Projectid = \''+ projnum + '\', ProjectTitle = \''+ req.body.ProjectTitle + '\', ProjectMgr = \'' + req.body.ProjectMgr + '\', QA_QCPerson = \'' + req.body.QA_QCPerson + '\', TeamMembers = \''+ req.body.TeamMembers +'\', StartDate = \'' + req.body.StartDate + '\', CloseDate = \''+ req.body.CloseDate +'\', ProjectLoation = \''+ req.body.ProjectLocation +'\', ' +
        'ProjectKeywords = \''+ req.body.ProjectKeywords +'\', SHNOffice = \'' + req.body.SHNOffice + '\', ToatlContract = \'' + req.body.TotalContract + '\', RetainerPaid = \'' + retainMe + '\', ProfileCode = \'' + req.body.ProfileCode + '\', ServiceArea = \''+ req.body.ServiceArea + '\', ContractType = \'' + req.body.ContractType + '\', InvoiceFormat = \'' + req.body.InvoiceFormat + '\', OutsideMarkup = \'' + req.body.OutsideMarkup + '\', SpecialBillingInstructins = \'' + req.body.SpecialBillingInstructins + '\', SEEALSO = \'' + req.body.SEEALSO + '\', Project_Specifications = ' + req.body.Project_Specifications +
        ', AutoCAD_Project = ' + req.body.AutoCAD_Project + ', GIS_Project = ' + req.body.GIS_Project + ', ClientCompany1 = \'' + req.body.ClientCompany1 + '\', OfficeMailingLists1 = \'' + req.body.OfficeMailingLists1 + '\','+
        'ClientAbbrev1 = \'' + req.body.ClientAbbrev1 + '\', ClientContactFirstName1 = \'' + req.body.ClientContactFirstName1 + '\', ClientContactLastName1 = \'' + req.body.ClientContactLastName1 + '\', Title1 = \'' + req.body.Title1 + '\', Address1_1 = \'' + req.body.Address1_1 + '\', Address2_1 = \'' + req.body.Address2_1 + '\', City1 = \'' + req.body.City1 + '\', State1 = \'' + req.body.State1 + '\', Zip1 = \'' + req.body.Zip1 + '\', PhoneW1 = \''+ req.body.PhoneW1 + '\', PhoneH1 = \'' + req.body.PhoneH1 + '\', Cell1 = \'' + req.body.Cell1 + '\', Fax1 = \'' + req.body.Fax1 + '\', Email1 = \'' + req.body.Email1 + '\', '+
        'BinderSize = \'' + req.body.BinderSize + '\', BinderLocation = \'' + req.body.BinderLocation + '\', DescriptionService = \''+  req.body.DescriptionService + '\', DTStamp = \''+ req.body.CreatedOn + '\' WHERE PromoId = \'' + req.body.PromoId + '\'';
        latLongNaN = true;
    }
    else {
        updateQuery = 'UPDATE Projects SET Projectid = \''+ projnum + '\', ProjectTitle = \''+ req.body.ProjectTitle + '\', ProjectMgr = \'' + req.body.ProjectMgr + '\', QA_QCPerson = \'' + req.body.QA_QCPerson + '\', TeamMembers = \''+ req.body.TeamMembers +'\', StartDate = \'' + req.body.StartDate + '\', CloseDate = \''+ req.body.CloseDate +'\', ProjectLoation = \''+ req.body.ProjectLocation +'\', ' +
        'Lattitude = '+ req.body.Latitude +', Longitude = '+ req.body.Longitude +', ProjectKeywords = \''+ req.body.ProjectKeywords +'\', SHNOffice = \'' + req.body.SHNOffice + '\', ToatlContract = \'' + req.body.TotalContract + '\', RetainerPaid = \'' + retainMe + '\', ProfileCode = \'' + req.body.ProfileCode + '\', ContractType = \'' + req.body.ContractType + '\', InvoiceFormat = \'' + req.body.InvoiceFormat + '\', OutsideMarkup = \'' + req.body.OutsideMarkup + '\', SpecialBillingInstructins = \'' + req.body.SpecialBillingInstructins +
        '\', SEEALSO = \'' + req.body.SEEALSO + '\', AutoCAD_Project = ' + req.body.AutoCAD_Project + ', GIS_Project = ' + req.body.GIS_Project + ', Project_Specifications = ' + req.body.Project_Specifications + ', ServiceArea = \''+ req.body.ServiceArea + '\', ClientCompany1 = \'' + req.body.ClientCompany1 + '\', OfficeMailingLists1 = \'' + req.body.OfficeMailingLists1 + '\', '+
        'ClientAbbrev1 = \'' + req.body.ClientAbbrev1 + '\', ClientContactFirstName1 = \'' + req.body.ClientContactFirstName1 + '\', ClientContactLastName1 = \'' + req.body.ClientContactLastName1 + '\', Title1 = \'' + req.body.Title1 + '\', Address1_1 = \'' + req.body.Address1_1 + '\', Address2_1 = \'' + req.body.Address2_1 + '\', City1 = \'' + req.body.City1 + '\', State1 = \'' + req.body.State1 + '\', Zip1 = \'' + req.body.Zip1 + '\', PhoneW1 = \''+ req.body.PhoneW1 + '\', PhoneH1 = \'' + req.body.PhoneH1 + '\', Cell1 = \'' + req.body.Cell1 + '\', Fax1 = \'' + req.body.Fax1 + '\', Email1 = \'' + req.body.Email1 + '\', '+
        'BinderSize = \'' + req.body.BinderSize + '\', BinderLocation = \'' + req.body.BinderLocation + '\', DescriptionService = \''+  req.body.DescriptionService + '\', DTStamp = \''+ req.body.CreatedOn +'\' WHERE PromoId = \'' + req.body.PromoId + '\'';
    }
    // console.log(updateQuery);
    // console.log('Project Number is ' + req.body.ProjectNumber + ', and Description is ' + req.body.Description);
    connection.execute(updateQuery)
    .then(memes => { // memes >:)

        if(!fs.existsSync(dir)) {
            fs.mkdir((dir), err => {
                if(err){
                    throw err;
                }
            });
        }
        createDirectories(dir, true);

        let removeA = projnum;
        if(projnum.length > 6 && projnum[6] == 'A') {
            removeA = projnum.substring(0,6);
        }

            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(dir + '/'+ removeA +'.pdf'));
                
            (async function(){
                // table 
                const table = {
                  title: "Promo to Project",
                  subtitle: "Promo " + req.body.PromoId + " converted to Project " + removeA,
                  headers: ["Name", "User Input", "Client", "Info"],
                  rows: [
                    [ "Project", removeA , "Client Company", removeEscapeQuote(req.body.ClientCompany1)],
                    [ "Title", req.body.ProjectTitle, "Client Abbreviation", (req.body.ClientAbbrev1 == null || req.body.ClientAbbrev1 == undefined || req.body.ClientAbbrev1 == '')?"none":removeEscapeQuote(req.body.ClientAbbrev1)],
                    ["Project Manager", req.body.ProjectMgrName, "Client First Name", removeEscapeQuote(req.body.ClientContactFirstName1)],
                    ["QAQC Person", req.body.QA_QCPersonName, "Client Last Name", removeEscapeQuote(req.body.ClientContactLastName1)],
                    ["Team Members", req.body.TeamMemberNames, "Relationship", req.body.ClientRelation],
                    ["Start Date", formatDate(req.body.StartDate), "Job Title", removeEscapeQuote(req.body.Title1)],
                    ["Close Date", formatDate(req.body.CloseDate), "Address", removeEscapeQuote(req.body.Address1_1)],
                    ["Location", removeEscapeQuote(req.body.ProjectLocation), "2nd Address", removeEscapeQuote(req.body.Address2_1)],
                    ["Latitude", removeEscapeQuote(req.body.Latitude),"City", removeEscapeQuote(req.body.City1)],
                    ["Longitude", removeEscapeQuote(req.body.Longitude), "State", req.body.State1],
                    ["Keywords", req.body.ProjectKeywords, "Zip", req.body.Zip1],
                    ["SHN Office", req.body.SHNOffice, "Work Phone", removeEscapeQuote(req.body.PhoneW1)],
                    ["Service Area", req.body.ServiceArea, "Home Phone", removeEscapeQuote(req.body.PhoneH1)],
                    ["Total Contract", req.body.TotalContract, "Cell Phone", removeEscapeQuote(req.body.Cell1)],
                    ["Service Agreement", req.body.ServiceAgreement, "Fax", removeEscapeQuote(req.body.Fax1)],
                    ["If yes, why?", req.body.Explanation, "Email", removeEscapeQuote(req.body.Email1)],
                    ["Retainer", removeEscapeQuote(retainMe), "Binder Size", req.body.BinderSize],
                    ["Profile Code", req.body.ProfileCode, "Binder Location", req.body.BinderLocation],
                    ["Contract Type", req.body.contactTypeName,'',''],
                    ["Invoice Format", req.body.InvoiceFormat,'',''],
                    ["Client Contract/PO#", req.body.ClientContractPONumber,'',''],
                    ["Outside Markup", (req.body.OutsideMarkup == undefined)?0:req.body.OutsideMarkup,'',''],
                    ["Prevailing Wage", removeEscapeQuote(req.body.PREVAILING_WAGE)],
                    ["Billing Instructions", removeEscapeQuote(req.body.SpecialBillingInstructins),'',''],
                    ["See Also", req.body.SEEALSO],
                    ["AutoCAD", (req.body.AutoCAD_Project == -1)?'Yes':'No','',''],
                    ["GIS Job", (req.body.GIS_Project == -1)?'Yes':'No','',''],
                    ["Project Specifications", (req.body.Project_Specifications == -1)?'Yes':'No','Created on',new Date().toString()],
                    ["Description of Services", removeEscapeQuote(req.body.DescriptionService),'Created By',removeEscapeQuote(req.body.CreatedBy)]
                  ]
                };
                await doc.table(table, {
                    columnsSize: [ 120, 130, 100, 130],
                    padding: 2,
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        (indexColumn == 0 || indexColumn == 2)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
                        const {x, y, width, height} = rectCell;
                        if(indexColumn === 1 && indexRow != table.rows.length - 1) {
                            doc
                            .lineWidth(1)
                            .moveTo(x + width, y)
                            .lineTo(x + width, y + height)
                            .stroke();
                        }
                        if((indexRow === 7 || indexRow === 16 || indexRow === 24) && indexColumn === 0) {
                            doc
                            .lineWidth(2)
                            .moveTo(x, y)
                            .lineTo(x + 250, y)
                            .stroke();
                        }

                        doc.fontSize(10).fillColor('#000000');
                    }
                });
                // await doc.table(descTable, {
                //     columnsSize: [ 100, 390]
                // });
                // done!
                doc.end();

                // Create the directories for Project.
                createDirectories(dir, true);

                // Start of array of who to notify of this creation.
                const admins = jsonData.email.admins;

                let officeAdmins = [];
                // Get cooresponding admin office group to notify of this project creation.
                if(projnum.length > 6) {
                    officeAdmins = getAdmin(projnum[0], projnum[6]);
                }
                else {
                    officeAdmins = getAdmin(projnum[0], 'Z');
                }
                // push results into admins array.
                for(let admin of officeAdmins) {
                    admins.push(admin);
                }
                // Get individual Project manager to notify.
                connection.query('SELECT Email FROM Contacts WHERE ID = '+ req.body.ProjectMgr +' AND Email IS NOT NULL').then(emails => {
                    Object.entries(emails).forEach(email => {
                        if(!admins.includes(email[1].Email + '@shn-engr.com' || email[1].Email != undefined)) {
                            admins.push(email[1].Email + '@shn-engr.com');
                        }
                    });
                    // Finally, send out email notice.
                    // emailPersonel(removeA +'.pdf', dir + '/'+ removeA +'.pdf', 'Project with ID ' + projnum + ' has been initialized!<br>See PDF for more.', admins, 'Project with ID ' + projnum + ' initialized.');
                }).catch(awNo => {
                    console.log('Could not send email.  The following error occurred instead:\n' + awNo);
                });
              })();
        res.send(JSON.parse(JSON.stringify('{"Status":"'+ projnum +'"}')));
    })
    .catch(error => {
        myResponse = error;
        res.send(JSON.stringify(error));
        createTicket(error, "Could not convert Promo to Project:");
    });
})

/**
 * '/info' API used by the advanced search function to return specific results.
 */

app.post('/info', jsonParser, (req, res) => {
    // Connect to database.
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    let keyQuery = '';
    let keyArray = new Array();
    // If keywrods were selected, split keywords into array.
    if(req.body.Keywords != '%') {
        keyArray = req.body.Keywords.split(" || ").filter(e => e !== '');
        for(let word of keyArray) {
            keyQuery += 'Projects.ProjectKeywords LIKE \'%' + word + '%\' AND ';
        }
        keyQuery = keyQuery.substring(0, keyQuery.length - 5);
    }
    else {
        keyQuery = 'Projects.ProjectKeywords LIKE \'%\'';
    }
     // console.log('Project Number is ' + req.body.ProjectNumber + ', Description is ' + req.body.Description + ', Project title is ' + req.body.ProjectTitle);
     // INNER JOIN Contacts ON Contacts.ID = Cint(Projects.ProjectMgr)

     // Execute query.
    connection.query('SELECT Projects.Projectid AS Project, Projects.PromoId AS Promo, Projects.ProjectTitle AS ProjectTitle, Projects.BillGrp AS Billing, Projects.ClientCompany1 AS ClientCompany, Projects.DescriptionService AS Description, Contacts.Last, Contacts.First FROM Projects INNER JOIN Contacts ON (Val(Projects.ProjectMgr) = Contacts.ID) WHERE (Projects.Projectid LIKE \''+ req.body.ProjectNumber +'\' OR Projects.PromoId LIKE \''+ req.body.ProjectNumber +'\') AND ' + keyQuery + ' AND Projects.DescriptionService LIKE \''+ req.body.Description +'\' AND Projects.ProjectTitle LIKE \'' + req.body.ProjectTitle + '\' ORDER BY Projects.Projectid')
    .then(data => {
        // console.log(req.ip);
        res.send(JSON.stringify(data)); // Send back results.
    })
    .catch(error => {
        res.send(JSON.stringify(error)); // send back error if an error occurs.
    });
})

/**
 * General search API to search multiple fields from single input entry.
 * This is the most commonly used API by SHNers.
 */

app.post('/search', jsonParser, (req, res) => {
    // Connect to database.
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
     // console.log('Project Number is ' + req.body.ProjectNumber + ', Description is ' + req.body.Description + ', Project title is ' + req.body.ProjectTitle);
     // INNER JOIN Contacts ON Contacts.ID = Cint(Projects.ProjectMgr)

     // Query the results.
     connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE Projects.Projectid LIKE \'%'+ req.body.entry +
    '%\' OR Projects.PromoId LIKE \'%'+ req.body.entry +'%\' OR Projects.ProjectMgr = (SELECT TOP 1 Contacts.ID FROM Contacts WHERE Contacts.Last LIKE \'%'+ req.body.entry +'%\' OR Contacts.First LIKE \'%'+ req.body.entry +'%\') OR Projects.ProjectLoation LIKE \'%'+ req.body.entry +
    '%\' OR Projects.ProjectKeywords LIKE \'%'+ req.body.entry +'%\' OR Projects.ClientCompany1 LIKE \'%'+ req.body.entry +'%\' OR Projects.ClientContact1 LIKE \'%'+ req.body.entry +
    '%\' OR Projects.ClientContactFirstName1 LIKE \'%'+ req.body.entry +'%\' OR Projects.ClientContactLastName1 LIKE \'%'+ req.body.entry +
    '%\' OR Projects.ProfileCode LIKE \'%'+ req.body.entry +'%\' OR Projects.DescriptionService LIKE \'%'+ req.body.entry +
    '%\' ORDER BY ISNULL(Projects.Projectid), Projects.PromoId, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService')
    .then(data => {
        data = JSON.stringify(data); // send back results.
        res.send(data);
    })
    /**
     * If an error occurs, try the second method below.
     * The above query sometimes errors because of the 'INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID'.
     * The below queries will instead query both tables separately.
     */
    .catch(error => {
        // Query contacts first.
        connection.query('SELECT ID, First, Last From Contacts').then(contacts => {
            let contactMap = new Map();
            // Map ID to employee names for ease of access.
            for(let contact of contacts) {
                contactMap.set(contact.ID.toString(), contact.First.trim() + ';' + contact.Last.trim());
            }
            // Query Project database.
            connection.query('SELECT Projectid, PromoId, ProjectMgr, ProjectTitle, BillGrp, BillingTitle, ClientCompany1, DescriptionService FROM Projects WHERE Projectid LIKE \'%'+ req.body.entry +'%\' OR ProjectLoation LIKE \'%'+ req.body.entry +
            '%\' OR PromoId LIKE \'%'+ req.body.entry +'%\' OR ProjectKeywords LIKE \'%'+ req.body.entry +
            '%\' OR ClientCompany1 LIKE \'%'+ req.body.entry +'%\' OR ClientContact1 LIKE \'%'+ req.body.entry + '%\' OR ClientContactFirstName1 LIKE \'%'+ req.body.entry +
            '%\' OR ClientContactLastName1 LIKE \'%'+ req.body.entry +'%\' OR ProfileCode LIKE \'%'+ req.body.entry +'%\' OR DescriptionService LIKE \'%'+ req.body.entry +
            '%\' ORDER BY ISNULL(Projectid), PromoId, BillGrp, ClientCompany1, DescriptionService').then(projData => {
                // Associate Project Manager name to cooresponding project.
                for(let entry of projData) {
                    let temp = (contactMap.get(entry.ProjectMgr) == undefined) ? undefined:contactMap.get(entry.ProjectMgr).split(';');
                    if(temp != undefined && temp != null) {
                        entry["First"] = temp[0];
                        entry["Last"] = temp[1];
                    }
                    else {
                        entry["First"] = "Unknown";
                        entry["Last"] = "Unknown";
                    }
                }
                // Send back results.
                res.send(JSON.stringify(projData));
            })
            // if erro, send back error.
        }).catch(err => res.send(JSON.stringify(err)));
    });
})

// Searches for projects to add a billing group to.

app.post('/billMe', jsonParser, (req, res) => {
    let myResponse = 'No Projects Found';
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // console.log('Project Number is ' + req.body.ProjectNumber + ', and Description is ' + req.body.Description);
    connection.query('SELECT Projects.*, Contacts.First AS [First], Contacts.Last AS [Last] FROM Projects, Contacts WHERE Projects.Projectid = \''+ req.body.ProjectNumber +'\' AND Cint(Projects.ProjectMgr) = Contacts.ID')
    .then(data => {
        myResponse = data;
        res.send(JSON.stringify(data));
    })
    .catch(error => {
        myResponse = error;
        res.send(JSON.stringify(error));
    });
})

/**
 * Get Project Team members by ID for auto-selecting previously selected team members.
 * In the Projects database, the team members are often saved as a list of their IDs separated by commas (,).
 * Example: "21,666,69,420,"
 */

app.post('/mgrs', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    let teamArr = req.body.Team;
    if(teamArr[teamArr.length - 1] == ',') { // Remove ending comma, so we don't accidently query the entire Contacts database.
        teamArr = teamArr.substring(0, teamArr.length - 1);
    }
    teamArr = teamArr.split(',');
    let orStatement = '';
    for(let mem of teamArr) { // Build conditions for WHERE clause.
        orStatement += 'ID = '+ mem +' OR ';
    }
    orStatement = orStatement.substring(0,orStatement.length - 4);
    // Execute query.
    connection.query('SELECT Last, First, ID FROM Contacts WHERE ' + orStatement).then(mgr => {
        connection.query('SELECT Last AS QAQCLast, First AS QAQCFirst FROM Contacts WHERE ID = ' + req.body.QAQC).then(pers => {
            mgr.push(pers[0]);
            res.send(JSON.parse(JSON.stringify(mgr)));
        }).catch(err => {
            res.send(JSON.parse(JSON.stringify(err)));
        });
        // Return results.
    }).catch(error => {
        // send error if error occurs.
        createTicket(error, "Could not return manager names by ID:");
        res.send(JSON.parse(JSON.stringify(error)));
    });
})

/**
 * API used to create the billing group for a selected project.
 * The way billing groups are inserted into the database is it creates a duplicate row entry of the original project,
 * but it inserts the user's entered data and adds billing group specific information.
 * This is achieved by querying the first matching project in the database, change the returned JSON values,
 * and insert into the database as a new entry.
 */

app.post('/submitBill', jsonParser, (req, res) => {
    // Connect to database.
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // Get first occurring Project entry for cooresponding project.
    connection.query('SELECT TOP 1 * FROM Projects WHERE Projectid = \'' + req.body.ProjectId + '\'')
    .then(data => {
        // Update the returned JSON's data with the user's new data.
        let retainMe = (req.body.RetainerPaid == 'None') ? req.body.Retainer:'$'+req.body.RetainerPaid;
        connection.query('SELECT TOP 1 MAX(Id) AS Id FROM Projects').then(bigNum => {
            data[0].Id = Number(bigNum[0].Id + 1);
            data[0].BillGrp = req.body.BillingNum;
            data[0].BillingTitle = req.body.BillingName;
            data[0].ProjectMgr = req.body.NewMgr;
            data[0].QA_QCPerson = req.body.QAQC;
            data[0].TeamMembers = req.body.TeamMembers;
            data[0].StartDate = req.body.StartDate;
            data[0].CloseDate = req.body.CloseDate;
            data[0].ProjectLoation = req.body.ProjectLocation;
            data[0].ContractType = req.body.ContractType;
            // data[0].Lattitude = req.body.Latitude;
            // data[0].Longitude = req.body.Longitude;
            data[0].ProjectKeywords = req.body.ProjectKeywords;
            data[0].ServiceArea = req.body.ServiceArea;
            data[0].ToatlContract = req.body.TotalContract;
            data[0].RetainerPaid = retainMe;
            data[0].InvoiceFormat = req.body.InvoiceFormat;
            // data[0].ClientContractPONumber = req.body.ClientContractPONumber;
            data[0].PREVAILING_WAGE = req.body.PREVAILING_WAGE;
            data[0].SpecialBillingInstructins = req.body.SpecialBillingInstructins;
            data[0].AutoCAD_Project = req.body.AutoCAD_Project;
            data[0].GIS_Project = req.body.GIS_Project;
            data[0].BinderSize = req.body.BinderSize;
            data[0].DescriptionService = req.body.DescriptionService;
            data[0].DTStamp = req.body.CreatedOn;

            // If latitude and longitude are valid database numbers, insert them.
            if(!isNaN(req.body.Latitude) && !isNaN(req.body.Longitude)) {
                data[0].Lattitude = req.body.Latitude;
                data[0].Longitude = req.body.Longitude;
            }
            // Build and format query for values section of the SQL.
            let dataquery = '';
            for(var value of Object.values(data[0])) {
                if(typeof value == "string") {
                    dataquery += '\'' + format(value) + '\', ';
                }
                else {
                    dataquery += value + ', ';
                }
            }
            // Redact ", " from end of query string.
            dataquery = dataquery.substring(0, dataquery.length - 2);
            // Execute query.
            connection.execute('INSERT INTO Projects VALUES (' + dataquery + ')').then(none => {
                // Build directory path.
                let dir = PATH + getDir(req.body.ProjectId[0]) + '/20' + req.body.ProjectId[1] + req.body.ProjectId[2]; // + '/' + req.body.ProjectId + '-' + removeSpace(data[0].ProjectTitle) + '/';
                let ArcataOffice = false;
                let ArcDir = '';
                let projFolder = req.body.ProjectId;
                // if(!fs.existsSync(dir)) { // If it's a project before the year 2000.
                //     dir = getDir(req.body.ProjectId[0]) + '/19' + req.body.ProjectId[1] + req.body.ProjectId[2];
                // }
                // < 23 because beginning of 2023 is when this new system started.
                // In which case, we should also find the project under the Arcata folder.
                if(Number(req.body.ProjectId[1] + req.body.ProjectId[2]) < 23 && Number(req.body.ProjectId[1] + req.body.ProjectId[2]) >= 16 && req.body.ProjectId[0] == 0) {
                    ArcDir = '/Arcata/20' + req.body.ProjectId[1] + req.body.ProjectId[2];
                    let dirFiles = fs.readdirSync(ArcDir);
                    dirFiles.forEach(file => {
                        if(file.substring(0,6).includes(projFolder)) {
                            ArcataOffice = true;
                            ArcDir += '/' + file;
                        }
                    });
                    if(fs.existsSync(ArcDir)) {
                        ArcDir += '/' + req.body.BillingNum + '-' + removeSpace(removeEscapeQuote(req.body.BillingName));
                        if(!fs.existsSync(ArcDir)) {
                            fs.mkdir((ArcDir), err => {
                                if(err){
                                    throw err;
                                }
                            });
                        }
                    }
                }
                // Redact A for matching a project file.
                let dirFiles = fs.readdirSync(dir);
                if(req.body.ProjectId.length > 6 && req.body.ProjectId[6] == 'A') {
                    projFolder = req.body.ProjectId.substring(0, req.body.ProjectId.length - 1);
                }
                // Append filename to the directory if found.
                let found = false;
                dirFiles.forEach(file => {
                    if(file.substring(0,6).includes(projFolder) && !found) {
                        dir += '/' + file;
                        found = true;
                    }
                });
                // Create the billing group folder.
                if(fs.existsSync(dir)) {
                    dir += '/' + req.body.BillingNum + '-' + removeSpace(removeEscapeQuote(req.body.BillingName));
                    if(!fs.existsSync(dir)) {
                        fs.mkdir((dir), err => {
                            if(err){
                                throw err;
                            }
                        });
                    }
                    
                    // Insert into Arcata version of directory if needed.
                    if(ArcataOffice && ArcDir.trim() != '') {
                        console.log("Arcata is " + ArcDir);
                        createDirectories(ArcDir, false);
                    }
                    else {
                        // Insert the needed directories in the folder.
                        console.log("Directory is " + dir);
                        createDirectories(dir, false);
                    }
                    // Get The project manager name.
                    connection.query('SELECT First, Last FROM Contacts WHERE ID = ' + data[0].ProjectMgr).then(manager => {

                        // Begin creating the new PDF.
                        const doc = new PDFDocument();
                        doc.pipe(fs.createWriteStream(dir + '/'+ req.body.BillingNum +'.pdf'));
                        // Content of PDF.
                        (async function(){
                            // table 
                            const table = {
                            title: req.body.ProjectId,
                            subtitle: 'Billing group ' + req.body.BillingNum + ' created for ' + req.body.ProjectId,
                            headers: ["Billing", "Input", "Project", "Info"],
                            rows: [
                                [ "Billing Group #", req.body.BillingNum, "Project ID", req.body.ProjectId],
                                [ "Billing Title", req.body.BillingName, "Project Title", removeEscapeQuote(req.body.ProjectName)],
                                ['Group Manager', req.body.NewMgrName, "Project Manager", manager[0].Last + ", " + manager[0].First],
                                ["Start Date", formatDate(req.body.StartDate),'',''],
                                ["Close Date", formatDate(req.body.CloseDate),'',''],
                                ["QAQC Person", req.body.QAQCName,'',''],
                                ["Team Members", req.body.TeamMemberNames,'',''],
                                ["Location", removeEscapeQuote(req.body.ProjectLocation),'',''],
                                ["Latitude", removeEscapeQuote(req.body.Latitude),'',''],
                                ["Longitude", removeEscapeQuote(req.body.Longitude),'',''],
                                ["Keywords", req.body.ProjectKeywords,'',''],
                                ["Service Area", removeEscapeQuote(req.body.ServiceArea),'',''],
                                ["Profile Code", req.body.ProfileCode,'',''],
                                ["Total Contract", removeEscapeQuote(req.body.TotalContract),'',''],
                                ["Retainer", removeEscapeQuote(retainMe),'',''],
                                ["Contract Type",req.body.contactTypeName,'',''],
                                ["Client Contract/PO #", req.body.ClientContractPONumber,'',''],
                                ["Outside Markup", req.body.OutsideMarkup,'',''],
                                ["Prevailing Wage", removeEscapeQuote(req.body.PREVAILING_WAGE),'',''],
                                ["Billing Instructions", req.body.SpecialBillingInstructins,'',''],
                                ["AutoCAD Project", (req.body.AutoCAD_Project == -1)?'Yes':'No','',''],
                                ["GIS Project", (req.body.GIS_Project == -1)?'Yes':'No','',''],
                                ["Binder Size", req.body.BinderSize,'Created On',new Date().toString()],
                                ["Description of Services", removeEscapeQuote(req.body.DescriptionService),'Created By',removeEscapeQuote(req.body.CreatedBy)]
                            ]
                            };
                            // A4 595.28 x 841.89 (portrait) (about width sizes)
                            // width
                            // await doc.table(table, { 
                            //   width: 400
                            // });
                            // or columnsSize
                            await doc.table(table, {
                                columnsSize: [ 120, 130, 100, 130],
                                padding: 2,
                                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                                    (indexColumn == 0 || indexColumn == 2)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
                                    const {x, y, width, height} = rectCell;
                                    // first line 
                                    // if(indexColumn === 0){
                                    //     doc
                                    //     .lineWidth(.5)
                                    //     .moveTo(x, y)
                                    //     .lineTo(x, y + height)
                                    //     .stroke();  
                                    // }
                                    // else
                                    if(indexColumn === 1) {
                                        doc
                                        .lineWidth(.5)
                                        .moveTo(x + width, y)
                                        .lineTo(x + width, y + height)
                                        .stroke();
                                    }

                                    doc.fontSize(10).fillColor('#000000');
                                }
                            });
                            // done!
                            doc.end();
                            // Add same PDF to Arcata version of project if needed.
                            if(ArcataOffice && ArcDir.trim() != '') {
                                doc.pipe(fs.createWriteStream(ArcDir + '/'+ req.body.BillingNum +'.pdf'));
                                await doc.table(table, {
                                    columnsSize: [ 100, 150, 90, 150]
                                });
                                // done!
                                doc.end();
                            }
                            
                            // reateDirectories(dir, true);

                            // Array admin contacts for who to notify.
                            const admins = jsonData.email.admins;

                            // Get office of the associated project.
                            let officeAdmins = [];
                            if(req.body.ProjectId[0].length > 6) {
                                officeAdmins = getAdmin(req.body.ProjectId[0], req.body.ProjectId[6]);
                            }
                            else {
                                officeAdmins = getAdmin(req.body.ProjectId[0], 'Z');
                            }
                            // Push office email group into admins.
                            for(let admin of officeAdmins) {
                                admins.push(admin);
                            }
                            // Query for the Project manager's contact email.
                            connection.query('SELECT Contacts.Email AS Email FROM Projects, Contacts WHERE Projects.Projectid = \''+ req.body.ProjectId +'\' AND Projects.BillGrp IS NULL AND Contacts.ID = Cint(Projects.ProjectMgr) AND Contacts.Email IS NOT NULL').then(emails => {
                                Object.entries(emails).forEach(email => {
                                    if(!admins.includes(email[1].Email + '@shn-engr.com') || email[1].Email != undefined) {
                                        admins.push(email[1].Email + '@shn-engr.com');
                                    }
                                });
                                
                                // Finally, send email.
                                // emailPersonel(req.body.BillingNum +'.pdf', dir + '/'+ req.body.BillingNum +'.pdf', 'Billing Group ID ' + req.body.BillingNum + ' called '+ req.body.BillingName +' was added to Project ID ' + req.body.ProjectId + '!<br>See PDF for more.', admins, 'Billing group ' + req.body.BillingNum + ' added to project ' + req.body.ProjectId);
                            }).catch(awNo => { // Print error if email cannot send.
                                console.log('Could not send email.  The following error occurred instead:\n' + awNo);
                            });
                        })();
                    }).catch(poop => { // Might error due to not finding a manager with the cooresponding ID.
                        console.log("Could not find manager with ID " + data[0].ProjectMgr);
                        console.log(poop); // Print error.
                        // Attempt to create the PDF again, but this time the Project Manager part says "See Project for more info."
                        const doc = new PDFDocument();
                        doc.pipe(fs.createWriteStream(dir + '/'+ req.body.BillingNum +'.pdf'));
                        (async function(){
                            // table 
                            const table = {
                            title: req.body.ProjectId,
                            subtitle: 'Billing group ' + req.body.BillingNum + ' created for ' + req.body.ProjectId,
                            headers: ["Billing", "Input", "Project", "Info"],
                            rows: [
                                [ "Billing Group #", req.body.BillingNum, "Project ID", req.body.ProjectId],
                                [ "Billing Title", req.body.BillingName, "Project Title", removeEscapeQuote(req.body.ProjectName)],
                                ['Group Manager', req.body.NewMgrName, "Project Manager", "See project initiation for more info."],
                                ["Start Date", formatDate(req.body.StartDate),'',''],
                                ["Close Date", formatDate(req.body.CloseDate),'',''],
                                ["QAQC Person", req.body.QAQCName,'',''],
                                ["Team Members", req.body.TeamMemberNames,'',''],
                                ["Location", removeEscapeQuote(req.body.ProjectLocation),'',''],
                                ["Latitude", removeEscapeQuote(req.body.Latitude),'',''],
                                ["Longitude", removeEscapeQuote(req.body.Longitude),'',''],
                                ["Keywords", req.body.ProjectKeywords,'',''],
                                ["Service Area", removeEscapeQuote(req.body.ServiceArea),'',''],
                                ["Profile Code", req.body.ProfileCode,'',''],
                                ["Total Contract", removeEscapeQuote(req.body.TotalContract),'',''],
                                ["Retainer", removeEscapeQuote(retainMe),'',''],
                                ["Contract Type",req.body.contactTypeName,'',''],
                                ["Client Contract/PO #", req.body.ClientContractPONumber,'',''],
                                ["Outside Markup", req.body.OutsideMarkup,'',''],
                                ["Prevailing Wage", removeEscapeQuote(req.body.PREVAILING_WAGE),'',''],
                                ["Billing Instructions", req.body.SpecialBillingInstructins,'',''],
                                ["AutoCAD Project", (req.body.AutoCAD_Project == -1)?'Yes':'No','',''],
                                ["GIS Project", (req.body.GIS_Project == -1)?'Yes':'No','',''],
                                ["Binder Size", req.body.BinderSize,'Created On',new Date().toString()],
                                ["Description of Services", removeEscapeQuote(req.body.DescriptionService),'Created By',removeEscapeQuote(req.body.CreatedBy)]
                            ]
                            };
                            // A4 595.28 x 841.89 (portrait) (about width sizes)
                            // width
                            // await doc.table(table, { 
                            //   width: 400
                            // });
                            // or columnsSize
                            await doc.table(table, {
                                columnsSize: [ 100, 150, 90, 150],
                                padding: 2,
                                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                                    (indexColumn == 0 || indexColumn == 2)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
                                    const {x, y, width, height} = rectCell;
                                    // first line 
                                    // if(indexColumn === 0){
                                    //     doc
                                    //     .lineWidth(.5)
                                    //     .moveTo(x, y)
                                    //     .lineTo(x, y + height)
                                    //     .stroke();  
                                    // }
                                    // else
                                    if(indexColumn === 1) {
                                        doc
                                        .lineWidth(.5)
                                        .moveTo(x + width, y)
                                        .lineTo(x + width, y + height)
                                        .stroke();
                                    }

                                    doc.fontSize(10).fillColor('#000000');
                                }
                            });
                            // done!
                            doc.end();
                            if(ArcataOffice && ArcDir.trim() != '') {
                                doc.pipe(fs.createWriteStream(ArcDir + '/'+ req.body.BillingNum +'.pdf'));
                                await doc.table(table, {
                                    columnsSize: [ 100, 150, 90, 150],
                                    padding: 2,
                                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                                        (indexColumn == 0 || indexColumn == 2)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
                                        doc.addBackground(rectRow, (indexRow % 2 ? '#555555' : '#60A13F'), 0.15);
                                        const {x, y, width, height} = rectCell;
                                        // first line 
                                        // if(indexColumn === 0){
                                        //     doc
                                        //     .lineWidth(.5)
                                        //     .moveTo(x, y)
                                        //     .lineTo(x, y + height)
                                        //     .stroke();  
                                        // }
                                        // else
                                        if(indexColumn === 1) {
                                            doc
                                            .lineWidth(.5)
                                            .moveTo(x + width, y)
                                            .lineTo(x + width, y + height)
                                            .stroke();
                                        }

                                        doc.fontSize(10).fillColor('#000000');
                                    }
                                });
                                // done!
                                doc.end();
                            }
                            
                            // createDirectories(dir, true);

                            const admins = jsonData.email.admins;

                            let officeAdmins = [];
                            if(req.body.ProjectId[0].length > 6) {
                                officeAdmins = getAdmin(req.body.ProjectId[0], req.body.ProjectId[6]);
                            }
                            else {
                                officeAdmins = getAdmin(req.body.ProjectId[0], 'Z');
                            }
                            for(let admin of officeAdmins) {
                                admins.push(admin);
                            }
                            connection.query('SELECT Contacts.Email AS Email FROM Projects, Contacts WHERE Projects.Projectid = \''+ req.body.ProjectId +'\' AND Projects.BillGrp IS NULL AND Contacts.ID = Cint(Projects.ProjectMgr) AND Contacts.Email IS NOT NULL').then(emails => {
                                Object.entries(emails).forEach(email => {
                                    if(!admins.includes(email[1].Email + '@shn-engr.com') || email[1].Email != undefined) {
                                        admins.push(email[1].Email + '@shn-engr.com');
                                    }
                                });
                                // console.log(admins);
                                // emailPersonel(req.body.BillingNum +'.pdf', dir + '/'+ req.body.BillingNum +'.pdf', 'Billing Group ID ' + req.body.BillingNum + ' called '+ req.body.BillingName +' was added to Project ID ' + req.body.ProjectId + '!<br>See PDF for more.', admins, 'Billing group ' + req.body.BillingNum + ' added to project ' + req.body.ProjectId);
                            }).catch(awNo => {
                                console.log('Could not send email.  The following error occurred instead:\n' + awNo);
                            });
                        })();
                    });
                }
                else {
                    console.log('Failed to find directory.');
                    createTicket(error, "Cannot find directory " + dir + ":");
                }
                res.send(JSON.parse(JSON.stringify('{"Status":"Success"}')));
            });
        });
    })
    .catch(error => {
        res.send(JSON.parse(JSON.stringify(error)));
        createTicket(error, "Billing group failed:");
    });
})

/**
 * searchPromos API searches promos and is used by the search function for Promo To Project.
 */

app.post('/searchPromos', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT * FROM Projects INNER JOIN Contacts ON Contacts.ID = Cint(Projects.ProjectMgr) WHERE PromoId = \''+ req.body.PromoId + '\' AND Projectid IS NULL').then(data => {
        res.send(JSON.parse(JSON.stringify(data)));
    }).catch(error => {
        res.send(JSON.parse(JSON.stringify(error)));
    });
})

/**
 * rolodex API used to find client information on the rolodex page.
 */

app.post('/rolodex', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // Starting of query.
    let query = 'SELECT Projectid, PromoId, ClientCompany1, ClientContactFirstName1, ClientContactLastName1, Title1, OfficeMailingLists1, Address1_1, Address2_1, City1, State1, Zip1, PhoneW1, PhoneH1, Cell1, Email1, Fax1, DTStamp FROM Projects WHERE ';
    if(req.body.by == 'Job') {
        query += 'Title1 LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'First') {
        query += 'ClientContactFirstName1 LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Last') {
        query += 'ClientContactLastName1 LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Comp') {
        query += 'ClientCompany1 LIKE \'%'+ req.body.search +'%\'';
    }
    else { // Default "All."
        query += 'ClientCompany1 LIKE \'%'+ req.body.search +'%\' OR ClientContactFirstName1 LIKE \'%'+ req.body.search +'%\' OR ClientContactLastName1 LIKE \'%'+ req.body.search +'%\' OR Title1 LIKE \'%'+ req.body.search +'%\'';
    }
    connection.query(query + ' ORDER BY ClientContactLastName1, ClientContactFirstName1, ClientCompany1, Projectid, PromoId').then(data => {
        res.send(JSON.parse(JSON.stringify(data)));
    }).catch(error => {
        res.send(JSON.parse(JSON.stringify(error)));
    });
})

/**
 * Updates client info based on user input on the Rolodex page.
 */

app.post('/contacts', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    let sql = 'UPDATE Projects SET ClientCompany1 = \''+ req.body.ClientCompany1 +'\', ClientContactFirstName1 = \''+ req.body.ClientContactFirstName1 + 
    '\', ClientContactLastName1 = \'' + req.body.ClientContactLastName1 + '\', Title1 = \''+req.body.Title1 +
    '\', OfficeMailingLists1 = \''+ req.body.OfficeMailingLists1 +'\', Address1_1 = \'' + req.body.Address1_1 + '\', Address2_1 = \'' + req.body.Address2_1 + '\', City1 = \'' + req.body.City1 +
    '\', State1 = \'' + req.body.State1 + '\', Zip1 = \'' + req.body.Zip1 + '\', PhoneW1 = \'' + req.body.PhoneW1 +
    '\', PhoneH1 = \'' + req.body.PhoneH1 + '\', Cell1 = \''+ req.body.Cell1 + '\', Fax1 = \'' + req.body.Fax1 + '\', Email1 = \'' + req.body.Email1 + '\'';
    sql += ' WHERE Projectid = \''+ req.body.Id + '\' OR PromoId = \'' + req.body.Id + '\'';
    connection.execute(sql).then(() => {
        res.send(JSON.parse(JSON.stringify('{"Status":"Success"}')));
    }).catch(err => {
        console.log(err);
        createTicket(err, "Cannot update contacts in Rolodex:");
        res.send(JSON.parse(JSON.stringify(err)));
    });
})

/**
 * Previous requests from Justin Sousa at SHN to build a program to query coordinate data from the database.
 * To achieve these requests, I had to build an API for each version of the program.
 */

// API for Justin's program.
app.post('/peowihfds', jsonParser, (req, res) => {
    // console.log(req.body);
    let query = 'SELECT Id, Projectid, BillGrp, Lattitude, Longitude FROM Projects WHERE Id > ' + req.body.ID;
    if(isNaN(req.body.ID) || req.body.ID == '') {
        query = 'SELECT Id, Projectid, BillGrp, Lattitude, Longitude FROM Projects WHERE Id > (SELECT MAX(Id) - 20 FROM Projects)';
    }
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query(query).then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        res.send(JSON.stringify(error));
    });
})

// API for Justin's program.
app.post('/mapMe', jsonParser, (req, res) => {
    // console.log(req.body);
    let query = 'SELECT Projects.Id AS dataID, Projects.Projectid AS ProjID, Projects.BillGrp AS BillingNum, Projects.Lattitude AS Latty, Projects.Longitude AS Longy, Projects.ProjectLoation AS Location, Projects.ClientCompany1 AS Company, Projects.ProjectTitle AS Title, Contacts.First AS FirstName, Contacts.Last AS LastName FROM Projects, Contacts WHERE StrComp(Projects.ProjectMgr, Contacts.ID) = 0 AND Projects.Id > ' + req.body.ID;
    if(isNaN(req.body.ID) || req.body.ID == '') {
        query = 'SELECT Projects.Id AS dataID, Projects.Projectid AS ProjID, Projects.BillGrp AS BillingNum, Projects.Lattitude AS Latty, Projects.Longitude AS Longy, Projects.ProjectLoation AS Location, Projects.ClientCompany1 AS Company, Projects.ProjectTitle AS Title, Contacts.First AS FirstName, Contacts.Last AS LastName FROM Projects, Contacts WHERE StrComp(Projects.ProjectMgr, Contacts.ID) = 0';
    }
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query(query).then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        res.send(JSON.stringify(error));
    })
})

// API for Justin's program.
app.post('/coordyUpdatey', jsonParser, (req, res) => {
    // console.log(req.body);
    let query = 'UPDATE Projects SET Lattitude = '+ req.body.Lat +', Longitude = '+ req.body.Long +' WHERE Id = ' + req.body.ID;
    if(isNaN(req.body.ID) || req.body.ID == '' || req.body.Lat > 90 || req.body.Lat < -90 || req.body.Long > 180 || req.body.Long < -180) {
        query = 'UPDATE Projects SET Lattitude = '+ req.body.Lat +', Longitude = '+ req.body.Long +' WHERE Id = -1';
    }
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.execute(query).then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        res.send(JSON.stringify(error));
    });
})

/**
 * Helper functions used by the APIs.
 */

/**
 * 
 * @param {String} myString 
 * @returns Formatted string with escapes.
 */
function format(myString) {

    let i = 0;

    while(i < myString.length) {
        if(myString[i] == '\\' || myString[i] == '\"') {
            myString = myString.substring(0, i) + '\\' + myString.substring(i);
            i++;
        }
        else if(myString[i] == '\'') {
            myString = myString.substring(0, i) + '\'' + myString.substring(i);
            i++;
        }
        i++;
    }

    return myString;
}

/**
 * 
 * @param {String} datey 
 * @returns Formatted Datestring in the format MM/DD/YYYY.
 */
function formatDate(datey) {
    let userDate = new Date(datey)
    userDate = ((userDate.getMonth() + 1) + '/' + userDate.getDate() + '/' + userDate.getFullYear()).toString();
    return userDate;
}

/**
 * removeEscapeQuote() removes the two single quotes ('') for proper display in the PDF document.
 * The reason the form formats single quotes to print twice is because that's how MS SQL escapes from it, instead of using backslash (\).
 * Without an escape from ', MS SQL rejects the query.
 */

function removeEscapeQuote(SQLFormat) {

    let i = 0;

    SQLFormat = String(SQLFormat);

    while(i < SQLFormat.length) {
        if(SQLFormat[i] == '\'' && i + 1 < SQLFormat.length && SQLFormat[i + 1] == '\'') {
            SQLFormat = SQLFormat.substring(0, i) + SQLFormat.substring(i + 1);
        }
        i++;
    }

    return SQLFormat;
}

/**
 * createDirectories(root) creates the needed directories for each project initialization.
 * Parameter "root" is the single folder where all the directories will live.
 */

function createDirectories(root, gis) {
    // All directories needed.
    const dir = ['Corr', 'Data/MatLab', 'Data/RefDocs', 'Data/SafetyMeetingForms', 'Dwgs/BY-OTHERS', 'Dwgs/PDF-DWF', 'Dwgs/RECORD-DRAWINGS', 'Figs', 'Inv', 'Photos', 'Promos', 'PUBS/agr', 'PUBS/Corr', 'PUBS/data', 'PUBS/inv', 'PUBS/promos', 'PUBS/rpts', 'Rpts', 'Setup'];
    // Typically it's only the billing group that shouldn't have GIS folders.  In which case, gis must be set to true.
    if(gis) {
        let gisDirs = ['GIS/Data', 'GIS/drafts', 'GIS/InOut', 'GIS/ProProject', 'GIS/Project Info'];
        gisDirs.forEach(dirs => {
            dir.push(dirs);
        });
    }
    let PUBS = false;
    // Create each directory.
    for(let direct = 0; direct < dir.length; direct++) {
        fs.mkdir((root + '/' + dir[direct]), {recursive: true}, err => {
            if(err){
                console.log('Could not make directory ' + dir[direct] + '\n' + err);
            }
            // Sets Windows permissions for the PUBS folder when created.
            else if(fs.existsSync(root + '/PUBS') && !PUBS) {
                let folderPath = '.\\' + root.replace(/\//g,"\\") + '\\PUBS';
                let accessString = 'GA';
                let permissions = new winPermissionsManager({folderPath});
                let domain = 'SHN-ENGR';
                let name = 'Domain Users';
                accessString = 'GR';
                permissions.addRight({domain, name, accessString});
                accessString = 'X';
                permissions.addRight({domain, name, accessString});
                name = 'Administrator';
                accessString = 'GA';
                permissions.addRight({domain, name, accessString});
                name = 'Marketing';
                accessString = 'RC';
                permissions.addRight({domain, name, accessString});
                accessString = 'GR';
                permissions.addRight({domain, name, accessString});
                accessString = 'GE';
                permissions.addRight({domain, name, accessString});
                accessString = 'GW';
                permissions.addRight({domain, name, accessString});
                accessString = 'RD';
                permissions.addRight({domain, name, accessString});
                accessString = 'WD';
                permissions.addRight({domain, name, accessString});
                accessString = 'AD';
                permissions.addRight({domain, name, accessString});
                accessString = 'REA';
                permissions.addRight({domain, name, accessString});
                accessString = 'X';
                permissions.addRight({domain, name, accessString});
                accessString = 'RA';
                permissions.addRight({domain, name, accessString});
                accessString = 'WA';
                permissions.addRight({domain, name, accessString});
                name = 'Admin Staff';
                accessString = 'GA';
                permissions.addRight({domain, name, accessString});
                permissions.applyRights({disableInheritance:true});
                PUBS = true;
            }
        });
    }
}

/**
 * emailPersonel(pdfName, pathway, message, mailList, subjectLine) generates email
 * and sends a PDF from hosting email address to the users on mailList.
 */

function emailPersonel(pdfName, pathway, message, mailList, subjectLine) {
    const transport = nodemailer.createTransport({
        host: 'smtp.office365.com',
        secure: false,
        auth: {
            user: jsonData.email.user,
            pass: jsonData.email.password
        },
        tls: {
            ciphers:'SSLv3',
            rejectUnauthorized: false
        }
    });
 
    const mailOptions = { // Change values for SHN's system.
        from: '"Initiation TEST" <'+jsonData.email.user+'>',
        to: mailList,
        subject: subjectLine,
        html: '<p>'+ message +'</p>',
        attachments: [{
            filename: pdfName,
            path: pathway,
            contentType: 'application/pdf'
        }]
    };
    transport.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function getAdmin(office, isArcata) {
    if(office == 0 && isArcata == 'A') {
        return jsonData.email.ArcataAdmin;
    }
    else if(office == 2) {
        return jsonData.email.KFallsAdmin;
    }
    else if(office == 4 || office == 7) {
        return jsonData.email.WillitsAdmin;
    }
    else if(office == 5) {
        return jsonData.email.ReddingAdmin;
    }
    else if(office == 6){
        return jsonData.email.CoosbayAdmin;
    }
    
    return jsonData.email.ArcataAdmin;
}

/**
 * Gets the office directory by ID.
 * @param {number} id 
 * @returns Office Directory of type String.
 */
function getDir(id) {
    if(id == 0) {
        return '/Eureka';
    }
    else if(id == 1) {
        return '/Arcata';
    }
    else if(id == 2) {
        return '/KFalls';
    }
    else if(id == 4 || id == 7) {
        return '/Willits';
    }
    else if(id == 5) {
        return '/Redding';
    }
    else if(id == 6) {
        return '/Coosbay';
    }

    return '/Eureka';
}

function TextFile(file) {
    try {
        let data = fs.readFileSync(file, 'utf8');
        return data;
    }
    catch(e) {
        console.log('Error in reading file: ' + e);
    }
}

function formatter(myString) {
    myString = String(myString);
    for(let weewee = 0; weewee < myString.length; weewee++) {
        if(myString[weewee] == "'") {
            myString = myString.substring(0,weewee) + "\\" + myString.substring(weewee, myString.length);
        }
        weewee++;
    }
    return myString;
}

/**
 * Grants access to Zoho APIs with the use of Zoho's API console at https://api-console.zoho.com/.
 * See documentation for more info: https://desk.zoho.com/DeskAPIDocument#OauthTokens
 * @param {String} code 
 * @param {String} client_id 
 * @param {String} client_secret 
 * @param {String} refresh_token 
 * @param {String} scope 
 * @returns JSON access information.
 */
async function oauthgrant(code, client_id, client_secret, refresh_token, scope) {
    if(refresh_token === null) {
        const response = await fetch("https://accounts.zoho.com/oauth/v2/token?code="+ code + "&grant_type=authorization_code&client_id=" + client_id + "&client_secret=" + client_secret + "&redirect_uri=https://www.zylker.com/oauthgrant", {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            mode: "cors", // no-cors, *cors, same-origin
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            credentials: "same-origin", // include, *same-origin, omit
            redirect: "follow", // manual, *follow, error
            referrerPolicy: "no-referrer"// no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        });
        return response.json(); // parses JSON response into native JavaScript objects
    }
    else {
        return refresh(client_id, client_secret, refresh_token, scope);
    }
}

/**
 * Returns authenticated and valid info to perform Zoho Desk operations.
 * @param {String} client_id 
 * @param {String} client_secret 
 * @param {String} refresh_token 
 * @param {String} scope 
 * @returns JSON containing a new access token.
 */
async function refresh(client_id, client_secret, refresh_token, scope) {
    const response = await fetch("https://accounts.zoho.com/oauth/v2/token?refresh_token="+refresh_token+"&client_id="+client_id+"&client_secret="+client_secret+"&scope="+scope+"&redirect_uri=https://www.zylker.com/oauthgrant&grant_type=refresh_token", {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
        "Content-Type": "application/json"
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer"// no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });
    return response.json();
}

/**
 * Calls the refresh function for a valid access token and creates a Zoho ticket containing the error message.
 * @param {String} error 
 * @param {String} msg 
 */
async function createTicket(error, msg) {
    refresh(CLIENT_ID, CLIENT_SECRET, ((ZOHO.refresh_token === undefined)?REFRESH_TOKEN:ZOHO.refresh_token), SCOPE).access_token.then(token => {
        if(token.hasOwnProperty("access_token")) {
            fetch("https://desk.zoho.com/api/v1/tickets", {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            mode: "cors", // no-cors, *cors, same-origin
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            credentials: "same-origin", // include, *same-origin, omit
            headers: {
                "orgId": ORG_ID,
                "Authorization":"Zoho-oauthtoken " + token.access_token,
                "Content-Type": "application/json"
            },
            redirect: "follow", // manual, *follow, error
            referrerPolicy: "no-referrer",// no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify({"subject":"[TEST] PPI Error Report", "departmentId":jsonData.ZohoAPI.departmentId,"description":msg + "\n" + error, "contactId":jsonData.ZohoAPI.contactId, "assigneeId":jsonData.ZohoAPI.assigneeId})
            });
        }
        else {
            console.log("Cannot create ticket. No access token.\n" + token +"\n" + error);
        }
    }).catch(err => {
        console.error("Could not refresh\n"+err);
    });
}

/**
 * Replaces all dashes (-) with a space.
 * @param {string} myString 
 * @returns myString of type string, but with spaces instead of dashes.
 */
function removeSpace(myString) {
    return myString.replace(/ /g,"-");
}

/**
 * Applies deny permissions to group of users.
 * @param {String} path path of folder to apply deny permission to.
 * 
 */
function denyGroupDelete(folderPath) {
    const group = 'Domain Users';
    const permissions = 'DE';
    const permissions2 = 'DC';

    exec(`icacls "${folderPath}" /deny "${group}":(OI)(CI)(${permissions}) /t`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error applying permissions: ${error}`);
        return;
    }
    console.log('Permissions applied successfully.');
    });

    exec(`icacls "${folderPath}" /deny "${group}":(${permissions}) /t`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error applying permissions: ${error}`);
        return;
    }
    console.log('Permissions applied successfully.');
    });
}

/**
 * Most inportant step to run all our APIs!  Set a port number and run the application.
 * The below commented out section is how APIs were previously started before we needed to configure https.
 * Now we use the https module to start the APIs using https connections.
 */

// const port = Number(process.env.PORT) || 3000;
// app.listen(port, () => console.log(`Listening to port ${port}...`));

https.createServer(options, app, function (req, res) {
    res.statusCode = 200;
  }).listen(3000);