const sql = require('mssql');
const ADODB = require('node-adodb')
// const Pool = require('generic-pool');
// const config = require('./config.json');
const DATABASE_PATH = "C:\\Users\\administrator\\Documents\\PPI\\Database\\SHN_Project_Backup.mdb;";
// const query = "SELECT * FROM master.dbo.Staff";
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
const jsonData = require('./config.json');
const codeMap = new Map();

const config = {
    user: jsonData.mssql.user,
    password: jsonData.mssql.password,
    server: jsonData.mssql.server,
    database: jsonData.mssql.database,
    options : jsonData.mssql.options
};

// connect to your database
sql.connect(config, function (err) {
    
    if (err) {
        console.log(err);
        process.exit();
    }
    else {
        console.log("Success!");
        // create Request object
        var request = new sql.Request();
        
        // query to the database and get the records
        request.query('USE PPI;', function (err, recordset) {
            
            if (err) {
                console.log(err);
                process.exit();
            }
            else {
                (async () => {
                    populateStaff();
                    populateKeywords();
                    populateProfileCodes();
                })();
                (async () => {
                    populateProjects();
                })();
                
            }

        });
    }
});

function populateStaff() {
    // Populates Staff.
    connection.query('SELECT ID, Active, First, Last, Email, PM FROM Contacts').then(data => {
        data.forEach((element) => {
            let query = '';
            query += "INSERT INTO Staff VALUES ("+element.ID+", "+((element.Active == 'Yes')?1:0)+", '"+element.First.replace(/'/gi, "''")+"', '"+element.Last.replace(/'/gi, "''")+"', '"+element.Email+"', "+(element.PM==-1?1:0)+", 0);";
        });
        request.query(query, (err, rows) => {
            if(err) {
                console.log("Error for entry ID: " + element.ID)
                console.error(err);
            }
        });
    }).catch(err => {
        console.error(err);
    });
}

function populateKeywords() {
    connection.query('SELECT ID, Keyword, Group1 FROM Keywords').then(data => {
        data.forEach((element) => {
            let query = '';
            query += "INSERT INTO Keywords VALUES ("+element.ID+", '" +element.Keyword.replace(/'/gi, "''")+"', "+((element.Group1 == null || element.Group1 == '')?'NULL':"'"+element.Group1.replace(/'/gi, "''")+"'")+");";
        });
        request.query(query, (err, rows) => {
            if(err) {
                console.log("Error for entry ID: " + element.ID)
                console.error(err);
            }
            // else {
            //     console.log(rows);
            // }
        });
    }).catch(err => {
        console.error(err);
    });
}

function populateProfileCodes() {
    connection.query('SELECT id, Code, CodeDescription, Active FROM ProfileCodes').then(data => {
        data.forEach((element) => {
            let query ='';
            query += "INSERT INTO ProfileCodes VALUES ("+element.id+", '"+element.Code+"', '" +element.CodeDescription.replace(/'/gi, "''")+"', "+((element.Active == -1)?1:0)+");";
            // codeMap.set(element.Code, element.id); // If you uncomment the above msnodesqlv8 INSERT query, comment this line out.
        });
        request.query(query, (err, rows) => {
            if(err) {
                console.log("Error for ID: " + element.id)
                console.error(err);
            }
            else {
                codeMap.set(element.Code, element.id);
            }
        });
    }).catch(err => {
        console.error(err);
    });
}
/**
 * Populates the projects and billing groups tables.
 * The billing groups need to be linked to their associated project.
 */
function populateProjects() {
    connection.query("SELECT * FROM Projects WHERE Projectid IS NOT NULL AND Projectid <> '' AND ProjectTitle IS NOT NULL AND ProjectTitle <> ''").then(data => {
        const now = new Date();
        const currDate = (now.getMonth() + 1).toString() + "/" + now.getDate().toString() +"/"+ now.getFullYear().toString();
        let query = '';
        data.forEach((element) => {
                var stamper = (element.DTStamp != null && element.DTStamp != '' && !isNaN(Date.parse(element.DTStamp)))?new Date(element.DTStamp):new Date((element.StartDate != null && element.StartDate != ''&& !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
                var dtstamp = (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
                var starty = new Date((element.StartDate != null && element.StartDate != '' && !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
                var start = (starty.getMonth() + 1).toString() + "/" + starty.getDate().toString() +"/"+ starty.getFullYear().toString();
                var closey = new Date((element.CloseDate != null && element.CloseDate != '' && !isNaN(Date.parse(element.CloseDate)))?element.CloseDate:Date.now());
                var close =(closey.getMonth() + 1).toString() + "/" + closey.getDate().toString() +"/"+ closey.getFullYear().toString();
            if(element.BillGrp == null || element.BillGrp == 'NULL' || (typeof element.BillGrp == 'string' && element.BillGrp.trim() == '')) {
                query += "IF NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = '"+element.Projectid+"') BEGIN INSERT INTO Projects "+
                "(project_id, project_title, project_manager_ID, qaqc_person_ID, closed, created, start_date, close_date, project_location, latitude, longitude, SHNOffice_ID, service_area, "+
                "total_contract, exempt_agreement, why, retainer, retainer_paid, waived_by, profile_code_id, contract_ID, invoice_format, client_contract_PO, outside_markup, prevailing_wage, "+
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
                (codeMap.get(element.ProfileCode)==undefined?167:codeMap.get(element.ProfileCode))+", "+
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
                ((element.PhoneW1==null || element.PhoneW1=="NULL" || element.PhoneW1=="")?"(000)000-0000":element.PhoneW1.replace(/'/gi, "''"))+"', NULL, "+
                (element.PhoneH1==null || element.PhoneH1=="NULL"|| element.PhoneH1==""?"NULL":"'"+element.PhoneH1.replace(/'/gi, "''")+"'")+", "+
                (element.Cell1==null || element.Cell1=="NULL" || element.Cell1==""?"NULL":"'"+element.Cell1.replace(/'/gi, "''")+"'")+", "+
                (element.Fax1==null || element.Fax1=="NULL"|| element.Fax1==""?"NULL":"'"+element.Fax1.replace(/'/gi, "''")+"'")+", '"+
                (element.Email1==null || element.Email1=="NULL" || element.Email1==""?"none":element.Email1.replace(/'/gi, "''"))+"', "+
                (element.BinderSize == "NA" || element.BinderSize == "NULL" || element.BinderSize == null || element.BinderSize == ""?"NULL":(element.BinderSize == "1/2"?0.5:(element.BinderSize==1?1:(element.BinderSize==1.5?1.5:(element.BinderSize==2?2:3)))))+", "+
                (element.BinderLocation==null || element.BinderLocation=="NULL"||element.BinderLocation=="undefined"||element.BinderLocation==""?"NULL":"'"+element.BinderLocation.replace(/'/gi, "''")+"'")+", '"+
                (element.DescriptionService==null || element.DescriptionService=="NULL"||element.DescriptionService=="undefined"||element.DescriptionService==""?"None":element.DescriptionService.replace(/'/gi, "''"))+"'); END;";
                // console.log(query);
                // query += "SELECT ID FROM Projects WHERE project_id = '" + element.Projectid + "';";
            }
        });
        request.query(query, (err, row) => {
            if(err) {
                console.error(err);
            }
            else { // We assume the max ID is the last Project to be inserted.
                
            }
        });
    }).catch((err) => {
        console.error(err);
    });
}

function populateBillingGroups() {

}