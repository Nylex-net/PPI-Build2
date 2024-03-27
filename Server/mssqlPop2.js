const sql = require('mssql');
const ADODB = require('node-adodb')
const fs = require('fs');
// const Pool = require('generic-pool');
// const config = require('./config.json');
const DATABASE_PATH = "C:\\Users\\henry\\Documents\\SHN_Project_Backup.mdb;";
// const query = "SELECT * FROM master.dbo.Staff";
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
const jsonData = require('./config.json');
const codeMap = new Map();
const keyMap = new Map();
let request;

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
                populateStaff();
                populateKeywords();
                populateProfileCodes();
                populateData();
            }
        });
    }
});

/**
 * Populates the new database with staff members.
 */

function populateStaff() {
    // Populates Staff.
    connection.query('SELECT ID, Active, First, Last, Email, PM FROM Contacts').then(data => {
        let query = '';
        data.forEach((element) => {
            query += "INSERT INTO Staff VALUES ("+element.ID+", "+((element.Active == 'Yes')?1:0)+", '"+element.First.replace(/'/gi, "''")+"', '"+(typeof element.Last == 'string'?element.Last.replace(/'/gi, "''"):'')+"', '"+element.Email+"', "+(element.PM==-1?1:0)+", 0, NULL);";
        });
        pool.query(query, (err, rows) => {
            if(err) {
                console.log(query);
                console.error(err);
            }
        });
    }).catch(err => {
        console.error(err);
    });
}

/**
 * Populates the new database with the old Keywords.
 */

function populateKeywords() {
    connection.query('SELECT ID, Keyword, Group1 FROM Keywords').then(data => {
        let query = '';
        data.forEach((element) => {
            query += "INSERT INTO Keywords OUTPUT inserted.* VALUES ("+element.ID+", '" +element.Keyword.replace(/'/gi, "''")+"', "+((element.Group1 == null || element.Group1 == '')?'NULL':"'"+element.Group1.replace(/'/gi, "''")+"'")+");";
        });
        pool.query(query, (err, rows) => {
            if(err) {
                console.log(query);
                console.error(err);
            }
            else {
                rows.recordsets.forEach((row) => {
                    keyMap.set(row[0].Keyword.toLowerCase().trim(), row[0].ID);
                });
            }
        });
    }).catch(err => {
        console.error(err);
    });
}

/**
 * Populates the new database with the old profile codes.
 */

function populateProfileCodes() {
    connection.query('SELECT id, Code, CodeDescription, Active FROM ProfileCodes').then(data => {
        let query ='';
        data.forEach((element) => {
            query += "INSERT INTO ProfileCodes OUTPUT inserted.* VALUES ("+element.id+", '"+element.Code+"', '" +element.CodeDescription.replace(/'/gi, "''")+"', "+((element.Active == -1)?1:0)+");";
            // codeMap.set(element.Code, element.id); // If you uncomment the above msnodesqlv8 INSERT query, comment this line out.
        });
        pool.query(query, (err, rows) => {
            if(err) {
                console.error(err);
            }
            else {
                for (const row of rows.recordsets) {
                    codeMap.set(row[0].Code, row[0].ID);
                    // console.log(`ID: ${row[0].ID}, Code: ${row[0].Code}`);
                  }
            }
        });
    }).catch(err => {
        console.error(err);
    });
}

/**
 * Populates the projects, billing groups, and promos tables.
 * The billing groups are executed by this function because they need to be linked to their associated project.
 * So are promos to make use of this function's internal idToId object.
 */

function populateData() {
    connection.query("SELECT * FROM Projects WHERE Projectid IS NOT NULL AND Projectid <> '' AND ProjectTitle IS NOT NULL AND ProjectTitle <> ''").then(data => {
        const now = new Date();
        const currDate = (now.getMonth() + 1).toString() + "/" + now.getDate().toString() +"/"+ now.getFullYear().toString();
        let query = '';
        const billBoi = new Array();
        const members = new Map();
        const keywordMap = new Map();
        data.forEach((element) => {
                var stamper = (element.DTStamp != null && element.DTStamp != '' && !isNaN(Date.parse(element.DTStamp)) && new Date(element.DTStamp) instanceof Date)?new Date(element.DTStamp):new Date((element.StartDate != null && element.StartDate != ''&& !isNaN(Date.parse(element.StartDate)) && new Date(element.StartDate) instanceof Date)?element.StartDate:Date.now());
                var dtstamp = (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
                var starty = new Date((element.StartDate != null && element.StartDate != '' && !isNaN(Date.parse(element.StartDate)) && new Date(element.StartDate) instanceof Date)?element.StartDate:Date.now());
                var start = (starty.getMonth() + 1).toString() + "/" + starty.getDate().toString() +"/"+ starty.getFullYear().toString();
                var closey = new Date((element.CloseDate != null && element.CloseDate != '' && !isNaN(Date.parse(element.CloseDate)) && new Date(element.CloseDate) instanceof Date)?element.CloseDate:Date.now());
                var close =(closey.getMonth() + 1).toString() + "/" + closey.getDate().toString() +"/"+ closey.getFullYear().toString();
            if(element.BillGrp == null || element.BillGrp == 'NULL' || (typeof element.BillGrp == 'string' && element.BillGrp.trim() == '')) {
                query += "IF NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = '"+element.Projectid+"') BEGIN TRY INSERT INTO Projects "+
                "(project_id, project_title, project_manager_ID, qaqc_person_ID, closed, created, start_date, close_date, project_location, latitude, longitude, SHNOffice_ID, service_area, "+
                "total_contract, exempt_agreement, why, retainer, retainer_paid, waived_by, profile_code_id, project_type, contract_ID, invoice_format, client_contract_PO, outside_markup, prevailing_wage, "+
                "agency_name, special_billing_instructions, see_also, autoCAD, GIS, project_specifications, client_company, client_abbreviation, mailing_list, first_name, last_name, relationship, "+
                "job_title, address1, address2, city, state, zip_code, work_phone, ext, home_phone, cell, fax, email, binder_size, binder_location, description_service) OUTPUT inserted.* "+
                "VALUES ('"+// element.Id +", '"+
                element.Projectid+"', '" +
                ((element.ProjectTitle == null && element.ProjectTitle == "NULL")?"None":element.ProjectTitle.replace(/'/gi, "''"))+"', "+
                ((isNaN(element.ProjectMgr) || element.ProjectMgr == null || element.ProjectMgr == "NULL" || element.ProjectMgr == "")?53:element.ProjectMgr) +", "+
                ((isNaN(element.QA_QCPerson) || element.QA_QCPerson == null || element.QA_QCPerson == "NULL" || element.QA_QCPerson == "")?53:element.QA_QCPerson)+", "+
                (element.Closed_by_PM===-1?1:0)+", '"+
                ((dtstamp == NaN)?currDate:dtstamp)+"', '"+
                ((start == NaN)?currDate:start)+"', '"+
                ((close == NaN)?currDate:close)+"', '"+
                ((element.ProjectLoation == null || element.ProjectLoation == "NULL" || element.ProjectLoation == "")?"SHN":element.ProjectLoation.replace(/'/gi, "''"))+"', "+
                (isNaN(element.Lattitude) || element.Lattitude == null || element.Lattitude == "NULL" ||(element.Lattitude > 90 || element.Lattitude < -90)?40.868928:element.Lattitude)+", "+
                (isNaN(element.Longitude)|| element.Longitude == null || element.Longitude == "NULL" ||(element.Longitude > 180 || element.Longitude < -180)?-123.988061:element.Longitude)+", "+
                ((element.SHNOffice == "Eureka" || element.SHNOffice == "Arcata")?0:(element.SHNOffice == "Klamath Falls" || element.SHNOffice == "KFalls")?2:(element.SHNOffice == "Willits")?4:(element.SHNOffice == "Redding")?5:6)+", '"+
                ((element.ServiceArea == null || element.ServiceArea == "NULL" || element.ServiceArea == "")?"Civil":element.ServiceArea)+"', "+
                ((element.ToatlContract == null || element.ToatlContract == "NULL" || element.ToatlContract == "")?0:((isNaN(element.ToatlContract[0]) && element.ToatlContract.length > 1))?(isNaN(element.ToatlContract.substring(1))?0:Number(element.ToatlContract.substring(1))):0) +", 0, NULL, '"+
                ((element.RetainerPaid != null && element.RetainerPaid != "NULL" && element.RetainerPaid != "")?element.RetainerPaid.replace(/'/gi, "''"):"NA")+"', "+
                ((element.RetainerPaid == null || element.RetainerPaid == "NULL" || element.RetainerPaid == "")?0:(isNaN(element.RetainerPaid.substring(1))?"NULL":Number(element.RetainerPaid.substring(1))))+", "+
                ((element.RetainerPaid != null && element.RetainerPaid != "NULL" && element.RetainerPaid.includes("Waived by"))?"'"+element.RetainerPaid.substring(10).replace(/'/gi, "''")+"'":"NULL")+", "+
                (codeMap.get(element.ProfileCode)==undefined?167:codeMap.get(element.ProfileCode))+", 0, "+
                ((isNaN(element.ContractType) || element.ContractType == null || element.ContractType == "NULL")?1:(element.ContractType.includes("10")?10:(isNaN(element.ContractType[0])?1:element.ContractType[0]))) +", "+
                (/n\\a|na|null|none/gi.test(element.InvoiceFormat)?"NULL":(element.InvoiceFormat.length <= 0?"NULL":"'"+element.InvoiceFormat[0]+"'"))+", 'NA', "+
                ((isNaN(element.OutsideMarkup) || element.OutsideMarkup == null || element.OutsideMarkup == "NULL" || element.OutsideMarkup == "")?15:element.OutsideMarkup) +", "+
                ((element.PREVAILING_WAGE == 1 || element.PREVAILING_WAGE == "Yes")?1:0)+", NULL, "+
                ((element.SpecialBillingInstructins == null || element.SpecialBillingInstructins == "NULL" || element.SpecialBillingInstructins == "")?"NULL":"'"+element.SpecialBillingInstructins.replace(/'/gi, "''")+"'")+", "+
                (element.SEEALSO==null||element.SEEALSO == "NULL"||element.SEEALSO == ""?"NULL":"'"+element.SEEALSO.replace(/'/gi, "''")+"'")+", "+
                (element.AutoCAD_Project == -1?1:0)+", "+
                (element.GIS_Project == -1?1:0)+", "+
                (element.Project_Specifications==-1?1:0)+", '"+
                ((element.ClientCompany1 == null || element.ClientCompany1 == "NULL" || element.ClientCompany1 == "")?"SHN":element.ClientCompany1.replace(/'/gi, "''"))+"', "+
                ((element.ClientAbbrev1 == null || element.ClientAbbrev1 == 'NULL' || element.ClientAbbrev1 == '')?'NULL':"'"+element.ClientAbbrev1.replace(/'/gi, "''") + "'")+", "+
                (/n\\a|na|null|none|/gi.test(element.OfficeMailingLists1)?"NULL":"'"+element.OfficeMailingLists1.replace(/'/gi, "''")+"'")+", '"+
                ((element.ClientContactFirstName1 == null || element.ClientContactFirstName1 == "NULL")?"?":element.ClientContactFirstName1.replace(/'/gi, "''"))+"', '"+
                ((element.ClientContactLastName1 == null || element.ClientContactLastName1 == "NULL" || element.ClientContactLastName1 == "")?"?":element.ClientContactLastName1.replace(/'/gi, "''"))+"', NULL, "+
                ((element.Title1 == null || element.Title1 == "NULL" || element.Title1 == "")?"NULL":"'"+element.Title1.replace(/'/gi, "''")+"'")+", '"+
                (element.Address1_1==null || element.Address1_1=="NULL" || element.Address1_1=="" ?"812 W. Wabash Ave.":element.Address1_1.replace(/'/gi, "''"))+"', "+
                (element.Address2_1==null || element.Address2_1=="NULL" || element.Address2_1==""?"NULL":"'"+element.Address2_1.replace(/'/gi, "''")+"'")+", '"+
                ((element.City1==null || element.City1=="NULL" || element.City1=="")?"Eureka":element.City1.replace(/'/gi, "''"))+"', '"+
                ((element.State1==null||element.State1=="NULL"||element.State1=="")?"CA":element.State1.replace(/'/gi, "''"))+"', '"+
                ((element.Zip1==null||element.Zip1=="NULL"||element.Zip1=="")?"95501":element.Zip1.replace(/'/gi, "''"))+"', '"+
                ((element.PhoneW1==null || element.PhoneW1=="NULL" || element.PhoneW1=="")?"000-000-0000":element.PhoneW1.replace(/'/gi, "''"))+"', NULL, "+
                (element.PhoneH1==null || element.PhoneH1=="NULL"|| element.PhoneH1==""?"NULL":"'"+element.PhoneH1.replace(/'/gi, "''")+"'")+", "+
                (element.Cell1==null || element.Cell1=="NULL" || element.Cell1==""?"NULL":"'"+element.Cell1.replace(/'/gi, "''")+"'")+", "+
                (element.Fax1==null || element.Fax1=="NULL"|| element.Fax1==""?"NULL":"'"+element.Fax1.replace(/'/gi, "''")+"'")+", '"+
                (element.Email1==null || element.Email1=="NULL" || element.Email1==""?"none":element.Email1.replace(/'/gi, "''"))+"', "+
                (element.BinderSize == "NA" || element.BinderSize == "NULL" || element.BinderSize == null || element.BinderSize == ""?"NULL":(element.BinderSize == "1/2"?0.5:(element.BinderSize==1?1:(element.BinderSize==1.5?1.5:(element.BinderSize==2?2:3)))))+", "+
                (element.BinderLocation==null || element.BinderLocation=="NULL"||element.BinderLocation=="undefined"||element.BinderLocation==""?"NULL":"'"+element.BinderLocation.replace(/'/gi, "''")+"'")+", '"+
                (element.DescriptionService==null || element.DescriptionService=="NULL"||element.DescriptionService=="undefined"||element.DescriptionService==""?"None":element.DescriptionService.replace(/'/gi, "''"))+"');END TRY BEGIN CATCH END CATCH;";
                // console.log(query);
                if(!members.has(element.Projectid) && element.TeamMembers != null && element.TeamMembers != '') {
                    members.set(element.Projectid, element.TeamMembers);
                }
                if(!keywordMap.has(element.Projectid) && element.ProjectKeywords != null && element.ProjectKeywords != '') {
                    keywordMap.set(element.Projectid, element.ProjectKeywords.toLowerCase());
                }
            }
            else if(typeof element.BillGrp == 'string' && ((element.BillGrp.length == 3 && !isNaN(element.BillGrp)) || (element.BillGrp.length == 4 && element.BillGrp[0] == '.' && !isNaN(element.BillGrp.substring(1))))) {
                billBoi.push(element);
            }
        });
        pool.query(query, (err, rows) => {
            if(err) {
                console.error(err);
            }
            else { // Link the team member IDs and the Keywords to each project.
                const idToId = new Map(); // Used to map billing groups to associated projects.
                let linkQuery = '';
                // console.log(rows);
                for (const row of rows.recordsets) {
                    if(row[0] != undefined) {
                        idToId.set(row[0].project_id, row[0].ID);
                        if(members.get(row[0].project_id) != null && members.get(row[0].project_id) != "NULL" && members.get(row[0].project_id) != "") {
                            var memberArray = members.get(row[0].project_id).split(',').filter((id) => {
                                return !isNaN(id);
                            });
                            if(memberArray.length > 0) {
                                memberArray.forEach((member) => {
                                    linkQuery += "INSERT INTO ProjectTeam VALUES ("+ row[0].ID + ", " + member + ");";
                                });
                            }
                        }
                        if(keywordMap.get(row[0].project_id) != null && keywordMap.get(row[0].project_id) != "NULL" && keywordMap.get(row[0].project_id) != "") {
                            var keyArray = keywordMap.get(row[0].project_id).split(/,| \|\| /);
                            if(keyArray.length > 0) {
                                keyArray.forEach((key) => {
                                    var trimmed = key.trim();
                                    if(keyMap.has(trimmed)) {
                                        linkQuery += "INSERT INTO ProjectKeywords VALUES ("+ row[0].ID + ", " + keyMap.get(trimmed) + ");";
                                    }
                                });
                            }
                        }
                    }
                }
                pool.query(linkQuery, (err) => {
                    if(err) {
                        console.error(err);
                    }
                });
                populateBillingGroups(billBoi, idToId);
                populatePromos(idToId);
            }
        });

    }).catch((err) => {
        console.error(err);
    });
}

/**
 * Populates the billing groups tables.
 * The populateProjects() function calls this method so it can link the billing groups to the projects.
 * @param {object} bills is an array of project entries with an associated billing group.
 * @param {object} idMap is a Map object whose keys are SHN's traditional project ID system, and the values are the projects' associated database ID.
 */

function populateBillingGroups(bills, idMap) {
    const members = new Map();
    const keywordMap = new Map();
    let query = '';
    bills.forEach((element) => {
        // Date Formatting.
        var stamper = (element.DTStamp != null && element.DTStamp != '' && !isNaN(Date.parse(element.DTStamp)) && new Date(element.DTStamp) instanceof Date)?new Date(element.DTStamp):new Date((element.StartDate != null && element.StartDate != ''&& !isNaN(Date.parse(element.StartDate)) && new Date(element.StartDate) instanceof Date)?element.StartDate:Date.now());
        var dtstamp = (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
        var starty = new Date((element.StartDate != null && element.StartDate != '' && !isNaN(Date.parse(element.StartDate)) && new Date(element.StartDate) instanceof Date)?element.StartDate:Date.now());
        var start = (starty.getMonth() + 1).toString() + "/" + starty.getDate().toString() +"/"+ starty.getFullYear().toString();
        var closey = new Date((element.CloseDate != null && element.CloseDate != '' && !isNaN(Date.parse(element.CloseDate)) && new Date(element.CloseDate) instanceof Date)?element.CloseDate:Date.now());
        var close =(closey.getMonth() + 1).toString() + "/" + closey.getDate().toString() +"/"+ closey.getFullYear().toString();
        var billCosby = ((element.BillGrp.trim().length >= 4 && !isNaN(element.BillGrp))?element.BillGrp.substring(element.BillGrp.length - 3):(isNaN(element.BillGrp) || element.BillGrp == null?null:element.BillGrp.trim())); // Bruh.

        if(billCosby != null && idMap.get(element.Projectid) != undefined) {
            // Build query string.
            query += "IF NOT EXISTS (SELECT 1 FROM BillingGroups WHERE project_ID = "+(idMap.get(element.Projectid))+" AND group_number = '"+(billCosby)+"') "+
            "BEGIN TRY INSERT INTO BillingGroups (project_ID, group_number, group_name, closed, autoCAD, GIS, manager_id, qaqc_person_ID, created, start_date, close_date, "+
            "group_location, latitude, longitude, service_area, total_contract, retainer, retainer_paid, waived_by, profile_code_id, contract_id, invoice_format, " +
            "client_contract_PO, outside_markup, agency_name, special_billing_instructions, binder_size, description_service"+") OUTPUT inserted.* VALUES (" +
            idMap.get(element.Projectid) + ", " + billCosby + ", '" +
            (element.BillingTitle == null || element.BillingTitle == "NULL" || element.BillingTitle == ""?"[NO TITLE]":element.BillingTitle.replace(/'/gi, "''"))+"', "+
            (element.Closed_by_PM===-1?1:0) + ", " +
            (element.AutoCAD_Project == -1?1:0)+", "+
            (element.GIS_Project == -1?1:0)+", "+
            ((isNaN(element.ProjectMgr) || element.ProjectMgr == null || element.ProjectMgr == "NULL" || element.ProjectMgr == "")?53:element.ProjectMgr) +", "+
            ((isNaN(element.QA_QCPerson) || element.QA_QCPerson == null || element.QA_QCPerson == "NULL" || element.QA_QCPerson == "")?53:element.QA_QCPerson)+", '"+
            ((dtstamp == NaN)?currDate:dtstamp)+"', '"+
            ((start == NaN)?currDate:start)+"', '"+
            ((close == NaN)?currDate:close)+"', '"+
            ((element.ProjectLoation == null || element.ProjectLoation == "NULL" || element.ProjectLoation == "")?"SHN":element.ProjectLoation.replace(/'/gi, "''"))+"', "+
            (isNaN(element.Lattitude) || element.Lattitude == null || element.Lattitude == "NULL" ||(element.Lattitude > 90 || element.Lattitude < -90)?40.868928:element.Lattitude)+", "+
            (isNaN(element.Longitude)|| element.Longitude == null || element.Longitude == "NULL" ||(element.Longitude > 180 || element.Longitude < -180)?-123.988061:element.Longitude)+", '"+
            // ((element.SHNOffice == "Eureka" || element.SHNOffice == "Arcata")?0:(element.SHNOffice == "Klamath Falls" || element.SHNOffice == "KFalls")?2:(element.SHNOffice == "Willits")?4:(element.SHNOffice == "Redding")?5:6)+", '"+
            ((element.ServiceArea == null || element.ServiceArea == "NULL" || element.ServiceArea == "")?"Civil":element.ServiceArea)+"', "+
            ((element.ToatlContract == null || element.ToatlContract == "NULL" || element.ToatlContract == "")?0:((isNaN(element.ToatlContract[0]) && element.ToatlContract.length > 1))?(isNaN(element.ToatlContract.substring(1))?0:Number(element.ToatlContract.substring(1))):0) +", '"+
            ((element.RetainerPaid != null && element.RetainerPaid != "NULL" && element.RetainerPaid != "")?element.RetainerPaid.replace(/'/gi, "''"):"NA")+"', "+
            ((element.RetainerPaid == null || element.RetainerPaid == "NULL" || element.RetainerPaid == "")?0:(isNaN(element.RetainerPaid.substring(1))?"NULL":Number(element.RetainerPaid.substring(1))))+", "+
            ((element.RetainerPaid != null && element.RetainerPaid != "NULL" && element.RetainerPaid.includes("Waived by"))?"'"+element.RetainerPaid.substring(10).replace(/'/gi, "''")+"'":"NULL")+", "+
            (codeMap.get(element.ProfileCode)==undefined?167:codeMap.get(element.ProfileCode))+", "+
            ((isNaN(element.ContractType) || element.ContractType == null || element.ContractType == "NULL")?1:(element.ContractType.includes("10")?10:(isNaN(element.ContractType[0])?1:element.ContractType[0]))) +", "+
            (/n\\a|na|null|none/gi.test(element.InvoiceFormat)?"NULL":(element.InvoiceFormat.length <= 0?"NULL":"'"+element.InvoiceFormat[0]+"'"))+", 'NA', "+
            ((isNaN(element.OutsideMarkup) || element.OutsideMarkup == null || element.OutsideMarkup == "NULL" || element.OutsideMarkup == "")?15:element.OutsideMarkup) +", "+
            // ((element.PREVAILING_WAGE == 1 || element.PREVAILING_WAGE == "Yes")?1:0)+", NULL, "+
            ((element.SpecialBillingInstructins == null || element.SpecialBillingInstructins == "NULL" || element.SpecialBillingInstructins == "")?"NULL":"'"+element.SpecialBillingInstructins.replace(/'/gi, "''")+"'")+", "+
            (element.BinderSize == "NA" || element.BinderSize == "NULL" || element.BinderSize == null || element.BinderSize == ""?"NULL":(element.BinderSize == "1/2"?0.5:(element.BinderSize==1?1:(element.BinderSize==1.5?1.5:(element.BinderSize==2?2:3)))))+", '"+
            (element.DescriptionService==null || element.DescriptionService=="NULL"||element.DescriptionService=="undefined"||element.DescriptionService==""?"None":element.DescriptionService.replace(/'/gi, "''"))+
            "'); END TRY BEGIN CATCH END CATCH;";

            // Because we don't have a unique identifier for Billing groups, Project IDs will have an array of associated billing groups as .
            if(element.TeamMembers != null && element.TeamMembers != 'NULL' && element.TeamMembers != '' && element.TeamMembers != undefined) {
                if(!members.has(idMap.get(element.Projectid))) {
                    members.set(idMap.get(element.Projectid), new Map());
                    members.get(idMap.get(element.Projectid)).set(billCosby, element.TeamMembers.split(/,| \|\| /).filter(mem => {return mem.trim() != '' && !isNaN(mem);}));
                }
                else if(!members.get(idMap.get(element.Projectid)).has(billCosby)) {
                    members.get(idMap.get(element.Projectid)).set(billCosby, element.TeamMembers.split(/,| \|\| /).filter(mem => {return mem.trim() != '' && !isNaN(mem);}));
                }
            }
            if(element.ProjectKeywords != null && element.ProjectKeywords != 'NULL' && element.ProjectKeywords != '' && element.ProjectKeywords != undefined) {
                if(!keywordMap.has(idMap.get(element.Projectid))) {
                    keywordMap.set(idMap.get(element.Projectid), new Map());
                    keywordMap.get(idMap.get(element.Projectid)).set(billCosby, element.ProjectKeywords.toLowerCase().split(/,| \|\| /).filter(key => {return key.trim() != ''}));
                }
                else if(!keywordMap.get(idMap.get(element.Projectid)).has(billCosby)) {
                    keywordMap.get(idMap.get(element.Projectid)).set(billCosby, element.ProjectKeywords.toLowerCase().split(/,| \|\| /).filter(key => {return key.trim() != ''}));
                }
            }
        }
    });
    // execution of query.
    pool.query(query, (err, rows) => {
        if(err) {
            console.error(err);
        }
        else {
            let linkQuery = '';
            // console.log(keywordMap);
            for (const row of rows.recordsets) {
                if(row[0] != undefined) {
                    if(typeof members.get(row[0].project_ID) === 'object' && members.get(row[0].project_ID) !== null && Array.isArray(members.get(row[0].project_ID).get(row[0].group_number))) {
                        for(const member of members.get(row[0].project_ID).get(row[0].group_number)) {
                            linkQuery += "BEGIN TRY INSERT INTO BillingGroupTeam VALUES("+row[0].ID + ", "+ member +");END TRY BEGIN CATCH END CATCH;";
                        };
                    }
                    if(typeof keywordMap.get(row[0].project_ID) === 'object' && keywordMap.get(row[0].project_ID) !== null && Array.isArray(keywordMap.get(row[0].project_ID).get(row[0].group_number))) {
                        for(const key of keywordMap.get(row[0].project_ID).get(row[0].group_number)) {
                            if(keyMap.has(key.trim())) {
                                // console.log(key.trim());
                                linkQuery += "BEGIN TRY INSERT INTO BillingGroupKeywords VALUES("+row[0].ID + ", "+ keyMap.get(key.trim()) +");END TRY BEGIN CATCH END CATCH;";
                            }
                        }
                    }
                }
            }
            pool.query(linkQuery, (err) => {
                if(err) {
                    console.error(err);
                }
            });
        }
    });
}

function populatePromos(idMap) {
    connection.query("SELECT * FROM Projects WHERE PromoId IS NOT NULL AND PromoId <> '' AND ProjectTitle IS NOT NULL AND ProjectTitle <> ''").then(data => {
        const now = new Date();
        const currDate = (now.getMonth() + 1).toString() + "/" + now.getDate().toString() +"/"+ now.getFullYear().toString();
        const members = new Map();
        const keywordMap = new Map();
        let query = '';
        data.forEach((element) => {
            var stamper = (element.DTStamp != null && element.DTStamp != '' && !isNaN(Date.parse(element.DTStamp)))?new Date(element.DTStamp):new Date((element.StartDate != null && element.StartDate != ''&& !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
            var dtstamp = (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
            var starty = new Date((element.StartDate != null && element.StartDate != '' && !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
            var start = (starty.getMonth() + 1).toString() + "/" + starty.getDate().toString() +"/"+ starty.getFullYear().toString();
            var closey = new Date((element.CloseDate != null && element.CloseDate != '' && !isNaN(Date.parse(element.CloseDate)))?element.CloseDate:Date.now());
            var close =(closey.getMonth() + 1).toString() + "/" + closey.getDate().toString() +"/"+ closey.getFullYear().toString();

            query += "IF NOT EXISTS (SELECT 1 FROM Promos WHERE promo_id = '"+element.PromoId+"') BEGIN TRY INSERT INTO Promos "+
            "(is_project, " + (idMap.has(element.Projectid)?"proj_ID, ":"") +"promo_id, promo_type, promo_title, manager_id, qaqc_person_ID, closed, created, start_date, close_date, promo_location, latitude, longitude, SHNOffice_ID, service_area, "+
            "profile_code_id, " + "client_company, client_abbreviation, first_name, last_name, relationship, "+
            "job_title, address1, address2, city, state, zip_code, work_phone, ext, home_phone, cell, fax, email, binder_size, description_service) OUTPUT inserted.* "+
            "VALUES ("+ (idMap.has(element.Projectid) ? 1:0) + ", " + (idMap.has(element.Projectid)?idMap.get(element.Projectid)+ ", ":"") + "'" + element.PromoId+"', '" + ((element.AlternateTitle == "on-going" || element.AlternateTitle == "letter" || element.AlternateTitle == "soq" || element.AlternateTitle == "ProPri" || element.AlternateTitle == "ProSub")?element.AlternateTitle:"on-going") + "', '" +
            ((element.ProjectTitle == null || element.ProjectTitle == "NULL" || element.ProjectTitle == "")?"None":element.ProjectTitle.replace(/'/gi, "''"))+"', "+
            ((isNaN(element.ProjectMgr) || element.ProjectMgr == null || element.ProjectMgr == "NULL" || element.ProjectMgr == "")?53:element.ProjectMgr) +", "+
            ((isNaN(element.QA_QCPerson) || element.QA_QCPerson == null || element.QA_QCPerson == "NULL" || element.QA_QCPerson == "")?53:element.QA_QCPerson)+", "+
            (element.Closed_by_PM===-1?1:0)+", '"+
            ((dtstamp == NaN)?currDate:dtstamp)+"', '"+
            ((start == NaN)?currDate:start)+"', '"+
            ((close == NaN)?currDate:close)+"', '"+
            ((element.ProjectLoation == null || element.ProjectLoation == "NULL" || element.ProjectLoation == "")?"SHN":element.ProjectLoation.replace(/'/gi, "''"))+"', "+
            (isNaN(element.Lattitude) || element.Lattitude == null || element.Lattitude == "NULL" || element.Lattitude == "" ||(element.Lattitude > 90 || element.Lattitude < -90)?40.868928:element.Lattitude)+", "+
            (isNaN(element.Longitude)|| element.Longitude == null || element.Longitude == "NULL" || element.Longitude == "" ||(element.Longitude > 180 || element.Longitude < -180)?-123.988061:element.Longitude)+", "+
            ((element.SHNOffice == "Eureka" || element.SHNOffice == "Arcata")?0:(element.SHNOffice == "Klamath Falls" || element.SHNOffice == "KFalls")?2:(element.SHNOffice == "Willits")?4:(element.SHNOffice == "Redding")?5:6)+", '"+
            ((element.ServiceArea == null || element.ServiceArea == "NULL" || element.ServiceArea == "")?"Civil":element.ServiceArea)+"', "+
            (codeMap.get(element.ProfileCode)==undefined?167:codeMap.get(element.ProfileCode))+", '"+
            ((element.ClientCompany1 == null || element.ClientCompany1 == "NULL" || element.ClientCompany1 == "")?"SHN":element.ClientCompany1.replace(/'/gi, "''"))+"', "+
            ((element.ClientAbbrev1 == null || element.ClientAbbrev1 == "NULL" || element.ClientAbbrev1 == "")?"NULL":"'"+element.ClientAbbrev1.replace(/'/gi, "''")+"'")+", '"+
            ((element.ClientContactFirstName1 == null || element.ClientContactFirstName1 == "NULL" || element.ClientContactFirstName1 == "")?"?":element.ClientContactFirstName1.replace(/'/gi, "''"))+"', '"+
            ((element.ClientContactLastName1 == null || element.ClientContactLastName1 == "NULL" || element.ClientContactLastName1 == "")?"?":element.ClientContactLastName1.replace(/'/gi, "''"))+"', NULL, "+
            ((element.Title1 == null || element.Title1 == "NULL" || element.Title1 == "")?"NULL":"'"+element.Title1.replace(/'/gi, "''")+"'")+", '"+
            (element.Address1_1==null || element.Address1_1=="NULL" || element.Address1_1=="" ?"812 W. Wabash Ave.":element.Address1_1.replace(/'/gi, "''"))+"', "+
            (element.Address2_1==null || element.Address2_1=="NULL" || element.Address2_1==""?"NULL":"'"+element.Address2_1.replace(/'/gi, "''")+"'")+", '"+
            ((element.City1==null || element.City1=="NULL" || element.City1=="")?"Eureka":element.City1.replace(/'/gi, "''"))+"', '"+
            ((element.State1==null||element.State1=="NULL"||element.State1=="")?"CA":element.State1.replace(/'/gi, "''"))+"', '"+
            ((element.Zip1==null||element.Zip1=="NULL"||element.Zip1=="")?"95501":element.Zip1.replace(/'/gi, "''"))+"', '"+
            ((element.PhoneW1==null || element.PhoneW1=="NULL" || element.PhoneW1=="")?"(000)000-0000":element.PhoneW1.replace(/'/gi, "''"))+"', NULL, "+
            (element.PhoneH1==null || element.PhoneH1=="NULL"|| element.PhoneH1==""?"NULL":"'"+element.PhoneH1.replace(/'/gi, "''")+"'")+", "+
            (element.Cell1==null || element.Cell1=="NULL" || element.Cell1==""?"NULL":"'"+element.Cell1.replace(/'/gi, "''")+"'")+", "+
            (element.Fax1==null || element.Fax1=="NULL"|| element.Fax1==""?"NULL":"'"+element.Fax1.replace(/'/gi, "''")+"'")+", '"+
            (element.Email1==null || element.Email1=="NULL" || element.Email1==""?"nobody@shn-engr.com":element.Email1.replace(/'/gi, "''"))+"', "+
            (element.BinderSize == "NA" || element.BinderSize == "NULL" || element.BinderSize == null || element.BinderSize == ""?"NULL":(element.BinderSize == "1/2"?0.5:(element.BinderSize==1?1:(element.BinderSize==1.5?1.5:(element.BinderSize==2?2:3)))))+", '"+
            (element.DescriptionService==null || element.DescriptionService=="NULL"||element.DescriptionService=="undefined"||element.DescriptionService==""?"":element.DescriptionService.replace(/'/gi, "''"))+"') END TRY BEGIN CATCH END CATCH;";

            if(!members.has(element.PromoId) && element.TeamMembers != null) {
                members.set(element.PromoId, element.TeamMembers.split(/,| \|\| /).filter(mem => {return mem.trim() != ''}));
            }
            if(!keywordMap.has(element.PromoId) && element.ProjectKeywords != null) {
                keywordMap.set(element.PromoId, element.ProjectKeywords.toLowerCase().split(/,| \|\| /).filter(mem => {return mem.trim() != ''}));
            }
        });
        pool.query(query, (err, rows) => {
            if(err) {
                console.error(err);
            }
            else { // Link the team member IDs and the Keywords to each promo.
                let linkQuery = '';
                // console.log(rows.recordsets);
                for (const row of rows.recordsets) {
                    if(row[0] != undefined) {
                        if(typeof members.get(row[0].promo_id) === 'object' && members.get(row[0].promo_id) !== null && Array.isArray(members.get(row[0].promo_id))) {
                            var memberArray = members.get(row[0].promo_id).filter((id) => {
                                return !isNaN(id);
                            });
                            if(memberArray.length > 0) {
                                memberArray.forEach((member) => {
                                    linkQuery += "BEGIN TRY INSERT INTO PromoTeam VALUES ("+ row[0].ID + ", " + member + ");END TRY BEGIN CATCH END CATCH;";
                                });
                            }
                        }
                        if(typeof keywordMap.get(row[0].promo_id) === 'object' && keywordMap.get(row[0].promo_id) !== null && Array.isArray(keywordMap.get(row[0].promo_id))) {
                            // var keyArray = keywordMap.get(row[0].promo_id).split(/,| \|\| /);
                            if(keywordMap.get(row[0].promo_id).length > 0) {
                                keywordMap.get(row[0].promo_id).forEach((key) => {
                                    var trimmed = key.trim();
                                    if(keyMap.has(trimmed)) {
                                        linkQuery += "BEGIN TRY INSERT INTO PromoKeywords VALUES ("+ row[0].ID + ", " + keyMap.get(trimmed) + ");END TRY BEGIN CATCH END CATCH;";
                                    }
                                });
                            }
                        }
                    }
                }
                pool.query(linkQuery, (err) => {
                    if(err) {
                        console.error(err);
                    }
                });
            }
        });
    }).catch((err) => {
        console.error(err);
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