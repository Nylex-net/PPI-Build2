const HOST = 'e-hv-ppi';

function listWage() {
    document.getElementById("results").innerHTML += '<p>Getting Prevailing Wages. Please wait...</p>';
    fetch("https://"+HOST+".shn-engr.com:3001/prevWage").then(response => { // Makes a call for employees.
        const result = response.json();
        return result; // returns to the ".then" statement's data below for processing.
    }).then(data => {
        document.getElementById("results").innerHTML = '<p>Processing...</p>';
        let table = '<tr><th>Project</th><th>Closed</th><th>Billing Groups</th><th>Office</th></tr>';
        for(let json = 0; json < data.length; json++) {
            table += '<tr><td>'+ data[json].Project + (data[json].ProjectPrevailingWage?'*':'') + '</td><td>' + (data[json].ProjectClosed == true || data[json].ProjectClosed == 1?'Yes':'No') + '</td><td>';
            if(data[json].BillingGroup != null) {
                table += data[json].BillingGroup + (data[json].BillingPrevailingWage?'*':'') +',';
            }
            var index = json + 1;
            var looped = false;
            while(index < data.length && data[json].Project == data[index].Project) {
                looped = true;
                if(data[index].BillingGroup != null) {
                    table += data[index].BillingGroup + (data[index].BillingPrevailingWage?'*':'') + ',';
                }
                index++;
            }
            if(table[table.length - 1] == ',') {
                table = table.substring(0,table.length-1);
            }
            table += '</td><td>' + (data[json].Office == 2?'Klamath Falls':(data[json].Office == 4?'Willits':(data[json].Office == 5?'Redding':(data[json].Office == 6?'Coos Bay':'Eureka')))) + '</td></tr>';
            if(looped)
                json = index - 1;
        }
        document.getElementById("results").innerHTML = table;
    }).catch(error => { // If we can't connect to our server for whatever reason, we'll write an error mesage into our table.

        document.getElementById("results").innerHTML = 'Oh no! SHN had a connection error!';
        console.error(error);

    });
}

window.addEventListener("DOMContentLoaded", listWage(), false);