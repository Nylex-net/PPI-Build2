let currResults = new Map();

function search() {
    if(document.getElementById('search').value.trim().length < 2) {
        alert('Please enter more.');
        return false;
    }
    document.getElementById('results').innerHTML = 'Searching...';

    let sql = '{"entry":"'+ format(document.getElementById('search').value.trim()) +'"}';
    const jsonString = JSON.parse(JSON.stringify(sql));



    const xhr = new XMLHttpRequest();
    const url = (document.getElementById('project').checked)?"https://e-hv-ppi.shn-engr.com:3001/searchProject":(document.getElementById('promo').checked)?"https://e-hv-ppi.shn-engr.com:3001/searchPromo":(document.getElementById('keywords').checked)?"https://e-hv-ppi.shn-engr.com:3001/searchKeyword":(document.getElementById('title').checked)?"https://e-hv-ppi.shn-engr.com:3001/searchTitle":(document.getElementById('desc').checked)?"https://e-hv-ppi.shn-engr.com:3001/searchDesc":"https://e-hv-ppi.shn-engr.com:3001/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function(e) {
        document.getElementById('results').innerHTML = '<button type="button" onclick="search()">Search</button><br><br><strong>Unable to connect.</strong>';
        console.log(e);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
            var json = JSON.parse(xhr.responseText);
            if(json.hasOwnProperty('sqlstate') || json.length <= 0) {
                console.log(json);
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
    let numRes = 0;
    currResults.clear();

    // For Projects.
    let filteredData = (jsonRes[0].reduce((accumulator, currentValue) => {
        if (!accumulator[currentValue.project_id]) {
          accumulator[currentValue.project_id] = true;
          accumulator.result.push(currentValue);
        }
        return accumulator;
      }, { result: [] }).result).sort((a, b) => a.project_id - b.project_id);
    // console.log(filteredData);
    if(jsonRes.length == 0) {
        document.getElementById('columnResults').innerHTML = 'None';
        return 0;
    }
    document.getElementById('columnResults').innerHTML = '';
    let result = '<table id="Rolo"><tr><th><strong>Project ID</strong></th><th><strong>Billing Group</strong></th><th><strong>Promo ID</strong></th><th><strong>Project Manager</strong></th><th><strong>Project Title</strong></th><th><strong>Client Company</strong></th><th>Display</th><th>Edit</th></tr>';
    console.log(jsonRes);

    filteredData.forEach(num => {
        var id = num.ID;
        if(!currResults.has(id)) {
            currResults.set(id, num);
        }
        result += '<tr><td>' + ((num.closed == 1)?'<strong>X</strong> ':'')+num.project_id + '</td><td>' + ((num.BillGrp == null || num.BillGrp == undefined)?'':num.BillGrp) + '</td><td>' +
        ((num.promo_id == null || num.promo_id == undefined)?'':num.promo_id) + '</td><td>' + num.last + ", " + num.first + '</td><td>' +
        num.project_title + '</td><td>' + num.client_company + '</td><td>' + 
        '<button type="button" onclick="openPDF(\''+ ((num.project_id == null || num.project_id == undefined || num.project_id == '')?num.promo_id:num.project_id) +'\', '+ ((num.closed == 1)?true:false) +')">Display</button>'+ '</td><td>'+ 
        '<button type="button" onclick="edit(\''+ num.ID +'\', 0);">Edit</>'+'</td></tr>';
    });
    numRes = filteredData.length;

    // For Promos.
    filteredData = (jsonRes[1].reduce((accumulator, currentValue) => {
        if (!accumulator[currentValue.promo_id]) {
          accumulator[currentValue.promo_id] = true;
          accumulator.result.push(currentValue);
        }
        return accumulator;
      }, { result: [] }).result).sort((a, b) => a.promo_id - b.promo_id);

      filteredData.forEach(num => {
        var id = num.ID;
        if(!currResults.has(id)) {
            currResults.set(id, num);
        }
        result += '<tr><td>' + ((num.closed == 1)?'<strong>X</strong> ':'')+ '</td><td>' + ((num.BillGrp == null || num.BillGrp == undefined)?'':num.BillGrp) + '</td><td>' +
        ((num.promo_id == null || num.promo_id == undefined)?'':num.promo_id) + '</td><td>' + num.last + ", " + num.first + '</td><td>' +
        num.promo_title + '</td><td>' + num.client_company + '</td><td>' + 
        '<button type="button" onclick="openPDF(\''+ ((num.project_id == null || num.project_id == undefined || num.project_id == '')?num.promo_id:num.project_id) +'\', '+ ((num.closed == 1)?true:false) +')">Display</button>'+ '</td><td>'+ 
        '<button type="button" onclick="edit(\''+ num.ID +'\', 1);">Edit</>'+'</td></tr>';
    });
    numRes += filteredData.length;

    // For Billing groups.
    filteredData = (jsonRes[2].reduce((accumulator, currentValue) => {
        if (!accumulator[[currentValue.project_id, currentValue.group_number]]) {
          accumulator[[currentValue.project_id, currentValue.group_number]] = true;
          accumulator.result.push(currentValue);
        }
        return accumulator;
      }, { result: [] }).result).sort((a, b) => a.project_id - b.project_id);
      
      filteredData.forEach(num => {
        var id = num.ID;
        if(!currResults.has(id)) {
            currResults.set(id, num);
        }
        result += '<tr><td>' + ((num.closed == 1)?'<strong>X</strong> ':'')+ num.project_id +'</td><td>' + num.group_number + '</td><td></td><td>' + num.last + ", " + num.first + '</td><td>' +
        num.group_name + '</td><td>' + num.client_company + '</td><td>' + 
        '<button type="button" onclick="openPDF(\''+ num.project_id +'\', '+ ((num.closed == 1)?true:false) +')">Display</button>'+ '</td><td>'+ 
        '<button type="button" onclick="edit(\''+ num.ID +'\', -1);">Edit</>'+'</td></tr>';
    });
    numRes += filteredData.length;
    // result = (jsonRes.length >= 500) ? '<p>Some results may have been filtered due to too large of search results.</p><br>' + result:result;
    document.getElementById('columnResults').innerHTML = result + '</table>';
    return numRes;
}

/**
 * Builds URL to open project and promo PDFs.
 */

async function openPDF(numSearch, closed) {
    if(numSearch == undefined || numSearch == null) {
        alert("Something about the number is wrong.");
        return;
    }
    if(numSearch.trim() == '') {
        alert("Something about the number is wrong.");
        return;
    }
    numSearch = numSearch.trim();
    let dir = 'P:';
    await fetch('https://e-hv-ppi.shn-engr.com:3001/getPath', {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "responseType":"application/pdf",
            
        },
        body: JSON.parse(JSON.stringify('{"ProjectID":"' + numSearch + '","isClosed":"'+ closed +'"}'))
    })
    .then(path => {
        return path.arrayBuffer();
    })
    .then(path => {
        const blob = new Blob([path], {type: 'application/pdf'});
        window.open(URL.createObjectURL(blob), "_blank")
        // const link = document.createElement('a');
        // link.href = URL.createObjectURL(blob);
        // link.download = "Initiation.pdf";
        // link.click();
    })
    // // Create an object URL for the response
    // .then((response) => {
    //     console.log(response);
    //     const blob = response.blob();
    //     const arrayBuffer = new Response(blob).arrayBuffer();
    //     const pdfData = new Uint8Array(arrayBuffer);
    // })
    // Update image
    // .then((url) => console.log((url)))
    .catch((err) => console.error(err));

    // if(numSearch[1] >= 8) { // A project from between 1980 and 2000.
    //     dir += '/19' + numSearch[1] + numSearch[2];
    // }
    // else {
    //     dir += '/20' + numSearch[1] + numSearch[2];
    // }

    // const handle = await window.showDirectoryPicker();
    // dir = await handle.getDirectory(dir);

}

function getDir(id) {
    if(id == 0) {
        return '/Eureka';
    }
    else if(id == 1) {
        return '/Arcata';
    }
    else if(id == 2) {
        return '/KFalls';
    }
    else if(id == 4 || id == 7) {
        return '/Willits';
    }
    else if(id == 5) {
        return '/Redding';
    }
    else if(id == 6) {
        return '/Coosbay';
    }

    return '/Eureka';
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
    + '<div class="grid-item">' + await fetch('https://e-hv-ppi.shn-engr.com:3001/qaqc', {
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
    + '<div class="grid-item">' + await fetch('https://e-hv-ppi.shn-engr.com:3000/mgrs', {
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

function edit(ID, init) {
    window.sessionStorage.setItem('userObject', JSON.stringify({
        ID: ID,
        Identifier: init
    }));
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