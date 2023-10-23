/* 
Variables to hold user's selected choices. 
These will be accessed everytime a user switches between pages,
so that their entered values can be saved, updated, and displayed.
*/
let activeUser = '';
let projTitle = ''; // required
let promoType = ''; // required
let projMgr = 0; // required
let qaqc = 0; // required
let teamMem = new Array(); // required
let startDate; // required
let endDate = ''; // required
let projLoc = ''; // required
let latitude = ''; // required
let longitude = ''; // required
let Projkeywords = new Array(); // required
let keywordString = '';
let otherKeys = new Array();
let shnOffice = -1; // required
let serviceArea = 0; // required
let profCode = -1; // required
let clientComp = ''; // required
let clientAbbr = '';
let clientFirst = ''; // required
let clientLast = ''; // required
let clientRelation = 'none';
let title = '';
let addr1 = ''; // required
let addr2 = '';
let city = ''; // required
let state = 'CA'; // required
let zip = ''; // required
let workPhone = ''; // required
let ext = '';
let homePhone = '';
let cell = '';
let fax = ''; // required
let email = ''; // required
let binderSize = 'NULL';
let descOfServ = ''; // required

// Below global variables are for the review page for a more proper display.

let promoName;
let mgrName;
let qaqcName;
let memNames = new Array();
let keyNames = new Array();
let keyResult = [];
let keyIDMap = new Map();
let tempKeyID = [];
let officeName1;
let servName;
let officeName2;
let profCodeName;
let contactTypeName;
let invoiceName;
let workPhoneInput;
let homePhoneInput;
let cellPhoneInput;
let faxInput;

/*
Functions to be called when fields are needed.
This was to keep from having to manually insert too much html labels and input fields
into the page#() functions.
*/

// Inserts a Label and text field for the table-based format the form has.

function getTextField(label, newID, value, required) { // i.e. getTextField('Project Title', 'promo', projTitle, true);
    let myReq = '';
    let myLabel = label;
    if(required) {
        myReq = 'required';
        myLabel = myLabel + '<span class="astrick">*</span>';
    }
    return '<div class="col-lg-4"><label for="'+ newID +'">'+ myLabel +'</label></div><div class="col-lg-8"><input type="text" id="'+ newID +'" name="'+ newID +'" maxlength="240" value="'+ value +'" '+ myReq +'></div>';
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
    return '<div class="col-lg-4"><label for="'+ newID +'">'+ myLabel +'</label></div><div class="col-lg-8"><input type="number" id="'+ newID +'" name="'+ newID + myStep +' min="' + min + '" '+ myMax +' onkeypress="limit(this);" value="'+ value +'" '+ myReq +'></div>';
}

// Inserts a Label and checkbox for the table-based format the form has.
// Typically gets called within function getUsers() to give API called values a checkbox.

function getCheckbox(group, id, value, label) {
    return '<div><input type="checkbox" id="'+ id +'" name="' + group + '" title="'+ label +'" placeholder="' + value + '"/><label for="' + group + '">' + label + '</label></div>';
}

// limit(element) gets called by number fields to try preventing users from entering more than 45 numbers.

function limit(element)
{
    let max_chars = 199;

    if(element.value.length > max_chars) {
        element.value = element.value.substr(0, max_chars);
    }

    // An attempt to restrict characters in a number field, such as -, +, /, or *.

//     if(isNaN(isNaN(String(element).slice(-1)))) {
//         element.value = element.value.substr(0, element[element.length - 1]);
//     }
}

function preparePost() {
    if(shnOffice != 0 && shnOffice != 1 && shnOffice != 2 && shnOffice != 4 && shnOffice != 5 && shnOffice != 6 && shnOffice != 7 && shnOffice != 8 && shnOffice != 9) {
        alert('An invalid value has been detected for SHN office: ' + shnOffice);
        return false;
    }

    if(shnOffice == 7) {
        shnOffice = 4;
    }

    const id = String(shnOffice);

    document.getElementById('sending').innerHTML = '<p id="submitStat">Submitting...</p>';

    // Prefill "None" into the empty optional fields, because the pdf formatting forces these to overlap when the fields are empty.

    if(endDate.trim() == '' || endDate == undefined) {
        endDate = "NULL";
    }

    if(clientAbbr == '') {
        clientAbbr = 'NULL';
    }

    if(title == '') {
        title = 'NULL';
    }

    if(addr2 == '') {
        addr2 = 'NULL';
    }

    if(homePhone == '') {
        homePhone = 'NULL';
    }

    if(cell == '') {
        cell = 'NULL';
    }

    if(fax == '') {
        fax = 'NULL';
    }

    let myNames = '';
    for(let i = 0; i < otherKeys.length; i++) {
        myNames += format(otherKeys[i]);
        if(i < otherKeys.length - 1) {
            myNames += ' || ';
        }
    }

    let sql = '{"Id":"' + id + '", "ProjectTitle":"'+ format(projTitle) + '",' +
    '"AlternateTitle":"'+ promoType + '",' +
    '"ProjectMgr":"'+ projMgr + '",' +
    '"ProjectMgrName":"'+ mgrName + '",' +
    '"QA_QCPerson":"'+ qaqc + '",' +
    '"QA_QCPersonName":"'+ qaqcName + '",' +
    '"TeamMembers":"'+ teamMem + '",' +
    '"TeamMemberNames":"'+ teamString(memNames) + '",' +
    '"StartDate":"'+ startDate + '",' +
    '"CloseDate":"' + endDate + '",' +
    '"ProjectLocation":"'+ format(projLoc) + '",' +
    '"Latitude":"'+ format(latitude) + '",' +
    '"Longitude":"'+ format(longitude) + '",' +
    '"KeyIDs":"'+ Projkeywords + '",' +
    '"ProjectKeywords":"'+ teamString(keyNames) + ' || '+ myNames + '",' +
    '"SHNOffice":"'+ officeName1 + '",' +
    '"officeID":"'+ shnOffice + '",' +
    '"ServiceArea":"'+ servName + '",' +
    '"ProfileCode":"'+ profCode + '",' +
    '"ProfileCodeName":"'+ profCodeName + '",' +
    '"ClientCompany1":"'+ format(clientComp) + '",' +
    '"ClientAbbrev1":"'+ format(clientAbbr) + '",' +
    '"ClientContactFirstName1":"'+ format(clientFirst) + '",' +
    '"ClientContactLastName1":"'+ format(clientLast) + '",' +
    '"ClientRelation":"'+ clientRelation + '",' +
    '"Title1":"'+ format(title) + '",' +
    '"Address1_1":"'+ format(addr1) + '",' +
    '"Address2_1":"'+ format(addr2) + '",'+
    '"City1":"'+ format(city) + '",'+
    '"State1":"'+ state + '",'+
    '"Zip1":"'+ zip + '",'+
    '"PhoneW1":"'+ format(workPhone) + '",'+
    '"Ext":"'+ format((ext == '' || ext == undefined?'NULL':ext)) + '",'+
    '"PhoneH1":"'+ format(homePhone) + '",'+
    '"Cell1":"'+ format(cell) + '",'+
    '"Fax1":"'+ format(fax) + '",'+
    '"Email1":"'+ format(email) + '",' +
    '"BinderSize":"'+ binderSize + '",' +
    '"CreatedOn":"'+ format(new Date().toString()) + '",' +
    '"CreatedBy":"'+ format(activeUser) + '",' +
    '"DescriptionService":'+ JSON.stringify(formatMultiline(descOfServ)) + '}';
    const jsonString = JSON.parse(JSON.stringify(sql));

    var xhr = new XMLHttpRequest();
    var url = "https://e-hv-ppi.shn-engr.com:3000/promo";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function(e) {
        document.getElementById('sending').innerHTML = '<p id="submitStat">Could not connect.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
        console.log(e);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
            if(json.hasOwnProperty('Status')) {
                document.getElementById('sending').innerHTML = '<p id="submitStat">Your form has submitted! Project number: '+ json.Status +'<br><button type="button" onclick="submit()">Start Over</button> or <a href="index.html">Back to Home</a></p>';
            }
            else{
                document.getElementById('sending').innerHTML = document.getElementById('sending').innerHTML = '<p id="submitStat">Something went wrong. Try again or contact help.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
            }
        }
        else if(xhr.status >= 400 && xhr.status < 500) {
            console.log(json);
            document.getElementById('sending').innerHTML = '<p id="submitStat">Your sent information couldn\'t be sent due to bad input. Try fixing any special characters or contact help.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
        }
        else if(xhr.status >= 500) {
            console.log(json);
            document.getElementById('sending').innerHTML = '<p id="submitStat">Internal server error.  Contact for help, or try fixing some inputs and remove any special characters.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
        }
    };
    console.log(jsonString);
    try{
        xhr.send(jsonString);  // an error message typically looks like "{process: {…}, exitCode: 0}" in the console.
    }
    catch(bruh) {
        document.getElementById('sending').innerHTML = '<p id="submitStat">Could not connect.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
    }
}

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

/*
getUsers(num) Function uses fetch statements to make the API calls to SHNserver.js to retrieve the needed values for different pages in JSON form.
This function will get called from within getPage(currPage) whenever a specific page needs external data from databases to keep its options up to date.
Function fillPage(newPage) will also be called within after data is retrieved to refill the options with the user's previous values.
If server code SHNserver.js isn't running or a connection error occurs, the page fields will update to show that there's an error.
*/

// Parameter num is associated with the page number calling for information.

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
            fillPage(num);

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

/*
Functions to add html for specific fields that needed an extra field to be given for specific user selections.
*/

// function customAmount() called by retainer's "Enter amount:" option. Also disapears when deselected.

function customAmount() {

	if(document.getElementById('retainer').value == 'enterAmt') { // If-statement if "Enter amount" is selected.
		document.getElementById('custAmount').innerHTML = '<input type="number" id="newAmount" name="newAmount" step="1" min="0" onkeypress="limit(this);" required>'
	}
	else { // When "Enter amount" is deselected, field and its values are gone.
		document.getElementById('custAmount').innerHTML = '';
	}
}

// function expandwhy() expands a required textarea field for when user selects "Yes" for the option "Is this project exempt from having a Service Agreement?"

function expandWhy() {
    let myCheck = document.getElementById('yesAgreement').checked;

    if(myCheck) { // Expand on "Yes" selection.
        document.getElementById('justWhy').innerHTML = '<br/><label for="explainYes">Explain why:<span class="astrick">*</span></label><br/><textarea id="bruh" name="explainYes" rows="5" cols="50" maxlength="1200"></textarea>';
    }
    else { // Retract on "No" selection.
        document.getElementById('justWhy').innerHTML = '';
    }
}

// function whichOne() called by AutoCAD job when selected to "Yes" to require a selection for which SHN office.

function whichOne() {
    let myCheck = document.getElementById('yesAuto').checked;
    
    if(myCheck) { // Expand on "Yes" selection.
        document.getElementById('ifYesWhichOff').innerHTML = '<label for="yesOffice">Which office?<span class="astrick">*</span></label><br/><select name="yesOffice" id="yesOffice" title="Office Location"> <option value="-1" selected>-Select-</option><option value="0">Eureka/Arcata</option><option value="2">Klamath Falls</option><option value="4">Willits/FB</option><option value="5">Redding</option><option value="6">Coos Bay</option></select>';
    }
    else { // Retract on "No" selection.
        document.getElementById('ifYesWhichOff').innerHTML = '';
    }
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

/*
These page functions are called by getPage(currPage) to insert the table formatted options onto the page.
They simply return the html syntax to create the table with the needed options.
*/

function page1() {
    return '<div class="row">' + getTextField('Promo Title<br>No special characters<br>(i.e. "#<>/\\$+%!`*\'|{}?=:@)', 'promo', projTitle, true) +
    '<div class="col-lg-4"><label for="promo-type">Type of Promo<span class="astrick">*</span></label></div>'+
    '<div class="col-lg-8"><select name="promo-type" id="promo-type" title="Promo" required><option value="" selected>-Select-</option><option value="on-going">On-going</option><option value="letter">Letter</option><option value="soq">SOQ</option><option value="ProPri">Proposal-Prime</option><option value="ProSub">Proposal-Sub</option></select></div>'+
    '<div class="col-lg-4"><label for="projMgr">Project Manager<span class="astrick">*</span></label></div>'+
    '<div class="col-lg-8" id="projFiller">Loading managers...</div>'+
    '<div class="col-lg-4"><label for="qaqc">QA QC Person<span class="astrick">*</span></label></div>'+
    '<div class="col-lg-8" id="qaqcFill">Loading QA QC people...</div>'+
    '<div class="col-lg-4"><label for="Team">Team Members<span class="astrick">*</span><br/>(Select at least one)</label><br/></div>'+
    '<div class="col-lg-8" id="help"><div class="column" id="emplCol">Loading team members...</div></div>'+
    '<div class="col-lg-4"><label for="start">Start Date<span class="astrick">*</span></label></div>'+
    '<div class="col-lg-8"><input type="date" id="start" value="start" required></div>'+
    '<div class="col-lg-4"><label for="end">End Date<span class="astrick">*</span></label></div>'+
    '<div class="col-lg-8"><input type="date" id="end" value="end" required></div>'
    +'</div>';
}

function page2() {
    return '<div class="row">'+ getTextField('Project Street Address', 'LocDesc', projLoc, true) +
    getNumberField('Project Latitude<br/>(i.e. 40.868928)', 'lat', latitude, -1, -90, 90, true) +
    getNumberField('Project Longitude<br/>(i.e. -123.988061)', 'long', longitude, -1, -90, 90, true)
    + '<div class="col-lg-4"><label for="key">Project Keywords<span class="astrick">*</span><br/>(Must select at least one keyword and/or add an extra keyword)</label></div>'+
    '<div class="col-lg-8"><div class="searchable" id="searchable"><label>Search Keywords: </label><input type="text" id="search" onkeyup="searchKeywords(this)"></div><div class = "column" id="keywords">Getting keywords...</div><br/><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey1" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey2" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey3" name="Otherkey" title="Otherkey" maxlength="255"></div>'
    +'</div>';
}

function page3() {
    return '<div class="row">'+
    '<div class="col-lg-4"><label for="office">SHN Office<span class="astrick">*</span></label></div><div class="col-lg-8"><select name="office" id="office" title="Office Location" required><option value="-1" selected>-Select-</option><option value="0">Eureka</option><option value="1">Arcata</option><option value="2">Klamath Falls</option><option value="4">Willits</option><option value="5">Redding</option><option value="6">Coos Bay</option><option value="9">Corporate</option></select></div>'+
    '<div class="col-lg-4"><label for="service">Service Area<span class="astrick">*</span></label></div>'+
    '<div class="col-lg-8"><select name="service" id="service" title="Service Area" required><option value="0" selected>-Select-</option><option value="Civil">Civil</option><option value="Environmental">Environmental</option><option value="Geology">Geology</option><option value="Planning/Permitting">Planning/Permitting</option><option value="Survey">Survey</option></select></div>' +
    '<div class="col-lg-4"><label for="code">Profile Code<span class="astrick">*</span></label></div><div class="col-lg-8" id="codeFill">Loading profile codes...</div>'
    +'</div>';
}

function page4() {
    return '<div class="row">' + getTextField('Client Company', 'clientComp', clientComp, true) +
    getTextField('Client Abbreviation', 'clientAbbr', clientAbbr, false) + 
    getTextField('Client First Name', 'cFirst', clientFirst, true) + getTextField('Client Last Name', 'cLast', clientLast, true) + 
    '<div class="col-lg-6"><label for="relation">Client Relationship</label></div><div class="col-lg-6"><select name="relation" id="relation" title="Client Relationship"><option value="current">on-going</option><option value="past">past/former</option><option value="none" selected>none or distant</option></select></div>'+
    getTextField('Title', 'title', title, false) + getTextField("Address 1", 'addy1', addr1, true) + getTextField('Address 2', 'addy2', addr2, false) + 
    getTextField('City', 'city', city, true) + '<div class="col-lg-6"><label for="state">State<span class="astrick">*</span></label></div>'+
    '<div class="col-lg-6"><select name="state" id="state" size="1" required><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA" selected="selected">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="DC">Dist of Columbia</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option></select></div>'+
    '<div class="col-lg-6"><Label for="zip">Zip Code<span class="astrick">*</span></div><div class="col-lg-6"><input type="text" id="zip" name="zip" maxlength="20" required></div>' +
    '<div class="col-lg-6"><label for="WP">Work Phone<span class="astrick">*</span><br>(Extension optional)</label></div><div class="col-lg-6"><input type="tel" id="WP" name="WP" maxlength="12" required><label for="ext"> Ext:</label><input type="text" id="ext" name="ext" maxlength="3"></div>'+
    '<div class="col-lg-6"><label for="HP">Home Phone</label></div><div class="col-lg-6"><input type="tel" id="HP" name="HP" maxlength="12"></div>'+
    '<div class="col-lg-6"><label for="cell">Cell</label></div><div class="col-lg-6"><input type="tel" id="cell" name="cell" maxlength="12"></div>'+
    '<div class="col-lg-6"><label for="fax">Fax</label></div><div class="col-lg-6"><input type="tel" id="fax" name="fax" maxlength="12"></div>'+
    '<div class="col-lg-6"><label for="email">Email<span class="astrick">*</span></label></div><div class="col-lg-6"><input type="email" id="email" name="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" maxlength="75" required></div>'+
    '</div>';
}

function page5() {
    return '<div class="row">' +
    '<div class="col-lg-4"><label for="binder">Binder Size</label></div><div class="col-lg-8"><select name="binder" id="binder" title="Binder Size"><option value="NULL" selected>N/A</option><option value="0.5">1/2 Inch</option><option value="1">1 Inch</option><option value="1.5">1.5 inches</option><option value="2">2 inches</option><option value="3">3 inches</option></select></div>'+
    '<div class="col-lg-4"><label for="describe">Description of Services<span class="astrick">*</span><br>Search projects with similar descriptions <a href="search.html" target="_blank">here</a>.</label></div><div class="col-lg-8"><textarea id="describe" name="describe" rows="5" cols="50" maxlength="63999" required></textarea></div>'
    +'</div>';
}

function page6() {
    let formatStartDate = new Date(startDate)
    formatStartDate = ((formatStartDate.getMonth() + 1) + '-' + formatStartDate.getDate() + '-' + formatStartDate.getFullYear()).toString();
    let formatCloseDate = new Date(endDate)
    formatCloseDate = ((formatCloseDate.getMonth() + 1) + '-' + formatCloseDate.getDate() + '-' + formatCloseDate.getFullYear()).toString();
    let formatMem = '';
    let formatKeys = '';
    for(names of memNames) {
        formatMem += names + '<br>';
    }
    for(keys of keyNames) {
        formatKeys += keys + '<br>';
    }

    let breakedDesc = descOfServ.replaceAll('\n', '<br>');

    return '<div class="row">' +
    '<div class="col-lg-6">Project Title' + '</div>'
    + '<div class="col-lg-6">' + projTitle + '</div>'+
    '<div class="col-lg-6">Type of Promo' + '</div>'
    + '<div class="col-lg-6">' + promoName + '</div>'+
    '<div class="col-lg-6">Project Manager' + '</div>'
    + '<div class="col-lg-6">' + mgrName + '</div>'+
    '<div class="col-lg-6">QAQC Person' + '</div>'
    + '<div class="col-lg-6">' + qaqcName + '</div>'+
    '<div class="col-lg-6">Team Members' + '</div>'
    + '<div class="col-lg-6">' + formatMem + '</div>'+
    '<div class="col-lg-6">Start Date' + '</div>'
    + '<div class="col-lg-6">' + formatStartDate + '</div>'+
    '<div class="col-lg-6">Close Date' + '</div>'
    + '<div class="col-lg-6">' + formatCloseDate + '</div>'+
    '<div class="col-lg-6">Project Location Descriptor' + '</div>'
    + '<div class="col-lg-6">' + projLoc + '</div>'+
    '<div class="col-lg-6">Project Latitude' + '</div>'
    + '<div class="col-lg-6">' + latitude + '</div>'+
    '<div class="col-lg-6">Project Longitude' + '</div>'
    + '<div class="col-lg-6">' + longitude + '</div>'+
    '<div class="col-lg-6">Project Keywords' + '</div>'
    + '<div class="col-lg-6">' + formatKeys + '</div>'+
    '<div class="col-lg-6">Other Keywords' + '</div>'
    + '<div class="col-lg-6">' + otherKeys + '</div>'+
    '<div class="col-lg-6">SHN Office' + '</div>'
    + '<div class="col-lg-6">' + officeName1 + '</div>'+
    '<div class="col-lg-6">Service Area' + '</div>'
    + '<div class="col-lg-6">' + servName + '</div>'+
    '<div class="col-lg-6">Profile Code' + '</div>'
    + '<div class="col-lg-6">' + profCodeName + '</div>'+
    '<div class="col-lg-6">Client Company' + '</div>'
    + '<div class="col-lg-6">' + clientComp + '</div>'+
    '<div class="col-lg-6">Client Abbreviation' + '</div>'
    + '<div class="col-lg-6">' + clientAbbr + '</div>'+
    '<div class="col-lg-6">Client First Name' + '</div>'
    + '<div class="col-lg-6">' + clientFirst + '</div>'+
    '<div class="col-lg-6">Client Last Name' + '</div>'
    + '<div class="col-lg-6">' + clientLast + '</div>'+
    '<div class="col-lg-6">Client Relationship' + '</div>'
    + '<div class="col-lg-6">' + clientRelation + '</div>'+
    '<div class="col-lg-6">Title' + '</div>'
    + '<div class="col-lg-6">' + title + '</div>'+
    '<div class="col-lg-6">Address 1' + '</div>'
    + '<div class="col-lg-6">' + addr1 + '</div>'+
    '<div class="col-lg-6">Address 2' + '</div>'
    + '<div class="col-lg-6">' + addr2 + '</div>'+
    '<div class="col-lg-6">City' + '</div>'
    + '<div class="col-lg-6">' + city + '</div>'+
    '<div class="col-lg-6">State' + '</div>'
    + '<div class="col-lg-6">' + state + '</div>'+
    '<div class="col-lg-6">Zip' + '</div>'
    + '<div class="col-lg-6">' + zip + '</div>'+
    '<div class="col-lg-6">Work Phone' + '</div>'
    + '<div class="col-lg-6">' + workPhone + (ext != ''?' Ext: ' + ext:'') + '</div>'+
    '<div class="col-lg-6">Home Phone' + '</div>'
    + '<div class="col-lg-6">' + homePhone + '</div>'+
    '<div class="col-lg-6">Cell Phone' + '</div>'
    + '<div class="col-lg-6">' + cell + '</div>'+
    '<div class="col-lg-6">Fax' + '</div>'
    + '<div class="col-lg-6">' + fax + '</div>'+
    '<div class="col-lg-6">Email' + '</div>'
    + '<div class="col-lg-6">' + email + '</div>'+
    '<div class="col-lg-6">Binder Size' + '</div>'
    + '<div class="col-lg-6">' + binderSize + '</div>'+
    '<div class="col-lg-6">Description of Services' + '</div>'
    + '<div class="col-lg-6">' + breakedDesc + '</div></div>';
}

/*
Function saveChoices(currPage) saves the user's selections.
It is often called by functions goBack() and reqField() so the user can see their results when they revisit previous pages.
*/

function saveChoices(currPage) {
    if(currPage == 2) {
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
    else if(currPage == 3) {

        // Saves values into global variables.

        shnOffice = document.getElementById('office').value;
        officeName1 = document.getElementById('office').options[document.getElementById("office").selectedIndex].text;
        serviceArea = document.getElementById('service').value;
        servName = document.getElementById('service').options[document.getElementById("service").selectedIndex].text;
        profCode = document.getElementById('code').value;
        profCodeName = document.getElementById('code').options[document.getElementById("code").selectedIndex].text;
    }
    else if(currPage == 4) {
        
        // Saves values into global variables.

        clientComp = document.getElementById('clientComp').value.trim();
        clientAbbr = document.getElementById('clientAbbr').value.trim();
        clientFirst = document.getElementById('cFirst').value.trim();
        clientLast = document.getElementById('cLast').value.trim();
        clientRelation = document.getElementById('relation').value;
        title = document.getElementById('title').value.trim();
        addr1 = document.getElementById('addy1').value.trim();
        addr2 = document.getElementById('addy2').value.trim();
        city = document.getElementById('city').value.trim();
        state = document.getElementById('state').value;
        zip = document.getElementById('zip').value;
        workPhone = document.getElementById('WP').value.trim();
        ext = document.getElementById('ext').value.trim();
        homePhone = document.getElementById('HP').value.trim();
        cell = document.getElementById('cell').value.trim();
        fax = document.getElementById('fax').value.trim();
        email = document.getElementById('email').value.trim();
    }
    else if(currPage == 5) {

        // Saves values into global variables.

        binderSize = document.getElementById('binder').value;
        descOfServ = document.getElementById('describe').value;

    }
}

/*
Function goBack(currPage) is called everytime the user clicks on the back button to go back to a previous page.
It saves the user's selections into the global variables from the top of this script to be reshown when the user comes back.
Also calls the getPage(currPage) function to format and reshow the user's old selections.
*/

function goBack(currPage) { // currPage is the page number the user is going back to.

    // If-statements to determine the page the user was on to save the user data for later.

    saveChoices(currPage + 1);

    // Calls getPage to retrieve old fields and user data.

    getPage(currPage);
}

/*
    Function reqField(currPage) is called by the "Next" button to evaluate the data before moving on.
    If an input is bad, it will alert to the user "Please fill all required fields, and/or fix invalid fields"
    and return false.
    If inputs are valid, currPage is incremented by 1 and getPage(currPage) will be called to get the next page.
*/

function reqField(currPage) { // Parameter currPage is the page the user is currently on.
    
    // If-statements to determine the current page.
    if(currPage == 1) { // Evaluate page 1.

        // Saves values into global variables.

        projTitle = document.getElementById('promo').value.trim();
        promoType = document.getElementById('promo-type').value;
        projMgr = document.getElementById("projMgr").value;
        qaqc = document.getElementById("qaqc").value;
        startDate = document.getElementById('start').value;
        endDate = document.getElementById('end').value;

        // mySelects to determine if number of checked boxes is more than 1.

        let mySelects = document.querySelectorAll('input[name="Team"]:checked');

        // Test variables for illegal inputs.

        if(promoType == 0|| projMgr == 0 || qaqc == 0 || projTitle == '' || mySelects.length <= 0 || startDate == '' || startDate == undefined || endDate == '' || endDate == undefined ||startDate > endDate) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
        
        if(projTitle.includes("#") || projTitle.includes("<") || projTitle.includes("$") || projTitle.includes("+") || projTitle.includes("%") || projTitle.includes(">") ||projTitle.includes("!") || projTitle.includes("`") || projTitle.includes("*") || projTitle.includes("'") || projTitle.includes("|") || projTitle.includes("{") || projTitle.includes("?") || projTitle.includes("\"") || projTitle.includes("=") || projTitle.includes("}") || projTitle.includes("/") || projTitle.includes(":") || projTitle.includes("\\") || projTitle.includes("@")) {
            alert("No special characters.  Please rename your promo title.");
            return false;
        }

        if(projTitle[projTitle.length - 1] == '.') {
            alert("Please remove the period at the end of promo title.");
            return false;
        }

        // Success if we get here.
        // Empty teamMem variable and member name variable to insert user selections.

        teamMem = [];
        memNames = [];

        // Inserts new selections into teamMem.

        for(selection of mySelects) {
            if(selection.checked){
                teamMem.push(selection.id);
                memNames.push(selection.placeholder);
            }
        }

        // get manager and qaqc person name.

        mgrName = document.getElementById("projMgr").options[document.getElementById("projMgr").selectedIndex].text;
        qaqcName = document.getElementById("qaqc").options[document.getElementById("qaqc").selectedIndex].text;
        promoName = document.getElementById('promo-type').options[document.getElementById("promo-type").selectedIndex].text;
    }
    else if(currPage == 2) { // Evaluate page 2.

        // Saves values into global variables using saveChoices.

        saveChoices(2);

        // Test against user selections and fields to determine if values are valid.

        if(projLoc == '' || latitude == '' || longitude == '' || Projkeywords.length + otherKeys.length <= 0) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        // Check latitude.
        
        if(isNaN(latitude)) {
            alert("Invalid latitude.  Use decimal numbers only.");
            return false;
        }
        else if(Number(latitude) > 90 || Number(latitude) < -90) {
            alert("Keep latitude between 90 and -90.");
            return false;
        }

        // Check longitude.

        if(isNaN(longitude)) {
            alert("Invalid longitude.  Use decimal numbers only.");
            return false;
        }
        else if(Number(longitude) < -180 || Number(longitude) > 180) {
            alert("Keep longitude between 180 and -180.");
           return false;
        }

        // Success if we get here.
        // Shorten coordinate values if they're too long.
        if(latitude.toString().indexOf('.') !== -1) {
            latitude = Number(latitude).toFixed(6);
        }
        if(longitude.toString().indexOf('.') !== -1) {
            longitude = Number(longitude).toFixed(6);
        }
    }
    else if(currPage == 3) { // Evaluate page 3.

        // Save values into global variables using saveChoices().

        saveChoices(3);

        // If user selected "Yes" on the servide agreement field, then we test if the user also inputted text into the explanation field.
        if(shnOffice == -1 || serviceArea == 0 || profCode == -1) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
    }
    else if(currPage == 4) { // Evaluate page 4.

        // Saves values into global variables using saveChoices().

        saveChoices(4);

        // Test against required user selections and fields to determine if values are valid.

        if(clientComp == '' || clientFirst == '' || clientLast == '' || addr1 == '' || city == '' || zip == '' || workPhone == '' || email == '') {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        let i = 0;
        let isDash = false;

        while(i < zip.length) {
            if(isNaN(zip[i])) {
                if(zip[i] == '-' && !isDash) {
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
    else if(currPage == 5) {

        // Saves values into global variables using saveChoices().

        saveChoices(5);

        // Test against required user selections and fields to determine if values are valid.

        if(descOfServ == '') {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

    }

    // If all is successful, increment currPage and go to the next page.

    currPage++;
    getPage(currPage);
}

/*
Function fillPage(newPage) is called either by getUser(num) or getPage(currPage) to fill the page with the user's previous selections, if any.
The call from getUser(num) or getPage(currPage) depends on if the page involved making any API calls.
In the case that it does, getUser(num) makes the call.  Otherwise, it's getPage(currPage).
*/

function fillPage(newPage) { // Parameter newPage is the page to load the previous user selections.

    // if-statements to determine which page to fill.

    if(newPage == 1) { // Fill page 1.

        // Set previous or default values to fields.

        document.getElementById('promo').value = projTitle;

        // Restore date value.

        let startInput = document.getElementById('start');
        startInput.setAttribute("value", startDate);
        startInput = document.getElementById('end');
        startInput.setAttribute("value", endDate);
    }
    else if(newPage == 2) { // Fill page 2.

        // Set previous or default values to fields.

        document.getElementById('LocDesc').value = projLoc;
        document.getElementById('lat').value = latitude;
        document.getElementById('long').value = longitude;

        // Select all checkbox inputs to test which ones need to be checked.

        // let nuts = document.querySelectorAll('input[name="key"]');

        // // For-loops to select the checkboxes from previous user selections, if any.
        // // The loops tests checkboxes based on the checkbox IDs stored in variable Projkeywords.

        // for(check of Projkeywords) {
        //     for(ischeck of nuts) {
        //         if(check == ischeck.id) {
        //             document.getElementById(ischeck.id).checked = true;
        //             break;
        //         }
        //     }
        // }

        // Now see if the user had inputted anything into the Other fields for keywords.
        // we do so by getting the number of custom keywords in the otherKeys array.

        let numOther = otherKeys.length; // Should be no longer than 3.
        let num = 1; // To get ID of input element.

        // Loop to pop and insert old custom keywords into text fields.

        while(numOther > 0 && num <= 3) {
            document.getElementById('Otherkey' + num).value = otherKeys.pop();
            num++;
            numOther--;
        }
    }
    else if(newPage == 3) {
        document.getElementById('office').value = shnOffice;
        document.getElementById('service').value = serviceArea;
    }
    else if(newPage == 4) { // Fill page 4.

        // Set previous or default values to fields.

        document.getElementById('clientComp').value = clientComp;
        document.getElementById('clientAbbr').value = clientAbbr;
        document.getElementById('cFirst').value = clientFirst;
        document.getElementById('cLast').value = clientLast;
        document.getElementById('relation').value = clientRelation;
        document.getElementById('title').value = title;
        document.getElementById('addy1').value = addr1;
        document.getElementById('addy2').value = addr2;
        document.getElementById('city').value = city;
        document.getElementById('state').value = state;
        document.getElementById('zip').value = zip;
        document.getElementById('WP').value = workPhone;
        document.getElementById('ext').value = ext;
        document.getElementById('HP').value = homePhone;
        document.getElementById('cell').value = cell;
        document.getElementById('fax').value = fax;
        document.getElementById('email').value = email;

    }
    else if(newPage == 5) { // Fill page 5.

        // Set previous or default values to fields.

        document.getElementById('binder').value = binderSize;
        document.getElementById('describe').value = descOfServ;
    }
}

/**
 * Function fillAfterLoad() fills previous user data after database values are loaded.
 * Only works for the first couple pages.
 */

function fillAfterLoad(currPage) {
    if(currPage == 1) {

        
    // Set previous or default values to fields.

    document.getElementById('promo-type').value = promoType;
    document.getElementById("projMgr").value = projMgr;
    document.getElementById("qaqc").value = qaqc;

        // Select all checkbox inputs to test which ones need to be checked.

        let prevSelects = document.querySelectorAll('input[name="Team"]');

        // For-loops to select the checkboxes from previous user selections, if any.
        // The loops tests checkboxes based on the checkbox IDs stored in variable teamMem.
        
        for(let memb of teamMem) {
            for(let selects of prevSelects) {
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
        
        for(let check of Projkeywords) {
            for(let ischeck of nuts) {
                if(check == ischeck.id) {
                    document.getElementById(ischeck.id).checked = true;
                    break;
                }
            }
        }
    }
    else if(currPage == 3) {
        document.getElementById('code').value = profCode;
    }
}

/*
function getPage(currPage) is called everytime a page needs to be refreshed with new fields and inputs by inserting the needed html and calling the page functions.
It calls getUsers(num) or fillPage(currPage) when needed.
Will add the cooresponding buttons to the bottom of the form to make the needed calls to functions goBack(currPage) and reqField(currPage).
*/

function getPage(currPage) { // Parameter currPage is the page to format and be filled.

    scroll(0,0);
    
    // If-statements to determine which pages need to be loaded.

    if(currPage == 1) { // Load page 1.
        
        // Get contents of the page.

        document.getElementById('projForm').innerHTML = page1();

        fillPage(1);

        // API call is needed to get employee names.

        getUsers(1);

        // Append button.

        document.getElementById('projForm').innerHTML += '<div class="buttons"><button type="button" onclick="reqField(1)">Next</button></div>';
    }
    else if(currPage == 2) { // Load page 2.

        // Get contents of the page.

        document.getElementById('projForm').innerHTML = page2();

        fillPage(currPage);

        // API call is needed to get keywords.

        getUsers(2);

        // Append buttons.

        document.getElementById('projForm').innerHTML += '<div class="buttons"><button type="button" onclick="goBack(1)">Back</button><button type="button" onclick="reqField(2)">Next</button></div>';
    }
    else if(currPage == 3) { // Load page 3.

        // Get contents of the page.

        document.getElementById('projForm').innerHTML = page3();

        // API call is needed to get profile codes.

        getUsers(3);

        // Append buttons.

        document.getElementById('projForm').innerHTML += '<div class="buttons"><button type="button" onclick="goBack(2)">Back</button><button type="button" onclick="reqField(3)">Next</button></div>';
    }
    else if(currPage == 4) { // Load page 4.

        // Get contents of the page. No API calls for now, so we'll also append buttons.

        document.getElementById('projForm').innerHTML = page4() + '<div class="buttons"><button type="button" onclick="goBack(3)">Back</button><button type="button" onclick="reqField(4)">Next</button></div>';

        // Fill the page, since we don't have an API call.

        workPhoneInput = document.getElementById('WP');
        homePhoneInput = document.getElementById('HP');
        cellPhoneInput = document.getElementById('cell');
        faxInput = document.getElementById('fax');

        workPhoneInput.addEventListener('input', function () {
            // Remove any non-numeric characters
            const cleanedValue = this.value.replace(/\D/g, '');

            // Format the phone number with dashes
            const formattedValue = formatPhoneNumber(cleanedValue);

            // Set the formatted value back to the input field
            this.value = formattedValue;
        });

        homePhoneInput.addEventListener('input', function () {
            // Remove any non-numeric characters
            const cleanedValue = this.value.replace(/\D/g, '');

            // Format the phone number with dashes
            const formattedValue = formatPhoneNumber(cleanedValue);

            // Set the formatted value back to the input field
            this.value = formattedValue;
        });

        cellPhoneInput.addEventListener('input', function () {
            // Remove any non-numeric characters
            const cleanedValue = this.value.replace(/\D/g, '');

            // Format the phone number with dashes
            const formattedValue = formatPhoneNumber(cleanedValue);

            // Set the formatted value back to the input field
            this.value = formattedValue;
        });

        faxInput.addEventListener('input', function () {
            // Remove any non-numeric characters
            const cleanedValue = this.value.replace(/\D/g, '');

            // Format the phone number with dashes
            const formattedValue = formatPhoneNumber(cleanedValue);

            // Set the formatted value back to the input field
            this.value = formattedValue;
        });

        fillPage(4);
    }
    else if(currPage == 5) { // Load page 5.

        // Get contents of the page. No API calls for now, so we'll also append buttons.

        document.getElementById('projForm').innerHTML = page5() + '<div class="buttons"><button type="button" onclick="goBack(4)">Back</button><button type="button" onclick="reqField(5)">Review</button></div>';

        // Fill the page, since we don't have an API call.

        fillPage(5);
    }
    else if(currPage == 6) {

        // Get contents of the page. No API calls for now, so we'll also append buttons.
        // This will be the review page.

        document.getElementById('projForm').innerHTML = page6() + '<div id="sending"><div class="buttons"><button type="button" onclick="goBack(5)">Back</button><button type="button" onclick="preparePost()">Submit</button></div></div>';
    }
}

/**
 * 
 * @param {String} phoneNumber 
 * @returns String in phone number format.
 */

function formatPhoneNumber(phoneNumber) {
    const match = phoneNumber.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
        const parts = match.slice(1).filter(Boolean);
        return parts.join('-');
    }
    return phoneNumber;
}

// Event listener to call getPage(1) when the window loads to start the Project Initiation Form on Page 1.

// window.addEventListener("load", getPage(1), false);

function starter(res) {
    activeUser = res.account.name;
    getPage(1);
}