const fromSession = window.sessionStorage.getItem('userObject');
let userData; // JSON of original entry
const isProject = (JSON.parse(fromSession).Identifier == 0 || JSON.parse(fromSession).Identifier == -1) ? true:false;
const isBillingGroup = JSON.parse(fromSession).Identifier == -1 ? true:false;
let mgrName = '';
const oldMgrName = (isBillingGroup?userData[0].last+ ", " + userData[0].first:null);
let teamMem = new Array();
let memNames = new Array();
let keyNames = new Array();
let qaqcName = '';
let Projkeywords = new Array();
let keyIDMap = new Map();
let otherKeys = new Array();
let tempKeyID = [];
let ServAgree = false;
let Explanation = '';
let retainAmnt = 0;
let profCodeName = '';
let officeName1 = '';
let contractPONum = '';
let contactTypeName = '';
let outsideMarkup = 0;
let clientRelation = '';
let openHouse = false;
let xmas = false;
let activeUser = '';

/**
 * Loads the first page.
 */

async function starter(res) {
    activeUser = res.account.name;
    userData = await fetchInfo();
    if(isProject && !isBillingGroup) {
        openHouse = userData[0].mailing_list != null?(userData[0].mailing_list.includes("Open")?true:false):false;
        xmas = userData[0].mailing_list != null?(userData[0].mailing_list.includes("mas")?true:false):false;
    }
    document.getElementsByTagName("h1")[0].innerHTML = (isProject)?((isBillingGroup)?userData[0].group_number + ' in ' + userData[0].project_id:userData[0].project_id):userData[0].promo_id;
    for(let id of userData) {
        if(id.hasOwnProperty('keyword_id') && !Projkeywords.includes(id.keyword_id)) {
            Projkeywords.push(id.keyword_id);
        }
        if(id.hasOwnProperty('member_id') && !teamMem.includes(id.member_id)) {
            teamMem.push(id.member_id);
        }
    }
    userData[0].start_date = userData[0].start_date.substring(0, userData[0].start_date.indexOf('T'));
    userData[0].close_date = userData[0].close_date.substring(0, userData[0].close_date.indexOf('T'))
    manager(1);
}

async function fetchInfo() {
    const response = await fetch('https://e-hv-ppi.shn-engr.com:3001/getMe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: fromSession
    });
    return await response.json();
}
/**
 * Runs all the necessary functions and commands in order based on what page it needs to load.
 * @param {Number} currPage 
 * @returns 
 */

function manager(currPage) {
    document.getElementById('projForm').innerHTML = getPage(currPage);
    document.getElementById('projForm').innerHTML += ((!isProject && currPage == 6) || (isProject && currPage == 7) || (isBillingGroup && currPage == 4))?'<div id="sending"><div class="buttons"><button type="button" onclick="goBack('+ currPage +')">Back</button><button type="button" onclick="preparePost()">Submit</button></div></div>':'<div class="buttons"><button type="button" onclick="goBack('+ currPage +')">Back</button><button type="button" onclick="reqField('+currPage+')">Next</button></div>';
    if(currPage === 1) {
        if(!isBillingGroup) {
            document.getElementById('promo').value = (isProject?userData[0].project_title:userData[0].promo_title);
        }
        else {
            document.getElementById('newBillName').value = userData[0].group_name;
        }
        document.getElementById('start').setAttribute("value", userData[0].start_date);
        document.getElementById('end').setAttribute("value", userData[0].close_date);
        if(!isProject) {
            document.getElementById('promo-type').value = (userData[0].promo_type == null || userData[0].promo_type == undefined)?'':userData[0].promo_type;
        }
        getUsers(1);
    }
    else if(currPage === 2) {
        document.getElementById('LocDesc').value = ((isProject)?((isBillingGroup)?userData[0].group_location:userData[0].project_location):userData[0].promo_location)
        document.getElementById('lat').value = userData[0].latitude;
        document.getElementById('long').value = userData[0].longitude;
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
        getUsers(2);
    }
    else if(currPage === 3) {
        document.getElementById('service').value = userData[0].service_area;
        
        if(isProject && !isBillingGroup) {
            document.getElementById("office").value = userData[0].SHNOffice_ID;
            document.getElementById('contract').value = userData[0].total_contract;
            document.getElementById('yesAgreement').checked = (userData[0].exempt_agreement == 1)?true:false;
            if(document.getElementById('yesAgreement').checked) {
                expandWhy();
                document.getElementById('bruh').value = userData[0].why;
            }
            
            if(userData[0].retainer.includes("Enter Amount")) {
                document.getElementById('retainer').value = "Enter Amount";
                customAmount();
                document.getElementById('newAmount').value = userData[0].retainer_paid;
            }
            else if(userData[0].retainer.includes("Waived by")) {
                document.getElementById('retainer').value = "Waived by X";
                customAmount();
                document.getElementById('personnel').value = userData[0].waived_by;
            }
            else {
                document.getElementById('retainer').value = (userData[0].retainer.includes("Existing Client")?"Existing Client":(userData[0].retainer.includes("Exempt")?"Exempt Public Client":0));
            }
        }
        else if (isBillingGroup) {
            document.getElementById('contract').value = userData[0].total_contract;
            if(userData[0].retainer.includes("Enter Amount")) {
                document.getElementById('retainer').value = "Enter Amount";
                customAmount();
                document.getElementById('newAmount').value = userData[0].retainer_paid;
            }
            else if(userData[0].retainer.includes("Waived by")) {
                document.getElementById('retainer').value = "Waived by X";
                customAmount();
                document.getElementById('personnel').value = userData[0].waived_by;
            }
            else {
                document.getElementById('retainer').value = userData[0].retainer;
            }
            document.getElementById('contactType').value = userData[0].contract_ID;
            document.getElementById('invoiceFormat').value = (userData[0].invoice_format == null?"B":userData[0].invoice_format);
            document.getElementById('PO').value = userData[0].client_contract_PO;
            document.getElementById('OutMark').value = userData[0].outside_markup;
            if(userData[0].prevailing_wage != 0) {
                document.getElementById('wage').value = '1';
                agentBruh();
                document.getElementById('agency').value = userData[0].agency_name;
            }
            document.getElementById('billInst').value = userData[0].special_billing_instructions;
            document.getElementById('binder').value = (userData[0].binder_size == null || userData[0].binder_size == "NULL"?"NULL":userData[0].binder_size);
            document.getElementById('describe').value = userData[0].description_service;
        }
        else {
            document.getElementById("office").value = userData[0].SHNOffice_ID;
        }
        getUsers(3);
    }
    else if(currPage === 4 && !isBillingGroup) {
        if(isProject) {
            document.getElementById('contactType').value = userData[0].contract_ID;
            document.getElementById('invoiceFormat').value = (userData[0].invoice_format == null?"B":userData[0].invoice_format);
            document.getElementById('PO').value = userData[0].client_contract_PO;
            document.getElementById('OutMark').value = userData[0].outside_markup;
            if(userData[0].prevailing_wage != 0) {
                document.getElementById('wage').value = '1';
                agentBruh();
                document.getElementById('agency').value = userData[0].agency_name;
            }
            document.getElementById('billInst').value = userData[0].special_billing_instructions;
            document.getElementById('seeAlso').value = userData[0].see_also;
            document.getElementById('yesAuto').checked = (userData[0].autoCAD == 1)?true:false;
            document.getElementById('gis').checked = (userData[0].GIS == 1)?true:false;
            document.getElementById('ProjSpecs').checked = (userData[0].project_specifications == 1)?true:false;
        }
        else {
            document.getElementById('clientComp').value = userData[0].client_company;
            document.getElementById('clientAbbr').value = (userData[0].client_abbreviation == undefined || userData[0].client_abbreviation == null)?'':userData[0].client_abbreviation;
            document.getElementById('cFirst').value = userData[0].first_name;
            document.getElementById('cLast').value = userData[0].last_name;
            document.getElementById('title').value = (userData[0].job_title == undefined || userData[0].job_title == null)?'':userData[0].job_title;
            document.getElementById('addy1').value = userData[0].address1;
            document.getElementById('addy2').value = (userData[0].address2 == undefined || userData[0].address2 == null)?'':userData[0].address2;
            document.getElementById('city').value = userData[0].city;
            document.getElementById('state').value = userData[0].state;
            document.getElementById('zip').value = userData[0].zip_code;
            document.getElementById('WP').value = userData[0].work_phone;
            document.getElementById('HP').value = (userData[0].home_phone == undefined || userData[0].home_phone == null)?'':userData[0].home_phone;
            document.getElementById('cell').value = (userData[0].cell == undefined || userData[0].cell == null)?'':userData[0].cell;
            document.getElementById('fax').value = (userData[0].fax == undefined || userData[0].fax == null)?'':userData[0].fax;
            document.getElementById('email').value = userData[0].email;
        }
    }
    else if(currPage === 5 && !isBillingGroup) {
        if(isProject) {
            document.getElementById('clientComp').value = userData[0].client_company;
            document.getElementById('openHouse').checked = openHouse;
            document.getElementById('christmas').checked = xmas;
            document.getElementById('clientAbbr').value = (userData[0].client_abbreviation == undefined || userData[0].client_abbreviation == null)?'':userData[0].client_abbreviation;
            document.getElementById('cFirst').value = userData[0].first_name;
            document.getElementById('cLast').value = userData[0].last_name;
            document.getElementById('title').value = (userData[0].job_title == undefined || userData[0].job_title == null)?'':userData[0].job_title;
            document.getElementById('addy1').value = userData[0].address1;
            document.getElementById('addy2').value = (userData[0].address2 == undefined || userData[0].address2 == null)?'':userData[0].address2;
            document.getElementById('city').value = userData[0].city;
            document.getElementById('state').value = userData[0].state;
            document.getElementById('zip').value = userData[0].zip_code;
            document.getElementById('WP').value = userData[0].work_phone;
            document.getElementById('HP').value = (userData[0].home_phone == undefined || userData[0].home_phone == null)?'':userData[0].home_phone;
            document.getElementById('cell').value = (userData[0].cell == undefined || userData[0].cell == null)?'':userData[0].cell;
            document.getElementById('fax').value = (userData[0].fax == undefined || userData[0].fax == null)?'':userData[0].fax;
            document.getElementById('email').value = userData[0].email;
        }
        else {
            document.getElementById('binder').value = (userData[0].binder_size == undefined || userData[0].binder_size == null || userData[0].binder_size == 'NULL')? 'NULL':userData[0].binder_size;
            document.getElementById('describe').value = (userData[0].description_service == undefined || userData[0].description_service == null)?'':userData[0].description_service;
        }
    }
    else if(currPage === 6 && isProject && !isBillingGroup) {
        document.getElementById('binder').value = (userData[0].binder_size == undefined || userData[0].binder_size == null)? 'NULL':userData[0].binder_size;
        document.getElementById('bindLoc').value = (userData[0].binder_location == undefined || userData[0].binder_location == null)? '':userData[0].binder_location;
        document.getElementById('describe').value = (userData[0].description_service == undefined || userData[0].description_service == null)?'':userData[0].description_service;
    }
    // scroll back to the top.
    scroll(0,0);
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

// function expandwhy() expands a required textarea field for when user selects "Yes" for the option "Is this project exempt from having a Service Agreement?"

function expandWhy() {
    let myCheck = document.getElementById('yesAgreement').checked;

    if(myCheck) { // Expand on "Yes" selection.
        document.getElementById('justWhy').innerHTML = '<br/><label for="explainYes">Explain why:<span class="astrick">*</span></label><br/><textarea id="bruh" name="explainYes" rows="5" cols="50" maxlength="200" required></textarea>';
    }
    else { // Retract on "No" selection.
        document.getElementById('justWhy').innerHTML = '';
    }
}

/**
 * Updates page by inserting a field to type an agency name when "Prevailing Wage" is selected.
 * @returns nothing.
 */

function agentBruh() {
    if(document.getElementById('wage').value == 1) {
        document.getElementById('agent').innerHTML = '<br><label for="agentcy">Name of Agency:<span class="astrick">*</span></label><br><input type="text" id="agency" name="agency" title="Agency">';
    }
    else {
        document.getElementById('agent').innerHTML = '';
    }
}

/*
Functions to be called when fields are needed.
This was to keep from having to manually insert too much html labels and input fields
into the page#() functions.
*/

// Inserts a Label and text field for the table-based format the form has.

function getTextField(label, newID, value, required) { // i.e. getTextField('Project Title', 'promo', userData[0].ProjectTitle, true);
    let myReq = '';
    let myLabel = label;
    if(required) {
        myReq = 'required';
        myLabel = myLabel + '<span class="astrick">*</span>';
    }
    return '<div class="grid-item"><label for="'+ newID +'">'+ myLabel +'</label></div><div class="grid-item"><input type="text" id="'+ newID +'" name="'+ newID +'" maxlength="240" value="'+ value +'" '+ myReq +'></div>';
}

// Inserts a Label and checkbox for the table-based format the form has.
// Typically gets called within function getUsers() to give API called values a checkbox.

function getCheckbox(group, id, value, label) {
    return '<div><input type="checkbox" id="'+ id +'" name="' + group + '" title="'+ label +'" placeholder="' + value + '"/><label for="' + group + '">' + label + '</label></div>';
}

// Inserts a Label and number field for the table-based format the form has.

function getNumberField(label, newID, value, step, min, max, required) {
    let myReq = '';
    let myLabel = label;
    let myStep = ' step="' + step + '"';
    let myMax = 'max="9999"';
    if(required) {
        myReq = 'required';
        myLabel = myLabel + '<span class="astrick">*</span>';
    }
    if(step == -1) {
        myStep = '" step="any"';
    }
    if(max != -1) {
        myMax = 'max="' + max + '"';
    }
    return '<div class="grid-item"><label for="'+ newID +'">'+ myLabel +'</label></div><div class="grid-item"><input type="number" id="'+ newID +'" name="'+ newID + myStep +' min="' + min + '" '+ myMax +' onkeypress="limit(this);" value="'+ value +'" '+ myReq +'></div>';
}

// limit(element) gets called by number fields to try preventing users from entering more than 45 numbers.

function limit(element)
{
    let max_chars = 45;

    if(element.value.length > max_chars) {
        element.value = element.value.substr(0, max_chars);
    }
}

/**
 * Gets user selected keywords.
 * @param {HTMLElement} wiio 
 */

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

/**
 * Gets the HTML page contents for needed pages.
 * @param {Number} num 
 * @returns 
 */
function getPage(num) {
    if(num === 1) {
        if(!isProject) {
            return '<div class="grid-container">' + getTextField('Promo Title<br>No special characters<br>(i.e. "#<>/\\$+%!`*\'|{}?=:@)', 'promo', userData[0].promo_title, true) +
            '<div class="grid-item"><label for="promo-type">Type of Promo<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="promo-type" id="promo-type" title="Promo" required><option value="" selected>-Select-</option><option value="on-going">On-going</option><option value="letter">Letter</option><option value="soq">SOQ</option><option value="ProPri">Proposal-Prime</option><option value="ProSub">Proposal-Sub</option></select></div>'+
            '<div class="grid-item"><label for="projMgr">Project Manager<span class="astrick">*</span></label></div>'+
            '<div class="grid-item" id="projFiller">Loading managers...</div>'+
            '<div class="grid-item"><label for="qaqc">QA QC Person<span class="astrick">*</span></label></div>'+
            '<div class="grid-item" id="qaqcFill">Loading QA QC people...</div>'+
            '<div class="grid-item"><label for="Team">Team Members<span class="astrick">*</span><br/>(Select at least one)</label><br/></div>'+
            '<div class="grid-item" id="help"><div class="column" id="emplCol">Loading team members...</div></div>'+
            '<div class="grid-item"><label for="start">Start Date<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><input type="date" id="start" value="start" required></div>'+
            '<div class="grid-item"><label for="end">Close Date<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><input type="date" id="end" value="end" required></div>'
            +'</div>';
        }
        else if(isBillingGroup) {
            return '<div class="grid-container">'+
            '<div class="grid-item"><label for="groupName">Billing Group Name<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><input type="text" id="newBillName" maxlength="255" required/></div>'+
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
            '</div>';
        }
        return '<div class="grid-container">' + getTextField((isBillingGroup?"Billing Group":"Project")+' Title<br>No special characters<br>(i.e. "#<>/\\$+%!`*\'|{}?=:@)', 'promo', ((isBillingGroup)?userData[0].group_name:userData[0].project_title), true) +
            '<div class="grid-item"><label for="projMgr">Project Manager<span class="astrick">*</span></label></div>'+
            '<div class="grid-item" id="projFiller">Loading managers...</div>'+
            '<div class="grid-item"><label for="qaqc">QA QC Person<span class="astrick">*</span></label></div>'+
            '<div class="grid-item" id="qaqcFill">Loading QA QC people...</div>'+
            '<div class="grid-item"><label for="Team">Team Members<span class="astrick">*</span><br/>(Select at least one)</label><br/></div>'+
            '<div class="grid-item" id="help"><div class="column" id="emplCol">Loading team members...</div></div>'+
            '<div class="grid-item"><label for="start">Start Date<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><input type="date" id="start" value="start" required></div>'+
            '<div class="grid-item"><label for="end">End Date<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><input type="date" id="end" value="end" required></div>'
            +'</div>';
    }
    else if(num === 2) {
        return '<div class="grid-container">'+ getTextField('Project Street Address', 'LocDesc', ((isProject)?userData[0].project_location:((isBillingGroup)?userData[0].group_location:userData[0].promo_location)), true) +
        getNumberField('Project Latitude<br/>(i.e. 40.868928)', 'lat', userData[0].latitude, -1, -90, 90, true) +
        getNumberField('Project Longitude<br/>(i.e. -123.988061)', 'long', userData[0].longitude, -1, -90, 90, true)
        + '<div class="grid-item"><label for="key">Project Keywords<span class="astrick">*</span><br/>(Must select at least one keyword and/or add an extra keyword)</label></div>'+
        '<div class="grid-item"><div class="searchable" id="searchable"><label>Search Keywords: </label><input type="text" id="search" onkeyup="searchKeywords(this)"></div><div class = "column" id="keywords">Getting keywords...</div><br/><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey1" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey2" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey3" name="Otherkey" title="Otherkey" maxlength="255"></div>'
        +'</div>';
    }
    else if(num === 3) {
        if(isProject && !isBillingGroup) {
            return '<div class="grid-container">'+
            '<div class="grid-item"><label for="office">SHN Office<span class="astrick">*</span></label></div><div class="grid-item"><select name="office" id="office" title="Office Location" required><option value="">-Select-</option><option value="0">Eureka</option><option value="1">Arcata</option><option value="2">Klamath Falls</option><option value="4">Willits</option><option value="5">Redding</option><option value="6">Coos Bay</option><option value="9">Corporate</option></select></div>'+
            '<div class="grid-item"><label for="service">Service Area<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="service" id="service" title="Service Area" required><option value="0" selected>-Select-</option><option value="Civil">Civil</option><option value="Environmental">Environmental</option><option value="Geology">Geology</option><option value="Planning/Permitting">Planning/Permitting</option><option value="Survey">Survey</option></select></div>' +
            getNumberField('Total Contract', 'contract', 'contract', 1, 0, -1, true) +
            '<div class="grid-item"><label for="projExempt">Is this project exempt from having a Service Agreement?<span class="astrick">*</span></label></div><div class="grid-item"><input type="radio" name="projExempt" id="yesAgreement" value="Yes" title="projExempt" onchange="expandWhy()">Yes<input type="radio" name="projExempt" value="No" title="projExempt" onchange="expandWhy()" checked>No<div id="justWhy"></div></div>'+
            '<div class="grid-item"><label for="retainer">Retainer<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="retainer" id="retainer" title="retainer" onchange="customAmount()" required><option value="0">-Select-</option><option value="Enter Amount">Enter Amount:</option><option value="Existing Client">Existing Client No Issues</option><option value="Exempt Public Client">Exempt Public Client</option><option value="Waived by X">Waived by X (Senior Personnel select)</option></select><p id="custAmount"></p></div>'+
            '<div class="grid-item"><label for="code">Profile Code<span class="astrick">*</span></label></div><div class="grid-item" id="codeFill">Loading profile codes...</div>'
            +'</div>';
        }
        else if(isBillingGroup) {
            return '<div class="grid-container">' +
            '<div class="grid-item"><label for="code">Profile Code<span class="astrick">*</span></label></div><div class="grid-item" id="codeFill">Loading profile codes...</div>'+
            '<div class="grid-item"><label for="retainer">Retainer<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="retainer" id="retainer" title="retainer" onchange="customAmount()" required><option value="0">-Select-</option><option value="Enter Amount">Enter Amount:</option><option value="Existing Client">Existing Client No Issues</option><option value="Exempt Public Client">Exempt Public Client</option><option value="Waived by X">Waived by X (Senior Personnel select)</option></select><p id="custAmount"></p></div>'+
            '<div class="grid-item"><label for="service">Service Area</label></div>'+
            '<div class="grid-item"><select name="service" id="service" title="Service Area"><option value="0" selected>-Select-</option><option value="Civil">Civil</option><option value="Environmental">Environmental</option><option value="Geology">Geology</option><option value="Planning/Permitting">Planning/Permitting</option><option value="Survey">Survey</option></select></div>' +
            '<div class="grid-item"><label for="contactType">Contract Type<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="contactType" id="contactType" title="contactType" required><option value="0">-Select-</option><option value="1">1 – Cost Plus (Time and Expenses)</option><option value="2">2 – Cost Plus to a Maximum</option><option value="3">3 – Fixed Fee (Lump Sum)</option><option value="10">10 – Promo (Non-Billable)</option></select></div>'+
            getNumberField('Total Contract', 'contract', 'contract', 1, 0, -1, false) +
            '<div class="grid-item"><label for="invoiceFormat">Invoice Format</label></div><div class="grid-item"><select name="invoiceFormat" id="invoiceFormat" title="invoiceFormat"><option value="A">Emp. Name, Dates, Hrs, and Billing Rates</option><option value="B" selected>Emp. Name, Hrs, and Billing Rates (No Dates)</option><option value="C">Emp. Name, Dates, Hrs, Billing Rates, Phase, and Task</option></select></div>'+
            getTextField('Client Contract/PO #', 'PO', userData[0].client_contract_PO, false) +
            '<div class="grid-item"><label for="OutMark">Outside Markup<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><input type="number" id="OutMark" name="OutMark" step="1" min="0" max="100" value="15" onkeypress="limit(this);" required>%</input></div>'+
            '<div class="grid-item"><label for="wage">Prevailing Wage</label></div><div class="grid-item"><select name="wage" id="wage" title="wage" onchange="agentBruh();" required><option value="1">Yes</option><option value="0" selected>No</option></select><div id="agent"></div></div>'+
            '<div class="grid-item"><label for="billInst">Special Billing Instructions</label></div><div class="grid-item"><textarea id="billInst" name="billInst" rows="5" cols="50" maxlength="200"></textarea></div>'+
            '<div class="grid-item"><label for="binder">Binder Size</label></div><div class="grid-item"><select name="binder" id="binder" title="Binder Size"><option value="NULL" selected>N/A</option><option value="0.5">1/2 Inch</option><option value="1">1 Inch</option><option value="1.5">1.5 inches</option><option value="2">2 inches</option><option value="3">3 inches</option></select></div>'+
            '<div class="grid-item"><label for="describe">Description of Services<span class="astrick">*</span><br>Search projects with similar descriptions <a href="search.html" target="_blank">here</a>.</label></div><div class="grid-item"><textarea id="describe" name="describe" rows="5" cols="50" maxlength="63999" required></textarea></div>' +
            '</div>';
        }
        return '<div class="grid-container">'+
        '<div class="grid-item"><label for="office">SHN Office<span class="astrick">*</span></label></div><div class="grid-item"><select name="office" id="office" title="Office Location" required><option value="-1" selected>-Select-</option><option value="0">Eureka</option><option value="1">Arcata</option><option value="2">Klamath Falls</option><option value="4">Willits</option><option value="5">Redding</option><option value="6">Coos Bay</option><option value="9">Corporate</option></select></div>'+
        '<div class="grid-item"><label for="service">Service Area<span class="astrick">*</span></label></div>'+
        '<div class="grid-item"><select name="service" id="service" title="Service Area" required><option value="0" selected>-Select-</option><option value="Civil">Civil</option><option value="Environmental">Environmental</option><option value="Geology">Geology</option><option value="Planning/Permitting">Planning/Permitting</option><option value="Survey">Survey</option></select></div>' +
        '<div class="grid-item"><label for="code">Profile Code<span class="astrick">*</span></label></div><div class="grid-item" id="codeFill">Loading profile codes...</div>'
        +'</div>';
    }
    else if(num === 4) {
        if(isProject && !isBillingGroup) {
            return '<div class="grid-container">' +
            '<div class="grid-item"><label for="contactType">Contract Type<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="contactType" id="contactType" title="contactType" required><option value="0">-Select-</option><option value="1">1 – Cost Plus (Time and Expenses)</option><option value="2">2 – Cost Plus to a Maximum</option><option value="3">3 – Fixed Fee (Lump Sum)</option><option value="10">10 – Promo (Non-Billable)</option></select></div>'+
            '<div class="grid-item"><label for="invoiceFormat">Invoice Format</label></div>'+
            '<div class="grid-item"><select name="invoiceFormat" id="invoiceFormat" title="invoiceFormat"><option value="A">Emp. Name, Dates, Hrs, and Billing Rates</option><option value="B" selected>Emp. Name, Hrs, and Billing Rates (No Dates)</option><option value="C">Emp. Name, Dates, Hrs, Billing Rates, Phase, and Task</option></select></div>'+
            getTextField('Client Contract/PO #', 'PO', userData[0].client_contract_PO, true) +
            '<div class="grid-item"><label for="OutMark">Outside Markup<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><input type="number" id="OutMark" name="OutMark" step="1" min="0" max="100" value="15" onkeypress="limit(this);" required>%</input></div>'+
            '<div class="grid-item"><label for="wage">Prevailing Wage<span class="astrick">*</span></label></div><div class="grid-item"><select name="wage" id="wage" title="wage" onclick="agentBruh();" required><option value="1">Yes</option><option value="0" selected>No</option></select><div id="agent"></div></div>'+
            '<div class="grid-item"><label for="billInst">Special Billing Instructions</label></div><div class="grid-item"><textarea id="billInst" name="billInst" rows="5" cols="50" maxlength="200"></textarea></div>'+
            '<div class="grid-item"><label for="seeAlso">See Also</label></div><div class="grid-item"><textarea id="seeAlso" name="seeAlso" rows="5" cols="50" maxlength="200"></textarea></div>'+
            '<div class="grid-item"><label for="autocad">AutoCAD Job</label></div><div class="grid-item"><input type="radio" name="autocad" id="yesAuto" value="1" title="autocad"> Yes<input type="radio" name="autocad" value="0" title="autocad" checked> No </div>'+
            '<div class="grid-item"><label for="gis">GIS Job</label></div><div class="grid-item"><input type="radio" id="gis" name="gis" value="1" title="gis"> Yes<input type="radio" name="gis" value="0" title="gis" checked> No</div><div class="grid-item"><label for="ProjSpecs">Project Specifications</label></div><div class="grid-item"><input type="radio" id="ProjSpecs" name="ProjSpecs" title="ProjSpecs" placeholder="Project Specifications"> Yes <input type="radio" name="ProjSpecs" title="ProjSpecs" placeholder="Project Specifications" checked> No</div>'
            + '</div>';
        }
        else if(!isProject) {
            return '<div class="grid-container">' + getTextField('Client Company', 'clientComp', userData[0].client_company, true) + getTextField('Client Abbreviation', 'clientAbbr', userData[0].client_abbreviation, false) + 
            getTextField('Client First Name', 'cFirst', userData[0].first_name, true) + getTextField('Client Last Name', 'cLast', userData[0].last_name, true) + 
            '<div class="grid-item"><label for="relation">Client Relationship</label></div><div class="grid-item"><select name="relation" id="relation" title="Client Relationship"><option value="current">on-going</option><option value="past">past/former</option><option value="none" selected>none or distant</option></select></div>'+
            getTextField('Title', 'title', userData[0].job_title, false) + getTextField("Address 1", 'addy1', userData[0].address1, true) + getTextField('Address 2', 'addy2', userData[0].address2, false) + 
            getTextField('City', 'city', userData[0].city, true) + '<div class="grid-item"><label for="state">State<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="state" id="state" size="1" required><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA" selected="selected">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="DC">Dist of Columbia</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option></select></div>'+
            '<div class="grid-item"><Label for="zip">Zip Code<span class="astrick">*</span></div><div class="grid-item"><input type="text" id="zip" name="zip" maxlength="20" required></div>' +
            '<div class="grid-item"><label for="WP">Work Phone<span class="astrick">*</span></label></div><div class="grid-item"><input type="tel" id="WP" name="WP" maxlength="20" required></div>'+
            '<div class="grid-item"><label for="HP">Home Phone</label></div><div class="grid-item"><input type="tel" id="HP" name="HP" maxlength="20"></div>'+
            '<div class="grid-item"><label for="cell">Cell</label></div><div class="grid-item"><input type="tel" id="cell" name="cell" maxlength="20"></div>'+
            '<div class="grid-item"><label for="fax">Fax</label></div><div class="grid-item"><input type="tel" id="fax" name="fax" maxlength="20"></div>'+
            '<div class="grid-item"><label for="email">Email<span class="astrick">*</span></label></div><div class="grid-item"><input type="email" id="email" name="email" maxlength="75" required></div>'
            + '</div>';
        }
        else {
            let formatStartDate = new Date(userData[0].start_date)
            formatStartDate = ((formatStartDate.getMonth() + 1) + '-' + formatStartDate.getDate() + '-' + formatStartDate.getFullYear()).toString();
            let formatCloseDate = new Date(userData[0].close_date)
            formatCloseDate = ((formatCloseDate.getMonth() + 1) + '-' + formatCloseDate.getDate() + '-' + formatCloseDate.getFullYear()).toString();

            let autoCadName = 'no';
            if(userData[0].autoCAD == 1) {
                autoCadName = 'yes';
            }
            let gisName = 'no';
            if(userData[0].GIS == 1) {
                gisName = 'yes';
            }

            let formatMem = '';
            let formatKeys = '';
            for(let names of memNames) {
                formatMem += names + '<br>';
            }
            for(let keys of keyNames) {
                formatKeys += keys + '<br>';
            }

            let breakedDesc = userData[0].description_service.replaceAll('\n', '<br>');
            let waiver = ((userData[0].retainer == 'Waived by X') ? 'Waived by ' + userData[0].waived_by:(userData[0].retainer == 'Enter Amount'?"$"+userData[0].retainer_paid:userData[0].retainer));

            return '<div class="grid-container">' +
            '<div class="grid-item">Billing Name' + '</div>'
            + '<div class="grid-item">' + userData[0].group_name + '</div>'+
            '<div class="grid-item">Billing Number' + '</div>'
            + '<div class="grid-item">' + userData[0].group_number + '</div>'+
            '<div class="grid-item">Project Manager' + '</div>'
            + '<div class="grid-item">' + userData[0].last + ', ' + userData[0].first + '</div>'+
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
            + '<div class="grid-item">' + userData[0].group_location + '</div>'+
            '<div class="grid-item">Project Latitude' + '</div>'
            + '<div class="grid-item">' + userData[0].latitude + '</div>'+
            '<div class="grid-item">Project Longitude' + '</div>'
            + '<div class="grid-item">' + userData[0].longitude + '</div>'+
            '<div class="grid-item">Project Keywords' + '</div>'
            + '<div class="grid-item">' + formatKeys + '</div>'+
            '<div class="grid-item">Other Keywords' + '</div>'
            + '<div class="grid-item">' + otherKeys + '</div>'+
            '<div class="grid-item">Profile Code' + '</div>'
            + '<div class="grid-item">' + profCodeName + '</div>'+
            '<div class="grid-item">Contract Type' + '</div>'
            + '<div class="grid-item">' + contactTypeName + '</div>'+
            '<div class="grid-item">Service Area' + '</div>'
            + '<div class="grid-item">' + userData[0].service_area + '</div>'+
            '<div class="grid-item">Total Contract' + '</div>'
            + '<div class="grid-item">' + userData[0].total_contract + '</div>'+
            '<div class="grid-item">Invoice Format' + '</div>'
            + '<div class="grid-item">' + invoiceName + '</div>'+ // FIX VARIABLE
            '<div class="grid-item">Retainer' + '</div>'
            + '<div class="grid-item">' + waiver + '</div>'+
            '<div class="grid-item">Client Contract/PO #' + '</div>'
            + '<div class="grid-item">' + userData[0].client_contract_PO + '</div>'+
            '<div class="grid-item">Outside Markup' + '</div>'
            + '<div class="grid-item">' + userData[0].outside_markup + '</div>'+
            '<div class="grid-item">Prevailige Wage' + '</div>'
            + '<div class="grid-item">' + (userData[0].prevailing_wage == 1?"Yes":"No") + '</div>'+
            '<div class="grid-item">Agency' + '</div>'
            + '<div class="grid-item">' + (userData[0].prevailing_wage == 1?userData[0].agency_name:"N/A") + '</div>'+
            '<div class="grid-item">Special Billing Instructions' + '</div>'
            + '<div class="grid-item">' + userData[0].special_billing_instructions + '</div>'+
            '<div class="grid-item">AutoCAD Job' + '</div>'
            + '<div class="grid-item">' + autoCadName + '</div>'+
            '<div class="grid-item">GIS Job' + '</div>'
            + '<div class="grid-item">' + gisName + '</div>'+
            '<div class="grid-item">Binder Size' + '</div>'
            + '<div class="grid-item">' + (userData[0].binder_size == "NULL"?"N/A":userData[0].binder_size) + '</div>'+
            '<div class="grid-item">Description of Services' + '</div>'
            + '<div class="grid-item">' + breakedDesc + '</div>'+
            '</div>';
        }
    }
    else if(num === 5) {
        if(isProject) {
            return '<div class="grid-container">' + getTextField('Client Company', 'clientComp', userData[0].client_company, true) + 
            '<div class="grid-item"><label for="mail">Mail Lists</label></div><div class="grid-item"><input type="checkbox" id="openHouse" name="mail" title="openHouse" placeholder="Open House"> Open House<input type="checkbox" id="christmas" name="mail" title="christmas" placeholder="Christmas"> Christmas</div>' +
            getTextField('Client Abbreviation', 'clientAbbr', userData[0].client_abbreviation, false) + 
            getTextField('Client First Name', 'cFirst', userData[0].first_name, true) + getTextField('Client Last Name', 'cLast', userData[0].last_name, true) + 
            '<div class="grid-item"><label for="relation">Client Relationship</label></div><div class="grid-item"><select name="relation" id="relation" title="Client Relationship"><option value="current">on-going</option><option value="past">past/former</option><option value="none" selected>none or distant</option></select></div>'+
            getTextField('Title', 'title', userData[0].job_title, false) + getTextField("Address 1", 'addy1', userData[0].address1, true) + getTextField('Address 2', 'addy2', userData[0].address2, false) + 
            getTextField('City', 'city', userData[0].city, true) + '<div class="grid-item"><label for="state">State<span class="astrick">*</span></label></div>'+
            '<div class="grid-item"><select name="state" id="state" size="1" required><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA" selected="selected">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="DC">Dist of Columbia</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option></select></div>'+
            '<div class="grid-item"><Label for="zip">Zip Code<span class="astrick">*</span></div><div class="grid-item"><input type="text" id="zip" name="zip" maxlength="20" required></div>' +
            '<div class="grid-item"><label for="WP">Work Phone<span class="astrick">*</span></label></div><div class="grid-item"><input type="tel" id="WP" name="WP" maxlength="20" required></div>'+
            '<div class="grid-item"><label for="HP">Home Phone</label></div><div class="grid-item"><input type="tel" id="HP" name="HP" maxlength="20"></div>'+
            '<div class="grid-item"><label for="cell">Cell</label></div><div class="grid-item"><input type="tel" id="cell" name="cell" maxlength="20"></div>'+
            '<div class="grid-item"><label for="fax">Fax</label></div><div class="grid-item"><input type="tel" id="fax" name="fax" maxlength="20"></div>'+
            '<div class="grid-item"><label for="email">Email<span class="astrick">*</span></label></div><div class="grid-item"><input type="email" id="email" name="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" maxlength="75" required></div>'
            + '</div>';
        }
        return '<div class="grid-container">' +
        '<div class="grid-item"><label for="binder">Binder Size</label></div><div class="grid-item"><select name="binder" id="binder" title="Binder Size"><option value="NULL" selected>N/A</option><option value="0.5">1/2 Inch</option><option value="1">1 Inch</option><option value="1.5">1.5 inches</option><option value="2">2 inches</option><option value="3">3 inches</option></select></div>'+
        '<div class="grid-item"><label for="describe">Description of Services<span class="astrick">*</span><br>Search projects with similar descriptions <a href="search_demo.html" target="_blank">here</a>.</label></div><div class="grid-item"><textarea id="describe" name="describe" rows="5" cols="50" maxlength="63999" required></textarea></div>'
        +'</div>';
    }
    else if(num === 6) {
        if(isProject) {
            return '<div class="grid-container">' +
            '<div class="grid-item"><label for="binder">Binder Size</label></div><div class="grid-item"><select name="binder" id="binder" title="Binder Size"><option value="NULL" selected>N/A</option><option value="0.5">1/2 Inch</option><option value="1">1 Inch</option><option value="1.5">1.5 inches</option><option value="2">2 inches</option><option value="3">3 inches</option></select></div>'+
            '<div class="grid-item"><label for="bindLoc">Binder Location</label></div><div class="grid-item"><input type="text" id="bindLoc" name="bindLoc"></div>' +
            '<div class="grid-item"><label for="describe">Description of Services<span class="astrick">*</span><br>Search projects with similar descriptions <a href="search.html" target="_blank">here</a>.</label></div><div class="grid-item"><textarea id="describe" name="describe" rows="5" cols="50" maxlength="63999" required></textarea></div></div>';
        }
        // Else review page for promos.
        let formatMem = '';
        let formatKeys = '';
        for(let names of memNames) {
            formatMem += names + '<br>';
        }
        for(let keys of keyNames) {
            formatKeys += keys + '<br>';
        }

        let formatStartDate = new Date(userData[0].start_date)
        formatStartDate = ((formatStartDate.getMonth() + 1) + '-' + formatStartDate.getDate() + '-' + formatStartDate.getFullYear()).toString();
        let formatCloseDate = new Date(userData[0].close_date)
        formatCloseDate = ((formatCloseDate.getMonth() + 1) + '-' + formatCloseDate.getDate() + '-' + formatCloseDate.getFullYear()).toString();

        var shnOffice = (() => {
            if(userData[0].SHNOffice_ID == 2) {
                return "Klamath Falls";
            }
            else if(userData[0].SHNOffice_ID == 4 || userData[0].SHNOffice_ID == 7) {
                return "Willits";
            }
            else if(userData[0].SHNOffice_ID == 5) {
                return "Redding";
            }
            else if(userData[0].SHNOffice_ID == 6) {
                return "Coos Bay";
            }
            return "Eureka";
        })();

        return '<div class="grid-container">' +
        '<div class="grid-item">Promo Title' + '</div>'
        + '<div class="grid-item">' + userData[0].promo_title + '</div>'+
        '<div class="grid-item">Type of Promo' + '</div>'
        + '<div class="grid-item">' + userData[0].promo_type + '</div>'+
        '<div class="grid-item">Project Manager' + '</div>'
        + '<div class="grid-item">' + mgrName + '</div>'+
        '<div class="grid-item">QAQC Person' + '</div>'
        + '<div class="grid-item">' + qaqcName + '</div>'+
        '<div class="grid-item">Team Members' + '</div>'
        + '<div class="grid-item">' + formatMem + '</div>'+
        '<div class="grid-item">Start Date' + '</div>'
        + '<div class="grid-item">' + formatStartDate + '</div>'+
        '<div class="grid-item">Close Date' + '</div>'
        + '<div class="grid-item">' + formatCloseDate + '</div>'+
        '<div class="grid-item">Project Location Descriptor' + '</div>'
        + '<div class="grid-item">' + userData[0].promo_location + '</div>'+
        '<div class="grid-item">Project Latitude' + '</div>'
        + '<div class="grid-item">' + userData[0].latitude + '</div>'+
        '<div class="grid-item">Project Longitude' + '</div>'
        + '<div class="grid-item">' + userData[0].longitude + '</div>'+
        '<div class="grid-item">Project Keywords' + '</div>'
        + '<div class="grid-item">' + formatKeys + '</div>'+
        '<div class="grid-item">Other Keywords' + '</div>'
        + '<div class="grid-item">' + otherKeys + '</div>'+
        '<div class="grid-item">SHN Office' + '</div>'
        + '<div class="grid-item">' + shnOffice + '</div>'+
        '<div class="grid-item">Service Area' + '</div>'
        + '<div class="grid-item">' + userData[0].service_area + '</div>'+
        '<div class="grid-item">Profile Code' + '</div>'
        + '<div class="grid-item">' + profCodeName + '</div>'+
        '<div class="grid-item">Client Company' + '</div>'
        + '<div class="grid-item">' + userData[0].client_company + '</div>'+
        '<div class="grid-item">Client Abbreviation' + '</div>'
        + '<div class="grid-item">' + userData[0].client_abbreviation + '</div>'+
        '<div class="grid-item">Client First Name' + '</div>'
        + '<div class="grid-item">' + userData[0].first_name + '</div>'+
        '<div class="grid-item">Client Last Name' + '</div>'
        + '<div class="grid-item">' + userData[0].last_name + '</div>'+
        '<div class="grid-item">Client Relationship' + '</div>'
        + '<div class="grid-item">' + userData[0].relationship + '</div>'+
        '<div class="grid-item">Title' + '</div>'
        + '<div class="grid-item">' + userData[0].job_title + '</div>'+
        '<div class="grid-item">Address 1' + '</div>'
        + '<div class="grid-item">' + userData[0].address1 + '</div>'+
        '<div class="grid-item">Address 2' + '</div>'
        + '<div class="grid-item">' + userData[0].address2 + '</div>'+
        '<div class="grid-item">City' + '</div>'
        + '<div class="grid-item">' + userData[0].city + '</div>'+
        '<div class="grid-item">State' + '</div>'
        + '<div class="grid-item">' + userData[0].state + '</div>'+
        '<div class="grid-item">Zip' + '</div>'
        + '<div class="grid-item">' + userData[0].zip_code + '</div>'+
        '<div class="grid-item">Work Phone' + '</div>'
        + '<div class="grid-item">' + userData[0].work_phone + '</div>'+
        '<div class="grid-item">Home Phone' + '</div>'
        + '<div class="grid-item">' + userData[0].home_phone + '</div>'+
        '<div class="grid-item">Cell Phone' + '</div>'
        + '<div class="grid-item">' + userData[0].cell + '</div>'+
        '<div class="grid-item">Fax' + '</div>'
        + '<div class="grid-item">' + userData[0].fax + '</div>'+
        '<div class="grid-item">Email' + '</div>'
        + '<div class="grid-item">' + userData[0].email + '</div>'+
        '<div class="grid-item">Binder Size' + '</div>'
        + '<div class="grid-item">' + (userData[0].binder_size == null || userData[0].binder_size == 'NULL'?'N/A':userData[0].binder_size + ' inch') + '</div>'+
        '<div class="grid-item">Description of Services' + '</div>'
        + '<div class="grid-item">' + userData[0].description_service.replaceAll('\n', '<br>') + '</div></div>';
    }
    else { // Review page for Projects.

        let formatStartDate = new Date(userData[0].start_date)
        formatStartDate = ((formatStartDate.getMonth() + 1) + '-' + formatStartDate.getDate() + '-' + formatStartDate.getFullYear()).toString();
        let formatCloseDate = new Date(userData[0].close_date)
        formatCloseDate = ((formatCloseDate.getMonth() + 1) + '-' + formatCloseDate.getDate() + '-' + formatCloseDate.getFullYear()).toString();

        var shnOffice = (() => {
            if(userData[0].SHNOffice_ID == 2) {
                return "Klamath Falls";
            }
            else if(userData[0].SHNOffice_ID == 4 || userData[0].SHNOffice_ID == 7) {
                return "Willits";
            }
            else if(userData[0].SHNOffice_ID == 5) {
                return "Redding";
            }
            else if(userData[0].SHNOffice_ID == 6) {
                return "Coos Bay";
            }
            return "Eureka";
        })();

        let formatMem = '';
        let formatKeys = '';
        for(let names of memNames) {
            formatMem += names + '<br>';
        }
        for(let keys of keyNames) {
            formatKeys += keys + '<br>';
        }

        let mailString = '';
        if(openHouse && xmas) {
            mailString = 'Open House || Christmas';
        }
        else if(openHouse) {
            mailString = 'Open House';
        }
        else if(xmas){
            mailString = 'Christmas';
        }
        else {
            mailString = 'None';
        }

        let speccy = 'no';
        if(userData[0].project_specifications == 1) {
            speccy = 'yes'
        }

        let ServiceAgreement = 'No';
        if(userData[0].exempt_agreement == 1) {
            ServiceAgreement = 'Yes';
        }
        else {
            Explanation = 'NA';
        }

        let waiver = (userData[0].retainer == 'Waived by X') ? 'Waived by ' + userData[0].waived_by:(userData[0].retainer == "Enter Amount"?userData[0].retainer_paid:userData[0].retainer);

        return '<div class="grid-container">' +
        '<div class="grid-item">Project Title' + '</div>'
        + '<div class="grid-item">' + userData[0].project_title + '</div>'+
        '<div class="grid-item">Project Manager' + '</div>'
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
        + '<div class="grid-item">' + userData[0].project_location + '</div>'+
        '<div class="grid-item">Project Latitude' + '</div>'
        + '<div class="grid-item">' + userData[0].latitude + '</div>'+
        '<div class="grid-item">Project Longitude' + '</div>'
        + '<div class="grid-item">' + userData[0].longitude + '</div>'+
        '<div class="grid-item">Project Keywords' + '</div>'
        + '<div class="grid-item">' + formatKeys + '</div>'+
        '<div class="grid-item">Other Keywords' + '</div>'
        + '<div class="grid-item">' + otherKeys + '</div>'+
        '<div class="grid-item">SHN Office' + '</div>'
        + '<div class="grid-item">' + shnOffice + '</div>'+
        '<div class="grid-item">Service Area' + '</div>'
        + '<div class="grid-item">' + userData[0].service_area + '</div>'+
        '<div class="grid-item">Total Contract' + '</div>'
        + '<div class="grid-item">' + userData[0].total_contract + '</div>'+
        '<div class="grid-item">Exempt from Service Agreement?' + '</div>'
        + '<div class="grid-item">' + (userData[0].exempt_agreement == 1?"Yes":"No") + '</div>'+
        '<div class="grid-item">If yes, why?' + '</div>'
        + '<div class="grid-item">' + (userData[0].why == null || userData[0].why == 'NULL'?'N/A':userData[0].why) + '</div>'+
        '<div class="grid-item">Retainer' + '</div>'
        + '<div class="grid-item">' + waiver + '</div>'+
        '<div class="grid-item">Profile Code' + '</div>'
        + '<div class="grid-item">' + profCodeName + '</div>'+
        '<div class="grid-item">Contract Type' + '</div>'
        + '<div class="grid-item">' + contactTypeName + '</div>'+
        '<div class="grid-item">Invoice Format' + '</div>'
        + '<div class="grid-item">' + userData[0].invoice_format + '</div>'+
        '<div class="grid-item">Client Contract/PO #' + '</div>'
        + '<div class="grid-item">' + userData[0].client_contract_PO + '</div>'+
        '<div class="grid-item">Outside Markup' + '</div>'
        + '<div class="grid-item">' + userData[0].outside_markup + '</div>'+
        '<div class="grid-item">Prevailige Wage' + '</div>'
        + '<div class="grid-item">' + (userData[0].prevailing_wage == 1?"Yes":"No") + '</div>'+
        '<div class="grid-item">Special Billing Instructions' + '</div>'
        + '<div class="grid-item">' + userData[0].special_billing_instructions + '</div>'+
        '<div class="grid-item">See Also' + '</div>'
        + '<div class="grid-item">' + userData[0].see_also + '</div>'+
        '<div class="grid-item">AutoCAD Job' + '</div>'
        + '<div class="grid-item">' + (userData[0].autoCAD == 1?"Yes":"No") + '</div>'+
        '<div class="grid-item">GIS Job' + '</div>'
        + '<div class="grid-item">' + (userData[0].GIS == 1?"Yes":"No") + '</div>'+
        '<div class="grid-item">Project Specifications' + '</div>'
        + '<div class="grid-item">' + speccy + '</div>'+
        '<div class="grid-item">Client Company' + '</div>'
        + '<div class="grid-item">' + userData[0].client_company + '</div>'+
        '<div class="grid-item">Mail Lists' + '</div>'
        + '<div class="grid-item">' + mailString + '</div>'+
        '<div class="grid-item">Client Abbreviation' + '</div>'
        + '<div class="grid-item">' + userData[0].client_abbreviation + '</div>'+
        '<div class="grid-item">Client First Name' + '</div>'
        + '<div class="grid-item">' + userData[0].first_name + '</div>'+
        '<div class="grid-item">Client Last Name' + '</div>'
        + '<div class="grid-item">' + userData[0].last_name + '</div>'+
        '<div class="grid-item">Client Relationship' + '</div>'
        + '<div class="grid-item">' + clientRelation + '</div>'+
        '<div class="grid-item">Title' + '</div>'
        + '<div class="grid-item">' + userData[0].job_title + '</div>'+
        '<div class="grid-item">Address 1' + '</div>'
        + '<div class="grid-item">' + userData[0].address1 + '</div>'+
        '<div class="grid-item">Address 2' + '</div>'
        + '<div class="grid-item">' + userData[0].address2 + '</div>'+
        '<div class="grid-item">City' + '</div>'
        + '<div class="grid-item">' + userData[0].city + '</div>'+
        '<div class="grid-item">State' + '</div>'
        + '<div class="grid-item">' + userData[0].state + '</div>'+
        '<div class="grid-item">Zip' + '</div>'
        + '<div class="grid-item">' + userData[0].zip + '</div>'+
        '<div class="grid-item">Work Phone' + '</div>'
        + '<div class="grid-item">' + userData[0].work_phone + '</div>'+
        '<div class="grid-item">Home Phone' + '</div>'
        + '<div class="grid-item">' + userData[0].home_phone + '</div>'+
        '<div class="grid-item">Cell' + '</div>'
        + '<div class="grid-item">' + userData[0].cell + '</div>'+
        '<div class="grid-item">Fax' + '</div>'
        + '<div class="grid-item">' + userData[0].fax + '</div>'+
        '<div class="grid-item">Email' + '</div>'
        + '<div class="grid-item">' + userData[0].email + '</div>'+
        '<div class="grid-item">Binder Size' + '</div>'
        + '<div class="grid-item">' + (userData[0].binder_size == null || userData[0].binder_size == 'NULL'?'N/A':userData[0].binder_size + ' inch') + '</div>'+
        '<div class="grid-item">Binder Location' + '</div>'
        + '<div class="grid-item">' + userData[0].binder_location + '</div>'+
        '<div class="grid-item">Description of Services' + '</div>'
        + '<div class="grid-item">' + userData[0].description_service.replaceAll('\n', '<br>') + '</div>'+
        '</div>';
    }
}

/**
 * Used to connect to the server and get options.
 * @param {Number} num 
 */
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

            data.forEach((entry) => {
                // Create an option in every iteration.

                option = document.createElement("option");
                quackOpt = document.createElement("option");

                // Each option is assigned it's value using the employee ID, and its text is their last and first name.
                // If user is a project manager, they join the project manager list.

                if(entry.PM == 1) {
                    option.value = entry.ID;
                    option.text = entry.last + ", " + entry.first;
                    quackOpt.value = entry.ID;
                    quackOpt.text = entry.last + ", " + entry.first;

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
                    checkEmpl.innerHTML += getCheckbox('Team', data[jumpTo].ID, data[jumpTo].first + " " + data[jumpTo].last, data[jumpTo].last + ", " + data[jumpTo].first);
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
                    checkEmpl.innerHTML += getCheckbox('Team', data[jumpTo].ID, data[jumpTo].first + " " + data[jumpTo].last, data[jumpTo].last + ", " + data[jumpTo].first);
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

            fillAfterLoad(num);

        }).catch(error => { // If we can't connect to our server for whatever reason, we'll write an error mesage into our table.

            document.getElementById("projFiller").innerHTML = 'Oh no! SHN had a connection error!';
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

            // Object.entries(data).forEach((entry) => {
            //     // keyEl.innerHTML += getCheckbox('key', entry[1].ID, entry[1].Keyword, entry[1].Keyword);
            //     keyResult.push(entry[1].Keyword);
            //     keyIDMap.set(entry[1].Keyword, getCheckbox('key', entry[1].ID, entry[1].Keyword, entry[1].Keyword));
            // });

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

            fillAfterLoad(num);

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
                codeOpt.value = entry[1].ID;
                codeOpt.text = entry[1].Code + " - " + entry[1].Description;
                codeEl.appendChild(codeOpt);
            });

            // Now we clear the text in the cooresponding table container by using an empty string, and insert our dropdown.
            // In function page(1), the html displays "Loading profile codes..." by default to show that the information is getting fetched.

            document.getElementById('codeFill').innerHTML = '';
            document.getElementById('codeFill').appendChild(codeEl);
            fillAfterLoad(num);

            document.getElementById(codeEl.id).value = userData[0].profile_code_id;

        }).catch(error => { // If an error occurs with our connection to the server, we'll write an error mesage into our table.

            document.getElementById('codeFill').innerHTML = 'Oh no! Profile codes couldn\'t be retrieved!';

            // We write our real error to the console.

            if(!accessErr) {
                console.log(error);
            }
        });
    }
}

/**
 * Fills previous selects after the getUsers() function loads the needed form options.
 * @param {Number} currPage 
 */

function fillAfterLoad(currPage) {
    if(currPage == 1) {

        // Set previous or default values to fields.
        document.getElementById("qaqc").value = userData[0].qaqc_person_ID;
        document.getElementById("projMgr").value = (isProject && !isBillingGroup?userData[0].project_manager_ID:userData[0].manager_id);

        // Select all checkbox inputs to test which ones need to be checked.

        let prevSelects = document.querySelectorAll('input[name="Team"]');

        // For-loops to select the checkboxes from previous user selections, if any.
        // The loops tests checkboxes based on the checkbox IDs stored in variable teamMem.
        for(let memb of userData) {
            for(let selects of prevSelects) {
                if(memb.member_id == selects.id) {
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
    // else if(currPage == 3) {
        
    // }
}

/*
Function saveChoices(currPage) saves the user's selections.
It is often called by functions goBack() and reqField() so the user can see their results when they revisit previous pages.
*/

function saveChoices(currPage) {
    if(currPage == 2) {
        document.getElementById('search').value = '';
        searchKeywords(document.getElementById('search'));
        if(isProject && isBillingGroup) {
            userData[0].group_location = document.getElementById('LocDesc').value.trim();
        }
        else if(isProject) {
            userData[0].project_location = document.getElementById('LocDesc').value.trim();
        }
        else {
            userData[0].promo_location = document.getElementById('LocDesc').value.trim();
        }
        userData[0].latitude = document.getElementById('lat').value.trim();
        userData[0].longitude = document.getElementById('long').value.trim();
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
    else if(currPage == 3) {

        // Saves values into global variables.
        userData[0].service_area = document.getElementById('service').value;
        servName = (document.getElementById('service').value != '' && document.getElementById('service').value != -1 && document.querySelector('#service').options[document.getElementById("service").selectedIndex] != undefined)?document.querySelector('#service').options[document.getElementById("service").selectedIndex].text:'';
        userData[0].profile_code_id = document.getElementById('code').value;
        profCodeName = document.getElementById('code').options[document.getElementById("code").selectedIndex].text;

        if(isProject) {
            userData[0].total_contract = document.getElementById('contract').value;
            userData[0].retainer = document.getElementById('retainer').value;
            userData[0].retainer_paid = (document.getElementById('retainer').value == "Enter Amount")?document.getElementById('newAmount').value:null;
            userData[0].waived_by = (document.getElementById('retainer').value.includes("Waived by"))?document.getElementById('personnel').value:null;
            if(!isBillingGroup) {
                userData[0].SHNOffice_ID = document.getElementById("office").value;
                userData[0].exempt_agreement = (document.getElementById('yesAgreement').checked?1:0);
                ServAgree = document.getElementById('yesAgreement').checked;
                if(ServAgree) {
                    Explanation = document.getElementById('bruh').value.trim();
                    userData[0].why = document.getElementById('bruh').value.trim();
                }
            }
            else {
                userData[0].contract_ID = document.getElementById('contactType').value;
                contactTypeName = document.getElementById('contactType').options[document.getElementById("contactType").selectedIndex].text;
                userData[0].invoice_format = document.getElementById('invoiceFormat').value;
                invoiceName = document.getElementById('invoiceFormat').options[document.getElementById("invoiceFormat").selectedIndex].text;
                userData[0].client_contract_PO = document.getElementById('PO').value.trim();
                userData[0].outside_markup = document.getElementById('OutMark').value;
                userData[0].prevailing_wage = document.getElementById('wage').value;
                userData[0].agency_name = (document.getElementById('wage').value == '1')?document.getElementById('agency').value:"NULL";
                userData[0].special_billing_instructions = (document.getElementById('billInst').value.trim() == ''?"NULL":document.getElementById('billInst').value.trim());
                userData[0].binder_size = document.getElementById('binder').value;
                userData[0].description_service = ((typeof document.getElementById('describe').value == "string")?document.getElementById('describe').value.trim():document.getElementById('describe').value);
            }
            // if(document.getElementById('retainer').value == 'Enter Amount') {
            //     userData[0].retainer_paid = document.getElementById('newAmount').value;
            // }
            // else if(userData[0].RetainerPaid == 'Waived by X') {
            //     userData[0].RetainerPaid = "Waived by " + document.getElementById('personnel').value.trim();
            // }
        }
        else {
            userData[0].SHNOffice_ID = document.getElementById("office").value;
        }
        
    }
    else if(currPage == 4) {
        
        // Saves values into global variables.
        if(isProject && !isBillingGroup) {
            userData[0].contract_ID = document.getElementById('contactType').value;
            contactTypeName = document.getElementById('contactType').options[document.getElementById("contactType").selectedIndex].text;
            userData[0].invoice_format = document.getElementById("invoiceFormat").value;
            invoiceName = document.getElementById('invoiceFormat').options[document.getElementById("invoiceFormat").selectedIndex].text;
            userData[0].client_contract_PO = document.getElementById('PO').value.trim();
            userData[0].outside_markup = document.getElementById('OutMark').value;
            // outsideMarkupName = document.getElementById('OutMark').options[document.getElementById("OutMark").selectedIndex].text;
            userData[0].prevailing_wage = document.getElementById('wage').value;
            userData[0].agency_name = (document.getElementById('wage').value == '1')?document.getElementById('agency').value:"NULL";
            userData[0].special_billing_instructions = document.getElementById('billInst').value.trim();
            userData[0].see_also = document.getElementById('seeAlso').value.trim();
            userData[0].autoCAD = (document.getElementById('yesAuto').checked)?1:0;
            userData[0].GIS = (document.getElementById('gis').checked)?1:0;
            userData[0].project_specifications = (document.getElementById('ProjSpecs').checked)?1:0;
        }
        else if (!isBillingGroup) {
            userData[0].client_company = document.getElementById('clientComp').value.trim();
        // mailList = document.getElementById('mail').value;
            // openHouse = document.getElementById('openHouse').checked;
            // xmas = document.getElementById('christmas').checked;
            userData[0].client_abbreviation = document.getElementById('clientAbbr').value.trim();
            userData[0].first_name = document.getElementById('cFirst').value.trim();
            userData[0].last_name = document.getElementById('cLast').value.trim();
            userData[0].relationship = document.getElementById('relation').value;
            userData[0].title = document.getElementById('title').value.trim();
            userData[0].address1 = document.getElementById('addy1').value.trim();
            userData[0].address2 = document.getElementById('addy2').value.trim();
            userData[0].city = document.getElementById('city').value.trim();
            userData[0].state = document.getElementById('state').value;
            userData[0].zip = document.getElementById('zip').value.trim();
            userData[0].work_phone = document.getElementById('WP').value.trim();
            userData[0].home_phone = document.getElementById('HP').value.trim();
            userData[0].cell = document.getElementById('cell').value.trim();
            userData[0].fax = document.getElementById('fax').value.trim();
            userData[0].email = document.getElementById('email').value.trim();
        }
        // See if AutoCAD Job is selected to "Yes."  If so, save the value of the selected office.

        // if(autoCad) {
        //     ifYesWhichOffice = document.getElementById('yesOffice').value;
        //     officeName2 = document.getElementById('yesOffice').options[document.getElementById("yesOffice").selectedIndex].text;
        // }
        // else {
        //     ifYesWhichOffice = -1; // Value of "-Select-".
        //     officeName2 = '';
        // }
    }
    else if(currPage == 5) {

        // Saves values into global variables.

        if(isProject) {
            userData[0].client_company = document.getElementById('clientComp').value.trim();
        // mailList = document.getElementById('mail').value;
            openHouse = document.getElementById('openHouse').checked;
            xmas = document.getElementById('christmas').checked;
            userData[0].client_abbreviation = document.getElementById('clientAbbr').value.trim();
            userData[0].first_name = document.getElementById('cFirst').value.trim();
            userData[0].last_name = document.getElementById('cLast').value.trim();
            userData[0].relationship = document.getElementById('relation').value;
            userData[0].title = document.getElementById('title').value.trim();
            userData[0].address1 = document.getElementById('addy1').value.trim();
            userData[0].address2 = document.getElementById('addy2').value.trim();
            userData[0].city = document.getElementById('city').value.trim();
            userData[0].state = document.getElementById('state').value;
            userData[0].zip = document.getElementById('zip').value.trim();
            userData[0].work_phone = document.getElementById('WP').value.trim();
            userData[0].home_phone = document.getElementById('HP').value.trim();
            userData[0].cell = document.getElementById('cell').value.trim();
            userData[0].fax = document.getElementById('fax').value.trim();
            userData[0].email = document.getElementById('email').value.trim();
        }
        else {
            userData[0].binder_size = document.getElementById('binder').value;
            userData[0].description_service = document.getElementById('describe').value;
        }
    }
    else if(currPage == 6 && isProject) {

        // Saves values into global variables.
        userData[0].binder_size = document.getElementById('binder').value;
        userData[0].binder_location = document.getElementById('bindLoc').value;
        userData[0].description_service = document.getElementById('describe').value.trim();
    }
}

function isNum(num) {
    return (num == 0 || num == 1 || num == 2 || num == 3 || num == 4 || num == 5 || num == 6 || num == 7 || num == 8 || num == 9) ? true:false;
}

/**
 * Saves and validates user input.
 * On validation failure, an alert will be prompted to the user and the program exits.
 * On success, manager(currPage + 1) is called to go to the next page.
 * @param {Number} currPage 
 * @returns 
 */

function reqField(currPage) {
    // If-statements to determine the current page.
    if(currPage == 1) { // Evaluate page 1.

        // Saves values into global variables.

        if(isProject && !isBillingGroup) {
            userData[0].project_manager_ID = document.getElementById("projMgr").value;
            userData[0].project_title = document.getElementById('promo').value.trim();
        }
        else if(isBillingGroup) {
            userData[0].group_name = document.getElementById("newBillName").value;
            userData[0].manager_id = document.getElementById("projMgr").value;
        }
        else {
            userData[0].manager_id = document.getElementById("projMgr").value;
        }
        if(!isProject) {
            userData[0].promo_type = (isProject)?0:document.getElementById('promo-type').value;
        }
        userData[0].qaqc_person_ID = document.getElementById("qaqc").value;
        userData[0].start_date = document.getElementById('start').value;
        userData[0].close_date = document.getElementById('end').value;

        // mySelects to determine if number of checked boxes is more than 1.

        let mySelects = document.querySelectorAll('input[name="Team"]:checked');

        // Test variables for illegal inputs.
        if(isBillingGroup && userData[0].group_name.trim() == '') {
            alert("Invalid Billing group name.");
            return false;
        }

        if(userData[0].manager_id == 0 || userData[0].project_manager_ID == 0 || userData[0].qaqc_person_ID == 0 || userData[0].project_title == '' || mySelects.length <= 0 || userData[0].start_date == '' || userData[0].start_date == undefined || userData[0].close_date == '' || userData[0].close_date == undefined || userData[0].start_date > userData[0].close_date) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
        
        let title = (userData[0].hasOwnProperty("project_title")?userData[0].project_title:(userData[0].hasOwnProperty("promo_title")?userData[0].promo_title:userData[0].group_name));
        if(title.includes("#") || title.includes("<") || title.includes("$") || title.includes("+") || title.includes("%") || title.includes(">") || title.includes("!") || title.includes("`") || title.includes("*") || title.includes("'") || title.includes("|") || title.includes("{") || title.includes("?") || title.includes("\"") || title.includes("=") || title.includes("}") || title.includes("/") || title.includes(":") || title.includes("\\") || title.includes("@")) {
            alert("No special characters.  Please rename your project title.");
            return false;
        }

        if(title[title.length - 1] == '.') {
            alert("Please remove the period at the end of title.");
            return false;
        }

        // Success if we get here.
        // Empty teamMem variable and member name variable to insert user selections.

        teamMem = [];
        memNames = [];

        // Inserts new selections into teamMem.

        for(let selection of mySelects) {
            if(selection.checked){
                teamMem.push(selection.id);
                memNames.push(selection.placeholder);
            }
        }

        // get manager and qaqc person name.

        mgrName = document.getElementById("projMgr").options[document.getElementById("projMgr").selectedIndex].text;
        qaqcName = document.getElementById("qaqc").options[document.getElementById("qaqc").selectedIndex].text;
        // console.log("Manager: " + mgrName + "\nQAQC manager: " + qaqcName);
    }
    else if(currPage == 2) { // Evaluate page 2.

        // Saves values into global variables using saveChoices.

        saveChoices(2);

        // Test against user selections and fields to determine if values are valid.

        if(userData[0].project_location == '' || userData[0].promo_location == '' || userData[0].group_location == ''|| userData[0].latitude == '' || userData[0].longitude == '' || Projkeywords.length + otherKeys.length <= 0) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        // Check latitude.
        
        if(isNaN(userData[0].latitude)) {
            alert("Invalid latitude.");
            return false;
        }
        else if(Number(userData[0].latitude) > 90 || Number(userData[0].latitude) < -90) {
            alert("Keep latitude between 90 and -90.");
            return false;
        }

        // Check longitude.

        if(isNaN(userData[0].longitude)) {
            alert("Invalid longitude.");
            return false;
        }
        else if(Number(userData[0].longitude) < -180 || Number(userData[0].longitude) > 180) {
            alert("Keep longitude between 180 and -180.");
           return false;
        }

        // Success if we get here.

    }
    else if(currPage == 3) { // Evaluate page 3.

        // Save values into global variables using saveChoices().

        saveChoices(3);

        
        // Test the values of the other variables.

        if(userData[0].service_area == 0 || userData[0].service_area == undefined || userData[0].service_area == null || userData[0].profile_code_id == -1 || userData[0].profile_code_id == undefined || userData[0].profile_code_id == null) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
        if(isProject) {
            // If user selected "Yes" on the servide agreement field, then we test if the user also inputted text into the explanation field.

            if(!isBillingGroup) {
                if(userData[0].SHNOffice_ID == -1 || userData[0].SHNOffice_ID == null || userData[0].SHNOffice_ID == undefined || userData[0].SHNOffice_ID == '') {
                    alert("Please select an office.");
                    return false;
                }
                if(ServAgree && document.getElementById('bruh').value.trim() == '') { // If user didn't input anything, yell at them and return false.
                    alert("Please fill all required fields, and/or fix invalid fields.");
                    return false;
                }
                else if (!ServAgree) { // If "No" was selected, we empty our variable.
                    Explanation = '';
                    userData[0].why = null;
                }
            }
            if(userData[0].total_contract == '' || userData[0].total_contract < 0 || document.getElementById('retainer').value == 0 ) {
                alert("Please fill all required fields, and/or fix invalid fields.");
                return false;
            }
            if(userData[0].total_contract.length > 45) {
                alert("Keep total contract under 45 characters.");
                return false;
            }

            // Now test if "Enter Amount:" was selected.

            if(document.getElementById('retainer').value == "Enter Amount" && document.getElementById('newAmount').value == '') { // If user didn't input anything, yell at them and return false.
                alert("Please fill all required fields, and/or fix invalid fields.");
                return false;
            }
            else if(document.getElementById('retainer').value == 'Enter Amount' && document.getElementById('newAmount').value.length > 45) {
                alert("Can't have more than 45 characters.");
                return false;
            }
            else if(document.getElementById('retainer').value == 'Waived by X' && document.getElementById('personnel').value.trim() == '') {
                alert("Please enter personnel name.");
                return false;
            }

            // For checking billing groups.
            if(isBillingGroup) {
                if(userData[0].contract_ID == 0 || userData[0].outside_markup == '' || userData[0].outside_markup < 0 || userData[0].outside_markup > 100) {
                    alert("Please fix outside markup.");
                    return false;
                }
                if(userData[0].prevailing_wage != 0 && userData[0].prevailing_wage.trim() == '') {
                    alert("What's the prevailing wage?.");
                    return false;
                }
                else if(userData[0].prevailing_wage == 1 && (userData[0].agency_name == null || userData[0].agency_name == "NULL")) {
                    alert("Enter the agency name.");
                    return false;
                }
                if(userData[0].description_service == null || userData[0].description_service == '') {
                    alert("Fix your description of services.");
                    return false;
                }
            }
        }
        else {
            if(userData[0].SHNOffice_ID == -1 || userData[0].SHNOffice_ID == null || userData[0].SHNOffice_ID == undefined || userData[0].SHNOffice_ID == '') {
                alert("Please select an office.");
                return false;
            }
        }
    }
    else if(currPage == 4) { // Evaluate page 4.

        // Saves values into global variables using saveChoices().

        saveChoices(4);

        // Test against required user selections and fields to determine if values are valid.
        if(isProject) {
            if(userData[0].contract_ID == 0 || userData[0].client_contract_PO == '' || userData[0].outside_markup == '' || userData[0].outside_markup < 0 || userData[0].outside_markup > 100) {
                alert("Please fill all required fields, and/or fix invalid fields.");
                return false;
            }
    
            if(userData[0].client_contract_PO.length > 45 || userData[0].client_contract_PO.length > 45) {
                alert("Keep Client Contract/PO # and/or Outside Markup under 45 characters.");
                return false;
            }
            if(userData[0].prevailing_wage != 0 && userData[0].prevailing_wage.trim() == '') {
                alert("Enter an Agency.");
                return false;
            }
        }
        else {
            // Test against required user selections and fields to determine if values are valid.

            if(userData[0].client_company == '' || userData[0].first_name == '' || userData[0].last_name == '' || userData[0].address1 == '' || userData[0].city == '' || userData[0].work_phone == '' || userData[0].email == '' || userData[0].zip == '') {
                alert("Please fill all required fields, and/or fix invalid fields.");
                return false;
            }

            let i = 0;
            let isDash = false;

            while(i < userData[0].zip.length) {
                if(isNaN(userData[0].zip[i])) {
                    if(userData[0].zip[i] == '-' && !isDash) {
                        isDash = true;
                    }
                    else {
                        alert('Zip code invalid >:(');
                        return false;
                    }
                }
                i++;
            }
        }

        // Test if AutoCAD is selected to "Yes".

        // if(autoCad && document.getElementById('yesOffice').value == -1) { // If user didn't select anything, yell at them and return false.
        //     alert("Please fill all required fields, and/or fix invalid fields.");
        //     return false;
        // }
    }
    else if(currPage == 5) {

        // Saves values into global variables using saveChoices().

        saveChoices(5);

        // Test against required user selections and fields to determine if values are valid.

        if(userData[0].client_company == '' || userData[0].first_name == '' || userData[0].last_name == '' || userData[0].address1 == '' || userData[0].city == '' || userData[0].work_phone == '' || userData[0].email == '' || userData[0].zip == '') {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        let i = 0;
        let isDash = false;

        while(i < userData[0].zip.length) {
            if(isNaN(userData[0].zip[i])) {
                if(userData[0].zip[i] == '-' && !isDash) {
                    isDash = true;
                }
                else {
                    alert('Zip code invalid >:(');
                    return false;
                }
            }
            i++;
        }

    }
    else if(currPage == 6) {

        // Saves values into global variables using saveChoices().

        saveChoices(6);

        // Test against required user selections and fields to determine if values are valid.

        if(userData[0].description_service == '') {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
    }
    manager(currPage + 1);
}

/*
Function goBack(currPage) is called everytime the user clicks on the back button to go back to a previous page.
It saves the user's selections into the global variables from the top of this script to be reshown when the user comes back.
Also calls the getPage(currPage) function to format and reshow the user's old selections.
*/

function goBack(currPage) { // currPage is the page number the user is going back to.

    if(currPage == 1) {
        window.location.replace(".\\search.html");
    }
    // If-statements to determine the page the user was on to save the user data for later.

    saveChoices(currPage);

    // Calls getPage to retrieve old fields and user data.

    manager(currPage - 1);
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

/**
 * Formats Team Member names to a readable string for PDF.
 * @param {Array} memberArray 
 * @returns {String} mems
 */
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
 * Formats data and sends to server.
 * On success, thanks.html will load.
 */
function preparePost() {
    userData[0].ProfileCode = profCodeName;
    userData[0].contactTypeName = contactTypeName;
    if(isProject) {
        let Service_Agreement = '0';
        if(ServAgree) {
            Service_Agreement = '1';
        }
        else {
            userData[0].why = "NULL";
        }
        userData[0].invoiceName = invoiceName;
        userData[0].exempt_agreement = Service_Agreement;
    }
    if(oldMgrName != null) {
        userData[0].oldMgrName = oldMgrName;
    }
    if(userData[0].special_billing_instructions == '') {
        userData[0].special_billing_instructions = 'NULL';
    }

    if(userData[0].see_also == '') {
        userData[0].see_also = 'NULL';
    }

    if(userData[0].client_abbreviation == '') {
        userData[0].client_abbreviation = 'NULL';
    }

    if(userData[0].job_title == '') {
        userData[0].job_title = 'NULL';
    }

    if(userData[0].address2 == '') {
        userData[0].address2 = 'NULL';
    }

    if(userData[0].home_phone == '') {
        userData[0].home_phone = 'NULL';
    }

    if(userData[0].cell == '') {
        userData[0].cell = 'NULL';
    }

    if(userData[0].fax == '') {
        userData[0].fax = 'NULL';
    }

    if(userData[0].binder_location == '') {
        userData[0].binder_location = 'NULL';
    }

    userData[0].ProjectKeywords = teamString(keyNames) + " || " + teamString(otherKeys);
    
    userData[0].CreatedBy = activeUser;
    // userData[0].CreatedOn = new Date().toString();
    // userData[0].why = Explanation;
    userData[0].ProjectMgrName = mgrName;
    userData[0].QAQCPersonName = qaqcName;
    userData[0].relationship = (clientRelation == ''?'NULL':clientRelation);
    // userData[0].client_contract_PO = contractPONum;
    // userData[0].outside_markup = outsideMarkup;
    userData[0].Project_Specifications = (userData[0].Project_Specifications == -1)?-1:0;
    userData[0].AutoCAD_Project = (userData[0].AutoCAD_Project == -1)?-1:0;
    userData[0].GIS_Project = (userData[0].GIS_Project == -1)?-1:0;
    userData[0].isWhat = (isProject && isBillingGroup)?-1:(isProject?0:1);
    // let original = userData; // userData before we add extra single quotes for database processing.
    // for(let key of Object.keys(original)) {
    //     if(typeof original[key] === 'string') {
    //         original[key] = original[key].replace(/'/g, "''");
    //     }
    // }
    let buttonboi = (isProject)?7:6;
    document.getElementById('sending').innerHTML = '<p id="submitStat">Submitting...</p>';
    var xhr = new XMLHttpRequest();
    var url = "https://e-hv-ppi.shn-engr.com:3001/updater";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        xhr.onerror = function(e) {
            document.getElementById('sending').innerHTML = '<p id="submitStat">Could not connect.<br/><button type="button" onclick="goBack('+buttonboi+')">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
            console.log(e);
        }
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
            if(json.hasOwnProperty('Status')) {
                window.location.replace("thanks.html");
                // document.getElementById('sending').innerHTML = '<p id="submitStat">Sent ma boi</p>';
            }
            else{
                document.getElementById('sending').innerHTML = '<p id="submitStat">Something went wrong. Try again or contact help.<br/><button type="button" onclick="goBack('+buttonboi+')">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
            }
        }
        else if(xhr.status >= 400 && xhr.status < 500) {
            console.log(json);
            document.getElementById('sending').innerHTML = '<p id="submitStat">Your information couldn\'t be sent due to bad input. Try fixing any special characters or contact help.<br/><button type="button" onclick="goBack('+buttonboi+')">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
        }
        else if(xhr.status >= 500) {
            console.log(json);
            document.getElementById('sending').innerHTML = '<p id="submitStat">Internal server error.  Contact for help, or try fixing some inputs and remove any special characters.<br/><button type="button" onclick="goBack('+buttonboi+')">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
        }
        // else {
        //     var json = JSON.parse(xhr.responseText);
        //     console.log(json);
        //     document.getElementById('sending').innerHTML = '<p id="submitStat">Something went wrong. Try again or contact help.<br/><button type="button" onclick="goBack('+buttonboi+')">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
        // }
    };
    console.log(userData[0]);
    try{
        xhr.send(JSON.stringify(userData[0]));  // an error message typically looks like "{process: {…}, exitCode: 0}" in the console.
    }
    catch(bruh) {
        document.getElementById('sending').innerHTML = '<p id="submitStat">Could not connect.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
    }
}

/**
 * Runs the signIn() function as soon as the page loads.
 */
window.addEventListener("load", signIn(), false);