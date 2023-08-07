let activeUser = '';
let billingMap = new Map();
let formatMap = new Map();
let jsonMap = new Map();
let billingList = [];
let ProjectNumberGlobal = '';
let manager = '';
let projMgr = 0; // required
let client = '';
let qaqc = '';
let projTitle = '';
let projName = '';
let BillingNum = '';
let qaqcNew = 0;
let teamWee = '';
let teamMem = new Array(); // required
let startDate; // required
let endDate; // required
let projLoc = ''; // required
let latitude = ''; // required
let longitude = ''; // required
let Projkeywords = new Array(); // required
let keywordString = '';
let otherKeys = new Array();
let mgrName = '';
let qaqcName;
let memNames = new Array();
let keyNames = new Array();
let keyResult = [];
let keyIDMap = new Map();
let tempKeyID = [];
let profCode = -1;
let profCodeName = '';
let contactType = 0; // required
let contactTypeName;
let retainer = 0;
let senior = '';
let retainAmnt = 'None';
let serviceArea = 0;
let servName = '';
let totalContract = '';
let invoiceFormat = "B";
let invoiceName = 'Emp. Name, Hrs, and Billing Rates (No Dates)';
let contractPONum = '';
let outsideMarkup = 15; // required
let prevWage = "0";
let agency_name = '';
let specBillInstr = '';
let autoCad = false;
let GIS = false;
let binderSize = 'NA';
let descOfServ = ''; // required

function findProjects() {
    const projectNumber = document.getElementById('billGrp').value.trim();
    if(projectNumber.length > 15 || projectNumber == '') {
        document.getElementById('billGrp').innerHTML = '<label for="billGrp">Exact Project Number</label><input type="text" id="billGrp"/><p>Invalid project number.</p>';
    }
    
    const jsonString = JSON.parse(JSON.stringify('{"ProjectNumber":"'+ projectNumber +'"}'));

    var xhr = new XMLHttpRequest();
    var url = "https://e-hv-ppi.shn-engr.com:3000/billMe";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function(e) {
        document.getElementById('billRes').innerHTML = '<label for="billGrp">Exact Project Number</label><input type="text" id="billGrp"/><br><p>Connection error.  Try again or get help.</p><br><button type="button" onclick="findProjects();">Search Projects</button>';
        console.log(e);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
            if(json.length > 0 && json[0].hasOwnProperty('ID')) {
                document.getElementById('billRes').innerHTML = '<label for="billGrp">Exact Project</label><input type="text" id="billGrp"/><br><button type="button" onclick="findProjects();">Search Projects</button><p>Projects:<br><p id="results"></p></p>';
                resultString(json);
                for(let content of formatMap.values()) {
                    document.getElementById('results').innerHTML = content;
                }
            }
            else{
                document.getElementById('billRes').innerHTML = '<label for="billGrp">Exact Project</label><input type="text" id="billGrp"/><button type="button" onclick="findProjects();">Search Projects</button><p>No Projects found.</p>';
            }
        }
    };
    console.log(jsonString);
    xhr.send(jsonString);  // an error message typically looks like "{process: {…}, exitCode: 0}" in the console.
}

function resultString(jsonRes) {
    formatMap.clear();
    billingMap.clear();
    jsonMap.clear();
    for(let i = 0; i < jsonRes.length; i++) {
        if(jsonRes[i].first_name == '' || jsonRes[i].first_name == null) {
            jsonRes[i].ClientFirst = 'None';
        }
        if(jsonRes[i].ClientContactLastName1 == '' || jsonRes[i].ClientContactLastName1 == null) {
            jsonRes[i].ClientContactLastName1 = 'None';
        }
        if(!jsonMap.has(jsonRes[i].Projectid)) {
            formatMap.set(jsonRes[i].Projectid, '<p>Project Number: ' + jsonRes[i].Projectid + ' || Project Name: ' + jsonRes[i].ProjectTitle + '<br>Project Manager: ' + jsonRes[i].First + " " + jsonRes[i].Last + " || Client: "+jsonRes[i].ClientContactFirstName1 + " " + jsonRes[i].ClientContactLastName1 + "<br>Billing Groups: ")
            jsonMap.set(jsonRes[i].Projectid, jsonRes[i]);
        }
        if(jsonRes[i].BillGrp != null && jsonRes[i].BillGrp.trim() > 0 && jsonRes[i].BillGrp != undefined) {
            formatMap.set(jsonRes[i].Projectid, formatMap.get(jsonRes[i].Projectid) + jsonRes[i].BillGrp + ' ')
        }
        // projectMap.set(jsonRes[i].Project, jsonRes[i].Last + ', ' + jsonRes[i].First + ';' + jsonRes[i].QAQC + ';' + jsonRes[i].Members + ';' + jsonRes[i].ClientLast + ', ' + jsonRes[i].ClientFirst + ';' + jsonRes[i].ProjectName);
        if(billingMap.has(jsonRes[i].Projectid)) {
            billingMap.set(jsonRes[i].Projectid, billingMap.get(jsonRes[i].Projectid) + ' ' + jsonRes[i].BillGrp);
        }
        else if(jsonRes[i].BillGrp != null && jsonRes[i].BillGrp != undefined) {
            billingMap.set(jsonRes[i].Projectid, jsonRes[i].BillGrp);
        }
    }
    for(let key of formatMap.keys()) {
        formatMap.set(key, formatMap.get(key) + '</p>' + addFields(key));
    }
}

function addFields(projects) {
    return '<button type="button" onclick="start(\''+projects+'\');">Add New Billing Group</button><br>';
}

function start(proj) {
    ProjectNumberGlobal = proj;
    signIn();
}

function billForm(proj) {
    // ProjectNumberGlobal = proj;
    let qaqc = jsonMap.get(proj).QA_QCPerson
    let team = jsonMap.get(proj).TeamMembers;
    if(billingMap.has(ProjectNumberGlobal)) {
        billingList = billingMap.get(ProjectNumberGlobal).split(" ");
    }
    console.log("QAQC: " + qaqc + " || Team: " + team);
    var jsonString = '{"QAQC":"'+ qaqc +'","Team":"'+ team +'"}';

    document.getElementById('results').innerHTML = "Loading form...";
    var xhr = new XMLHttpRequest();
    var url = "https://e-hv-ppi.shn-engr.com:3000/mgrs";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function(e) {
        document.getElementById('results').innerHTML = 'Connection error.  Try again or get help.<br><button type="button" onclick="billForm('+proj+');">Submit again</button>';
        console.log(e);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
            if(json[0].hasOwnProperty('Last') && json[0].hasOwnProperty('First')) {
                document.getElementById('billRes').innerHTML = '<form name="myForm" id="projForm" onsubmit="reqField();" action="" method=""><div class="grid-container"></div></form>';
                document.getElementById('projForm').innerHTML = gotPage(json, proj);

                // Initialize values from database entries.
                projMgr = Number(jsonMap.get(proj).ProjectMgr)
                qaqcNew = Number(jsonMap.get(proj).QA_QCPerson);
                startDate = jsonMap.get(proj).StartDate;
                endDate = jsonMap.get(proj).CloseDate;
                teamMem = jsonMap.get(proj).TeamMembers.split(',');
                autoCad = (jsonMap.get(proj).AutoCAD_Project == -1)?true:false;
                GIS = (jsonMap.get(proj).GIS_Project == -1)?true:false;
                projLoc = (jsonMap.get(proj).ProjectLoation == null || jsonMap.get(proj).ProjectLoation == undefined)?'':jsonMap.get(proj).ProjectLoation;
                latitude = (jsonMap.get(proj).Lattitude == null || jsonMap.get(proj).Lattitude == undefined)?'0':jsonMap.get(proj).Lattitude;
                longitude = (jsonMap.get(proj).Longitude == null || jsonMap.get(proj).Longitude == undefined)?'0':jsonMap.get(proj).Longitude;
                profCode = jsonMap.get(proj).ProfileCode;
                serviceArea = jsonMap.get(proj).ServiceArea;
                contactType = (jsonMap.get(proj).ContractType == null || jsonMap.get(proj).ContractType == undefined || typeof jsonMap.get(proj).ContractType != 'string')?'0':jsonMap.get(proj).ContractType[0];
                totalContract = (jsonMap.get(proj).ToatlContract == null || jsonMap.get(proj).ToatlContract == undefined)?'':jsonMap.get(proj).ToatlContract;
                invoiceFormat = ((jsonMap.get(proj).InvoiceFormat == null || jsonMap.get(proj).InvoiceFormat == undefined) && (jsonMap.get(proj).InvoiceFormat[0] == 'A' || jsonMap.get(proj).InvoiceFormat.includes('Emp. Name, Dates, Hrs, and Billing Rates')))?'A':(jsonMap.get(proj).InvoiceFormat[0] == 'C' || jsonMap.get(proj).InvoiceFormat.includes('Emp. Name, Dates, Hrs, Billing Rates, Phase, and Task'))?'C':'B';
                outsideMarkup = jsonMap.get(proj).OutsideMarkup;
                specBillInstr = (jsonMap.get(proj).SpecialBillingInstructins == null || jsonMap.get(proj).SpecialBillingInstructins == undefined)?'':jsonMap.get(proj).SpecialBillingInstructins;
                binderSize = (jsonMap.get(proj).BinderSize == null || jsonMap.get(proj).BinderSize == undefined || jsonMap.get(proj).BinderSize == '')?'NA':jsonMap.get(proj).BinderSize;
                descOfServ = jsonMap.get(proj).DescriptionService;
                getKeyIDs();
                fillMe(1);
                getUsers(1);
            }
            else{
                document.getElementById('billRes').innerHTML = 'No Projects found.<button type="button" onclick="submitBilling();">Search Projects</button>';
            }
        }
    };
    console.log(jsonString);
    xhr.send(jsonString);  // an error message typically looks like "{process: {…}, exitCode: 0}" in the console.
}

async function getKeyIDs() {
    await fetch("https://e-hv-ppi.shn-engr.com:3000/keyName", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.parse(JSON.stringify('{"keyText":"' + jsonMap.get(ProjectNumberGlobal).ProjectKeywords + '"}'))
    }).then(keysBoi => {
        return keysBoi.json();
    }).then(keysBoi => {
        if(keysBoi.length > 0 && keysBoi[0].hasOwnProperty('ID')) {
            for(let id of keysBoi) {
                Projkeywords.push(id.ID);
            }
        }
    });
}

function gotPage(data, projNum) {
    teamWee = '';

    for(let entry of data) {
        if(entry.hasOwnProperty('First') && entry.hasOwnProperty('Last')) {
            teamWee += entry.Last + ', ' + entry.First+ ' || ';
        }
    };
    
    teamWee = teamWee.substring(0, teamWee.length - 4);
    
    // Prefill known data.
    manager = jsonMap.get(projNum).Last + ',' + jsonMap.get(projNum).First;
    qaqc = data[data.length - 1].QAQCLast + ',' + data[data.length - 1].QAQCFirst;
    projName = jsonMap.get(projNum).ProjectTitle;
    client = jsonMap.get(projNum).ClientCompany1;

    return '<div class="grid-container">'+
    '<div class="grid-item">Project</div>'+
    '<div class="grid-item">'+ ProjectNumberGlobal +'</div>'+
    '<div class="grid-item">Project Manager</div>'+
    '<div class="grid-item">'+ manager +'</div>'+
    '<div class="grid-item">QA QC Person</div>'+
    '<div class="grid-item">'+ qaqc +'</div>'+
    '<div class="grid-item">Team Members</div>'+
    '<div class="grid-item">'+ teamWee +'</div>'+
    '<div class="grid-item">Project Name</div>'+
    '<div class="grid-item">'+ projName +'</div>'+
    '<div class="grid-item">Client</div>'+
    '<div class="grid-item">'+ client +'</div>'+
    '<div class="grid-item"><label for="groupName">Billing Group Name<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><input type="text" id="newBillName" maxlength="255" required/></div>'+
    '<div class="grid-item"><label for="groupNumb">Billing Group Number<br>(Only enter the 3 digits)<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><input type="text" id="newBillNum" maxlength="3" required/></div>'+
    '<div class="grid-item"><label for="autocad">AutoCAD Job</label></div><div class="grid-item"><input type="radio" name="autocad" id="yesAuto" value="Yes" title="autocad"> Yes<input type="radio" name="autocad" value="No" title="autocad" checked> No </div>'+
    '<div class="grid-item"><label for="gis">GIS Job</label></div><div class="grid-item"><input type="radio" id="gis" name="gis" value="Yes" title="gis"> Yes<input type="radio" name="gis" value="No" title="gis" checked> No</div>'+
    '<div class="grid-item"><label for="projMgr">Group Manager<span class="astrick">*</span></label></div>'+
    '<div class="grid-item" id="projFiller">Loading managers...</div>'+
    '<div class="grid-item"><label for="qaqc">QA QC Person<span class="astrick">*</span></label></div>'+
    '<div class="grid-item" id="qaqcFill">Loading QA QC people...</div>'+
    '<div class="grid-item"><label for="Team">Team Members<span class="astrick">*</span><br/>(Select at least one)</label><br/></div>'+
    '<div class="grid-item" id="help"><div class="column" id="emplCol">Loading team members...</div></div>'+
    '<div class="grid-item"><label for="start">Start Date<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><input type="date" id="start" value="start" required></div>'+
    '<div class="grid-item"><label for="end">End Date<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><input type="date" id="end" value="end" required></div>'+
    '</div><div id="submitter"><button type="button" onclick="reqField(1)">Next</button></div>';
}

// Equivalent to fillPage()

function fillMe(page) {
    if(page == 1) {
        document.getElementById('newBillNum').value = BillingNum;
        document.getElementById('newBillName').value = projTitle;
        document.getElementById('yesAuto').checked = autoCad;
        document.getElementById('gis').checked = GIS;
        document.getElementById('start').value = startDate;
        document.getElementById('end').value = endDate;
    }
    else if(page == 2) {
         // Set previous or default values to fields.

         document.getElementById('LocDesc').value = projLoc;
         document.getElementById('lat').value = latitude;
         document.getElementById('long').value = longitude;
 
         // Now see if the user had inputted anything into the Other fields for keywords.
         // we do so by getting the number of custom keywords in the otherKeys array.
 
         let numOther = otherKeys.length; // Should be no longer than 3.
         let num = 1; // To get ID of input element.
 
         // Loop to pop and insert old custom keywords into text fields.
 
         while(numOther > 0 && num <= 3) {
             this.document.getElementById('Otherkey' + num).setAttribute("value", otherKeys.pop());
             num++;
             numOther--;
         }
    }
    else if(page == 3) {
        document.getElementById('contactType').value = contactType;
        document.getElementById('retainer').value = retainer;
        this.document.querySelector('#service').value = serviceArea;
        document.getElementById('contract').value = totalContract;
        document.getElementById('invoiceFormat').value = invoiceFormat;
        document.getElementById('PO').value = contractPONum;
        document.getElementById('OutMark').value = outsideMarkup;
        document.getElementById('wage').value = prevWage;
        document.getElementById('billInst').value = specBillInstr;
        document.getElementById('binder').value = binderSize;
        document.getElementById('describe').value = descOfServ;

        if(retainer == 'Enter Amount') {
            customAmount();
            this.document.getElementById('newAmount').value = retainAmnt;
        }
        else if(retainer == 'Waived by X') {
            customAmount();
            this.document.getElementById('personnel').value = senior;
        }
    }
}

function nextPage(num) {
    scroll(0,0);
    if(num == 1) {
        document.getElementById('projForm').innerHTML = '<div class="grid-container">'+
        '<div class="grid-item">Project</div>'+
        '<div class="grid-item">'+ ProjectNumberGlobal +'</div>'+
        '<div class="grid-item">Project Manager</div>'+
        '<div class="grid-item">'+ manager +'</div>'+
        '<div class="grid-item">QA QC Person</div>'+
        '<div class="grid-item">'+ qaqc +'</div>'+
        '<div class="grid-item">Team Members</div>'+
        '<div class="grid-item">'+ teamWee +'</div>'+
        '<div class="grid-item">Project Name</div>'+
        '<div class="grid-item">'+ projName +'</div>'+
        '<div class="grid-item">Client</div>'+
        '<div class="grid-item">'+ client +'</div>'+
        '<div class="grid-item"><label for="groupName">Billing Group Name<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><input type="text" id="newBillName" maxlength="255" required/></div>'+
        '<div class="grid-item"><label for="groupNumb">Billing Group Number<br>(Only enter the 3 digits)<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><input type="text" id="newBillNum" maxlength="3" required/></div>'+
        '<div class="grid-item"><label for="autocad">AutoCAD Job</label></div><div class="grid-item"><input type="radio" name="autocad" id="yesAuto" value="Yes" title="autocad"> Yes<input type="radio" name="autocad" value="No" title="autocad" checked> No </div>'+
        '<div class="grid-item"><label for="gis">GIS Job</label></div><div class="grid-item"><input type="radio" id="gis" name="gis" value="Yes" title="gis"> Yes<input type="radio" name="gis" value="No" title="gis" checked> No</div>'+
        '<div class="grid-item"><label for="projMgr">Group Manager<span class="astrick">*</span></label></div>'+
        '<div class="grid-item" id="projFiller">Loading managers...</div>'+
        '<div class="grid-item"><label for="qaqc">QA QC Person<span class="astrick">*</span></label></div>'+
        '<div class="grid-item" id="qaqcFill">Loading QA QC people...</div>'+
        '<div class="grid-item"><label for="Team">Team Members<span class="astrick">*</span><br/>(Select at least one)</label><br/></div>'+
        '<div class="grid-item" id="help"><div class="column" id="emplCol">Loading team members...</div></div>'+
        '<div class="grid-item"><label for="start">Start Date<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><input type="date" id="start" value="start" required></div>'+
        '<div class="grid-item"><label for="end">End Date<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><input type="date" id="end" value="end" required></div>'+
        '</div><div id="submitter"><button type="button" onclick="reqField(1)">Next</button></div>';
        fillMe(1);
        getUsers(1);
    }
    else if(num == 2) {
        document.getElementById('projForm').innerHTML = '<div class="grid-container">'+ getTextField('Project Street Address', 'LocDesc', projLoc, true) +
        getNumberField('Project Latitude<br/>(i.e. 40.868928)', 'lat', latitude, -1, -90, 90, true) +
        getNumberField('Project Longitude<br/>(i.e. -123.988061)', 'long', longitude, -1, -90, 90, true)
        + '<div class="grid-item"><label for="key">Project Keywords<span class="astrick">*</span><br/>(Must select at least one keyword and/or add an extra keyword)</label></div>'+
        '<div class="grid-item"><div class="searchable" id="searchable"><label>Search Keywords: </label><input type="text" id="search" onkeyup="searchKeywords(this)"></div><div class = "column" id="keywords">Getting keywords...</div><br/><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey1" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey2" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey3" name="Otherkey" title="Otherkey" maxlength="255"></div>'
        +'</div><div id="submitter"><button type="button" onclick="goBack(1)">Back</button><button type="button" onclick="reqField(2)">Next</button></div>';
        fillMe(2);
        getUsers(2);
    }
    else if(num == 3) {
        document.getElementById('projForm').innerHTML = '<div class="grid-container">'+
        '<div class="grid-item"><label for="code">Profile Code<span class="astrick">*</span></label></div><div class="grid-item" id="codeFill">Loading profile codes...</div>'+
        '<div class="grid-item"><label for="retainer">Retainer<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><select name="retainer" id="retainer" title="retainer" onchange="customAmount()" required><option value="0">-Select-</option><option value="Enter Amount">Enter Amount:</option><option value="Existing Client">Existing Client No Issues</option><option value="Exempt Public Client">Exempt Public Client</option><option value="Waived by X">Waived by X (Senior Personnel select)</option></select><p id="custAmount"></p></div>'+
        '<div class="grid-item"><label for="service">Service Area</label></div>'+
        '<div class="grid-item"><select name="service" id="service" title="Service Area"><option value="0" selected>-Select-</option><option value="Civil">Civil</option><option value="Environmental">Environmental</option><option value="Geology">Geology</option><option value="Planning/Permitting">Planning/Permitting</option><option value="Survey">Survey</option></select></div>' +
        '<div class="grid-item"><label for="contactType">Contract Type<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><select name="contactType" id="contactType" title="contactType" required><option value="0">-Select-</option><option value="1">1 – Cost Plus (Time and Expenses)</option><option value="2">2 – Cost Plus to a Maximum</option><option value="3">3 – Fixed Fee (Lump Sum)</option><option value="10">10 – Promo (Non-Billable)</option></select></div>'+
        getNumberField('Total Contract', 'contract', 'contract', 1, 0, -1, false) +
        '<div class="grid-item"><label for="invoiceFormat">Invoice Format</label></div><div class="grid-item"><select name="invoiceFormat" id="invoiceFormat" title="invoiceFormat"><option value="A">Emp. Name, Dates, Hrs, and Billing Rates</option><option value="B" selected>Emp. Name, Hrs, and Billing Rates (No Dates)</option><option value="C">Emp. Name, Dates, Hrs, Billing Rates, Phase, and Task</option></select></div>'+
        getTextField('Client Contract/PO #', 'PO', contractPONum, false) +
        '<div class="grid-item"><label for="OutMark">Outside Markup<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><input type="number" id="OutMark" name="OutMark" step="1" min="0" max="100" value="15" onkeypress="limit(this);" required>%</input></div>'+
        '<div class="grid-item"><label for="wage">Prevailing Wage</label></div><div class="grid-item"><select name="wage" id="wage" title="wage" onchange="agency()" required><option value="1">Yes</option><option value="0" selected>No</option></select></div>'+
        '<div class="grid-item"><label for="billInst">Special Billing Instructions</label></div><div class="grid-item"><textarea id="billInst" name="billInst" rows="5" cols="50" maxlength="200"></textarea></div>'+
        '<div class="grid-item"><label for="binder">Binder Size</label></div><div class="grid-item"><select name="binder" id="binder" title="Binder Size"><option value="NULL" selected>N/A</option><option value="0.5">1/2 Inch</option><option value="1">1 Inch</option><option value="1.5">1.5 inches</option><option value="2">2 inches</option><option value="3">3 inches</option></select></div>'+
        '<div class="grid-item"><label for="describe">Description of Services<span class="astrick">*</span><br>Search projects with similar descriptions <a href="search_demo.html" target="_blank">here</a>.</label></div><div class="grid-item"><textarea id="describe" name="describe" rows="5" cols="50" maxlength="63999" required></textarea></div>'+
        '</div><div id="submitter"><button type="button" onclick="goBack(2)">Back</button><button type="button" onclick="reqField(3)">Review</button></div>';
        fillMe(3);
        getUsers(3);
    }
    else if(num == 4) { // Review Page
        let formatStartDate = new Date(startDate)
        formatStartDate = ((formatStartDate.getMonth() + 1) + '-' + formatStartDate.getDate() + '-' + formatStartDate.getFullYear()).toString();
        let formatCloseDate = new Date(endDate)
        formatCloseDate = ((formatCloseDate.getMonth() + 1) + '-' + formatCloseDate.getDate() + '-' + formatCloseDate.getFullYear()).toString();

        let autoCadName = 'no';
        if(autoCad) {
            autoCadName = 'yes';
        }
        let gisName = 'no';
        if(GIS) {
            gisName = 'yes';
        }

        let formatMem = '';
        let formatKeys = '';
        for(names of memNames) {
            formatMem += names + '<br>';
        }
        for(keys of keyNames) {
            formatKeys += keys + '<br>';
        }

        let breakedDesc = descOfServ.replaceAll('\n', '<br>');
        let myAmount = retainAmnt;
        if(retainer != 'enterAmnt') {
            myAmount = 'None';
        }
        let waiver = (retainer == 'Waived by X') ? 'Waived by ' + senior:retainer;

        document.getElementById('projForm').innerHTML = '<div class="grid-container">' +
        '<div class="grid-item">Billing Name' + '</div>'
        + '<div class="grid-item">' + projTitle + '</div>'+
        '<div class="grid-item">Billing Number' + '</div>'
        + '<div class="grid-item">' + BillingNum + '</div>'+
        '<div class="grid-item">Project Manager' + '</div>'
        + '<div class="grid-item">' + manager + '</div>'+
        '<div class="grid-item">Billing Group Manager' + '</div>'
        + '<div class="grid-item">' + mgrName + '</div>'+
        '<div class="grid-item">QAQC Person' + '</div>'
        + '<div class="grid-item">' + qaqcName + '</div>'+
        '<div class="grid-item">Team Members' + '</div>'
        + '<div class="grid-item">' + formatMem + '</div>'+
        '<div class="grid-item">Start Date' + '</div>'
        + '<div class="grid-item">' + formatStartDate + '</div>'+
        '<div class="grid-item">End Date' + '</div>'
        + '<div class="grid-item">' + formatCloseDate + '</div>'+
        '<div class="grid-item">Project Location Descriptor' + '</div>'
        + '<div class="grid-item">' + projLoc + '</div>'+
        '<div class="grid-item">Project Latitude' + '</div>'
        + '<div class="grid-item">' + latitude + '</div>'+
        '<div class="grid-item">Project Longitude' + '</div>'
        + '<div class="grid-item">' + longitude + '</div>'+
        '<div class="grid-item">Project Keywords' + '</div>'
        + '<div class="grid-item">' + formatKeys + '</div>'+
        '<div class="grid-item">Other Keywords' + '</div>'
        + '<div class="grid-item">' + otherKeys + '</div>'+
        '<div class="grid-item">Profile Code' + '</div>'
        + '<div class="grid-item">' + profCodeName + '</div>'+
        '<div class="grid-item">Contract Type' + '</div>'
        + '<div class="grid-item">' + contactTypeName + '</div>'+
        '<div class="grid-item">Service Area' + '</div>'
        + '<div class="grid-item">' + servName + '</div>'+
        '<div class="grid-item">Total Contract' + '</div>'
        + '<div class="grid-item">' + totalContract + '</div>'+
        '<div class="grid-item">Invoice Format' + '</div>'
        + '<div class="grid-item">' + invoiceName + '</div>'+
        '<div class="grid-item">Retainer' + '</div>'
        + '<div class="grid-item">' + waiver + '</div>'+
        '<div class="grid-item">Retainer amount' + '</div>'
        + '<div class="grid-item">' + myAmount + '</div>'+
        '<div class="grid-item">Client Contract/PO #' + '</div>'
        + '<div class="grid-item">' + contractPONum + '</div>'+
        '<div class="grid-item">Outside Markup' + '</div>'
        + '<div class="grid-item">' + outsideMarkup + '</div>'+
        '<div class="grid-item">Prevailige Wage' + '</div>'
        + '<div class="grid-item">' + (prevWage == 1?"Yes":"No") + '</div>'+
        '<div class="grid-item">Agency' + '</div>'
        + '<div class="grid-item">' + (prevWage == 1?agency_name:"N/A") + '</div>'+
        '<div class="grid-item">Special Billing Instructions' + '</div>'
        + '<div class="grid-item">' + specBillInstr + '</div>'+
        '<div class="grid-item">AutoCAD Job' + '</div>'
        + '<div class="grid-item">' + autoCadName + '</div>'+
        '<div class="grid-item">GIS Job' + '</div>'
        + '<div class="grid-item">' + gisName + '</div>'+
        '<div class="grid-item">Binder Size' + '</div>'
        + '<div class="grid-item">' + binderSize + '</div>'+
        '<div class="grid-item">Description of Services' + '</div>'
        + '<div class="grid-item">' + breakedDesc + '</div>'+
        '</div><div id="submitter"><button type="button" onclick="goBack(3)">Back</button><button type="button" onclick="submitBilling()">Submit</button></div>';
    }
}

function goBack(toPage) {
        // If-statements to determine the page the user was on to save the user data for later.

        saveChoices(toPage + 1);

        // Calls getPage to retrieve old fields and user data.
    
        nextPage(toPage);
}

function searchKeywords(wiio) {
    // let searched  = document.querySelector('#search').value;
    saveCheck();
    let searched = wiio.value.trim().toLowerCase();
    if(searched == '') {
        document.getElementById('keywords').innerHTML = keywordString;
    }

    let filtered = [];

    for(let boi of keyResult) {
        if(searched.length <= boi.length && searched == boi.substring(0,searched.length).toLowerCase()) {
            filtered.push(boi);
        }
    }

    if(filtered.length == 0) {
        document.getElementById('keywords').innerHTML = 'No matching keywords';
    }
    else {
        let result = '';
        for(let filth of filtered) {
            result += keyIDMap.get(filth);
        }
        document.getElementById('keywords').innerHTML = result;
    }
    fillCheck();
}

function saveCheck() {
    let saveCheckr = document.querySelectorAll('input[name="key"]');
    for(let saved of saveCheckr) {
        if(saved.checked && !tempKeyID.includes(saved.id)){
            tempKeyID.push(saved.id);
        }
        else if(!saved.checked && tempKeyID.includes(saved.id)) {
            tempKeyID.splice(tempKeyID.indexOf(saved.id), 1);
        }
    }
}

function fillCheck() {
    isCheck = document.querySelectorAll('input[name="key"]');
    for(let mark of isCheck) {
        for(let prev of tempKeyID){
            if(prev == mark.id) {
                mark.checked = true;
                break;
            }
            else {
                mark.checked = false;
            }
        }
    }
}

function getCheckbox(group, id, value, label) {
    return '<div><input type="checkbox" id="'+ id +'" name="' + group + '" title="'+ label +'" placeholder="' + value + '"/><label for="' + group + '">' + label + '</label></div>';
}

function getTextField(label, newID, value, required) { // i.e. getTextField('Project Title', 'promo', projTitle, true);
    let myReq = '';
    let myLabel = label;
    if(required) {
        myReq = 'required';
        myLabel = myLabel + '<span class="astrick">*</span>';
    }
    return '<div class="grid-item"><label for="'+ newID +'">'+ myLabel +'</label></div><div class="grid-item"><input type="text" id="'+ newID +'" name="'+ newID +'" maxlength="255" value="'+ value +'" '+ myReq +'></div>';
}


// limit(element) gets called by number fields to try preventing users from entering more than 45 numbers.

function limit(element)
{
    let max_chars = 45;

    if(element.value.length > max_chars) {
        element.value = element.value.substr(0, max_chars);
    }
}

// Inserts a Label and number field for the table-based format the form has.

function getNumberField(label, newID, value, step, min, max, required) {
    let myReq = '';
    let myLabel = label;
    let myStep = ' step="' + step + '"';
    let myMax = 'max="999999999999999999999999999999999999999999999"';
    if(required) {
        myReq = 'required';
        myLabel = myLabel + '<span class="astrick">*</span>';
    }
    if(step == -1) {
        myStep = ' step="any"';
    }
    if(max != -1) {
        myMax = 'max="' + max + '"';
    }
    return '<div class="grid-item"><label for="'+ newID +'">'+ myLabel +'</label></div><div class="grid-item"><input type="number" id="'+ newID +'" name="'+ newID + myStep +' min="' + min + '" '+ myMax +' onkeypress="limit(this);" value="'+ value +'" '+ myReq +'></div>';
}

/*
Functions to add html for specific fields that needed an extra field to be given for specific user selections.
*/

// function customAmount() called by retainer's "Enter amount:" option. Also disapears when deselected.

function customAmount() {
	if(document.getElementById('retainer').value == 'Enter Amount') { // If-statement if "Enter amount" is selected.
		document.getElementById('custAmount').innerHTML = '<input type="number" id="newAmount" name="newAmount" step="1" min="0" onkeypress="limit(this);" required>'
	}
    else if(document.getElementById('retainer').value == 'Waived by X') {
        document.getElementById('custAmount').innerHTML = '<input type="text" id="personnel" name="personnel" maxlength="255" required>';
    }
	else { // When "Enter amount" is deselected, field and its values are gone.
		document.getElementById('custAmount').innerHTML = '';
	}
}

function saveChoices(num) {
    if(num == 1) {
        projTitle = document.getElementById('newBillName').value;
        BillingNum = document.getElementById('newBillNum').value.trim();
        autoCad = document.getElementById('yesAuto').checked;
        GIS = document.getElementById('gis').checked;
        projMgr = document.getElementById("projMgr").value
        qaqcNew = document.getElementById("qaqc").value;
        startDate = document.getElementById('start').value;
        endDate = document.getElementById('end').value;

        teamMem = [];
        memNames = [];

        let mySelects = document.querySelectorAll('input[name="Team"]:checked');

        // Inserts new selections into teamMem.

        for(selection of mySelects) {
            if(selection.checked){
                teamMem.push(selection.id);
                memNames.push(selection.placeholder);
            }
        }

        // get manager and qaqc person name.

        qaqcName = document.getElementById("qaqc").options[document.getElementById("qaqc").selectedIndex].text;
        mgrName = document.getElementById("projMgr").options[document.getElementById("projMgr").selectedIndex].text;
    }
    else if(num == 2) {
        document.getElementById('search').value = '';
        searchKeywords(document.getElementById('search'));
        projLoc = document.getElementById('LocDesc').value.trim();
        latitude = document.getElementById('lat').value.trim();
        longitude = document.getElementById('long').value.trim();
        let prevkeys = document.querySelectorAll('input[name="key"]:checked');
        Projkeywords = [];
        keyNames = [];
        for(key of prevkeys) {
            if(key.checked) {
                Projkeywords.push(key.id);
                keyNames.push(key.placeholder);
            }
        }
        let others = document.getElementsByName("Otherkey");
        otherKeys = [];
        for(other of others) {
            if(other.value.trim() != '') {
                otherKeys.push(other.value.trim());
            }
        }
    }
    else if(num == 3) {
        serviceArea = document.getElementById('service').value;
        if(serviceArea == 0) {
            servName == 'none';
        }
        else {
            servName = document.getElementById('service').options[document.getElementById("service").selectedIndex].text;
        }
        contactType = document.getElementById('contactType').value;
        contactTypeName = document.getElementById('contactType').options[document.getElementById("contactType").selectedIndex].text;
        invoiceFormat = document.getElementById('invoiceFormat').value;
        invoiceName = document.getElementById('invoiceFormat').options[document.getElementById("invoiceFormat").selectedIndex].text;
        profCode = document.getElementById('code').value;
        profCodeName = document.getElementById('code').options[document.getElementById("code").selectedIndex].text;
        retainer = document.getElementById('retainer').value;
        totalContract = document.getElementById('contract').value;
        contractPONum = document.getElementById('PO').value.trim();
        outsideMarkup = document.getElementById('OutMark').value;
        prevWage = document.getElementById('wage').value;
        specBillInstr = document.getElementById('billInst').value.trim();
        binderSize = document.getElementById('binder').value;
        descOfServ = document.getElementById('describe').value;
        if(retainer == 'Enter Amount') {
            retainAmnt = document.getElementById('newAmount').value;
        }
        else if(retainer == 'Waived by X') {
            senior = document.getElementById('personnel').value.trim();
        }
    }
}

function reqField(currPage) {
    saveChoices(currPage);
    if(currPage == 1) {
        // mySelects to determine if number of checked boxes is more than 1.

        let mySelects = document.querySelectorAll('input[name="Team"]:checked');

        if(qaqcNew == 0 || projMgr == 0 || projTitle == '' || mySelects.length <= 0 || startDate == '' || startDate == undefined || endDate == '' || endDate == undefined || startDate > endDate || isNaN(BillingNum)) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
                
        if(projTitle.includes("#") || projTitle.includes("<") || projTitle.includes("$") || projTitle.includes("+") || projTitle.includes("%") || projTitle.includes(">") ||projTitle.includes("!") || projTitle.includes("`") || projTitle.includes("*") || projTitle.includes("'") || projTitle.includes("|") || projTitle.includes("{") || projTitle.includes("?") || projTitle.includes("\"") || projTitle.includes("=") || projTitle.includes("}") || projTitle.includes("/") || projTitle.includes(":") || projTitle.includes("\\") || projTitle.includes("@")) {
            alert("No special characters.  Please rename your billing title.");
            return false;
        }

        if(projTitle[projTitle.length - 1] == '.') {
            alert("Please remove the period at the end of billing title.");
            return false;
        }
        if(billingList.includes(BillingNum)) {
            alert("Billing number already exists for this project.");
            return false;
        }
        if(!isNum(BillingNum[0]) || !isNum(BillingNum[1]) || !isNum(BillingNum[2])) {
            alert("Invalid billing number.");
            return false;
        }
    }
    else if(currPage == 2) {
        // Test against user selections and fields to determine if values are valid.

        if(projLoc == '' || latitude == '' || longitude == '' || Projkeywords.length + otherKeys.length <= 0) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        // Check latitude.
        
        if(isNaN(latitude)) {
            alert("Invalid latitude.");
            return false;
        }
        else if(Number(latitude) > 90 || Number(latitude) < -90) {
            alert("Keep latitude between 90 and -90.");
            return false;
        }

        // Check longitude.

        if(isNaN(longitude)) {
            alert("Invalid longitude.");
            return false;
        }
        else if(Number(longitude) < -180 || Number(longitude) > 180) {
            alert("Keep longitude between 180 and -180.");
           return false;
        }
        
    }
    else if(currPage == 3) {

        if(outsideMarkup == '' || outsideMarkup < 0 || outsideMarkup > 100 || retainer == 0 || profCode == -1 || contactType == 0) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        if(contractPONum.length > 45 || outsideMarkup.length > 45) {
            alert("Keep Client Contract/PO # and/or Outside Markup under 45 characters.");
            return false;
        }

        if(descOfServ == '') {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        // Now test if "Enter Amount:" was selected.

        if(retainer == 'Enter Amount' && document.getElementById('newAmount').value == '') { // If user didn't input anything, yell at them and return false.
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
        else if(retainer == 'Enter Amount' && document.getElementById('newAmount').value.length > 45) {
            alert("Can't have more than 45 characters.");
            return false;
        }
        else if(retainer == 'Waived by X' && senior == '') {
            alert("Enter a senior personnel name.");
            return false;
        }
    }
    nextPage(currPage + 1);
}

function isNum(num) {
    return (num == 0 || num == 1 || num == 2 || num == 3 || num == 4 || num == 5 || num == 6 || num == 7 || num == 8 || num == 9) ? true:false;
}

function getUsers(num) {
    let accessErr = false;
    // If-statements are to determine which page is making the call.
    if(num == 1) { // for page1()
        fetch("https://e-hv-ppi.shn-engr.com:3000").then(response => { // Makes a call for employees.
            let myEmpl = response.json();
            return myEmpl; // returns to the ".then" statement's data below for processing.
        }).then(data => {
            if(!data[0].hasOwnProperty("ID")) {
                accessErr = true;
                console.log(data);
                throw error;
            }

            // Here we create dropdown elements for the page to select managers.

            let selectMgr = document.createElement('select');
            let qaqcMgr = document.createElement('select');
            selectMgr.name = "projectManagers";
            selectMgr.id = "projMgr";
            qaqcMgr.name = "qaqcPerson";
            qaqcMgr.id = "qaqc";
            selectMgr.required = true;
            qaqcMgr.required = true;

            // Creates the default "-Select-" option and appends to the inside of the dropdown.

            let option = document.createElement("option");
            let quackOpt = document.createElement("option");
            option.value = "0";
            quackOpt.value = "0";
            option.text = "-Select-";
            quackOpt.text = "-Select-";
            selectMgr.appendChild(option);
            qaqcMgr.appendChild(quackOpt);

            // checkEmpl will hold all the checkboxes to select team members for the project.

            let checkEmpl = document.getElementById('emplCol');

            // We clear checkEmpl using an empty string here.
            // In function page(1), the html displays "Loading managers..." by default to show that the information is getting fetched.

            checkEmpl.innerHTML = '';

            // A forEach loop to create the rest of the dropdown elements from our data retrieval.

            Object.entries(data).forEach((entry) => {

                // Create an option in every iteration.

                option = document.createElement("option");
                quackOpt = document.createElement("option");

                // Each option is assigned it's value using the employee ID, and its text is their last and first name.
                // If user is a project manager, they join the project manager list.

                if(entry[1].PM == -1) {
                    option.value = entry[1].ID;
                    option.text = entry[1].Last + ", " + entry[1].First;
                    quackOpt.value = entry[1].ID;
                    quackOpt.text = entry[1].Last + ", " + entry[1].First;

                    // Append employee to the dropdowns.

                    selectMgr.appendChild(option);
                    qaqcMgr.appendChild(quackOpt);
                }

                // Finally, we use function getCheckbox() to create a checkbox and append into our 4 column table.
            });

            // Math to determine the order of adding employee checkboxes in alphabetical order in columns.
            // By default, employees are ordered from left to right when appending each to checkEmpl.innerHTML.

            const floor = Math.floor(data.length / 4);
            let row = 0;
            let jumpTo = 0;
            let iter = 0;
            while(row < floor) {
                jumpTo = row;
                iter = 0;
                while(iter < 4 && jumpTo < data.length) {
                    checkEmpl.innerHTML += getCheckbox('Team', data[jumpTo].ID, data[jumpTo].First + " " + data[jumpTo].Last, data[jumpTo].Last + ", " + data[jumpTo].First);
                    jumpTo += floor;
                    iter++;
                }
                row++;
            }

            // Add last 0-3 employee checkboxes we may have missed, and append to last row.

            if(data.length / 4 > floor) {
                jumpTo = floor * 4;
                while(jumpTo < data.length) {
                    checkEmpl.innerHTML += '<div></div><div></div><div></div>';
                    checkEmpl.innerHTML += getCheckbox('Team', data[jumpTo].ID, data[jumpTo].First + " " + data[jumpTo].Last, data[jumpTo].Last + ", " + data[jumpTo].First);
                    jumpTo++;
                }
            }

            // We clear the inside of our containers holding the dropdowns using an empty string.
            // In function page(1), the html displays "Loading managers..." by default to show that the information is getting fetched.

            document.getElementById("projFiller").innerHTML = '';
            document.getElementById("qaqcFill").innerHTML = '';
            document.getElementById("projFiller").appendChild(selectMgr);
            document.getElementById("qaqcFill").appendChild(qaqcMgr);

            // fillAfterLoad fills the previous selected answers.

            fillAfterLoad(1);

        }).catch(error => { // If we can't connect to our server for whatever reason, we'll write an error mesage into our table.

            document.getElementById("qaqcFill").innerHTML = 'Oh no! SHN had a connection error!';
            document.getElementById('help').innerHTML = "Oh no! SHN had a connection error!";

            // The real error will be written to the console.

            if(!accessErr) {
                console.log(error);
            }
        });
    }
    else if(num == 2) { // for page2()
        fetch("https://e-hv-ppi.shn-engr.com:3000/1").then(response => { // Makes a call for keywords.
            let myKeys = response.json();
            return myKeys; // returns to the ".then" statement's data below for processing.
        }).then(data => {

            if(!data[0].hasOwnProperty("ID")) {
                accessErr = true;
                console.log(data);
                throw error;
            }

            // Gets the section of the table that hold the keywords, and sets it to an empty string.
            // In function page(1), the html displays "Getting keywords..." by default to show that the information is getting fetched.

            let keyEl = document.getElementById('keywords');

            keyEl.innerHTML = '';
            keyResult = [];   
            keyIDMap.clear();         // A forEach loop to create the checkbox elements from our data retrieval.

            const floor = Math.floor(data.length / 4);
            let row = 0;
            let jumpTo = 0;
            let iter = 0;
            while(row < floor) {
                jumpTo = row;
                iter = 0;
                while(iter < 4 && jumpTo < data.length) {
                    keyEl.innerHTML += getCheckbox('key', data[jumpTo].ID, data[jumpTo].Keyword, data[jumpTo].Keyword);
                    keyResult.push(data[jumpTo].Keyword);
                    keyIDMap.set(data[jumpTo].Keyword, getCheckbox('key', data[jumpTo].ID, data[jumpTo].Keyword, data[jumpTo].Keyword));
                    jumpTo += floor;
                    iter++;
                }
                row++;
            }

            // Add last 0-3 keyword checkboxes we may have missed, and append to last row.

            if(data.length / 4 > floor) {
                jumpTo = floor * 4;
                while(jumpTo < data.length) {
                    keyEl.innerHTML += '<div></div><div></div><div></div>';
                    keyEl.innerHTML += getCheckbox('key', data[jumpTo].ID, data[jumpTo].Keyword, data[jumpTo].Keyword);
                    keyResult.push(data[jumpTo].Keyword);
                    keyIDMap.set(data[jumpTo].Keyword, getCheckbox('key', data[jumpTo].ID, data[jumpTo].Keyword, data[jumpTo].Keyword));
                    jumpTo++;
                }
            }

            keywordString = keyEl.innerHTML;

            fillAfterLoad(2);

        }).catch(error => { // If an error occurs with our connection to the server, we'll write an error mesage into our table.

            document.getElementById('keywords').innerHTML = 'Oh no! Keywords couldn\'t be retrieved!';

            // Our real error will get written into the console.

            if(!accessErr) {
                console.log(error);
            }
        });
    }
    else if(num == 3) { // for page3()
        fetch("https://e-hv-ppi.shn-engr.com:3000/2").then(response => { // Makes a call for profile codes.
            let myCodes = response.json();
            return myCodes; // returns to the ".then" statement's data below for processing.
        }).then(data => {

            if(!data[0].hasOwnProperty("Code")) {
                accessErr = true;
                console.log(data);
                throw error;
            }

            // Creates dropdown element, and sets attributes name and id.

            let codeEl = document.createElement('select');
            codeEl.name = 'code';
            codeEl.id = 'code';
            codeEl.required = true;

            // Creates default option "-Select-" and appends to the dropdown.

            let codeOpt = document.createElement("option");
           
            /*
            Side note:
            I gave some of the dropdown options have value 0 as a default value for "-Select-",
            but this is an example where I couldn't use 0 because one of the code options had a value of 000, which evaluated to 0.
            Instead, I'm choosing -1 for this dropdown to represent the value of "-Select-".
            */

            codeOpt.value = -1;
            codeOpt.text = '-Select-';
            codeEl.appendChild(codeOpt);

            // forEach loop to createing and appending the remaining elements in the dropdown.

            Object.entries(data).forEach((entry) => {
                codeOpt = document.createElement("option");
                codeOpt.value = entry[1].Code;
                codeOpt.text = entry[1].Code + " - " + entry[1].CodeDescription;
                codeEl.appendChild(codeOpt);
            });

            // Now we clear the text in the cooresponding table container by using an empty string, and insert our dropdown.
            // In function page(1), the html displays "Loading profile codes..." by default to show that the information is getting fetched.

            document.getElementById('codeFill').innerHTML = '';
            document.getElementById('codeFill').appendChild(codeEl);

            document.getElementById(codeEl.id).value = profCode;

        }).catch(error => { // If an error occurs with our connection to the server, we'll write an error mesage into our table.

            document.getElementById('codeFill').innerHTML = 'Oh no! Profile codes couldn\'t be retrieved!';

            // We write our real error to the console.

            if(!accessErr) {
                console.log(error);
            }
        });
    }
}

function fillAfterLoad(currPage) {
    if(currPage == 1) {

    // Set previous or default values to fields.
    document.getElementById("qaqc").value = qaqcNew;
    document.getElementById("projMgr").value = projMgr;

        // Select all checkbox inputs to test which ones need to be checked.

        let prevSelects = document.querySelectorAll('input[name="Team"]');

        // For-loops to select the checkboxes from previous user selections, if any.
        // The loops tests checkboxes based on the checkbox IDs stored in variable teamMem.
        
        for(memb of teamMem) {
            for(selects of prevSelects) {
                if(memb == selects.id) {
                    document.getElementById(selects.id).checked = true;
                    break;
                }
            }
        }
    }
    else if(currPage == 2) {

        // Select all checkbox inputs to test which ones need to be checked.

        let nuts = document.querySelectorAll('input[name="key"]');

        // For-loops to select the checkboxes from previous user selections, if any.
        // The loops tests checkboxes based on the checkbox IDs stored in variable Projkeywords.
        
        for(check of Projkeywords) {
            for(ischeck of nuts) {
                if(check == ischeck.id) {
                    document.getElementById(ischeck.id).checked = true;
                    break;
                }
            }
        }
    }
}

function submitBilling() {
    let myNames = '';
    for(let i = 0; i < otherKeys.length; i++) {
        myNames += format(otherKeys[i]);
        if(i < otherKeys.length - 1) {
            myNames += ' || ';
        }
    }

    let cadNum = 0;
    if(autoCad) {
        cadNum = -1;
    }
    let gisNum = 0;
    if(GIS) {
        gisNum = -1;
    }

    if(serviceArea == 0) {
        servName = 'None';
    }
    if(totalContract.length == 0) {
        totalContract = '0';
    }
    if(contractPONum.trim() == '') {
        contractPONum = 'None';
    }
    if(specBillInstr.trim() == '') {
        specBillInstr = 'None';
    }

    let waiver = (retainer == 'Waived by X') ? 'Waived by ' + senior:retainer;

    let sql = '{"ProjectId":"'+ ProjectNumberGlobal +
        '","ProjectName":"'+ format(projName) +
        '","BillingNum":"'+ BillingNum +
        '","BillingName":"'+ format(projTitle) +
        '","Manager":"'+manager+
        '","NewMgr":"'+projMgr+
        '","NewMgrName":"'+mgrName+
        '","QAQC":"'+qaqcNew+
        '","QAQCName":"'+qaqcName+
        '","TeamMembers":"'+ teamMem + '",' +
        '"TeamMemberNames":"'+ teamString(memNames) + '",' +
        '"StartDate":"'+ startDate + '",' +
        '"CloseDate":"' + endDate + '",' +
        '"ProjectLocation":"'+ format(projLoc) + '",' +
        '"Latitude":"'+ format(latitude) + '",' +
        '"Longitude":"'+ format(longitude) + '",' +
        '"ProjectKeywords":"'+ teamString(keyNames) + ','+ format(myNames) + '",' +
        '"ProfileCode":"'+ profCode + '",' +
        '"ContractType":"'+ contactType + '",' +
        '"contactTypeName":"'+ contactTypeName + '",'+
        '"InvoiceFormat":"'+ invoiceName + '",' +
        '"Longitude":"'+ format(longitude) + '",' +
        '"ServiceArea":"'+ servName + '",' +
        '"TotalContract":"'+ totalContract + '",' +
        '"Retainer":"'+ format(waiver) + '",' +
        '"RetainerPaid":"'+ retainAmnt + '",' +
        '"ClientContractPONumber":"'+ format(contractPONum) + '",' +
        '"OutsideMarkup":"' + outsideMarkup + '",' +
        '"PREVAILING_WAGE":"'+ prevWage + '",' +
        '"agency":"'+ (agency_name == ''?"NULL":format(agency_name)) + '",' +
        '"SpecialBillingInstructins":'+ JSON.stringify(formatMultiline(specBillInstr)) + ',' +
        '"AutoCAD_Project":'+ cadNum + ',' +
        '"GIS_Project":'+ gisNum + ',' +
        '"BinderSize":"'+ binderSize + '",' +
        '"CreatedOn":"'+ format(new Date().toString()) + '",' +
        '"CreatedBy":"'+ format(activeUser) + '",' +
        '"DescriptionService":'+ JSON.stringify(formatMultiline(descOfServ)) + '}';

    document.getElementById('submitter').innerHTML = "Submitting";

    var xhr = new XMLHttpRequest();
    var url = "https://e-hv-ppi.shn-engr.com:3000/submitBill";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function(e) {
        document.getElementById('submitter').innerHTML = 'Connection error.  Try again or get help.<br><button type="button" onclick="goBack(3)">Back</button><button type="button" onclick="submitBilling()">Submit</button>';
        console.log(e);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
            if(json.hasOwnProperty('Status')) {
                document.getElementById('submitter').innerHTML = 'Success! <button type="button" onclick="submit();">Start Over</button> or <a href="Project_initiation_home.html">Back to Home</a>';
            }
            else{
                document.getElementById('submitter').innerHTML = 'Submission unsuccessful.  Try again or get help.<br><button type="button" onclick="goBack(3)">Back</button><button type="button" onclick="submitBilling()">Submit</button>';
            }
        }
        else if(xhr.status === 400) {
            document.getElementById('submitter').innerHTML = 'Bad request.  Try again or get help.<br><button type="button" onclick="goBack(3)">Back</button><button type="button" onclick="submitBilling()">Submit</button>';
        }
        else if(xhr.status === 500) {
            document.getElementById('submitter').innerHTML = 'Internal server error.  Try again or get help.<br><button type="button" onclick="goBack(3)">Back</button><button type="button" onclick="submitBilling()">Submit</button>';
        }
    };
    sql = JSON.parse(JSON.stringify(sql))
    xhr.send(sql)
}

/*
    Function format() takes user input and formats it to escape single quotes (') and backslashes (\).
    MS Access would throw an error otherwise, because ' indicates the end of the data needed to be inserted,
    and \ is an escape character.
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

/*
    Function formatMultiline() takes user input and formats it to escape single quotes (').
    MS Access would throw an error otherwise, because ' indicates the end of the data needed to be inserted.
*/

function formatMultiline(myString) {
    let i = 0;

    while(i < myString.length) {
        if(myString[i] == '\'') {
            myString = myString.substring(0, i) + '\'' + myString.substring(i);
            i++;
        }
        i++;
    }

    return myString;
}

function teamString(memberArray) {

    let mems = '';
    for(let i = 0; i < memberArray.length; i++) {
        mems += memberArray[i];
        if(i < memberArray.length - 1) {
            mems += ' || '
        }
    }
    return mems;
}

/**
 * Updates page by inserting a field to type an agency name when "Prevailing Wage" is selected.
 * @returns nothing.
 */

function agency() {
    if(document.getElementById('wage').value == "1") {
        document.getElementById('agent').innerHTML = '<br><label for="agentcy">Name of Agency:<span class="astrick">*</span></label><br><input type="text" id="agency" name="agency" title="Agency" maxlength="255">';
    }
    else {
        document.getElementById('agent').innerHTML = '';
    }
}

/**
 * Null function (meant to stop execution if user is not authenticated).
 * @param {Number} num 
 */
function starter(res) {
    activeUser = res.account.name;
    billForm(ProjectNumberGlobal);
}