let currResults = new Map();

function search() {
    if(document.getElementById('search').value.trim().length < 2) {
        alert('Please enter more.');
        return false;
    }
    document.getElementById('results').innerHTML = 'Searching...';

    let sql = '{"entry":"'+ format(document.getElementById('search').value.trim()) +'"}';
    const jsonString = JSON.parse(JSON.stringify(sql));

    var xhr = new XMLHttpRequest();
    var url = "http://ppi.shn-engr.com:3001/search";
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
                document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br><br><strong>' + resultString(json) + ' Results:</strong><br>';
            }
        }
        else {
            document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br><br><strong>Still processing results.\nIf this page doesn\'t finish within a few minutes, contact help.</strong><br>';
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
    let result = '<table id="Rolo"><tr><th><strong>Project/Promo ID</strong></th><th><strong>Billing Group</strong></th><th><strong>Project Manager</strong></th><th><strong>Project Title</strong></th><th><strong>Client Company</strong></th><th><strong>Description</strong></th><th><strong>More</strong></th></tr>';
    console.log(jsonRes);
    let numbers = [];
    let BillingMap = new Map();
    let managerMap = new Map();
    currResults.clear();
    let unknownCount = 1;
    for(let i = 0; i < jsonRes.length; i++) {
        if(jsonRes[i].Projectid == null || jsonRes[i].Projectid == '') {
            if(jsonRes[i].PromoId == null || jsonRes[i].PromoId == '') {
                jsonRes[i].PromoId = 'unknown' + unknownCount;
                unknownCount++;
            }
            if(!numbers.includes(jsonRes[i].PromoId)) {
                numbers.push(jsonRes[i].PromoId);
            }
            BillingMap.set(jsonRes[i].PromoId, 'NA');
            managerMap.set(jsonRes[i].PromoId, jsonRes[i].Last + ', ' +  jsonRes[i].First);
            jsonRes[i].ProjectTitle = (jsonRes[i].ProjectTitle == null) ? '':jsonRes[i].ProjectTitle;
            currResults.set(jsonRes[i].PromoId, jsonRes[i]);
        }
        else {
            if(!numbers.includes(jsonRes[i].Projectid)) {
                numbers.push(jsonRes[i].Projectid);
            }
            managerMap.set(jsonRes[i].Projectid, jsonRes[i].Last + ', ' +  jsonRes[i].First);
            jsonRes[i].ProjectTitle = (jsonRes[i].ProjectTitle == null) ? '':jsonRes[i].ProjectTitle;
            currResults.set(jsonRes[i].Projectid, jsonRes[i]);
            // result += '<div>' +  jsonRes[i].Project + '</div>'; //  '   Description: ' + jsonRes[i].Description +
            if(BillingMap.has(jsonRes[i].Projectid)) {
                if (jsonRes[i].BillGrp != null && jsonRes[i].BillGrp != '' && BillingMap.get(jsonRes[i].Projectid) != 'NA') { // jsonRes[i].BillingTitle
                    var mapper = BillingMap.get(jsonRes[i].Projectid);
                    mapper.set(jsonRes[i].BillGrp, (jsonRes[i].BillingTitle == null || jsonRes[i].BillingTitle == '') ? '[NO TITLE]':jsonRes[i].BillingTitle);
                }
            }
            else {
                if(jsonRes[i].BillGrp == null || jsonRes[i].BillGrp == '') {
                    BillingMap.set(jsonRes[i].Projectid, new Map());
                }
                else {
                    BillingMap.set(jsonRes[i].Projectid, new Map([[jsonRes[i].BillGrp, (jsonRes[i].BillingTitle == null || jsonRes[i].BillingTitle == '') ? '[NO TITLE]':jsonRes[i].BillingTitle]]));
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
        if(num.includes('unknown')) {
            result += '<tr><td>Unknown</td><td>' + billGrpString(BillingMap.get(num)) + '</td><td>' + managerMap.get(num) + '</td><td>' + currResults.get(num).ProjectTitle + '</td><td>'
        + currResults.get(num).ClientCompany1 + '</td><td>' + currResults.get(num).DescriptionService + '</td></tr>';
        }
        else {
            result += '<tr><td>' + num + '</td><td>' + billGrpString(BillingMap.get(num)) + '</td><td>' + managerMap.get(num) + '</td><td>' + currResults.get(num).ProjectTitle + '</td><td>'
        + currResults.get(num).ClientCompany1 + '</td><td>' + currResults.get(num).DescriptionService + '</td><td><button type="button" id="'+ num +'" onclick="viewer(\''+ num +'\')">More</button></td></tr>';
        }
    });
    // result = (jsonRes.length >= 500) ? '<p>Some results may have been filtered due to too large of search results.</p><br>' + result:result;
    document.getElementById('columnResults').innerHTML = result + '</table>';
    return numbers.length;
}

function expand(ID) {
    let index = 0;
    while(document.getElementById('Rolo').rows[index].cells[0].innerText != ID.toString() && index < document.getElementById('Rolo').rows.length) {
        index++;
    }
    if(index >= document.getElementById('Rolo').rows.length) {
        alert("Error: Couldn't find row.");
        return;
    }
    let newRow = document.getElementById('Rolo').insertRow(index + 1);
    let newCell0 = newRow.insertCell(0);
    let newCell1 = newRow.insertCell(1);
    let newCell2 = newRow.insertCell(2);
    let newCell3 = newRow.insertCell(3);
    let newCell4 = newRow.insertCell(4);
    let newCell5 = newRow.insertCell(5);
    let newCell6 = newRow.insertCell(6);
    newCell0.innerHTML = "Client Company: " + currResults.get(ID.toString()).ClientCompany1 + "<br>Name: " + currResults.get(ID.toString()).ClientContactFirstName1 + " " + currResults.get(ID.toString()).ClientContactLastName1;
    newCell1.innerHTML = "Address: "+ currResults.get(ID.toString()).Address1_1 +"<br>" + ((currResults.get(ID.toString()).Address2_1 != undefined && currResults.get(ID.toString()).Address2_1 != null) ? "2nd Address: " + currResults.get(ID.toString()).Address2_1 + "<br>":"2nd Address:<br>") + currResults.get(ID.toString()).City1 +", "+ currResults.get(ID.toString()).State1 + " " + currResults.get(ID.toString()).Zip1;
    newCell2.innerHTML = ((currResults.get(ID.toString()).PhoneH1 != null && currResults.get(ID.toString()).PhoneH1 != undefined) ? 'Home Phone: ' + currResults.get(ID.toString()).PhoneH1:'Home Phone:') + '<br>' + ((currResults.get(ID.toString()).Cell1 != null && currResults.get(ID.toString()).Cell1 != undefined) ? 'Cell: ' + currResults.get(ID.toString()).Cell1:'Cell:') + '<br>' + ((currResults.get(ID.toString()).Fax1 != null && currResults.get(ID.toString()).Fax1 != undefined) ? 'Fax: ' + currResults.get(ID.toString()).Fax1:'Fax:')
    + "<br>Email: " + currResults.get(ID.toString()).Email1;
    newCell3.innerHTML = '';
    newCell4.innerHTML = '';
    newCell6.innerHTML = '<button type="button" id="edit" onclick="edit(\''+ ID +'\');">Edit</button>';

    document.getElementById(ID).innerHTML = 'Less';
    document.getElementById(ID).onclick = function() {hide(ID.toString());};
}

function hide(ID) {
    let index = 0;
    while(document.getElementById('Rolo').rows[index].cells[0].innerHTML != ID && index < document.getElementById('Rolo').rows.length) {
        index++;
    }
    if(index >= document.getElementById('Rolo').rows.length) {
        alert("Error: Couldn't find row.");
        return;
    }
    document.getElementById('Rolo').deleteRow(index + 1);
    document.getElementById(ID).innerHTML = 'More';
    document.getElementById(ID).onclick = function() {expand(ID.toString());};
}

function billGrpString(billMap) {
    if(typeof billMap != 'object' || billMap.size == 0) {
        return 'NA';
    }
    sortedMap = new Map([...billMap.entries()].sort());
    let result = '';
    for(let [key, value] of sortedMap) {
        result += '<strong>' + key + '</strong> - ' + value + '<br>';
    }
    return result;
}

async function viewer(num) {
    let json = currResults.get(num);
    scrollObj.prevWindow = document.body.innerHTML;
    for(let key of Object.keys(json)) {
        if(json[key] == null || json[key] == undefined) {
            json[key] = '';
        }
    }
    const butts = '<button type="button" onclick="document.body.innerHTML=scrollObj.prevWindow;scroll(scrollObj.scrollX,scrollObj.scrollY);">Back</button><button type="button" id="edit" onclick="edit(\''+ num +'\');">Edit</button>';
    document.body.innerHTML = '<div class="buttons">' + butts + '</div><div class="grid-container">' +
    '<div class="grid-item">Project Title' + '</div>'
    + '<div class="grid-item">' + json.ProjectTitle + '</div>'+
    '<div class="grid-item">Project Manager' + '</div>'
    + '<div class="grid-item">' + json.Last + ", " + json.First + '</div>'+
    '<div class="grid-item">QAQC Person' + '</div>'
    + '<div class="grid-item">' + await fetch('http://ppi.shn-engr.com:3001/qaqc', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.parse(JSON.stringify('{"id":' + json.QA_QCPerson + '}'))
    }).then(response => {
        return response.json();
    }).then(name => {
        console.log(name);
        return name[0].Last + ", " + name[0].First;
    }).catch(error => {
        console.log(error);
        return '[Unable to Display]';
    }) + '</div>'+
    '<div class="grid-item">Team Members' + '</div>'
    + '<div class="grid-item">' + await fetch('http://ppi.shn-engr.com:3000/mgrs', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.parse(JSON.stringify('{"Team":"' + json.TeamMembers + '"}'))
    }).then(response => {
        return response.json();
    }).then(names => {
        console.log(names);
        result = '';
        if(names.hasOwnProperty("process")) {
            throw names.process;
        }
        for(let name of Object.values(names)) {
            result += name.First + " " + name.Last + ", ";
        }
        return result.substring(0,result.length - 2);
    }).catch(error => {
        console.log(error);
        return '[Unable to Display]';
    }) + '</div>'+
    '<div class="grid-item">Start Date' + '</div>'
    + '<div class="grid-item">' + json.StartDate + '</div>'+
    '<div class="grid-item">End Date' + '</div>'
    + '<div class="grid-item">' + json.ClostDate + '</div>'+
    '<div class="grid-item">Project Location Descriptor' + '</div>'
    + '<div class="grid-item">' + json.ProjectLoation + '</div>'+
    '<div class="grid-item">Project Latitude' + '</div>'
    + '<div class="grid-item">' + json.Lattitude + '</div>'+
    '<div class="grid-item">Project Longitude' + '</div>'
    + '<div class="grid-item">' + json.Longitude + '</div>'+
    '<div class="grid-item">Project Keywords' + '</div>'
    + '<div class="grid-item">' + json.ProjectKeywords + '</div>'+
    '<div class="grid-item">SHN Office' + '</div>'
    + '<div class="grid-item">' + json.SHNOffice + '</div>'+
    '<div class="grid-item">Service Area' + '</div>'
    + '<div class="grid-item">' + json.ServiceArea + '</div>'+
    '<div class="grid-item">Total Contract' + '</div>'
    + '<div class="grid-item">' + json.ToatlContract + '</div>'+
    '<div class="grid-item">Retainer' + '</div>'
    + '<div class="grid-item">' + json.RetainerPaid + '</div>'+
    '<div class="grid-item">Profile Code' + '</div>'
    + '<div class="grid-item">' + json.ProfileCode + '</div>'+
    '<div class="grid-item">Contract Type' + '</div>'
    + '<div class="grid-item">' + json.ContractType + '</div>'+
    '<div class="grid-item">Invoice Format' + '</div>'
    + '<div class="grid-item">' + json.InvoiceFormat + '</div>'+
    '<div class="grid-item">Outside Markup' + '</div>'
    + '<div class="grid-item">' + json.OutsideMarkup + '</div>'+
    '<div class="grid-item">Prevailige Wage' + '</div>'
    + '<div class="grid-item">' + json.PrevailingWage + '</div>'+
    '<div class="grid-item">Special Billing Instructions' + '</div>'
    + '<div class="grid-item">' + json.SpecialBillingInstructins + '</div>'+
    '<div class="grid-item">See Also' + '</div>'
    + '<div class="grid-item">' + json.SEEALSO + '</div>'+
    '<div class="grid-item">AutoCAD Job' + '</div>'
    + '<div class="grid-item">' + json.AutoCAD_Project + '</div>'+
    '<div class="grid-item">GIS Job' + '</div>'
    + '<div class="grid-item">' + json.GIS_Project + '</div>'+
    '<div class="grid-item">Project Specifications' + '</div>'
    + '<div class="grid-item">' + json.Project_Specifications + '</div>'+
    '<div class="grid-item">Client Company' + '</div>'
    + '<div class="grid-item">' + json.ClientComapny1 + '</div>'+
    '<div class="grid-item">Mail Lists' + '</div>'
    + '<div class="grid-item">' + json.OfficeMailingLists1 + '</div>'+
    '<div class="grid-item">Client Abbreviation' + '</div>'
    + '<div class="grid-item">' + json.ClientAbbrev1 + '</div>'+
    '<div class="grid-item">Client First Name' + '</div>'
    + '<div class="grid-item">' + json.ClientContactFirstName1 + '</div>'+
    '<div class="grid-item">Client Last Name' + '</div>'
    + '<div class="grid-item">' + json.ClientContactLastName1 + '</div>'+
    '<div class="grid-item">Title' + '</div>'
    + '<div class="grid-item">' + json.Title1 + '</div>'+
    '<div class="grid-item">Address 1' + '</div>'
    + '<div class="grid-item">' + json.Address1_1 + '</div>'+
    '<div class="grid-item">Address 2' + '</div>'
    + '<div class="grid-item">' + json.Address2_1 + '</div>'+
    '<div class="grid-item">City' + '</div>'
    + '<div class="grid-item">' + json.City1 + '</div>'+
    '<div class="grid-item">State' + '</div>'
    + '<div class="grid-item">' + json.State1 + '</div>'+
    '<div class="grid-item">Zip' + '</div>'
    + '<div class="grid-item">' + json.Zip1 + '</div>'+
    '<div class="grid-item">Work Phone' + '</div>'
    + '<div class="grid-item">' + json.PhoneW1 + '</div>'+
    '<div class="grid-item">Home Phone' + '</div>'
    + '<div class="grid-item">' + json.PhoneH1 + '</div>'+
    '<div class="grid-item">Cell' + '</div>'
    + '<div class="grid-item">' + json.Cell1 + '</div>'+
    '<div class="grid-item">Fax' + '</div>'
    + '<div class="grid-item">' + json.Fax1 + '</div>'+
    '<div class="grid-item">Email' + '</div>'
    + '<div class="grid-item">' + json.Fax1 + '</div>'+
    '<div class="grid-item">Binder Size' + '</div>'
    + '<div class="grid-item">' + json.BinderSize + '</div>'+
    '<div class="grid-item">Binder Location' + '</div>'
    + '<div class="grid-item">' + json.BinderLocation + '</div>'+
    '<div class="grid-item">Description of Services' + '</div>'
    + '<div class="grid-item">' + json.DescriptionService + '</div>'+
    '</div><div class="buttons">' + butts + '</div>';
    scroll(0,0);
}

function edit(ID) {
    window.sessionStorage.setItem('userObject', JSON.stringify(currResults.get(ID)));
    window.location.replace("editMe.html");
}

const scrollObj = {
    scrollX: this.scrollX,
    scrollY: this.scrollY,
    prevWindow: ''
};

window.addEventListener("scroll", (event) => {
    scrollObj.scrollY = this.scrollY;
    scrollObj.scrollX = this.scrollX;
});