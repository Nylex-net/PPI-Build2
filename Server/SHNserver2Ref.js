// npm libraries.
'use strict';
const ADODB = require('node-adodb');
const express = require('express');
// const cluster = require('cluster');
const cors = require('cors');
// const { useCallback } = require('react');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit-table');
const { fontSize } = require('pdfkit');
const { dirname } = require('path');
const https = require('https');
const { create } = require('domain');
app.use(cors());
var jsonParser = bodyParser.json();
const DATABASE_PATH = "C:\\Users\\administrator\\Documents\\PPI\\Database\\SHN_Project_Backup.mdb;";
const jsonData = require('./config.json');

// Directory for production environment.
// process.chdir("P:\\");

// Directory for testing environment.
process.chdir("U:\\Eureka\\Nylex\\test\\Mock_Drive");
const PATH = "U:/Eureka/Nylex/test/Mock_Drive";
// Certificates
const options = {
    key: fs.readFileSync('C:\\xampp\\apache\\conf\\ssl.key\\key.pem'),
    cert: fs.readFileSync('C:\\xampp\\apache\\conf\\ssl.crt\\cert.pem')
};

// Zoho configuration
const CODE = jsonData.ZohoAPI.code; // Create code from self client in Zoho API console.
const CLIENT_ID = jsonData.ZohoAPI.client_id;
const CLIENT_SECRET = jsonData.ZohoAPI.client_secret;
const REFRESH_TOKEN = jsonData.ZohoAPI.refresh_token; // Replace with refresh token if available. Otherwise, set to null.
const SCOPE = jsonData.ZohoAPI.scope;
const ORG_ID = jsonData.ZohoAPI.org_id;
let ZOHO = {};
oauthgrant(CODE, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, SCOPE).then((data)=> {
    ZOHO = data;
    if(data.hasOwnProperty("refresh_token")) {
        console.log("refresh_token: " + data.refresh_token);
    }
});

// projects API returns the project info in projects, plus the first and last name of the Project Manager.

app.post('/projects', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE (Projects.Projectid LIKE \'%'+ req.body.projID +'%\' OR Projects.PromoId LIKE \'%'+ req.body.projID +'%\') AND (Closed_by_PM IS NULL OR Closed_by_PM = 0) ORDER BY Projects.Projectid IS NOT NULL, Projects.PromoId IS NULL, Contacts.Last, Contacts.First, Projects.ClientCompany1, Projects.ProjectTitle, Projects.DescriptionService')
    .then(data => {
        // Display formatted JSON data
        res.send(JSON.stringify(data));
        // callback(res);
    })
    .catch(error => {
        console.error('Error occured while accessing database: ' + error);
        connection.query('SELECT ID, First, Last From Contacts').then(contacts => { // Gets all employee names and their IDs.
            let contactMap = new Map();
            for(let contact of contacts) { // Store employees in map object for ease of access.
                contactMap.set(contact.ID.toString(), contact.First.trim() + ';' + contact.Last.trim());
            }
            // Now search the projects database.
            connection.query('SELECT * FROM Projects WHERE (Closed_by_PM IS NULL OR Closed_by_PM = 0) AND (Projectid LIKE \'%'+ req.body.projID +'%\' OR PromoId LIKE \'%'+ req.body.projID +
            '%\') ORDER BY Projectid IS NOT NULL, PromoId IS NULL, ClientCompany1, ProjectTitle, DescriptionService').then(projData => {
                // Associate each project manager to the cooresponding project they're managing.
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
                res.send(JSON.stringify(projData));
            })
            // If all fails, send back error.
        }).catch(err => res.send(JSON.stringify(err)));
        // return callback(new Error("An error has occurred"));
    })
});

// Used to close Projects by setting "Closed_by_PM" to -1 and moving files to the office's closed projects folder.

app.post('/closeMe', jsonParser, (req, res) => {
    const myJson = req.body;
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.execute("UPDATE Projects SET Closed_by_PM = -1 WHERE Projectid = \'"+ myJson.projID +"\' OR PromoId = \'"+ myJson.projID +"\'").then(() => {
        let nutty = moveProject(myJson.projID, myJson.ClosedBy); // function returns null if directory is not found.
        let response = '{"Status":"Success"}';
        if(nutty == null) {
            response = '{"Status":"Bruh"}';
        }
        res.send(JSON.parse(JSON.stringify(response)));
    }).catch(err => { // send error message to client and print error message in console.
        createTicket(err, "Could not close:");
        res.send(JSON.parse(JSON.stringify(err)));
        console.log(err);
    });
});

/**
 * General Default search of database.
 */
app.post('/search', jsonParser, (req, res) => {
    let myResponse = 'Null response';
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
     // console.log('Project Number is ' + req.body.ProjectNumber + ', Description is ' + req.body.Description + ', Project title is ' + req.body.ProjectTitle);
     // INNER JOIN Contacts ON Contacts.ID = Cint(Projects.ProjectMgr)
     connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE Projects.Projectid LIKE \'%'+ req.body.entry +
    '%\' OR Projects.PromoId LIKE \'%'+ req.body.entry +'%\' OR Projects.ProjectMgr = (SELECT TOP 1 Contacts.ID FROM Contacts WHERE Contacts.Last LIKE \'%'+ req.body.entry +'%\' OR Contacts.First LIKE \'%'+ req.body.entry +'%\') OR Projects.ProjectLoation LIKE \'%'+ req.body.entry +
    '%\' OR Projects.ProjectKeywords LIKE \'%'+ req.body.entry +'%\' OR Projects.ClientCompany1 LIKE \'%'+ req.body.entry +'%\' OR Projects.ClientContact1 LIKE \'%'+ req.body.entry +
    '%\' OR Projects.ClientContactFirstName1 LIKE \'%'+ req.body.entry +'%\' OR Projects.ClientContactLastName1 LIKE \'%'+ req.body.entry +
    '%\' OR Projects.ProfileCode LIKE \'%'+ req.body.entry +'%\' OR Projects.DescriptionService LIKE \'%'+ req.body.entry +
    '%\' ORDER BY Projects.Projectid IS NOT NULL, Projects.PromoId IS NULL, Projects.Projectid, Projects.PromoId, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService')
    .then(data => {
        data = JSON.stringify(data);
        myResponse = data;
        res.send(data);
    })
    .catch(error => { // Previous query doesn't always work and returns a datatype mismatch error, so we run the alternative method.
         console.log(error);
        connection.query('SELECT ID, First, Last From Contacts').then(contacts => { // Gets all employee names and their IDs.
            let contactMap = new Map();
            for(let contact of contacts) { // Store employees in map object for ease of access.
                contactMap.set(contact.ID.toString(), contact.First.trim() + ';' + contact.Last.trim());
            }
            // Now search the projects database.
            connection.query('SELECT * FROM Projects WHERE Projectid LIKE \'%'+ req.body.entry +'%\' OR ProjectLoation LIKE \'%'+ req.body.entry+
            '%\' OR PromoId LIKE \'%'+ req.body.entry +'%\' OR ProjectKeywords LIKE \'%'+ req.body.entry +
            '%\' OR ClientCompany1 LIKE \'%'+ req.body.entry +'%\' OR ClientContact1 LIKE \'%'+ req.body.entry + '%\' OR ClientContactFirstName1 LIKE \'%'+ req.body.entry +
            '%\' OR ClientContactLastName1 LIKE \'%'+ req.body.entry +'%\' OR ProfileCode LIKE \'%'+ req.body.entry +'%\' OR DescriptionService LIKE \'%'+ req.body.entry +
            '%\' ORDER BY Projectid IS NOT NULL, PromoId IS NULL, Projectid, PromoId, BillGrp, ClientCompany1, DescriptionService').then(projData => {
                // Associate each project manager to the cooresponding project they're managing.
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
                res.send(JSON.stringify(projData));
            })
            // If all fails, send back error.
        }).catch(err => res.send(JSON.stringify(err)));
    });
});

/**
 * Gets projects with matching Project ID.
 */

app.post('/searchProject', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE Projects.Projectid LIKE \'%'+ req.body.entry +
    '%\' ORDER BY Projects.Projectid IS NOT NULL, ISNULL(Projects.PromoId), Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService')
    .then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        console.log(error);
        connection.query('SELECT ID, First, Last From Contacts').then(contacts => { // Gets all employee names and their IDs.
            let contactMap = new Map();
            for(let contact of contacts) { // Store employees in map object for ease of access.
                contactMap.set(contact.ID.toString(), contact.First.trim() + ';' + contact.Last.trim());
            }
            // Now search the projects database.
            connection.query('SELECT * FROM Projects WHERE Projectid LIKE \'%'+ req.body.entry +'%\' ORDER BY Projectid IS NOT NULL, PromoId IS NULL, Projectid, PromoId, BillGrp, ClientCompany1, DescriptionService').then(projData => {
                // Associate each project manager to the cooresponding project they're managing.
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
                res.send(JSON.stringify(projData));
            })
            // If all fails, send back error.
        }).catch(err => res.send(JSON.stringify(err)));
    });
});

/**
 * Gets projects with matching Promo ID.
 */

app.post('/searchPromo', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE Projects.ProjectMgr IS NOT NULL AND Projects.PromoId LIKE \'%'+ req.body.entry +
    '%\' ORDER BY ISNULL(Projects.Projectid), Projects.PromoId, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService')
    .then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        console.log(error);
        connection.query('SELECT ID, First, Last From Contacts').then(contacts => { // Gets all employee names and their IDs.
            let contactMap = new Map();
            for(let contact of contacts) { // Store employees in map object for ease of access.
                contactMap.set(contact.ID.toString(), contact.First.trim() + ';' + contact.Last.trim());
            }
            // Now search the projects database.
            connection.query('SELECT * FROM Projects WHERE Projects.ProjectMgr IS NOT NULL AND Projects.PromoId LIKE \'%'+ req.body.entry +'%\' ORDER BY ISNULL(Projects.Projectid), Projects.PromoId, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService').then(projData => {
                // Associate each project manager to the cooresponding project they're managing.
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
                res.send(JSON.stringify(projData));
            })
            // If all fails, send back error.
        }).catch(err => res.send(JSON.stringify(err)));
    });
});

/**
 * Gets projects with matching Keywords.
 */

app.post('/searchKeyword', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE Projects.ProjectKeywords LIKE \'%'+ req.body.entry +
    '%\' ORDER BY Projects.Projectid IS NOT NULL, Projects.PromoId IS NULL, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService')
    .then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        console.log(error);
        res.send(JSON.stringify(error));
    });
});

/**
 * Gets projects with matching Titles.
 */

app.post('/searchTitle', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE Projects.ProjectTitle LIKE \'%'+ req.body.entry +
    '%\' ORDER BY Projects.Projectid IS NOT NULL, Projects.PromoId IS NULL, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService')
    .then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        console.log(error);
        connection.query('SELECT ID, First, Last From Contacts').then(contacts => { // Gets all employee names and their IDs.
            let contactMap = new Map();
            for(let contact of contacts) { // Store employees in map object for ease of access.
                contactMap.set(contact.ID.toString(), contact.First.trim() + ';' + contact.Last.trim());
            }
            // Now search the projects database.
            connection.query('SELECT * FROM Projects WHERE Projects.ProjectTitle LIKE \'%'+ req.body.entry +'%\' ORDER BY ISNULL(Projects.Projectid), Projects.PromoId, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService').then(projData => {
                // Associate each project manager to the cooresponding project they're managing.
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
                res.send(JSON.stringify(projData));
            })
            // If all fails, send back error.
        }).catch(err => res.send(JSON.stringify(err)));
    });
});

/**
 * Gets projects with matching Description of Services.
 */

app.post('/searchDesc', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT Projects.*, Contacts.First, Contacts.Last FROM Projects INNER JOIN Contacts ON Val(Projects.ProjectMgr) = Contacts.ID WHERE Projects.DescriptionService LIKE \'%'+ req.body.entry +
    '%\' ORDER BY Projects.Projectid IS NOT NULL, Projects.PromoId IS NULL, Projects.BillGrp, Projects.ClientCompany1, Projects.DescriptionService')
    .then(data => {
        res.send(JSON.stringify(data));
    }).catch(error => {
        console.log(error);
        res.send(JSON.stringify(error));
    });
});

/**
 *  Gets the QAQC Manager via ID.
 */

app.post('/qaqc', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT First, Last FROM Contacts WHERE ID = '+ req.body.id)
    .then(person => {
        res.send(JSON.stringify(person));
    }).catch(err => {
        res.send(JSON.stringify(err));
    });
});

// Returns IDs from recognizable keywords, assuming the keywords are split using " || ".
// This may not work for older project initiations, as the database entries don't always conform to the expected format.
app.post('/keyName', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    let keyArray = req.body.keyText.split(/,| \|\| /g);
    let keyQuery = '';
    for(let word of keyArray) {
        keyQuery += 'Keyword = \'' + word + '\' OR ';
    }
    keyQuery = keyQuery.substring(0, keyQuery.length - 4);
    connection.query('SELECT ID FROM Keywords WHERE ' + keyQuery).then(keyIDs => {
        res.send(JSON.parse(JSON.stringify(keyIDs)));
    }).catch(err => {
        console.log(err);
        res.send(JSON.parse(JSON.stringify(err)));
    });
});

// API used to update a project with sent information.

app.post('/updater', jsonParser, (req, res) => {
    // Build and find directory of the original project/promo.
    // let dir = 'P:';
    let isProject = (req.body.Projectid != undefined && req.body.Projectid != null && req.body.Projectid != '')?true:false;
    const num = (req.body.Projectid != undefined && req.body.Projectid != null && req.body.Projectid != '')?req.body.Projectid:req.body.PromoId;
    let dir = PATH + ((isProject)?getDir(req.body.Projectid[0]):getDir(req.body.PromoId[0]));
    dir += (!isNaN(num[1] + num[2]) && Number(num[1] + num[2]) > new Date().getFullYear().toString().slice(-2))?'/19' + num[1] + num[2]:'/20' + num[1] + num[2];
    dir += (isProject)?'':'/Promos';
    if(!fs.exists(dir)) {
        fs.mkdir((dir), err => {
            if(err){
                createTicket(err, "Promos folder not found:");
                throw err;
            }
        });
    }
    let dirFiles = fs.readdirSync(dir);
    let found = false;
    for(let file of dirFiles) {
        if(file.substring(0, 12).includes(num)) {
            dir += '/' + file;
            found = true;
            break;
        }
    }
    if(!found) {
        dir += '/' + num;
        fs.mkdir((dir), err => {
            if(err){
                createTicket(err, "Project/Promo folder not found:");
                throw err;
            }
        });
    }

    // Build the SQL statement.

    const query = 'UPDATE Projects SET ProjectTitle = \''+ req.body.ProjectTitle.replace(/'/gi, "''") + '\', ProjectMgr = \'' + req.body.ProjectMgr.replace(/'/gi, "''") + '\', AlternateTitle = \''+ req.body.AlternateTitle +'\', QA_QCPerson = \'' + req.body.QA_QCPerson.replace(/'/gi, "''") + '\', TeamMembers = \''+ req.body.TeamMembers.replace(/'/gi, "''") +'\', StartDate = \'' + req.body.StartDate.replace(/'/gi, "''") + '\', CloseDate = \''+ req.body.CloseDate.replace(/'/gi, "''") +'\', ProjectLoation = \''+ req.body.ProjectLoation.replace(/'/gi, "''") +'\', ' + ((!isNaN(req.body.Lattitude) && !isNaN(req.body.Longitude))?'Lattitude = '+ req.body.Lattitude + ', Longitude = '+ req.body.Longitude + ', ':'')+
    'ProjectKeywords = \''+ req.body.ProjectKeywords.replace(/'/gi, "''") +'\', SHNOffice = \'' + req.body.SHNOffice.replace(/'/gi, "''") + '\', ToatlContract = \'' + req.body.ToatlContract.replace(/'/gi, "''") + '\', RetainerPaid = \'' + req.body.RetainerPaid.replace(/'/gi, "''") + '\', ProfileCode = \'' + req.body.ProfileCode.replace(/'/gi, "''") + '\', ServiceArea = \''+ req.body.ServiceArea.replace(/'/gi, "''") + '\', ContractType = \'' + req.body.ContractType.replace(/'/gi, "''") + '\', InvoiceFormat = \'' + req.body.InvoiceFormat.replace(/'/gi, "''") + '\', PREVAILING_WAGE = \''+ req.body.PREVAILING_WAGE.replace(/'/gi, "''") +'\', OutsideMarkup = \'' + req.body.OutsideMarkup + '\', SpecialBillingInstructins = \'' + req.body.SpecialBillingInstructins.replace(/'/gi, "''") + '\', SEEALSO = \'' + req.body.SEEALSO.replace(/'/gi, "''") + '\', Project_Specifications = ' + req.body.Project_Specifications +
    ', AutoCAD_Project = ' + req.body.AutoCAD_Project + ', GIS_Project = ' + req.body.GIS_Project + ', ClientCompany1 = \'' + req.body.ClientCompany1.replace(/'/gi, "''") + '\', OfficeMailingLists1 = \'' + req.body.OfficeMailingLists1.replace(/'/gi, "''") + '\','+
    'ClientAbbrev1 = \'' + req.body.ClientAbbrev1.replace(/'/gi, "''") + '\', ClientContactFirstName1 = \'' + req.body.ClientContactFirstName1.replace(/'/gi, "''") + '\', ClientContactLastName1 = \'' + req.body.ClientContactLastName1.replace(/'/gi, "''") + '\', Title1 = \'' + req.body.Title1.replace(/'/gi, "''") + '\', Address1_1 = \'' + req.body.Address1_1.replace(/'/gi, "''") + '\', Address2_1 = \'' + req.body.Address2_1.replace(/'/gi, "''") + '\', City1 = \'' + req.body.City1.replace(/'/gi, "''") + '\', State1 = \'' + req.body.State1.replace(/'/gi, "''") + '\', Zip1 = \'' + req.body.Zip1.replace(/'/gi, "''") + '\', PhoneW1 = \''+ req.body.PhoneW1.replace(/'/gi, "''") + '\', PhoneH1 = \'' + req.body.PhoneH1.replace(/'/gi, "''") + '\', Cell1 = \'' + req.body.Cell1.replace(/'/gi, "''") + '\', Fax1 = \'' + req.body.Fax1.replace(/'/gi, "''") + '\', Email1 = \'' + req.body.Email1.replace(/'/gi, "''") + '\', '+
    'BinderSize = \'' + req.body.BinderSize.replace(/'/gi, "''") + '\', BinderLocation = \'' + req.body.BinderLocation.replace(/'/gi, "''") + '\', DescriptionService = \''+  req.body.DescriptionService.replace(/'/gi, "''") + '\', DTStamp = \'' + req.body.CreatedOn + '\' WHERE Projectid ' +  ((req.body.Projectid == null)?'IS NULL':'= \''+req.body.Projectid + '\'') + ' AND PromoId ' + ((req.body.PromoId == null)?'IS NULL':'= \''+req.body.PromoId + '\'');
    // If latitude and/or longitude aren't numbers, don't bother inserting them into the database.

    // query += (req.body.Projectid != null && req.body.Projectid != undefined && req.body.Projectid.length >=6 && !isNaN(req.body.Projectid))?' WHERE Projectid = \'' + req.body.Projectid + '\'':' WHERE PromoId = \'' + req.body.PromoId + '\'';
    // console.log(query);
    // Connect to database.
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);

    // Executes the query.
    connection.execute(query)
    .then(() => { // Everything that happens as a result of a successful execution.
        // Build PDF in project/promo.
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(dir + '/'+num+'.pdf'));
        for(let ifNull of Object.keys(req.body)) {
            if(req.body[ifNull] == null || req.body[ifNull] == undefined) {
                req.body[ifNull] = "None";
            }
        }
        // PDF table creation runs asynchronously.
        (async function(){
            // Table data.
            const table = {
              title: (req.body.Projectid != null && req.body.Projectid != undefined)?req.body.Projectid:req.body.PromoId,
              headers: ["Name", "User Input", "Client", "Info"],
              rows: [
                [ "Project/Promo ID", (req.body.Projectid != null && req.body.Projectid != undefined && req.body.Projectid != '')?req.body.Projectid:req.body.PromoId, "Client Company", req.body.ClientCompany1],
                [ "Title", req.body.ProjectTitle, "Client Abbreviation", (req.body.ClientAbbrev1 == null || req.body.ClientAbbrev1 == undefined || req.body.ClientAbbrev1 == '')?"none":req.body.ClientAbbrev1],
                ["Project Manager", req.body.ProjectMgrName, "Client First Name", req.body.ClientContactFirstName1],
                ["QAQC Person", req.body.QAQCPersonName, "Client Last Name", req.body.ClientContactLastName1],
                ["Type of Promo", req.body.AlternateTitle, "Relationship", req.body.ClientRelation],
                ["Team Members", req.body.TeamMemberNames, "Job Title", req.body.Title1],
                ["Start Date", formatDate(req.body.StartDate), "Address", req.body.Address1_1],
                ["Close Date", formatDate(req.body.CloseDate), "2nd Address", req.body.Address2_1],
                ["Location", req.body.ProjectLoation,"City", req.body.City1],
                ["Latitude", req.body.Lattitude, "State", req.body.State1],
                ["Longitude", req.body.Longitude, "Zip", req.body.Zip1],
                ["Keywords", req.body.ProjectKeywords, "Work Phone", req.body.PhoneW1],
                ["SHN Office", req.body.SHNOffice, "Home Phone", req.body.PhoneH1],
                ["Service Area", req.body.ServiceArea, "Cell Phone", req.body.Cell1],
                ["Total Contract", req.body.ToatlContract, "Fax", req.body.Fax1],
                ["Service Agreement", req.body.ServiceAgreement, "Email", req.body.Email1],
                ["If yes, why?", req.body.Explanation, "Binder Size", req.body.BinderSize],
                ["Retainer", req.body.RetainerPaid, "Binder Location", req.body.BinderLocation],
                ["Profile Code", req.body.ProfileCode,'',''],
                ["Contract Type", req.body.ContractType,'',''],
                ["Invoice Format", req.body.InvoiceFormat,'',''],
                ["Client Contract/PO#", req.body.ClientContractPONumber,'',''],
                ["Outside Markup", (req.body.OutsideMarkup == undefined)?0:req.body.OutsideMarkup,'',''],
                ["Prevailing Wage", req.body.PREVAILING_WAGE,'',''],
                ["Special Billing Instructions", req.body.SpecialBillingInstructins,'',''],
                ["See also", req.body.SEEALSO,'',''],
                ["AutoCAD", (req.body.AutoCAD_Project == -1)?'Yes':'No','',''],
                ["GIS Job", (req.body.GIS_Project == -1)?'Yes':'No','',''],
                ["Project Specifications", (req.body.Project_Specifications == -1)?'Yes':'No','Updated On',new Date().toString()],
                ["Description of Service",req.body.DescriptionService,'Updated By', req.body.CreatedBy]
              ]
            };
            
            // Description of service table.
            // const descTable = {
            //     title: "Description of Services",
            //     headers: ["Description of Services", "Description"],
            //     rows: [["Description of Services", req.body.DescriptionService]]
            // };
            // A4 595.28 x 841.89 (portrait) (about width sizes)
            // width
            // await doc.table(table, { 
            //   width: 400
            // });
            // or columnsSize
            await doc.table(table, {
                columnsSize: [ 120, 130, 100, 130],
                padding: 2,
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => { // Additional formatting of table.
                    (indexColumn == 0 || indexColumn == 2)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
                    // doc.addBackground(rectRow, (indexRow % 2 ? '#555555' : '#60A13F'), 0.15);
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
                    if(indexColumn === 1 && indexRow != table.rows.length - 1) {
                        doc
                        .lineWidth(1)
                        .moveTo(x + width, y)
                        .lineTo(x + width, y + height)
                        .stroke();
                    }
                    if((indexRow === 8 || indexRow === 17 || indexRow === 25) && indexColumn === 0) {
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
            //     columnsSize: [ 100, 400],
            //     prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => { // Additional formatting of table.
            //         (indexColumn == 0)?doc.font("Helvetica-Bold").fontSize(10):doc.font("Helvetica").fontSize(10);
            //     }
            // });
            // done!
            doc.end();
          })();
        // doc.end();
        res.send(JSON.parse(JSON.stringify('{"Status":"Success"}')));
    }).catch(error => { // Print and send error to client for debugging.
        createTicket(error, "Cannot update ticket:");
        console.log(error);
        res.send(JSON.parse(JSON.stringify(error)));
    });
    
});

/**
 * API to get the path of the PDF.
 */

app.post('/getPath', jsonParser, (req, res) => {
    let dir = (req.body.isClosed == "true")?closedJobDirDemo(req.body.ProjectID[0]):getDir(req.body.ProjectID[0]);
    // if(req.body.isClosed == "true") {
    //     dir += '/ClosedJobs';
    // }
    // dir += getDir(req.body.ProjectID[0]); // Get office directory.
    dir += (!isNaN(req.body.ProjectID[1] + req.body.ProjectID[2]) && Number(req.body.ProjectID[1] + req.body.ProjectID[2]) > new Date().getFullYear().toString().slice(-2))?'/19' + req.body.ProjectID[1] + req.body.ProjectID[2]:'/20' + req.body.ProjectID[1] + req.body.ProjectID[2]; // Get project year.
    const projYear = (!isNaN(req.body.ProjectID[1] + req.body.ProjectID[2]) && Number(req.body.ProjectID[1] + req.body.ProjectID[2]) > new Date().getFullYear().toString().slice(-2))?Number('19' + req.body.ProjectID[1] + req.body.ProjectID[2]):Number("20" + req.body.ProjectID[1] + req.body.ProjectID[2]);
    if(req.body.ProjectID[6] == '.' && req.body.ProjectID.length > 6) { // If it's a promo, goto Promos folder.
        dir += "/Promos";
    }
    if(fs.existsSync(PATH + dir)) {
        let dirFiles = fs.readdirSync(PATH + dir);
        // If it's an Arcata Project, remove "A".
        let arcata = (req.body.ProjectID[req.body.ProjectID.length-1] == 'A')?req.body.ProjectID.substring(0,req.body.ProjectID.trim().length-1):req.body.ProjectID;
        let found = false;
        for(let file of dirFiles) {
            if(file.includes(arcata)) {
                dir += '/' + file;
                found = true;
                break;
            }
        }
        if(!found) {
            console.log("Didn't find "+ req.body.ProjectID +" in " +PATH+ dir);
            res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
        }
        else {
            dirFiles = fs.readdirSync(PATH + dir);
            found = false;
            let tempdir = '';
            let namelength = undefined;
            for(let file of dirFiles) {
                if(file == 'PI.pdf') {
                    dir += '/' + file;
                    found = true;
                    break;
                }
                else if(file.includes(arcata) && namelength == undefined) {
                    namelength = file.length;
                    tempdir = file;
                }
                else if(file.includes(arcata) && file.length < namelength) {
                    namelength = file.length;
                    tempdir = file;
                }
            }
            if(!found && tempdir == '') {
                dir += '/Setup';
                if(fs.existsSync(PATH+ dir)) {
                    dirFiles = fs.readdirSync(PATH+ dir);
                    found = false;
                    tempdir = '';
                    namelength = undefined;
                    for(let file of dirFiles) {
                        if(file == 'PI.pdf') {
                            dir += '/' + file;
                            found = true;
                            break;
                        }
                        else if(file.includes(arcata) && namelength == undefined) {
                            namelength = file.length;
                            tempdir = file;
                        }
                        else if(file.includes(arcata) && file.length < namelength) {
                            namelength = file.length;
                            tempdir = file;
                        }
                    }
                    if(!found && tempdir == '') {
                        console.log("Didn't find "+ req.body.ProjectID +" in " + PATH + dir);
                        res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
                    }
                    else {
                        dir += '/' + tempdir;
                        res.download(PATH+dir);
                        // res.send(JSON.parse(JSON.stringify('{"path":"'+dir+'"}')));
                    }
                }
                else {
                    console.log("Didn't find "+ req.body.ProjectID +" in " + PATH + dir);
                    res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
                }
            }
            else {
                dir += '/' + tempdir;
                res.download(PATH + dir);
                //res.send(JSON.parse(JSON.stringify('{"path":"'+dir+'"}')));
            }
        }
    }
    else {
        console.log("Didn't find in " + PATH+ dir);
        res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
    }
});

app.post('/delete', jsonParser, (req, res) => {
    let dir = PATH;
    if(!req.body.hasOwnProperty('ID') || !req.body.hasOwnProperty('Project')){
        res.status(401);
        res.send(JSON.parse(JSON.stringify('{"message":"Bad Request"}')));
    }
    else if(req.body.Project && isNaN(req.body.ID.substring(0,6))) {
        res.status(403);
        res.send(JSON.parse(JSON.stringify('{"message":"Bad Project/Promo"}')));
    }
    else if(!req.body.Project && isNaN(req.body.ID.substring(0,9))) {
        res.status(403);
        res.send(JSON.parse(JSON.stringify('{"message":"Bad Promo"}')));
    }
    else {
        const query = 'DELETE * FROM Projects WHERE ' + req.body.Project?'Projectid':'PromoId' + ' = \''+ req.body.ID +'\'';
        // Connect to database.
        const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
        // Executes the query.
        connection.execute(query).then(() => {
            
        }).catch(err=>{
            res.status(500);
            res.send(JSON.parse(JSON.stringify('{"message":"Server Error: '+err+'"}')));
        })
    }


    res.status(200);
    res.send(JSON.parse(JSON.stringify('{"message":"ok"}')));
});

// Used by the close API to move contents into the cooresponding office's closed jobs folder.
function moveProject(ID, closer) {
    // let dir = 'P:';
    let dir = PATH + ((!isNaN(ID[0]))? getDir(Number(ID[0])):getDir(0)); // Get office directory.
    dir += (!isNaN(ID[1] + ID[2]) && Number(ID[1] + ID[2]) > new Date().getFullYear().toString().slice(-2))?'/19' + ID[1] + ID[2]:'/20' + ID[1] + ID[2]; // Get project year.
    const projYear = (!isNaN(ID[1] + ID[2]) && Number(ID[1] + ID[2]) > new Date().getFullYear().toString().slice(-2))?Number('19' + ID[1] + ID[2]):Number("20" + ID[1] + ID[2]);
    const isPromo = (ID.length > 7)?true:false;
    dir += (isPromo)?'/Promos':'';

    // Check if directory exists so far.  If not, return an error.
    if(fs.existsSync(dir)) {
        // Get Project folders.
        let dirFiles = fs.readdirSync(dir);
        let filer = null;
        // Redact A if it's an Arcata project.
        let arcata = (ID[ID.length-1] == 'A')?ID.substring(0,ID.length-1):ID;
        // Find Project folder name.
        for(let file of dirFiles) {
            if(file.substring(0, 12).includes(arcata)) {
                filer = '/' + file;
                dir += '/' + file;
                break;
            }
        }
        // Move file only if a file was found.
        if(filer != null) {
            let dest = PATH + closedJobDirDemo(Number(ID[0])) + '/'+ projYear + (isPromo?'/Promos':'');
            if(!fs.existsSync(dest)) {
                fs.mkdir((dest), err => {
                    if(err){
                        throw err;
                    }
                });
            }
            console.log("Moving to " + dest + filer)
            fs.moveSync(dir, dest + filer, { overwrite: true }, (err) => {
                if(err) {
                    console.log(err);
                }
                console.log(dest + filer);
            });
            fs.mkdir((dir), error => {
                if(error){
                    console.log(error);
                }
                else {
                    // Create a PDF for the original location for the user to know that the project/promo has closed.
                    const doc = new PDFDocument();
                    doc.pipe(fs.createWriteStream(dir + '/Closed_'+ ID +'.pdf'));
                    doc.font('Helvetica-Bold').text('This project was closed on ' + new Date().toDateString() + ' by '+closer+'.\nMoved to ' + dest + filer);
                    doc.end();
                }
            });
            // dir += "/" + filer;
        }
        else {
            console.log("Cannot move project. " + dir);
        }
    }
    else { // Project/promo couldn't be found.
        console.log("Cannot find directory " + dir);
        dir = null;
    }
    return dir;
}

// used when demoing the functionality of moving the project/promo folder, so that nothing can go wrong.
function moveProjectDemo(ID) {
    let dir = 'U:/Eureka/Nylex/test/Mock_Drive';
    dir += (!isNaN(ID[0]))? getDir(Number(ID[0])):getDir(0);
    dir += (!isNaN(ID[1] + ID[2]) && Number(ID[1] + ID[2]) > new Date().getFullYear().toString().slice(-2))?'/19' + ID[1] + ID[2]:'/20' + ID[1] + ID[2];
    const projYear = (!isNaN(ID[1] + ID[2]) && Number(ID[1] + ID[2]) > new Date().getFullYear().toString().slice(-2))?Number('19' + ID[1] + ID[2]):Number("20" + ID[1] + ID[2]);
    if(fs.existsSync(dir)) {
        let dirFiles = fs.readdirSync(dir);
        let filer = null;
        let arcata = (ID[ID.length-1] == 'A')?ID.substring(0,ID.length-1):ID;
        for(let file of dirFiles) {
            if(file.substring(0, 6).includes(arcata)) {
                filer = '/' + file;
                dir += '/' + file;
                break;
            }
        }
        if(filer != null) {
            let dest = closedJobDirDemo(Number(ID[0]));
            if(!fs.existsSync(dest + projYear)) {
                fs.mkdir((dest+ projYear), err => {
                    if(err){
                        throw err;
                    }
                });
            }
            fs.move(dir, dest + projYear + filer, (err) => {
                if(err) {
                    console.log(err);
                }
                console.log(dest + projYear + filer);
                try {
                    fs.mkdir((dir), error => {
                        if(error){
                            console.log(error)
                        }
                    });
                    const doc = new PDFDocument();
                    doc.pipe(fs.createWriteStream(dir + '/Closed_'+ ID +'.pdf'));
                    doc.font('Helvetica-Bold').text('This project was closed on ' + new Date().toDateString() + '.\nMoved to ' + dest + projYear + filer);
                    doc.end();
                }
                catch(error) {
                    console.log(error);
                }
            });
            // dir += "/" + filer;
        }
    }
    else {
        console.log("Cannot find directory " + dir);
        dir = null;
    }
    return dir;
}

// Returns directories of each office's closed job folder by office number.
function closedJobDir(officeNum) {
    if(officeNum == 2) {
        return 'P:/KFalls/ClosedJobs';
    }
    else if(officeNum == 4) {
        return 'P:/Willits/ClosedJobs';
    }
    else if(officeNum == 5) {
        return 'P:/Redding/ClosedJobs';
    }
    else if(officeNum == 6) {
        return 'P:/Redding/ClosedJobs';
    }
    return 'P:/Eureka/ClosedJobs';
}

// Returns directories of each office's closed job folder by office number (DEMO VERSION).
function closedJobDirDemo(officeNum) {
    if(officeNum == 2) {
        return '/KFalls/ClosedJobs';
    }
    else if(officeNum == 4) {
        return '/Willits/ClosedJobs';
    }
    else if(officeNum == 5) {
        return '/Redding/ClosedJobs';
    }
    else if(officeNum == 6) {
        return '/Coosbay/ClosedJobs';
    }
    return '/Eureka/ClosedJobs';
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

// Returns the office directory by ID.
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
 * ) removes the two single quotes ('') for proper display in the PDF document.
 * The reason the form formats single quotes to print twice is because that's how MS SQL escapes from it, instead of using backslash (\).
 * Without an escape from ', MS SQL rejects the query.
 */

// function SQLFormat) {

//     let i = 0;

//     SQLFormat = String(SQLFormat);

//     while(i < SQLFormat.length) {
//         if(SQLFormat[i] == '\'' && i + 1 < SQLFormat.length && SQLFormat[i + 1] == '\'') {
//             SQLFormat = SQLFormat.substring(0, i) + SQLFormat.substring(i + 1);
//         }
//         i++;
//     }

//     return SQLFormat;
// }

// Run the APIs.
// const port = Number(process.env.PORT) || 3001;
// app.listen(port, () => console.log(`Listening to port ${port}...`));

https.createServer(options, app, function (req, res) {
    res.statusCode = 200;
  }).listen(3001);