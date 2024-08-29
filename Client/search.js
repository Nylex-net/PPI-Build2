function search() {
    let isEmpty = true;
    let projNum = '%';
    if(document.getElementById('projNum').value.trim() != '' && !isNaN(document.getElementById('projNum').value.trim())) {
        projNum = document.getElementById('projNum').value.trim() + '%';
        isEmpty = false;
    }

    let projTitle = '%';
    if(document.getElementById('projTitle').value.trim() != '') {
        projTitle += document.getElementById('projTitle').value.trim() + '%';
        isEmpty = false;
    }

    let description = '%';
    if(document.getElementById('desc').value.trim() != '') {
        description = '%' + document.getElementById('desc').value.trim() + '%';
        isEmpty = false;
    }

    let prevkeys = document.querySelectorAll('input[name="key"]:checked');
    let keyString = '';
    for(let key of prevkeys) {
        if(key.checked) {
            keyString += key.placeholder + ' || ';
        }
    }
    let others = document.getElementsByName("Otherkey");
    for(let other of others) {
        console.log(other.value);
        if(other.value.trim() != '') {
            keyString += format(other.value) + ' || ';
        }
    }
    if(keyString == '') {
        keyString = '%';
    }
    else {
        isEmpty = false;
    }

    if(isEmpty) {
        alert("No, I'm not returning the entire database >:(\nFill in some fields.");
        return false;
    }

    sql = '{"ProjectNumber":"'+ format(projNum) +'","Description":'+ JSON.stringify(formatMultiline(description)) +',"Keywords":"'+ format(keyString) +'", "ProjectTitle":"' + format(projTitle) + '"}';
    const jsonString = JSON.parse(JSON.stringify(sql));
    document.getElementById('results').innerHTML = 'Getting Projects...<br>This may take a moment.';

    var xhr = new XMLHttpRequest();
    var url = "http://ppi.shn-engr.com:3000/info";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function(e) {
        document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br><br><strong>Unable to connect.</strong>';
        console.log(e);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
            var json = JSON.parse(xhr.responseText);
            if(json.hasOwnProperty('process')) {
                document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br>Server error.';
            }
            else{
                document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br><br><strong>'+ resultString(json) +' Results:</strong><br>';
            }
        }
        else {
            document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br><br><strong>Something went wrong. Try again, or get help.</strong><br>';
        }
    };
    console.log(jsonString);
    try{
        xhr.send(jsonString);  // an error message typically looks like "{process: {…}, exitCode: 0}" in the console.
    }
    catch(err) {
        document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br><br><strong>Could not connect.</strong><br>';
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

function resultString(jsonRes) {
    if(jsonRes.length == 0) {
        document.getElementById('columnResults').innerHTML = 'None';
        return 0;
    }
    document.getElementById('columnResults').innerHTML = '';
    let result = '<table><tr><th><strong>Project/Promo ID</strong></th><th><strong>Billing Group</strong></th><th><strong>Project Manager</strong></th><th><strong>Project Title</strong></th><th><strong>Client Company</strong></th><th><strong>Description</strong></th></tr>';
    console.log(jsonRes);
    let numbers = [];
    let BillingMap = new Map();
    let managerMap = new Map();
    let titleMap = new Map();
    let compMap = new Map();
    let descMap = new Map();
    for(let i = 0; i < jsonRes.length; i++) {
        if(jsonRes[i].Project == null) {
            if(!numbers.includes(jsonRes[i].Promo)) {
                numbers.push(jsonRes[i].Promo);
            }
            BillingMap.set(jsonRes[i].Promo, 'NA');
            managerMap.set(jsonRes[i].Promo, jsonRes[i].Last + ', ' +  jsonRes[i].First);
            titleMap.set(jsonRes[i].Promo, jsonRes[i].ProjectTitle);
            compMap.set(jsonRes[i].Promo, jsonRes[i].ClientCompany);
            descMap.set(jsonRes[i].Promo, jsonRes[i].Description);
        }
        else {
            if(!numbers.includes(jsonRes[i].Project)) {
                numbers.push(jsonRes[i].Project);
            }
            managerMap.set(jsonRes[i].Project, jsonRes[i].Last + ', ' +  jsonRes[i].First);
            titleMap.set(jsonRes[i].Project, jsonRes[i].ProjectTitle);
            compMap.set(jsonRes[i].Project, jsonRes[i].ClientCompany);
            descMap.set(jsonRes[i].Project, jsonRes[i].Description);
            // result += '<div>' +  jsonRes[i].Project + '</div>'; //  '   Description: ' + jsonRes[i].Description +
            if(BillingMap.has(jsonRes[i].Project)) {
                if(BillingMap.get(jsonRes[i].Project).localeCompare('None') === 0) {
                    BillingMap.set(jsonRes[i].Project, jsonRes[i].Billing);
                }
                else {
                    BillingMap.set(jsonRes[i].Project, BillingMap.get(jsonRes[i].Project) + ' ' + jsonRes[i].Billing);
                }
            }
            else {
                if(jsonRes[i].Billing == null) {
                    BillingMap.set(jsonRes[i].Project, 'None');
                }
                else {
                    BillingMap.set(jsonRes[i].Project, jsonRes[i].Billing);
                }
            }
        }
        
        // result += '<br><strong>Keywords:</strong>' + jsonRes[i].Keywords;

        // if(jsonRes[i].Description.length > 30) {
        //     result += '<br><strong>Description:</strong> ' + jsonRes[i].Description.substring(0,30) + '...';
        // }
        // else {
        //     result += '<br><strong>Description:</strong> ' + jsonRes[i].Description;
        // }
        // result += "<br><br>";
    }

    numbers.forEach(num => {
        result += '<tr><td>' + num + '</td><td>' + BillingMap.get(num) + '</td><td>' + managerMap.get(num) + '</td><td>' + titleMap.get(num) + '</td><td>'
        + compMap.get(num) + '</td><td>' + descMap.get(num) + '</td></tr>';
    });
    
    document.getElementById('columnResults').innerHTML = result + '</table>';
    return numbers.length;
}

// Inserts a Label and checkbox for the table-based format the form has.
// Typically gets called within function getUsers() to give API called values a checkbox.

function getCheckbox(group, id, value, label) {
    return '<div><input type="checkbox" id="'+ id +'" name="' + group + '" title="'+ label +'" placeholder="' + value + '"/><label for="' + group + '">' + label + '</label></div>';
}


function getKeys() {
    let accessErr = false;
    fetch("http://ppi.shn-engr.com:3000/1").then(response => { // Makes a call for keywords.
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
        // keyIDMap.clear();         // A forEach loop to create the checkbox elements from our data retrieval.

        Object.entries(data).forEach((entry) => {
            keyEl.innerHTML += getCheckbox('key', entry[1].ID, entry[1].Keyword, entry[1].Keyword);
            // keyIDMap.set(entry[1].Keyword, getCheckbox('key', entry[1].ID, entry[1].Keyword, entry[1].Keyword));
        });

    }).catch(error => { // If an error occurs with our connection to the server, we'll write an error mesage into our table.

        document.getElementById('keywords').innerHTML = 'Oh no! Keywords couldn\'t be retrieved!';

        // Our real error will get written into the console.

        if(!accessErr) {
            console.log(error);
        }
    });
}

// Event listener to call getPage(1) when the window loads to start the Project Initiation Form on Page 1.

window.addEventListener("load", getKeys(), false);

// Event listeners for "Enter" press.

const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');

searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' || event.code === 13) {
        event.preventDefault();
        searchButton.click();
    }
});