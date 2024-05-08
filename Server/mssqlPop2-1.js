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

function getMissing() {
    connection.query("SELECT * FROM Projects WHERE Projectid IS NOT NULL AND Projectid <> '' AND ProjectTitle IS NOT NULL AND ProjectTitle <> ''").then(data => {
        let query = 'USE PPI;';
        const skibidi = new Map();
        data.forEach((value) => {
            // console.log(value);
            if(value.Projectid.length > 7) {
                console.log(value.Projectid + ' is too long :(');
            }
            else {
                query += "SELECT '"+value.Projectid+"' AS value_to_check WHERE NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = '"+value.Projectid+"');";
                if(skibidi.has(value.Projectid)) {
                    skibidi.get(value.Projectid).push(value);
                }
                else {
                    skibidi.set(value.Projectid, new Array());
                    skibidi.get(value.Projectid).push(value);
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
                    if(skibidi.has(project) && missedProjects.includes(project) && !filteredMap.has(project)) {
                        filteredMap.set(project, skibidi.get(project));
                    }
                });
                addMissing(filteredMap);
            }
        });
        
    }).catch((err) => {
        console.error(err.message);
    });
}

function addMissing(missed) {
    let query = "";
    const members = new Map();
    const keywordMap = new Map();
    missed.forEach((value, key) => {
        if(value.length > 0) {
            // Use first element of each project as the project entry.
            var stamper = (value[0].DTStamp != null && value[0].DTStamp != '' && !isNaN(Date.parse(value[0].DTStamp)) && new Date(value[0].DTStamp) instanceof Date)?new Date(value[0].DTStamp):new Date((value[0].StartDate != null && value[0].StartDate != ''&& !isNaN(Date.parse(value[0].StartDate)) && new Date(value[0].StartDate) instanceof Date)?value[0].StartDate:Date.now());
            var dtstamp = (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
            var starty = new Date((value[0].StartDate != null && value[0].StartDate != '' && !isNaN(Date.parse(value[0].StartDate)) && new Date(value[0].StartDate) instanceof Date)?value[0].StartDate:Date.now());
            var start = (starty.getMonth() + 1).toString() + "/" + starty.getDate().toString() +"/"+ starty.getFullYear().toString();
            var closey = new Date((value[0].CloseDate != null && value[0].CloseDate != '' && !isNaN(Date.parse(value[0].CloseDate)) && new Date(value[0].CloseDate) instanceof Date)?value[0].CloseDate:Date.now());
            var close =(closey.getMonth() + 1).toString() + "/" + closey.getDate().toString() +"/"+ closey.getFullYear().toString();
            query += "IF NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = '"+value[0].Projectid+"') BEGIN TRY INSERT INTO Projects "+
            "(project_id, project_title, project_manager_ID, qaqc_person_ID, closed, created, start_date, close_date, project_location, latitude, longitude, SHNOffice_ID, service_area, "+
            "total_contract, exempt_agreement, why, retainer, retainer_paid, waived_by, profile_code_id, project_type, contract_ID, invoice_format, client_contract_PO, outside_markup, prevailing_wage, "+
            "agency_name, special_billing_instructions, see_also, autoCAD, GIS, project_specifications, client_company, client_abbreviation, mailing_list, first_name, last_name, relationship, "+
            "job_title, address1, address2, city, state, zip_code, work_phone, ext, home_phone, cell, fax, email, binder_size, binder_location, description_service) OUTPUT inserted.* "+
            "VALUES ('"+// value[0].Id +", '"+
            value[0].Projectid+"', '" +
            ((value[0].ProjectTitle == null && value[0].ProjectTitle == "NULL")?"None":value[0].ProjectTitle.replace(/'/gi, "''"))+"', "+
            ((isNaN(value[0].ProjectMgr) || value[0].ProjectMgr == null || value[0].ProjectMgr == "NULL" || value[0].ProjectMgr == "")?53:value[0].ProjectMgr) +", "+
            ((isNaN(value[0].QA_QCPerson) || value[0].QA_QCPerson == null || value[0].QA_QCPerson == "NULL" || value[0].QA_QCPerson == "")?53:value[0].QA_QCPerson)+", "+
            (value[0].Closed_by_PM===-1?1:0)+", "+
            ((dtstamp == NaN)?"GETDATE()":"'"+dtstamp+"'")+", "+
            ((start == NaN)?"GETDATE()":"'"+ start + "'")+", "+
            ((close == NaN)?"GETDATE()":"'" + close + "'")+", '"+
            ((value[0].ProjectLoation == null || value[0].ProjectLoation == "NULL" || value[0].ProjectLoation == "")?"SHN":value[0].ProjectLoation.replace(/'/gi, "''"))+"', "+
            (isNaN(value[0].Lattitude) || value[0].Lattitude == null || value[0].Lattitude == "NULL" ||(value[0].Lattitude > 90 || value[0].Lattitude < -90)?40.868928:value[0].Lattitude)+", "+
            (isNaN(value[0].Longitude)|| value[0].Longitude == null || value[0].Longitude == "NULL" ||(value[0].Longitude > 180 || value[0].Longitude < -180)?-123.988061:value[0].Longitude)+", "+
            ((value[0].SHNOffice == "Eureka" || value[0].SHNOffice == "Arcata")?0:(value[0].SHNOffice == "Klamath Falls" || value[0].SHNOffice == "KFalls")?2:(value[0].SHNOffice == "Willits")?4:(value[0].SHNOffice == "Redding")?5:6)+", '"+
            ((value[0].ServiceArea == null || value[0].ServiceArea == "NULL" || value[0].ServiceArea == "")?"Civil":value[0].ServiceArea)+"', "+
            ((value[0].ToatlContract == null || value[0].ToatlContract == "NULL" || value[0].ToatlContract == "")?0:((isNaN(value[0].ToatlContract[0]) && value[0].ToatlContract.length > 1))?(isNaN(value[0].ToatlContract.substring(1))?0:Number(value[0].ToatlContract.substring(1))):0) +", 0, NULL, '"+
            ((value[0].RetainerPaid != null && value[0].RetainerPaid != "NULL" && value[0].RetainerPaid != "")?value[0].RetainerPaid.replace(/'/gi, "''"):"NA")+"', "+
            ((value[0].RetainerPaid == null || value[0].RetainerPaid == "NULL" || value[0].RetainerPaid == "")?0:(isNaN(value[0].RetainerPaid.substring(1))?"NULL":Number(value[0].RetainerPaid.substring(1))))+", "+
            ((value[0].RetainerPaid != null && value[0].RetainerPaid != "NULL" && value[0].RetainerPaid.includes("Waived by"))?"'"+value[0].RetainerPaid.substring(10).replace(/'/gi, "''")+"'":"NULL")+", "+
            (codeMap.get(value[0].ProfileCode)==undefined?167:codeMap.get(value[0].ProfileCode))+", 0, "+
            ((isNaN(value[0].ContractType) || value[0].ContractType == null || value[0].ContractType == "NULL")?1:(value[0].ContractType.includes("10")?10:(isNaN(value[0].ContractType[0])?1:value[0].ContractType[0]))) +", "+
            (/n\\a|na|null|none/gi.test(value[0].InvoiceFormat)?"NULL":(value[0].InvoiceFormat.length <= 0?"NULL":"'"+value[0].InvoiceFormat[0]+"'"))+", 'NA', "+
            ((isNaN(value[0].OutsideMarkup) || value[0].OutsideMarkup == null || value[0].OutsideMarkup == "NULL" || value[0].OutsideMarkup == "")?15:value[0].OutsideMarkup) +", "+
            ((value[0].PREVAILING_WAGE == 1 || value[0].PREVAILING_WAGE == "Yes")?1:0)+", NULL, "+
            ((value[0].SpecialBillingInstructins == null || value[0].SpecialBillingInstructins == "NULL" || value[0].SpecialBillingInstructins == "")?"NULL":"'"+value[0].SpecialBillingInstructins.replace(/'/gi, "''")+"'")+", "+
            (value[0].SEEALSO==null||value[0].SEEALSO == "NULL"||value[0].SEEALSO == ""?"NULL":"'"+value[0].SEEALSO.replace(/'/gi, "''")+"'")+", "+
            (value[0].AutoCAD_Project == -1?1:0)+", "+
            (value[0].GIS_Project == -1?1:0)+", "+
            (value[0].Project_Specifications==-1?1:0)+", '"+
            ((value[0].ClientCompany1 == null || value[0].ClientCompany1 == "NULL" || value[0].ClientCompany1 == "")?"SHN":value[0].ClientCompany1.replace(/'/gi, "''"))+"', "+
            ((value[0].ClientAbbrev1 == null || value[0].ClientAbbrev1 == 'NULL' || value[0].ClientAbbrev1 == '')?'NULL':"'"+value[0].ClientAbbrev1.replace(/'/gi, "''") + "'")+", "+
            (/n\\a|na|null|none|/gi.test(value[0].OfficeMailingLists1)?"NULL":"'"+value[0].OfficeMailingLists1.replace(/'/gi, "''")+"'")+", '"+
            ((value[0].ClientContactFirstName1 == null || value[0].ClientContactFirstName1 == "NULL")?"?":value[0].ClientContactFirstName1.replace(/'/gi, "''"))+"', '"+
            ((value[0].ClientContactLastName1 == null || value[0].ClientContactLastName1 == "NULL" || value[0].ClientContactLastName1 == "")?"?":value[0].ClientContactLastName1.replace(/'/gi, "''"))+"', NULL, "+
            ((value[0].Title1 == null || value[0].Title1 == "NULL" || value[0].Title1 == "")?"NULL":"'"+value[0].Title1.replace(/'/gi, "''")+"'")+", '"+
            (value[0].Address1_1==null || value[0].Address1_1=="NULL" || value[0].Address1_1=="" ?"812 W. Wabash Ave.":value[0].Address1_1.replace(/'/gi, "''"))+"', "+
            (value[0].Address2_1==null || value[0].Address2_1=="NULL" || value[0].Address2_1==""?"NULL":"'"+value[0].Address2_1.replace(/'/gi, "''")+"'")+", '"+
            ((value[0].City1==null || value[0].City1=="NULL" || value[0].City1=="")?"Eureka":value[0].City1.replace(/'/gi, "''"))+"', '"+
            ((value[0].State1==null||value[0].State1=="NULL"||value[0].State1=="")?"CA":value[0].State1.replace(/'/gi, "''"))+"', '"+
            ((value[0].Zip1==null||value[0].Zip1=="NULL"||value[0].Zip1=="")?"95501":value[0].Zip1.replace(/'/gi, "''"))+"', '"+
            ((value[0].PhoneW1==null || value[0].PhoneW1=="NULL" || value[0].PhoneW1=="")?"000-000-0000":value[0].PhoneW1.replace(/'/gi, "''"))+"', NULL, "+
            (value[0].PhoneH1==null || value[0].PhoneH1=="NULL"|| value[0].PhoneH1==""?"NULL":"'"+value[0].PhoneH1.replace(/'/gi, "''")+"'")+", "+
            (value[0].Cell1==null || value[0].Cell1=="NULL" || value[0].Cell1==""?"NULL":"'"+value[0].Cell1.replace(/'/gi, "''")+"'")+", "+
            (value[0].Fax1==null || value[0].Fax1=="NULL"|| value[0].Fax1==""?"NULL":"'"+value[0].Fax1.replace(/'/gi, "''")+"'")+", '"+
            (value[0].Email1==null || value[0].Email1=="NULL" || value[0].Email1==""?"none":value[0].Email1.replace(/'/gi, "''"))+"', "+
            (value[0].BinderSize == "NA" || value[0].BinderSize == "NULL" || value[0].BinderSize == null || value[0].BinderSize == ""?"NULL":(value[0].BinderSize == "1/2"?0.5:(value[0].BinderSize==1?1:(value[0].BinderSize==1.5?1.5:(value[0].BinderSize==2?2:3)))))+", "+
            (value[0].BinderLocation==null || value[0].BinderLocation=="NULL"||value[0].BinderLocation=="undefined"||value[0].BinderLocation==""?"NULL":"'"+value[0].BinderLocation.replace(/'/gi, "''")+"'")+", '"+
            (value[0].DescriptionService==null || value[0].DescriptionService=="NULL"||value[0].DescriptionService=="undefined"||value[0].DescriptionService==""?"None":value[0].DescriptionService.replace(/'/gi, "''"))+"');END TRY BEGIN CATCH END CATCH;";

            // Separate Team members and keywords.
            if(!members.has(value[0].Projectid) && value[0].TeamMembers != null && value[0].TeamMembers != '') {
                members.set(value[0].Projectid, value[0].TeamMembers);
            }
            if(!keywordMap.has(value[0].Projectid) && value[0].ProjectKeywords != null && value[0].ProjectKeywords != '') {
                keywordMap.set(value[0].Projectid, value[0].ProjectKeywords.toLowerCase());
            }

        }
    });
    const request = pool.request();
    request.query(query, (err, rows) => {
        if(err) {
            console.error(err);
        }
        else {
            const idToId = new Map(); // Used to map billing groups to associated projects.
            let linkQuery = '';
            // console.log(rows);
            getKeywords().then(mappy => {
                // console.log(mappy);
                const keyMap = mappy;
                // getMissing(mappy);
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
            });
            request.query(linkQuery, (err, rows) => {
                if(err) {
                    console.log(err);
                }
            });
        }
    });
}

function getKeywords() {
    return new Promise((resolve, reject) => {
        const keyMap = new Map();
        const request = pool.request();

        request.query('SELECT * FROM Keywords;', (err, rows) => {
            if(err) {
                reject(err);
            }
            else {
                rows.recordset.forEach(toilet => {
                    keyMap.set(toilet.Keyword.toLowerCase().trim(), toilet.ID);
                });
                return resolve(keyMap);
            }
        }); 
    });
}

function getProfileCodes() {
    return new Promise((resolve, reject) => {
        const codeMap = new Map();
        const request = pool.request();

        request.query('SELECT * FROM ProfileCodes;', (err, rows) => {
            if(err) {
                reject(err);
            }
            else {
                rows.recordset.forEach(toilet => {
                    codeMap.set(toilet.Code.toLowerCase().trim(), toilet.ID);
                });
                return resolve(codeMap);
            }
        }); 
    });
}

pool.connect().then(()=>{
    getMissing();
});
