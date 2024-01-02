const HOST = 'e-hv-ppi';

async function starter(res) {
    activeUser = res.account.name;
    const isAdmin = (await verify(res.account.homeAccountId.split('.')[0])).result;
    listWage(isAdmin);
    if(isAdmin) {
        document.getElementById('admins').innerHTML = '<button type="button" onclick="">Add Record</button>';
    }
}

async function verify(id) {
    const response = await fetch('https://'+HOST+'.shn-engr.com:3001/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ID:id})
    });
    return await response.json();
}

function listWage(admin) {
    document.getElementById("results").innerHTML += '<p>Getting Prevailing Wages. Please wait...</p>';
    fetch("https://"+HOST+".shn-engr.com:3001/prevWage", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({isAdmin:admin})
    }).then(response => { // Makes a call for employees.
        const result = response.json();
        return result; // returns to the ".then" statement's data below for processing.
    }).then(data => {
        document.getElementById("results").innerHTML = '<p>Processing...</p>';
        let table = '<tr><th>Project</th><th>Billing Groups</th><th>Office</th>'+(admin?'<th>Display</th><th>Edit</th>':'')+'</tr>';
        for(let json = 0; json < data.length; json++) {
            table += '<tr><td>'+ data[json].project_id + '</td><td>' + (data[json].BillGrp != 'NULL' || data[json].BillGrp != null?data[json].BillGrp:'') + '</td><td>'+
            (data[json].office == 2?'klamath Falls':(data[json].office == 4?'Willits':(data[json].office == 5?'Redding':(data[json].office == 6?'Coos Bay':'Eureka')))) +
            '</td>'+ (admin?('<td>'+(data[json].display || data[json].display == 1?'Yes':'No')+'</td><td><button type="button" onclick="editWage('+ data[json] +')">Edit</button></td>'):'') + '</tr>';

            // if(data[json].BillingGroup != null) {
            //     table += data[json].BillingGroup + (data[json].BillingPrevailingWage?'*':'') +',';
            // }
            // var index = json + 1;
            // var looped = false;
            // while(index < data.length && data[json].Project == data[index].Project) {
            //     looped = true;
            //     if(data[index].BillingGroup != null) {
            //         table += data[index].BillingGroup + (data[index].BillingPrevailingWage?'*':'') + ',';
            //     }
            //     index++;
            // }
            // if(table[table.length - 1] == ',') {
            //     table = table.substring(0,table.length-1);
            // }
            // table += '</td><td>' + (data[json].Office == 2?'Klamath Falls':(data[json].Office == 4?'Willits':(data[json].Office == 5?'Redding':(data[json].Office == 6?'Coos Bay':'Eureka')))) + '</td></tr>';
            // if(looped)
            //     json = index - 1;
        }
        document.getElementById("results").innerHTML = table;
    }).catch(error => { // If we can't connect to our server for whatever reason, we'll write an error mesage into our table.

        document.getElementById("results").innerHTML = 'Oh no! SHN had a connection error!';
        console.error(error);

    });
}

function editWage(json) {
    const table = '<tr><td>Project ID</td><td><input type="text" id="project" maxlength="10" required></td></tr>'+
        '<tr><td>Billing Groups</td><td><input type="text" id="BillGrp" maxlength="255"></td></tr>'+
        '<tr><td>Office</td><td><select name="office" id="office" title="Office Location" required><option value="-1" selected>-Select-</option><option value="0">Eureka</option><option value="1">Arcata</option><option value="2">Klamath Falls</option><option value="4">Willits</option><option value="5">Redding</option><option value="6">Coos Bay</option><option value="9">Corporate</option></select></td></tr>'+
        '<tr><td>Dsiplay</td><td><input type="checkbox" id="display" name="display" title="display" placeholder="display"/></td></tr>';
    document.getElementById("results").innerHTML = table;
    document.getElementById("project").value = json.project_id;
    document.getElementById.apply("office").value = json.office;
    document.getElementById("display").checked = (json.dsiplay == 1?true:false);
}

window.addEventListener("DOMContentLoaded", signIn(), false);