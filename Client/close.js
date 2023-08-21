let midClose = false;
/**
 * Gets open projects from database and formats into table.
 * @returns 
 */

function findProjects() {
    // Let user know it's getting results.
    document.getElementById('results').innerHTML = '<p>Searching...</p>';
    const projectNumber = document.getElementById('proj').value.trim();
    if(projectNumber.length < 3) {
        document.getElementById('results').innerHTML = '<p>C\'mon, be more specific.</p>';
        return;
    }
    // Format JSON to send.
    const jsonString = JSON.parse(JSON.stringify('{"projID":"'+ projectNumber +'"}'));
    // Create HTTP request.
    var xhr = new XMLHttpRequest();
    var url = "https://e-hv-ppi.shn-engr.com:3001/projects";
    xhr.open("POST", url, false);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = function(e) { // If the server returns an error, display an error message to the user.
        document.getElementById('results').innerHTML = 'The server did an oopsie whoopsie UWU';
        console.log(e);
    };
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
            if(json[0].length > 0 && json[1].length > 0) { // JSON Results should at least contain a Projectid Key.
                document.getElementById('results').innerHTML = resultString(json);
            }
            else{ // No JSON results.  We got an empty array instead [].
                document.getElementById('results').innerHTML = 'No Results.';
            }
        }
        else {
            document.getElementById('results').innerHTML = 'The server did an oopsie whoopsie UWU';
        }
    };
    // Try connecting and sending to server.  If error, display "Unable to connect".
    xhr.send(jsonString);  // an error message typically looks like "{process: {…}, exitCode: 0}" in the console.
}

/**
 * Format results into HTML table.
 */

function resultString(json) {
    let result = '<table><tr><th><strong>Project/Promo ID</strong></th><th><strong>Manager</strong></th><th><strong>Title</strong></th><th><strong>Client Company</strong></th><th><strong>Description</strong></th><th></th></tr>';
    for(let entry of json[0]) {
        result += '<tr><td>' + entry.project_id + '</td><td>' + entry.first + " " + entry.last + '</td><td>' + entry.project_title + '</td><td>' + entry.client_company + '</td><td>' + entry.description_service + '</td><td><button type="button" onclick="closeProject('+ entry.ID +', true);">Close</button></td></tr>';
    }
    for(let pros of json[1]) {
        result += '<tr><td>' + pros.promo_id + '</td><td>' + pros.first + " " + pros.last + '</td><td>' + pros.promo_title + '</td><td>' + pros.client_company + '</td><td>' + pros.description_service + '</td><td><button type="button" onclick="closeProject('+ pros.ID +', false);">Close</button></td></tr>';
    }
    result += '</table>';
    return result;
}

let closer;

/**
 * Alerts user if they're sure they want to close a project.
 * If so, the number is sent to the closeMe API on the server,
 * and user will be prompted that the project is now closed.
 * @param {String} ID 
 */
function closeProject(ID) {
    if(confirm("Are you sure you want to close this project?\nProject ID: " + ID)) {
        closer = ID;
        signIn();
    }
}

/**
 * Closes project unless user was logging in via Sign In button.
 * @param {JSON} res 
 * @returns 
 */
function starter(res) {
    const postData = {
        projID: closer,
        ClosedBy: res.account.name
    };
    if (postData.projID == undefined || postData.projID == null || postData.ClosedBy.includes('@')) { // If user logs in but wasn't closing a project.
        return;
    }
    console.log(postData);
    try {
        const response = fetch('https://e-hv-ppi.shn-engr.com:3001/closeMe', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
        },
            body: JSON.stringify(postData)
        }).then(response => {
            if (!response.ok) {
                const message = 'Error with Status Code: ' + response.status;
                document.getElementById('results').innerHTML = message;
                throw new Error(message);
            }
            else {
                document.getElementById('results').innerHTML = "Project "+ postData.projID +" is now closed.";
            }
        });
    }
    catch(err) {
        alert("An error occurred with closing the project.");
        console.log('Error: ' + err);
    }
}