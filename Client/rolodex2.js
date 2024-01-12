let globalID;
let editing = null;
let activeUser;
const HOST = 'e-hv-ppi';
/**
 * find() takes user input to search the database.
 */
function find() {
    let mySearch = format(document.getElementById('search').value.trim());
    if(mySearch.length <= 0) {
        alert("Please enter something.");
        return false;
    }
    let searchby = 'All';
    if(document.getElementById('job').checked) {
        searchby = document.getElementById('job').value; // Job
    }
    else if(document.getElementById('first').checked) {
        searchby = document.getElementById('first').value; // First
    }
    else if(document.getElementById('last').checked) {
        searchby = document.getElementById('last').value; // Last
    }
    else if(document.getElementById('comp').checked) {
        searchby = document.getElementById('comp').value; // Comp
    }
    document.getElementById('results').innerHTML = 'Searching...';
    fetch('https://e-hv-ppi.shn-engr.com:3000/rolodex', {
        method: 'POST',
        headers: {
            'Accept':'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.parse(JSON.stringify('{"search":"' + mySearch + '", "by":"' + searchby + '"}'))
    })
    .then(response => response.json())
    .then(response => toTable(response))
    .catch(error => {
        console.log(error);
        document.getElementById('results').innerHTML = 'An error occurred.';
    });
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

function toTable(json) {
    currResults.result = null;
    currResults.map.clear();
    console.log(json);
    if(json[0].length + json[1].length + json[2].length == 0) {
        document.getElementById('results').innerHTML = 'No results';
        return;
    }
    let syntax = '<table><tr><th><strong>Company</strong></th><th><strong>Name</strong></th><th><strong>Job Title</strong></th><th><strong>Address</strong></th><th><strong>Work Phone</strong></th><th><strong>Email</strong></th><th><strong>Edit</strong></th></tr>';
    json[0].forEach(entry => {
        currResults.map.set(entry.ID, entry);
        syntax += '<tr><td>'+ entry.client_company +'</td><td>'+ entry.last_name + ', ' + entry.first_name +'</td><td>' + (entry.job_title == null?'':entry.job_title) + '</td><td>'+ (entry.address1 == null?'':entry.address1) + '<br>' + (entry.city == null?'':entry.city) + ', ' + entry.state + ' ' + (entry.zip_code == null?'':entry.zip_code) + '</td><td>'+ (entry.work_phone == null?'':entry.work_phone) +'</td><td>'+ (entry.email == null?'':entry.email) +'</td><td><button type="button" id="'+ entry.ID + '" onclick="edit('+ entry.ID +');">Edit</button></td></tr>';
        // syntax += addRow(entry, true);
    });
    syntax += '</table><br><br>';
    syntax += '<h3>Projects and Promos</h3><table><tr><th><strong>ID</strong></th><th><strong>Company</strong></th><th><strong>Name</strong></th><th><strong>Job Title</strong></th><th><strong>Address</strong></th><th><strong>Phone</strong></th><th><strong>Email</strong></th></tr>';
    json[1].forEach(entry => {
        // currResults.map.set(entry.project_id, entry);
        syntax += addRow(entry);
    });
    json[2].forEach(entry => {
        // currResults.map.set(entry.promo_id, entry);
        syntax += addRow(entry);
    });
    syntax += '</table>';
    if(json[0].length+ json[1].length + json[2].length === 0) {
        document.getElementById('results').innerHTML = 'No Results<br>';
    }
    else {
        document.getElementById('results').innerHTML = (json[0].length + json[1].length + json[2].length) + ' Total Results.  '+ json[0].length  +' Results in Rolodex and '+ (json[1].length + json[2].length) +' Results in PPI.<br>' + syntax;
        // currResults.result =  (json[0].recordset.length + json[1].recordset.length) + ' Results<br>' + syntax;
    }
}

function addRow(entry) {
    let row = '<tr>';
    if(entry.hasOwnProperty('project_id')) {
        row += '<td>' + entry.project_id + '</td>';
    }
    else {
        row += '<td>' + entry.promo_id + '</td>';
    }
    row += (entry.client_company != null || entry.client_company != undefined) ? '<td>'+ entry.client_company +'</td>':'<td></td>';
    row += (entry.last_name != null || entry.last_name != undefined) ? '<td>'+ entry.last_name +", ":'<td>';
    row += (entry.first_name != null || entry.first_name != undefined) ? entry.first_name + '</td>':'</td>';
    row += (entry.job_title != null || entry.job_title != undefined) ? '<td>'+ entry.job_title +'</td>':'<td></td>';
    row += (entry.address1 != null || entry.address1 != undefined) ? '<td>'+ entry.address1 + ', ' + entry.city + ', ' + entry.state + ' ' + entry.zip_code + '</td>':'<td></td>';
    row += (entry.work_phone != null || entry.work_phone != undefined) ? '<td>'+ entry.work_phone +'</td>':'<td></td>';
    row += ((entry.email != null || entry.email != undefined) && entry.email.includes('@')) ? '<td><a href="mailto:'+entry.email+'">'+ entry.email +'</a></td>':'<td></td>';
    // row += (isProj) ? '<td><button type="button" id="'+ entry.ID + '" onclick="edit(\''+ entry.project_id +'\', true);">Edit</button></td>':'<td><button type="button" id="'+ entry.ID + '" onclick="edit(\''+ entry.promo_id + '\', false);">Edit</button></td>';
    return row + '</tr>';
}

function edit(id) {
    globalID = id;
    editing = true;
    signIn();
}

function add() {
    editing = false;
    signIn();
}

function starter(res) {
    if(typeof editing !== 'boolean') { // Don't add or edit entry if the user is only signing in. 
        return;
    }
    state.scroller = window.scrollY;
    state.prevHTML = document.getElementById('inserter').innerHTML;
    activeUser = res.account.name;
    if(editing) {
        let json = currResults.map.get(globalID);
        for(let key of Object.keys(json)) {
            json[key] = (json[key] == null || json[key] == undefined ? '':json[key]);
        }

        document.getElementById('inserter').innerHTML = '<div class="container"><div class="row">' + 
        '<div class="col-lg-4"><label for="comp">Company </label></div><div class="col-lg-8"><input type="text" id="comp" name="comp" maxlength="255" value="'+json.client_company+'"/></div>' +
        '<div class="col-lg-4"><label for="comp">Company Abbreviation</label></div><div class="col-lg-8"><input type="text" id="compAbbrev" name="compAbbrev" maxlength="255" value="'+json.client_abbreviation+'"/></div>' +
        '<div class="col-lg-4"><label for="first">First Name </label></div><div class="col-lg-8"><input type="text" id="first" name="first" maxlength="255" value="'+ json.first_name +'" required/></div>'+
        '<div class="col-lg-4"><label for="last"> Last Name </label></div><div class="col-lg-8"><input type="text" id="last" name="last" maxlength="255" value="'+ json.last_name +'" required/></div>'+
        '<div class="col-lg-4"><label for="relation"> Relationship </label></div><div class="col-lg-8"><input type="text" id="relation" name="relation" maxlength="255" value="'+ json.relationship +'"/></div>'+
        '<div class="col-lg-4"><label for="title">Job Title </label></div><div class="col-lg-8"><input type="text" id="title" name="title" maxlength="255" value="'+ json.job_title +'"/></div>'+
        '<div class="col-lg-4"><label for="add1">Address </label></div><div class="col-lg-8"><input type="text" id="add1" name="add1" maxlength="255" value="'+ json.address1 +'"/></div>'+
        '<div class="col-lg-4"><label for="add2">Second Adddress </label></div><div class="col-lg-8"><input type="text" id="add2" name="add2" maxlength="255" value="'+ json.address2 +'"/></div>'+
        '<div class="col-lg-4"><label for="city">City </label></div><div class="col-lg-8"><input type="text" id="city" name="city" maxlength="255" value="'+ json.city +'"/></div>'+
        '<div class="col-lg-4"><label for="state">State </label></div><div class="col-lg-8"><select name="state" id="state" size="1"><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA" selected="selected">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="DC">Dist of Columbia</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option></select></div>'+
        '<div class="col-lg-4"><label for="zip">Zip </label></div><div class="col-lg-8"><input type="text" id="zip" name="zip" maxlength="20" value="'+ json.zip_code +'"></div>'+
        '<div class="col-lg-4"><label for="WP">Work Phone </label></div><div class="col-lg-8"><input type="tel" id="WP" name="WP" maxlength="12" value="'+json.work_phone+'"></div>'+
        '<div class="col-lg-4"><label for="ext">Work Extension </label></div><div class="col-lg-8"><input type="text" id="ext" name="ext" maxlength="3" value="'+json.extension+'"></div>'+
        '<div class="col-lg-4"><label for="HP">Home Phone </label></div><div class="col-lg-8"><input type="tel" id="HP" name="HP" value="'+json.home_phone+'" maxlength="12"></div>'+
        '<div class="col-lg-4"><label for="cell">Cell </label></div><div class="col-lg-8"><input type="tel" id="cell" name="cell" value="'+ json.cell +'" maxlength="12"></div>'+
        '<div class="col-lg-4"><label for="fax">Fax </label></div><div class="col-lg-8"><input type="tel" id="fax" name="fax" value="'+ json.fax +'" maxlength="12"></div>'+
        '<div class="col-lg-4"><label for="email">Email </label></div><div class="col-lg-8"><input type="email" id="email" name="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" maxlength="75" value="'+ json.email +'" ></div>'+
        '</div></div>'+
        '<div id="submitter"><button type="button" onclick="back()">Back</button><button type="button" onclick="preparePost('+json.ID+')">Submit</button><br><br><button type="button" onclick="deleteMe('+json.ID+')">Delete</button></div>';
        document.getElementById('state').value = json.state;
    }
    else {
        document.getElementById('inserter').innerHTML = '<div class="container"><div class="row">' + 
        '<div class="col-lg-4"><label for="comp">Company </label></div><div class="col-lg-8"><input type="text" id="comp" name="comp" maxlength="255" value=""/></div>' +
        '<div class="col-lg-4"><label for="comp">Company Abbreviation</label></div><div class="col-lg-8"><input type="text" id="compAbbrev" name="compAbbrev" maxlength="255" value=""/></div>' +
        '<div class="col-lg-4"><label for="first">First Name </label></div><div class="col-lg-8"><input type="text" id="first" name="first" maxlength="255" value="" required/></div>'+
        '<div class="col-lg-4"><label for="last"> Last Name </label></div><div class="col-lg-8"><input type="text" id="last" name="last" maxlength="255" value="" required/></div>'+
        '<div class="col-lg-4"><label for="relation"> Relationship </label></div><div class="col-lg-8"><input type="text" id="relation" name="relation" maxlength="255" value=""/></div>'+
        '<div class="col-lg-4"><label for="title">Job Title </label></div><div class="col-lg-8"><input type="text" id="title" name="title" maxlength="255" value=""/></div>'+
        '<div class="col-lg-4"><label for="add1">Address </label></div><div class="col-lg-8"><input type="text" id="add1" name="add1" maxlength="255" value=""/></div>'+
        '<div class="col-lg-4"><label for="add2">Second Adddress </label></div><div class="col-lg-8"><input type="text" id="add2" name="add2" maxlength="255" value=""/></div>'+
        '<div class="col-lg-4"><label for="city">City </label></div><div class="col-lg-8"><input type="text" id="city" name="city" maxlength="255" value=""/></div>'+
        '<div class="col-lg-4"><label for="state">State </label></div><div class="col-lg-8"><select name="state" id="state" size="1"><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA" selected="selected">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="DC">Dist of Columbia</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option></select></div>'+
        '<div class="col-lg-4"><label for="zip">Zip </label></div><div class="col-lg-8"><input type="text" id="zip" name="zip" maxlength="20" value=""></div>'+
        '<div class="col-lg-4"><label for="WP">Work Phone </label></div><div class="col-lg-8"><input type="tel" id="WP" name="WP" maxlength="12" value=""></div>'+
        '<div class="col-lg-4"><label for="ext">Work Extension </label></div><div class="col-lg-8"><input type="text" id="ext" name="ext" maxlength="3" value=""></div>'+
        '<div class="col-lg-4"><label for="HP">Home Phone </label></div><div class="col-lg-8"><input type="tel" id="HP" name="HP" value="" maxlength="12"></div>'+
        '<div class="col-lg-4"><label for="cell">Cell </label></div><div class="col-lg-8"><input type="tel" id="cell" name="cell" value="" maxlength="12"></div>'+
        '<div class="col-lg-4"><label for="fax">Fax </label></div><div class="col-lg-8"><input type="tel" id="fax" name="fax" value="" maxlength="12"></div>'+
        '<div class="col-lg-4"><label for="email">Email </label></div><div class="col-lg-8"><input type="email" id="email" name="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" maxlength="75" value=""></div>'+
        '</div></div>'+
        '<div id="submitter"><button type="button" onclick="back()">Back</button><button type="button" onclick="preparePost('+null+')">Submit</button></div>';
    }

    // if(isProject) {
    //     if(json.mailing_list.includes("ouse")) {
    //         document.getElementById("house").checked = true;
    //     }
    //     if(json.mailing_list.includes("mas")) {
    //         document.getElementById("xmas").checked = true;
    //     }
    // }
    window.scrollTo(0,0);

    const workPhoneInput = document.getElementById('WP');
    const homePhoneInput = document.getElementById('HP');
    const cellPhoneInput = document.getElementById('cell');
    const faxInput = document.getElementById('fax');

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

function back() {
    document.getElementById('inserter').innerHTML = state.prevHTML;
    window.scrollTo(0, state.scroller);
}

function preparePost(Id) {
    // Test against required user selections and fields to determine if values are valid.
    if(document.getElementById('first').value.trim() == '' || document.getElementById('last').value.trim() == '') {
        alert("Please fill all required fields, and/or fix invalid fields.");
        return false;
    }

    let i = 0;
    let isDash = false;

    while(i < document.getElementById('zip').value.length) {
        if(isNaN(document.getElementById('zip').value[i])) {
            if(document.getElementById('zip').value[i] == '-' && !isDash) {
                isDash = true;
            }
            else {
                alert('Zip code invalid >:(');
                return false;
            }
        }
        i++;
    }

    // Input tests should've succeeded if we get to this point.

    document.getElementById('submitter').innerHTML = '<p>Submitting</p>';

    // Fill optional inputs.
    let title = (document.getElementById('title').value.trim() != '') ? document.getElementById('title').value.trim():'NULL';
    let addr2 = (document.getElementById('add2').value.trim() != '') ? document.getElementById('add2').value.trim():'NULL';
    let homePhone = (document.getElementById('HP').value.trim() != '') ? document.getElementById('HP').value.trim():'NULL';
    let cell = (document.getElementById('cell').value.trim() != '') ? document.getElementById('cell').value.trim():'NULL';
    let fax = (document.getElementById('fax').value.trim() != '') ? document.getElementById('fax').value.trim():'NULL';
    // if(proj) {
    //     var mailer = (document.getElementById('house').checked)?'Open House':'';
    //     mailer += (document.getElementById('xmas').checked)?((document.getElementById('house').checked)?' || Christmas':'Christmas'):'';
    // }

    let sql = '{"ID":'+Id+
    ',"client_company":"'+ format((document.getElementById('comp').value.trim() == ''?'NULL':document.getElementById('comp').value.trim())) +
    '","client_abbreviation":"'+format((document.getElementById('compAbbrev').value.trim() == ''?'NULL':document.getElementById('compAbbrev').value.trim()))+
    // (Boolean(proj)?'","mailing_list":"'+ mailer:'') +
    '","first_name":"'+ format(document.getElementById('first').value.trim()) +
    '","last_name":"'+ format(document.getElementById('last').value.trim()) +
    '","relationship":"'+ format((document.getElementById('relation').value.trim() == ''?'NULL':document.getElementById('relation').value.trim()))+
    '","job_title":"'+ format(title) +
    '","address1":"'+format((document.getElementById('add1').value.trim() == ''?'NULL':document.getElementById('add1').value.trim()))+
    '","address2":"'+ format(addr2) +
    '","city":"'+format((document.getElementById('city').value.trim() == ''?'NULL':document.getElementById('city').value.trim()))+
    '","state":"'+ format(document.getElementById('state').value) +
    '","zip_code":"'+ format((document.getElementById('zip').value.trim() == ''?'NULL':document.getElementById('zip').value.trim())) +
    '","work_phone":"'+ format((document.getElementById('WP').value.trim() == ''?'NULL':document.getElementById('WP').value.trim())) +
    '","extension":"'+ format((document.getElementById('ext').value.trim() == ''?'NULL':document.getElementById('ext').value.trim())) +
    '","home_phone":"'+ format(homePhone) +
    '","cell":"'+ format(cell) +
    '","fax":"'+ format(fax) +
    '","CreatedBy":"'+ activeUser +
    '","email":"'+ format((document.getElementById('email').value.trim() == ''?'NULL':document.getElementById('email').value.trim())) +'"}';

    const JsonString = JSON.parse(JSON.stringify(sql));
    console.log(JsonString);

    fetch('https://e-hv-ppi.shn-engr.com:3000/contacts', {
        method: 'POST',
        headers: {
            'Accept':'application/json',
            'Content-Type': 'application/json'
        },
        body: JsonString
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);
        if(response.hasOwnProperty("Status")) {
            document.getElementById('submitter').innerHTML = '<p>Submitted! Thanks, '+ activeUser +'.</p><br><button type="button" onclick="location.reload()">Back to Rolodex</button>';
        }
        else {
            document.getElementById('submitter').innerHTML = '<p>Something didn\'t go right. Please contact help.</p><br><button type="button" onclick="back()">Back</button><button type="button" onclick="preparePost('+ Id +')">Submit</button>';
            console.log(response);
        }
    })
    .catch(error => {
        document.getElementById('submitter').innerHTML = '<p>An error ocurred. Please contact help.</p><br><button type="button" onclick="back()">Back</button><button type="button" onclick="preparePost('+ Id +')">Submit</button>';
        console.log(error);
    });
}

function deleteMe(ID) {
    if(confirm("Are you sure you want to delete this entry from the Rolodex?")) {
        fetch("https://"+HOST+".shn-engr.com:3001/deleteRolo", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ID:ID})
        }).then(response => { // Makes a call for employees.
            if(response.status == 200) {
                location.reload();
            }
            else {
                document.getElementById("submitter").innerHTML = '<p>Something went wrong.  Try again or contact help.</p><button type="button" onclick="back()">Back</button><button type="button" onclick="preparePost('+ID+')">Submit</button><br><br><button type="button" onclick="deleteMe('+ID+')">Delete</button>';
            }
        }).catch((error) => {
            console.error(error);
            document.getElementById("submitter").innerHTML = '<p>There seems to be an error on our end.  Please let us know.</p><button type="button" onclick="back()">Back</button><button type="button" onclick="preparePost('+ID+')">Submit</button><br><br><button type="button" onclick="deleteMe('+ID+')">Delete</button>';
        });
    }
}

let currResults = {
    result:null,
    map:new Map()
};

let state = {
    scroller: window.scrollY,
    prevHTML: ''
};