// npm libraries.
'use strict';
const msnodesqlv8 = require('msnodesqlv8');
const express = require('express');
const fileUpload = require('express-fileupload');
// const cluster = require('cluster');
const cors = require('cors');
// const { useCallback } = require('react');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit-table');
const https = require('https');
const winPermissionsManager = require('win-permissions-js');
app.use(cors());
app.use(fileUpload());
var jsonParser = bodyParser.json();
const DATABASE_PATH = "C:\\Users\\administrator\\Documents\\PPI\\Database\\SHN_Project_Backup.mdb;";
const DEMO_PATH = 'U:/Eureka/Nylex/test/Mock_Drive';
const jsonData = require('./config.json');

// Directory for production environment.
// process.chdir("P:\\");

// Directory for testing environment.
process.chdir("P:\\");
const PATH = "P:";
// Certificates
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

// String to connect to MSSQL.
const connectionString = `server=localhost\\SQLEXPRESS;Database=master;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`;

const pool = new msnodesqlv8.Pool({
    connectionString: connectionString
});
pool.on('open', (options) => {
    console.log(`ready options = ${JSON.stringify(options, null, 4)}`)
  });
  pool.on('error', e => {
    console.log(e)
  });

// projects API returns the project info in projects, plus the first and last name of the Project Manager.

app.post('/projects', jsonParser, (req, res) => {
    pool.query('SELECT Projects.*, Staff.first, Staff.last FROM Projects INNER JOIN Staff ON Projects.project_manager_ID = Staff.ID WHERE Projects.project_id LIKE \'%'+req.body.projID+'%\' ORDER BY Projects.project_id, Staff.last, Staff.first, Projects.client_company, Projects.project_title, Projects.description_service;', (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            const result = new Array();
            result.push(data);
            pool.query('SELECT Promos.*, Staff.first, Staff.last FROM Promos INNER JOIN Staff ON Promos.manager_id = Staff.ID WHERE Promos.promo_id LIKE \'%'+req.body.projID+'%\' ORDER BY Promos.promo_id, Staff.last, Staff.first, Promos.client_company, Promos.promo_title, Promos.description_service;', (error, homo) => {
                if(error) {
                    console.error(error);
                    res.send(JSON.stringify(error));
                }
                else {
                    result.push(homo);
                    res.send(JSON.stringify(result));
                }
            });
        }
    });
});

// Used to close Projects by setting "Closed_by_PM" to -1 and moving files to the office's closed projects folder.

app.post('/closeMe', jsonParser, (req, res) => {
    const myJson = req.body;
    console.log("UPDATE " + (req.body.isProject?"Projects":"Promos") + " SET closed = 1 WHERE ID = " + req.body.projID + ";");
    pool.query("UPDATE " + (req.body.isProject?"Projects":"Promos") + " SET closed = 1 WHERE ID = " + req.body.projID + ";", (err, bar) => {
        if(err) {
            createTicket(err, "Could not close:");
            res.send(JSON.parse(JSON.stringify(err)));
            console.log(err);
        }
        else {
            let nutty = moveProject(myJson.userID, myJson.ClosedBy); // function returns null if directory is not found.
            let response = '{"Status":"Success"}';
            if(nutty == null) {
                response = '{"Status":"Bruh"}';
            }
            res.statusCode = 200;
            res.send(JSON.parse(JSON.stringify(response)));
        }
    });
});

/**
 * General Default search of database.
 */
app.post('/search', jsonParser, (req, res) => {
    let result =[];
    pool.query("SELECT Projects.ID, Projects.project_id, Projects.project_title, Projects.client_company, Projects.closed, Staff.first, Staff.last FROM Projects INNER JOIN Staff ON Projects.project_manager_ID = Staff.ID INNER JOIN ProfileCodes ON Projects.profile_code_id = ProfileCodes.ID LEFT JOIN ProjectKeywords ON Projects.ID = ProjectKeywords.project_id WHERE Projects.project_id LIKE '%"+req.body.entry+"%' OR Projects.project_title LIKE '%"+req.body.entry+"%' OR Projects.first_name LIKE '%"+req.body.entry+"%' OR Projects.last_name LIKE '%"+req.body.entry+"%' OR Projects.client_company LIKE '%"+req.body.entry+"%' OR Projects.description_service LIKE '%"+req.body.entry+"%' OR ProfileCodes.Code LIKE '%"+req.body.entry+"%' OR ProfileCodes.Description LIKE '%"+req.body.entry+"%' OR ProjectKeywords.keyword_id IN (SELECT ID FROM Keywords WHERE Keyword LIKE '%"+req.body.entry+"%') OR Projects.project_location LIKE '%"+req.body.entry+"%' OR Staff.first LIKE '%"+req.body.entry+"%' OR Staff.last LIKE '%"+req.body.entry+"%';", (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            result.push(data);
            pool.query("SELECT Promos.ID, Promos.promo_id, Promos.promo_title, Promos.client_company, Promos.closed, Staff.first, Staff.last FROM Promos INNER JOIN Staff ON Promos.manager_ID = Staff.ID INNER JOIN ProfileCodes ON Promos.profile_code_id = ProfileCodes.ID LEFT JOIN PromoKeywords ON Promos.ID = PromoKeywords.promo_id WHERE Promos.promo_id LIKE '%"+req.body.entry+"%' OR Promos.promo_title LIKE '%"+req.body.entry+"%' OR Promos.first_name LIKE '%"+req.body.entry+"%' OR Promos.last_name LIKE '%"+req.body.entry+"%' OR Promos.client_company LIKE '%"+req.body.entry+"%' OR Promos.description_service LIKE '%"+req.body.entry+"%' OR ProfileCodes.Code LIKE '%"+req.body.entry+"%' OR ProfileCodes.Description LIKE '%"+req.body.entry+"%' OR PromoKeywords.keyword_id IN (SELECT ID FROM Keywords WHERE Keyword LIKE '%"+req.body.entry+"%') OR Promos.promo_location LIKE '%"+req.body.entry+"%' OR Staff.first LIKE '%"+req.body.entry+"%' OR Staff.last LIKE '%"+req.body.entry+"%';", (err, promos) => {
                if(err) {
                    console.error(err);
                    res.send(JSON.stringify(err));
                }
                else {
                    result.push(promos);
                    pool.query("SELECT BillingGroups.ID, Projects.project_id, BillingGroups.group_number, BillingGroups.group_name, Projects.closed, Staff.first, Staff.last, Projects.client_company FROM BillingGroups INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID INNER JOIN Staff ON BillingGroups.manager_id = Staff.ID INNER JOIN ProfileCodes ON BillingGroups.profile_code_id = profileCodes.ID LEFT JOIN BillingGroupKeywords ON BillingGroups.ID = BillingGroupKeywords.group_id WHERE Projects.project_id LIKE '%"+ req.body.entry +"%' OR ProfileCodes.Code LIKE '%"+req.body.entry+"%' OR ProfileCodes.Description LIKE '%"+req.body.entry+"%' OR BillingGroupKeywords.keyword_id IN (SELECT ID FROM Keywords WHERE Keyword LIKE '%"+req.body.entry+"%') OR Staff.first LIKE '%"+req.body.entry+"%' OR Staff.last LIKE '%"+req.body.entry+"%' OR BillingGroups.group_location LIKE '%"+req.body.entry+"%' OR BillingGroups.description_service LIKE '%"+req.body.entry+"%';", (bruh, bill) => {
                        if(bruh) {
                            console.error(bruh);
                            res.send(JSON.stringify(bruh));
                        }
                        else {
                            result.push(bill);
                            res.send(JSON.stringify(result));
                        }
                    });
                }
            });
        }
    });
});

/**
 * Gets projects with matching Project ID.
 */

app.post('/searchProject', jsonParser, (req, res) => {
    let result =[];
    pool.query("SELECT Projects.ID, Projects.project_id, Projects.project_title, Projects.closed, Projects.client_company, Staff.first, Staff.last FROM Projects INNER JOIN Staff ON Projects.project_manager_ID = Staff.ID WHERE Projects.project_id LIKE '%"+ req.body.entry +"%';", (err, data) => {
        if(err) {
            console.log("project fail");
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            result.push(data);
            result.push([]); // No Promos to return.
            pool.query("SELECT BillingGroups.ID, BillingGroups.group_number, BillingGroups.group_name, Projects.closed, Projects.project_id, Staff.first, Staff.last, Projects.client_company FROM BillingGroups INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID INNER JOIN Staff ON BillingGroups.manager_id = Staff.ID WHERE Projects.project_id LIKE '%"+ req.body.entry +"%';", (err, proup) => {
                if(err) {
                    console.log("billing fail");
                    console.error(err);
                    res.send(JSON.stringify(err));
                }
                else {
                    result.push(proup);
                    res.send(JSON.stringify(result));
                }
            }); 
        }
    });
});

/**
 * Gets projects with matching Promo ID.
 */

app.post('/searchPromo', jsonParser, (req, res) => {
    let result =[];
    pool.query("SELECT Promos.ID, Promos.promo_id, Promos.promo_title, Promos.closed, Promos.client_company, Staff.first, Staff.last FROM Promos INNER JOIN Staff ON Promos.manager_id = Staff.ID WHERE Promos.promo_id LIKE '%"+ req.body.entry +"%';", (err, data) => {
        if(err) {
            console.log("project fail");
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            result.push([]); // No Projects to return.
            result.push(data);
            result.push([]); // No Billing Groups to return.
            res.send(JSON.stringify(result));
        }
    });
});

/**
 * Gets projects with matching Keywords.
 */

app.post('/searchKeyword', jsonParser, (req, res) => {
    let result =[];
    pool.query("SELECT Projects.ID, Projects.project_id, Projects.project_title, Projects.client_company, Projects.closed, Staff.first, Staff.last FROM Projects INNER JOIN Staff ON Projects.project_manager_ID = Staff.ID INNER JOIN ProfileCodes ON Projects.profile_code_id = ProfileCodes.ID INNER JOIN ProjectKeywords ON Projects.ID = ProjectKeywords.project_id WHERE ProjectKeywords.keyword_id IN (SELECT ID FROM Keywords WHERE Keyword LIKE '%"+req.body.entry+"%');", (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            result.push(data);
            pool.query("SELECT Promos.ID, Promos.promo_id, Promos.promo_title, Promos.client_company, Promos.closed, Staff.first, Staff.last FROM Promos INNER JOIN Staff ON Promos.manager_ID = Staff.ID INNER JOIN ProfileCodes ON Promos.profile_code_id = ProfileCodes.ID INNER JOIN PromoKeywords ON Promos.ID = PromoKeywords.promo_id WHERE PromoKeywords.keyword_id IN (SELECT ID FROM Keywords WHERE Keyword LIKE '%"+req.body.entry+"%');", (err, promos) => {
                if(err) {
                    console.error(err);
                    res.send(JSON.stringify(err));
                }
                else {
                    result.push(promos);
                    pool.query("SELECT BillingGroups.ID, Projects.project_id, BillingGroups.group_number, BillingGroups.group_name, Projects.closed, Staff.first, Staff.last, Projects.client_company FROM BillingGroups INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID INNER JOIN Staff ON BillingGroups.manager_id = Staff.ID INNER JOIN ProfileCodes ON BillingGroups.profile_code_id = profileCodes.ID INNER JOIN BillingGroupKeywords ON BillingGroups.ID = BillingGroupKeywords.group_id WHERE BillingGroupKeywords.keyword_id IN (SELECT ID FROM Keywords WHERE Keyword LIKE '%"+req.body.entry+"%');", (bruh, bill) => {
                        if(bruh) {
                            console.error(bruh);
                            res.send(JSON.stringify(bruh));
                        }
                        else {
                            result.push(bill);
                            res.send(JSON.stringify(result));
                        }
                    });
                }
            });
        }
    });
});

/**
 * Gets projects with matching Titles.
 */

app.post('/searchTitle', jsonParser, (req, res) => {
    let result =[];
    pool.query("SELECT Projects.ID, Projects.project_id, Projects.project_title, Projects.client_company, Projects.closed, Staff.first, Staff.last FROM Projects INNER JOIN Staff ON Projects.project_manager_ID = Staff.ID INNER JOIN ProfileCodes ON Projects.profile_code_id = ProfileCodes.ID INNER JOIN ProjectKeywords ON Projects.ID = ProjectKeywords.project_id WHERE Projects.project_title LIKE '%"+req.body.entry+"%';", (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            result.push(data);
            pool.query("SELECT Promos.ID, Promos.promo_id, Promos.promo_title, Promos.client_company, Promos.closed, Staff.first, Staff.last FROM Promos INNER JOIN Staff ON Promos.manager_ID = Staff.ID INNER JOIN ProfileCodes ON Promos.profile_code_id = ProfileCodes.ID INNER JOIN PromoKeywords ON Promos.ID = PromoKeywords.promo_id WHERE Promos.promo_title LIKE '%"+req.body.entry+"%';", (err, promos) => {
                if(err) {
                    console.error(err);
                    res.send(JSON.stringify(err));
                }
                else {
                    result.push(promos);
                    pool.query("SELECT BillingGroups.ID, Projects.project_id, BillingGroups.group_number, BillingGroups.group_name, Projects.closed, Staff.first, Staff.last, Projects.client_company FROM BillingGroups INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID INNER JOIN Staff ON BillingGroups.manager_id = Staff.ID INNER JOIN ProfileCodes ON BillingGroups.profile_code_id = profileCodes.ID INNER JOIN BillingGroupKeywords ON BillingGroups.ID = BillingGroupKeywords.group_id WHERE BillingGroups.group_name LIKE '%"+req.body.entry+"%';", (bruh, bill) => {
                        if(bruh) {
                            console.error(bruh);
                            res.send(JSON.stringify(bruh));
                        }
                        else {
                            result.push(bill);
                            res.send(JSON.stringify(result));
                        }
                    });
                }
            });
        }
    });
});

/**
 * Gets projects with matching Description of Services.
 */

app.post('/searchDesc', jsonParser, (req, res) => {
    let result =[];
    pool.query("SELECT Projects.ID, Projects.project_id, Projects.project_title, Projects.client_company, Projects.closed, Staff.first, Staff.last FROM Projects INNER JOIN Staff ON Projects.project_manager_ID = Staff.ID INNER JOIN ProfileCodes ON Projects.profile_code_id = ProfileCodes.ID INNER JOIN ProjectKeywords ON Projects.ID = ProjectKeywords.project_id WHERE Projects.description_service LIKE '%"+req.body.entry+"%';", (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            result.push(data);
            pool.query("SELECT Promos.ID, Promos.promo_id, Promos.promo_title, Promos.client_company, Promos.closed, Staff.first, Staff.last FROM Promos INNER JOIN Staff ON Promos.manager_ID = Staff.ID INNER JOIN ProfileCodes ON Promos.profile_code_id = ProfileCodes.ID INNER JOIN PromoKeywords ON Promos.ID = PromoKeywords.promo_id WHERE Promos.description_service LIKE '%"+req.body.entry+"%';", (err, promos) => {
                if(err) {
                    console.error(err);
                    res.send(JSON.stringify(err));
                }
                else {
                    result.push(promos);
                    pool.query("SELECT BillingGroups.ID, Projects.project_id, BillingGroups.group_number, BillingGroups.group_name, Projects.closed, Staff.first, Staff.last, Projects.client_company FROM BillingGroups INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID INNER JOIN Staff ON BillingGroups.manager_id = Staff.ID INNER JOIN ProfileCodes ON BillingGroups.profile_code_id = profileCodes.ID INNER JOIN BillingGroupKeywords ON BillingGroups.ID = BillingGroupKeywords.group_id WHERE BillingGroups.description_service LIKE '%"+req.body.entry+"%';", (bruh, bill) => {
                        if(bruh) {
                            console.error(bruh);
                            res.send(JSON.stringify(bruh));
                        }
                        else {
                            result.push(bill);
                            res.send(JSON.stringify(result));
                        }
                    });
                }
            });
        }
    });
});

/**
 *  Gets the QAQC Manager via ID.
 */
/*
app.post('/qaqc', jsonParser, (req, res) => {
    const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
    connection.query('SELECT First, Last FROM Contacts WHERE ID = '+ req.body.id)
    .then(person => {
        res.send(JSON.stringify(person));
    }).catch(err => {
        res.send(JSON.stringify(err));
    });
});
*/
/**
 * Gets Projects. promos, or billing groups based on IDs passed to API.
 */

app.post('/getMe', jsonParser, (req, res) => {
    const database = (req.body.Identifier == 0?"Projects":(req.body.Identifier == 1?"Promos":"BillingGroups"));
    const query1 = 'SELECT '+(database == "BillingGroups"?database + '.*, Projects.project_id':database + '.*')+', '+(req.body.Identifier == 0?"ProjectTeam.member_id":(req.body.Identifier == 1?"PromoTeam.member_id":"BillingGroupTeam.member_id")) + ', ' + (req.body.Identifier == 0?"ProjectKeywords":(req.body.Identifier == 1?"PromoKeywords":"BillingGroupKeywords")) + '.keyword_id, Staff.first, Staff.last, Staff.ID AS staffyID FROM ' + database + ' INNER JOIN '+ (req.body.Identifier == 0?"ProjectTeam":(req.body.Identifier == 1?"PromoTeam":"BillingGroupTeam")) +' ON '+database+'.ID = '+(req.body.Identifier == 0?"ProjectTeam.project_id":(req.body.Identifier == 1?"PromoTeam.promo_id":"BillingGroupTeam.billing_id"))+' INNER JOIN '+(req.body.Identifier == 0?"ProjectKeywords":(req.body.Identifier == 1?"PromoKeywords":"BillingGroupKeywords")) +' ON '+database+'.ID = '+(req.body.Identifier == 0?"ProjectKeywords.project_id":(req.body.Identifier == 1?"PromoKeywords.promo_id":"BillingGroupKeywords.group_id")) + (req.body.Identifier != 1 && req.body.Identifier != 0?' INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID ':'') +' INNER JOIN Staff ON '+(req.body.Identifier == 0?"Projects.project_manager_ID":(req.body.Identifier == 1?"Promos.manager_id":"BillingGroups.manager_id"))+' = Staff.ID WHERE '+database+'.ID = ' + req.body.ID;
    const query2 = 'SELECT '+(database == "BillingGroups"?database + '.*, Projects.project_id':database + '.*')+', '+(req.body.Identifier == 0?"ProjectTeam.member_id":(req.body.Identifier == 1?"PromoTeam.member_id":"BillingGroupTeam.member_id")) + ', Staff.first, Staff.last, Staff.ID AS staffyID FROM ' + database + ' INNER JOIN '+ (req.body.Identifier == 0?"ProjectTeam":(req.body.Identifier == 1?"PromoTeam":"BillingGroupTeam")) +' ON '+database+'.ID = '+(req.body.Identifier == 0?"ProjectTeam.project_id":(req.body.Identifier == 1?"PromoTeam.promo_id":"BillingGroupTeam.billing_id"))+(req.body.Identifier != 1 && req.body.Identifier != 0?' INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID ':'') +' INNER JOIN Staff ON '+(req.body.Identifier == 0?"Projects.project_manager_ID":(req.body.Identifier == 1?"Promos.manager_id":"BillingGroups.manager_id"))+' = Staff.ID WHERE '+database+'.ID = ' + req.body.ID;
    const query3 = 'SELECT '+(database == "BillingGroups"?database + '.*, Projects.project_id':database + '.*')+', ' + (req.body.Identifier == 0?"ProjectKeywords":(req.body.Identifier == 1?"PromoKeywords":"BillingGroupKeywords")) + '.keyword_id, Staff.first, Staff.last, Staff.ID AS staffyID FROM ' + database + ' INNER JOIN '+(req.body.Identifier == 0?"ProjectKeywords":(req.body.Identifier == 1?"PromoKeywords":"BillingGroupKeywords")) +' ON '+database+'.ID = '+(req.body.Identifier == 0?"ProjectKeywords.project_id":(req.body.Identifier == 1?"PromoKeywords.promo_id":"BillingGroupKeywords.group_id")) + (req.body.Identifier != 1 && req.body.Identifier != 0?' INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID ':'') +' INNER JOIN Staff ON '+(req.body.Identifier == 0?"Projects.project_manager_ID":(req.body.Identifier == 1?"Promos.manager_id":"BillingGroups.manager_id"))+' = Staff.ID WHERE '+database+'.ID = ' + req.body.ID;
    const query4 = 'SELECT '+ (database == "BillingGroups"?database + '.*, Projects.project_id':database+ '.*') + ', Staff.first, Staff.last, Staff.ID AS staffyID FROM ' + database + (req.body.Identifier != 1 && req.body.Identifier != 0?' INNER JOIN Projects ON BillingGroups.project_ID = Projects.ID ':'') +' INNER JOIN Staff ON '+(req.body.Identifier == 0?"Projects.project_manager_ID":(req.body.Identifier == 1?"Promos.manager_id":"BillingGroups.manager_id"))+' = Staff.ID WHERE '+database+'.ID = ' + req.body.ID;
    // console.log('IF EXISTS (' + query1 + ') BEGIN '+ query1 + '; END ELSE IF EXISTS ('+query2+') OR EXISTS ('+query3+') BEGIN IF EXISTS ('+query2+') BEGIN '+query2+'; END ELSE IF EXISTS ('+query3+') BEGIN '+query3+'; END ELSE BEGIN '+query4+'; END');
    pool.query('IF EXISTS (' + query1 + ') BEGIN '+ query1 + '; END ELSE IF EXISTS ('+query2+') OR EXISTS ('+query3+') BEGIN IF EXISTS ('+query2+') BEGIN '+query2+'; END ELSE IF EXISTS ('+query3+') BEGIN '+query3+'; END END ELSE BEGIN '+query4+'; END', (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.stringify(err));
        }
        else {
            res.send(JSON.stringify(data));
        }
    });
});

// Returns IDs from recognizable keywords, assuming the keywords are split using " || ".
// This may not work for older project initiations, as the database entries don't always conform to the expected format.
/*
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
}); */

// API used to update a project with sent information.

app.post('/updater', jsonParser, (req, res) => {
    // Build and find directory of the original project/promo.
    // let dir = 'P:';
    let isProject = (req.body.isWhat != 1?true:false);
    let isBillingGroup = (req.body.isWhat == -1?true:false);
    const num = (isProject)?req.body.project_id:req.body.promo_id;
    // let dir = PATH + ((isProject)?getDir(req.body.project_id[0]):getDir(req.body.promo_id[0]));
    let dir = DEMO_PATH + ((isProject)?getDir(req.body.project_id[0]):getDir(req.body.promo_id[0]));
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
    else if(isProject && isBillingGroup) {
        dirFiles = fs.readdirSync(dir);
        found = false;
        for(let file of dirFiles) {
            if(file.substring(0, 12).includes(req.body.group_number)) {
                dir += '/' + file;
                found = true;
                break;
            }
        }
        if(!found) {
            dir += '/' + req.body.group_number;
            fs.mkdir((dir), err => {
                if(err){
                    createTicket(err, "Billing group "+req.body.group_number+" not found:");
                    throw err;
                }
            });
        }
    }

    // Build the SQL statement by settling similarities and differences in column names.

    let query = 'UPDATE '+(req.body.isWhat == 0?'Projects':(req.body.isWhat == 1?'Promos':'BillingGroups')) + ' SET ';
    if(isProject && !isBillingGroup) { // Is Project.
        query += 'project_title = \''+ req.body.project_title.replace(/'/gi, "''") + '\', ';
        query += 'project_manager_ID = '+ req.body.project_manager_ID + ', ';
        query += 'project_location = \''+ req.body.project_location.replace(/'/gi, "''") + '\', ';
        // query += 'closed = ' + req.body.closed + ', ';
        query += 'SHNOffice_ID = ' + req.body.SHNOffice_ID + ', ';
        query += 'total_contract = ' + (req.body.total_contract == 'NULL' || req.body.total_contract == null ? 'NULL':req.body.total_contract) + ', ';
        query += 'exempt_agreement = ' + req.body.exempt_agreement + ', ';
        query += 'why = ' + (req.body.why == 'NULL' || req.body.why == null?'NULL':req.body.why.replace(/'/gi, "''")) + ', ';
        query += 'retainer = \'' + req.body.retainer.replace(/'/gi, "''") + '\', ';
        query += 'retainer_paid = ' + (req.body.retainer_paid == 'NULL'|| req.body.retainer_paid == null ? 'NULL':req.body.retainer_paid) + ', ';
        query += 'waived_by = '+ (req.body.waived_by == 'NULL' || req.body.waived_by == null ?'NULL':'\''+req.body.waived_by.replace(/'/gi, "''") + '\'') + ', ';
        query += 'contract_ID = ' + req.body.contract_ID + ', ';
        query += 'invoice_format = '+ (req.body.invoice_format == 'NULL' || req.body.invoice_format == null ? 'NULL': '\'' + req.body.invoice_format.replace(/'/gi, "''") + '\'') +', ';
        query += 'client_contract_PO = \'' + req.body.client_contract_PO.replace(/'/gi, "''") + '\', ';
        query += 'outside_markup = ' + req.body.outside_markup + ', ';
        query += 'prevailing_wage = ' + req.body.prevailing_wage + ', ';
        query += 'agency_name = ' + (req.body.agency_name == 'NULL' || req.body.agency_name == null ? 'NULL':'\'' + req.body.agency_name.replace(/'/gi, "''")+'\'') + ', ';
        query += 'special_billing_instructions = ' + (req.body.special_billing_instructions == 'NULL' || req.body.special_billing_instructions == null ? 'NULL':'\'' + req.body.special_billing_instructions.replace(/'/gi, "''") + '\'') + ', ';
        query += 'see_also = ' + (req.body.see_also == 'NULL' || req.body.see_also == null ? 'NULL':'\'' + req.body.see_also.replace(/'/gi, "''") + '\'') + ', ';
        query += 'autoCAD = ' + req.body.autoCAD + ', ';
        query += 'GIS = ' + req.body.GIS + ', ';
        query += 'project_specifications = ' + req.body.project_specifications + ', ';
        query += 'client_company = \'' + req.body.client_company.replace(/'/gi, "''") + '\', ';
        query += 'client_abbreviation = ' + (req.body.client_abbreviation == 'NULL' || req.body.client_abbreviation == null?'NULL':'\'' + req.body.client_abbreviation.replace(/'/gi, "''") + '\'') + ', ';
        query += 'mailing_list = ' + (req.body.mailing_list == 'NULL' || req.body.mailing_list == null?'NULL':'\''+req.body.mailing_list.replace(/'/gi, "''")+'\'') + ', ';
        query += 'first_name = \'' + req.body.first_name.replace(/'/gi, "''") + '\', ';
        query += 'last_name = \'' + req.body.last_name.replace(/'/gi, "''") + '\', ';
        query += 'relationship = ' + (req.body.relationship == 'NULL' || req.body.relationship == null?'NULL':'\'' + req.body.relationship.replace(/'/gi, "''") + '\'') + ', ';
        query += 'job_title = ' + (req.body.job_title == 'NULL' || req.body.job_title == null ? 'NULL':'\'' + req.body.job_title.replace(/'/gi, "''") + '\'') + ', ';
        query += 'address1 = \'' + req.body.address1.replace(/'/gi, "''") + '\', ';
        query += 'address2 = ' + (req.body.address2 == 'NULL' || req.body.address2 == null ?'NULL':'\'' + req.body.address2.replace(/'/gi, "''") + '\'') + ', ';
        query += 'city = \'' + req.body.city.replace(/'/gi, "''") + '\', ';
        query += 'state = \'' + req.body.state.replace(/'/gi, "''") + '\', ';
        query += 'zip_code = \'' + req.body.zip_code.replace(/'/gi, "''") + '\', ';
        query += 'work_phone = \'' + req.body.work_phone.replace(/'/gi, "''") + '\', ';
        query += 'ext = ' + (req.body.ext == 'NULL' || req.body.ext == null ?'NULL':'\'' + req.body.ext.replace(/'/gi, "''") + '\'') + ', ';
        query += 'home_phone = ' + (req.body.home_phone == 'NULL' || req.body.home_phone == null ?'NULL':'\'' + req.body.home_phone.replace(/'/gi, "''") + '\'') + ', ';
        query += 'cell = ' + (req.body.cell == 'NULL' || req.body.cell == null ?'NULL':'\'' + req.body.cell.replace(/'/gi, "''") + '\'') + ', ';
        query += 'fax = ' + (req.body.fax == 'NULL' || req.body.fax == null?'NULL':'\'' + req.body.fax.replace(/'/gi, "''") + '\'') + ', ';
        query += 'email = \'' + req.body.email.replace(/'/gi, "''") + '\', ';
        query += 'binder_location = ' + (req.body.binder_location == 'NULL' || req.body.binder_location == null?'NULL':'\'' + req.body.binder_location.replace(/'/gi, "''") + '\'') + ', ';
    }
    else if(isBillingGroup) { // Is Billing group
        query += 'group_number = \''+ req.body.group_number.replace(/'/gi, "''") + '\', ';
        query += 'group_name = \''+ req.body.group_name.replace(/'/gi, "''") + '\', ';
        query += 'manager_id = '+ req.body.manager_id + ', ';
        query += 'group_location = \''+ req.body.group_location.replace(/'/gi, "''") + '\', ';
        query += 'total_contract = ' + (req.body.total_contract == 'NULL' || req.body.total_contract == null ? 'NULL':req.body.total_contract) + ', ';
        query += 'retainer = \'' + req.body.retainer.replace(/'/gi, "''") + '\', ';
        query += 'retainer_paid = ' + (req.body.retainer_paid == 'NULL'|| req.body.retainer_paid == null ? 'NULL':req.body.retainer_paid) + ', ';
        query += 'waived_by = '+ (req.body.waived_by == 'NULL' || req.body.waived_by == null ?'NULL':'\''+req.body.waived_by.replace(/'/gi, "''") + '\'') + ', ';
        query += 'contract_ID = ' + req.body.contract_ID + ', ';
        query += 'invoice_format = '+ (req.body.invoice_format == 'NULL' || req.body.invoice_format == null ? 'NULL': '\'' + req.body.invoice_format.replace(/'/gi, "''") + '\'') +', ';
        query += 'client_contract_PO = \'' + req.body.client_contract_PO + '\', ';
        query += 'outside_markup = ' + req.body.outside_markup + ', ';
        query += 'prevailing_wage = ' + req.body.prevailing_wage + ', ';
        query += 'agency_name = ' + (req.body.agency_name == 'NULL' || req.body.agency_name == null ? 'NULL':'\'' + req.body.agency_name.replace(/'/gi, "''")) + '\'' + ', ';
        query += 'special_billing_instructions = ' + (req.body.special_billing_instructions == 'NULL' || req.body.special_billing_instructions == null ? 'NULL':'\'' + req.body.special_billing_instructions.replace(/'/gi, "''") + '\'') + ', ';
        query += 'autoCAD = ' + req.body.autoCAD + ', ';
        query += 'GIS = ' + req.body.GIS + ', ';
    }
    else { // Is Promo
        query += 'promo_type = \''+ req.body.promo_type.replace(/'/gi, "''") + '\', ';
        query += 'promo_title = \''+ req.body.promo_title.replace(/'/gi, "''") + '\', ';
        query += 'manager_id = '+ req.body.manager_id + ', ';
        query += 'promo_location = \''+ req.body.promo_location.replace(/'/gi, "''") + '\', ';
        // query += 'closed = ' + req.body.closed + ', ';
        query += 'SHNOffice_ID = ' + req.body.SHNOffice_ID + ', ';
        query += 'client_company = \'' + req.body.client_company.replace(/'/gi, "''") + '\', ';
        query += 'client_abbreviation = ' + (req.body.client_abbreviation == 'NULL' || req.body.client_abbreviation == null?'NULL':'\'' + req.body.client_abbreviation.replace(/'/gi, "''") + '\'') + ', ';
        query += 'first_name = \'' + req.body.first_name.replace(/'/gi, "''") + '\', ';
        query += 'last_name = \'' + req.body.last_name.replace(/'/gi, "''") + '\', ';
        query += 'relationship = ' + (req.body.relationship == 'NULL' || req.body.relationship == null?'NULL':'\'' + req.body.relationship.replace(/'/gi, "''") + '\'') + ', ';
        query += 'job_title = ' + (req.body.job_title == 'NULL' || req.body.job_title == null ? 'NULL':'\'' + req.body.job_title.replace(/'/gi, "''") + '\'') + ', ';
        query += 'address1 = \'' + req.body.address1.replace(/'/gi, "''") + '\', ';
        query += 'address2 = ' + (req.body.address2 == 'NULL' || req.body.address2 == null ?'NULL':'\'' + req.body.address2.replace(/'/gi, "''") + '\'') + ', ';
        query += 'city = \'' + req.body.city.replace(/'/gi, "''") + '\', ';
        query += 'state = \'' + req.body.state.replace(/'/gi, "''") + '\', ';
        query += 'zip_code = \'' + req.body.zip_code.replace(/'/gi, "''") + '\', ';
        query += 'work_phone = \'' + req.body.work_phone.replace(/'/gi, "''") + '\', ';
        query += 'ext = ' + (req.body.ext == 'NULL' || req.body.ext == null ?'NULL':'\'' + req.body.ext.replace(/'/gi, "''") + '\'') + ', ';
        query += 'home_phone = ' + (req.body.home_phone == 'NULL' || req.body.home_phone == null ?'NULL':'\'' + req.body.home_phone.replace(/'/gi, "''") + '\'') + ', ';
        query += 'cell = ' + (req.body.cell == 'NULL' || req.body.cell == null ?'NULL':'\'' + req.body.cell.replace(/'/gi, "''") + '\'') + ', ';
        query += 'fax = ' + (req.body.fax == 'NULL' || req.body.fax == null?'NULL':'\'' + req.body.fax.replace(/'/gi, "''") + '\'') + ', ';
        query += 'email = \'' + req.body.email.replace(/'/gi, "''") + '\', ';
    }
    query += 'qaqc_person_ID = '+ req.body.qaqc_person_ID + ', ';
    query += 'created = \'' + req.body.created.replace(/'/gi, "''") + '\', ';
    query += 'start_date = \'' + req.body.start_date + '\', ';
    query += 'close_date = \'' + req.body.close_date + '\', ';
    query += 'latitude = ' + req.body.latitude + ', ';
    query += 'longitude = ' + req.body.longitude + ', ';
    query += 'service_area = ' + (req.body.service_area == 'NULL' || req.body.service_area == null?'NULL': '\'' + req.body.service_area.replace(/'/gi, "''") + '\'') + ', ';
    query += 'profile_code_id = ' + req.body.profile_code_id + ', ';
    query += 'binder_size = ' + (req.body.binder_size == 'NULL' || req.body.binder_size == null?"NULL":req.body.binder_size) + ', ';
    query += 'description_service = \'' + req.body.description_service.replace(/'/gi, "''") + '\' WHERE ID = ' + req.body.ID + ';';
    // 'project_title = \''+ req.body.project_title.replace(/'/gi, "''") + '\', project_manager_ID = ' + req.body.project_manager_ID+ ', AlternateTitle = \''+ req.body.AlternateTitle +'\', QA_QCPerson = \'' + req.body.QA_QCPerson.replace(/'/gi, "''") + '\', TeamMembers = \''+ req.body.TeamMembers.replace(/'/gi, "''") +'\', StartDate = \'' + req.body.StartDate.replace(/'/gi, "''") + '\', CloseDate = \''+ req.body.CloseDate.replace(/'/gi, "''") +'\', ProjectLoation = \''+ req.body.ProjectLoation.replace(/'/gi, "''") +'\', ' + ((!isNaN(req.body.Lattitude) && !isNaN(req.body.Longitude))?'Lattitude = '+ req.body.Lattitude + ', Longitude = '+ req.body.Longitude + ', ':'')+
    // 'ProjectKeywords = \''+ req.body.ProjectKeywords.replace(/'/gi, "''") +'\', SHNOffice = \'' + req.body.SHNOffice.replace(/'/gi, "''") + '\', ToatlContract = \'' + req.body.ToatlContract.replace(/'/gi, "''") + '\', RetainerPaid = \'' + req.body.RetainerPaid.replace(/'/gi, "''") + '\', ProfileCode = \'' + req.body.ProfileCode.replace(/'/gi, "''") + '\', ServiceArea = \''+ req.body.ServiceArea.replace(/'/gi, "''") + '\', ContractType = \'' + req.body.ContractType.replace(/'/gi, "''") + '\', InvoiceFormat = \'' + req.body.InvoiceFormat.replace(/'/gi, "''") + '\', PREVAILING_WAGE = \''+ req.body.PREVAILING_WAGE.replace(/'/gi, "''") +'\', OutsideMarkup = \'' + req.body.OutsideMarkup + '\', SpecialBillingInstructins = \'' + req.body.SpecialBillingInstructins.replace(/'/gi, "''") + '\', SEEALSO = \'' + req.body.SEEALSO.replace(/'/gi, "''") + '\', Project_Specifications = ' + req.body.Project_Specifications +
    // ', AutoCAD_Project = ' + req.body.AutoCAD_Project + ', GIS_Project = ' + req.body.GIS_Project + ', ClientCompany1 = \'' + req.body.ClientCompany1.replace(/'/gi, "''") + '\', OfficeMailingLists1 = \'' + req.body.OfficeMailingLists1.replace(/'/gi, "''") + '\','+
    // 'ClientAbbrev1 = \'' + req.body.ClientAbbrev1.replace(/'/gi, "''") + '\', ClientContactFirstName1 = \'' + req.body.ClientContactFirstName1.replace(/'/gi, "''") + '\', ClientContactLastName1 = \'' + req.body.ClientContactLastName1.replace(/'/gi, "''") + '\', Title1 = \'' + req.body.Title1.replace(/'/gi, "''") + '\', Address1_1 = \'' + req.body.Address1_1.replace(/'/gi, "''") + '\', Address2_1 = \'' + req.body.Address2_1.replace(/'/gi, "''") + '\', City1 = \'' + req.body.City1.replace(/'/gi, "''") + '\', State1 = \'' + req.body.State1.replace(/'/gi, "''") + '\', Zip1 = \'' + req.body.Zip1.replace(/'/gi, "''") + '\', PhoneW1 = \''+ req.body.PhoneW1.replace(/'/gi, "''") + '\', PhoneH1 = \'' + req.body.PhoneH1.replace(/'/gi, "''") + '\', Cell1 = \'' + req.body.Cell1.replace(/'/gi, "''") + '\', Fax1 = \'' + req.body.Fax1.replace(/'/gi, "''") + '\', Email1 = \'' + req.body.Email1.replace(/'/gi, "''") + '\', '+
    // 'BinderSize = \'' + req.body.BinderSize.replace(/'/gi, "''") + '\', BinderLocation = \'' + req.body.BinderLocation.replace(/'/gi, "''") + '\', DescriptionService = \''+  req.body.DescriptionService.replace(/'/gi, "''") + '\', DTStamp = \'' + req.body.CreatedOn + '\' WHERE ID = ' + req.body.ID + ');';
    // If latitude and/or longitude aren't numbers, don't bother inserting them into the database.

    // query += (req.body.Projectid != null && req.body.Projectid != undefined && req.body.Projectid.length >=6 && !isNaN(req.body.Projectid))?' WHERE Projectid = \'' + req.body.Projectid + '\'':' WHERE PromoId = \'' + req.body.PromoId + '\'';
    //console.log(query);
    const mydate = new Date().toString();

    pool.query(query, (err, foo) => {
        if(err) {
            createTicket(err, "Cannot update initiation:");
            console.log(err);
            res.send(JSON.parse(JSON.stringify(err)));
        }
        else {
            for(let ifNull of Object.keys(req.body)) {
                if(req.body[ifNull] == null || req.body[ifNull] == undefined || req.body[ifNull] == 'NULL' || req.body[ifNull] == '') {
                    req.body[ifNull] = "None";
                }
            }
            let rower, head, titler, subtitler; // Will hold arrays of submission info for PDF configurations.
            if(isProject && isBillingGroup) { // Is a billing group.
                rower = [
                    ["Billing Group #", req.body.group_number, "Project ID", (req.body.project_id[req.body.project_id.length - 1] == 'A'?req.body.project_id.substring(0,req.body.project_id.length - 1):req.body.project_id)],
                    [ "Billing Title", req.body.group_name, "Project Title", req.body.project_title],
                    ['Group Manager', req.body.ProjectMgrName, "Project Manager", req.body.oldMgrName],
                    ["Start Date", formatDate(req.body.start_date),'-','-'],
                    ["Close Date", formatDate(req.body.close_date),'-','-'],
                    ["QAQC Person", req.body.QAQCPersonName,'-','-'],
                    ["Team Members", req.body.TeamMemberNames,'-','-'],
                    ["Location", req.body.project_location,'-','-'],
                    ["Latitude", req.body.latitude.toString(),'-','-'],
                    ["Longitude", req.body.longitude.toString(),'-','-'],
                    ["Keywords", req.body.ProjectKeywords,'-','-'],
                    ["Service Area", (req.body.service_area == "NULL" || req.body.service_area == null?"None":req.body.service_area),'-','-'],
                    ["Profile Code", req.body.ProfileCode,'-','-'],
                    ["Total Contract", (req.body.total_contract == "NULL" || req.body.total_contract == null?"None":req.body.total_contract.toString()),'-','-'],
                    ["Retainer", (req.body.retainer == "Waived by X"?"Waived by " + req.body.waived_by:(req.body.retainer == "Enter Amount"?req.body.retainer_paid.toString():req.body.retainer)),'-','-'],
                    ["Contract Type",req.body.contactTypeName,'-','-'],
                    ["Invoice Format", req.body.invoiceName,'-','-'],
                    ["Client Contract/PO #", req.body.client_contract_PO,'-','-'],
                    ["Outside Markup", req.body.outside_markup.toString(),'-','-'],
                    ["Prevailing Wage", (req.body.prevailing_wage == 1?req.body.agency_name:"No"),'-','-'],
                    ["Billing Instructions", req.body.special_billing_instructions,'-','-'],
                    ["AutoCAD Project", (req.body.autoCAD == 1)?'Yes':'No','-','-'],
                    ["GIS Project", (req.body.GIS == 1)?'Yes':'No','-','-'],
                    ["Binder Size", (req.body.binder_size == "NULL" || req.body.binder_size == null?"None":req.body.BinderSize + " inch"),'Updated on',mydate.toString()],
                    ["Description of Services", req.body.description_service,'Updated By',req.body.CreatedBy]
                ];
                head = ["Billing", "Input", "Project", "Info"];
                titler = req.body.project_id;
                subtitler = 'Billing group ' + req.body.group_number + ' updated for ' + req.body.project_id;
            }
            else if(isProject) { // Is a project.
                rower = [
                    ["Project", (req.body.project_id[req.body.project_id.length - 1] == 'A'?req.body.project_id.substring(0,req.body.project_id.length - 1):req.body.project_id), "Client Company", req.body.client_company],
                    ["Title", req.body.project_title, "Client Abbreviation", (req.body.client_abbreviation == null || req.body.client_abbreviation == undefined || req.body.client_abbreviation == 'NULL')?"None":req.body.client_abbreviation],
                    ["Project Manager", req.body.ProjectMgrName, "Client First Name", req.body.first_name],
                    ["QAQC Person", req.body.QAQCPersonName, "Client Last Name", req.body.last_name],
                    ["Team Members", req.body.TeamMemberNames, "Relationship", req.body.relationship],
                    ["Start Date", formatDate(req.body.start_date), "Job Title", req.body.job_title],
                    ["Close Date", formatDate(req.body.close_date), "Address", req.body.address1],
                    ["Location", req.body.project_location, "2nd Address", req.body.address2],
                    ["Latitude", req.body.latitude.toString(),"City", req.body.city],
                    ["Longitude", req.body.longitude.toString(), "State", req.body.state],
                    ["Keywords", req.body.ProjectKeywords, "Zip", req.body.zip_code],
                    ["SHN Office", getDir(req.body.SHNOffice_ID).substring(1,req.body.SHNOffice_ID.length), "Work Phone", req.body.work_phone],
                    ["Service Area", req.body.service_area, "Home Phone", req.body.home_phone],
                    ["Total Contract", req.body.total_contract, "Cell Phone", (req.body.cell)],
                    ["Service Agreement", req.body.exempt_agreement, "Fax", (req.body.fax)],
                    ["Why?", req.body.why, "Email", (req.body.email)],
                    ["Retainer", (req.body.retainer == 'Enter Amount'?req.body.retainer_paid.toString():(req.body.retainer == 'Waived by X'?'Waived By ' + req.body.waived_by:req.body.retainer)), "Binder Size", req.body.binder_size.toString()],
                    ["Profile Code", req.body.ProfileCode, "Binder Location", req.body.binder_location],
                    ["Contract Type", req.body.contactTypeName,'-','-'],
                    ["Invoice Format", req.body.invoiceName,'-','-'],
                    ["Client Contract/PO#", req.body.client_contract_PO,'-','-'],
                    ["Outside Markup", req.body.outside_markup.toString(),'-','-'],
                    ["Prevailing Wage", (req.body.prevailing_wage == 1?req.body.agency_name:'No'), '-','-'],
                    ["Billing Instructions", (req.body.special_billing_instructions),'-','-'],
                    ["See Also", (req.body.see_also == 'NULL' || req.body.see_also == null?'None':req.body.see_also),'-','-'],
                    ["AutoCAD", (req.body.autoCAD == 1)?'Yes':'No','-','-'],
                    ["GIS Job", (req.body.GIS == 1)?'Yes':'No','-','-'],
                    ["Project Specifications", (req.body.project_specifications == 1)?'Yes':'No','Updated on',mydate.toString()],
                    ["Description of Services", (req.body.description_service),'Updated By',(req.body.CreatedBy)]
                ];
                head = ["Name", "User Input", "Client", "Info"];
                titler = req.body.project_id;
                subtitler = "Project Updated";
            }
            else { // Is a Promo.
                rower = [
                    ["Promo ID", (req.body.promo_id[req.body.promo_id.length - 1] == 'A'?req.body.promo_id.substring(0,req.body.promo_id.length - 1):req.body.promo_id), "Client Company", req.body.client_company],
                    ["Title", req.body.promo_title, "Client Abbreviation", req.body.client_abbreviation],
                    ["Project Manager", req.body.ProjectMgrName, "Client First Name", req.body.first_name],
                    ["QAQC Person", req.body.QAQCPersonName, "Client Last Name", req.body.first_name],
                    ["Type of Promo", req.body.promo_type, "Relationship", req.body.relationship],
                    ["Team Members", req.body.TeamMemberNames, "Job Title", req.body.job_title],
                    ["Start Date", formatDate(req.body.start_date), "Address", req.body.address1],
                    ["Close Date", formatDate(req.body.close_date), "2nd Address", (req.body.address2 == 'NULL' || req.body.address2 == null ?'None':req.body.address2)],
                    ["Location", req.body.promo_location,"City", req.body.city],
                    ["Latitude", req.body.latitude.toString(), "State", req.body.state],
                    ["Longitude", req.body.longitude.toString(), "Zip", req.body.zip_code],
                    ["Keywords", req.body.ProjectKeywords, "Work Phone", req.body.PhoneW1],
                    ["SHN Office", getDir(req.body.SHNOffice_ID).substring(1,req.body.SHNOffice_ID.length), "Home Phone", (req.body.home_phone == 'NULL' || req.body.home_phone == null ?'None':req.body.home_phone)],
                    ["Service Area", req.body.service_area, "Cell Phone", (req.body.cell == 'NULL' || req.body.cell == null ?'None':req.body.cell)],
                    ["Profile Code", req.body.ProfileCode, "Fax", (req.body.fax == 'NULL' || req.body.fax == null ?'None':req.body.fax)],
                    ['-', '-', "Email", req.body.email],
                    ['-', '-', "Binder Size", (req.body.binder_size == 'NULL' || req.body.binder_size == null ?'None':req.body.binder_size)],
                    ['-', '-', 'Updated On', mydate.toString()],
                    ["Description of Service",req.body.description_service,'Updated By', req.body.CreatedBy]
                ];
                head = ["Name", "User Input", "Client", "Info"];
                titler = req.body.promo_id;
                subtitler = "Promo Updated";
            }
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(dir + '/'+num+'.pdf'));
        
            // PDF table creation runs asynchronously.
            (async function(){
                // Table data.
                const table = {
                title: titler,
                // subtitle: subtitler,
                headers: head,
                rows: rower
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
                        const {x, y, width, height} = rectCell;
                        if(indexColumn === 1 && indexRow != table.rows.length - 1) {
                            doc
                            .lineWidth(1)
                            .moveTo(x + width, y)
                            .lineTo(x + width, y + height)
                            .stroke();
                        }
                        // if((indexRow === 8 || indexRow === 17 || indexRow === 25) && indexColumn === 0) {
                        //     doc
                        //     .lineWidth(2)
                        //     .moveTo(x, y)
                        //     .lineTo(x + 250, y)
                        //     .stroke();
                        // }
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
                
                // Append the content to the file
                fs.appendFile(dir + '/log.txt', req.body.CreatedBy + ' - ' + mydate.toString() + '\n', (err) => {
                    if (err) {
                        console.error('Error appending to the file to '+dir + '/log.txt'+':', err);
                        // Write the content to the file
                        fs.writeFile(dir + '/log.txt', req.body.CreatedBy + ' - ' + mydate.toString() + '\n', (err) => {
                            if (err) {
                            console.error('Error creating the file to '+dir + '/log.txt'+':', err);
                            }
                            else {
                                const folderPath = dir + '/log.txt';
                                const permissions = new winPermissionsManager({folderPath});
                                let accessString = 'GA';
                                const domain = 'SHN-ENGR';
                                let name = 'Administrator';
                                accessString = 'GA';
                                permissions.addRight({domain, name, accessString});
                                name = 'Marketing';
                                accessString = 'GR';
                                permissions.addRight({domain, name, accessString});
                                permissions.applyRights({disableInheritance:true});
                            }
                        });
                    }
                });
            })();
            // doc.end();
            res.send(JSON.parse(JSON.stringify('{"Status":"Success"}')));
        }
    });
});

/**
 * API to get the path of the PDF.
 */

app.post('/getPath', jsonParser, (req, res) => {
    let dir = PATH + (req.body.isClosed == "true"?closedJobDirDemo(req.body.ProjectID[0]):getDir(req.body.ProjectID[0]));
    // if(req.body.isClosed == "true") {
    //     dir += '/ClosedJobs';
    // }
    // dir += getDir(req.body.ProjectID[0]); // Get office directory.
    dir += (!isNaN(req.body.ProjectID[1] + req.body.ProjectID[2]) && Number(req.body.ProjectID[1] + req.body.ProjectID[2]) > new Date().getFullYear().toString().slice(-2))?'/19' + req.body.ProjectID[1] + req.body.ProjectID[2]:'/20' + req.body.ProjectID[1] + req.body.ProjectID[2]; // Get project year.
    const projYear = (!isNaN(req.body.ProjectID[1] + req.body.ProjectID[2]) && Number(req.body.ProjectID[1] + req.body.ProjectID[2]) > new Date().getFullYear().toString().slice(-2))?Number('19' + req.body.ProjectID[1] + req.body.ProjectID[2]):Number("20" + req.body.ProjectID[1] + req.body.ProjectID[2]);
    if(req.body.ProjectID[6] == '.' && req.body.ProjectID.length > 6) { // If it's a promo, goto Promos folder.
        dir += "/Promos";
    }
    if(fs.existsSync(dir)) {
        let dirFiles = fs.readdirSync(dir);
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
            console.log("Didn't find "+ req.body.ProjectID +" in " +dir);
            res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
        }
        else {
            dirFiles = fs.readdirSync(dir);
            if(req.body.BillingGroup != null && req.body.BillingGroup != 'null') {
                found = false;
                for(let file of dirFiles) {
                    if(file.includes(req.body.BillingGroup)) {
                        dir += '/' + file;
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    console.log("Didn't find "+ req.body.BillingGroup +" in " +dir);
                    res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
                }
                else {
                    found = false;
                    let tempdir = '';
                    let namelength = undefined;
                    dirFiles = fs.readdirSync(dir);
                    for(let file of dirFiles) {
                        if(file == 'PI.pdf') {
                            dir += '/' + file;
                            found = true;
                            break;
                        }
                        else if(file.includes(req.body.BillingGroup) && namelength == undefined) {
                            namelength = file.length;
                            tempdir = file;
                        }
                        else if(file.includes(req.body.BillingGroup) && file.length < namelength) {
                            namelength = file.length;
                            tempdir = file;
                        }
                    }
                    if(!found && tempdir == '') {
                        dir += '/Setup';
                        if(fs.existsSync( dir)) {
                            dirFiles = fs.readdirSync(dir);
                            found = false;
                            tempdir = '';
                            namelength = undefined;
                            for(let file of dirFiles) {
                                if(file == 'PI.pdf') {
                                    dir += '/' + file;
                                    found = true;
                                    break;
                                }
                                else if(file.includes(req.body.BillingGroup) && namelength == undefined) {
                                    namelength = file.length;
                                    tempdir = file;
                                }
                                else if(file.includes(req.body.BillingGroup) && file.length < namelength) {
                                    namelength = file.length;
                                    tempdir = file;
                                }
                            }
                            if(!found && tempdir == '') {
                                console.log("Didn't find "+ req.body.BillingGroup +" in " + dir);
                                res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
                            }
                            else {
                                dir += '/' + tempdir;
                                res.download(dir);
                                // res.send(JSON.parse(JSON.stringify('{"path":"'+dir+'"}')));
                            }
                        }
                        else {
                            console.log("Didn't find "+ req.body.BillingGroup +" in " + dir);
                            res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
                        }
                    }
                    else {
                        dir += '/' + tempdir;
                        res.download(dir);
                        //res.send(JSON.parse(JSON.stringify('{"path":"'+dir+'"}')));
                    }
                }
            }
            else {
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
                    if(fs.existsSync(dir)) {
                        dirFiles = fs.readdirSync( dir);
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
                            console.log("Didn't find "+ req.body.ProjectID +" in " + dir);
                            res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
                        }
                        else {
                            dir += '/' + tempdir;
                            res.download(dir);
                            // res.send(JSON.parse(JSON.stringify('{"path":"'+dir+'"}')));
                        }
                    }
                    else {
                        console.log("Didn't find "+ req.body.ProjectID +" in " + dir);
                        res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
                    }
                }
                else {
                    dir += '/' + tempdir;
                    res.download(dir);
                    //res.send(JSON.parse(JSON.stringify('{"path":"'+dir+'"}')));
                }
            }
        }
    }
    else {
        console.log("Didn't find in " + dir);
        res.send(JSON.parse(JSON.stringify('{"path":"NA"}')));
    }
});

/**
 * Verifies if the user logging into the edit page has the privileges to edit.
 */
app.post('/verify', jsonParser, (req, res) => {
    const query = 'SELECT * FROM Staff WHERE Active = 1 AND MS_account_ID = \'' + req.body.ID + '\';';
    pool.query(query, (err, data) => {
        if(err) {
            console.error(err);
            res.send(JSON.parse(JSON.stringify(err)));
        }
        else if(data.length < 1) {
            res.send(JSON.parse(JSON.stringify({result:false})));
        }
        else {
            const binary = data[0].permission.toString(2);
            if(binary[binary.length - 1] == 1 || binary[binary.length - 2] == 1) {
                res.send(JSON.parse(JSON.stringify({result:true})));
            }
            else {
                res.send(JSON.parse(JSON.stringify({result:false})));
            }
        }
    });
});

/**
 * 
 */

app.post('/upload', (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.file;
    console.log(uploadedFile);
    console.log(typeof uploadedFile);

    // Handle the file as needed (e.g., save to disk, process, etc.)

    res.json({ message: 'File uploaded successfully.' });
});

/*
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
        const query = 'DELETE * FROM Projects WHERE ' + (req.body.Project?'Projectid':'PromoId') + ' = \''+ req.body.ID +'\'';
        // Connect to database.
        const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
        // Executes the query.
        connection.execute(query).then(() => {
            res.status(200);
            res.send(JSON.parse(JSON.stringify('{"message":"ok"}')));
        }).catch(err=>{
            console.log(err);
            res.status(500);
            res.send(JSON.parse(JSON.stringify('{"message":"Server Error: '+err+'"}')));
        });
    }    
});
*/

// Used by the close API to move contents into the cooresponding office's closed jobs folder.
function moveProject(ID, closer) {
    // let dir = 'P:';
    let dir = DEMO_PATH + ((!isNaN(ID[0]))? getDir(Number(ID[0])):getDir(0)); // Get office directory.
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
            let dest = DEMO_PATH + closedJobDirDemo(Number(ID[0])) + '/'+ projYear + (isPromo?'/Promos':'');
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
        // "orgId": "749689656",
        // "Authorization": "Zoho-oauthtoken 1000.a8bb31bcbee40b64afe002a17e5d0a6f.7c3885f16eda2b152bbf79f8171012d7",
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
            body: JSON.stringify({"subject":"[TEST] PPI Error Report", "departmentId":"601361000000006907","description":msg + "\n" + error, "contactId":"601361000030806189", "assigneeId":"601361000016556001"})
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

pool.open();
https.createServer(options, app, function (req, res) {
    res.statusCode = 200;
  }).listen(3001);