const HOST = 'e-hv-ppi';

function listWage() {
    document.getElementById("result").innerHTML += '<p>Getting Prevailing Wages. Please wait...</p>';
    fetch("https://"+HOST+".shn-engr.com:3001/prevWage").then(response => { // Makes a call for employees.
        console.log(response.json());
        return response.json(); // returns to the ".then" statement's data below for processing.
    }).then(data => {
        document.getElementById("result").innerHTML = '<p>Processing...</p>';
        let table = '<tr><th>Project</th><th>Closed</th><th>Billing Groups</th><th>Office</th></tr>';
        for(let json = 0; json < data.length; index++) {
            table += '<tr><td>'+ data[json].Project + '</td><td>' + (data[json].Closed == true || data[json].Closed == 1?'Yes':'No') + '</td><td>';
            var index = json;
            while(data[json].Project == data[index].Project) {
                if(data[index].BillingGroup != null) {
                    table += data[index].BillingGroup + ',';
                }
                index++;
            }
            table += '</td><td>' + (data[json].Office == 2?'Klamath Falls':(data[json].Office == 4?'Willits':(data[json].Office == 5?'Redding':(data[json].Office == 6?'Coos Bay':'Eureka')))) + '</td></tr>';
        }
        document.getElementById("result").innerHTML = table;
    }).catch(error => { // If we can't connect to our server for whatever reason, we'll write an error mesage into our table.

        document.getElementById("result").innerHTML = 'Oh no! SHN had a connection error!';
        console.error(error);

    });
}