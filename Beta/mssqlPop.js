const msnodesqlv8 = require('msnodesqlv8');
const ADODB = require('node-adodb')
// const config = require('./config.json');
const DATABASE_PATH = "C:\\Users\\administrator\\Documents\\PPI\\Database\\SHN_Project_Backup.mdb;";
const connectionString = `server=localhost\\SQLEXPRESS;Database=master;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`;
// const query = "SELECT * FROM master.dbo.Staff";
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);

/*
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
*/
const codeMap = new Map();
connection.query('SELECT id, Code, CodeDescription, Active FROM ProfileCodes').then(data => {
    data.forEach((element) => {
        // var query = "INSERT INTO master.dbo.ProfileCodes VALUES ("+element.id+", '"+element.Code+"', '" +element.CodeDescription.replace(/'/gi, "''")+"', "+((element.Active == -1)?1:0)+")";
        // msnodesqlv8.query(connectionString, query, (err, rows) => {
        //     if(err) {
        //         console.log("Error for ID: " + element.id)
        //         console.error(err);
        //     }
        //     else {
        //         codeMap.set(element.Code, element.id);
        //     }
        // });
        codeMap.set(element.Code, element.id); // If you uncomment the above msnodesqlv8 INSERT query, comment this line out.
    });
}).catch(err => {
    console.error(err);
});

// Populates Projects.
connection.query("SELECT * FROM Projects WHERE Projectid IS NOT NULL AND Projectid <> '' AND ProjectTitle IS NOT NULL AND ProjectTitle <> ''").then(data => {
    const now = new Date();
    const currDate = (now.getMonth() + 1).toString() + "/" + now.getDate().toString() +"/"+ now.getFullYear().toString();
    data.forEach((element) => {
            var stamper = (element.DTStamp != null && element.DTStamp != '' && !isNaN(Date.parse(element.DTStamp)))?new Date(element.DTStamp):new Date((element.StartDate != null && element.StartDate != ''&& !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
            var dtstamp = (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
            var starty = new Date((element.StartDate != null && element.StartDate != '' && !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
            var start = (starty.getMonth() + 1).toString() + "/" + starty.getDate().toString() +"/"+ starty.getFullYear().toString();
            var closey = new Date((element.CloseDate != null && element.CloseDate != '' && !isNaN(Date.parse(element.CloseDate)))?element.CloseDate:Date.now());
            var close =(closey.getMonth() + 1).toString() + "/" + closey.getDate().toString() +"/"+ closey.getFullYear().toString();
        if(element.BillGrp == null || element.BillGrp == 'NULL' || (typeof element.BillGrp == 'string' && element.BillGrp.trim() == '')) {
            var query = "IF NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = '"+element.Projectid+"') BEGIN INSERT INTO master.dbo.Projects "+
            "(project_id, project_title, project_manager_ID, qaqc_person_ID, closed, created, start_date, close_date, project_location, latitude, longitude, SHNOffice_ID, service_area, "+
            "total_contract, exempt_agreement, why, retainer, retainer_paid, waived_by, profile_code_id, contract_ID, invoice_format, client_contract_PO, outside_markup, prevailing_wage, "+
            "agency_name, special_billing_instructions, see_also, autoCAD, GIS, project_specifications, client_company, client_abbreviation, mailing_list, first_name, last_name, relationship, "+
            "job_title, address1, address2, city, state, zip_code, work_phone, home_phone, cell, fax, email, binder_size, binder_location, description_service) "+
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
            ((element.ClientCompany1 == null || element.ClientCompany1 == "NULL" || element.ClientCompany1 == "")?"SHN":element.ClientCompany1.replace(/'/gi, "''"))+"', '"+element.ClientAbbrev1+"', "+
            (/n\\a|na|null|none/gi.test(element.OfficeMailingLists1)?"NULL":"'"+element.OfficeMailingLists1.replace(/'/gi, "''")+"'")+", '"+
            ((element.ClientContactFirstName1 == null || element.ClientContactFirstName1 == "NULL")?"?":element.ClientContactFirstName1.replace(/'/gi, "''"))+"', '"+
            ((element.ClientContactLastName1 == null || element.ClientContactLastName1 == "NULL" || element.ClientContactLastName1 == "")?"?":element.ClientContactLastName1.replace(/'/gi, "''"))+"', NULL, "+
            ((element.Title1 == null || element.Title1 == "NULL" || element.Title1 == "")?"NULL":"'"+element.Title1.replace(/'/gi, "''")+"'")+", '"+
            (element.Address1_1==null || element.Address1_1=="NULL" || element.Address1_1=="" ?"812 W. Wabash Ave.":element.Address1_1.replace(/'/gi, "''"))+"', "+
            (element.Address2_1==null || element.Address2_1=="NULL" || element.Address2_1==""?"NULL":"'"+element.Address2_1.replace(/'/gi, "''")+"'")+", '"+
            ((element.City1==null || element.City1=="NULL" || element.City1=="")?"Eureka":element.City1.replace(/'/gi, "''"))+"', '"+
            ((element.State1==null||element.State1=="NULL"||element.State1=="")?"CA":element.State1.replace(/'/gi, "''"))+"', '"+
            ((element.Zip1==null||element.Zip1=="NULL"||element.Zip1=="")?"95501":element.Zip1.replace(/'/gi, "''"))+"', '"+
            ((element.PhoneW1==null || element.PhoneW1=="NULL" || element.PhoneW1=="")?"(000)000-0000":element.PhoneW1.replace(/'/gi, "''"))+"', "+
            (element.PhoneH1==null || element.PhoneH1=="NULL"|| element.PhoneH1==""?"NULL":"'"+element.PhoneH1.replace(/'/gi, "''")+"'")+", "+
            (element.Cell1==null || element.Cell1=="NULL" || element.Cell1==""?"NULL":"'"+element.Cell1.replace(/'/gi, "''")+"'")+", "+
            (element.Fax1==null || element.Fax1=="NULL"|| element.Fax1==""?"NULL":"'"+element.Fax1.replace(/'/gi, "''")+"'")+", '"+
            (element.Email1==null || element.Email1=="NULL" || element.Email1==""?"example@shn-engr.com":element.Email1.replace(/'/gi, "''"))+"', "+
            (element.BinderSize == "NA" || element.BinderSize == "NULL" || element.BinderSize == null || element.BinderSize == ""?"NULL":(element.BinderSize == "1/2"?0.5:(element.BinderSize==1?1:(element.BinderSize==1.5?1.5:(element.BinderSize==2?2:3)))))+", "+
            (element.BinderLocation==null || element.BinderLocation=="NULL"||element.BinderLocation=="undefined"||element.BinderLocation==""?"NULL":"'"+element.BinderLocation.replace(/'/gi, "''")+"'")+", '"+
            (element.DescriptionService==null || element.DescriptionService=="NULL"||element.DescriptionService=="undefined"||element.DescriptionService==""?"None":element.DescriptionService.replace(/'/gi, "''"))+"'); END";
            msnodesqlv8.query(connectionString, query, (err, rows) => {
                if(err) {
                    console.log("Error for ID: " + element.Id)
                    console.log(query);
                    console.error(err);
                }
                else {
                    msnodesqlv8.query(connectionString, "SELECT ID FROM Projects WHERE project_id = " + element.Projectid, (err, rows) => {
                        if(element.TeamMembers != null && element.TeamMembers != "NULL" && element.TeamMembers != "") {
                            var memberArray = element.TeamMembers.split(',').filter((id) => {
                                return !isNaN(id);
                            });
                            if(memberArray.length > 0) {
                                
                                if(err) {
                                    console.log("Cannot get project: " + element.Projectid);
                                    console.error(err);
                                }
                                else if(rows.length > 0) {
                                        
                                    memberArray.forEach((member) => {
                                        var query = "INSERT INTO ProjectTeam VALUES ("+ rows[0].ID + ", " + member + ");";
                                        msnodesqlv8.query(connectionString, query, (error) => {
                                            if(error) {
                                                console.log("Error for Project member: " + member)
                                                console.log(query);
                                                console.error(error);
                                            }
                                        });
                                    });
                                }
                            }
                        }
                        if(element.ProjectKeywords != null && element.ProjectKeywords != "NULL" && element.ProjectKeywords != "") {
                            var keyArray = element.ProjectKeywords.split(/,| \|\| /g);
                            var query = "SELECT ID FROM Keywords WHERE ";
                            keyArray.forEach((key) => {
                                query += "Keyword = '" + key + "' OR ";
                            });
                            query = query.substring(0,query.length - 4);
                            msnodesqlv8.query(connectionString, query, (err, IDs) => {
                                if(err) {
                                    console.log("Cannot get keywords.");
                                    console.error(err);
                                }
                                else if (IDs.length > 0){
                                    IDs.forEach((id) => {
                                        query = "INSERT INTO ProjectKeywords VALUES (" + rows[0].ID + ", " +id+ ")";
                                        msnodesqlv8.query(connectionString, query, (err) => {
                                            console.log("Cannot add keyword ID " + id + " to ID " + rows[0].ID);
                                            console.error(err);
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        else if(typeof element.BillGrp == 'string') {
            if(element.BillGrp.length == 3 || (element.BillGrp.length == 4 && element.BillGrp[0] == '.' && !isNaN(element.BillGrp.substring(1)))) {
                var query = "SELECT ID FROM Projects WHERE project_id = '"+ element.Projectid +"'";
                msnodesqlv8.query(connectionString, query, (error, row) => {
                    if(error) {
                        console.error(error);
                    }
                    else if(row.length > 0) {
                        // console.log(row[0].ID);
                        var groupNumber = (element.BillGrp.trim().length == 4)?element.BillGrp.substring(1):element.BillGrp;
                        var query = "IF NOT EXISTS (SELECT 1 FROM BillingGroups WHERE project_ID = "+row[0].ID+" AND group_number = '"+groupNumber+"') "+
                        "BEGIN INSERT INTO BillingGroups (project_ID, group_number, group_name, autoCAD, GIS, manager_id, qaqc_person_ID, created, start_date, close_date, "+
                        "group_location, latitude, longitude, service_area, total_contract, retainer, retainer_paid, waived_by, profile_code_id, contract_id, invoice_format, " +
                        "client_contract_PO, outside_markup, prevailing_wage, agency_name, special_billing_instructions, binder_size, description_service"+") VALUES ("+
                        row[0].ID+", '"+groupNumber+"', '"+
                        (element.BillingTitle == null || element.BillingTitle == "NULL" || element.BillingTitle == ""?"[NO TITLE]":element.BillingTitle.replace(/'/gi, "''"))+"', "+
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
                        ((element.PREVAILING_WAGE == 1 || element.PREVAILING_WAGE == "Yes")?1:0)+", NULL, "+
                        ((element.SpecialBillingInstructins == null || element.SpecialBillingInstructins == "NULL" || element.SpecialBillingInstructins == "")?"NULL":"'"+element.SpecialBillingInstructins.replace(/'/gi, "''")+"'")+", "+
                        (element.BinderSize == "NA" || element.BinderSize == "NULL" || element.BinderSize == null || element.BinderSize == ""?"NULL":(element.BinderSize == "1/2"?0.5:(element.BinderSize==1?1:(element.BinderSize==1.5?1.5:(element.BinderSize==2?2:3)))))+", '"+
                        (element.DescriptionService==null || element.DescriptionService=="NULL"||element.DescriptionService=="undefined"||element.DescriptionService==""?"None":element.DescriptionService.replace(/'/gi, "''"))+
                        "'); END";

                        msnodesqlv8.query(connectionString, query, (erro, rowy) => {
                            if(erro) {
                                console.log("Error for ID: " + element.Id + " with billing group " + groupNumber);
                                console.log(query);
                                console.error(erro);
                            }
                            // else {
                            //     console.log("Success with ID: " + element.Id);
                            // }
                        });
                    }
                });
            }
        }
    });
}).catch(err => {
    console.error(err);
});

// // Populates Promos.
connection.query("SELECT * FROM Projects WHERE ProjectTitle IS NOT NULL AND ProjectTitle <> '' AND PromoId IS NOT NULL AND PromoId <> ''").then(data => {
    const now = new Date();
    const currDate = (now.getMonth() + 1).toString() + "/" + now.getDate().toString() +"/"+ now.getFullYear().toString();
    data.forEach((element) => {
        var stamper = (element.DTStamp != null && element.DTStamp != '' && !isNaN(Date.parse(element.DTStamp)))?new Date(element.DTStamp):new Date((element.StartDate != null && element.StartDate != ''&& !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
        var dtstamp = (stamper.getMonth() + 1).toString() + "/" + stamper.getDate().toString() +"/"+ stamper.getFullYear().toString();
        var starty = new Date((element.StartDate != null && element.StartDate != '' && !isNaN(Date.parse(element.StartDate)))?element.StartDate:Date.now());
        var start = (starty.getMonth() + 1).toString() + "/" + starty.getDate().toString() +"/"+ starty.getFullYear().toString();
        var closey = new Date((element.CloseDate != null && element.CloseDate != '' && !isNaN(Date.parse(element.CloseDate)))?element.CloseDate:Date.now());
        var close =(closey.getMonth() + 1).toString() + "/" + closey.getDate().toString() +"/"+ closey.getFullYear().toString();

        var query = "IF NOT EXISTS (SELECT 1 FROM Promos WHERE promo_id = '"+element.PromoId+"') BEGIN INSERT INTO master.dbo.Promos "+
        "(is_project, promo_id, promo_type, promo_title, manager_id, qaqc_person_ID, closed, created, start_date, close_date, promo_location, latitude, longitude, SHNOffice_ID, service_area, "+
        "profile_code_id, "+
        "client_company, client_abbreviation, first_name, last_name, relationship, "+
        "job_title, address1, address2, city, state, zip_code, work_phone, home_phone, cell, fax, email, binder_size, description_service) "+
        "VALUES (0, '"+ element.PromoId+"', '" + ((element.AlternateTitle == "on-going" || element.AlternateTitle == "letter" || element.AlternateTitle == "soq" || element.AlternateTitle == "ProPri" || element.AlternateTitle == "ProSub")?element.AlternateTitle:"on-going") + "', '" +
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
        ((element.PhoneW1==null || element.PhoneW1=="NULL" || element.PhoneW1=="")?"(000)000-0000":element.PhoneW1.replace(/'/gi, "''"))+"', "+
        (element.PhoneH1==null || element.PhoneH1=="NULL"|| element.PhoneH1==""?"NULL":"'"+element.PhoneH1.replace(/'/gi, "''")+"'")+", "+
        (element.Cell1==null || element.Cell1=="NULL" || element.Cell1==""?"NULL":"'"+element.Cell1.replace(/'/gi, "''")+"'")+", "+
        (element.Fax1==null || element.Fax1=="NULL"|| element.Fax1==""?"NULL":"'"+element.Fax1.replace(/'/gi, "''")+"'")+", '"+
        (element.Email1==null || element.Email1=="NULL" || element.Email1==""?"example@shn-engr.com":element.Email1.replace(/'/gi, "''"))+"', "+
        (element.BinderSize == "NA" || element.BinderSize == "NULL" || element.BinderSize == null || element.BinderSize == ""?"NULL":(element.BinderSize == "1/2"?0.5:(element.BinderSize==1?1:(element.BinderSize==1.5?1.5:(element.BinderSize==2?2:3)))))+", '"+
        (element.DescriptionService==null || element.DescriptionService=="NULL"||element.DescriptionService=="undefined"||element.DescriptionService==""?"None":element.DescriptionService.replace(/'/gi, "''"))+"'); END";
        msnodesqlv8.query(connectionString, query, (err, rows) => {
            if(err) {
                console.log("Error for ID: " + element.Id)
                console.log(query);
                console.error(err);
            }
            else {
                query = "SELECT ID FROM Projects WHERE project_id = '"+ element.Projectid +"'";
                msnodesqlv8.query(connectionString, query, (error, row) => {
                    if(error) {
                        console.log("Select error for " + element.PromoId);
                        console.error(error);
                    }
                    else if(row.length > 0) {
                        query = "IF NOT EXIST (SELECT 1 FROM Promos WHERE proj_ID = "+ row[0].ID +") BEGIN UPDATE Promos SET is_project = 1, proj_ID = "+ row[0].ID +" WHERE promo_id = '"+ element.PromoId +"'; END";
                        msnodesqlv8.query(connectionString, query, (erro, row) => {
                            if(error) {
                                console.log("Failed to link project ID: " + row[0].ID);
                                console.error(erro);
                            }
                        });
                    }
                });
            }
        });
    });
}).catch(err => {
    console.error(err);
});

// var query = "SELECT ID FROM Projects WHERE project_id = '023001'";
//                 msnodesqlv8.query(connectionString, query, (error, row) => {
//                     if(error) {
//                         console.error(error);
//                     }
//                     else {
//                         console.log(row[0].ID);
//                     }
//                 });