// Get MS Access driver at https://www.microsoft.com/en-us/download/details.aspx?id=54920
// Also make sure file extenstion is '.mdb'.
'use strict';
// const ADODB = require('node-adodb');
// const msnodesqlv8 = require('msnodesqlv8');
const sql = require('mssql');
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const nodemailer = require('nodemailer');
const winPermissionsManager = require('win-permissions-js');
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

// Directory for testing environment.
const PATH = "P:";
const DEMO_PATH = 'U:/Eureka/Nylex/test/Mock_Drive';
process.chdir(PATH);

// create application/json parser
var jsonParser = bodyParser.json();

// Connection Pool for Database.
const pool = new sql.ConnectionPool({
    user: jsonData.mssqlPROD.user,
    password: jsonData.mssqlPROD.password,
    server: jsonData.mssqlPROD.server,
    database: jsonData.mssqlPROD.database,
    options : jsonData.mssqlPROD.options
    // pool: {
    //     idleTimeoutMills: 
    // }
});

// pool.on('open', (options) => {
//     console.log(`ready options = ${JSON.stringify(options, null, 4)}`)
//   });
  pool.on('error', e => {
    console.log(e);
  });

// Function to establish a new connection
async function establishConnection() {
    try {
      await pool.connect();
      console.log('Connection established.');
    } catch (err) {
      console.error('Error establishing connection:', err);
    }
}

  pool.on('requestTimeout', (err) => {
    console.log('Connection timed out:', err);
    console.log('Reinitiating the connection...');
    establishConnection();
  });

establishConnection();

pool.on('connectTimeout', () => {
    console.log('Connection timed out.');
    console.log('Reinitiating the connection...');
    establishConnection();
  });
// Change source directory accordingly.
app.use(cors());

// Gets all Employees.
app.get('/', (req, res) => {
    const query = 'SELECT * FROM Staff WHERE Active = 1 ORDER BY last;';
    const request = pool.request();
    request.query(query, (err, rows) => {
        if(err) {
            console.log("Error for entry ID: " + element.ID);
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(rows.recordset));
        }
    });
});

// Gets all keywords.
app.get('/1', (req, res) => {
    const query = 'SELECT * FROM Keywords ORDER BY Keyword;';
    const request = pool.request();
    request.query(query, (err, rows) => {
        if(err) {
            console.log("Error for entry ID: " + element.ID);
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(rows.recordset));
        }
    });
});

// Get all Profile codes.
app.get('/2', (req, res) => {
    const query = 'SELECT * FROM ProfileCodes ORDER BY Code;';
    const request = pool.request();
    request.query(query, (err, rows) => {
        if(err) {
            console.log("Error for entry ID: " + element.ID);
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(rows.recordset));
        }
    });
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
    else {
        projnum = req.body.Id;
    }
    
    // Start directory with getting the office.
    let dir = PATH;
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

    // append last 2 digits of the year and the value of counter.
    projnum += dateYear.toString().slice(-2) + counter;

    // Append ID and project title to be apart of the new project directory.
    if(req.body.Id == 1) {
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
        projnum += 'A'
    }
    else{
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
    }

    // Project initiation date.
    const mydate = new Date();
    let myDate = mydate.getFullYear() + '-' + (mydate.getMonth() + 1) + '-' + mydate.getDay();

    const query = 'INSERT INTO Projects (project_id, project_title, project_manager_ID, qaqc_person_ID, closed, start_date, close_date, project_location, latitude, longitude, ' +
            'SHNOffice_ID, service_area, total_contract, exempt_agreement, retainer, retainer_paid, waived_by, profile_code_id, project_type, contract_ID, invoice_format, client_contract_PO, outside_markup,'+
            'prevailing_wage, agency_name, special_billing_instructions, see_also, autoCAD, GIS, project_specifications, client_company, client_abbreviation, mailing_list, '+
            'first_name, last_name, relationship, job_title, address1, address2, city, state, zip_code, work_phone, ext, home_phone, cell, fax, email, '+
            'binder_size, binder_location, description_service, created'+
            ') OUTPUT inserted.* VALUES (' + '\''+ projnum + '\', \''+ req.body.ProjectTitle + '\', ' + req.body.ProjectMgr + ', ' + req.body.QA_QCPerson + ', 0, \''+
            req.body.StartDate + '\', \''+ req.body.CloseDate +'\', \''+ req.body.ProjectLocation +'\', '+req.body.Latitude +', '+req.body.Longitude +', '+
            req.body.officeID + ', \''+ req.body.ServiceArea + '\', \''+ req.body.TotalContract +'\', '+ req.body.ServiceAgreement +', \''+ req.body.Retainer + '\', '+ req.body.RetainerPaid +', \''+ req.body.WaivedBy +'\', ' + req.body.ProfileCode +', '+
            req.body.ProjectType + ', '+ req.body.ContractType +', \''+ req.body.InvoiceID + '\', \''+ req.body.ClientContractPONumber +'\', '+ req.body.OutsideMarkup +', ' + req.body.PREVAILING_WAGE + ', '+ (req.body.agency != 'NULL'?'\''+req.body.agency +'\'':req.body.agency) +', '+ (req.body.SpecialBillingInstructins != 'NULL'?'\''+ req.body.SpecialBillingInstructins + '\'':req.body.SpecialBillingInstructins) + ', ' + 
            (req.body.SEEALSO != 'NULL'?'\''+req.body.SEEALSO+'\'':req.body.SEEALSO) +', '+ req.body.AutoCAD_Project + ', '+ req.body.GIS_Project + ', ' + req.body.Project_Specifications + ', \'' +
            req.body.ClientCompany1 + '\', ' + (req.body.ClientAbbrev1 != 'NULL'?'\'' + req.body.ClientAbbrev1 + '\'':req.body.ClientAbbrev1) +', ' + (req.body.OfficeMailingLists1 != 'NULL'?'\''+req.body.OfficeMailingLists1 +'\'':req.body.OfficeMailingLists1) +', \'' + req.body.ClientContactFirstName1 + '\', \'' + req.body.ClientContactLastName1 + '\', ' +
            (req.body.ClientRelation != 'NULL'?'\''+req.body.ClientRelation + '\'':req.body.ClientRelation) +', '+ (req.body.Title1 != 'NULL'?'\''+req.body.Title1+'\'':req.body.Title1) + ', \'' + req.body.Address1_1 + '\', ' + (req.body.Address2_1!='NULL'?'\''+req.body.Address2_1+'\'':req.body.Address2_1) + ', \'' + req.body.City1 + '\', \'' + req.body.State1 + '\', \'' + req.body.Zip1 + '\', \'' +
            req.body.PhoneW1 + '\', ' +(req.body.Ext != 'NULL' && req.body.Ext != null && !isNaN(req.body.Ext) ?'\''+req.body.Ext + '\'':'NULL') + ', ' + (req.body.PhoneH1 != 'NULL'?'\''+req.body.PhoneH1+'\'':req.body.PhoneH1) + ', ' + (req.body.Cell1!='NULL'?'\''+req.body.Cell1+'\'':req.body.Cell1) + ', ' + (req.body.Fax1 != 'NULL'?'\''+req.body.Fax1+'\'':req.body.Fax1) + ', \'' + req.body.Email1 + '\', ' + req.body.BinderSize + ', ' + (req.body.BinderLocation != 'NULL'?'\''+req.body.BinderLocation+'\'':req.body.BinderLocation) + ', \'' +
            req.body.DescriptionService + '\', \''+ myDate +'\'' +
            ')';
    const request = pool.request();
    request.query(query, (err, data) => {
        if(err) {
            console.log("Error for query:\n" + query);
            console.error(err);
            try{
                res.send(JSON.stringify(err));
                createTicket(err, "Error in initiating a project:");
            }
            catch(OhNo) {
                console.log("Could not send back error response for project " + projnum);
            }
        }
        else {

            // Update Team and Keywords tables to link to Project.
            const result = data.recordset[0];
            // console.log(data.recordset);
                let teamArr = req.body.TeamMembers.split(',');
                let teamQuery = '';
                teamArr.forEach((memb) => {
                    teamQuery += "INSERT INTO ProjectTeam VALUES ("+result.ID+", "+memb+");";
                });
                let keyArr = req.body.KeyIDs.split(',');
                keyArr.forEach((key) => {
                    if(!isNaN(key) && key != null && key != '') { // If-statement in case the user uses custom keywords and no pre-defines ones.
                        teamQuery += "INSERT INTO ProjectKeywords VALUES ("+result.ID+", "+key+");";
                    }
                });
                request.query(teamQuery, (uwu) => {
                    if(uwu) {
                        console.log("Error with query:\n" + teamQuery);
                        console.error(uwu);
                    }
                });
            // });

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

            // Create the directories for Project.
            createDirectories(dir, true, removeEscapeQuote(req.body.CreatedBy) + " - " + mydate.toString());

            // Begin creating PDF document.
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(dir + '/Setup/'+ removeA +'.pdf'));
            (async function(){
                // table 
                for(let ifNull of Object.keys(req.body)) {
                    if(req.body[ifNull] == null || req.body[ifNull] == undefined || req.body[ifNull] == 'NULL' || req.body[ifNull] == '') {
                        req.body[ifNull] = "None";
                    }
                }
                const table = {
                    title: (req.body.Projectid != null && req.body.Projectid != undefined)?req.body.Projectid:req.body.PromoId,
                    subtitle: "Project Initiation",
                    headers: ["Name", "User Input", "Client", "Info"],
                    rows: [
                        [ "Project", removeA, "Client Company", removeEscapeQuote(req.body.ClientCompany1).toString()],
                        [ "Title", req.body.ProjectTitle, "Client Abbreviation", (req.body.ClientAbbrev1 == null || req.body.ClientAbbrev1 == undefined || req.body.ClientAbbrev1 == '')?"none":removeEscapeQuote(req.body.ClientAbbrev1).toString()],
                        ["Project Manager", req.body.ProjectMgrName, "Client First Name", removeEscapeQuote(req.body.ClientContactFirstName1).toString()],
                        ["QAQC Person", req.body.QA_QCPersonName, "Client Last Name", removeEscapeQuote(req.body.ClientContactLastName1).toString()],
                        ["Team Members", req.body.TeamMemberNames, "Relationship", req.body.ClientRelation],
                        ["Start Date", formatDate(req.body.StartDate), "Job Title", removeEscapeQuote(req.body.Title1).toString()],
                        ["Close Date", formatDate(req.body.CloseDate), "Address", removeEscapeQuote(req.body.Address1_1).toString()],
                        ["Location", removeEscapeQuote(req.body.ProjectLocation).toString(), "2nd Address", removeEscapeQuote(req.body.Address2_1).toString()],
                        ["Latitude", removeEscapeQuote(req.body.Latitude).toString(),"City", removeEscapeQuote(req.body.City1).toString()],
                        ["Longitude", removeEscapeQuote(req.body.Longitude).toString(), "State", req.body.State1],
                        ["Keywords", req.body.ProjectKeywords, "Zip", req.body.Zip1],
                        ["SHN Office", req.body.SHNOffice, "Work Phone", removeEscapeQuote(req.body.PhoneW1).toString() + (req.body.Ext != 'NULL' && req.body.Ext != null?' Ext: ' + removeEscapeQuote(req.body.Ext).toString() : '')],
                        ["Service Area", req.body.ServiceArea, "Home Phone", removeEscapeQuote(req.body.PhoneH1).toString()],
                        ["Total Contract", req.body.TotalContract, "Cell Phone", removeEscapeQuote(req.body.Cell1).toString()],
                        ["Service Agreement", req.body.ServiceAgreement, "Fax", removeEscapeQuote(req.body.Fax1).toString()],
                        ["If yes, why?", req.body.Explanation, "Email", removeEscapeQuote(req.body.Email1).toString()],
                        ["Retainer", removeEscapeQuote((req.body.Retainer == 'Enter Amount'?req.body.RetainerPaid:(req.body.Retainer == 'Waived by X'? 'Waived by ' + removeEscapeQuote(req.body.WaivedBy):req.body.Retainer))).toString(), "Binder Size", req.body.BinderSize],
                        ["Profile Code", req.body.ProfileCodeName, "Binder Location", req.body.BinderLocation],
                        ["Contract Type", req.body.contactTypeName,'-','-'],
                        ["Invoice Format", req.body.InvoiceFormat,'-','-'],
                        ["Client Contract/PO#", req.body.ClientContractPONumber,'-','-'],
                        ["Outside Markup", (req.body.OutsideMarkup == undefined)?0:req.body.OutsideMarkup,'-','-'],
                        ["Prevailing Wage", removeEscapeQuote((req.body.PREVAILING_WAGE==1?'Yes':'No')).toString()],
                        ["Billing Instructions", removeEscapeQuote(req.body.SpecialBillingInstructins).toString(),'-','-'],
                        ["See Also", req.body.SEEALSO],
                        ["AutoCAD", (req.body.AutoCAD_Project == -1)?'Yes':'No','-','-'],
                        ["GIS Job", (req.body.GIS_Project == -1)?'Yes':'No','-','-'],
                        ["Project Specifications", (req.body.Project_Specifications == -1)?'Yes':'No','Created on',mydate.toString()],
                        ["Description of Services", removeEscapeQuote(req.body.DescriptionService).toString(),'Created By',removeEscapeQuote(req.body.CreatedBy).toString()]
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
            
                // Start of array of who to notify of this creation.
                const admins = [jsonData.email.admins];
            
                admins.push((projnum.length > 6?getAdmin(projnum[0], projnum[6]):getAdmin(projnum[0], 'Z')));

                // Get individual Project manager to notify.
                request.query('SELECT email FROM Staff WHERE ID = '+ req.body.ProjectMgr +' AND email IS NOT NULL AND email <> \'\';', (awNo, emails) => {
                    if(awNo) {
                        console.log('Could not query emails.  The following error occurred instead:\n' + awNo);
                        createTicket(awNo, "Project initiation email could not be sent:");
                    }
                    else {
                        // console.log(emails.recordset);
                        emails.recordset.forEach(email => {
                            if(!admins.includes(email.email + '@shn-engr.com') && email.email != undefined && email.email != 'undefined' && email.email != null && email.email != 'NULL') {
                                admins.push(email.email + '@shn-engr.com');
                            }
                        });
                        // console.log(admins);
                        // Finally, send out email notice.
                        emailPersonel(removeA +'.pdf', dir + '/Setup/'+ removeA +'.pdf', 'Project with ID ' + projnum + ' has been initialized!<br>See PDF for more.', admins, 'Project with ID ' + projnum + ' initialized.');
                    }
                });
            })();
            // If all is successful, send project number to user.
            res.send(JSON.parse('{"Status":"'+ projnum + '"}'));
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
    // // Connect to database.
    // const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);

    // Begin creating directory.
    let dir = PATH;
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

    // Project initiation date.
    const mydate = new Date();
    let myDate = mydate.getFullYear() + '-' + (mydate.getMonth() + 1) + '-' + mydate.getDay();

    // let latLongNaN = false;
    // Begin making SQL query.
    const query = 'INSERT INTO Promos (is_project, proj_ID, promo_id, promo_type, promo_title, manager_ID, qaqc_person_ID, closed, start_date, close_date, promo_location, latitude, longitude, ' +
    'SHNOffice_ID, service_area, profile_code_id, client_company, client_abbreviation, '+
    'first_name, last_name, relationship, job_title, address1, address2, city, state, zip_code, work_phone, ext, home_phone, cell, fax, email, '+
    'binder_size, description_service, created'+
    ') OUTPUT inserted.* VALUES (0, NULL,' + '\''+ projnum + '\', \''+req.body.AlternateTitle+'\', \''+ req.body.ProjectTitle + '\', ' + req.body.ProjectMgr + ', ' + req.body.QA_QCPerson + ', 0, \''+
    req.body.StartDate + '\', \''+ req.body.CloseDate +'\', \''+ req.body.ProjectLocation +'\', '+req.body.Latitude +', '+req.body.Longitude +', '+
    '' + req.body.officeID + ', \''+ req.body.ServiceArea + '\', '+ req.body.ProfileCode + ', \'' +
    req.body.ClientCompany1 + '\', ' + (req.body.ClientAbbrev1 != 'NULL'?'\'' + req.body.ClientAbbrev1 + '\'':req.body.ClientAbbrev1) +', \'' + req.body.ClientContactFirstName1 + '\', \'' + req.body.ClientContactLastName1 + '\', ' +
    (req.body.ClientRelation != 'NULL' && req.body.ClientRelation != null && req.body.ClientRelation != undefined ?'\''+req.body.ClientRelation + '\'':req.body.ClientRelation) +', '+ (req.body.Title1 != 'NULL'?'\''+req.body.Title1+'\'':req.body.Title1) + ', \'' + req.body.Address1_1 + '\', ' + (req.body.Address2_1!='NULL'?'\''+req.body.Address2_1+'\'':req.body.Address2_1) + ', \'' + req.body.City1 + '\', \'' + req.body.State1 + '\', \'' + req.body.Zip1 + '\', \'' +
    req.body.PhoneW1 + '\', ' + (req.body.Ext != 'NULL' && req.body.Ext != null && !isNaN(req.body.Ext) ?'\''+req.body.Ext + '\'':'NULL') + ', ' + (req.body.PhoneH1 != 'NULL'?'\''+req.body.PhoneH1+'\'':req.body.PhoneH1) + ', ' + (req.body.Cell1!='NULL'?'\''+req.body.Cell1+'\'':req.body.Cell1) + ', ' + (req.body.Fax1 != 'NULL'?'\''+req.body.Fax1+'\'':req.body.Fax1) + ', \'' + req.body.Email1 + '\', ' + req.body.BinderSize + ', \''+
    req.body.DescriptionService + '\', \''+ myDate +'\'' +
    ')';
    const request = pool.request();
    // Execute query.
    request.query(query, (error, data) => {
        // Start creating Promo directories.
        if(error) {
            console.log(query);
            console.error("promo query error:\n" + error);
            try{
                createTicket(error, "Promo Initiation failed:");
                res.send(JSON.stringify(error));
            }
            catch(AwMan) {
                console.log("Could not send error response for Promo " + projnum);
            }
        }
        else {

            // Update Team and Keywords tables to link to Promo.
            const result = data.recordset[0];
            // console.log(data.recordset);
            let teamArr = req.body.TeamMembers.split(',');
            let teamQuery = '';
            teamArr.forEach((memb) => {
                teamQuery += "INSERT INTO PromoTeam VALUES ("+result.ID+", "+memb+");";
            });
            let keyArr = req.body.KeyIDs.split(',');
            keyArr.forEach((key) => {
                if(!isNaN(key) && key != null && key != '') { // If-statement in case the user uses custom keywords and no pre-defines ones.
                    teamQuery += "INSERT INTO PromoKeywords VALUES ("+result.ID+", "+key+");";
                }
            });
            request.query(teamQuery, (uwu) => {
                if(uwu) {
                    console.log("Error with query:\n" + teamQuery);
                    console.error(uwu);
                }
            });

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
    
            // Create directories for Promo folder.
            createDirectories(dir, true, removeEscapeQuote(req.body.CreatedBy) + " - " + mydate.toString());

            // Start creation of PDF document.
            const doc = new PDFDocument();
            const myPath = dir + '/Setup/'+ removeA +'.pdf';
            doc.pipe(fs.createWriteStream(myPath));
    
            (async function(){
                // table
                for(let ifNull of Object.keys(req.body)) {
                    if(req.body[ifNull] == null || req.body[ifNull] == undefined || req.body[ifNull] == 'NULL' || req.body[ifNull] == '') {
                        req.body[ifNull] = "None";
                    }
                }
                const table = {
                  title: (req.body.Projectid != null && req.body.Projectid != undefined)?req.body.Projectid:req.body.PromoId,
                  subtitle: "Promo Initiation",
                  headers: ["Name", "User Input", "Client", "Info"],
                  rows: [
                    [ "Promo", removeA, "Client Company", removeEscapeQuote(req.body.ClientCompany1).toString()],
                    [ "Title", req.body.ProjectTitle, "Client Abbreviation", (req.body.ClientAbbrev1 == null || req.body.ClientAbbrev1 == undefined || req.body.ClientAbbrev1 == '')?"none":removeEscapeQuote(req.body.ClientAbbrev1)],
                    ["Project Manager", req.body.ProjectMgrName, "Client First Name", removeEscapeQuote(req.body.ClientContactFirstName1).toString()],
                    ["Type of Promo", removeEscapeQuote(req.body.AlternateTitle), "Client Last Name", removeEscapeQuote(req.body.ClientContactLastName1).toString()],
                    ["QAQC Person", req.body.QA_QCPersonName, "Relationship", req.body.ClientRelation],
                    ["Team Members", req.body.TeamMemberNames, "Job Title", removeEscapeQuote(req.body.Title1).toString()],
                    ["Start Date", formatDate(req.body.StartDate), "Address", removeEscapeQuote(req.body.Address1_1).toString()],
                    ["Close Date", formatDate(req.body.CloseDate), "2nd Address", removeEscapeQuote(req.body.Address2_1).toString()],
                    ["Location", removeEscapeQuote(req.body.ProjectLocation).toString(),"City", removeEscapeQuote(req.body.City1).toString()],
                    ["Latitude", removeEscapeQuote(req.body.Latitude).toString(), "State", req.body.State1],
                    ["Longitude", removeEscapeQuote(req.body.Longitude).toString(), "Zip", req.body.Zip1],
                    ["Keywords", req.body.ProjectKeywords, "Work Phone", removeEscapeQuote(req.body.PhoneW1).toString() + (req.body.Ext != 'NULL' && req.body.Ext != null?' Ext: ' + removeEscapeQuote(req.body.Ext).toString() : '')],
                    ["SHN Office", req.body.SHNOffice, "Home Phone", removeEscapeQuote(req.body.PhoneH1).toString()],
                    ["Service Area", req.body.ServiceArea, "Cell Phone", removeEscapeQuote(req.body.Cell1).toString()],
                    ["Profile Code", req.body.ProfileCodeName, "Fax", removeEscapeQuote(req.body.Fax1).toString()],
                    ["-", '-', "Email", removeEscapeQuote(req.body.Email1).toString()],
                    ["-", '-', "Binder Size", req.body.BinderSize],
                    ['-','-','Created On', mydate.toString()],
                    ["Description of Services", removeEscapeQuote(req.body.DescriptionService).toString(),'Created By',removeEscapeQuote(req.body.CreatedBy).toString()]
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
    
                // Array to store contacts of who to notify of this creation.
                // Start of array of who to notify of this creation.
                const admins = [jsonData.email.admins];
            
                admins.push((projnum.length > 10?getAdmin(projnum[0], projnum[10]):getAdmin(projnum[0], 'Z')));
                // Query the Project manager's email.
                request.query('SELECT email FROM Staff WHERE ID = '+ req.body.ProjectMgr + ' AND email IS NOT NULL', (awNo, emails) => {
                    // console.log(emails);
                    if(awNo) {
                        console.log('Could not query emails.  The following error occurred instead:\n' + awNo);
                        createTicket(awNo, "Project initiation email could not be sent:");
                    }
                    else {
                        emails.recordset.forEach(email => {
                            if(!admins.includes(email.email + '@shn-engr.com') && email.email != undefined && email.email != 'undefined' && email.email != null && email.email != 'NULL') {
                                admins.push(email.email + '@shn-engr.com');
                            }
                        });
                        // Finally, send out email notice.
                        emailPersonel(removeA +'.pdf', myPath, 'Promo with ID ' + projnum + ' has been initialized!<br>See PDF for more.', admins, 'Promo with ID ' + projnum + ' initialized.');
                    }
                });
            })();
              // If all is successful, send back the Promo number.
            res.send(JSON.parse('{"Status":"'+ projnum +'"}'));
        }
    });
});

/**
 * Gets IDs of the keywords by keyword names.
 */

app.post('/keyName', jsonParser, (req, res) => {
    const request = pool.request();
    request.query("SELECT * FROM ProjectKeywords WHERE project_id = " + req.body.project + ";", (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(data.recordset));
        }
    });
});

/**
 * API to convert a promo to a project.
 */

app.post('/ProjPromo', jsonParser, (req, res) => {
    // let myResponse = 'Null response';
    // const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    let projnum = '';
    if(req.body.PromoId[0] == 1) {
        projnum = "0";
    }
    else {
        projnum = req.body.PromoId[0];
    }
    
    let dir = PATH;
    dir += getDir(req.body.PromoId[0]); // Gets the cooresponding Office

    dir += '/' + '20' + new Date().getFullYear().toString().slice(-2);

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

    projnum += new Date().getFullYear().toString().slice(-2) + counter;
    if(req.body.PromoId.length > 10 && req.body.PromoId[10].localeCompare('A') == 0) {
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
        projnum += 'A';
    }
    else{
        dir += '/' + projnum + '-' + removeSpace(removeEscapeQuote(req.body.ProjectTitle));
    }

    let retainMe = (req.body.Retainer == 'Enter Amount')?'$'+req.body.RetainerPaid:(req.body.Retainer.includes("Waived by X")?"Waived by "+req.body.WaivedBy:req.body.Retainer);

    // Project initiation date.
    const mydate = new Date();
    let myDate = mydate.getFullYear() + '-' + (mydate.getMonth() + 1) + '-' + mydate.getDay();

    const query = 'INSERT INTO Projects (project_id, project_title, project_manager_ID, qaqc_person_ID, closed, start_date, close_date, project_location, latitude, longitude, ' +
            'SHNOffice_ID, service_area, total_contract, exempt_agreement, retainer, retainer_paid, waived_by, profile_code_id, project_type, contract_ID, invoice_format, client_contract_PO, outside_markup,'+
            'prevailing_wage, agency_name, special_billing_instructions, see_also, autoCAD, GIS, project_specifications, client_company, client_abbreviation, mailing_list, '+
            'first_name, last_name, relationship, job_title, address1, address2, city, state, zip_code, work_phone, ext, home_phone, cell, fax, email, '+
            'binder_size, binder_location, description_service, created'+
            ') OUTPUT inserted.* VALUES (' + '\''+ projnum + '\', \''+ req.body.ProjectTitle + '\', ' + req.body.ProjectMgr + ', ' + req.body.QA_QCPerson + ', 0, \''+
            req.body.StartDate + '\', \''+ req.body.CloseDate +'\', \''+ req.body.ProjectLocation +'\', '+req.body.Latitude +', '+req.body.Longitude +', '+
            '' + req.body.officeID + ', \''+ req.body.ServiceArea + '\', \''+ req.body.TotalContract +'\', '+ req.body.ServiceAgreement +', \''+ req.body.Retainer + '\', '+ req.body.RetainerPaid +', '+ (req.body.WaivedBy != "NULL"?"'"+req.body.WaivedBy+"'":"NULL") +', ' + req.body.ProfileCode +', '+
            req.body.ProjectType + ', ' + req.body.ContractType +', \''+ req.body.InvoiceID + '\', \''+ req.body.ClientContractPONumber +'\', '+ req.body.OutsideMarkup +', ' + req.body.PREVAILING_WAGE + ', '+ (req.body.agency != 'NULL'?'\''+req.body.agency +'\'':req.body.agency) +', '+ (req.body.SpecialBillingInstructins != 'NULL'?'\''+ req.body.SpecialBillingInstructins + '\'':req.body.SpecialBillingInstructins) + ', ' + 
            (req.body.SEEALSO != 'NULL'?'\''+req.body.SEEALSO+'\'':req.body.SEEALSO) +', '+ req.body.AutoCAD_Project + ', '+ req.body.GIS_Project + ', ' + req.body.Project_Specifications + ', \'' +
            req.body.ClientCompany1 + '\', ' + (req.body.ClientAbbrev1 != 'NULL' && req.body.ClientAbbrev1 != null?'\'' + req.body.ClientAbbrev1 + '\'':req.body.ClientAbbrev1) +', ' + (req.body.OfficeMailingLists1 != 'NULL'?'\''+req.body.OfficeMailingLists1 +'\'':req.body.OfficeMailingLists1) +', \'' + req.body.ClientContactFirstName1 + '\', \'' + req.body.ClientContactLastName1 + '\', ' +
            (req.body.ClientRelation != 'NULL'?'\''+req.body.ClientRelation + '\'':req.body.ClientRelation) +', '+ (req.body.Title1 != 'NULL'?'\''+req.body.Title1+'\'':req.body.Title1) + ', \'' + req.body.Address1_1 + '\', ' + (req.body.Address2_1!='NULL' && req.body.Address2_1!=null?'\''+req.body.Address2_1+'\'':req.body.Address2_1) + ', \'' + req.body.City1 + '\', \'' + req.body.State1 + '\', \'' + req.body.Zip1 + '\', \'' +
            req.body.PhoneW1 + '\', ' + (req.body.Ext != 'NULL' && req.body.Ext != null && !isNaN(req.body.Ext) ?'\''+req.body.Ext + '\'':'NULL') + ', ' + (req.body.PhoneH1 != 'NULL'?'\''+req.body.PhoneH1+'\'':req.body.PhoneH1) + ', ' + (req.body.Cell1!='NULL'?'\''+req.body.Cell1+'\'':req.body.Cell1) + ', ' + (req.body.Fax1 != 'NULL'?'\''+req.body.Fax1+'\'':req.body.Fax1) + ', \'' + req.body.Email1 + '\', ' + req.body.BinderSize + ', ' + (req.body.BinderLocation != 'NULL'?'\''+req.body.BinderLocation+'\'':req.body.BinderLocation) + ', \'' +
            req.body.DescriptionService + '\', \''+ myDate +'\')';
    
    const request = pool.request();
    request.query(query, (err, memes) => { // MEMES >:)
        if(err) {
            // console.log(query);
            console.error("promo query error:\n" + err);
            try{
                createTicket(err, "Promo Initiation failed:");
                res.send(JSON.stringify(err));
            }
            catch(AwMan) {
                console.log("Could not send error response for Promo " + projnum);
            }
        }
        else {
            
            let teamArr = req.body.TeamMembers.split(',');
            let teamQuery = '';
            teamArr.forEach((memb) => {
                teamQuery += "INSERT INTO ProjectTeam VALUES ("+memes.recordset[0].ID+", "+memb+");";
            });
            let keyArr = req.body.KeyIDs.split(',');
            keyArr.forEach((key) => {
                if(!isNaN(key) && key != null && key != '') { // If-statement in case the user uses custom keywords and no pre-defines ones.
                    teamQuery += "INSERT INTO ProjectKeywords VALUES ("+memes.recordset[0].ID+", "+key+");";
                }
            });
            teamQuery += "UPDATE Promos SET is_project = 1, proj_ID = " + memes.recordset[0].ID + " WHERE ID = " + req.body.ID.split(',')[0] + ";"
            request.query(teamQuery, (uwu) => {
                if(uwu) {
                    console.log("Error with query:\n" + teamQuery);
                    console.error(uwu);
                }
            });
            if(!fs.existsSync(dir)) {
                fs.mkdir((dir), err => {
                    if(err){
                        throw err;
                    }
                });
            }

            // Create the Project Directories.
            createDirectories(dir, true, removeEscapeQuote(req.body.CreatedBy) + " - " + mydate.toString());
    
            let removeA = projnum;
            if(projnum.length > 6 && projnum[6] == 'A') {
                removeA = projnum.substring(0,6);
            }
    
                const doc = new PDFDocument();
                doc.pipe(fs.createWriteStream(dir + '/Setup/'+ removeA +'.pdf'));
                    
                (async function(){
                    // table
                    for(let ifNull of Object.keys(req.body)) {
                        if(req.body[ifNull] == null || req.body[ifNull] == undefined || req.body[ifNull] == 'NULL' || req.body[ifNull] == '') {
                            req.body[ifNull] = "None";
                        }
                    }
                    const table = {
                      title: "Promo to Project",
                      subtitle: "Promo " + req.body.PromoId.split(',')[0] + " converted to Project " + removeA,
                      headers: ["Name", "User Input", "Client", "Info"],
                      rows: [
                        [ "Project", removeA , "Client Company", removeEscapeQuote(req.body.ClientCompany1).toString()],
                        [ "Title", req.body.ProjectTitle, "Client Abbreviation", (req.body.ClientAbbrev1 == null || req.body.ClientAbbrev1 == undefined || req.body.ClientAbbrev1 == '' || req.body.ClientAbbrev1 == 'NULL')?"NONE":removeEscapeQuote(req.body.ClientAbbrev1).toString()],
                        ["Project Manager", req.body.ProjectMgrName, "Client First Name", removeEscapeQuote(req.body.ClientContactFirstName1).toString()],
                        ["QAQC Person", req.body.QA_QCPersonName, "Client Last Name", removeEscapeQuote(req.body.ClientContactLastName1).toString()],
                        ["Team Members", req.body.TeamMemberNames, "Relationship", (req.body.ClientRelation == "NULL")?"None or Distant":req.body.ClientRelation],
                        ["Start Date", formatDate(req.body.StartDate), "Job Title", (req.body.Title1 == "NULL" || req.body.Title1 == "" || req.body.Title1 == null)?"-":removeEscapeQuote(req.body.Title1).toString()],
                        ["Close Date", formatDate(req.body.CloseDate), "Address", removeEscapeQuote(req.body.Address1_1).toString()],
                        ["Location", removeEscapeQuote(req.body.ProjectLocation).toString(), "2nd Address", (req.body.Address2_1 == "NULL" || req.body.Address2_1 == "" || req.body.Address2_1 == null)?"-":removeEscapeQuote(req.body.Address2_1).toString()],
                        ["Latitude", removeEscapeQuote(req.body.Latitude).toString(),"City", removeEscapeQuote(req.body.City1).toString()],
                        ["Longitude", removeEscapeQuote(req.body.Longitude).toString(), "State", req.body.State1],
                        ["Keywords", req.body.ProjectKeywords, "Zip", req.body.Zip1],
                        ["SHN Office", req.body.SHNOffice, "Work Phone", removeEscapeQuote(req.body.PhoneW1).toString() + (req.body.Ext != 'NULL' && req.body.Ext != null?' Ext: ' + removeEscapeQuote(req.body.Ext).toString() : '')],
                        ["Service Area", req.body.ServiceArea, "Home Phone", (req.body.PhoneH1 == "NULL" || req.body.PhoneH1 == "" || req.body.PhoneH1 == null)?"-":removeEscapeQuote(req.body.PhoneH1).toString()],
                        ["Total Contract", req.body.TotalContract, "Cell Phone", (req.body.Cell1 == "NULL" || req.body.Cell1 == "" || req.body.Cell1 == null)?"-":removeEscapeQuote(req.body.Cell1).toString()],
                        ["Service Agreement", (req.body.ServiceAgreement == 1?"Yes":"No"), "Fax", (req.body.Fax1 == "NULL" || req.body.Fax1 == "" || req.body.Fax1 == null)?"-":removeEscapeQuote(req.body.Fax1).toString()],
                        ["If yes, why?", (req.body.Explanation == "NULL"?"-":removeEscapeQuote(req.body.Explanation).toString()), "Email", removeEscapeQuote(req.body.Email1).toString()],
                        ["Retainer", removeEscapeQuote(retainMe).toString(), "Binder Size", (req.body.BinderSize == "NULL" || req.body.BinderSize == "" || req.body.BinderSize == null)?"-":req.body.BinderSize],
                        ["Profile Code", req.body.ProfileCodeName, "Binder Location", (req.body.BinderLocation == "NULL" || req.body.BinderLocation == "" || req.body.BinderLocation == null)?"-":req.body.BinderLocation],
                        ["Contract Type", req.body.contactTypeName,'-','-'],
                        ["Invoice Format", req.body.InvoiceFormat,'-','-'],
                        ["Client Contract/PO#", req.body.ClientContractPONumber,'-','-'],
                        ["Outside Markup", (req.body.OutsideMarkup == undefined)?0:req.body.OutsideMarkup,'-','-'],
                        ["Prevailing Wage", (req.body.PREVAILING_WAGE == 1)?"Yes":"No"],
                        ["Billing Instructions", removeEscapeQuote((req.body.SpecialBillingInstructins == "NULL"?"-":req.body.SpecialBillingInstructins)).toString(),'-','-'],
                        ["See Also", removeEscapeQuote((req.body.SEEALSO == "NULL"?"-":req.body.SEEALSO)).toString()],
                        ["AutoCAD", (req.body.AutoCAD_Project == 1)?'Yes':'No','-','-'],
                        ["GIS Job", (req.body.GIS_Project == 1)?'Yes':'No','-','-'],
                        ["Project Specifications", (req.body.Project_Specifications == 1)?'Yes':'No','Created on', mydate.toString()],
                        ["Description of Services", removeEscapeQuote(req.body.DescriptionService).toString(),'Created By',removeEscapeQuote(req.body.CreatedBy).toString()]
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
    
                    // // Create the directories for Project.
                    // createDirectories(dir, true, removeEscapeQuote(req.body.CreatedBy) + " - " + mydate.toString());
    
                    // Start of array of who to notify of this creation.
                    // Start of array of who to notify of this creation.
                    const admins = [jsonData.email.admins];
                
                    admins.push((projnum.length > 6?getAdmin(projnum[0], projnum[6]):getAdmin(projnum[0], 'Z')));
                    // Get individual Project manager to notify.
                    request.query('SELECT email FROM Staff WHERE ID = '+ req.body.ProjectMgr +' AND email IS NOT NULL', (awNo, emails) => {
                        if(awNo) {
                            console.log('Could not send email.  The following error occurred instead:\n' + awNo);
                        }
                        else {
                            emails.recordset.forEach(email => {
                                if(!admins.includes(email.email + '@shn-engr.com') && email.email != undefined && email.email != 'undefined' && email.email != null && email.email != 'NULL') {
                                    admins.push(email.email + '@shn-engr.com');
                                }
                            });
                        }
                        // Finally, send out email notice.
                        emailPersonel(removeA +'.pdf', dir + '/Setup/'+ removeA +'.pdf', 'Project with ID ' + projnum + ' has been initialized!<br>See PDF for more.', admins, 'Project with ID ' + projnum + ' initialized.');
                    });
                  })();
            res.send(JSON.parse(JSON.stringify('{"Status":"'+ projnum +'"}')));
        }
    });
});

// Searches for projects to add a billing group to.

app.post('/billMe', jsonParser, (req, res) => {
    // const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    // console.log('Project Number is ' + req.body.ProjectNumber + ', and Description is ' + req.body.Description);
    const request = pool.request();
    request.query('SELECT Projects.*, Staff.ID AS staff_id, Staff.first AS staff_first, Staff.last AS staff_last FROM Projects INNER JOIN Staff ON Projects.project_manager_ID = Staff.ID WHERE (Projects.project_id = \''+ req.body.ProjectNumber +'\' OR Projects.project_id LIKE \''+ req.body.ProjectNumber +'_\') AND Projects.closed = 0;', (error, data) => {
        if(error) {
            console.log(error);
            res.send(JSON.stringify(error));
        }
        else if(data.recordset.length > 0) {
            let result = data.recordset;
            // console.log(result);
            request.query("SELECT * FROM BillingGroups WHERE project_ID = " + result[0].ID + " ORDER BY group_number", (err, billing) => {
                if(err) {
                    console.error(err);
                }
                else if (billing.recordset.length > 0){
                    result.push(billing.recordset);
                    // console.log(result);
                }
                res.send(JSON.stringify(result));
            });
        }
        else {
            res.send(JSON.stringify(data));
        }
    });
});

/**
 * Get Project Team members by ID for auto-selecting previously selected team members.
 * In the Projects database, the team members are often saved as a list of their IDs separated by commas (,).
 * Example: "21,666,69,420,"
 */

app.post('/mgrs', jsonParser, (req, res) => {
    const request = pool.request();
    request.query("SELECT member_id FROM ProjectTeam WHERE project_id = " + req.body.id, (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(data.recordset));
        }
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
    // Billing group initiation date.
    const mydate = new Date();
    // let myDate = mydate.getFullYear() + '-' + (mydate.getMonth() + 1) + '-' + mydate.getDay();

    let dir = PATH + getDir(req.body.ProjectId[0]) + '/20' + req.body.ProjectId[1] + req.body.ProjectId[2]; // + '/' + req.body.ProjectId + '-' + removeSpace(data[0].ProjectTitle) + '/';
    // let ArcataOffice = false;
    // let ArcDir = '';
    let projFolder = req.body.ProjectId;

    // Redact A for matching a project file.
    let dirFiles = fs.readdirSync(dir);
    if(req.body.ProjectId.length > 6 && req.body.ProjectId[6] == 'A') {
        projFolder = req.body.ProjectId.substring(0, req.body.ProjectId.length - 1);
    }

    let found = false;
    dirFiles.forEach(file => {
        if(file.substring(0,6).includes(projFolder) && !found) {
            dir += '/' + file;
            found = true;
        }
    });

    // Get first occurring Project entry for cooresponding project.
    const query = "INSERT INTO BillingGroups (project_ID, group_number, group_name, closed, autoCAD, GIS, manager_id, qaqc_person_ID, created, start_date, close_date, group_location, "+
    "latitude, longitude, service_area, total_contract, retainer, retainer_paid, waived_by, profile_code_id, contract_ID, invoice_format, client_contract_PO, outside_markup, "+
    "special_billing_instructions, prevailing_wage, binder_size, description_service)"+
    " OUTPUT inserted.* VALUES ("+req.body.ProjectID+", '"+req.body.BillingNum+"', '"+req.body.BillingName+"', "+ 0 + ", " +req.body.AutoCAD_Project+", "+ req.body.GIS_Project+", "+req.body.NewMgr+", "+req.body.QAQC+", GETDATE()" +
    ", '"+ req.body.StartDate +"', '"+ req.body.CloseDate +"', '"+ req.body.ProjectLocation +"', "+ req.body.Latitude +", "+ req.body.Longitude +", "+ (req.body.ServiceArea == "NULL"?"NULL":"'"+req.body.ServiceArea+"'") +", "+ req.body.TotalContract +", '"+
    req.body.Retainer +"', "+(req.body.RetainerPaid == "NULL" || isNaN(req.body.RetainerPaid) ?"NULL":req.body.RetainerPaid)+", "+(req.body.waiver == "NULL"?req.body.waiver:"'"+req.body.waiver+"'")+", "+req.body.ProfileCode+", "+req.body.ContractType+", '"+
    req.body.InvoiceFormat+"', '"+req.body.ClientContractPONumber+"', "+ req.body.OutsideMarkup +", "+
    (req.body.SpecialBillingInstructins == "NULL"?"NULL":"'"+req.body.SpecialBillingInstructins+"'") + ", "+ req.body.PREVAILING_WAGE +", " + (req.body.BinderSize == "NULL"?"NULL":req.body.BinderSize) +", '"+req.body.DescriptionService+"');";

    const request = pool.request();
    request.query(query, (error, result) => {
        if(error) {
            console.error(error);
            res.send(JSON.stringify(error));
        }
        else {
            // Add Billing group team and keywords.
            let teamArr = req.body.TeamMembers.split(',');
            let teamQuery = '';
            teamArr.forEach((memb) => {
                teamQuery += "INSERT INTO BillingGroupTeam VALUES ("+result.recordset[0].ID+", "+memb+");";
            });
            let keyArr = req.body.KeyIDs.split(',');
            keyArr.forEach((key) => {
                if(!isNaN(key) && key != null && key != '') { // If-statement in case the user uses custom keywords and no pre-defines ones.
                    teamQuery += "INSERT INTO BillingGroupKeywords VALUES ("+result.recordset[0].ID+", "+key+");";
                }
            });
            // teamQuery += "UPDATE Promos SET is_project = 1, proj_ID = " + result.recordset[0].ID + " WHERE ID = " + req.body.ID + ";"
            request.query(teamQuery, (uwu) => {
                if(uwu) {
                    console.log("Error with query:\n" + teamQuery);
                    console.error(uwu);
                }
            });
            if(fs.existsSync(dir)) {
                dir += '/' + req.body.BillingNum + '-' + removeSpace(removeEscapeQuote(req.body.BillingName));
                if(!fs.existsSync(dir)) {
                    fs.mkdir((dir), err => {
                        if(err){
                            throw err;
                        }
                    });
                }
                // console.log("Directory is " + dir);
                createDirectories(dir, false, removeEscapeQuote(req.body.CreatedBy) + " - " + mydate.toString());
                const doc = new PDFDocument();
                doc.pipe(fs.createWriteStream(dir + '/Setup/'+ req.body.BillingNum +'.pdf'));
                // Content of PDF.
                (async function(){
                    // table
                    for(let ifNull of Object.keys(req.body)) {
                        if(req.body[ifNull] == null || req.body[ifNull] == undefined || req.body[ifNull] == 'NULL' || req.body[ifNull] == '') {
                            req.body[ifNull] = "None";
                        }
                    }
                    const table = {
                    title: req.body.ProjectId,
                    subtitle: 'Billing group ' + req.body.BillingNum + ' created for ' + req.body.ProjectId,
                    headers: ["Billing", "Input", "Project", "Info"],
                    rows: [
                            [ "Billing Group #", req.body.BillingNum, "Project ID", req.body.ProjectId],
                            [ "Billing Title", req.body.BillingName, "Project Title", removeEscapeQuote(req.body.ProjectName).toString()],
                            ['Group Manager', req.body.NewMgrName, "Project Manager", removeEscapeQuote(req.body.Manager).toString()],
                            ["Start Date", formatDate(req.body.StartDate),'-','-'],
                            ["Close Date", formatDate(req.body.CloseDate),'-','-'],
                            ["QAQC Person", removeEscapeQuote(req.body.QAQCName).toString(),'-','-'],
                            ["Team Members", removeEscapeQuote(req.body.TeamMemberNames).toString(),'-','-'],
                            ["Location", removeEscapeQuote(req.body.ProjectLocation).toString(),'-','-'],
                            ["Latitude", removeEscapeQuote(req.body.Latitude).toString(),'-','-'],
                            ["Longitude", removeEscapeQuote(req.body.Longitude).toString(),'-','-'],
                            ["Keywords", removeEscapeQuote(req.body.ProjectKeywords).toString(),'-','-'],
                            ["Service Area", removeEscapeQuote(req.body.ServiceArea).toString(),'-','-'],
                            ["Profile Code", removeEscapeQuote(req.body.ProfileCodeName).toString(),'-','-'],
                            ["Total Contract", removeEscapeQuote(req.body.TotalContract).toString(),'-','-'],
                            ["Retainer", removeEscapeQuote((req.body.Retainer == "Waived by X"?"Waived by " + req.body.waiver:(req.body.Retainer == "Enter Amount"?req.body.RetainerPaid:req.body.Retainer))).toString(),'-','-'],
                            ["Contract Type",req.body.contactTypeName,'-','-'],
                            ["Client Contract/PO #", req.body.ClientContractPONumber,'-','-'],
                            ["Outside Markup", req.body.OutsideMarkup,'-','-'],
                            ["Prevailing Wage", (req.body.PREVAILING_WAGE == 1?"Yes":"No"),'-','-'],
                            ["Billing Instructions", removeEscapeQuote(req.body.SpecialBillingInstructins).toString(),'-','-'],
                            ["AutoCAD Project", (req.body.AutoCAD_Project == 1)?'Yes':'No','-','-'],
                            ["GIS Project", (req.body.GIS_Project == 1)?'Yes':'No','-','-'],
                            ["Binder Size", (req.body.BinderSize == null || req.body.BinderSize == "NULL" || req.body.BinderSize == "None"?"None":req.body.BinderSize + " inch"),'Created On',mydate.toString()],
                            ["Description of Services", removeEscapeQuote(req.body.DescriptionService).toString(),'Created By',removeEscapeQuote(req.body.CreatedBy).toString()]
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

                    // Start of array of who to notify of this creation.
                    const admins = [jsonData.email.admins];
                
                    admins.push((req.body.ProjectId[0].length > 6?getAdmin(req.body.ProjectId[0], req.body.ProjectId[6]):getAdmin(req.body.ProjectId[0], 'Z')));
                    // Query for the Project manager's contact email.
                    request.query('SELECT email FROM Staff WHERE ID = '+ req.body.NewMgr +' AND email IS NOT NULL', (awNo, emails) => {
                        if(awNo) {
                            console.log('Could not send email.  The following error occurred instead:\n' + awNo);
                        }
                        else {
                            emails.recordset.forEach(email => {
                                if(!admins.includes(email.email + '@shn-engr.com') && email.email != undefined && email.email != 'undefined' && email.email != null && email.email != 'NULL') {
                                    admins.push(email.email + '@shn-engr.com');
                                }
                            });
                        }
                        // Finally, send out email notice.
                        emailPersonel(req.body.BillingNum +'.pdf', dir + '/Setup/'+ req.body.BillingNum +'.pdf', 'Billing Group ' + req.body.BillingNum + ' has been initialized for Project ' + req.body.ProjectId +'!<br>See PDF for more.', admins, 'Billing group ' + req.body.BillingNum + ' added to project ' + req.body.ProjectId);
                    });
                })();
                res.send(JSON.parse('{"Status":"Success"}'));
            }
        }
    });
});

/**
 * searchPromos API searches promos and is used by the search function for Promo To Project.
 */

app.post('/searchPromos', jsonParser, (req, res) => {
    const request = pool.request();
    request.query('SELECT * FROM Promos INNER JOIN PromoTeam ON Promos.ID = PromoTeam.promo_id RIGHT JOIN PromoKeywords ON Promos.ID = PromoKeywords.promo_id LEFT JOIN Staff ON Promos.manager_id = Staff.ID WHERE (Promos.promo_id = \''+ req.body.PromoId + '\' OR Promos.promo_id LIKE \''+ req.body.PromoId +'_\') AND Promos.is_project = 0 AND Promos.closed = 0;', (error, data) => {
        if(error) {
            console.error(error);
            res.send(JSON.parse(JSON.stringify(error)));
        }
        else {
            res.send(JSON.parse(JSON.stringify(data.recordset)));
        }
    });
})

/**
 * rolodex API used to find client information on the rolodex page.
 */

app.post('/rolodex', jsonParser, (req, res) => {
    // Starting of query.
    let query = 'SELECT * FROM Rolodex WHERE ';
    if(req.body.by == 'Job') {
        query += 'job_title LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'First') {
        query += 'first_name LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Last') {
        query += 'last_name LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Comp') {
        query += 'client_company LIKE \'%'+ req.body.search +'%\'';
    }
    else { // Default "All."
        query += 'client_company LIKE \'%'+ req.body.search +'%\' OR client_abbreviation LIKE \'%'+ req.body.search +'%\' OR first_name LIKE \'%'+ req.body.search +'%\' OR last_name LIKE \'%'+ req.body.search +'%\' OR relationship LIKE \'%'+ req.body.search +'%\' OR job_title LIKE \'%'+ req.body.search +'%\' OR address1 LIKE \'%'+ req.body.search +'%\' OR address2 LIKE \'%'+ req.body.search +'%\' OR city LIKE \'%'+ req.body.search +'%\' OR state LIKE \'%'+ req.body.search +'%\' OR zip_code LIKE \'%'+ req.body.search +'%\' OR work_phone LIKE \'%'+ req.body.search +'%\'OR extension LIKE \'%'+ req.body.search +'%\' OR home_phone LIKE \'%'+ req.body.search +'%\' OR cell LIKE \'%'+ req.body.search +'%\' OR fax LIKE \'%'+ req.body.search +'%\' OR email LIKE \'%'+ req.body.search +'%\' OR last_edited LIKE \'%'+ req.body.search +'%\'';
    }
    query += ' ORDER BY last_name, first_name, client_company;';
    query += 'SELECT ID, project_id, client_company, first_name, last_name, job_title, mailing_list, address1, address2, city, state, zip_code, work_phone, home_phone, cell, email, fax, created FROM Projects WHERE ';
    if(req.body.by == 'Job') {
        query += 'job_title LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'First') {
        query += 'first_name LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Last') {
        query += 'last_name LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Comp') {
        query += 'client_company LIKE \'%'+ req.body.search +'%\'';
    }
    else { // Default "All."
        query += 'client_company LIKE \'%'+ req.body.search +'%\' OR client_abbreviation LIKE \'%'+ req.body.search +'%\' OR first_name LIKE \'%'+ req.body.search +'%\' OR last_name LIKE \'%'+ req.body.search +'%\' OR relationship LIKE \'%'+ req.body.search +'%\' OR job_title LIKE \'%'+ req.body.search +'%\' OR address1 LIKE \'%'+ req.body.search +'%\' OR address2 LIKE \'%'+ req.body.search +'%\' OR city LIKE \'%'+ req.body.search +'%\' OR state LIKE \'%'+ req.body.search +'%\' OR zip_code LIKE \'%'+ req.body.search +'%\' OR work_phone LIKE \'%'+ req.body.search +'%\'OR ext LIKE \'%'+ req.body.search +'%\' OR home_phone LIKE \'%'+ req.body.search +'%\' OR cell LIKE \'%'+ req.body.search +'%\' OR fax LIKE \'%'+ req.body.search +'%\' OR email LIKE \'%'+ req.body.search +'%\'';
    }
    query += ' ORDER BY last_name, first_name, client_company, project_id;';
    query += 'SELECT ID, promo_id, client_company, first_name, last_name, job_title, address1, address2, city, state, zip_code, work_phone, home_phone, cell, email, fax, created FROM Promos WHERE ';
    if(req.body.by == 'Job') {
        query += 'job_title LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'First') {
        query += 'first_name LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Last') {
        query += 'last_name LIKE \'%'+ req.body.search +'%\'';
    }
    else if(req.body.by == 'Comp') {
        query += 'client_company LIKE \'%'+ req.body.search +'%\'';
    }
    else { // Default "All."
        query += 'client_company LIKE \'%'+ req.body.search +'%\' OR client_abbreviation LIKE \'%'+ req.body.search +'%\' OR first_name LIKE \'%'+ req.body.search +'%\' OR last_name LIKE \'%'+ req.body.search +'%\' OR relationship LIKE \'%'+ req.body.search +'%\' OR job_title LIKE \'%'+ req.body.search +'%\' OR address1 LIKE \'%'+ req.body.search +'%\' OR address2 LIKE \'%'+ req.body.search +'%\' OR city LIKE \'%'+ req.body.search +'%\' OR state LIKE \'%'+ req.body.search +'%\' OR zip_code LIKE \'%'+ req.body.search +'%\' OR work_phone LIKE \'%'+ req.body.search +'%\'OR ext LIKE \'%'+ req.body.search +'%\' OR home_phone LIKE \'%'+ req.body.search +'%\' OR cell LIKE \'%'+ req.body.search +'%\' OR fax LIKE \'%'+ req.body.search +'%\' OR email LIKE \'%'+ req.body.search +'%\'';
    }
    query += ' ORDER BY last_name, first_name, client_company, promo_id;';
    const request = pool.request();
    request.query(query, (error, ProjData) => {
        if(error) {
            console.error(error);
            res.send(JSON.parse(JSON.stringify(error)));
        }
        else {
            const result = new Array();
            result.push(ProjData.recordsets[0]);
            result.push(ProjData.recordsets[1]);
            result.push(ProjData.recordsets[2]);
            res.send(JSON.parse(JSON.stringify(result)));
        }
    });
});

/**
 * Updates client info based on user input on the Rolodex page.
 */

app.post('/contacts', jsonParser, (req, res) => {
    const sql = (req.body.ID === null? 'INSERT INTO Rolodex (client_company, client_abbreviation, first_name, last_name, relationship, job_title, address1, address2, city, state, zip_code, work_phone, extension, home_phone, cell, fax, email, last_edited) '+
    'VALUES ('+ (req.body.client_company == 'NULL'?'NULL':"'"+req.body.client_company+"'") + ', '+
    (req.body.client_abbreviation == 'NULL'?'NULL':"'"+req.body.client_abbreviation+"'")+', '+
    '\''+ req.body.first_name +'\', '+
    '\''+ req.body.last_name +'\', '+
    (req.body.relationship == 'NULL'?'NULL':"'"+req.body.relationship+"'") +', '+
    (req.body.job_title == '' || req.body.job_title == null || req.body.job_title == 'NULL'?'NULL':'\''+req.body.job_title + '\'') + ', '+
    (req.body.address1 == 'NULL'?'NULL':"'"+req.body.address1+"'") + ', '+
    (req.body.address2 == 'NULL'?'NULL':"'"+req.body.address2+"'") + ', '+
    (req.body.city == 'NULL'?'NULL':"'"+req.body.city+"'") + ', '+
    '\'' + req.body.state + '\', '+
    (req.body.zip_code == 'NULL'?'NULL':"'"+req.body.zip_code+"'") + ', '+
    (req.body.work_phone == 'NULL'?'NULL':"'"+req.body.work_phone+"'") + ', ' +
    (req.body.extension == 'NULL'?'NULL':"'"+req.body.extension+"'") + ', ' +
    (req.body.home_phone == 'NULL'?'NULL':"'"+req.body.home_phone+"'") + ', ' +
    (req.body.cell == 'NULL'?'NULL':"'"+req.body.cell+"'") + ', ' +
    (req.body.fax == 'NULL'?'NULL':"'"+req.body.fax+"'") + ', ' +
    (req.body.email == 'NULL'?'NULL':"'"+req.body.email+"'") + ', ' +
    (req.body.CreatedBy == 'NULL'?'NULL':'\''+req.body.CreatedBy + '\'')+
    ');'
    :'UPDATE Rolodex SET client_company = '+ (req.body.client_company == 'NULL'?'NULL':"'"+req.body.client_company+"'") +
    ', client_abbreviation = '+ (req.body.client_abbreviation == 'NULL'?'NULL':"'"+req.body.client_abbreviation+"'") +
    ', first_name = \''+ req.body.first_name + 
    '\', last_name = \'' + req.body.last_name +
    '\', relationship = '+(req.body.relationship == 'NULL'?'NULL':"'"+req.body.relationship+"'") +
    ', job_title = ' + (req.body.job_title == '' || req.body.job_title == null || req.body.job_title == 'NULL'?'NULL':'\''+req.body.job_title + '\'') + ', '+
    'address1 = ' + (req.body.address1 == 'NULL'?'NULL':"'"+req.body.address1+"'") +
    ', address2 = ' + (req.body.address2 == 'NULL'?'NULL':"'"+req.body.address2+"'") +
    ', city = ' + (req.body.city == 'NULL'?'NULL':"'"+req.body.city+"'") +
    ', state = \'' + req.body.state +
    '\', zip_code = ' + (req.body.zip_code == 'NULL'?'NULL':"'"+req.body.zip_code+"'") +
    ', work_phone = ' + (req.body.work_phone == 'NULL'?'NULL':"'"+req.body.work_phone+"'") +
    ', extension = ' + (req.body.extension == 'NULL'?'NULL':"'"+req.body.extension+"'") +
    ', home_phone = ' + (req.body.home_phone == 'NULL'?'NULL':'\''+req.body.home_phone + '\'')  +
    ', cell = '+ (req.body.cell == 'NULL'?'NULL':'\''+req.body.cell + '\'') +
    ', fax = ' + (req.body.fax == 'NULL'?'NULL':'\''+req.body.fax + '\'') +
    ', email = ' + (req.body.email == 'NULL'?'NULL':'\''+req.body.email + '\'')+
    ', created = GETDATE()' +
    ', last_edited = ' + (req.body.CreatedBy == 'NULL'?'NULL':'\''+req.body.CreatedBy + '\'')+ 
    ' WHERE ID = '+ req.body.ID +';');
    // console.log(sql);
    const request = pool.request();
    request.query(sql, (err, deez) => {
        if(err) {
            console.error(err + '\n' + sql);
            res.statusCode = 500;
            res.send(JSON.parse(JSON.stringify(err)));
        }
        else {
            res.statusCode = 200;
            res.send(JSON.parse('{"Status":"Success"}'));
        }
    });
});


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
 * @returns String
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

function createDirectories(root, gis, userLog) {
    // All directories needed.
    const dir = ['Corr', 'Data/MatLab', 'Data/RefDocs', 'Data/SafetyMeetingForms', 'Dwgs/BY-OTHERS', 'Dwgs/PDF', 'Dwgs/RECORD-DRAWINGS', 'Dwgs/DROPBOX', 'Figs', 'Inv', 'Photos', 'Promos', 'PUBS/agr', 'PUBS/Corr', 'PUBS/data', 'PUBS/inv', 'PUBS/promos', 'PUBS/rpts', 'Rpts', 'Setup'];
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
    // Write the content to the file
    fs.writeFile(root + '/log.txt', userLog + '\n', (err) => {
        if (err) {
            console.error('Error creating the log file in '+root+':', err);
        }
        else {
            let folderPath = '.\\' + root.replace(/\//g,"\\") + '\\log.txt';
            let accessString = 'GR';
            let permissions = new winPermissionsManager({folderPath});
            let domain = 'SHN-ENGR';
            let name = 'Domain Users';
            permissions.addRight({domain, name, accessString});
            name = 'Marketing';
            permissions.addRight({domain, name, accessString});
            name = 'Administrator';
            accessString = 'GA';
            permissions.addRight({domain, name, accessString});
            permissions.applyRights({disableInheritance:true});
        }
    });
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
        from: '"Initiation Notice" <'+jsonData.email.user+'>',
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
    refresh(CLIENT_ID, CLIENT_SECRET, ((ZOHO.refresh_token === undefined)?REFRESH_TOKEN:ZOHO.refresh_token), SCOPE).then(token => {
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
// pool.open();
https.createServer(options, app, function (req, res) {
    res.statusCode = 200;
  }).listen(3000);