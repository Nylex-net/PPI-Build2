/* 
Variables to hold user's selected choices. 
These will be accessed everytime a user switches between pages,
so that their entered values can be saved, updated, and displayed.
*/

let activeUser = '';
let projTitle = ''; // required
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
let totalContract = ''; // required
let ServAgree = false; // required
let ifYesWhy = '';
let retainer = 0;
let retainAmnt = 'NULL';
let senior = '';
let profCode = -1; // required
let contactType = 0; // required
let invoiceFormat = "B";
let contractPONum = ''; // required
let outsideMarkup = 15; // required
let prevWage = "0"; // required
let agency_name = '';
let specBillInstr = '';
let seeAlso = '';
let autoCad = false;
// var ifYesWhichOffice = -1;
let GIS = false;
let projSpec = false;
let clientComp = ''; // required
let mailList = '';
let openHouse = false;
let xmas = false;
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
let homePhone = '';
let cell = '';
let fax = '';
let email = ''; // required
let binderSize = 'NULL';
let binderLoc = '';
let descOfServ = ''; // required
let schedOfDeliv = '';
let succCrit = '';
let qualDesc = '';
let qualNotes = '';
let saveCheckr;

// Below global variables are for the review page for a more proper display.

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
    return '<div class="grid-item"><label for="'+ newID +'">'+ myLabel +'</label></div><div class="grid-item"><input type="text" id="'+ newID +'" name="'+ newID +'" maxlength="240" value="'+ value +'" '+ myReq +'></div>';
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

// Inserts a Label and checkbox for the table-based format the form has.
// Typically gets called within function getUsers() to give API called values a checkbox.

function getCheckbox(group, id, value, label) {
    return '<div><input type="checkbox" id="'+ id +'" name="' + group + '" title="'+ label +'" placeholder="' + value + '"/><label for="' + group + '">' + label + '</label></div>';
}

// limit(element) gets called by number fields to try preventing users from entering more than 45 numbers.

function limit(element)
{
    let max_chars = 45;

    if(element.value.length > max_chars) {
        element.value = element.value.substr(0, max_chars);
    }
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
Function preparePost() prepares a JSON of data needed to be sent to be processed and inserted into the projects database.
*/

function preparePost() {
    let formatStartDate = new Date(startDate)
    formatStartDate = ((formatStartDate.getMonth() + 1) + '-' + formatStartDate.getDate() + '-' + formatStartDate.getFullYear()).toString();
    let formatCloseDate = new Date(endDate)
    formatCloseDate = ((formatCloseDate.getMonth() + 1) + '-' + formatCloseDate.getDate() + '-' + formatCloseDate.getFullYear()).toString();
    if(retainer != 'enterAmnt') {
        retainAmnt == 'NULL';
    }
    else if(isNaN(retainAmnt)) {
        alert('An invalid value has been detected for retainer amount: ' + retainAmnt);
        return false;
    }
    else {
        retainAmnt = Number(retainAmnt);
    }

    if(autoCad != true && autoCad != false) {
        alert('An invalid value has been detected for AutoCAD Job: ' + autoCad);
        return false;
    }

    if(shnOffice != 0 && shnOffice != 1 && shnOffice != 2 && shnOffice != 4 && shnOffice != 5 && shnOffice != 6 && shnOffice != 7 && shnOffice != 8 && shnOffice != 9) {
        alert('An invalid value has been detected for SHN office: ' + shnOffice);
        return false;
    }

    if(shnOffice == 7) {
        shnOffice = 4;
    }

    const id = String(shnOffice);

    let cadNum = 0;
    if(autoCad) {
        cadNum = 1;
    }
    let gisNum = 0;
    if(GIS) {
        gisNum = 1;
    }
    let projSpecNum = 0;
    if(projSpec) {
        projSpecNum = 1;
    }

    // Prefill "None" into the empty optional fields, because the pdf formatting forces these to overlap when the fields are empty.

    if(endDate.trim() == "" || endDate == undefined) {
        endDate = "None";
    }

    if(specBillInstr == '') {
        specBillInstr = 'NULL';
    }

    if(seeAlso == '') {
        seeAlso = 'NULL';
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

    if(binderLoc == '') {
        binderLoc = 'NULL';
    }

    let myNames = '';
    for(let i = 0; i < otherKeys.length; i++) {
        myNames += format(otherKeys[i]);
        if(i < otherKeys.length - 1) {
            myNames += ' || ';
        }
    }

    let Service_Agreement = 0;
    if(ServAgree) {
        Service_Agreement = 1;
    }
    else {
        ifYesWhy = 'NULL';
    }
    let waiver = (retainer == 'Waived by X') ? senior:'NULL';
    document.getElementById('sending').innerHTML = '<p id="submitStat">Submitting...</p>';

    let sql = '{"Id":"' + id + '", "ProjectTitle":"'+ format(projTitle) + '",' +
    '"ProjectMgr":"'+ projMgr + '",' +
    '"ProjectMgrName":"'+ mgrName + '",' +
    '"QA_QCPerson":"'+ qaqc + '",' +
    '"QA_QCPersonName":"'+ qaqcName + '",' +
    '"TeamMembers":"'+ teamMem + '",' +
    '"TeamMemberNames":"'+ teamString(memNames) + '",' +
    '"StartDate":"'+ startDate + '",' +
    '"CloseDate":"' + endDate + '",' +
    '"ProjectLocation":"'+ format(projLoc) + '",' +
    '"Latitude":"'+ latitude + '",' +
    '"Longitude":"'+ longitude + '",' +
    '"KeyIDs":"'+ Projkeywords + '",' +
    '"ProjectKeywords":"'+ teamString(keyNames) + ' || '+ myNames + '",' +
    '"officeID":"'+ shnOffice + '",' +
    '"SHNOffice":"'+ officeName1 + '",' +
    '"ServiceArea":"'+ servName + '",' +
    '"TotalContract":"'+ totalContract + '",' +
    '"ServiceAgreement":"'+ Service_Agreement +'",' +
    '"Explanation":'+ JSON.stringify(formatMultiline(ifYesWhy)) +',' +
    '"Retainer":"'+ retainer + '",' +
    '"RetainerPaid":"'+ retainAmnt + '",' +
    '"WaivedBy":"'+ format(waiver) + '",' +
    '"ProfileCode":"'+ profCode + '",' +
    '"ContractType":"'+ contactType + '",' +
    '"contactTypeName":"'+contactTypeName + '",'+
    '"InvoiceID":"'+ invoiceFormat + '",'+
    '"InvoiceFormat":"'+ invoiceName + '",' +
    '"ClientContractPONumber":"'+ format(contractPONum) + '",' +
    '"OutsideMarkup":"' + outsideMarkup + '",' +
    '"PREVAILING_WAGE":"'+ prevWage + '",' +
    '"agency":"'+ (agency_name == ''?"NULL":format(agency_name)) + '",' +
    '"SpecialBillingInstructins":'+ JSON.stringify(formatMultiline(specBillInstr)) + ',' +
    '"SEEALSO":'+ JSON.stringify(formatMultiline(seeAlso)) + ',' +
    '"AutoCAD_Project":'+ cadNum + ',' +
    '"GIS_Project":'+ gisNum + ',' +
    '"Project_Specifications":"'+ projSpecNum + '",' +
    '"ClientCompany1":"'+ format(clientComp) + '",' +
    '"ClientRelation":"'+ format(clientRelation) + '",' +
    '"OfficeMailingLists1":"'+ mailList + '",' +
    '"ClientAbbrev1":"'+ format(clientAbbr) + '",' +
    '"ClientContactFirstName1":"'+ format(clientFirst) + '",' +
    '"ClientContactLastName1":"'+ format(clientLast) + '",' +
    '"Title1":"'+ format(title) + '",' +
    '"Address1_1":"'+ format(addr1) + '",' +
    '"Address2_1":"'+ format(addr2) + '",'+
    '"City1":"'+ format(city) + '",'+
    '"State1":"'+ state + '",'+
    '"Zip1":"'+ zip + '",'+
    '"PhoneW1":"'+ format(workPhone) + '",'+
    '"PhoneH1":"'+ format(homePhone) + '",'+
    '"Cell1":"'+ format(cell) + '",'+
    '"Fax1":"'+ format(fax) + '",'+
    '"Email1":"'+ format(email) + '",' +
    '"BinderSize":"'+ binderSize + '",' +
    '"BinderLocation":"'+ format(binderLoc) + '",' +
    '"CreatedBy":"'+ format(activeUser) + '",' +
    '"CreatedOn":"'+ format(new Date().toString()) + '",' +
    '"DescriptionService":'+ JSON.stringify(formatMultiline(descOfServ)) + '}';
    const jsonString = JSON.parse(JSON.stringify(sql));

    var xhr = new XMLHttpRequest();
    var url = "https://e-hv-ppi.shn-engr.com:3000/result";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        xhr.onerror = function(e) {
            document.getElementById('sending').innerHTML = '<p id="submitStat">Could not connect.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
            console.log(e);
        }
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
            if(json.hasOwnProperty('Status')) {
                document.getElementById('sending').innerHTML = '<p id="submitStat">Your form has submitted! Project number: '+ json.Status +'<br><button type="button" onclick="submit()">Start Over</button> or <a href="Project_Initiation_home.html">Back to Home</a></p>';
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
        // else {
        //     var json = JSON.parse(xhr.responseText);
        //     console.log(json);
        //     document.getElementById('sending').innerHTML = '<p id="submitStat">Something went wrong. Try again or contact help.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
        // }
    };
    console.log(jsonString);
    try{
        xhr.send(jsonString);  // an error message typically looks like "{process: {…}, exitCode: 0}" in the console.
    }
    catch(bruh) {
        document.getElementById('sending').innerHTML = '<p id="submitStat">Could not connect.<br/><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></p>';
    }
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

function agency() {
    if(document.getElementById('wage').value == "1") {
        document.getElementById('agent').innerHTML = '<br><label for="agentcy">Name of Agency:<span class="astrick">*</span></label><br><input type="text" id="agency" name="agency" title="Agency" maxlength="255">';
    }
    else {
        document.getElementById('agent').innerHTML = '';
    }
}

// function whichOne() previously called by AutoCAD job when selected to "Yes" to require a selection for which SHN office.

// function whichOne() {
//     let myCheck = document.getElementById('yesAuto').checked;
    
//     if(myCheck) { // Expand on "Yes" selection.
//         document.getElementById('ifYesWhichOff').innerHTML = '<label for="yesOffice">Which office?<span class="astrick">*</span></label><br/><select name="yesOffice" id="yesOffice" title="Office Location"> <option value="-1" selected>-Select-</option><option value="0">Eureka/Arcata</option><option value="2">Klamath Falls</option><option value="4">Willits/FB</option><option value="5">Redding</option><option value="6">Coos Bay</option></select>';
//     }
//     else { // Retract on "No" selection.
//         document.getElementById('ifYesWhichOff').innerHTML = '';
//     }
// }

/*
These page functions are called by getPage(currPage) to insert the table formatted options onto the page.
They simply return the html syntax to create the table with the needed options.
*/

function page1() {
    return '<div class="grid-container">' + getTextField('Project Title<br>No special characters<br>(i.e. "#<>/\\$+%!`*\'|{}?=:@)', 'promo', projTitle, true) +
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

function page2() {
    return '<div class="grid-container">'+ getTextField('Project Street Address', 'LocDesc', projLoc, true) +
    getNumberField('Project Latitude<br/>(i.e. 40.868928)', 'lat', latitude, -1, -90, 90, true) +
    getNumberField('Project Longitude<br/>(i.e. -123.988061)', 'long', longitude, -1, -90, 90, true)
    + '<div class="grid-item"><label for="key">Project Keywords<span class="astrick">*</span><br/>(Must select at least one keyword and/or add an extra keyword)</label></div>'+
    '<div class="grid-item"><div class="searchable" id="searchable"><label>Search Keywords: </label><input type="text" id="search" onkeyup="searchKeywords(this)"></div><div class = "column" id="keywords">Getting keywords...</div><br/><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey1" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey2" name="Otherkey" title="Otherkey" maxlength="255"><br/><label for="Otherkey">Other: </label><input type="text" id="Otherkey3" name="Otherkey" title="Otherkey" maxlength="255"></div>'
    +'</div>';
}

function page3() {
    return '<div class="grid-container">'+
    '<div class="grid-item"><label for="office">SHN Office<span class="astrick">*</span></label></div><div class="grid-item"><select name="office" id="office" title="Office Location" required><option value="-1" selected>-Select-</option><option value="0">Eureka</option><option value="1">Arcata</option><option value="2">Klamath Falls</option><option value="4">Willits</option><option value="5">Redding</option><option value="6">Coos Bay</option><option value="9">Corporate</option></select></div>'+
    '<div class="grid-item"><label for="service">Service Area<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><select name="service" id="service" title="Service Area" required><option value="0" selected>-Select-</option><option value="Civil">Civil</option><option value="Environmental">Environmental</option><option value="Geology">Geology</option><option value="Planning/Permitting">Planning/Permitting</option><option value="Survey">Survey</option></select></div>' +
    getNumberField('Total Contract', 'contract', 'contract', 1, 0, -1, true) +
    '<div class="grid-item"><label for="projExempt">Is this project exempt from having a Service Agreement?<span class="astrick">*</span></label></div><div class="grid-item"><input type="radio" name="projExempt" id="yesAgreement" value="Yes" title="projExempt" onchange="expandWhy()">Yes<input type="radio" name="projExempt" value="No" title="projExempt" onchange="expandWhy()" checked>No<div id="justWhy"></div></div>'+
    '<div class="grid-item"><label for="retainer">Retainer<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><select name="retainer" id="retainer" title="retainer" onchange="customAmount()" required><option value="0">-Select-</option><option value="Enter Amount">Enter Amount:</option><option value="Existing Client">Existing Client No Issues</option><option value="Exempt Public Client">Exempt Public Client</option><option value="Waived by X">Waived by X (Senior Personnel select)</option></select><p id="custAmount"></p></div>'+
    '<div class="grid-item"><label for="code">Profile Code<span class="astrick">*</span></label></div><div class="grid-item" id="codeFill">Loading profile codes...</div>'
    +'</div>';
}

function page4() {
    return '<div class="grid-container">' +
    '<div class="grid-item"><label for="contactType">Contract Type<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><select name="contactType" id="contactType" title="contactType" required><option value="0">-Select-</option><option value="1">1 – Cost Plus (Time and Expenses)</option><option value="2">2 – Cost Plus to a Maximum</option><option value="3">3 – Fixed Fee (Lump Sum)</option><option value="10">10 – Promo (Non-Billable)</option></select></div>'+
    '<div class="grid-item"><label for="invoiceFormat">Invoice Format</label></div>'+
    '<div class="grid-item"><select name="invoiceFormat" id="invoiceFormat" title="invoiceFormat"><option value="A">Emp. Name, Dates, Hrs, and Billing Rates</option><option value="B" selected>Emp. Name, Hrs, and Billing Rates (No Dates)</option><option value="C">Emp. Name, Dates, Hrs, Billing Rates, Phase, and Task</option></select></div>'+
    getTextField('Client Contract/PO #', 'PO', contractPONum, true) +
    '<div class="grid-item"><label for="OutMark">Outside Markup<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><input type="number" id="OutMark" name="OutMark" step="1" min="0" max="100" value="15" onkeypress="limit(this);" required>%</input></div>'+
    '<div class="grid-item"><label for="wage">Prevailing Wage<span class="astrick">*</span></label></div><div class="grid-item"><select name="wage" id="wage" title="wage" onchange="agency()" required><option value="1">Yes</option><option value="0" selected>No</option></select><div id="agent"></div></div>'+
    '<div class="grid-item"><label for="billInst">Special Billing Instructions</label></div><div class="grid-item"><textarea id="billInst" name="billInst" rows="5" cols="50" maxlength="200"></textarea></div>'+
    '<div class="grid-item"><label for="seeAlso">See Also</label></div><div class="grid-item"><textarea id="seeAlso" name="seeAlso" rows="5" cols="50" maxlength="200"></textarea></div>'+
    '<div class="grid-item"><label for="autocad">AutoCAD Job</label></div><div class="grid-item"><input type="radio" name="autocad" id="yesAuto" value="Yes" title="autocad"> Yes<input type="radio" name="autocad" value="No" title="autocad" checked> No </div>'+
    '<div class="grid-item"><label for="gis">GIS Job</label></div><div class="grid-item"><input type="radio" id="gis" name="gis" value="Yes" title="gis"> Yes<input type="radio" name="gis" value="No" title="gis" checked> No</div><div class="grid-item"><label for="ProjSpecs">Project Specifications</label></div><div class="grid-item"><input type="radio" id="ProjSpecs" name="ProjSpecs" title="ProjSpecs" placeholder="Project Specifications"> Yes <input type="radio" name="ProjSpecs" title="ProjSpecs" placeholder="Project Specifications" checked> No</div>'
    + '</div>';
}

function page5() {
    return '<div class="grid-container">' + getTextField('Client Company', 'clientComp', clientComp, true) + 
    '<div class="grid-item"><label for="mail">Mail Lists</label></div><div class="grid-item"><input type="checkbox" id="openHouse" name="mail" title="openHouse" placeholder="Open House"> Open House<input type="checkbox" id="christmas" name="mail" title="christmas" placeholder="Christmas"> Christmas</div>' +
    getTextField('Client Abbreviation', 'clientAbbr', clientAbbr, false) + 
    getTextField('Client First Name', 'cFirst', clientFirst, true) + getTextField('Client Last Name', 'cLast', clientLast, true) + 
    '<div class="grid-item"><label for="relation">Client Relationship</label></div><div class="grid-item"><select name="relation" id="relation" title="Client Relationship"><option value="current">on-going</option><option value="past">past/former</option><option value="none" selected>none or distant</option></select></div>'+
    getTextField('Title', 'title', title, false) + getTextField("Address 1", 'addy1', addr1, true) + getTextField('Address 2', 'addy2', addr2, false) + 
    getTextField('City', 'city', city, true) + '<div class="grid-item"><label for="state">State<span class="astrick">*</span></label></div>'+
    '<div class="grid-item"><select name="state" id="state" size="1" required><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA" selected="selected">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="DC">Dist of Columbia</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option></select></div>'+
    '<div class="grid-item"><Label for="zip">Zip Code<span class="astrick">*</span></div><div class="grid-item"><input type="text" id="zip" name="zip" maxlength="20" required></div>' +
    '<div class="grid-item"><label for="WP">Work Phone<span class="astrick">*</span></label></div><div class="grid-item"><input type="tel" id="WP" name="WP" maxlength="20" required></div>'+
    '<div class="grid-item"><label for="HP">Home Phone</label></div><div class="grid-item"><input type="tel" id="HP" name="HP" maxlength="20"></div>'+
    '<div class="grid-item"><label for="cell">Cell</label></div><div class="grid-item"><input type="tel" id="cell" name="cell" maxlength="20"></div>'+
    '<div class="grid-item"><label for="fax">Fax</label></div><div class="grid-item"><input type="tel" id="fax" name="fax" maxlength="20"></div>'+
    '<div class="grid-item"><label for="email">Email<span class="astrick">*</span></label></div><div class="grid-item"><input type="email" id="email" name="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" maxlength="75" required></div>'+
    '</div>';
}

function page6() {
    return '<div class="grid-container">' +
    '<div class="grid-item"><label for="binder">Binder Size</label></div><div class="grid-item"><select name="binder" id="binder" title="Binder Size"><option value="NULL" selected>N/A</option><option value="0.5">1/2 Inch</option><option value="1">1 Inch</option><option value="1.5">1.5 inches</option><option value="2">2 inches</option><option value="3">3 inches</option></select></div>'+
    '<div class="grid-item"><label for="bindLoc">Binder Location</label></div><div class="grid-item"><input type="text" id="bindLoc" name="bindLoc"></div>' +
    '<div class="grid-item"><label for="describe">Description of Services<span class="astrick">*</span><br>Search projects with similar descriptions <a href="search.html" target="_blank">here</a>.</label></div><div class="grid-item"><textarea id="describe" name="describe" rows="5" cols="50" maxlength="63999" required></textarea></div></div>';
}

function page7() {
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

    if(openHouse && xmas) {
        mailList = 'Open House || Christmas';
    }
    else if(openHouse) {
        mailList = 'Open House';
    }
    else if(xmas){
        mailList = 'Christmas';
    }
    else {
        mailList = 'NULL';
    }

    let autoCadName = 'no';
    if(autoCad) {
        autoCadName = 'yes';
    }
    let gisName = 'no';
    if(GIS) {
        gisName = 'yes';
    }
    let speccy = 'no';
    if(projSpec) {
        speccy = 'yes'
    }

    let ServiceAgreement = 'No';
    if(ServAgree) {
        ServiceAgreement = 'Yes';
    }
    else {
        ifYesWhy = 'NA';
    }
    let breakedDesc = descOfServ.replaceAll('\n', '<br>');

    let waiver = (retainer == 'Waived by X') ? 'Waived by ' + senior:retainer;

    return '<div class="grid-container">' +
    '<div class="grid-item">Project Title' + '</div>'
    + '<div class="grid-item">' + projTitle + '</div>'+
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
    + '<div class="grid-item">' + projLoc + '</div>'+
    '<div class="grid-item">Project Latitude' + '</div>'
    + '<div class="grid-item">' + latitude + '</div>'+
    '<div class="grid-item">Project Longitude' + '</div>'
    + '<div class="grid-item">' + longitude + '</div>'+
    '<div class="grid-item">Project Keywords' + '</div>'
    + '<div class="grid-item">' + formatKeys + '</div>'+
    '<div class="grid-item">Other Keywords' + '</div>'
    + '<div class="grid-item">' + otherKeys + '</div>'+
    '<div class="grid-item">SHN Office' + '</div>'
    + '<div class="grid-item">' + officeName1 + '</div>'+
    '<div class="grid-item">Service Area' + '</div>'
    + '<div class="grid-item">' + servName + '</div>'+
    '<div class="grid-item">Total Contract' + '</div>'
    + '<div class="grid-item">' + totalContract + '</div>'+
    '<div class="grid-item">Exempt from Service Agreement?' + '</div>'
    + '<div class="grid-item">' + ServiceAgreement + '</div>'+
    '<div class="grid-item">If yes, why?' + '</div>'
    + '<div class="grid-item">' + ifYesWhy + '</div>'+
    '<div class="grid-item">Retainer' + '</div>'
    + '<div class="grid-item">' + waiver + '</div>'+
    '<div class="grid-item">Enter Amount' + '</div>'
    + '<div class="grid-item">' + retainAmnt + '</div>'+
    '<div class="grid-item">Profile Code' + '</div>'
    + '<div class="grid-item">' + profCodeName + '</div>'+
    '<div class="grid-item">Contract Type' + '</div>'
    + '<div class="grid-item">' + contactTypeName + '</div>'+
    '<div class="grid-item">Invoice Format' + '</div>'
    + '<div class="grid-item">' + invoiceName + '</div>'+
    '<div class="grid-item">Client Contract/PO #' + '</div>'
    + '<div class="grid-item">' + contractPONum + '</div>'+
    '<div class="grid-item">Outside Markup' + '</div>'
    + '<div class="grid-item">' + outsideMarkup + '</div>'+
    '<div class="grid-item">Prevailige Wage' + '</div>'
    + '<div class="grid-item">' + prevWage + '</div>'+
    '<div class="grid-item">Agency' + '</div>'
    + '<div class="grid-item">' + agency_name + '</div>'+
    '<div class="grid-item">Special Billing Instructions' + '</div>'
    + '<div class="grid-item">' + specBillInstr + '</div>'+
    '<div class="grid-item">See Also' + '</div>'
    + '<div class="grid-item">' + seeAlso + '</div>'+
    '<div class="grid-item">AutoCAD Job' + '</div>'
    + '<div class="grid-item">' + autoCadName + '</div>'+
    '<div class="grid-item">GIS Job' + '</div>'
    + '<div class="grid-item">' + gisName + '</div>'+
    '<div class="grid-item">Project Specifications' + '</div>'
    + '<div class="grid-item">' + speccy + '</div>'+
    '<div class="grid-item">Client Company' + '</div>'
    + '<div class="grid-item">' + clientComp + '</div>'+
    '<div class="grid-item">Mail Lists' + '</div>'
    + '<div class="grid-item">' + mailList + '</div>'+
    '<div class="grid-item">Client Abbreviation' + '</div>'
    + '<div class="grid-item">' + clientAbbr + '</div>'+
    '<div class="grid-item">Client First Name' + '</div>'
    + '<div class="grid-item">' + clientFirst + '</div>'+
    '<div class="grid-item">Client Last Name' + '</div>'
    + '<div class="grid-item">' + clientLast + '</div>'+
    '<div class="grid-item">Client Relationship' + '</div>'
    + '<div class="grid-item">' + clientRelation + '</div>'+
    '<div class="grid-item">Title' + '</div>'
    + '<div class="grid-item">' + title + '</div>'+
    '<div class="grid-item">Address 1' + '</div>'
    + '<div class="grid-item">' + addr1 + '</div>'+
    '<div class="grid-item">Address 2' + '</div>'
    + '<div class="grid-item">' + addr2 + '</div>'+
    '<div class="grid-item">City' + '</div>'
    + '<div class="grid-item">' + city + '</div>'+
    '<div class="grid-item">State' + '</div>'
    + '<div class="grid-item">' + state + '</div>'+
    '<div class="grid-item">Zip' + '</div>'
    + '<div class="grid-item">' + zip + '</div>'+
    '<div class="grid-item">Work Phone' + '</div>'
    + '<div class="grid-item">' + workPhone + '</div>'+
    '<div class="grid-item">Home Phone' + '</div>'
    + '<div class="grid-item">' + homePhone + '</div>'+
    '<div class="grid-item">Cell' + '</div>'
    + '<div class="grid-item">' + cell + '</div>'+
    '<div class="grid-item">Fax' + '</div>'
    + '<div class="grid-item">' + fax + '</div>'+
    '<div class="grid-item">Email' + '</div>'
    + '<div class="grid-item">' + email + '</div>'+
    '<div class="grid-item">Binder Size' + '</div>'
    + '<div class="grid-item">' + binderSize + '</div>'+
    '<div class="grid-item">Binder Location' + '</div>'
    + '<div class="grid-item">' + binderLoc + '</div>'+
    '<div class="grid-item">Description of Services' + '</div>'
    + '<div class="grid-item">' + breakedDesc + '</div>'+
    '</div>';
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
        totalContract = document.getElementById('contract').value;
        ServAgree = document.getElementById('yesAgreement').checked;
        retainer = document.getElementById('retainer').value;
        profCode = document.getElementById('code').value;
        profCodeName = document.getElementById('code').options[document.getElementById("code").selectedIndex].text;
        if(ServAgree) {
            ifYesWhy = document.getElementById('bruh').value.trim();
        }
        if(retainer == 'Enter Amount') {
            retainAmnt = document.getElementById('newAmount').value;
        }
        else if(retainer == 'Waived by X') {
            senior = document.getElementById('personnel').value.trim();
        }
    }
    else if(currPage == 4) {
        
        // Saves values into global variables.

        contactType = document.getElementById('contactType').value;
        contactTypeName = document.getElementById('contactType').options[document.getElementById("contactType").selectedIndex].text;
        invoiceFormat = document.getElementById('invoiceFormat').value;
        invoiceName = document.getElementById('invoiceFormat').options[document.getElementById("invoiceFormat").selectedIndex].text;
        contractPONum = document.getElementById('PO').value.trim();
        outsideMarkup = document.getElementById('OutMark').value;
        // outsideMarkupName = document.getElementById('OutMark').options[document.getElementById("OutMark").selectedIndex].text;
        prevWage = document.getElementById('wage').value;
        agency_name = (document.getElementById('wage').value == '1' && document.getElementById('agency').value != undefined && document.getElementById('agency').value != null)?document.getElementById('agency').value.trim():'';
        specBillInstr = document.getElementById('billInst').value.trim();
        seeAlso = document.getElementById('seeAlso').value.trim();
        autoCad = document.getElementById('yesAuto').checked;
        GIS = document.getElementById('gis').checked;
        projSpec = document.getElementById('ProjSpecs').checked;

        
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

        clientComp = document.getElementById('clientComp').value.trim();
        // mailList = document.getElementById('mail').value;
        openHouse = document.getElementById('openHouse').checked;
        xmas = document.getElementById('christmas').checked;
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
        homePhone = document.getElementById('HP').value.trim();
        cell = document.getElementById('cell').value.trim();
        fax = document.getElementById('fax').value.trim();
        email = document.getElementById('email').value.trim();

    }
    else if(currPage == 6) {

        // Saves values into global variables.

        binderSize = document.getElementById('binder').value;
        binderLoc = document.getElementById('bindLoc').value;
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

/**
*    Function reqField(currPage) is called by the "Next" button to evaluate the data before moving on.
*    If an input is bad, it will alert to the user "Please fill all required fields, and/or fix invalid fields"
*    and return false.
*    If inputs are valid, currPage is incremented by 1 and getPage(currPage) will be called to get the next page.
*   @param {Number} currPage
*/

function reqField(currPage) { // Parameter currPage is the page the user is currently on.
    
    // If-statements to determine the current page.
    if(currPage == 1) { // Evaluate page 1.

        // Saves values into global variables.

        projTitle = document.getElementById('promo').value.trim();
        projMgr = document.getElementById("projMgr").value;
        qaqc = document.getElementById("qaqc").value;
        startDate = document.getElementById('start').value;
        endDate = document.getElementById('end').value;

        // mySelects to determine if number of checked boxes is more than 1.

        let mySelects = document.querySelectorAll('input[name="Team"]:checked');

        // Test variables for illegal inputs.

        if(projMgr == 0 || qaqc == 0 || projTitle == '' || mySelects.length <= 0 || startDate == '' || startDate == undefined || endDate == '' || endDate == undefined || startDate > endDate) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
        
        if(projTitle.includes("#") || projTitle.includes("<") || projTitle.includes("$") || projTitle.includes("+") || projTitle.includes("%") || projTitle.includes(">") ||projTitle.includes("!") || projTitle.includes("`") || projTitle.includes("*") || projTitle.includes("'") || projTitle.includes("|") || projTitle.includes("{") || projTitle.includes("?") || projTitle.includes("\"") || projTitle.includes("=") || projTitle.includes("}") || projTitle.includes("/") || projTitle.includes(":") || projTitle.includes("\\") || projTitle.includes("@")) {
            alert("No special characters.  Please rename your project title.");
            return false;
        }

        if(projTitle[projTitle.length - 1] == '.') {
            alert("Please remove the period at the end of project title.");
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
        // console.log("Manager: " + mgrName + "\nQAQC manager: " + qaqcName);
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

    }
    else if(currPage == 3) { // Evaluate page 3.

        // Save values into global variables using saveChoices().

        saveChoices(3);

        // If user selected "Yes" on the servide agreement field, then we test if the user also inputted text into the explanation field.

        if(ServAgree && document.getElementById('bruh').value.trim() == '') { // If user didn't input anything, yell at them and return false.
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }
        else if (!ServAgree) { // If "No" was selected, we empty our variable.
            ifYesWhy = '';
        }
        // Test the values of the other variables.

        if(shnOffice == -1 || serviceArea == 0 || totalContract == '' || totalContract < 0 || retainer == 0 || profCode == -1) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        if(totalContract.length > 45) {
            alert("Keep total contract under 45 characters.");
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
        else if(retainer == 'Waived by X' && document.getElementById('personnel').value.trim() == '') {
            alert("Please enter personnel name.");
            return false;
        }
    }
    else if(currPage == 4) { // Evaluate page 4.

        // Saves values into global variables using saveChoices().

        saveChoices(4);

        // Test against required user selections and fields to determine if values are valid.

        if(contactType == 0 || contractPONum == '' || outsideMarkup == '' || outsideMarkup < 0 || outsideMarkup > 100) {
            alert("Please fill all required fields, and/or fix invalid fields.");
            return false;
        }

        if(contractPONum.length > 45 || outsideMarkup.length > 45) {
            alert("Keep Client Contract/PO # and/or Outside Markup under 45 characters.");
            return false;
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

        if(clientComp == '' || clientFirst == '' || clientLast == '' || addr1 == '' || city == '' || workPhone == '' || email == '' || zip == '') {
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
    else if(currPage == 6) {

        // Saves values into global variables using saveChoices().

        saveChoices(6);

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

/**
 * Validates wheither the entered string is a valid coordinate.
 * @param {String} cord
 * @returns {Boolean} true or false.
 */
// function isValidCoordinate(coordinate, isLat) {
//     // Regular expression pattern to match Delimited Degrees Minutes Seconds format
//     var coordinatePattern = (isLat)? /^-?([0-8]?[0-9]|90)°[0-5]?\d'([0-5]?\d(\.\d{1,3})?|60(\.0{1,3})?)?''[NSEW]$/ : /^-?([0-1]?[0-9]?[0-9]|180)°[0-5]?\d'([0-5]?\d(\.\d{1,3})?|60(\.0{1,3})?)?''[NSEW]$/; 
    
//     // Check if the coordinate matches the pattern
//     return coordinatePattern.test(coordinate);
//   }

/*
Function fillPage(newPage) is called either by getUser(num) or getPage(currPage) to fill the page with the user's previous selections, if any.
The call from getUser(num) or getPage(currPage) depends on if the page involved making any API calls.
In the case that it does, getUser(num) makes the call.  Otherwise, it's getPage(currPage).
*/

function fillPage(newPage) { // Parameter newPage is the page to load the previous user selections.

    // if-statements to determine which page to fill.

    if(newPage == 1) { // Fill page 1.

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
    else if(newPage == 3) { // Fill page 3.

        // Set previous or default values to fields.
        document.getElementById('office').value = shnOffice;
        this.document.querySelector('#service').value = serviceArea;
        this.document.querySelector('#contract').value = totalContract;
        this.document.querySelector('#yesAgreement').checked = ServAgree;
        this.document.querySelector('#retainer').value = retainer;

        // If service agreement was previously selected, select "Yes" and fill value of the external field.

        if(ServAgree) {
            // document.getElementById('yesAgreement').checked = true;
            expandWhy();
            this.document.getElementById('bruh').value = ifYesWhy;
        }

        // If retainer's "Enter Amount" was selcted, fill the external field with the previous value.

        if(retainer == 'Enter Amount') {
            customAmount();
            this.document.getElementById('newAmount').value = retainAmnt;
        }
        else if(retainer == 'Waived by X') {
            customAmount();
            this.document.getElementById('personnel').value = senior;
        }
    }
    else if(newPage == 4) { // Fill page 4.

        // Set previous or default values to fields.

        document.getElementById('contactType').value = contactType;
        document.getElementById('invoiceFormat').value = invoiceFormat;
        document.getElementById('PO').value = contractPONum;
        document.getElementById('OutMark').value = outsideMarkup;
        document.getElementById('wage').value = (prevWage == "0")?'0':"1";
        if(prevWage != "0") {
            agency();
            document.getElementById("agency").value = agency_name;
        }
        document.getElementById('billInst').value = specBillInstr;
        document.getElementById('seeAlso').value = seeAlso;
        document.getElementById('yesAuto').checked = autoCad;
        document.getElementById('gis').checked = GIS;
        document.getElementById('ProjSpecs').checked = projSpec;

        // Previous if-statement to prefill office location if user had previously selected.

        // if(autoCad) {
        //     whichOne();
        //     document.getElementById('yesOffice').value = ifYesWhichOffice;
        // }

    }
    else if(newPage == 5) { // Fill page 5.

        // Set previous or default values to fields.

        document.getElementById('clientComp').value = clientComp;
        document.getElementById('openHouse').checked = openHouse;
        document.getElementById('christmas').checked = xmas;
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
        document.getElementById('HP').value = homePhone;
        document.getElementById('cell').value = cell;
        document.getElementById('fax').value = fax;
        document.getElementById('email').value = email;
    }
    else if(newPage == 6) { // Fill page 6.

        // Set previous or default values to fields.

        document.getElementById('binder').value = binderSize;
        document.getElementById('bindLoc').value = binderLoc;
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

    document.getElementById("projMgr").value = projMgr;
    document.getElementById("qaqc").value = qaqc;

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
        fillPage(2);

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

        fillPage(4);
    }
    else if(currPage == 5) { // Load page 5.

        // Get contents of the page. No API calls for now, so we'll also append buttons.

        document.getElementById('projForm').innerHTML = page5() + '<div class="buttons"><button type="button" onclick="goBack(4)">Back</button><button type="button" onclick="reqField(5)">Next</button></div>';

        // Fill the page, since we don't have an API call.

        fillPage(5);
    }
    else if(currPage == 6) {

        // Get contents of the page. No API calls for now, so we'll also append buttons.

        document.getElementById('projForm').innerHTML = page6() + '<div class="buttons"><button type="button" onclick="goBack(5)">Back</button><button type="button" onclick="reqField(6)">Review</button></div>';

        // Fill the page, since we don't have an API call.

        fillPage(6);
    }
    else if(currPage == 7) { // Review Page

        // Get contents of the page. No API calls for now, so we'll also append buttons.

        document.getElementById('projForm').innerHTML = page7() + '<div id="sending"><div class="buttons"><button type="button" onclick="goBack(6)">Back</button><button type="button" onclick="preparePost()">Submit</button></div></div>';
    }
}

// Event listener to call getPage(1) when the window loads to start the Project Initiation Form on Page 1.

window.addEventListener("load", signIn(), false);

function starter(res) {
    activeUser = res.account.name;
    getPage(1);
}